# Feature Specification: Helm Charts for Todo AI Chatbot Deployment

**Feature Branch**: `005-local-k8s-deployment`
**Created**: 2026-02-07
**Status**: Draft
**Parent Spec**: `specs/features/local-kubernetes-deployment/spec.md`
**Dependencies**: `specs/k8s-infrastructure/Dockerization.md`, `specs/k8s-infrastructure/Minikube-setup.md`
**Input**: User description: "Create Helm charts to deploy containerized Todo AI Chatbot on Kubernetes (Minikube) with configurable values, deployments, services, and install/upgrade/uninstall lifecycle support"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Valid Helm Chart Structure (Priority: P1)

A developer wants to create a well-structured Helm chart for the Todo AI Chatbot that packages all Kubernetes manifests (deployments, services, config) into a single, reusable deployment unit. The chart follows Helm 3 conventions with a clean directory layout, proper metadata, and sensible defaults.

**Why this priority**: The chart structure is the foundation for all Helm operations. Without a valid chart, nothing can be installed, upgraded, or customized. This must be done first before any deployment.

**Independent Test**: Can be fully tested by running `helm lint` on the chart directory and confirming it passes with no errors. Delivers value: a reusable, shareable deployment package.

**Acceptance Scenarios**:

1. **Given** the chart directory structure is created, **When** a developer runs the Helm linting tool against it, **Then** the chart passes validation with no errors and no critical warnings.
2. **Given** the chart contains metadata, **When** a developer inspects the chart metadata file, **Then** it contains the correct chart name, version, app version, description, and maintainer information.
3. **Given** the chart includes a values file, **When** a developer opens it, **Then** all configurable parameters are present with documented defaults and inline comments explaining each value.
4. **Given** the chart templates reference the values file, **When** any value is overridden, **Then** the rendered manifests reflect the override correctly.

---

### User Story 2 - Deploy Application with Helm Install (Priority: P1)

A developer wants to deploy the complete Todo AI Chatbot to Minikube using a single Helm install command. The chart deploys both frontend and backend services with proper networking, environment configuration, and health checks, making the full application accessible from the developer's browser.

**Why this priority**: This is the core value proposition of Helm — one-command deployment. It validates that all chart templates render correctly and produce working Kubernetes resources. Equal priority with chart creation since they are inseparable.

**Independent Test**: Can be fully tested by running `helm install` on a clean Minikube cluster and verifying all pods reach "Running" and "Ready" status, then accessing the application in a browser. Delivers value: repeatable, one-command deployment.

**Acceptance Scenarios**:

1. **Given** a running Minikube cluster with Docker images loaded, **When** the developer runs `helm install` with the chart, **Then** all pods (frontend, backend) are created and reach "Running" and "Ready" status.
2. **Given** a Helm-deployed application, **When** the developer accesses the frontend through the exposed service, **Then** the login page loads and the full application (auth, CRUD, chatbot) is functional.
3. **Given** the chart defines health probes, **When** a pod's health check fails, **Then** Kubernetes restarts the pod automatically based on the liveness probe configuration.
4. **Given** the chart creates services, **When** the developer lists Kubernetes services, **Then** both frontend and backend services exist with correct port mappings and selectors.
5. **Given** the chart creates a Kubernetes Secret or ConfigMap for environment variables, **When** pods start, **Then** all required environment variables are injected correctly (database URL, auth secrets, API keys, CORS origins).

---

### User Story 3 - Upgrade and Customize Deployment (Priority: P2)

A developer wants to modify the deployment configuration (e.g., change replica count, update image tags, adjust resource limits) and apply changes using `helm upgrade` without tearing down and redeploying the entire application. The values file serves as the single source of customization.

**Why this priority**: Upgrade capability is essential for iterative development and demonstrates Helm's key advantage over raw manifests. Depends on a successful initial install (User Story 2).

**Independent Test**: Can be fully tested by changing a value (e.g., replica count from 1 to 2) and running `helm upgrade`, then verifying the change takes effect. Delivers value: zero-downtime configuration changes.

**Acceptance Scenarios**:

1. **Given** an installed Helm release, **When** the developer runs `helm upgrade` with a modified replica count, **Then** the deployment scales to the new replica count and the application remains available during the upgrade.
2. **Given** an installed Helm release, **When** the developer overrides the backend image tag via `--set`, **Then** Kubernetes performs a rolling update to the new image version.
3. **Given** an installed Helm release, **When** the developer modifies an environment variable in the values file, **Then** `helm upgrade` updates the ConfigMap/Secret and triggers a pod restart to pick up the new value.
4. **Given** a failed upgrade (e.g., bad image tag), **When** the developer runs `helm rollback`, **Then** the application reverts to the previous working version.

---

### User Story 4 - Clean Uninstall and Lifecycle Management (Priority: P2)

A developer wants to cleanly remove the entire application from the cluster using `helm uninstall`, with no orphaned resources left behind. The developer also wants to inspect the release status and history for troubleshooting.

**Why this priority**: Clean lifecycle management is a fundamental Helm capability. Developers need to tear down and redeploy frequently during development. Depends on a working install.

**Independent Test**: Can be fully tested by running `helm uninstall` and then verifying no application resources remain in the namespace. Delivers value: clean cluster state management.

**Acceptance Scenarios**:

1. **Given** an installed Helm release, **When** the developer runs `helm uninstall`, **Then** all Kubernetes resources created by the chart (deployments, services, configmaps, secrets) are removed.
2. **Given** the release has been uninstalled, **When** the developer lists pods and services in the namespace, **Then** no application resources remain (only system resources).
3. **Given** an installed release, **When** the developer runs `helm status`, **Then** the output shows the release status, revision number, deployment time, and notes about how to access the application.
4. **Given** multiple upgrades have been performed, **When** the developer runs `helm history`, **Then** all revisions are listed with timestamps and status.

---

### User Story 5 - AI-Assisted Chart Generation and Validation (Priority: P3)

A developer wants to use kubectl-ai or Kagent to generate initial chart templates or validate existing manifests using natural language commands. This accelerates chart development and helps catch configuration errors early.

**Why this priority**: AI-assisted tooling is an enhancement that improves developer productivity but is not required. All chart operations work without AI tools.

**Independent Test**: Can be tested by asking kubectl-ai or Kagent to generate a deployment manifest and comparing it with the chart's template. Delivers value: faster chart development and AI-powered validation.

**Acceptance Scenarios**:

1. **Given** kubectl-ai is installed, **When** a developer asks "generate a Kubernetes deployment for a Python web app on port 8000", **Then** kubectl-ai produces a valid deployment manifest that can be compared with or incorporated into the Helm chart.
2. **Given** Kagent is installed, **When** a developer asks "validate the todo-app Helm release health", **Then** Kagent checks pod status, service endpoints, and resource utilization and reports any issues.
3. **Given** neither kubectl-ai nor Kagent is available, **When** the developer creates charts manually, **Then** the documentation provides all necessary template examples and the chart passes `helm lint` validation.

---

### Edge Cases

- What happens when `helm install` is run but Docker images are not loaded into Minikube? Pods should enter "ImagePullBackOff" or "ErrImagePull" state with clear events explaining the missing image, and the troubleshooting guide should cover this scenario.
- What happens when `helm install` is run twice with the same release name? Helm should return a clear error that the release already exists, with guidance to use `helm upgrade` instead.
- What happens when a required environment variable is missing from the values file? The pod should fail to start with a clear error in the logs indicating the missing variable, and the values file documentation should list all required variables.
- What happens when `helm upgrade` introduces an incompatible change (e.g., changing a service type)? Helm should apply the change or report a conflict, and the developer can rollback if the upgrade causes issues.
- What happens when resource limits in values are set too low for the application? Pods should be OOMKilled or throttled, with events explaining the resource constraint. The default values should be tested to ensure they are sufficient.
- What happens when the developer runs `helm install` on a cluster without the required namespace? The chart should either create the namespace automatically or provide a clear error message with instructions to create it first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST produce a valid Helm 3 chart with the standard directory structure (Chart.yaml, values.yaml, templates/, .helmignore).
- **FR-002**: The chart MUST include Kubernetes Deployment templates for both the frontend and backend services, each referencing configurable image names and tags from the values file.
- **FR-003**: The chart MUST include Kubernetes Service templates for both frontend (exposed externally via NodePort) and backend (internal ClusterIP, or NodePort for direct access).
- **FR-004**: The chart MUST include a Kubernetes Secret template for sensitive environment variables (database URL, auth secrets, API keys) with values sourced from the values file.
- **FR-005**: The chart MUST include a Kubernetes ConfigMap template for non-sensitive environment variables (CORS origins, public URLs, JWT algorithm).
- **FR-006**: All Deployment templates MUST define readiness and liveness probes for their respective services (backend: HTTP GET on /health; frontend: HTTP GET on /).
- **FR-007**: All Deployment templates MUST define resource requests and limits (CPU and memory) with configurable values and sensible defaults.
- **FR-008**: The values file MUST provide clearly documented, commented defaults for all configurable parameters including: image repository/tag, replica count, resource requests/limits, environment variables, service type/port, and probe configuration.
- **FR-009**: The chart MUST support `helm install` to create all resources from scratch on a clean cluster.
- **FR-010**: The chart MUST support `helm upgrade` to apply configuration changes (replica count, image tags, environment variables) without requiring a full teardown.
- **FR-011**: The chart MUST support `helm uninstall` to cleanly remove all resources it created, with no orphaned Kubernetes objects.
- **FR-012**: The chart MUST support `helm rollback` to revert to a previous revision after a failed upgrade.
- **FR-013**: The chart MUST be idempotent — running `helm upgrade` with no changes should produce no modifications to the cluster.
- **FR-014**: The chart MUST use Helm template labels (app.kubernetes.io/name, app.kubernetes.io/instance, app.kubernetes.io/version, app.kubernetes.io/managed-by) on all resources for consistent identification.
- **FR-015**: The chart MUST include NOTES.txt that displays post-install instructions (how to access the application, how to check pod status).
- **FR-016**: The chart MUST pass `helm lint` validation with no errors.
- **FR-017**: The chart SHOULD support optional Ingress resource creation (disabled by default, enabled via values) for developers who enable the Minikube ingress addon.
- **FR-018**: System SHOULD document kubectl-ai or Kagent commands for generating or validating chart manifests, with manual fallback procedures.

### Key Entities

- **Helm Chart**: The top-level package containing all templates and metadata. Key attributes: chart name (todo-app), version, app version, description, type (application).
- **Chart Metadata (Chart.yaml)**: Descriptive information about the chart. Key attributes: apiVersion (v2), name, version, appVersion, description, maintainers.
- **Values File (values.yaml)**: The single source of configurable parameters. Key attributes: frontend config block, backend config block, secrets block, global settings.
- **Deployment Template**: A Kubernetes Deployment manifest with Helm template directives for variable substitution. Key attributes: replicas, container image, ports, probes, resources, environment from Secret/ConfigMap.
- **Service Template**: A Kubernetes Service manifest exposing pods to network traffic. Key attributes: type (ClusterIP/NodePort), ports, selectors.
- **Secret Template**: A Kubernetes Secret holding sensitive environment data. Key attributes: base64-encoded values, type (Opaque).
- **ConfigMap Template**: A Kubernetes ConfigMap holding non-sensitive configuration. Key attributes: key-value data pairs.
- **Helm Release**: A running instance of the chart in the cluster. Key attributes: release name, namespace, revision number, status, values used.

## Assumptions

- Docker images for frontend and backend are already built and loaded into Minikube (as per the Dockerization spec).
- The Minikube cluster is running and configured (as per the Minikube Setup spec) with kubectl context set correctly.
- Helm 3+ is installed on the developer's machine (prerequisite from Minikube Setup spec).
- A single Helm chart manages both frontend and backend services (not separate charts per service), keeping deployment simple for Phase 4's local context.
- The chart uses NodePort services for external access from the host browser (Minikube does not support LoadBalancer natively without `minikube tunnel`).
- Secrets in the values file contain placeholder values; the developer overrides them during `helm install` via `--set` flags or a custom values override file.
- The chart targets the application namespace created during Minikube setup (default: `todo-app`).
- No Helm hooks or subcharts are used, keeping the chart simple and maintainable for this phase.
- The chart version starts at 0.1.0 to indicate local/development maturity.

## Non-Goals

- Actual Helm chart code generation in this spec (implementation is a separate step via `/sp.plan` and `/sp.implement`).
- CI/CD or GitOps integration (e.g., ArgoCD, Flux).
- Advanced Helm features: hooks, subchart dependencies, library charts, post-renderers.
- Helm chart testing frameworks (e.g., helm-unittest) beyond basic `helm lint`.
- Chart repository publishing or packaging for distribution.
- Production-grade security (network policies, pod security contexts beyond non-root, secrets encryption at rest).
- Multi-environment value files (dev/staging/prod) — single local values file only.
- Horizontal Pod Autoscaler (HPA) configuration — manual scaling via replica count only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The chart passes `helm lint` validation with zero errors on first run.
- **SC-002**: A single `helm install` command deploys the complete application (frontend + backend) to a clean namespace, with all pods reaching "Running" and "Ready" status within 2 minutes.
- **SC-003**: The deployed application supports the full user journey — authentication, task CRUD, AI chatbot — accessed from the host browser via the exposed service ports.
- **SC-004**: `helm upgrade` with a changed value (e.g., replica count) applies the change within 60 seconds and the application remains accessible during the rolling update.
- **SC-005**: `helm rollback` restores the previous revision and the application returns to its prior working state within 60 seconds.
- **SC-006**: `helm uninstall` removes all chart-created resources — zero application pods, services, configmaps, or secrets remain in the namespace after uninstall.
- **SC-007**: The values file contains at least 15 documented, configurable parameters covering images, replicas, resources, environment variables, services, and probes.
- **SC-008**: A developer can customize and redeploy the application by modifying only the values file (no template edits required), confirmed by overriding at least 3 different parameters during testing.
