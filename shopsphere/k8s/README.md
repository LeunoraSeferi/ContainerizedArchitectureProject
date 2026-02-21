# Shopsphere – Kubernetes Deployment (Final Runbook)

This README describes how to deploy and verify the Shopsphere application on Kubernetes (Minikube). It is the main runbook for graders and for reproducing the three environments (dev, staging, prod).

---

## Submission 

- **YAML:** All manifests used to generate the environments are under `shopsphere/k8s/` and `shopsphere/k8s-overlays/`. Prefer submitting a GitHub repository link; alternatively upload the contents of `shopsphere/k8s/` and `shopsphere/k8s-overlays/`.
- **Images:** There are no pre-published images. Use **Section 2** (build + load into Minikube) or push images to Docker Hub and update `image:` in the manifests (see **Section 2 – Option B**).
- **Diagram:** A diagram showing all components and their relationships (Deployments, Services, StatefulSets, Volumes, Autoscalers) is provided as `k8s/architecture-diagram.drawio` (open in draw.io). Export to PNG if required; the diagram may also be saved as `k8s/architecture-diagram.drawio.png`.
- **Architecture summary:** Submit the required two-page summary describing the architecture and how the three environments are set up and isolated (see assignment instructions).

---

## 1. Prerequisites

- **kubectl** installed and on your PATH.
- **Minikube** (or another Kubernetes cluster). Example: `minikube start`.
- **Metrics Server** (required for HPA in staging/prod):
  ```bash
  minikube addons enable metrics-server
  ```
- **VPA (optional):** To apply VPA manifests in staging/prod, install the VPA CRD and controller first (see **Section 6 – Troubleshooting**). If not installed, do not apply files in `08-autoscaling/`.

**Important:** Run all commands from the **repository root** (the directory that contains `shopsphere/` and `shopsphere-frontend/`). Paths in this document are relative to that root.

---

## 2. Image workflow (build and load, or Docker Hub)

The application uses five custom images: frontend, gateway, auth-service, catalog-service, order-service. Postgres, Redis, and Solr use public images and do not need to be built.

**From the repository root:**

```bash
# Build
docker build -t shopsphere-frontend:latest    -f shopsphere-frontend/Dockerfile shopsphere-frontend
docker build -t shopsphere-gateway:latest      -f shopsphere/gateway/Dockerfile shopsphere/gateway
docker build -t shopsphere-auth-service:latest    -f shopsphere/services/auth-service/Dockerfile shopsphere/services/auth-service
docker build -t shopsphere-catalog-service:latest -f shopsphere/services/catalog-service/Dockerfile shopsphere/services/catalog-service
docker build -t shopsphere-order-service:latest   -f shopsphere/services/order-service/Dockerfile shopsphere/services/order-service

# Load into Minikube
minikube image load shopsphere-frontend:latest
minikube image load shopsphere-gateway:latest
minikube image load shopsphere-auth-service:latest
minikube image load shopsphere-catalog-service:latest
minikube image load shopsphere-order-service:latest
```

**Option B – Docker Hub:** Tag and push the five images to your Docker Hub account, then in `k8s/05-backend/` and `k8s/06-frontend/` set each Deployment’s `image:` to `YOUR_DOCKERHUB_USER/shopsphere-<name>:latest`. The cluster will pull them when the namespace is applied (ensure the cluster can pull from Docker Hub).

---

## 3. Deploy with Kustomize (recommended)

All YAML lives in `k8s/`. Overlays in `k8s-overlays/` add namespace and replicas only. After applying an overlay, apply quota (and optionally LimitRange, HPA, VPA) from `k8s/` with the correct `-n <namespace>`.

### Dev (1 replica, quota 1 CPU / 2Gi, no HPA, no VPA)

```bash
kubectl apply -k shopsphere/k8s-overlays/dev
kubectl apply -n dev -f shopsphere/k8s/02-quotas/quota-dev.yaml -f shopsphere/k8s/02-quotas/limitrange-dev.yaml
```

### Staging (3 replicas, quota 4 CPU / 8Gi, HPA, optional VPA)

```bash
kubectl apply -k shopsphere/k8s-overlays/staging
kubectl apply -n staging -f shopsphere/k8s/02-quotas/quota-staging.yaml
kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/
# Optional, if VPA is installed:
kubectl apply -n staging -f shopsphere/k8s/08-autoscaling/vpa-staging.yaml
```

### Prod (3 replicas, no quota, HPA, optional VPA)

```bash
kubectl apply -k shopsphere/k8s-overlays/prod
kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/
# Optional, if VPA is installed:
kubectl apply -n prod -f shopsphere/k8s/08-autoscaling/vpa-production.yaml
```

**Layout:**

- **`shopsphere/k8s/`** – Base: `01-config/`, `02-quotas/`, `03-pods/`, `04-databases/`, `05-backend/`, `06-frontend/`, `07-autoscaling/`, `08-autoscaling/`, `kustomization.yaml`. Diagram: `architecture-diagram.drawio` (and optionally `.png`).
- **`shopsphere/k8s-overlays/`** – One folder per env (`dev`, `staging`, `prod`). Each has `kustomization.yaml` and `namespace.yaml` and references `../../k8s`. Staging and prod set **replicas=3** for all six Deployments.

Ensure images are built and loaded (Section 2) before applying. For staging/prod, enable metrics-server so HPA can read CPU metrics.

---

## 4. Verification (run before submission)

Run these from the repository root. Replace `<ns>` with `dev`, `staging`, or `prod` as applicable.

**Namespaces:**
```bash
kubectl get ns
# Expect: dev, staging, prod
```

**Dev quota (1 CPU, 2Gi):**
```bash
kubectl describe resourcequota dev-quota -n dev
# Hard: limits.cpu "1", limits.memory 2Gi. Used must be ≤ Hard.
```

**Staging quota (4 CPU, 8Gi):**
```bash
kubectl describe resourcequota staging-quota -n staging
# Hard: limits.cpu "4", limits.memory 8Gi.
```

**Prod has no quota:**
```bash
kubectl get resourcequota -n prod
# Should be empty (no ResourceQuota objects).
```

**Pods and Deployments:**
```bash
kubectl get pods -n dev
kubectl get deployments -n dev
# Dev: 1 replica per Deployment. All pods should reach Running (or debug-curl Completed if restartPolicy: Never).
kubectl get deployments -n staging
kubectl get deployments -n prod
# Staging and prod: 3 replicas per Deployment (gateway, auth-service, catalog-service, order-service, redis, shopsphere-frontend).
```

**HPA (staging and prod only):**
```bash
kubectl get hpa -n staging
kubectl get hpa -n prod
# Expect four HPAs: gateway, auth-service, catalog-service, order-service. After metrics-server is ready, current CPU % should not be "unknown".
# Dev must have no HPA: kubectl get hpa -n dev  → no resources.
```

**VPA – recommendation mode (if VPA is applied):**
```bash
kubectl get vpa -n staging
kubectl describe vpa gateway-vpa -n staging
# Must show updatePolicy.updateMode: Off (recommendation only). Recommendation block may appear after the recommender runs.
```

**PVCs (Bound):**
```bash
kubectl get pvc -n dev
# Expect PVCs for auth-db, catalog-db, order-db, solr; status Bound.
```

**Inter-service communication (from debug-curl pod):**
```bash
kubectl exec -it debug-curl -n dev -- curl -s http://gateway:4000/health
# Expect HTTP 200 or a healthy JSON response.
```

**Frontend in browser:**
```bash
minikube service shopsphere-frontend -n dev
# Open the URL; frontend → gateway → services flow should work.
```

---

## 5. Accessing the app and debug pod

**Open frontend (dev):**
```bash
minikube service shopsphere-frontend -n dev
```

**Use debug-curl pod (applied with the overlay):**
```bash
kubectl exec -it debug-curl -n dev -- curl -s http://gateway:4000/health
kubectl exec -it debug-curl -n dev -- curl -s http://auth-service:3001/health
kubectl exec -it debug-curl -n dev -- curl -s http://catalog-service:3002/health
kubectl exec -it debug-curl -n dev -- curl -s http://order-service:3003/health
```

---

## 6. Troubleshooting

**ImagePullBackOff:** Build and load the five app images (Section 2), or use Docker Hub and set `image:` in the manifests. Image names in YAML must match (e.g. `shopsphere-gateway:latest`).

**VPA apply fails – "no matches for kind VerticalPodAutoscaler":** Install the VPA CRD and controller, or do not apply any files in `08-autoscaling/`. The app runs without VPA.

**HPA shows "unknown" for current metrics:** Enable metrics-server: `minikube addons enable metrics-server`. Wait one to two minutes, then check `kubectl get hpa -n staging` again.

**Pods Pending in dev (quota exceeded):** Run `kubectl describe resourcequota dev-quota -n dev`. If Used exceeds Hard, the total container limits in dev exceed 1 CPU or 2Gi. All manifests in `k8s/` are already sized to fit; do not add extra replicas or higher limits in dev without adjusting the quota or limits.

**PVCs stuck Pending:** Ensure the cluster has a default StorageClass (`kubectl get storageclass`). The manifests do not set `storageClassName`, so the default is used. Create or set a default StorageClass if none exists.

**CrashLoopBackOff:** Check `kubectl logs -n <ns> deployment/<name>` (or the failing pod). Ensure ConfigMap `shopsphere-config` and Secret `shopsphere-secrets` exist in the namespace and that keys match the env references in the manifests.

---

## 7. Manual apply (without Kustomize)

If you do not use Kustomize, create namespaces, then apply resources in order. **Do not apply HPA or VPA in dev.** For staging and prod you must scale Deployments to 3 replicas (e.g. `kubectl scale deployment gateway -n staging --replicas=3` for each) or apply the same manifests and then scale.

**Namespaces (once):**
```bash
kubectl apply -f shopsphere/k8s/00-namespaces.yaml
```

**Dev:** Apply config, quota, limitrange, then databases, backend, frontend, then debug pod (see base `k8s/kustomization.yaml` for order). Do not apply `07-autoscaling/` or `08-autoscaling/` in dev.

**Staging:** Apply config, quota-staging, databases, backend, frontend, then all of `07-autoscaling/`, then optionally `08-autoscaling/vpa-staging.yaml`. Scale each of the six Deployments to 3 replicas if using base YAML (replicas=1).

**Prod:** Same as staging but omit quota; apply `07-autoscaling/` and optionally `08-autoscaling/vpa-production.yaml`; scale to 3 replicas if needed.

---

## 8. Presentation checklist

- Show the architecture diagram (all components and relationships).
- Show `kubectl get ns` and `kubectl get deployments -n dev` and `-n staging` (replicas 1 vs 3).
- Show `kubectl describe resourcequota dev-quota -n dev` (1 CPU, 2Gi) and `kubectl get resourcequota -n prod` (empty).
- Show `kubectl get hpa -n staging` (and current metrics when metrics-server is on).
- Show `kubectl get vpa -n staging` and `kubectl describe vpa gateway-vpa -n staging` (updateMode: Off).
- Show `kubectl get pvc -n dev` (Bound).
- Demo: browser on frontend and/or `kubectl exec ... curl http://gateway:4000/health` from debug-curl.

**Screenshots to prepare:** Diagram; `kubectl get ns`; `kubectl get pods -n dev` (all Running); `kubectl describe resourcequota dev-quota -n dev`; `kubectl get hpa -n staging`; `kubectl get vpa -n staging` (and describe for recommendation mode); `kubectl get pvc -n dev`; browser with frontend loaded.
