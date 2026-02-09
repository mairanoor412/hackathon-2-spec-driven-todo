# Feature Specification: Dockerization of Todo AI Chatbot

**Feature Branch**: `005-local-k8s-deployment`
**Created**: 2026-02-07
**Status**: Draft
**Parent Spec**: `specs/features/local-kubernetes-deployment/spec.md`
**Input**: User description: "Dockerize frontend (Next.js) and backend (FastAPI) services of the Phase 3 Todo AI Chatbot for local Kubernetes deployment, using multi-stage builds and docker-compose for local testing"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build Backend Container Image (Priority: P1)

A developer wants to containerize the FastAPI backend (including the AI agent, MCP server, and all Phase 3 dependencies) into a single container image so it can run identically in any environment. The developer creates a Dockerfile in the backend directory that installs dependencies, copies source code, and starts the uvicorn server.

**Why this priority**: The backend is the core API layer that all other services depend on. Without a working backend container, neither task CRUD nor the AI chatbot can function. This is the most critical containerization step.

**Independent Test**: Can be fully tested by building the backend image and running it with `docker run`, then hitting the `/health` endpoint and verifying a `{"status": "healthy"}` response. Delivers value: portable, self-contained backend server.

**Acceptance Scenarios**:

1. **Given** the backend source code and a Dockerfile, **When** the developer runs the build command, **Then** the image builds successfully without errors and the final image size is under 500MB.
2. **Given** a built backend image, **When** the developer runs it with the required environment variables (DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY), **Then** the server starts on port 8000 and responds to health check requests.
3. **Given** a running backend container, **When** an authenticated request is made to the task CRUD endpoints, **Then** the API returns correct responses and persists data to the external Neon database.
4. **Given** a running backend container, **When** a chat request is sent to the AI agent endpoint, **Then** the agent responds correctly using the MCP tools and Gemini integration.
5. **Given** the backend Dockerfile uses multi-stage builds, **When** the final image is inspected, **Then** it contains only runtime dependencies (no build tools, no pip cache, no development packages).

---

### User Story 2 - Build Frontend Container Image (Priority: P1)

A developer wants to containerize the Next.js frontend into a production-ready container image that serves the built application. The developer creates a Dockerfile that installs dependencies, builds the Next.js app, and serves it with the Next.js production server.

**Why this priority**: The frontend is the user-facing entry point. Users need the web UI to authenticate, manage tasks, and interact with the chatbot. Equal priority with the backend since neither is useful without the other.

**Independent Test**: Can be fully tested by building the frontend image and running it with `docker run`, then opening a browser to verify the login page loads. Delivers value: portable, production-optimized frontend server.

**Acceptance Scenarios**:

1. **Given** the frontend source code and a Dockerfile, **When** the developer runs the build command, **Then** the image builds successfully and the final image size is under 500MB.
2. **Given** a built frontend image, **When** the developer runs it with the required environment variables (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_API_URL), **Then** the server starts on port 3000 and serves the application.
3. **Given** a running frontend container, **When** a user navigates to the root URL in a browser, **Then** the landing page or login page renders correctly with all styles and assets.
4. **Given** the frontend Dockerfile uses multi-stage builds, **When** the final image is inspected, **Then** it contains only the production build output and runtime (no node_modules devDependencies, no source TypeScript files).
5. **Given** the frontend container uses Next.js standalone output mode, **When** the image is built, **Then** the output is self-contained and does not require the full node_modules directory.

---

### User Story 3 - Local Multi-Service Testing with Docker Compose (Priority: P2)

A developer wants to test both containerized services together locally using Docker Compose before deploying to Kubernetes. Docker Compose orchestrates the frontend and backend containers with the correct networking, environment variables, and port mappings so the developer can validate end-to-end functionality.

**Why this priority**: Docker Compose provides a quick feedback loop for validating containerization before the complexity of Kubernetes. It catches networking and configuration issues early. Depends on User Stories 1 and 2 being complete.

**Independent Test**: Can be fully tested by running `docker compose up` and then performing a complete user journey (login, create task, chat with AI) in the browser. Delivers value: validated multi-container orchestration and service-to-service communication.

**Acceptance Scenarios**:

1. **Given** a docker-compose.yml defining both services, **When** the developer runs `docker compose up`, **Then** both containers start, connect to each other, and are accessible from the host machine.
2. **Given** both services running via Docker Compose, **When** the developer opens the frontend in a browser and logs in, **Then** authentication works correctly with the frontend communicating to the backend container.
3. **Given** both services running via Docker Compose, **When** the developer performs task CRUD operations, **Then** requests flow from frontend to backend, data is persisted in Neon DB, and responses display correctly.
4. **Given** both services running via Docker Compose, **When** the developer uses the AI chatbot, **Then** the chat messages are processed by the backend's agent and MCP tools, returning correct responses.
5. **Given** the developer stops Docker Compose, **When** the developer runs `docker compose down`, **Then** all containers and networks are removed cleanly.

---

### User Story 4 - AI-Assisted Containerization with Gordon (Priority: P3)

A developer wants to use Docker AI Agent (Gordon) to generate or optimize Dockerfiles, getting AI-powered suggestions for best practices, layer optimization, and security improvements. If Gordon is unavailable, the developer falls back to standard Docker CLI.

**Why this priority**: Gordon is a nice-to-have enhancement that can improve Dockerfile quality. However, all containerization must work without it — it is purely optional and additive.

**Independent Test**: Can be tested by invoking Gordon (via Docker Desktop) on the project and comparing its suggestions with the manually created Dockerfiles. Delivers value: AI-assisted optimization and learning opportunity.

**Acceptance Scenarios**:

1. **Given** Docker Desktop with Gordon enabled, **When** the developer asks Gordon to analyze the project structure, **Then** Gordon provides Dockerfile suggestions tailored to the frontend and backend services.
2. **Given** Gordon-generated Dockerfiles, **When** compared with manually created ones, **Then** the images build successfully and produce equivalent or smaller image sizes.
3. **Given** Gordon is unavailable or not installed, **When** the developer uses the standard Docker CLI, **Then** all containerization steps complete successfully without any dependency on Gordon.

---

### Edge Cases

- What happens when the backend container cannot reach the external Neon database? The container should start, but the health check endpoint should report an unhealthy status, and API requests should return clear database connectivity error messages.
- What happens when the frontend container is started without the backend being available? The frontend should still serve the static pages (login, landing), but API-dependent features should display appropriate error states.
- What happens when environment variables are missing or misconfigured? Containers should fail fast at startup with clear error messages indicating which required variables are missing.
- What happens when Docker build runs on a machine with limited disk space? The multi-stage build should minimize intermediate layers and the build should fail with a clear out-of-space error rather than producing a corrupt image.
- What happens when the developer changes source code and rebuilds? Docker layer caching should ensure only changed layers are rebuilt, keeping rebuild times short.
- What happens when docker-compose is run with an already-occupied port? Docker Compose should report a clear port conflict error indicating which port is in use and by which service.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST produce a container image for the backend service that includes the FastAPI application, AI agent, MCP server, and all Python runtime dependencies.
- **FR-002**: System MUST produce a container image for the frontend service that includes the Next.js production build and runtime.
- **FR-003**: Both container images MUST use multi-stage builds with at least two stages: a build/dependency stage and a lean runtime stage.
- **FR-004**: The backend container MUST expose port 8000 and start the application server automatically when the container runs.
- **FR-005**: The frontend container MUST expose port 3000 and start the production server automatically when the container runs.
- **FR-006**: Container images MUST NOT contain secrets, API keys, or environment-specific values; all configuration MUST be injected via environment variables at runtime.
- **FR-007**: Container images MUST NOT include development dependencies, build tools, caches, or test files in the final runtime stage.
- **FR-008**: System MUST provide a Docker Compose configuration that orchestrates frontend and backend containers with correct networking, port mappings, and environment variable injection.
- **FR-009**: The Docker Compose configuration MUST use an `.env` file or environment variable references for all sensitive configuration (no hardcoded secrets).
- **FR-010**: Container images MUST exclude unnecessary files via `.dockerignore` files (e.g., `node_modules`, `venv`, `__pycache__`, `.git`, `.env`).
- **FR-011**: The backend container's health check endpoint (`/health`) MUST be accessible from within the Docker network and from the host machine.
- **FR-012**: The frontend container MUST use Next.js standalone output mode to produce a self-contained build without requiring the full `node_modules` directory.
- **FR-013**: System MUST provide clear build commands to build, tag, and run each container image individually.
- **FR-014**: The backend container MUST run the application as a non-root user for security.
- **FR-015**: The frontend container MUST run the application as a non-root user for security.
- **FR-016**: Container images SHOULD support multi-platform builds (at minimum linux/amd64) to ensure compatibility with Minikube environments.
- **FR-017**: The Docker Compose configuration MUST define a shared network so the frontend can reach the backend by service name.
- **FR-018**: System MUST NOT modify any existing application source code; containerization must wrap the existing Phase 3 codebase as-is.

### Key Entities

- **Backend Dockerfile**: The build recipe for the FastAPI service container. Key attributes: base image, dependency installation stage, runtime stage, exposed port (8000), entrypoint command, non-root user.
- **Frontend Dockerfile**: The build recipe for the Next.js service container. Key attributes: base image, dependency installation stage, build stage, runtime stage, exposed port (3000), standalone output, non-root user.
- **Docker Compose Configuration**: The orchestration file defining how services run together locally. Key attributes: service definitions, network configuration, port mappings, environment variable references, volume mounts (if any).
- **.dockerignore Files**: Exclusion lists that prevent unnecessary files from being copied into the build context. Key attributes: patterns for node_modules, venv, .git, .env, __pycache__, build artifacts.
- **Environment Variable Contract**: The set of required runtime configuration variables each container expects. Backend: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGINS, GEMINI_API_KEY. Frontend: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_BETTER_AUTH_URL, NEXT_PUBLIC_API_URL.

## Assumptions

- The existing Phase 3 application code is stable and working in local development; containerization wraps it without modification.
- The external Neon PostgreSQL database remains the data store; no database container is included in Docker Compose (avoids data duplication and port conflicts with the existing development database).
- The frontend uses Next.js standalone output mode (requires a minor `next.config.ts` change: `output: "standalone"`) which is the only acceptable code-level change for containerization.
- Python 3.13+ slim images are used for the backend base to match the project's Python version requirement.
- Node.js 22 LTS (Alpine variant) is used for the frontend base image to minimize size while providing full compatibility.
- Docker Desktop (or Docker Engine) is installed on the developer's machine with Docker Compose V2 available as `docker compose`.
- The Docker AI Agent "Gordon" is optionally available through Docker Desktop; all workflows have a manual CLI fallback.
- Container images are tagged with a `latest` tag for local development; versioned tags will be introduced in the Helm chart spec.

## Non-Goals

- Kubernetes manifests or Helm charts (covered in separate specs).
- CI/CD pipeline integration or automated image building.
- Pushing images to a container registry (local images only for Phase 4).
- Running a local PostgreSQL container (external Neon DB is used).
- Application code changes beyond the Next.js standalone output configuration.
- Container security scanning or vulnerability analysis.
- Multi-architecture image builds beyond linux/amd64 (Minikube's primary platform).
- Production TLS/SSL configuration inside containers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both container images build successfully from the project source in under 5 minutes on a standard development machine, with final images each under 500MB.
- **SC-002**: Each containerized service starts and responds to requests within 30 seconds of `docker run`, confirmed by a successful health check or page load.
- **SC-003**: The complete application (authentication, task CRUD, AI chatbot) functions end-to-end when both containers run together via Docker Compose, with all operations producing the same results as the local development setup.
- **SC-004**: Container images contain only production runtime files — no development dependencies, no source maps, no build tooling, no cached packages in the final layer.
- **SC-005**: Rebuilding an image after a small source code change takes under 60 seconds due to effective layer caching (dependencies layer is reused when only application code changes).
- **SC-006**: A developer new to the project can build and run the containerized application by following the provided build commands, going from source code to running containers in under 10 minutes.
- **SC-007**: `docker compose down` cleanly removes all containers and networks with no orphaned resources.
- **SC-008**: Both containers run as non-root users, verified by inspecting the running container's process user.
