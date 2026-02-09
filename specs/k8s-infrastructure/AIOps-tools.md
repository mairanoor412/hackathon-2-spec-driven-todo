# Feature Specification: AIOps Tools Integration (kubectl-ai and Kagent)

**Feature Branch**: `005-local-k8s-deployment`
**Created**: 2026-02-07
**Status**: Draft
**Parent Spec**: `specs/features/local-kubernetes-deployment/spec.md`
**Dependencies**: `specs/k8s-infrastructure/Minikube-setup.md`, `specs/k8s-infrastructure/Helm-charts.md`
**Input**: User description: "Integrate kubectl-ai and Kagent for intelligent deployment and management of Todo AI Chatbot on local Minikube, with 5+ real AI-assisted commands, troubleshooting examples, and manifest generation/validation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install and Configure kubectl-ai (Priority: P1)

A developer wants to install kubectl-ai on their local machine so they can interact with their Minikube Kubernetes cluster using natural language commands instead of memorizing kubectl syntax. The developer follows a setup guide that covers installation, API key configuration, and verification.

**Why this priority**: kubectl-ai is the primary AIOps tool for this phase. Without it installed and configured, no AI-assisted Kubernetes operations are possible. It is the entry point to the entire AIOps workflow.

**Independent Test**: Can be fully tested by installing kubectl-ai, configuring an API key, and running a simple natural language query like "list all namespaces" to confirm it generates and executes the correct kubectl command. Delivers value: AI-powered Kubernetes interaction from first use.

**Acceptance Scenarios**:

1. **Given** a developer with kubectl and Minikube already configured, **When** they follow the kubectl-ai installation guide, **Then** kubectl-ai is installed and responds to `kubectl-ai --version` (or equivalent verification command).
2. **Given** kubectl-ai is installed, **When** the developer configures their AI model API key (e.g., OpenAI or Gemini), **Then** kubectl-ai can communicate with the AI provider and process natural language queries.
3. **Given** kubectl-ai is configured, **When** the developer types a natural language query like "show all pods in the todo-app namespace", **Then** kubectl-ai translates it to the correct kubectl command, displays the generated command for review, and executes it upon confirmation.
4. **Given** the AI model API key is missing or invalid, **When** the developer tries to use kubectl-ai, **Then** a clear error message indicates the API key issue and provides instructions for resolution.

---

### User Story 2 - Install and Configure Kagent (Priority: P1)

A developer wants to install Kagent as a complementary AIOps tool that provides more advanced cluster management capabilities, including automated health monitoring, scaling recommendations, and interactive troubleshooting. The developer follows a setup guide to install and verify Kagent.

**Why this priority**: Kagent provides capabilities beyond kubectl-ai (automated analysis, proactive recommendations). Having both tools gives the developer a comprehensive AIOps toolkit. Equal priority with kubectl-ai since installation is a prerequisite for all subsequent stories.

**Independent Test**: Can be fully tested by installing Kagent and running a basic cluster health check command. Delivers value: advanced AI-powered cluster management and diagnostics.

**Acceptance Scenarios**:

1. **Given** a developer with kubectl and Minikube configured, **When** they follow the Kagent installation guide, **Then** Kagent is installed and can connect to the Minikube cluster.
2. **Given** Kagent is installed and configured, **When** the developer asks Kagent to perform a cluster health check, **Then** Kagent analyzes the cluster state and reports on node health, system pod status, and resource utilization.
3. **Given** Kagent requires an AI model API key, **When** the developer configures it, **Then** Kagent can process natural language requests and generate Kubernetes operations.
4. **Given** Kagent is unavailable or cannot be installed (e.g., platform incompatibility), **When** the developer falls back to kubectl-ai or standard kubectl, **Then** all operations documented in this spec can still be performed manually.

---

### User Story 3 - AI-Assisted Deployment and Verification (Priority: P2)

A developer wants to use AIOps tools to deploy the Todo AI Chatbot and verify the deployment is successful, using natural language commands instead of manually running kubectl or helm commands. This demonstrates how AI tools can streamline the deployment workflow.

**Why this priority**: This is the core demonstration of AIOps value — using AI to perform real deployment tasks. Depends on tools being installed (User Stories 1-2) and images/charts being ready (Dockerization and Helm specs).

**Independent Test**: Can be fully tested by using AIOps tools to deploy the application and then querying deployment status via natural language. Delivers value: AI-driven deployment workflow that reduces manual steps.

**Acceptance Scenarios**:

1. **Given** AIOps tools are configured and the Helm chart is ready, **When** the developer asks the tool to "deploy the todo app using Helm", **Then** the tool generates and executes the appropriate `helm install` command.
2. **Given** the application is deployed, **When** the developer asks "are all pods running in the todo-app namespace?", **Then** the tool checks pod status and reports whether all pods are Running and Ready.
3. **Given** the application is deployed, **When** the developer asks "show me the services and their endpoints", **Then** the tool lists all services with their types, ports, and cluster IPs.
4. **Given** the application is deployed, **When** the developer asks "can I access the frontend?", **Then** the tool identifies the frontend service, reports its NodePort or access URL, and optionally tests connectivity.

---

### User Story 4 - AI-Assisted Scaling and Configuration (Priority: P2)

A developer wants to use AIOps tools to scale application components and modify configurations using natural language, demonstrating how AI can simplify day-to-day Kubernetes operations that would otherwise require knowledge of specific kubectl or helm commands.

**Why this priority**: Scaling and configuration are common operations that showcase AIOps reducing operational complexity. Depends on a running deployment (User Story 3).

**Independent Test**: Can be fully tested by asking the tool to scale a deployment and verifying the replica count changes. Delivers value: natural language control over cluster operations.

**Acceptance Scenarios**:

1. **Given** the Todo app is deployed, **When** the developer asks "scale the backend to 3 replicas", **Then** the tool generates the correct scaling command, the deployment scales to 3 replicas, and all replicas reach Running status.
2. **Given** a scaled deployment, **When** the developer asks "what's the current replica count for all deployments?", **Then** the tool reports the desired and actual replica counts for each deployment.
3. **Given** the developer wants to update an environment variable, **When** they ask "update the CORS_ORIGINS to include a new URL", **Then** the tool identifies the relevant ConfigMap or Secret and suggests the correct update command.
4. **Given** a scaling operation was performed, **When** the developer asks "scale the backend back to 1 replica", **Then** the deployment scales down and excess pods are terminated cleanly.

---

### User Story 5 - AI-Assisted Troubleshooting and Diagnostics (Priority: P2)

A developer encounters a problem with the deployed application (e.g., a pod is crashing, a service is unreachable) and wants to use AIOps tools to diagnose and resolve the issue using natural language. The tools analyze logs, events, and resource states to provide actionable insights.

**Why this priority**: Troubleshooting is where AIOps tools provide the most dramatic value — turning complex multi-step debugging into a conversational experience. This is the strongest hackathon differentiator.

**Independent Test**: Can be tested by intentionally causing a failure (e.g., setting an invalid image tag) and then using AIOps tools to diagnose it. Delivers value: AI-powered root cause analysis and resolution guidance.

**Acceptance Scenarios**:

1. **Given** a pod is in CrashLoopBackOff state, **When** the developer asks "why is the backend pod crashing?", **Then** the tool retrieves pod logs and events, identifies the error, and suggests a fix (e.g., "the GEMINI_API_KEY environment variable is missing").
2. **Given** a service is unreachable, **When** the developer asks "why can't I reach the frontend?", **Then** the tool checks service endpoints, pod readiness, and network configuration, and identifies the issue.
3. **Given** pods are in Pending state, **When** the developer asks "why are pods stuck in Pending?", **Then** the tool checks node resources, scheduling constraints, and reports the bottleneck (e.g., insufficient CPU or memory).
4. **Given** a recent upgrade caused issues, **When** the developer asks "what changed in the last deployment?", **Then** the tool compares the current and previous Helm revisions and highlights the differences.
5. **Given** the developer wants a comprehensive health report, **When** they ask "give me a full cluster health report", **Then** the tool aggregates node status, pod status, resource utilization, and recent events into a summary.

---

### User Story 6 - Manual kubectl Fallback for All Operations (Priority: P1)

A developer who cannot install kubectl-ai or Kagent (due to platform limitations, missing API keys, or personal preference) wants to perform all the same operations using standard kubectl and helm commands. Every AIOps example must have a documented manual equivalent.

**Why this priority**: AIOps tools are optional enhancements — the deployment must never depend on them. This story ensures full parity between AI-assisted and manual workflows, making it P1 for the overall system.

**Independent Test**: Can be fully tested by performing every documented AIOps operation using only standard kubectl and helm commands. Delivers value: complete independence from AIOps tools.

**Acceptance Scenarios**:

1. **Given** every AIOps command example in the documentation, **When** the developer uses the documented manual kubectl/helm equivalent, **Then** the same result is achieved.
2. **Given** the developer has no AIOps tools installed, **When** they follow the deployment, scaling, and troubleshooting guides using manual commands only, **Then** the full application lifecycle (deploy, verify, scale, troubleshoot, uninstall) works correctly.
3. **Given** the documentation lists 5+ AIOps command examples, **When** each is accompanied by a manual equivalent, **Then** every manual command produces output equivalent to the AI-assisted version.

---

### Edge Cases

- What happens when the AI model API key quota is exhausted during a session? The tool should report a clear rate limit or quota error and the developer should fall back to manual kubectl commands documented alongside each example.
- What happens when kubectl-ai generates an incorrect or dangerous command? kubectl-ai should display the generated command for review before execution. The developer must confirm before any command runs. Destructive commands (delete, scale to 0) should require explicit confirmation.
- What happens when Kagent cannot connect to the Minikube cluster? Kagent should report a cluster connectivity error with guidance to check kubeconfig and Minikube status.
- What happens when the AIOps tool suggests a command that requires elevated permissions not available in Minikube? The tool should indicate the permission issue and suggest an alternative approach or explain how to enable the required permission.
- What happens when network connectivity to the AI provider is lost mid-session? The tools should fail gracefully with a timeout error and the developer should continue with manual kubectl commands.
- What happens when the developer asks an ambiguous question (e.g., "fix it")? The tool should ask for clarification or present multiple interpretations, not execute a potentially wrong command.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide step-by-step installation instructions for kubectl-ai, including prerequisite checks and platform-specific notes (Linux/WSL2 primary, macOS secondary).
- **FR-002**: System MUST provide step-by-step installation instructions for Kagent, including prerequisite checks and platform-specific notes.
- **FR-003**: System MUST document API key configuration for both tools, including which AI providers are supported (OpenAI, Gemini) and how to obtain and configure keys.
- **FR-004**: System MUST provide verification commands to confirm each tool is correctly installed and can communicate with the Minikube cluster.
- **FR-005**: System MUST document at least 5 distinct AI-assisted command examples spanning different operation categories: deployment, status checking, scaling, configuration, and troubleshooting.
- **FR-006**: Every AI-assisted command example MUST include a documented manual kubectl or helm equivalent that produces the same result.
- **FR-007**: System MUST document at least 3 troubleshooting scenarios using AIOps tools: pod crash diagnosis, service connectivity issues, and resource constraint analysis.
- **FR-008**: System MUST demonstrate using AIOps tools to generate or validate Kubernetes manifest content (e.g., generating a deployment template, validating a service configuration).
- **FR-009**: System MUST document that kubectl-ai displays generated commands for review before execution, ensuring no commands run without developer confirmation.
- **FR-010**: System MUST clearly state that AIOps tools are optional enhancements and the entire Phase 4 deployment works without them.
- **FR-011**: System MUST document how to use AIOps tools to verify a complete application deployment (all pods running, services exposed, application accessible).
- **FR-012**: System MUST document common error scenarios for each tool (API key issues, connectivity problems, permission errors) with resolution steps.
- **FR-013**: System SHOULD document how to use AIOps tools for resource utilization monitoring (CPU and memory usage per pod).
- **FR-014**: System SHOULD document side-by-side comparison of AI-assisted vs manual workflow for at least one complete operation (e.g., full deploy-verify-scale-troubleshoot cycle).

### Key Entities

- **kubectl-ai**: A kubectl plugin that translates natural language into kubectl commands. Key attributes: installation method, AI provider configuration, supported commands, confirmation workflow.
- **Kagent**: An AI-powered Kubernetes agent that provides cluster management, health monitoring, and troubleshooting capabilities. Key attributes: installation method, cluster connection, supported operations, analysis depth.
- **AI Provider API Key**: The authentication credential for the AI model used by AIOps tools. Key attributes: provider name (OpenAI/Gemini), key format, environment variable name, quota/rate limits.
- **AIOps Command Example**: A documented pair of natural language input and expected output, accompanied by a manual kubectl/helm equivalent. Key attributes: category (deploy/scale/troubleshoot/etc.), natural language prompt, generated command, expected output, manual equivalent.
- **Troubleshooting Scenario**: A documented failure scenario with AI-assisted diagnosis steps. Key attributes: symptom description, root cause, AI-assisted diagnosis flow, resolution steps, manual diagnosis equivalent.

## Assumptions

- kubectl-ai is available as a kubectl plugin installable via krew (the kubectl plugin manager) or as a standalone binary.
- Kagent is available for installation on Linux/WSL2 and macOS platforms.
- Both tools require an AI provider API key (OpenAI or Gemini); the developer uses their own free-tier or personal key.
- The AI provider's API has sufficient free-tier quota for development and testing use (typical kubectl-ai session uses minimal tokens).
- kubectl-ai operates in a "confirm before execute" mode by default — it shows the generated command and waits for developer approval before running it.
- Kagent can connect to the Minikube cluster using the same kubeconfig that kubectl uses.
- The developer has a working Minikube cluster with the Todo app deployed via Helm (dependencies from previous specs).
- Internet connectivity is required for AIOps tools to reach the AI provider API; offline use is not supported.
- AIOps tools do not store or transmit sensitive cluster data (secrets, credentials) to the AI provider beyond what is needed for command generation.

## Non-Goals

- Building custom AI agents or models from scratch (reuse existing tools only).
- Full monitoring or observability dashboard setup (e.g., Grafana, Prometheus).
- Production-grade AIOps integration (alerting, automated remediation, policy enforcement).
- Training or fine-tuning AI models on cluster-specific data.
- Multi-cluster management or federation.
- Integration with CI/CD pipelines or GitOps workflows.
- Automated security scanning or compliance checking via AIOps.
- Real-time continuous monitoring (one-off queries and diagnostics only).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both kubectl-ai and Kagent are installed and verified within 10 minutes following the setup guide (excluding API key procurement).
- **SC-002**: At least 5 distinct AI-assisted command examples are documented and working, spanning deployment, status, scaling, configuration, and troubleshooting categories.
- **SC-003**: Every AI-assisted example has a documented manual kubectl/helm equivalent, and both produce equivalent results when tested.
- **SC-004**: At least 3 troubleshooting scenarios are documented with AI-assisted diagnosis that correctly identifies the root cause and suggests an actionable fix.
- **SC-005**: A developer can use AIOps tools to perform a complete deploy-verify-scale-troubleshoot cycle using only natural language commands.
- **SC-006**: All documented AIOps operations complete within 30 seconds (time from natural language input to command execution result).
- **SC-007**: The documentation clearly demonstrates time savings — the AI-assisted workflow for each example requires fewer steps or less domain knowledge than the manual equivalent.
- **SC-008**: A developer without prior Kubernetes experience can successfully deploy and verify the application using AIOps tools by following the documented examples.
