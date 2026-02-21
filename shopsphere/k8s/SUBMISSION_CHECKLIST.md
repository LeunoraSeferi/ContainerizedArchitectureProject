# Final Submission Checklist – Kubernetes Project

Use this checklist to prepare your submission and to run the exact tests a professor would run. Replace `YOUR_DOCKERHUB_USER` everywhere with your actual Docker Hub username.

---

## 1. Submission Preparation (Step-by-Step)

### 1.1 Push all required Docker images to Docker Hub

**From the repository root** (folder that contains `shopsphere/` and `shopsphere-frontend/`):

**Step A – Build the five app images (PowerShell):**
```powershell
docker build -t shopsphere-frontend:latest -f shopsphere-frontend/Dockerfile shopsphere-frontend
docker build -t shopsphere-gateway:latest -f shopsphere/gateway/Dockerfile shopsphere/gateway
docker build -t shopsphere-auth-service:latest -f shopsphere/services/auth-service/Dockerfile shopsphere/services/auth-service
docker build -t shopsphere-catalog-service:latest -f shopsphere/services/catalog-service/Dockerfile shopsphere/services/catalog-service
docker build -t shopsphere-order-service:latest -f shopsphere/services/order-service/Dockerfile shopsphere/services/order-service
```

**Step B – Log in to Docker Hub:**
```powershell
docker login
```
Enter your Docker Hub username and password (or access token).

**Step C – Tag for Docker Hub (replace YOUR_DOCKERHUB_USER):**
```powershell
$user = "YOUR_DOCKERHUB_USER"
docker tag shopsphere-frontend:latest ${user}/shopsphere-frontend:latest
docker tag shopsphere-gateway:latest ${user}/shopsphere-gateway:latest
docker tag shopsphere-auth-service:latest ${user}/shopsphere-auth-service:latest
docker tag shopsphere-catalog-service:latest ${user}/shopsphere-catalog-service:latest
docker tag shopsphere-order-service:latest ${user}/shopsphere-order-service:latest
```

**Step D – Push (replace YOUR_DOCKERHUB_USER):**
```powershell
docker push YOUR_DOCKERHUB_USER/shopsphere-frontend:latest
docker push YOUR_DOCKERHUB_USER/shopsphere-gateway:latest
docker push YOUR_DOCKERHUB_USER/shopsphere-auth-service:latest
docker push YOUR_DOCKERHUB_USER/shopsphere-catalog-service:latest
docker push YOUR_DOCKERHUB_USER/shopsphere-order-service:latest
```

---

### 1.2 Modify all `image:` fields in YAML to use your Docker Hub username

You must change **exactly five files** so the cluster pulls from Docker Hub instead of local images.

| File | Current value | New value (replace YOUR_DOCKERHUB_USER) |
|------|----------------|------------------------------------------|
| `shopsphere/k8s/06-frontend/shopsphere-frontend.yaml` | `image: shopsphere-frontend:latest` | `image: YOUR_DOCKERHUB_USER/shopsphere-frontend:latest` |
| `shopsphere/k8s/05-backend/gateway.yaml` | `image: shopsphere-gateway:latest` | `image: YOUR_DOCKERHUB_USER/shopsphere-gateway:latest` |
| `shopsphere/k8s/05-backend/auth-service.yaml` | `image: shopsphere-auth-service:latest` | `image: YOUR_DOCKERHUB_USER/shopsphere-auth-service:latest` |
| `shopsphere/k8s/05-backend/catalog-service.yaml` | `image: shopsphere-catalog-service:latest` | `image: YOUR_DOCKERHUB_USER/shopsphere-catalog-service:latest` |
| `shopsphere/k8s/05-backend/order-service.yaml` | `image: shopsphere-order-service:latest` | `image: YOUR_DOCKERHUB_USER/shopsphere-order-service:latest` |

**Optional but recommended:** Set `imagePullPolicy: Always` (or remove the line so default applies when using a registry) so the professor always pulls the latest pushed image. If you leave `IfNotPresent`, it is still correct as long as the image name includes your Docker Hub path.

**PowerShell one-liner to replace in all five files (run from repo root; set $user first):**
```powershell
$user = "YOUR_DOCKERHUB_USER"
(Get-Content shopsphere/k8s/06-frontend/shopsphere-frontend.yaml) -replace 'image: shopsphere-frontend:latest', "image: ${user}/shopsphere-frontend:latest" | Set-Content shopsphere/k8s/06-frontend/shopsphere-frontend.yaml
(Get-Content shopsphere/k8s/05-backend/gateway.yaml) -replace 'image: shopsphere-gateway:latest', "image: ${user}/shopsphere-gateway:latest" | Set-Content shopsphere/k8s/05-backend/gateway.yaml
(Get-Content shopsphere/k8s/05-backend/auth-service.yaml) -replace 'image: shopsphere-auth-service:latest', "image: ${user}/shopsphere-auth-service:latest" | Set-Content shopsphere/k8s/05-backend/auth-service.yaml
(Get-Content shopsphere/k8s/05-backend/catalog-service.yaml) -replace 'image: shopsphere-catalog-service:latest', "image: ${user}/shopsphere-catalog-service:latest" | Set-Content shopsphere/k8s/05-backend/catalog-service.yaml
(Get-Content shopsphere/k8s/05-backend/order-service.yaml) -replace 'image: shopsphere-order-service:latest', "image: ${user}/shopsphere-order-service:latest" | Set-Content shopsphere/k8s/05-backend/order-service.yaml
```

---

### 1.3 Verify that images are publicly accessible

1. In a browser (or incognito / not logged into Docker Hub), open:
   - `https://hub.docker.com/r/YOUR_DOCKERHUB_USER/shopsphere-frontend/tags`
   - Same for `shopsphere-gateway`, `shopsphere-auth-service`, `shopsphere-catalog-service`, `shopsphere-order-service`.
2. **Expected:** You see tag `latest` and the image is listed. If the repo is **private**, the professor will get ImagePullBackOff unless you give them access. **For full points, images must be publicly pullable** or you must document how the professor gets access.
3. **Test pull without login (PowerShell):**
   ```powershell
   docker pull YOUR_DOCKERHUB_USER/shopsphere-frontend:latest
   ```
   If this works without `docker login`, a fresh cluster can pull the image.

**Risk:** Private Docker Hub repos will cause ImagePullBackOff on the professor’s machine unless you add them as a collaborator or make the repos public.

---

### 1.4 What must be present in your GitHub repository

- **Required:**
  - `shopsphere/k8s/` – all YAML (01-config, 02-quotas, 03-pods, 04-databases, 05-backend, 06-frontend, 07-autoscaling, 08-autoscaling, kustomization.yaml, 00-namespaces.yaml).
  - `shopsphere/k8s-overlays/` – dev, staging, prod (each with kustomization.yaml and namespace.yaml).
  - `shopsphere/k8s/README.md` – runbook for apply order and verification.
  - Diagram: `shopsphere/k8s/architecture-diagram.drawio` and/or `architecture-diagram.drawio.png`.
  - Dockerfiles: `shopsphere-frontend/Dockerfile`, `shopsphere/gateway/Dockerfile`, `shopsphere/services/auth-service/Dockerfile`, `shopsphere/services/catalog-service/Dockerfile`, `shopsphere/services/order-service/Dockerfile`.
- **No need in repo:** Built images (professor pulls from Docker Hub if you updated `image:` as above).

---

### 1.5 Simulate “fresh professor environment” test

**Goal:** Reproduce a clean machine that only has the repo and Docker Hub images (no local builds, no previous Minikube state).

**PowerShell (run from repo root):**

```powershell
# 1. Destroy existing cluster
minikube delete

# 2. Start fresh cluster
minikube start

# 3. Enable metrics-server (required for HPA)
minikube addons enable metrics-server

# 4. Deploy dev
kubectl apply -k shopsphere/k8s-overlays/dev
kubectl apply -n dev -f shopsphere/k8s/02-quotas/quota-dev.yaml -f shopsphere/k8s/02-quotas/limitrange-dev.yaml

# 5. Deploy staging
kubectl apply -k shopsphere/k8s-overlays/staging
kubectl apply -n staging -f shopsphere/k8s/02-quotas/quota-staging.yaml
kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/

# 6. Deploy prod
kubectl apply -k shopsphere/k8s-overlays/prod
kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/
```

**Do not run** `minikube image load` or `docker build` in this test. The cluster must pull all five app images from Docker Hub. Wait until pods are Running (e.g. `kubectl get pods -n dev -w` until no ImagePullBackOff). If any pod stays ImagePullBackOff, the image is not reachable (private repo, wrong name, or network issue).

**Optional (if VPA is installed on the professor’s cluster):**
```powershell
kubectl apply -n staging -f shopsphere/k8s/08-autoscaling/vpa-staging.yaml
kubectl apply -n prod -f shopsphere/k8s/08-autoscaling/vpa-production.yaml
```

---

## 2. Strict Runtime Testing – PowerShell Commands

Run these **from the repository root** after a successful apply. Replace `YOUR_NS` with `dev`, `staging`, or `prod` where indicated.

### 2.1 Namespaces

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 1 | `kubectl get ns` | Lines containing `dev`, `staging`, `prod` | Screenshot of full output | Missing any of the three namespaces |

---

### 2.2 Dev quota = 1 CPU / 2Gi

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 2 | `kubectl describe resourcequota dev-quota -n dev` | `Name: dev-quota`, `limits.cpu: "1"`, `limits.memory: 2Gi`, and under Status: `Used` ≤ `Hard` for both | Screenshot of describe output showing Hard and Used | Quota missing; Used > Hard; limits.cpu not "1" |

---

### 2.3 Staging quota = 4 CPU / 8Gi

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 3 | `kubectl describe resourcequota staging-quota -n staging` | `Name: staging-quota`, `limits.cpu: "4"`, `limits.memory: 8Gi`, Used ≤ Hard | Screenshot of describe output | Quota missing; limits not 4 CPU / 8Gi |

---

### 2.4 Production has no quota

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 4 | `kubectl get resourcequota -n prod` | `No resources found` or empty list | Screenshot of command output | Any ResourceQuota listed in prod |

---

### 2.5 Replicas = 1 in dev

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 5 | `kubectl get deployments -n dev` | All 6 deployments (gateway, auth-service, catalog-service, order-service, redis, shopsphere-frontend) show `1/1` in READY and `1` in DESIRED | Screenshot of `kubectl get deployments -n dev` | Any DESIRED other than 1 |

---

### 2.6 Replicas = 3 in staging and prod

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 6 | `kubectl get deployments -n staging` | All 6 deployments show `3/3` (or 3/x) and DESIRED 3 | Screenshot of get deployments -n staging | Any DESIRED other than 3 |
| 7 | `kubectl get deployments -n prod` | Same as staging | Screenshot of get deployments -n prod | Any DESIRED other than 3 |

---

### 2.7 HPA in staging/prod, not in dev

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 8 | `kubectl get hpa -n dev` | `No resources found` or empty | Screenshot | Any HPA in dev |
| 9 | `kubectl get hpa -n staging` | Four HPAs: gateway-hpa, auth-service-hpa, catalog-service-hpa, order-service-hpa. After 1–2 min, REFERENCE and CURRENT columns may show numbers (not only "unknown") | Screenshot of get hpa -n staging | Fewer than 4 HPAs; or all CURRENT "unknown" after metrics-server has been up 2+ minutes |
| 10 | `kubectl get hpa -n prod` | Same four HPAs as staging | Screenshot | Fewer than 4 HPAs |

---

### 2.8 VPA in recommendation mode (updateMode Off)

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 11 | `kubectl get vpa -n staging` | Four VPAs if VPA is installed; otherwise skip | Screenshot if VPA applied | N/A |
| 12 | `kubectl describe vpa gateway-vpa -n staging` | In the output: `Update Mode: Off` (or updatePolicy.updateMode: Off) | Screenshot of describe showing Update Mode: Off | updateMode not Off (e.g. Auto/Recreate) |

---

### 2.9 PVCs Bound

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 13 | `kubectl get pvc -n dev` | Multiple PVCs (e.g. auth-db, catalog-db, order-db, solr) all with STATUS `Bound` | Screenshot of get pvc -n dev | Any PVC in Pending |

---

### 2.10 Frontend in browser

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 14 | `minikube service shopsphere-frontend -n dev` | Opens browser or prints URL; frontend page loads (e.g. login) | Screenshot of browser with your app | Page does not load; connection refused; 502/503 |

---

### 2.11 Inter-service communication (debug-curl)

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 15 | `kubectl exec -it debug-curl -n dev -- curl -s -o /dev/null -w "%{http_code}" http://gateway:4000/health` | `200` (or the HTTP code your gateway returns for /health) | Optional: screenshot of terminal showing 200 | Non-200; "connection refused"; pod not found |

---

### 2.12 No ImagePullBackOff or CrashLoopBackOff

| # | Command | Expected output | Screenshot | Failure |
|---|---------|-----------------|------------|---------|
| 16 | `kubectl get pods -n dev` | All pods Running (or Completed for debug-curl if restartPolicy: Never). No ImagePullBackOff, no CrashLoopBackOff | Screenshot of get pods -n dev | Any pod in ImagePullBackOff or CrashLoopBackOff |
| 17 | `kubectl get pods -n staging` | All pods Running (or Completed) | Screenshot of get pods -n staging | Same as above |
| 18 | `kubectl get pods -n prod` | All pods Running (or Completed) | Screenshot of get pods -n prod | Same as above |

---

## 3. Professor Simulation Test

**What the professor will do (minimal):**

1. Clone the repo.
2. Ensure Docker (or container runtime) and Minikube (or another cluster) and kubectl are available.
3. Enable metrics-server: `minikube addons enable metrics-server`.
4. Run (from repo root):
   ```powershell
   kubectl apply -k shopsphere/k8s-overlays/dev
   kubectl apply -n dev -f shopsphere/k8s/02-quotas/quota-dev.yaml -f shopsphere/k8s/02-quotas/limitrange-dev.yaml
   kubectl apply -k shopsphere/k8s-overlays/staging
   kubectl apply -n staging -f shopsphere/k8s/02-quotas/quota-staging.yaml
   kubectl apply -n staging -f shopsphere/k8s/07-autoscaling/
   kubectl apply -k shopsphere/k8s-overlays/prod
   kubectl apply -n prod -f shopsphere/k8s/07-autoscaling/
   ```
5. Wait for pods to be Ready (no ImagePullBackOff).
6. Optionally apply VPA for staging/prod if they have VPA installed.

**What must work without manual fixing:**

- All five app images must pull from Docker Hub (no `docker build` or `minikube image load` on professor’s machine).
- No edits to YAML (other than you having already set `image:` to `YOUR_DOCKERHUB_USER/...` before pushing to GitHub).
- Quotas, replicas, HPA, and (if applied) VPA must match the rubric; PVCs must bind; frontend must be reachable; debug-curl must reach gateway.

**How to ensure zero runtime errors:**

- Images public on Docker Hub and `image:` in repo points to them.
- You have run **Section 1.5** (fresh minikube delete + start + apply) and **Section 2** yourself and fixed any failure before submitting.
- README in `k8s/README.md` states exactly: apply order, need for metrics-server, and optional VPA.

---

## 4. Screenshot Checklist (Proof of 100% Compliance)

Take only these; each proves a specific requirement.

| # | Screenshot | Proves |
|---|------------|--------|
| 1 | `kubectl get ns` | Three environments (dev, staging, prod) exist |
| 2 | `kubectl describe resourcequota dev-quota -n dev` (full output) | Dev quota 1 CPU / 2Gi enforced; Used ≤ Hard |
| 3 | `kubectl describe resourcequota staging-quota -n staging` (full output) | Staging quota 4 CPU / 8Gi |
| 4 | `kubectl get resourcequota -n prod` | Production has no quota |
| 5 | `kubectl get deployments -n dev` | Replicas = 1 in dev |
| 6 | `kubectl get deployments -n staging` | Replicas = 3 in staging |
| 7 | `kubectl get hpa -n dev` | No HPA in dev |
| 8 | `kubectl get hpa -n staging` | HPA exists in staging (four HPAs) |
| 9 | `kubectl describe vpa gateway-vpa -n staging` (section showing Update Mode: Off) | VPA in recommendation mode |
| 10 | `kubectl get pvc -n dev` | PVCs Bound |
| 11 | Browser with frontend loaded (e.g. login page) | Frontend works |
| 12 | Terminal: `kubectl exec ... curl ... gateway:4000/health` returning 200 | Inter-service communication |
| 13 | `kubectl get pods -n dev` (all Running, no ImagePullBackOff/CrashLoopBackOff) | No image or crash errors in dev |

**Strict note:** If you use a private Docker Hub repo and the professor cannot pull images, Screenshot 13 will show ImagePullBackOff and you will lose points. Ensure images are publicly pullable or access is documented and granted.
