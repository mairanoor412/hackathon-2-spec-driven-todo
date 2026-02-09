---
id: "0019"
title: Phase 4 Claude Code Skills Creation
stage: misc
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: local-kubernetes-deployment
branch: 005-local-k8s-deployment
user: maira
command: skill-creation
labels: ["skills", "docker", "minikube", "helm", "aiops", "kubectl-ai", "kagent", "phase4"]
links:
  spec: specs/features/local-kubernetes-deployment/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - .claude/skills/docker-skill/SKILL.md
  - .claude/skills/minikube-skill/SKILL.md
  - .claude/skills/helm-skill/SKILL.md
  - .claude/skills/aiops-skill/SKILL.md
tests:
  - All 4 skills registered and visible in Claude Code skill list
---

## Prompt

me implementation say phly yeh 4 skills bnana chahti hn claude kay skill-creator ki madad say
Docker Skill (docker-skill.ts): Docker images build, push, run.
Minikube Skill (minikube-skill.ts): Cluster start/stop, config.
Helm Skill (helm-skill.ts): Charts create, install, upgrade.
AIOps Skill (aiops-skill.ts): kubectl-ai + Kagent for AI commands.

## Response snapshot

Created 4 Claude Code skills for Phase 4 Local Kubernetes Deployment:

1. **docker-skill** (`.claude/skills/docker-skill/SKILL.md`) - Multi-stage Dockerfile templates for FastAPI backend (python:3.13-slim) and Next.js frontend (node:22-alpine), docker-compose.yml, .dockerignore files, build/run/verify commands, non-root users, health checks, and troubleshooting guide.

2. **minikube-skill** (`.claude/skills/minikube-skill/SKILL.md`) - Minikube cluster lifecycle (start/stop/delete), Docker driver config (2 CPUs, 4GB RAM), namespace creation (todo-app), addon management (metrics-server, ingress), Docker image loading, cluster verification, and quick-start command sequence.

3. **helm-skill** (`.claude/skills/helm-skill/SKILL.md`) - Complete Helm chart templates: Chart.yaml, values.yaml (15+ parameters), _helpers.tpl, backend/frontend Deployment+Service, ConfigMap, Secret, Ingress (optional), NOTES.txt, and full lifecycle commands (install, upgrade, rollback, uninstall).

4. **aiops-skill** (`.claude/skills/aiops-skill/SKILL.md`) - kubectl-ai and Kagent installation/configuration, 10 AI-assisted command examples across 5 categories (deploy, status, scale, troubleshoot, generate), 3 troubleshooting scenarios, side-by-side AI vs manual comparison, confirm-before-execute safety, and complete manual kubectl/helm fallback for every operation.

Each skill follows the existing SKILL.md pattern, references the relevant k8s-infrastructure spec, and includes step-by-step process, common commands, troubleshooting table, and acceptance criteria.

## Outcome

- Impact: 4 reusable Claude Code skills provide intelligent guidance during Phase 4 implementation
- Tests: All 4 skills visible in Claude Code skill list
- Files: 4 SKILL.md files created under .claude/skills/
- Next prompts: `/sp.implement` to begin executing tasks T041-T054
- Reflection: Skills created before implementation ensure Claude has domain-specific context for Docker, Minikube, Helm, and AIOps operations, reducing errors during implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): All skills registered in Claude Code skill list - PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
