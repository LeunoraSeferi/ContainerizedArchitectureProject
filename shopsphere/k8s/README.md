# Shopsphere – Kubernetes deployment runbook

This document tells you how to run the Shopsphere app on Minikube from the YAML in this repo. Use it to reproduce the environment (dev / staging / prod) and test the application.

---

## 1. Prerequisites

- **kubectl** installed and on your PATH.
- **Minikube** (or Docker Desktop with Kubernetes). Example: `minikube start`.
- **Metrics Server** (required for HPA in staging/prod):
  ```bash
  minikube addons enable metrics-server
  ```
- **Optional – VPA (Vertical Pod Autoscaler):**  
  If you want to apply the VPA YAML in staging/prod, install the VPA CRD and controller first (see [Troubleshooting](#6-troubleshooting)). If not, skip all files in `08-autoscaling/`.

**Repository layout:** Assume you are at the **repository root** (the directory that contains `shopsphere/` and `shopsphere-frontend/`). All paths below are relative to that root.

---

## 2. Image workflow (build + load into Minikube)

The app uses custom images for the frontend, gateway, and backend services. There are no pre-published images; you must build and load them.

From the **repository root** run:

```bash
# Build all app images (adjust path if your repo root is different)
docker build -t shopsphere-frontend:latest    -f shopsphere-frontend/Dockerfile shopsphere-frontend
docker build -t shopsphere-gateway:latest     -f shopsphere/gateway/Dockerfile shopsphere/gateway
docker build -t shopsphere-auth-service:latest    -f shopsphere/services/auth-service/Dockerfile shopsphere/services/auth-service
docker build -t shopsphere-catalog-service:latest -f shopsphere/services/catalog-service/Dockerfile shopsphere/services/catalog-service
docker build -t shopsphere-order-service:latest  -f shopsphere/services/order-service/Dockerfile shopsphere/services/order-service

# Load them into Minikube so the cluster can use them
minikube image load shopsphere-frontend:latest
minikube image load shopsphere-gateway:latest
minikube image load shopsphere-auth-service:latest
minikube image load shopsphere-catalog-service:latest
minikube image load shopsphere-order-service:latest
```

Public images (postgres, redis, solr) are pulled by the cluster; no need to build or load them.

### Image delivery (for grader / submission)

The assignment requires a way for the professor to get the images used by the application. You can use either option below.

**Option A – Build from repo and load into Minikube (no Docker Hub):**  
Clone the repo, then from the **repository root** run the build and load commands in Section 2 above. The manifests use `imagePullPolicy: IfNotPresent` and image names like `shopsphere-gateway:latest`; after `minikube image load ...`, the cluster will use the local images. No registry needed.

**Option B – Push to Docker Hub and pull:**  
1. Tag and push (replace `YOUR_DOCKERHUB_USER` with your username):
   ```bash
   docker tag shopsphere-frontend:latest YOUR_DOCKERHUB_USER/shopsphere-frontend:latest
   docker tag shopsphere-gateway:latest YOUR_DOCKERHUB_USER/shopsphere-gateway:latest
   docker tag shopsphere-auth-service:latest YOUR_DOCKERHUB_USER/shopsphere-auth-service:latest
   docker tag shopsphere-catalog-service:latest YOUR_DOCKERHUB_USER/shopsphere-catalog-service:latest
   docker tag shopsphere-order-service:latest YOUR_DOCKERHUB_USER/shopsphere-order-service:latest
   docker push YOUR_DOCKERHUB_USER/shopsphere-frontend:latest
   docker push YOUR_DOCKERHUB_USER/shopsphere-gateway:latest
   docker push YOUR_DOCKERHUB_USER/shopsphere-auth-service:latest
   docker push YOUR_DOCKERHUB_USER/shopsphere-catalog-service:latest
   docker push YOUR_DOCKERHUB_USER/shopsphere-order-service:latest
   ```
2. In the Deployment manifests under `k8s/05-backend/` and `k8s/06-frontend/`, change the `image:` field to `YOUR_DOCKERHUB_USER/shopsphere-<name>:latest` for each app image. Then the professor can run `kubectl apply -k ...` and the cluster will pull from Docker Hub (with valid credentials / public images).

---

## 3. Deploy with Kustomize (overlay + quota/HPA from k8s/)

From the **repository root**. All YAML lives in `k8s/` only; overlays add namespace + replicas. Apply the overlay, then quota and HPA from `k8s/02-quotas` and `k8s/07-autoscaling` with `-n <namespace>`.

**Dev (no HPA):**
```bash
kubectl apply -k shopsphere/k8s-overlays/dev
kubectl apply -n dev -f shopsphere/k8s/02-quotas/quota-dev.yaml -f shopsphere/k8s/02-quotas/limitrange-dev.yaml
```

**Staging (replicas=3 + quota + HPA):**
```bash
kubectl apply -k shopsphere/k8s-overlays/staging
kubectl apply -n staging -f shopsphere/k8s/02-quotas/quota-staging.yaml
kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/
```

**Prod (replicas=3 + HPA, no quota):**
```bash
kubectl apply -k shopsphere/k8s-overlays/prod
kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/
```

**Optional – VPA (recommendation mode, staging/prod):**  
If the VPA CRD and controller are installed on your cluster, apply the VPA manifests after the overlay and HPA:

```bash
# Staging
kubectl apply -n staging -f shopsphere/k8s/08-autoscaling/vpa-staging.yaml

# Prod
kubectl apply -n prod -f shopsphere/k8s/08-autoscaling/vpa-production.yaml
```

Then check recommendations: `kubectl get vpa -n staging` and `kubectl describe vpa gateway-vpa -n staging`. VPA is in recommendation-only mode (`updateMode: Off`); it does not change pod resources automatically.

**Layout:**

- **`shopsphere/k8s/`** – Single source: `01-config/`, `02-quotas/`, `03-pods/`, `04-databases/`, `05-backend/`, `06-frontend/`, `07-autoscaling/`, `08-autoscaling/`. No duplicate YAML elsewhere.
- **`shopsphere/k8s-overlays/`** – Only `kustomization.yaml` + `namespace.yaml` per env; references `../../k8s`. Staging/prod set **replicas=3** for all Deployments. Quota and HPA are applied from `k8s/` with `-n` (above).

Ensure images are built and loaded (Section 2) before applying. For staging/prod, enable metrics-server so HPA can scale.

---

## 4. Apply manually (alternative)

If you prefer not to use Kustomize, run the following from the **repository root** per namespace. Do **not** apply HPA or VPA in **dev**.

### 4.1 Create namespaces (once)

```bash
kubectl apply -f shopsphere/k8s/00-namespaces.yaml
```

### 4.2 Development (`dev`) – no HPA, no VPA

```bash
# Config and quotas
kubectl apply -n dev -f shopsphere/k8s/01-config/configmap.yaml
kubectl apply -n dev -f shopsphere/k8s/01-config/secrets.yaml
kubectl apply -n dev -f shopsphere/k8s/02-quotas/quota-dev.yaml
kubectl apply -n dev -f shopsphere/k8s/02-quotas/limitrange-dev.yaml

# Databases (StatefulSets + Services)
kubectl apply -n dev -f shopsphere/k8s/04-databases/auth-db.yaml
kubectl apply -n dev -f shopsphere/k8s/04-databases/catalog-db.yaml
kubectl apply -n dev -f shopsphere/k8s/04-databases/order-db.yaml

# Backend (Deployments + Services)
kubectl apply -n dev -f shopsphere/k8s/05-backend/redis.yaml
kubectl apply -n dev -f shopsphere/k8s/05-backend/solr.yaml
kubectl apply -n dev -f shopsphere/k8s/05-backend/gateway.yaml
kubectl apply -n dev -f shopsphere/k8s/05-backend/auth-service.yaml
kubectl apply -n dev -f shopsphere/k8s/05-backend/catalog-service.yaml
kubectl apply -n dev -f shopsphere/k8s/05-backend/order-service.yaml

# Frontend
kubectl apply -n dev -f shopsphere/k8s/06-frontend/shopsphere-frontend.yaml

# Optional: standalone Pod for testing (rubric "Pods" object)
kubectl apply -n dev -f shopsphere/k8s/03-pods/debug-pod.yaml

# Do NOT apply anything from 07-autoscaling/ or 08-autoscaling/ in dev.
```

### 4.3 Staging (`staging`) – with HPA, optional VPA

```bash
# Config and quota (no LimitRange for staging)
kubectl apply -n staging -f shopsphere/k8s/01-config/configmap.yaml
kubectl apply -n staging -f shopsphere/k8s/01-config/secrets.yaml
kubectl apply -n staging -f shopsphere/k8s/02-quotas/quota-staging.yaml

# Databases
kubectl apply -n staging -f shopsphere/k8s/04-databases/auth-db.yaml
kubectl apply -n staging -f shopsphere/k8s/04-databases/catalog-db.yaml
kubectl apply -n staging -f shopsphere/k8s/04-databases/order-db.yaml

# Backend
kubectl apply -n staging -f shopsphere/k8s/05-backend/redis.yaml
kubectl apply -n staging -f shopsphere/k8s/05-backend/solr.yaml
kubectl apply -n staging -f shopsphere/k8s/05-backend/gateway.yaml
kubectl apply -n staging -f shopsphere/k8s/05-backend/auth-service.yaml
kubectl apply -n staging -f shopsphere/k8s/05-backend/catalog-service.yaml
kubectl apply -n staging -f shopsphere/k8s/05-backend/order-service.yaml

# Frontend
kubectl apply -n staging -f shopsphere/k8s/06-frontend/shopsphere-frontend.yaml

# HPA (required for staging)
kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/hpa-gateway.yaml
kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/hpa-auth-service.yaml
kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/hpa-catalog-service.yaml
kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/hpa-order-service.yaml

# Optional: debug pod for testing
kubectl apply -n staging -f shopsphere/k8s/03-pods/debug-pod.yaml

# VPA (optional – only if VPA is installed on the cluster)
# kubectl apply -n staging -f shopsphere/k8s/08-autoscaling/vpa-staging.yaml
```

### 4.4 Production (`prod`) – with HPA, no quota, optional VPA

```bash
# Config only (no quota for prod)
kubectl apply -n prod -f shopsphere/k8s/01-config/configmap.yaml
kubectl apply -n prod -f shopsphere/k8s/01-config/secrets.yaml

# Databases
kubectl apply -n prod -f shopsphere/k8s/04-databases/auth-db.yaml
kubectl apply -n prod -f shopsphere/k8s/04-databases/catalog-db.yaml
kubectl apply -n prod -f shopsphere/k8s/04-databases/order-db.yaml

# Backend
kubectl apply -n prod -f shopsphere/k8s/05-backend/redis.yaml
kubectl apply -n prod -f shopsphere/k8s/05-backend/solr.yaml
kubectl apply -n prod -f shopsphere/k8s/05-backend/gateway.yaml
kubectl apply -n prod -f shopsphere/k8s/05-backend/auth-service.yaml
kubectl apply -n prod -f shopsphere/k8s/05-backend/catalog-service.yaml
kubectl apply -n prod -f shopsphere/k8s/05-backend/order-service.yaml

# Frontend
kubectl apply -n prod -f shopsphere/k8s/06-frontend/shopsphere-frontend.yaml

# HPA
kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/hpa-gateway.yaml
kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/hpa-auth-service.yaml
kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/hpa-catalog-service.yaml
kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/hpa-order-service.yaml

# Optional: debug pod for testing
kubectl apply -n prod -f shopsphere/k8s/03-pods/debug-pod.yaml

# VPA (optional)
# kubectl apply -n prod -f shopsphere/k8s/08-autoscaling/vpa-production.yaml
```

---

## 5. Accessing the app and quick tests

### Standalone Pod (debug-curl) – testing internal services

The rubric requires using a **Pod** object. We provide a standalone Pod `debug-curl` (see `shopsphere/k8s/03-pods/debug-pod.yaml`) that runs a curl image so you can test internal Services from inside the cluster.

**Apply** (to the namespace you use for testing, e.g. dev):

```bash
kubectl apply -n dev -f shopsphere/k8s/03-pods/debug-pod.yaml
```

**Wait until the pod is Ready** (required before `kubectl exec`; otherwise you get "container not found"):

```bash
kubectl wait --for=condition=Ready pod/debug-curl -n dev --timeout=60s
# Or poll: kubectl get pod debug-curl -n dev   (wait until READY shows 1/1)
```

**Use it to curl internal services** (gateway, auth, catalog, order are ClusterIP; from inside the cluster use the Service name and port). Each service exposes `/health` (expect **200**):

```bash
# Gateway (port 4000)
kubectl exec -it debug-curl -n dev -- curl -s -o /dev/null -w "%{http_code}\n" http://gateway:4000/health

# Auth service (port 3001)
kubectl exec -it debug-curl -n dev -- curl -s -o /dev/null -w "%{http_code}\n" http://auth-service:3001/health

# Catalog service (port 3002)
kubectl exec -it debug-curl -n dev -- curl -s -o /dev/null -w "%{http_code}\n" http://catalog-service:3002/health

# Order service (port 3003)
kubectl exec -it debug-curl -n dev -- curl -s -o /dev/null -w "%{http_code}\n" http://order-service:3003/health
```

Replace `dev` with `staging` or `prod` if you applied the pod there. To see the response body (e.g. `{"status":"ok","service":"catalog-service"}`), use e.g. `curl -s http://gateway:4000/health` without the `-o /dev/null -w` flags.

### Open the app in the browser (dev)

```bash
minikube service shopsphere-frontend -n dev
```

Use the URL that opens (or the one printed in the terminal). The frontend talks to the gateway inside the cluster.

### Quick API check (gateway in dev)

```bash
# Get gateway ClusterIP (or use port-forward)
kubectl get svc gateway -n dev

# Port-forward and curl (run in a separate terminal if you keep it open)
kubectl port-forward -n dev svc/gateway 4000:4000
# Then: curl -s http://localhost:4000/health  (or the health path your gateway exposes)
```

### Verify workloads (dev)

```bash
kubectl get pods -n dev
kubectl get svc -n dev
```

All pods should be `Running` and `Ready` (e.g. `1/1`) once DBs and services have started. If any pod is `ImagePullBackOff`, see [Troubleshooting](#6-troubleshooting).

---

## 6. Troubleshooting

### ImagePullBackOff / ErrImagePull

- **Cause:** The cluster cannot pull the image (e.g. custom images only exist locally).
- **Fix:** Build the images and load them into Minikube (see [Section 2](#2-image-workflow-build--load-into-minikube)). Use the same image names and tags as in the YAML (`shopsphere-frontend:latest`, `shopsphere-gateway:latest`, etc.).

### VPA: "no matches for kind VerticalPodAutoscaler"

- **Cause:** The VPA CRD and controller are not installed.
- **Fix:** Either install VPA (e.g. from the [Kubernetes VPA repo](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler)), or do **not** apply any files from `08-autoscaling/`. The app runs without VPA; VPA is only for recommendations.

### HPA shows "unknown" for current metrics / scaling not working

- **Cause:** Metrics Server is not installed or not ready.
- **Fix:** Enable the Minikube addon: `minikube addons enable metrics-server`. Wait a minute, then run `kubectl get hpa -n staging` again.

### Pods stuck in Pending (dev)

- **Cause:** Resource quota or insufficient cluster resources.
- **Fix:** Check quota: `kubectl describe resourcequota -n dev`. If you hit the dev quota, either reduce the number of replicas or temporarily raise the quota in `02-quotas/quota-dev.yaml` and re-apply.

### DB pods in CrashLoopBackOff (readiness/liveness probe timeouts)

- **Cause:** Under load, Postgres can respond slowly and exceed the probe timeout.
- **Fix:** The DB manifests in `04-databases/` use relaxed probes (`timeoutSeconds: 5`, longer `initialDelaySeconds`). If problems persist, ensure the cluster has enough CPU/memory for the DB pods.

---

## 7. Checklist and screenshots (for grading / presentation)

After applying **dev** and loading images:

- [ ] `kubectl get ns` shows `dev`, `staging`, `prod`.
- [ ] `kubectl get pods -n dev` shows all pods `Running` and ready (e.g. frontend, gateway, auth/catalog/order-service, redis, solr, auth-db, catalog-db, order-db).
- [ ] `kubectl get svc -n dev` shows `shopsphere-frontend` (NodePort) and `gateway` (ClusterIP).
- [ ] `minikube service shopsphere-frontend -n dev` opens the app in the browser.
- [ ] Screenshot: browser showing the Shopsphere frontend (e.g. login or home).
- [ ] Screenshot: `kubectl get pods -n dev` (all Running, including `debug-curl` if applied).
- [ ] Screenshot: `kubectl get pod debug-curl -n dev` (standalone Pod for rubric).
- [ ] **Kustomize:** `kubectl apply -k shopsphere/k8s-overlays/dev` then `kubectl get pods -n dev` (all Running).
- [ ] Screenshot: `kubectl get hpa -n staging` (if staging is applied and metrics-server is on) showing HPAs and current metrics.

Optional for VPA:

- [ ] Screenshot: `kubectl describe vpa <name> -n staging` showing recommendation output (if VPA is installed and applied).
