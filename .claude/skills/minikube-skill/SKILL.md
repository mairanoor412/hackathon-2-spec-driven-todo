---
name: minikube-skill
description: Start, stop, and configure Minikube local Kubernetes cluster for the Todo AI Chatbot. Handles cluster lifecycle, namespace creation, addon management, Docker image loading, and cluster verification. Use this skill for any Minikube cluster management task in Phase 4.
version: 1.0.0
author: Spec-Driven Development
tags:
  - minikube
  - kubernetes
  - kubectl
  - cluster
  - namespace
  - docker-driver
  - phase4
  - local-deployment
---

# Minikube Skill

Start, stop, and configure a local Minikube Kubernetes cluster for the Todo AI Chatbot Phase 4 deployment.

## When to Use This Skill

Use this skill when you need to:

- Install or verify Minikube and kubectl prerequisites
- Start, stop, restart, or delete a Minikube cluster
- Create and configure the `todo-app` Kubernetes namespace
- Enable or disable Minikube addons (metrics-server, ingress)
- Load locally-built Docker images into the Minikube environment
- Configure shell to use Minikube's Docker daemon
- Verify cluster health and readiness for Helm deployment
- Troubleshoot cluster startup or resource issues
- Set kubectl context to the correct cluster and namespace

## Prerequisites

- Docker Engine or Docker Desktop running (`docker info` succeeds)
- Minimum system resources: 2 CPUs, 4GB RAM free, 20GB disk space
- Platform: Linux/WSL2 (primary), macOS (secondary)

## Reference Specs

- `@specs/k8s-infrastructure/Minikube-setup.md` - Full Minikube specification
- `@specs/features/local-kubernetes-deployment/spec.md` - Parent feature spec
- `@specs/features/local-kubernetes-deployment/tasks.md` - Tasks T044-T045

## Step-by-Step Process

### Step 1: Install Prerequisites

```bash
# Check Docker
docker --version    # Requires Docker 20.10+
docker info         # Must be running

# Install kubectl (if not present)
# Linux/WSL2:
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify kubectl
kubectl version --client

# Install Minikube (if not present)
# Linux/WSL2:
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
chmod +x minikube-linux-amd64
sudo mv minikube-linux-amd64 /usr/local/bin/minikube

# macOS:
brew install minikube

# Verify Minikube
minikube version

# Install Helm (if not present)
# Linux/WSL2:
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# macOS:
brew install helm

# Verify Helm
helm version
```

### Step 2: Start Minikube Cluster

```bash
# Start with recommended configuration for Todo AI Chatbot
minikube start \
  --driver=docker \
  --cpus=2 \
  --memory=4096 \
  --disk-size=20g \
  --kubernetes-version=stable

# Verify node is Ready
kubectl get nodes
# Expected: minikube   Ready   control-plane   ...
```

### Step 3: Enable Required Addons

```bash
# Enable metrics-server for resource monitoring
minikube addons enable metrics-server

# Enable ingress for optional external access
minikube addons enable ingress

# Verify addons
minikube addons list | grep -E "metrics-server|ingress"
```

### Step 4: Create Application Namespace

```bash
# Create the todo-app namespace
kubectl create namespace todo-app

# Set as default namespace for kubectl
kubectl config set-context --current --namespace=todo-app

# Verify namespace
kubectl get namespace todo-app
kubectl config view --minify | grep namespace
```

### Step 5: Load Docker Images into Minikube

```bash
# Build images first (see docker-skill)
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# Load images into Minikube's internal registry
minikube image load todo-backend:latest
minikube image load todo-frontend:latest

# Verify images are available in Minikube
minikube image list | grep todo
# Expected:
# docker.io/library/todo-backend:latest
# docker.io/library/todo-frontend:latest
```

**Alternative: Use Minikube's Docker daemon directly:**

```bash
# Configure shell to use Minikube's Docker daemon
eval $(minikube docker-env)

# Now docker build puts images directly into Minikube
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# Reset to host Docker daemon when done
eval $(minikube docker-env -u)
```

### Step 6: Verify Cluster Readiness

```bash
# Check all system pods are running
kubectl get pods -n kube-system

# Verify core components
kubectl get componentstatuses 2>/dev/null || kubectl get --raw /readyz

# Check cluster info
kubectl cluster-info

# Run a test pod to verify scheduling works
kubectl run test-nginx --image=nginx:alpine --restart=Never -n todo-app
kubectl wait --for=condition=Ready pod/test-nginx -n todo-app --timeout=60s
kubectl delete pod test-nginx -n todo-app

# Verify Helm can communicate with cluster
helm list -n todo-app
```

## Common Commands

### Cluster Lifecycle
```bash
# Start cluster
minikube start --driver=docker --cpus=2 --memory=4096

# Check cluster status
minikube status

# Stop cluster (preserves state)
minikube stop

# Restart cluster
minikube start    # resumes existing cluster

# Delete cluster entirely
minikube delete

# Delete all clusters and profiles
minikube delete --all
```

### Namespace Management
```bash
# List namespaces
kubectl get namespaces

# Create namespace
kubectl create namespace todo-app

# Switch default namespace
kubectl config set-context --current --namespace=todo-app

# Delete namespace (removes ALL resources in it)
kubectl delete namespace todo-app
```

### Image Management
```bash
# Load image into Minikube
minikube image load todo-backend:latest
minikube image load todo-frontend:latest

# List images in Minikube
minikube image list | grep todo

# Remove image from Minikube
minikube image rm docker.io/library/todo-backend:latest

# Use Minikube's Docker daemon
eval $(minikube docker-env)
# ... build images ...
eval $(minikube docker-env -u)
```

### Addon Management
```bash
# List all addons
minikube addons list

# Enable addon
minikube addons enable metrics-server
minikube addons enable ingress

# Disable addon
minikube addons disable ingress
```

### Debugging & Info
```bash
# Cluster info
kubectl cluster-info
minikube status

# Resource usage (requires metrics-server)
kubectl top nodes
kubectl top pods -n todo-app

# Minikube logs (for cluster-level issues)
minikube logs

# SSH into Minikube node
minikube ssh

# Open Kubernetes dashboard
minikube dashboard
```

### Accessing Services
```bash
# Get NodePort URL for a service
minikube service <service-name> -n todo-app --url

# Start tunnel for LoadBalancer services
minikube tunnel

# Get Minikube IP
minikube ip
```

## Resource Configuration

| Parameter | Recommended | Minimum | Notes |
|-----------|-------------|---------|-------|
| CPUs | 2 | 2 | For frontend + backend pods |
| Memory | 4096MB | 2048MB | 4GB recommended for comfortable operation |
| Disk | 20GB | 10GB | For images and cluster data |
| Driver | docker | docker | Consistent with containerization approach |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `minikube start` fails | Docker not running | Start Docker Desktop or `sudo systemctl start docker` |
| `Exiting due to RSRC_INSUFFICIENT_CORES` | Not enough CPUs | Close other VMs, reduce `--cpus` to 2 |
| `Exiting due to RSRC_INSUFFICIENT_REQ_MEMORY` | Not enough RAM | Close apps, reduce `--memory` to 2048 |
| Node stuck in `NotReady` | Cluster still initializing | Wait 2 min, check `minikube logs` |
| `ImagePullBackOff` for local images | Images not loaded | Run `minikube image load <image>` |
| `imagePullPolicy: Always` pulling from registry | Default pull policy | Set `imagePullPolicy: IfNotPresent` in Helm values |
| kubectl can't connect | Wrong context | Run `kubectl config use-context minikube` |
| Addons not starting | Resource limits | Increase memory: `minikube start --memory=4096` |
| Port already in use | Another process on port | Find with `lsof -i :<port>` and stop it |

## Quick Start (Zero to Cluster)

```bash
# 1. Start cluster
minikube start --driver=docker --cpus=2 --memory=4096

# 2. Enable addons
minikube addons enable metrics-server
minikube addons enable ingress

# 3. Create namespace and set context
kubectl create namespace todo-app
kubectl config set-context --current --namespace=todo-app

# 4. Build and load images
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend
minikube image load todo-backend:latest
minikube image load todo-frontend:latest

# 5. Verify
kubectl get nodes           # Node: Ready
minikube image list | grep todo  # Images loaded
helm version                # Helm working
echo "Cluster ready for Helm deployment!"
```

## Acceptance Criteria

- [ ] Minikube starts with Docker driver, 2 CPUs, 4GB RAM
- [ ] Node reaches "Ready" status within 2 minutes
- [ ] `todo-app` namespace created and set as default
- [ ] metrics-server and ingress addons enabled
- [ ] Both Docker images loaded into Minikube
- [ ] `minikube image list` shows both todo-backend and todo-frontend
- [ ] Test pod can be scheduled and run successfully
- [ ] Helm can communicate with the cluster
- [ ] Cluster stops and restarts without data loss
- [ ] kubectl context correctly targets minikube/todo-app

## Related Skills

- `docker-skill` - Build container images before loading into Minikube
- `helm-skill` - Deploy application to the running cluster
- `aiops-skill` - AI-assisted cluster health checks
