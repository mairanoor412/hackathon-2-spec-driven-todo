# Tasks: Local Kubernetes Deployment (Phase 4)

**Branch**: `005-local-k8s-deployment` | **Date**: 2026-02-07
**Plan**: `@specs/features/local-kubernetes-deployment/plan.md`
**Spec**: `@specs/features/local-kubernetes-deployment/spec.md`

---

## Phase A: Containerization

**Ref**: `@specs/k8s-infrastructure/Dockerization.md`

---

### T041: Create Backend Dockerfile (Multi-Stage Build)

**Priority**: P1 | **Dependencies**: None | **Spec Ref**: Dockerization FR-001, FR-003, FR-004, FR-006, FR-007, FR-014

**Description**: Create a multi-stage Dockerfile for the FastAPI backend service at `backend/Dockerfile`. The build stage installs Python dependencies from `requirements.txt`. The runtime stage copies only the application code and installed packages, runs as a non-root user, exposes port 8000, and starts uvicorn.

**Files to create/modify**:
- `backend/Dockerfile` (NEW)
- `backend/.dockerignore` (NEW)

**Acceptance Criteria**:
- [X] Dockerfile uses at least 2 stages (build + runtime)
- [X] Base image is `python:3.13-slim` (or equivalent slim variant)
- [X] Final image does NOT contain pip cache, build tools, or dev dependencies
- [X] Application runs as non-root user (e.g., `appuser`)
- [X] Container exposes port 8000
- [X] `.dockerignore` excludes: `venv/`, `__pycache__/`, `.env`, `.git`, `*.pyc`
- [X] No secrets or `.env` file baked into the image
- [X] Header comment: `# Generated from @specs/k8s-infrastructure/Dockerization.md`

**Verification**:
```bash
docker build -t todo-backend:latest ./backend
docker run --rm -e DATABASE_URL=test -e BETTER_AUTH_SECRET=test -p 8000:8000 todo-backend:latest
# Verify: curl http://localhost:8000/health → {"status":"healthy"}
docker image inspect todo-backend:latest --format='{{.Size}}' # < 500MB
```

---

### T042: Create Frontend Dockerfile (Multi-Stage Build with Standalone Output)

**Priority**: P1 | **Dependencies**: None | **Spec Ref**: Dockerization FR-002, FR-003, FR-005, FR-006, FR-007, FR-012, FR-015

**Description**: Create a multi-stage Dockerfile for the Next.js frontend at `frontend/Dockerfile`. Modify `frontend/next.config.ts` to add `output: "standalone"`. The build stage installs dependencies and runs `next build`. The runtime stage copies only the standalone output, runs as non-root, exposes port 3000, and starts the Next.js production server.

**Files to create/modify**:
- `frontend/Dockerfile` (NEW)
- `frontend/.dockerignore` (NEW)
- `frontend/next.config.ts` (MODIFIED — add `output: "standalone"`)

**Acceptance Criteria**:
- [X] `next.config.ts` includes `output: "standalone"` setting
- [X] Dockerfile uses at least 3 stages (deps + build + runtime)
- [X] Base image is `node:22-alpine` (or equivalent)
- [X] Final image contains only standalone build output (no full `node_modules`)
- [X] Application runs as non-root user (e.g., `nextjs`)
- [X] Container exposes port 3000
- [X] `.dockerignore` excludes: `node_modules/`, `.next/`, `.env`, `.git`
- [X] Static assets are copied correctly (public/ and .next/static/)
- [X] Header comment: `# Generated from @specs/k8s-infrastructure/Dockerization.md`

**Verification**:
```bash
docker build -t todo-frontend:latest ./frontend
docker run --rm -e NEXT_PUBLIC_API_URL=http://localhost:8000 -p 3000:3000 todo-frontend:latest
# Verify: open http://localhost:3000 → landing/login page renders
docker image inspect todo-frontend:latest --format='{{.Size}}' # < 500MB
```

---

### T043: Create Docker Compose for Local Testing

**Priority**: P2 | **Dependencies**: T041, T042 | **Spec Ref**: Dockerization FR-008, FR-009, FR-017

**Description**: Create `docker-compose.yml` at the repo root that orchestrates both services with proper networking, port mappings, and environment variable injection. The compose file references `.env` for secrets.

**Files to create/modify**:
- `docker-compose.yml` (NEW)

**Acceptance Criteria**:
- [X] Defines `backend` and `frontend` services
- [X] Defines a shared network for inter-service communication
- [X] Frontend can reach backend by service name (`backend:8000`)
- [X] Both services expose correct ports to host (3000, 8000)
- [X] Environment variables sourced from `.env` file or `env_file` directive (no hardcoded secrets)
- [X] `docker compose up` starts both services and they become healthy
- [X] `docker compose down` removes all containers and networks cleanly
- [X] Header comment: `# Generated from @specs/k8s-infrastructure/Dockerization.md`

**Verification**:
```bash
docker compose up -d
docker compose ps  # Both services "running"
curl http://localhost:8000/health  # Backend healthy
curl http://localhost:3000  # Frontend serves page
# Full e2e: login, create task, use chatbot
docker compose down
docker compose ps  # No containers remain
```

---

## Phase B: Minikube Cluster Setup

**Ref**: `@specs/k8s-infrastructure/Minikube-setup.md`

---

### T044: Install Prerequisites and Start Minikube Cluster

**Priority**: P1 | **Dependencies**: None (can run in parallel with Phase A) | **Spec Ref**: Minikube-setup FR-001 through FR-006, FR-015, FR-016

**Description**: Document and execute the Minikube cluster setup: verify prerequisites (Docker, kubectl, Helm), start Minikube with Docker driver and recommended resources (2 CPUs, 4GB RAM), create the `todo-app` namespace, configure kubectl context, and enable recommended addons (metrics-server, ingress).

**Files to create/modify**:
- `docs/k8s-setup-guide.md` (NEW — prerequisites + setup section)

**Acceptance Criteria**:
- [X] Docker, kubectl, Helm, Minikube versions verified
- [X] Minikube starts with Docker driver, 2 CPUs, 4GB RAM
- [X] `todo-app` namespace created
- [X] kubectl context set to `minikube` cluster + `todo-app` namespace
- [X] metrics-server and ingress addons enabled
- [X] `kubectl get nodes` shows node in "Ready" state
- [X] Quick start command sequence documented

**Verification**:
```bash
minikube status  # Running
kubectl get nodes  # Ready
kubectl config current-context  # minikube
kubectl get namespace todo-app  # exists
minikube addons list | grep -E "metrics-server|ingress"  # enabled
helm version  # v3.x
```

---

### T045: Load Docker Images into Minikube

**Priority**: P1 | **Dependencies**: T041, T042, T044 | **Spec Ref**: Minikube-setup FR-007, FR-010

**Description**: Load the locally-built Docker images (todo-backend, todo-frontend) into Minikube's Docker daemon so they are available for Kubernetes pod scheduling without an external registry.

**Acceptance Criteria**:
- [X] Both images loaded into Minikube via `minikube image load` or Docker daemon sharing
- [X] Images appear in `minikube image list` output
- [X] Documentation covers both methods (image load and `eval $(minikube docker-env)`)

**Verification**:
```bash
minikube image load todo-backend:latest
minikube image load todo-frontend:latest
minikube image list | grep todo  # Both images listed
```

---

## Phase C: Helm Charts

**Ref**: `@specs/k8s-infrastructure/Helm-charts.md`

---

### T046: Create Helm Chart Structure

**Priority**: P1 | **Dependencies**: None (can start in parallel with Phase B) | **Spec Ref**: Helm-charts FR-001, FR-014, FR-016

**Description**: Initialize the Helm chart at `k8s/todo-app/` with standard directory structure: Chart.yaml, values.yaml, .helmignore, templates/ directory with _helpers.tpl. Chart metadata includes name, version (0.1.0), appVersion, description.

**Files to create/modify**:
- `k8s/todo-app/Chart.yaml` (NEW)
- `k8s/todo-app/values.yaml` (NEW — skeleton with sections)
- `k8s/todo-app/.helmignore` (NEW)
- `k8s/todo-app/templates/_helpers.tpl` (NEW)

**Acceptance Criteria**:
- [X] Chart.yaml has apiVersion v2, name `todo-app`, version `0.1.0`
- [X] `_helpers.tpl` defines standard label helpers (app.kubernetes.io/*)
- [X] `helm lint k8s/todo-app/` passes with no errors
- [X] Header comments reference `@specs/k8s-infrastructure/Helm-charts.md`

**Verification**:
```bash
helm lint k8s/todo-app/  # 0 errors
cat k8s/todo-app/Chart.yaml  # Verify metadata
```

---

### T047: Create Backend Deployment and Service Templates

**Priority**: P1 | **Dependencies**: T046 | **Spec Ref**: Helm-charts FR-002, FR-003, FR-006, FR-007

**Description**: Create Helm templates for the backend Kubernetes Deployment and Service. The Deployment references the backend image from values, defines readiness/liveness probes (HTTP GET /health on port 8000), resource requests/limits, and injects environment variables from Secret and ConfigMap. The Service uses ClusterIP (or NodePort for direct access).

**Files to create/modify**:
- `k8s/todo-app/templates/backend-deployment.yaml` (NEW)
- `k8s/todo-app/templates/backend-service.yaml` (NEW)

**Acceptance Criteria**:
- [X] Deployment references `{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}`
- [X] Readiness probe: HTTP GET /health, port 8000, initialDelay 10s
- [X] Liveness probe: HTTP GET /health, port 8000, initialDelay 15s
- [X] Resource requests and limits configurable via values
- [X] Environment variables from Secret and ConfigMap references
- [X] Standard Helm labels applied
- [X] Service exposes port 8000 with correct selectors
- [X] `imagePullPolicy: IfNotPresent` for local Minikube images

**Verification**:
```bash
helm template k8s/todo-app/ | grep -A 20 "kind: Deployment"  # Backend deployment renders
helm lint k8s/todo-app/  # Still passes
```

---

### T048: Create Frontend Deployment and Service Templates

**Priority**: P1 | **Dependencies**: T046 | **Spec Ref**: Helm-charts FR-002, FR-003, FR-006, FR-007

**Description**: Create Helm templates for the frontend Kubernetes Deployment and Service. Similar to backend but with frontend-specific configuration: port 3000, HTTP GET / for probes, NodePort service type for external access from host browser.

**Files to create/modify**:
- `k8s/todo-app/templates/frontend-deployment.yaml` (NEW)
- `k8s/todo-app/templates/frontend-service.yaml` (NEW)

**Acceptance Criteria**:
- [X] Deployment references `{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}`
- [X] Readiness probe: HTTP GET /, port 3000, initialDelay 15s
- [X] Liveness probe: HTTP GET /, port 3000, initialDelay 20s
- [X] Resource requests and limits configurable via values
- [X] Environment variables from Secret and ConfigMap references
- [X] Service type NodePort to expose frontend to host browser
- [X] Standard Helm labels applied
- [X] `imagePullPolicy: IfNotPresent` for local Minikube images

**Verification**:
```bash
helm template k8s/todo-app/ | grep -A 20 "frontend"  # Frontend deployment renders
helm lint k8s/todo-app/  # Still passes
```

---

### T049: Create ConfigMap, Secret, and Complete Values File

**Priority**: P1 | **Dependencies**: T046 | **Spec Ref**: Helm-charts FR-004, FR-005, FR-008

**Description**: Create Helm templates for ConfigMap (non-sensitive config: CORS_ORIGINS, NEXT_PUBLIC_API_URL, JWT_ALGORITHM) and Secret (sensitive config: DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY). Complete `values.yaml` with all 15+ documented, commented configurable parameters.

**Files to create/modify**:
- `k8s/todo-app/templates/configmap.yaml` (NEW)
- `k8s/todo-app/templates/secret.yaml` (NEW)
- `k8s/todo-app/values.yaml` (UPDATED — complete with all parameters)

**Acceptance Criteria**:
- [X] ConfigMap template with non-sensitive environment variables
- [X] Secret template with base64-encoded sensitive values from values
- [X] values.yaml has 15+ documented parameters with inline comments
- [X] Parameters cover: image repo/tag (x2), replicas (x2), resources (x2), env vars, service type/port, probe config
- [X] Secret values use placeholder defaults in values.yaml (developer overrides at install)
- [X] `helm lint` still passes

**Verification**:
```bash
helm template k8s/todo-app/ | grep "kind: ConfigMap" -A 10  # ConfigMap renders
helm template k8s/todo-app/ | grep "kind: Secret" -A 10  # Secret renders
grep -c "^[[:space:]]*#" k8s/todo-app/values.yaml  # Many comment lines
```

---

### T050: Create NOTES.txt, Optional Ingress, and Test Helm Lifecycle

**Priority**: P2 | **Dependencies**: T047, T048, T049 | **Spec Ref**: Helm-charts FR-009 through FR-016, FR-017

**Description**: Create NOTES.txt with post-install access instructions, optional Ingress template (disabled by default), and validate the full Helm lifecycle: install → status → upgrade → rollback → uninstall on Minikube.

**Files to create/modify**:
- `k8s/todo-app/templates/NOTES.txt` (NEW)
- `k8s/todo-app/templates/ingress.yaml` (NEW — optional, disabled by default)

**Acceptance Criteria**:
- [X] NOTES.txt shows how to access the application and check pod status
- [X] Ingress template renders only when `ingress.enabled=true` in values
- [ ] `helm install todo k8s/todo-app/ -n todo-app` succeeds
- [ ] All pods reach Running and Ready status within 2 minutes
- [ ] `helm upgrade todo k8s/todo-app/ -n todo-app --set backend.replicaCount=2` applies
- [ ] `helm rollback todo 1 -n todo-app` reverts to previous state
- [ ] `helm uninstall todo -n todo-app` removes all resources
- [ ] No orphaned resources after uninstall

**Verification**:
```bash
helm install todo k8s/todo-app/ -n todo-app --set backend.secrets.databaseUrl=<url> --set backend.secrets.betterAuthSecret=<secret> --set backend.secrets.geminiApiKey=<key>
kubectl get pods -n todo-app  # All Running/Ready
helm status todo -n todo-app  # Deployed
helm upgrade todo k8s/todo-app/ -n todo-app --set backend.replicaCount=2
kubectl get pods -n todo-app  # 2 backend pods
helm rollback todo 1 -n todo-app
kubectl get pods -n todo-app  # Back to 1 backend pod
helm uninstall todo -n todo-app
kubectl get all -n todo-app  # No resources
```

---

## Phase D: Verification & AIOps

**Ref**: `@specs/k8s-infrastructure/AIOps-tools.md`, `@specs/features/local-kubernetes-deployment/spec.md`

---

### T051: End-to-End Application Verification on Minikube

**Priority**: P1 | **Dependencies**: T050 | **Spec Ref**: Parent spec SC-003, SC-006

**Description**: With the application deployed via Helm on Minikube, verify the complete user journey: signup/login, create tasks, edit tasks, mark complete, delete tasks, search/sort, and AI chatbot interaction. Also test pod recovery by deleting a pod and confirming Kubernetes restarts it.

**Acceptance Criteria**:
- [ ] Frontend accessible from host browser via NodePort URL
- [ ] User can sign up and log in
- [ ] User can create, read, update, delete tasks
- [ ] User can search and sort tasks
- [ ] AI chatbot responds to messages correctly
- [ ] Deleting a pod → Kubernetes restarts it → app recovers
- [ ] All functionality matches Phase 3 local development behavior

**Verification**:
```bash
# Get frontend access URL
minikube service todo-frontend -n todo-app --url
# Open URL in browser and perform full e2e test
# Pod recovery test:
kubectl delete pod -l app.kubernetes.io/name=todo-app-backend -n todo-app
kubectl get pods -n todo-app -w  # Watch pod restart
# Verify app still works after restart
```

---

### T052: Install and Configure AIOps Tools (kubectl-ai, Kagent)

**Priority**: P3 | **Dependencies**: T044 | **Spec Ref**: AIOps-tools FR-001 through FR-004

**Description**: Install kubectl-ai and Kagent, configure AI provider API keys, and verify both tools can communicate with the Minikube cluster. Document the installation steps and provide manual kubectl fallbacks.

**Files to create/modify**:
- `docs/k8s-setup-guide.md` (UPDATED — add AIOps section)

**Acceptance Criteria**:
- [ ] kubectl-ai installed and responds to version check
- [ ] Kagent installed and connects to Minikube cluster
- [ ] AI provider API key configured for both tools
- [ ] Basic test query works (e.g., "list all namespaces")
- [X] Manual kubectl fallback documented for each AIOps command
- [X] Clear note that AIOps tools are OPTIONAL

**Verification**:
```bash
kubectl-ai "list all namespaces"  # Or manual: kubectl get namespaces
# Kagent: kagent health-check  # Or manual: kubectl get nodes; kubectl get pods -A
```

---

### T053: Document 5+ AIOps Command Examples with Manual Fallbacks

**Priority**: P3 | **Dependencies**: T051, T052 | **Spec Ref**: AIOps-tools FR-005 through FR-009, FR-014

**Description**: Document at least 5 real AI-assisted command examples spanning deployment, status, scaling, configuration, and troubleshooting. Each example includes the natural language prompt, expected AI-generated command, expected output, and manual kubectl/helm equivalent.

**Files to create/modify**:
- `docs/k8s-setup-guide.md` (UPDATED — add AIOps examples section)

**Acceptance Criteria**:
- [X] 5+ command examples documented across categories:
  - Deploy: "deploy the todo app" → `helm install ...`
  - Status: "show all pods" → `kubectl get pods -n todo-app`
  - Scale: "scale backend to 3 replicas" → `kubectl scale ...`
  - Troubleshoot: "why is pod crashing?" → `kubectl logs ...` + `kubectl describe ...`
  - Config: "show environment variables" → `kubectl get configmap ...`
- [X] Each example has manual kubectl/helm equivalent
- [X] Side-by-side comparison for at least 1 full operation cycle
- [ ] All commands tested and verified working

---

### T054: Finalize Documentation and Setup Guide

**Priority**: P2 | **Dependencies**: T051, T053 | **Spec Ref**: Parent spec FR-012, SC-008

**Description**: Complete the `docs/k8s-setup-guide.md` with all sections: prerequisites, Minikube setup, Docker build commands, Helm deployment, AIOps usage, troubleshooting, and quick reference. Ensure a developer can go from zero to running app by following the guide.

**Files to create/modify**:
- `docs/k8s-setup-guide.md` (FINALIZED)

**Acceptance Criteria**:
- [X] Prerequisites section with exact version requirements
- [X] Step-by-step: install tools → start Minikube → build images → load images → helm install → verify
- [X] Quick start command sequence (minimal steps, copy-paste ready)
- [X] Troubleshooting section with 3+ common issues and resolutions
- [X] AIOps section clearly marked as optional
- [ ] All commands tested on clean environment
- [ ] Developer can go from zero to running app in <15 minutes (excluding download time)

**Verification**:
```bash
# Follow guide from scratch on clean Minikube
minikube delete  # Start fresh
# Follow docs/k8s-setup-guide.md step by step
# Time the process — should be <15 min excluding downloads
```

---

## Task Summary

| Task | Title | Priority | Dependencies | Phase |
| ---- | ----- | -------- | ------------ | ----- |
| T041 | Backend Dockerfile | P1 | None | A: Containerization |
| T042 | Frontend Dockerfile | P1 | None | A: Containerization |
| T043 | Docker Compose | P2 | T041, T042 | A: Containerization |
| T044 | Minikube Cluster Setup | P1 | None | B: Minikube |
| T045 | Load Images to Minikube | P1 | T041, T042, T044 | B: Minikube |
| T046 | Helm Chart Structure | P1 | None | C: Helm |
| T047 | Backend Deployment + Service | P1 | T046 | C: Helm |
| T048 | Frontend Deployment + Service | P1 | T046 | C: Helm |
| T049 | ConfigMap + Secret + Values | P1 | T046 | C: Helm |
| T050 | NOTES.txt + Ingress + Lifecycle | P2 | T047, T048, T049 | C: Helm |
| T051 | E2E Verification on Minikube | P1 | T050 | D: Verification |
| T052 | AIOps Tools Setup | P3 | T044 | D: AIOps |
| T053 | AIOps Command Examples | P3 | T051, T052 | D: AIOps |
| T054 | Documentation + Setup Guide | P2 | T051, T053 | D: Documentation |

**Total**: 14 tasks | **P1**: 9 | **P2**: 3 | **P3**: 2

## Parallelization Opportunities

Tasks that can run simultaneously:
- **T041 + T042**: Both Dockerfiles are independent
- **T044**: Minikube setup can start while Dockerfiles are being written
- **T046**: Helm chart structure can start while Dockerfiles are being tested
- **T047 + T048 + T049**: All depend on T046 but are independent of each other
