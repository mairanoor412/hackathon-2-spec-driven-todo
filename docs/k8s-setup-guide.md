# Kubernetes Setup Guide: Todo AI Chatbot (Phase 4)

**Branch**: `005-local-k8s-deployment` | **Spec**: `@specs/features/local-kubernetes-deployment/spec.md`

This guide takes you from zero to a running Todo AI Chatbot on local Minikube Kubernetes.

---

## Prerequisites

| Tool | Min Version | Check Command | Install |
|------|-------------|---------------|---------|
| Docker | 20.10+ | `docker --version` | [docker.com](https://docs.docker.com/get-docker/) |
| kubectl | 1.28+ | `kubectl version --client` | See below |
| Minikube | 1.32+ | `minikube version` | See below |
| Helm | 3.14+ | `helm version` | See below |

### Install kubectl (Linux/WSL2)

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
kubectl version --client
```

### Install Minikube (Linux/WSL2)

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
chmod +x minikube-linux-amd64
sudo mv minikube-linux-amd64 /usr/local/bin/minikube
minikube version
```

### Install Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### macOS Alternative

```bash
brew install kubectl minikube helm
```

---

## Quick Start (Copy-Paste Ready)

```bash
# 1. Start Minikube cluster
minikube start --driver=docker --cpus=2 --memory=4096

# 2. Enable addons
minikube addons enable metrics-server
minikube addons enable ingress

# 3. Create namespace and set context
kubectl create namespace todo-app
kubectl config set-context --current --namespace=todo-app

# 4. Build Docker images
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# 5. Load images into Minikube
minikube image load todo-backend:latest
minikube image load todo-frontend:latest

# 6. Deploy with Helm (replace secrets with your values)
helm install todo-app ./k8s/todo-app -n todo-app \
  --set secrets.databaseUrl="YOUR_NEON_DB_URL" \
  --set secrets.betterAuthSecret="YOUR_AUTH_SECRET" \
  --set secrets.geminiApiKey="YOUR_GEMINI_KEY"

# 7. Wait for pods to be ready
kubectl wait --for=condition=Ready pods --all -n todo-app --timeout=120s

# 8. Access the application
minikube service todo-app-frontend -n todo-app
```

---

## Step-by-Step Guide

### Step 1: Start Minikube Cluster

```bash
# Verify Docker is running
docker info > /dev/null 2>&1 && echo "Docker OK" || echo "Start Docker first!"

# Start Minikube with recommended resources
minikube start \
  --driver=docker \
  --cpus=2 \
  --memory=4096 \
  --disk-size=20g \
  --kubernetes-version=stable

# Verify node is Ready
kubectl get nodes
```

**Expected output:**
```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1m    v1.xx.x
```

### Step 2: Enable Addons

```bash
minikube addons enable metrics-server
minikube addons enable ingress

# Verify
minikube addons list | grep -E "metrics-server|ingress"
```

### Step 3: Create Namespace

```bash
kubectl create namespace todo-app
kubectl config set-context --current --namespace=todo-app

# Verify
kubectl get namespace todo-app
kubectl config view --minify | grep namespace
```

### Step 4: Build Docker Images

```bash
# From the repository root:
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# Verify images
docker images | grep todo
```

### Step 5: Load Images into Minikube

```bash
# Method 1: minikube image load (recommended)
minikube image load todo-backend:latest
minikube image load todo-frontend:latest

# Verify
minikube image list | grep todo
```

**Alternative: Use Minikube's Docker daemon**
```bash
eval $(minikube docker-env)
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend
eval $(minikube docker-env -u)
```

### Step 6: Deploy with Helm

```bash
# Install the chart (override secrets with your actual values)
helm install todo-app ./k8s/todo-app -n todo-app \
  --set secrets.databaseUrl="postgresql://user:pass@host/db?sslmode=require" \
  --set secrets.betterAuthSecret="your-32-byte-secret" \
  --set secrets.geminiApiKey="your-gemini-api-key"

# Watch pods come up
kubectl get pods -n todo-app -w
```

### Step 7: Verify Deployment

```bash
# Check all pods are Running and Ready
kubectl get pods -n todo-app

# Check services
kubectl get svc -n todo-app

# Check Helm release status
helm status todo-app -n todo-app
```

### Step 8: Access the Application

```bash
# Get the frontend URL
minikube service todo-app-frontend -n todo-app --url

# Get the backend URL
minikube service todo-app-backend -n todo-app --url

# Or access directly via NodePort:
echo "Frontend: http://$(minikube ip):30300"
echo "Backend:  http://$(minikube ip):30800"
echo "API Docs: http://$(minikube ip):30800/docs"
```

---

## Helm Operations

### Upgrade

```bash
# Scale backend
helm upgrade todo-app ./k8s/todo-app -n todo-app --reuse-values \
  --set backend.replicaCount=2

# Update image
helm upgrade todo-app ./k8s/todo-app -n todo-app --reuse-values \
  --set backend.image.tag=v2
```

### Rollback

```bash
helm history todo-app -n todo-app
helm rollback todo-app -n todo-app
```

### Uninstall

```bash
helm uninstall todo-app -n todo-app
kubectl get all -n todo-app  # Verify clean
```

---

## Docker Compose (Alternative Local Testing)

If you just want to test containers without Kubernetes:

```bash
# Start both services
docker compose up -d

# Check status
docker compose ps

# Verify
curl http://localhost:8000/health
open http://localhost:3000

# Stop
docker compose down
```

---

## AIOps Tools (Optional)

AIOps tools are **optional enhancements**. Everything above works without them.

### Install kubectl-ai

```bash
# Via krew plugin manager
kubectl krew install ai

# Or standalone binary (Linux/WSL2)
curl -LO https://github.com/sozercan/kubectl-ai/releases/latest/download/kubectl-ai-linux-amd64
chmod +x kubectl-ai-linux-amd64
sudo mv kubectl-ai-linux-amd64 /usr/local/bin/kubectl-ai

# Configure API key
export OPENAI_API_KEY="your-api-key"

# Test
kubectl-ai "list all pods in todo-app namespace"
```

### Install Kagent

```bash
curl -fsSL https://raw.githubusercontent.com/kagent-dev/kagent/main/install.sh | bash
export KAGENT_API_KEY="your-api-key"

# Test
kagent "check cluster health"
```

### AIOps Command Examples

| # | AI Command | Manual Equivalent |
|---|-----------|-------------------|
| 1 | `kubectl-ai "deploy todo app with helm"` | `helm install todo-app ./k8s/todo-app -n todo-app` |
| 2 | `kubectl-ai "are all pods running?"` | `kubectl get pods -n todo-app` |
| 3 | `kubectl-ai "scale backend to 3 replicas"` | `kubectl scale deploy todo-app-backend --replicas=3 -n todo-app` |
| 4 | `kubectl-ai "why is the backend pod crashing?"` | `kubectl describe pod -l app.kubernetes.io/component=backend -n todo-app` |
| 5 | `kubectl-ai "show resource usage"` | `kubectl top pods -n todo-app` |
| 6 | `kubectl-ai "show backend logs"` | `kubectl logs -l app.kubernetes.io/component=backend -n todo-app` |
| 7 | `kubectl-ai "rollback helm release"` | `helm rollback todo-app -n todo-app` |

---

## Troubleshooting

### Minikube Won't Start

| Error | Cause | Fix |
|-------|-------|-----|
| `RSRC_INSUFFICIENT_CORES` | Not enough CPUs | Close VMs, reduce `--cpus=2` |
| `RSRC_INSUFFICIENT_REQ_MEMORY` | Not enough RAM | Close apps, reduce `--memory=2048` |
| Docker driver unavailable | Docker not running | `sudo systemctl start docker` |
| Port conflict | Another service on port | `lsof -i :<port>` to find and stop |

### Pods Not Starting

| Status | Cause | Fix |
|--------|-------|-----|
| `ImagePullBackOff` | Image not loaded | `minikube image load todo-backend:latest` |
| `CrashLoopBackOff` | App error at startup | `kubectl logs <pod-name> -n todo-app` |
| `Pending` | Insufficient resources | `kubectl describe pod <pod-name> -n todo-app` |
| `CreateContainerConfigError` | Missing Secret/ConfigMap | Check `helm install` had correct `--set` values |

### Application Issues

| Problem | Diagnosis | Fix |
|---------|-----------|-----|
| Frontend can't reach backend | Service networking | Verify services: `kubectl get svc -n todo-app` |
| Auth not working | Wrong BETTER_AUTH_SECRET | Ensure same secret in both frontend and backend |
| DB connection failed | Wrong DATABASE_URL | Check Neon DB URL is correct and accessible |
| Chatbot not responding | Missing GEMINI_API_KEY | Verify API key: `kubectl get secret -n todo-app -o yaml` |

### Cluster Reset

```bash
# Nuclear option: delete everything and start fresh
helm uninstall todo-app -n todo-app 2>/dev/null
kubectl delete namespace todo-app 2>/dev/null
minikube delete
# Then follow Quick Start from Step 1
```

---

## Reference

- **Specs**: `specs/features/local-kubernetes-deployment/spec.md`
- **Plan**: `specs/features/local-kubernetes-deployment/plan.md`
- **Tasks**: `specs/features/local-kubernetes-deployment/tasks.md`
- **Docker Spec**: `specs/k8s-infrastructure/Dockerization.md`
- **Minikube Spec**: `specs/k8s-infrastructure/Minikube-setup.md`
- **Helm Spec**: `specs/k8s-infrastructure/Helm-charts.md`
- **AIOps Spec**: `specs/k8s-infrastructure/AIOps-tools.md`
