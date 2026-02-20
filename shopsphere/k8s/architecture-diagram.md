# Architecture diagram – instructions for draw.io / LucidChart

Use this document to draw the diagram required by the rubric (“all components and their relationships: Deployments, Services, StatefulSets, Volumes, Autoscalers”). You can use draw.io, LucidChart, or any similar tool.

---

## 1. Overall layout

- Draw **three columns** (or three swimlanes) for the three namespaces: **dev**, **staging**, **prod**.
- Inside each column, show the **same topology** (same component types). Use a single detailed column (e.g. **dev** or **staging**) as the main diagram; add a short note that “staging and prod mirror this with replicas=3, HPA, VPA; prod has no quota.”

Alternatively, draw **one** architecture (e.g. staging) in full detail and add a small summary box: “Environments: dev (1 replica, quota 1 CPU, no HPA/VPA) | staging (3 replicas, quota 4 CPU, HPA+VPA) | prod (3 replicas, no quota, HPA+VPA).”

---

## 2. Components to include (with labels)

### Namespaces
- **Label:** `Namespace: dev` (and optionally `staging`, `prod` if you draw all three).
- **Purpose:** Show that workloads run inside a namespace.

### Deployments (rectangles or “Deployment” boxes)
| Name | Label on diagram | Notes |
|------|------------------|--------|
| shopsphere-frontend | **Deployment: shopsphere-frontend** | Next.js UI; talks to gateway |
| gateway | **Deployment: gateway** | API gateway; entrypoint for backend |
| auth-service | **Deployment: auth-service** | Auth + JWT |
| catalog-service | **Deployment: catalog-service** | Products, categories, search |
| order-service | **Deployment: order-service** | Orders |
| redis | **Deployment: redis** | Cache / rate limit |

### StatefulSets (distinct shape or “StatefulSet” boxes)
| Name | Label on diagram | Notes |
|------|------------------|--------|
| auth-db | **StatefulSet: auth-db** | Postgres for auth |
| catalog-db | **StatefulSet: catalog-db** | Postgres for catalog |
| order-db | **StatefulSet: order-db** | Postgres for orders |
| solr | **StatefulSet: solr** | Search index |

### Pods (optional but rubric asks for Pods)
- **Label:** **Pod: debug-curl** (standalone, for testing).
- **Relationship:** Same namespace; can call Services (e.g. gateway).

### Services (show as “Service” or link labels)
| Service name | Type | Serves |
|--------------|------|--------|
| shopsphere-frontend | NodePort | Deployment: shopsphere-frontend |
| gateway | ClusterIP | Deployment: gateway |
| auth-service | ClusterIP | Deployment: auth-service |
| catalog-service | ClusterIP | Deployment: catalog-service |
| order-service | ClusterIP | Deployment: order-service |
| redis | ClusterIP | Deployment: redis |
| auth-db | ClusterIP | StatefulSet: auth-db |
| catalog-db | ClusterIP | StatefulSet: catalog-db |
| order-db | ClusterIP | StatefulSet: order-db |
| solr | ClusterIP | StatefulSet: solr |

**Label on diagram:** Either draw a “Service” node per workload (e.g. “Service: gateway”) or write the Service name on the edge (e.g. “gateway:4000”).

### PersistentVolumes / PersistentVolumeClaims
- **Label:** **PVC** (or “Volume”) next to each StatefulSet that uses one.
- **auth-db:** PVC `auth-db-data` (1Gi).
- **catalog-db:** PVC `catalog-db-data` (1Gi).
- **order-db:** PVC `order-db-data` (1Gi).
- **solr:** PVC `solr-data` (2Gi).

**Relationship:** Arrow or attachment from “StatefulSet: auth-db” to “PVC: auth-db-data (1Gi)” (and same for the others).

### ConfigMap and Secret
- **Labels:** **ConfigMap: shopsphere-config**, **Secret: shopsphere-secrets**.
- **Relationship:** Arrows from ConfigMap/Secret to the Deployments and StatefulSets that use them (gateway, auth-service, catalog-service, order-service, auth-db, catalog-db, order-db).

### Horizontal Pod Autoscaler (HPA)
- **Labels:** **HPA: gateway-hpa**, **HPA: auth-service-hpa**, **HPA: catalog-service-hpa**, **HPA: order-service-hpa**.
- **Relationship:** Arrow from each HPA to its target Deployment (e.g. “gateway-hpa” → “Deployment: gateway”). Add note “minReplicas: 3, CPU-based” (staging/prod only).

### Vertical Pod Autoscaler (VPA)
- **Labels:** **VPA: gateway-vpa**, **VPA: auth-service-vpa**, **VPA: catalog-service-vpa**, **VPA: order-service-vpa**.
- **Relationship:** Arrow from each VPA to its target Deployment. Add note “Recommendation mode (Off)” (staging/prod only).

---

## 3. Traffic / relationship arrows

- **User / Browser** → **Service: shopsphere-frontend (NodePort)** → **Deployment: shopsphere-frontend**.
- **Deployment: shopsphere-frontend** → **Service: gateway** → **Deployment: gateway**.
- **Deployment: gateway** → **Service: auth-service**, **Service: catalog-service**, **Service: order-service**, **Service: redis**.
- **Deployment: auth-service** → **Service: auth-db** → **StatefulSet: auth-db**.
- **Deployment: catalog-service** → **Service: catalog-db**, **Service: solr** → **StatefulSet: catalog-db**, **StatefulSet: solr**.
- **Deployment: order-service** → **Service: order-db** → **StatefulSet: order-db**.
- **Pod: debug-curl** → **Service: gateway** (optional; for “Pods” and testing).

---

## 4. Checklist before submission

- [ ] All four object types appear: **Pods**, **Deployments**, **StatefulSets**, **Services**.
- [ ] **Volumes** (PVCs) are shown for auth-db, catalog-db, order-db, solr.
- [ ] **ConfigMap** and **Secret** are shown and linked to workloads.
- [ ] **HPA** and **VPA** are shown and linked to their target Deployments (can be in a “staging/prod” callout if you draw one env in detail).
- [ ] Either three namespaces (dev / staging / prod) or one namespace plus a short “environment” summary is clear.
- [ ] Diagram file is exported (PNG or PDF) and submitted, or the draw.io/LucidChart file is linked or attached.

---

## 5. Export and reference

- Save the diagram as e.g. `architecture-diagram.png` or `architecture-diagram.pdf` in `k8s/`, or keep the draw.io XML in the repo.
- In your report or ARCHITECTURE_SUMMARY, reference it: “See `k8s/architecture-diagram.png` (or `architecture-diagram.md` for these instructions).”
