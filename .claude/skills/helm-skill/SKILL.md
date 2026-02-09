---
name: helm-skill
description: Create, install, upgrade, rollback, and uninstall Helm charts for the Todo AI Chatbot on Kubernetes. Generates Chart.yaml, values.yaml, deployment/service/configmap/secret templates, NOTES.txt, and manages the full Helm lifecycle. Use this skill for any Helm chart task in Phase 4.
version: 1.0.0
author: Spec-Driven Development
tags:
  - helm
  - helm-charts
  - kubernetes
  - deployment
  - service
  - configmap
  - secret
  - values
  - phase4
  - minikube
---

# Helm Skill

Create, install, upgrade, rollback, and uninstall Helm charts for the Todo AI Chatbot Kubernetes deployment.

## When to Use This Skill

Use this skill when you need to:

- Create the Helm chart directory structure (`k8s/todo-app/`)
- Write Chart.yaml, values.yaml, .helmignore
- Create Kubernetes Deployment templates for frontend/backend
- Create Service templates (NodePort/ClusterIP)
- Create ConfigMap and Secret templates for environment variables
- Write NOTES.txt with post-install instructions
- Create optional Ingress template
- Write `_helpers.tpl` for shared template helpers
- Run `helm install`, `helm upgrade`, `helm rollback`, `helm uninstall`
- Validate charts with `helm lint` and `helm template`
- Debug Helm deployment issues

## Prerequisites

- Helm 3+ installed (`helm version`)
- Minikube cluster running with `todo-app` namespace (see minikube-skill)
- Docker images built and loaded into Minikube (see docker-skill)
- kubectl configured to target minikube/todo-app

## Reference Specs

- `@specs/k8s-infrastructure/Helm-charts.md` - Full Helm chart specification
- `@specs/features/local-kubernetes-deployment/spec.md` - Parent feature spec
- `@specs/features/local-kubernetes-deployment/tasks.md` - Tasks T046-T050

## Chart Directory Structure

```
k8s/
  todo-app/
    Chart.yaml
    values.yaml
    .helmignore
    templates/
      _helpers.tpl
      backend-deployment.yaml
      backend-service.yaml
      frontend-deployment.yaml
      frontend-service.yaml
      configmap.yaml
      secret.yaml
      ingress.yaml          # Optional, disabled by default
      NOTES.txt
```

## Step-by-Step Process

### Step 1: Create Chart.yaml

```yaml
# k8s/todo-app/Chart.yaml
apiVersion: v2
name: todo-app
description: Todo AI Chatbot - Phase 4 Local Kubernetes Deployment
type: application
version: 0.1.0
appVersion: "1.0.0"
maintainers:
  - name: Panaversity Hackathon Team
keywords:
  - todo
  - chatbot
  - fastapi
  - nextjs
  - ai
```

### Step 2: Create values.yaml

```yaml
# k8s/todo-app/values.yaml

# -- Global settings
nameOverride: ""
fullnameOverride: ""
namespace: todo-app

# -- Backend configuration
backend:
  # -- Number of backend replicas
  replicaCount: 1
  image:
    # -- Backend container image repository
    repository: todo-backend
    # -- Backend image tag
    tag: latest
    # -- Image pull policy (use IfNotPresent for local images)
    pullPolicy: IfNotPresent
  service:
    # -- Backend service type
    type: NodePort
    # -- Backend container port
    port: 8000
    # -- Backend NodePort (30000-32767 range)
    nodePort: 30800
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  # -- Backend liveness probe
  livenessProbe:
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 15
    periodSeconds: 30
    timeoutSeconds: 5
    failureThreshold: 3
  # -- Backend readiness probe
  readinessProbe:
    httpGet:
      path: /health
      port: 8000
    initialDelaySeconds: 10
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3

# -- Frontend configuration
frontend:
  # -- Number of frontend replicas
  replicaCount: 1
  image:
    # -- Frontend container image repository
    repository: todo-frontend
    # -- Frontend image tag
    tag: latest
    # -- Image pull policy (use IfNotPresent for local images)
    pullPolicy: IfNotPresent
  service:
    # -- Frontend service type
    type: NodePort
    # -- Frontend container port
    port: 3000
    # -- Frontend NodePort (30000-32767 range)
    nodePort: 30300
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  # -- Frontend liveness probe
  livenessProbe:
    httpGet:
      path: /
      port: 3000
    initialDelaySeconds: 20
    periodSeconds: 30
    timeoutSeconds: 5
    failureThreshold: 3
  # -- Frontend readiness probe
  readinessProbe:
    httpGet:
      path: /
      port: 3000
    initialDelaySeconds: 15
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3

# -- Environment variables (non-sensitive, stored in ConfigMap)
config:
  corsOrigins: "http://localhost:3000"
  betterAuthUrl: "http://localhost:3000"
  nextPublicApiUrl: "http://localhost:8000"
  nextPublicBetterAuthUrl: "http://localhost:3000"

# -- Secrets (sensitive, stored in Kubernetes Secret)
# Override these during helm install with --set or a secrets values file
secrets:
  databaseUrl: "CHANGE_ME"
  betterAuthSecret: "CHANGE_ME"
  geminiApiKey: "CHANGE_ME"

# -- Ingress configuration (optional, disabled by default)
ingress:
  enabled: false
  className: nginx
  hosts:
    - host: todo.local
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend
        - path: /health
          pathType: Prefix
          service: backend
```

### Step 3: Create _helpers.tpl

```yaml
{{/* k8s/todo-app/templates/_helpers.tpl */}}

{{/*
Chart name
*/}}
{{- define "todo-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Fully qualified app name
*/}}
{{- define "todo-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-app.labels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "todo-app.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}-backend
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "todo-app.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end }}
```

### Step 4: Create Backend Deployment + Service

**backend-deployment.yaml:**

```yaml
# k8s/todo-app/templates/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-app.fullname" . }}-backend
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: backend
spec:
  replicas: {{ .Values.backend.replicaCount }}
  selector:
    matchLabels:
      {{- include "todo-app.backend.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "todo-app.backend.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: backend
          image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
          imagePullPolicy: {{ .Values.backend.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.backend.service.port }}
              protocol: TCP
          envFrom:
            - configMapRef:
                name: {{ include "todo-app.fullname" . }}-config
            - secretRef:
                name: {{ include "todo-app.fullname" . }}-secret
          livenessProbe:
            {{- toYaml .Values.backend.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.backend.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.backend.resources | nindent 12 }}
```

**backend-service.yaml:**

```yaml
# k8s/todo-app/templates/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "todo-app.fullname" . }}-backend
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: backend
spec:
  type: {{ .Values.backend.service.type }}
  ports:
    - port: {{ .Values.backend.service.port }}
      targetPort: {{ .Values.backend.service.port }}
      {{- if and (eq .Values.backend.service.type "NodePort") .Values.backend.service.nodePort }}
      nodePort: {{ .Values.backend.service.nodePort }}
      {{- end }}
      protocol: TCP
      name: http
  selector:
    {{- include "todo-app.backend.selectorLabels" . | nindent 4 }}
```

### Step 5: Create Frontend Deployment + Service

**frontend-deployment.yaml:**

```yaml
# k8s/todo-app/templates/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-app.fullname" . }}-frontend
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
spec:
  replicas: {{ .Values.frontend.replicaCount }}
  selector:
    matchLabels:
      {{- include "todo-app.frontend.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "todo-app.frontend.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: frontend
          image: "{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
          imagePullPolicy: {{ .Values.frontend.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.frontend.service.port }}
              protocol: TCP
          envFrom:
            - configMapRef:
                name: {{ include "todo-app.fullname" . }}-config
            - secretRef:
                name: {{ include "todo-app.fullname" . }}-secret
          livenessProbe:
            {{- toYaml .Values.frontend.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.frontend.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.frontend.resources | nindent 12 }}
```

**frontend-service.yaml:**

```yaml
# k8s/todo-app/templates/frontend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "todo-app.fullname" . }}-frontend
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
spec:
  type: {{ .Values.frontend.service.type }}
  ports:
    - port: {{ .Values.frontend.service.port }}
      targetPort: {{ .Values.frontend.service.port }}
      {{- if and (eq .Values.frontend.service.type "NodePort") .Values.frontend.service.nodePort }}
      nodePort: {{ .Values.frontend.service.nodePort }}
      {{- end }}
      protocol: TCP
      name: http
  selector:
    {{- include "todo-app.frontend.selectorLabels" . | nindent 4 }}
```

### Step 6: Create ConfigMap + Secret

**configmap.yaml:**

```yaml
# k8s/todo-app/templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "todo-app.fullname" . }}-config
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
data:
  CORS_ORIGINS: {{ .Values.config.corsOrigins | quote }}
  BETTER_AUTH_URL: {{ .Values.config.betterAuthUrl | quote }}
  NEXT_PUBLIC_API_URL: {{ .Values.config.nextPublicApiUrl | quote }}
  NEXT_PUBLIC_BETTER_AUTH_URL: {{ .Values.config.nextPublicBetterAuthUrl | quote }}
```

**secret.yaml:**

```yaml
# k8s/todo-app/templates/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "todo-app.fullname" . }}-secret
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
type: Opaque
data:
  DATABASE_URL: {{ .Values.secrets.databaseUrl | b64enc | quote }}
  BETTER_AUTH_SECRET: {{ .Values.secrets.betterAuthSecret | b64enc | quote }}
  GEMINI_API_KEY: {{ .Values.secrets.geminiApiKey | b64enc | quote }}
```

### Step 7: Create NOTES.txt

```
{{/* k8s/todo-app/templates/NOTES.txt */}}
=============================================================
  Todo AI Chatbot - Phase 4 Local Kubernetes Deployment
=============================================================

Your application has been deployed! Here's how to access it:

{{- if eq .Values.frontend.service.type "NodePort" }}

Frontend (Web UI):
  export MINIKUBE_IP=$(minikube ip)
  echo "http://$MINIKUBE_IP:{{ .Values.frontend.service.nodePort }}"

Backend (API):
  echo "http://$MINIKUBE_IP:{{ .Values.backend.service.nodePort }}"
  echo "Health: http://$MINIKUBE_IP:{{ .Values.backend.service.nodePort }}/health"
  echo "Docs: http://$MINIKUBE_IP:{{ .Values.backend.service.nodePort }}/docs"

Or use minikube service:
  minikube service {{ include "todo-app.fullname" . }}-frontend -n {{ .Values.namespace }}
  minikube service {{ include "todo-app.fullname" . }}-backend -n {{ .Values.namespace }}
{{- end }}

Useful commands:
  # Check pod status
  kubectl get pods -n {{ .Values.namespace }}

  # View logs
  kubectl logs -l app.kubernetes.io/component=backend -n {{ .Values.namespace }}
  kubectl logs -l app.kubernetes.io/component=frontend -n {{ .Values.namespace }}

  # Upgrade release
  helm upgrade {{ .Release.Name }} ./k8s/todo-app -n {{ .Values.namespace }}

  # Uninstall
  helm uninstall {{ .Release.Name }} -n {{ .Values.namespace }}
=============================================================
```

### Step 8: Create Ingress (Optional)

```yaml
# k8s/todo-app/templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "todo-app.fullname" . }}-ingress
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: {{ .Values.ingress.className }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "todo-app.fullname" $ }}-{{ .service }}
                port:
                  number: {{ if eq .service "frontend" }}{{ $.Values.frontend.service.port }}{{ else }}{{ $.Values.backend.service.port }}{{ end }}
          {{- end }}
    {{- end }}
{{- end }}
```

### Step 9: Create .helmignore

```
# k8s/todo-app/.helmignore
.git
.gitignore
.DS_Store
*.md
*.txt.bak
tests/
```

## Common Commands

### Validate
```bash
# Lint the chart
helm lint ./k8s/todo-app

# Render templates locally (dry-run)
helm template todo-app ./k8s/todo-app -n todo-app

# Render with custom values
helm template todo-app ./k8s/todo-app -n todo-app \
  --set secrets.databaseUrl="postgresql://..." \
  --set secrets.betterAuthSecret="my-secret" \
  --set secrets.geminiApiKey="my-key"
```

### Install
```bash
# Install with secrets overridden via --set
helm install todo-app ./k8s/todo-app -n todo-app \
  --set secrets.databaseUrl="your-neon-db-url" \
  --set secrets.betterAuthSecret="your-auth-secret" \
  --set secrets.geminiApiKey="your-gemini-key"

# Install with a secrets override file
helm install todo-app ./k8s/todo-app -n todo-app \
  -f ./k8s/secrets-values.yaml

# Verify deployment
kubectl get pods -n todo-app
kubectl get svc -n todo-app
helm status todo-app -n todo-app
```

### Upgrade
```bash
# Scale backend to 2 replicas
helm upgrade todo-app ./k8s/todo-app -n todo-app \
  --set backend.replicaCount=2

# Update image tag
helm upgrade todo-app ./k8s/todo-app -n todo-app \
  --set backend.image.tag=v2

# Upgrade with full values reapplied
helm upgrade todo-app ./k8s/todo-app -n todo-app --reuse-values \
  --set frontend.replicaCount=2
```

### Rollback
```bash
# View revision history
helm history todo-app -n todo-app

# Rollback to previous revision
helm rollback todo-app -n todo-app

# Rollback to specific revision
helm rollback todo-app 1 -n todo-app
```

### Uninstall
```bash
# Uninstall release
helm uninstall todo-app -n todo-app

# Verify cleanup
kubectl get all -n todo-app
```

### Status & Debug
```bash
# Release status
helm status todo-app -n todo-app

# Release history
helm history todo-app -n todo-app

# Get rendered manifests from installed release
helm get manifest todo-app -n todo-app

# Get values used in release
helm get values todo-app -n todo-app
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `helm lint` fails | Template syntax error | Check `helm template` output for details |
| `ImagePullBackOff` | Image not in Minikube | `minikube image load todo-backend:latest` |
| `CrashLoopBackOff` | Missing env vars or bad config | `kubectl logs <pod>` and check Secret/ConfigMap |
| `Pending` pods | Insufficient resources | Increase Minikube memory or reduce resource requests |
| Release already exists | Duplicate `helm install` | Use `helm upgrade` or `helm uninstall` first |
| Secret values visible in plain text | Using `--set` on command line | Use `-f secrets-values.yaml` file instead |
| NodePort not accessible | Minikube IP issue | Use `minikube service <svc> --url` |
| Pods don't pick up ConfigMap changes | No restart trigger | Delete pods or add annotation hash to trigger rollout |

## Acceptance Criteria

- [ ] `helm lint ./k8s/todo-app` passes with zero errors
- [ ] `helm install` deploys both pods to Running/Ready within 2 minutes
- [ ] Frontend accessible via NodePort (login page loads)
- [ ] Backend health check responds at NodePort
- [ ] Full app works: auth, task CRUD, AI chatbot
- [ ] `helm upgrade` with changed replica count takes effect within 60s
- [ ] `helm rollback` restores previous working state
- [ ] `helm uninstall` removes all resources cleanly
- [ ] values.yaml has 15+ documented configurable parameters
- [ ] All resources have Helm standard labels
- [ ] NOTES.txt shows access instructions after install

## Related Skills

- `docker-skill` - Build container images referenced by the chart
- `minikube-skill` - Set up the cluster where chart is deployed
- `aiops-skill` - AI-assisted Helm operations
