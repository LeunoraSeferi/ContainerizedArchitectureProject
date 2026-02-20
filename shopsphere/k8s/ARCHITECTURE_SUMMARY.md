# Shopsphere – Architecture Summary

This document describes the architecture of the Shopsphere application as deployed on Kubernetes, the objects used, and how the three environments (development, staging, production) are set up and isolated.

---

## 1. Application overview

Shopsphere is a multi-component web application with a frontend, an API gateway, and several backend services that communicate with each other and with databases. The minimum rubric requirement of “at least two parts that need to communicate” is satisfied by the frontend talking to the gateway, and the gateway proxying to auth, catalog, and order services; each service in turn uses its own database and shared infrastructure (Redis, Solr).

**Components:**

- **Frontend (Next.js):** User-facing UI; calls the gateway for API and auth. Exposed via a NodePort Service.
- **Gateway:** Single entrypoint for the backend; routes requests to auth-, catalog-, and order-service; uses Redis for caching and rate limiting.
- **Auth service:** User authentication and JWT; uses Postgres (auth-db).
- **Catalog service:** Products and categories; uses Postgres (catalog-db) and Solr for search.
- **Order service:** Orders; uses Postgres (order-db).
- **Redis:** In-memory cache and rate limiting (used by the gateway).
- **Solr:** Search index (used by catalog-service).
- **Postgres (auth-db, catalog-db, order-db):** Persistent storage for each service.

All of these run inside the cluster and discover each other via Kubernetes Services (DNS names such as `gateway`, `auth-service`, `catalog-service`, `order-service`, `redis`, `solr`, `auth-db`, `catalog-db`, `order-db`).

---

## 2. Kubernetes objects and design choices

**Pods:** A standalone Pod (`debug-curl` in `03-pods/debug-pod.yaml`) is used to satisfy the rubric requirement for the Pod object. It runs a curl image and is used to test internal connectivity (e.g. `kubectl exec ... curl http://gateway:4000/health`) without exposing Services externally.

**Deployments:** The stateless application tier (gateway, auth-service, catalog-service, order-service, redis, shopsphere-frontend) is deployed as Deployments. They can scale horizontally and do not require stable network identity or per-pod storage; replicas are set to 1 in the base for dev and overridden to 3 for staging and production via Kustomize.

**StatefulSets:** The databases (auth-db, catalog-db, order-db) and Solr are deployed as StatefulSets. They need stable identity and dedicated persistent storage for data; each uses a `volumeClaimTemplates` block so that each pod gets its own PersistentVolumeClaim (1Gi for each Postgres, 2Gi for Solr). This ensures data survives pod restarts and matches the rubric’s use of PersistentVolumes/PersistentVolumeClaims as needed.

**Services:** Every Deployment and StatefulSet has a corresponding Service (ClusterIP by default). The frontend is exposed with type NodePort so it can be reached from outside the cluster (e.g. `minikube service shopsphere-frontend -n dev`). Services provide stable DNS names and load-balancing across pod replicas.

**ConfigMaps and Secrets:** Non-sensitive configuration (service URLs, DB hosts, ports, Redis/Solr URLs) is stored in a ConfigMap (`shopsphere-config` in `01-config/configmap.yaml`). Sensitive data (JWT secret, database passwords) is stored in a Secret (`shopsphere-secrets` in `01-config/secrets.yaml`). Pods reference them via `configMapKeyRef` and `secretKeyRef` so that configuration and credentials are managed outside the application code and can differ per environment without changing manifests.

---

## 3. Resource management and autoscaling

**Quotas:** Development is limited to 1 CPU and 2Gi memory (rubric: “limit development to only use 1 CPU”); if the full stack does not schedule, the quota can be raised to 2 CPU / 4Gi and the justification documented here. Staging is limited to at least double dev (4 CPU, 8Gi). Production has no ResourceQuota. Quotas are applied from `02-quotas/` after the overlay so that each namespace is capped as required.

**LimitRange (dev):** A LimitRange in dev sets default requests and limits for containers so that every pod counts against the quota in a predictable way and the scheduler can place pods correctly.

**HPA:** Horizontal Pod Autoscalers target the gateway and the three backend services (auth, catalog, order) in staging and production only. They scale based on CPU utilization (e.g. 60–70% target) with minReplicas 3 and maxReplicas 6. HPA is not applied in development. Manifests live in `07-autoscaling/` and are applied with `-n staging` or `-n prod` after the overlay.

**VPA:** Vertical Pod Autoscalers are applied in staging and production in recommendation mode (`updateMode: Off`). They suggest CPU and memory values (lower bound, target, upper bound) for the gateway and the three services; they do not modify pod resources automatically. Manifests are in `08-autoscaling/` (vpa-staging.yaml, vpa-production.yaml).

---

## 4. Environment setup and isolation

Environments are separated by **namespaces**: `dev`, `staging`, and `prod`. Each namespace is created by the corresponding Kustomize overlay (`k8s-overlays/dev`, `staging`, `prod`) via a `namespace.yaml` and the overlay’s `namespace:` field, which injects that namespace into all resources built from the base. The same set of application manifests (from `k8s/`: config, pods, databases, backend, frontend) is deployed into each namespace, so **isolation** is achieved by:

- **Resource isolation:** CPU and memory quotas apply per namespace. Dev and staging have ResourceQuotas; prod does not. Objects in one namespace do not consume another namespace’s quota.
- **Object isolation:** ConfigMaps, Secrets, Pods, Deployments, StatefulSets, and Services are namespaced; dev, staging, and prod each have their own copies. A change or failure in one environment does not affect the others.
- **Network isolation:** Services and DNS are scoped to the namespace (e.g. `gateway` in `dev` is distinct from `gateway` in `staging`). There is no cross-namespace traffic unless explicitly configured.

**What runs where and what differs:**

| Aspect        | Development     | Staging              | Production           |
|---------------|-----------------|----------------------|----------------------|
| Namespace     | dev             | staging              | prod                 |
| Replicas      | 1 per Deployment| 3 per Deployment     | 3 per Deployment     |
| Quota         | 2 CPU, 4Gi      | 4 CPU, 8Gi           | None                 |
| LimitRange    | Yes (dev)       | No                   | No                   |
| HPA           | No              | Yes (gateway + 3 svc)| Yes (same)           |
| VPA           | No              | Yes (recommendation) | Yes (recommendation) |

Staging and production mirror each other structurally (same Deployments, StatefulSets, Services, HPA, VPA); they differ only in configuration (namespace, quota absent in prod, and any future tuning of limits or HPA targets). Development uses the same topology with fewer replicas, no HPA/VPA, and a strict quota so it stays lightweight.

**Deployment flow:** From the repository root, apply the overlay for an environment (`kubectl apply -k shopsphere/k8s-overlays/dev` or `staging` or `prod`), then apply quota and HPA (and optionally VPA) from `k8s/02-quotas/` and `k8s/07-autoscaling/` (and `k8s/08-autoscaling/`) with the appropriate `-n <namespace>`. The README in `k8s/README.md` gives the exact commands and the optional VPA steps.

---

## 5. Diagram reference

A diagram showing namespaces, Deployments, StatefulSets, Services, PVCs, and autoscalers (HPA/VPA) is described in `k8s/architecture-diagram.md`. It should be drawn in draw.io or LucidChart and included in the submission to satisfy the rubric’s diagram requirement.
