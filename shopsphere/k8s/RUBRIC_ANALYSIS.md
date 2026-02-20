# Rubric analysis – strict professor + DevOps mentor (current state)

**Constraint:** Only existing structure; no new parallel layouts, no duplicate YAML. Evidence uses existing paths only.

---

## 1) FULLY implemented

| Requirement | Evidence |
|-------------|----------|
| **Web app, ≥2 parts communicating** | Frontend → gateway → auth/catalog/order services → DBs; Redis, Solr. All communicate via Services. |
| **Dockerfile per image** | `shopsphere-frontend/Dockerfile`, `shopsphere/gateway/Dockerfile`, `shopsphere/services/{auth,catalog,order}-service/Dockerfile`. Five app images. |
| **Pods** | `k8s/03-pods/debug-pod.yaml` – standalone Pod (kind: Pod), name: debug-curl. |
| **Deployments** | `k8s/05-backend/`: gateway, auth-service, catalog-service, order-service, redis; `k8s/06-frontend/shopsphere-frontend.yaml`. Six Deployments. |
| **StatefulSets** | `k8s/04-databases/`: auth-db, catalog-db, order-db; `k8s/05-backend/solr.yaml`. Four StatefulSets. |
| **Services** | One Service per workload in same manifests (ClusterIP; frontend NodePort). |
| **Three environments (namespaces)** | `k8s-overlays/{dev,staging,prod}/namespace.yaml` + overlay `namespace:`; manual path: `k8s/00-namespaces.yaml`. |
| **Dev: less resources, no HPA** | Dev overlay: no HPA. Quota 1 CPU / 2Gi from `k8s/02-quotas/quota-dev.yaml`. Base replicas 1. |
| **Staging/prod: ≥3 pods per deployment** | `k8s-overlays/staging/kustomization.yaml` and `prod/kustomization.yaml`: `replicas` count 3 for all six Deployments. |
| **Staging/prod mirror structurally** | Same objects and topology; differ only in config (prod has no quota). |
| **PV/PVC** | `volumeClaimTemplates` in auth-db, catalog-db, order-db (1Gi each), solr (2Gi). |
| **ConfigMaps** | `k8s/01-config/configmap.yaml` (shopsphere-config); refs in deployments. |
| **Secrets** | `k8s/01-config/secrets.yaml` (shopsphere-secrets); refs via secretKeyRef. |
| **Quotas: dev 1 CPU** | `k8s/02-quotas/quota-dev.yaml`: requests.cpu "1", limits.cpu "1", memory 2Gi. |
| **Quotas: staging ≥ 2× dev** | `k8s/02-quotas/quota-staging.yaml`: 4 CPU, 8Gi (≥ 2× dev). |
| **Quotas: prod unlimited** | No ResourceQuota in prod; only dev and staging have quota. |
| **HPA (staging/prod)** | `k8s/07-autoscaling/`: hpa-gateway, hpa-auth-service, hpa-catalog-service, hpa-order-service; applied with -n staging/prod; minReplicas 3, CPU metrics. |
| **HPA not in dev** | Dev overlay and README do not apply `k8s/07-autoscaling/` in dev. |
| **VPA recommendation mode** | `k8s/08-autoscaling/vpa-staging.yaml`, vpa-production.yaml: updateMode: "Off". README Section 3 has optional apply steps. |
| **Two-page architecture summary** | `k8s/ARCHITECTURE_SUMMARY.md`: application overview, Kubernetes objects and choices, ConfigMaps/Secrets, resource management, **Environment setup and isolation** (namespaces, isolation, comparison table). |
| **Diagram** | `k8s/architecture-diagram.md`: draw.io/LucidChart instructions, labels for Deployments, StatefulSets, Services, PVCs, HPA, VPA, traffic. |
| **Explain env setup and isolation** | ARCHITECTURE_SUMMARY Section 4: what runs where, resource/object/network isolation, dev vs staging vs prod table. |
| **Image delivery for grader** | README Section 2: Option A (build + minikube load), Option B (Docker Hub push + image refs). |
| **VPA apply in runbook** | README Section 3: optional `kubectl apply -n staging -f .../08-autoscaling/vpa-staging.yaml` (and prod). |

---

## 2) PARTIALLY implemented (remaining weaknesses)

| Requirement | Shortfall | Evidence | Fix (within existing structure) |
|-------------|-----------|----------|----------------------------------|
| **Dev quota vs actual usage** | With 1 CPU / 2Gi quota, total *limits* requested by all pods can exceed the quota (e.g. limits.cpu 1750m > 1). Existing pods keep running; new pods may be rejected. | Observed in describe resourcequota: Used limits > Hard in dev. | Either (1) reduce per-container limits in `k8s/05-backend/` and `k8s/06-frontend/` so sum of limits ≤ 1 CPU and 2Gi, or (2) keep 2 CPU / 4Gi in `quota-dev.yaml` and in ARCHITECTURE_SUMMARY state clearly: “Dev uses 2 CPU / 4Gi so the full stack schedules; rubric example was 1 CPU.” |
| **Diagram as artifact** | Rubric says “Include a diagram.” You have *instructions* in `architecture-diagram.md` but no actual diagram image (PNG/PDF) or draw.io file in the repo. Professor may expect a submitted diagram file. | `k8s/architecture-diagram.md` is instructions only. | Draw the diagram in draw.io/LucidChart using the instructions, then export to `k8s/architecture-diagram.png` (or .pdf) and commit it; or add the .drawio file to `k8s/`. Reference it in ARCHITECTURE_SUMMARY or submission notes. |

---

## 3) MISSING

- **Submitted diagram file (image or .drawio):** Instructions exist; the diagram itself (PNG, PDF, or .drawio) is not in the repo. Add one file under `k8s/` (no new folder) and reference it in the submission.

---

## 4) What to improve for maximum points (prioritized)

1. **Diagram artifact (high impact for 15% doc)**  
   - Use `k8s/architecture-diagram.md` to draw the diagram in draw.io or LucidChart.  
   - Export as `k8s/architecture-diagram.png` (or .pdf) or save as `k8s/architecture-diagram.drawio`.  
   - In ARCHITECTURE_SUMMARY or README, add one line: “Diagram: see `k8s/architecture-diagram.png`.”  
   - **No new folders.**

2. **Dev quota vs usage (medium impact)**  
   - If you keep dev at 1 CPU: reduce container limits in the base manifests so total namespace limits ≤ 1 CPU and 2Gi, then re-apply and verify `kubectl describe resourcequota dev-quota -n dev` shows Used ≤ Hard.  
   - If you raise dev to 2 CPU / 4Gi: edit `k8s/02-quotas/quota-dev.yaml`, re-apply, and in ARCHITECTURE_SUMMARY Section 3 (or 4) add one sentence justifying 2 CPU (full stack scheduling).  

3. **Optional: one-line “Submission” note in README**  
   - Add at the top or in a short “Submission” section: “YAMLs: `k8s/` + `k8s-overlays/`. Diagram: `k8s/architecture-diagram.png`. Architecture: `k8s/ARCHITECTURE_SUMMARY.md`. Images: see Section 2 (Image delivery).”  
   - Helps the professor find deliverables quickly.

---

## 5) Screenshots to prepare for the presentation

**Dev**  
- `kubectl get ns`  
- `kubectl get pods -n dev` (all Running where applicable; debug-curl may be Completed)  
- `kubectl get deployments -n dev` (DESIRED 1)  
- `kubectl get resourcequota,limitrange -n dev`  
- `kubectl get svc -n dev`  
- Browser: `minikube service shopsphere-frontend -n dev` (login/home)  
- Optional: `kubectl exec -it debug-curl -n dev -- curl -s http://gateway:4000/health`  

**Staging**  
- `kubectl get deployments -n staging` (DESIRED/READY 3 for all six)  
- `kubectl get pods -n staging`  
- `kubectl get hpa -n staging`  
- `kubectl get resourcequota -n staging`  
- `kubectl get vpa -n staging`; `kubectl describe vpa gateway-vpa -n staging`  

**Prod**  
- `kubectl get deployments -n prod`  
- `kubectl get hpa -n prod`  
- `kubectl get resourcequota -n prod` (empty)  

**PV/PVC**  
- `kubectl get pvc -n dev`  

**App**  
- Browser on frontend (dev or staging).

---

## 6) Final grade and justification

**Estimated grade: 8–8.5 / 10**

- **Application functionality (25%):** ~8/10. Multi-component app runs; frontend talks to gateway and services. Image delivery and runbook are documented. Minor: no proof that all three envs were run and tested end-to-end by you.  
- **Kubernetes configuration (30%):** ~8.5/10. Pods, Deployments, StatefulSets, Services, ConfigMaps, Secrets, PVCs, HPA, VPA are present and correctly used. Replicas=3 in staging/prod; quotas aligned with spec. Remaining gap: dev namespace can be over quota on limits if you keep 1 CPU and don’t reduce limits.  
- **Environment setup (20%):** ~8.5/10. Three namespaces; dev no HPA; staging/prod same structure, 3 replicas; quotas and isolation clearly documented.  
- **Documentation (15%):** ~8/10. Two-page ARCHITECTURE_SUMMARY with env isolation; diagram *instructions* are complete. Missing: an actual diagram file (PNG/.drawio) in the repo; adding it would push this toward 9/10.  
- **Presentation (10%):** Not graded until delivery. Use the screenshot list above and be ready to explain object choices, quotas, and isolation.

**To reach 9–9.5/10:** Add the diagram artifact (`architecture-diagram.png` or .drawio) under `k8s/` and resolve dev quota (either lower limits to fit 1 CPU or set 2 CPU with one-sentence justification in ARCHITECTURE_SUMMARY). No new architecture or duplicate YAML.
