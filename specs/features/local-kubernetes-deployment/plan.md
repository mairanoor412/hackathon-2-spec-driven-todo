# Implementation Plan: Local Kubernetes Deployment (Phase 4)

**Branch**: `005-local-k8s-deployment` | **Date**: 2026-02-07 | **Spec**: `@specs/features/local-kubernetes-deployment/spec.md`
**Input**: Feature specification + 4 sub-specs in `@specs/k8s-infrastructure/`

## Summary

Containerize the Phase 3 Todo AI Chatbot (Next.js frontend + FastAPI backend) using Docker multi-stage builds, deploy to a local Minikube Kubernetes cluster via Helm Charts, and integrate AIOps tools (kubectl-ai, Kagent) for AI-assisted cluster operations. The external Neon PostgreSQL database is retained — no local DB pod is needed. All Phase 3 functionality (auth, CRUD, AI chatbot) must work identically on Minikube.

## Technical Context

**Language/Version**: Python 3.13+ (backend), Node.js 22 LTS (frontend), Bash (scripts/docs)
**Primary Dependencies**: Docker, Minikube, Helm 3+, kubectl, kubectl-ai, Kagent
**Storage**: External Neon PostgreSQL (no changes from Phase 3)
**Testing**: `helm lint`, `kubectl get pods`, `docker run` smoke tests, manual e2e verification
**Target Platform**: Minikube on Linux/WSL2 (Docker driver), macOS secondary
**Project Type**: Web application (frontend + backend containers)
**Performance Goals**: Container startup <30s, API p95 <1s, Memory per pod <512MB (per Constitution IX)
**Constraints**: No new app features, no cloud services, no external registry, no code changes beyond `next.config.ts` standalone output
**Scale/Scope**: Single-node Minikube, 2 pods (frontend + backend), 1 Helm chart

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Spec-Driven Development | PASS | All specs created via `/sp.specify`; infrastructure files (Dockerfiles, Helm templates) are configuration, not business logic |
| II. Iterative Refinement | PASS | Plan follows spec → plan → tasks → implement workflow |
| III. Reusability & Modularity | PASS | No application code changes; Helm chart is reusable for Phase 5 cloud deployment |
| IV. Phase-wise Progression | PASS | Phase 3 acceptance gate passed; Phase 4 builds on existing codebase without breaking features |
| V. Traceability | PASS | All commits will reference `@specs/features/local-kubernetes-deployment/spec.md` |
| VI. Clean & Testable Code | PASS | Phase 4 testing: `helm lint` passes, pods healthy, e2e manual verification |
| VII. Security | PASS | No secrets in images (FR-004/006), non-root containers (FR-014/015), Secrets via K8s Secret resource |
| VIII. Documentation-First | PASS | All 5 specs written before implementation; setup guide included (FR-012) |
| IX. Performance & Scalability | PASS | Container startup <30s, memory <512MB per constitution targets |
| X. Error Handling & Observability | PASS | Health endpoint `/health` exists, readiness/liveness probes defined, logs to stdout |

**Gate Result**: ALL PASS — proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/features/local-kubernetes-deployment/
├── spec.md              # Parent feature specification
├── plan.md              # This file
├── tasks.md             # Task list (generated next via /sp.tasks)
└── checklists/
    └── requirements.md  # Quality checklist

specs/k8s-infrastructure/
├── Dockerization.md     # Container image specifications
├── Minikube-setup.md    # Cluster setup specifications
├── Helm-charts.md       # Helm chart specifications
├── AIOps-tools.md       # AI operations specifications
└── checklists/
    ├── requirements.md
    ├── minikube-setup-requirements.md
    ├── helm-charts-requirements.md
    └── aiops-tools-requirements.md
```

### Source Code (new files for Phase 4)

```text
todo-app/
├── backend/
│   ├── Dockerfile           # NEW: Multi-stage build for FastAPI
│   └── .dockerignore        # NEW: Exclude venv, __pycache__, .env
├── frontend/
│   ├── Dockerfile           # NEW: Multi-stage build for Next.js standalone
│   ├── .dockerignore        # NEW: Exclude node_modules, .next, .env
│   └── next.config.ts       # MODIFIED: Add output: "standalone"
├── docker-compose.yml       # NEW: Local multi-container orchestration
├── k8s/                     # NEW: Kubernetes deployment directory
│   └── todo-app/            # Helm chart
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── .helmignore
│       └── templates/
│           ├── _helpers.tpl
│           ├── backend-deployment.yaml
│           ├── backend-service.yaml
│           ├── frontend-deployment.yaml
│           ├── frontend-service.yaml
│           ├── configmap.yaml
│           ├── secret.yaml
│           ├── ingress.yaml    # Optional, disabled by default
│           └── NOTES.txt
└── docs/
    └── k8s-setup-guide.md   # NEW: Setup documentation
```

**Structure Decision**: Helm chart lives in `k8s/todo-app/` at repo root. Dockerfiles live alongside their respective service directories. Docker Compose at repo root for easy `docker compose up`.

## Dependency Graph

```text
T001 (Backend Dockerfile)  ──┐
                              ├── T003 (Docker Compose) ──┐
T002 (Frontend Dockerfile) ──┘                            │
                                                          │
T004 (Minikube Setup) ───────────────────────────────────┤
                                                          │
T005 (Load Images to Minikube) ──────────────────────────┤
                                                          │
                              ┌── T006 (Helm Chart Structure)
                              │
                              ├── T007 (Backend Deployment + Service)
                              │
                              ├── T008 (Frontend Deployment + Service)
                              │
                              ├── T009 (ConfigMap + Secret + Values)
                              │
                              └── T010 (Helm Lifecycle: install/upgrade/uninstall)
                                         │
                                         ├── T011 (E2E Verification on Minikube)
                                         │
                                         ├── T012 (AIOps Tools Setup)
                                         │
                                         ├── T013 (AIOps Command Examples)
                                         │
                                         └── T014 (Documentation + Setup Guide)
```

## Implementation Phases

### Phase A: Containerization (Tasks T001-T003)
**Ref**: `@specs/k8s-infrastructure/Dockerization.md`

Create Dockerfiles for backend and frontend using multi-stage builds, then validate with docker-compose. This phase has zero Kubernetes dependency — pure Docker.

**Key decisions**:
- Backend: `python:3.13-slim` base image, pip install from requirements.txt, uvicorn entrypoint
- Frontend: `node:22-alpine` base, npm ci + build in build stage, standalone output in runtime stage
- Non-root users in both containers
- No `.env` files in images — all config via environment variables

### Phase B: Minikube Cluster (Tasks T004-T005)
**Ref**: `@specs/k8s-infrastructure/Minikube-setup.md`

Start and configure Minikube, create namespace, load Docker images. This phase validates the infrastructure before Helm deployment.

**Key decisions**:
- Docker driver (consistent with containerization)
- 2 CPUs, 4GB RAM allocation
- `todo-app` namespace
- Images loaded via `minikube image load` (no registry)
- Enable addons: metrics-server, ingress

### Phase C: Helm Charts (Tasks T006-T010)
**Ref**: `@specs/k8s-infrastructure/Helm-charts.md`

Create Helm chart structure, deployment templates, services, config management, and validate full lifecycle.

**Key decisions**:
- Single chart for both services (simplicity for Phase 4)
- NodePort services for external access
- Kubernetes Secret for sensitive env vars, ConfigMap for non-sensitive
- Standard Helm labels on all resources
- NOTES.txt with post-install access instructions

### Phase D: Verification & AIOps (Tasks T011-T014)
**Ref**: `@specs/k8s-infrastructure/AIOps-tools.md`

Full e2e verification, AIOps tool integration, and documentation.

**Key decisions**:
- AIOps tools are optional — all operations have manual kubectl fallback
- 5+ command examples spanning deploy/status/scale/troubleshoot categories
- Setup guide covers zero-to-running in <15 minutes

## Complexity Tracking

No constitution violations. All infrastructure files (Dockerfiles, Helm templates, YAML manifests) are configuration artifacts, not business logic, so Principle I (SDD) applies to the application code which remains unchanged.

## Research Note: Spec-Driven Deployment Blueprints

This Phase 4 implementation demonstrates a reusable **Spec-Driven Deployment Blueprint** pattern:
1. Feature spec defines WHAT to deploy and acceptance criteria
2. Sub-specs define HOW each infrastructure layer works (Docker → Minikube → Helm → AIOps)
3. Dependency chain ensures correct build order
4. Each layer is independently testable before proceeding

This blueprint is reusable for Phase 5 (cloud deployment) by swapping Minikube for DOKS and adding Dapr/Kafka layers. Document in `specs/blueprints/` if time permits.
