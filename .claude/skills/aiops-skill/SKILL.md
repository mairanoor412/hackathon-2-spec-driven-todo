---
name: aiops-skill
description: AI-assisted Kubernetes operations using kubectl-ai and Kagent for the Todo AI Chatbot. Covers installation, natural language cluster commands, AI-powered deployment, scaling, troubleshooting, and diagnostics with manual kubectl/helm fallback for every operation. Use this skill for any AIOps task in Phase 4.
version: 1.0.0
author: Spec-Driven Development
tags:
  - aiops
  - kubectl-ai
  - kagent
  - kubernetes
  - troubleshooting
  - natural-language
  - ai-operations
  - phase4
  - minikube
---

# AIOps Skill

AI-assisted Kubernetes operations using kubectl-ai and Kagent for the Todo AI Chatbot Phase 4 deployment.

## When to Use This Skill

Use this skill when you need to:

- Install and configure kubectl-ai or Kagent
- Use natural language to run Kubernetes commands
- Deploy, verify, or manage the app using AI tools
- Scale deployments via natural language
- Troubleshoot pod crashes, service issues, or resource problems with AI assistance
- Generate or validate Kubernetes manifests using AI
- Get a comprehensive cluster health report
- Find the manual kubectl/helm equivalent for any AI-assisted command

## Prerequisites

- Minikube cluster running with Todo app deployed (see minikube-skill, helm-skill)
- kubectl configured and working (`kubectl get nodes`)
- AI provider API key (OpenAI or Gemini) for kubectl-ai and Kagent
- Internet connectivity for AI provider API calls

## Reference Specs

- `@specs/k8s-infrastructure/AIOps-tools.md` - Full AIOps specification
- `@specs/features/local-kubernetes-deployment/spec.md` - Parent feature spec
- `@specs/features/local-kubernetes-deployment/tasks.md` - Tasks T052-T053

## Important: AIOps Tools are Optional

All AIOps tools are **optional enhancements**. Every AI-assisted command documented here has a manual kubectl/helm equivalent. The entire Phase 4 deployment works without any AIOps tools.

## Step-by-Step Process

### Step 1: Install kubectl-ai

```bash
# Option A: Install via krew (kubectl plugin manager)
# Install krew first if needed: https://krew.sigs.k8s.io/docs/user-guide/setup/install/
kubectl krew install ai

# Option B: Install standalone binary (Linux/WSL2)
curl -LO https://github.com/sozercan/kubectl-ai/releases/latest/download/kubectl-ai-linux-amd64
chmod +x kubectl-ai-linux-amd64
sudo mv kubectl-ai-linux-amd64 /usr/local/bin/kubectl-ai

# Option C: macOS via Homebrew
brew install sozercan/tap/kubectl-ai

# Verify installation
kubectl-ai --version
```

### Step 2: Configure kubectl-ai API Key

```bash
# Set API key for OpenAI
export OPENAI_API_KEY="your-openai-api-key"

# OR set API key for alternative providers
export OPENAI_API_KEY="your-gemini-api-key"
export OPENAI_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/openai"

# Add to shell profile for persistence
echo 'export OPENAI_API_KEY="your-key"' >> ~/.bashrc
source ~/.bashrc
```

### Step 3: Install Kagent

```bash
# Install Kagent (check latest instructions at kagent.dev)
# Linux/WSL2:
curl -fsSL https://raw.githubusercontent.com/kagent-dev/kagent/main/install.sh | bash

# Verify installation
kagent version

# Configure API key
export KAGENT_API_KEY="your-api-key"
```

### Step 4: Verify Tools Work

```bash
# Test kubectl-ai
kubectl-ai "list all namespaces"
# Should show: Generated command: kubectl get namespaces
# Then execute on confirmation

# Test Kagent
kagent "check cluster health"
# Should report node status, system pods, resource usage
```

## AI-Assisted Command Examples

### Example 1: Deploy Application (Category: Deployment)

**AI Command:**
```bash
kubectl-ai "deploy the todo app using helm chart from ./k8s/todo-app in the todo-app namespace"
```

**Manual Equivalent:**
```bash
helm install todo-app ./k8s/todo-app -n todo-app \
  --set secrets.databaseUrl="your-db-url" \
  --set secrets.betterAuthSecret="your-secret" \
  --set secrets.geminiApiKey="your-key"
```

---

### Example 2: Check Deployment Status (Category: Status)

**AI Command:**
```bash
kubectl-ai "are all pods running and ready in the todo-app namespace?"
```

**Manual Equivalent:**
```bash
kubectl get pods -n todo-app -o wide
kubectl get pods -n todo-app -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\t"}{range .status.conditions[?(@.type=="Ready")]}{.status}{end}{"\n"}{end}'
```

---

### Example 3: Scale Deployment (Category: Scaling)

**AI Command:**
```bash
kubectl-ai "scale the backend deployment to 3 replicas in todo-app namespace"
```

**Manual Equivalent:**
```bash
kubectl scale deployment todo-app-backend --replicas=3 -n todo-app
# OR via Helm:
helm upgrade todo-app ./k8s/todo-app -n todo-app --reuse-values --set backend.replicaCount=3
```

---

### Example 4: View Logs (Category: Troubleshooting)

**AI Command:**
```bash
kubectl-ai "show me the last 50 lines of backend pod logs in todo-app namespace"
```

**Manual Equivalent:**
```bash
kubectl logs -l app.kubernetes.io/component=backend -n todo-app --tail=50
```

---

### Example 5: Troubleshoot Crashing Pod (Category: Troubleshooting)

**AI Command:**
```bash
kubectl-ai "why is the backend pod crashing in todo-app namespace? show events and logs"
```

**Manual Equivalent:**
```bash
# Get pod status
kubectl get pods -n todo-app
# Describe the pod for events
kubectl describe pod -l app.kubernetes.io/component=backend -n todo-app
# Get pod logs (including previous container if crashing)
kubectl logs -l app.kubernetes.io/component=backend -n todo-app --previous
```

---

### Example 6: Resource Usage (Category: Monitoring)

**AI Command:**
```bash
kubectl-ai "show CPU and memory usage for all pods in todo-app namespace"
```

**Manual Equivalent:**
```bash
kubectl top pods -n todo-app
kubectl top nodes
```

---

### Example 7: Service Endpoints (Category: Status)

**AI Command:**
```bash
kubectl-ai "list all services and their endpoints in todo-app namespace"
```

**Manual Equivalent:**
```bash
kubectl get svc -n todo-app
kubectl get endpoints -n todo-app
minikube service list -n todo-app
```

---

### Example 8: Generate Manifest (Category: Generation)

**AI Command:**
```bash
kubectl-ai "generate a Kubernetes deployment YAML for a Python FastAPI app on port 8000 with 2 replicas"
```

**Manual Equivalent:**
```bash
# Use kubectl create with --dry-run to generate YAML
kubectl create deployment fastapi-app \
  --image=todo-backend:latest \
  --replicas=2 \
  --port=8000 \
  --dry-run=client -o yaml
```

---

### Example 9: Full Health Report with Kagent (Category: Diagnostics)

**AI Command:**
```bash
kagent "give me a full health report of the todo-app namespace including pod status, resource usage, recent events, and any issues"
```

**Manual Equivalent:**
```bash
echo "=== Nodes ==="
kubectl get nodes -o wide
echo "=== Pods ==="
kubectl get pods -n todo-app -o wide
echo "=== Services ==="
kubectl get svc -n todo-app
echo "=== Resource Usage ==="
kubectl top pods -n todo-app 2>/dev/null || echo "metrics-server not ready"
echo "=== Recent Events ==="
kubectl get events -n todo-app --sort-by='.lastTimestamp' | tail -20
echo "=== Pod Descriptions ==="
kubectl describe pods -n todo-app | grep -A 5 "Warning\|Error\|CrashLoop\|OOMKilled"
```

---

### Example 10: Rollback Deployment (Category: Lifecycle)

**AI Command:**
```bash
kubectl-ai "rollback the todo-app helm release to the previous version"
```

**Manual Equivalent:**
```bash
helm history todo-app -n todo-app
helm rollback todo-app -n todo-app
```

## Troubleshooting Scenarios

### Scenario 1: Pod CrashLoopBackOff

**Symptom:** Backend pod keeps restarting, status shows `CrashLoopBackOff`

**AI Diagnosis:**
```bash
kubectl-ai "the backend pod is in CrashLoopBackOff in todo-app namespace, diagnose the issue"
# OR
kagent "why is the backend pod crashing repeatedly?"
```

**Manual Diagnosis:**
```bash
# Check pod events
kubectl describe pod -l app.kubernetes.io/component=backend -n todo-app | grep -A 20 "Events:"
# Check container logs
kubectl logs -l app.kubernetes.io/component=backend -n todo-app --previous
# Common causes: missing env vars, database unreachable, port conflict
```

**Common Fixes:**
- Missing `DATABASE_URL`: Check Secret has correct value
- Missing `GEMINI_API_KEY`: Update Helm values and upgrade
- Port conflict: Check no other process on port 8000

---

### Scenario 2: Service Unreachable

**Symptom:** Frontend loads but can't reach backend API, or browser can't reach frontend

**AI Diagnosis:**
```bash
kubectl-ai "I can't access the frontend service, help me diagnose connectivity"
# OR
kagent "check why the frontend service is not accessible from outside"
```

**Manual Diagnosis:**
```bash
# Check service exists and has endpoints
kubectl get svc -n todo-app
kubectl get endpoints -n todo-app
# Check pods are ready
kubectl get pods -n todo-app
# Test from within cluster
kubectl run debug --image=alpine -it --rm -n todo-app -- wget -qO- http://todo-app-frontend:3000/
# Get NodePort URL
minikube service todo-app-frontend -n todo-app --url
```

---

### Scenario 3: Pods Stuck in Pending

**Symptom:** Pods stay in `Pending` state after deployment

**AI Diagnosis:**
```bash
kubectl-ai "pods are stuck in Pending state in todo-app namespace, what's wrong?"
```

**Manual Diagnosis:**
```bash
# Check events for scheduling issues
kubectl describe pod -l app.kubernetes.io/component=backend -n todo-app | grep -A 10 "Events:"
# Check node resources
kubectl describe node minikube | grep -A 10 "Allocated resources"
kubectl top nodes
# Common cause: insufficient CPU/memory
# Fix: increase Minikube resources
minikube stop
minikube start --cpus=4 --memory=6144
```

## Safety: Confirm Before Execute

kubectl-ai operates in **confirm-before-execute** mode by default:

1. You type a natural language query
2. kubectl-ai generates the kubectl command
3. It **displays** the command and asks for confirmation
4. Only executes after you confirm

**Never bypass confirmation for destructive commands** like:
- `kubectl delete`
- `kubectl scale --replicas=0`
- `helm uninstall`
- `kubectl drain`

## Side-by-Side Workflow Comparison

### Deploy-Verify-Scale-Troubleshoot Cycle

| Step | AI-Assisted | Manual |
|------|-------------|--------|
| Deploy | `kubectl-ai "deploy todo app with helm"` | `helm install todo-app ./k8s/todo-app -n todo-app` |
| Verify | `kubectl-ai "are all pods running?"` | `kubectl get pods -n todo-app` |
| Access | `kubectl-ai "how do I access the frontend?"` | `minikube service todo-app-frontend -n todo-app --url` |
| Scale | `kubectl-ai "scale backend to 2 replicas"` | `kubectl scale deploy todo-app-backend --replicas=2 -n todo-app` |
| Monitor | `kubectl-ai "show resource usage"` | `kubectl top pods -n todo-app` |
| Debug | `kubectl-ai "why is pod crashing?"` | `kubectl describe pod <name> -n todo-app && kubectl logs <name> -n todo-app` |
| Rollback | `kubectl-ai "rollback helm release"` | `helm rollback todo-app -n todo-app` |
| Cleanup | `kubectl-ai "uninstall todo app"` | `helm uninstall todo-app -n todo-app` |

## Troubleshooting Tool Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `OPENAI_API_KEY not set` | Missing API key | `export OPENAI_API_KEY="your-key"` |
| Rate limit / quota error | API quota exhausted | Wait or use manual kubectl commands |
| kubectl-ai not found | Not installed | Reinstall via krew or binary |
| Kagent can't connect | Wrong kubeconfig | `kubectl config use-context minikube` |
| Timeout on AI response | Network issue | Check internet, retry, or use manual commands |
| Wrong command generated | Ambiguous query | Be more specific, e.g., "in todo-app namespace" |
| Permission denied | RBAC restrictions | Use manual kubectl with appropriate context |

## Acceptance Criteria

- [ ] kubectl-ai installed and verified with a simple query
- [ ] Kagent installed and verified with cluster health check
- [ ] 5+ distinct AI command examples documented and working
- [ ] Every AI example has a manual kubectl/helm equivalent
- [ ] 3+ troubleshooting scenarios documented with AI diagnosis
- [ ] AI tools demonstrate manifest generation/validation
- [ ] Confirm-before-execute behavior verified for destructive commands
- [ ] All operations complete within 30 seconds
- [ ] Full deploy-verify-scale-troubleshoot cycle works with AI tools
- [ ] Everything works without AIOps tools (manual fallback)

## Related Skills

- `docker-skill` - Build container images
- `minikube-skill` - Manage the Minikube cluster
- `helm-skill` - Manage Helm chart lifecycle
