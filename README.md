*This project has been created as part of the 42 curriculum by gcosta-m, gabastos, fde-alen, sdavi-al.*

# ft_transcendence




• Product Owner (PO): Defines the product vision, prioritizes features, and ensures the project meets user needs.
◦ Maintains the product backlog.
◦ Makes decisions on features and priorities.
◦ Validates completed work.
◦ Communicates with stakeholders (evaluators, peers).
• Project Manager (PM) / Scrum Master: Facilitates team coordination and
removes obstacles.
◦ Organizes team meetings and planning sessions.
◦ Tracks progress and deadlines.
◦ Ensures team communication.
◦ Manages risks and blockers.
• Technical Lead / Architect: Oversees technical decisions and architecture.
◦ Defines technical architecture.
◦ Makes technology stack decisions.
◦ Ensures code quality and best practices.
◦ Reviews critical code changes.
• Developers (all team members): Implement features and modules.
◦ Write code for assigned features.
◦ Participate in code reviews.
◦ Test their implementations.
◦ Document their work.

<gcosta-m> Gabriel Costa - Tech Lead
<gabastos> Gabriel Sobral - Product Owner
<fde-alen> Felippe de Alencar- Product Manager
<sdavi-al> Steffano Davi - Desenvolvedor




#######################################


During evaluation, the team will be asked to explain:
• How roles were distributed.
• How work was organized and divided.
• How you communicated and coordinated as a team.
• How each member contributed to the project.
All team members must be able to explain the project and their
contributions










#########################################

Exaplain how our project is be a web application, and requires a frontend, backend, and a
database.


Explain how  Deployment uses a containerization solution (Docker) and run with a single comman

 Your website must be compatible with the latest stable version of Google Chrome.
• No warnings or errors should appear in the browser console. Is this testable?



#################################


• Regular communication: We coimmunicated regularly to ensure everyone was aligned on goals and progress. So every week we shared updates on what we were working on, any challenges we faced, and what we planned to do next. What gave us the next steps to work.
 We organize around the modules we had to implement, so we divided the work based on the modules and features we had to implement. We also made sure to coordinate our efforts to avoid duplication and ensure that all parts of the project were covered.

• Task organization: Use simple tools like GitHub Issues, Trello, or even a shared
document to track who does what.

• Work breakdown: Divide the project into smaller, manageable tasks. Often the modules we had to implement were already broken down into smaller features, so we assigned those features to different team members based on their strengths and interests. Sometimes we also need some smaller tasks. Like for example, we had to update the dashboard with the data from the blockchain, so we broke that down into smaller tasks like fetching the data, processing it, and then displaying it on the dashboard.


• Code reviews: Try to have at least one other team member review important code changes. Trying to run docker compose up with the new code and see if everything is working as expected. This helps catch bugs early and ensures that everyone is familiar with the codebase.


• Documentation: Keep notes of important decisions and how things work. But by the end of the project we had to complete the documentation, so we made sure to document our work as we went along. This included writing clear commit messages, updating the README with instructions on how to run the project, and documenting any important decisions or challenges we faced along the way.

• Communication channel: We esed Discord to assemble the team and have meetings, besides that we used Whatsapp for quick communication and day-by-day coordination.

## Documentation

- NGINX: [docs/NGINX.md](docs/NGINX.md)

## III.3 Technical Requirements Compliance

This section explains how the project currently satisfies the mandatory technical requirements.

### 1) Frontend: clear, responsive, and accessible across devices

- **Clear UI**: The frontend uses a consistent component style (cards, forms, navbar, notifications) with reusable CSS tokens and utility classes.
- **Responsive behavior**: Mobile/tablet breakpoints are implemented in `app/frontend/css/style.css` (e.g., grid and layout adjustments at `1024px` and `768px`).
- **Accessibility baseline**: We use semantic form labels, `required` fields, `inputmode` where relevant, and `aria-label` / `role` attributes in interactive and GDPR-related views.
- **Status**: Implemented and usable across devices, with ongoing polish for some smaller-screen layouts.

### 2) CSS framework or styling solution

- We use a **custom styling solution** with modular CSS (`app/frontend/css/style.css`) rather than Tailwind/Bootstrap.
- This satisfies the requirement of using a styling solution.

### 3) Secrets in local `.env` + `.env.example` provided

- `.env` files are ignored by Git via `.gitignore` (`.env`, `.env.local`, `**/.env`).
- `.env.example` is provided at project root with required environment variables (e.g., `APP_URL`, SMTP, ELK password).
- Services also integrate with **HashiCorp Vault** for secret retrieval at runtime.

### 4) Database schema and well-defined relations

- PostgreSQL schema is initialized by service/database setup scripts.
- Main relational structures include:
	- `user_auth` (authentication records)
	- `user_profiles` linked by `auth_user_id` -> `user_auth(id)` with `ON DELETE CASCADE`
	- `gdpr_delete_requests` linked by `auth_user_id` -> `user_auth(id)` with `ON DELETE CASCADE`
- Indexes are created for key lookup fields (email, profile linkage, wallet address, GDPR token).

### 5) Basic user management system with secure signup/login

- Signup/login are implemented in `auth_service` (`/register`, `/login`).
- Passwords are hashed with **bcrypt** (configurable rounds), and login verifies via bcrypt compare.
- JWT-based authentication is used for protected routes.
- Additional auth method (2FA/TOTP) is implemented as an extension feature.

### 6) Frontend + backend validation of forms and inputs

- **Frontend validation**: HTML constraints (`type="email"`, `required`, max-length/inputmode for OTP), plus client checks (password confirmation, non-empty fields, flow guards).
- **Backend validation**: Route-level validation and explicit error responses for missing/invalid payloads, auth token checks, password policy checks, and protected internal endpoints.
- Validation is implemented in both layers as required.

### 7) HTTPS for backend access

- Public traffic is served through NGINX with TLS on `https://localhost:8443`.
- HTTP (`:8080`) is redirected to HTTPS.
- NGINX terminates TLS and securely proxies API routes to backend services on the internal Docker network.

### Requirement Summary

- All mandatory III.3 requirements are implemented in the current architecture.
- Remaining work is focused on incremental UX/accessibility polish and hardening details, not on missing core requirements.

## Module Implementation and Relevance

This section explains **how each selected module was implemented** and **why it is important to the project**.

### 1) Web Module (Framework + Full Web App Structure)

**Implementation**
- Frontend is a SPA served by NGINX (`app/frontend`) using modular views and a shared API service.
- Backend uses **Express.js** microservices (`auth_service`, `user_service`, `transaction_service`, `blockchain_service`).
- Data layer is PostgreSQL with relational tables and indexes.
- Deployment is containerized with Docker Compose (`docker-compose.yml`) and runs as one integrated stack.

**Why it is relevant**
- It provides the required end-to-end web architecture (frontend + backend + database).
- It keeps development and evaluation reproducible: same environment, same services, same startup flow.

### 3) User Management Module

**Implementation**
- Authentication: register/login with email + password in `auth_service`.
- Password security: bcrypt hashing and verification.
- Session/authz model: JWT for protected routes.
- Profile management: `user_service` supports profile retrieval and updates (name, avatar, wallet reference).
- Optional advanced auth: 2FA/TOTP endpoints and frontend flow are implemented.

**Why it is relevant**
- User identity is the foundation for all protected features (transactions, GDPR operations, profile ownership).
- Secure auth and profile lifecycle are mandatory core requirements for a production-like web platform.

### 5) Cybersecurity Module (WAF/ModSecurity + Vault)

**Implementation**
- NGINX is configured with **ModSecurity + OWASP CRS** (`app/nginx/modsecurity/*`).
- Additional custom rules and exclusions are applied to reduce false positives and harden auth endpoints.
- Rate limiting is configured per route category (login/register/API/transactions/static).
- Secrets management uses **HashiCorp Vault** (AppRole-based service access and runtime secret loading).

**Why it is relevant**
- It reduces attack surface (injection attempts, brute-force pressure, abusive traffic).
- It enforces secure secret handling and avoids hard-coding credentials in source control.

### 7) DevOps Modules

#### 7.1 ELK Log Management

**Implementation**
- Elasticsearch stores and indexes logs.
- Logstash collects and transforms logs.
- Kibana provides exploration and dashboards (proxied via NGINX path `/kibana/`).
- Retention/archiving policies are documented and configured through ILM strategy.

**Why it is relevant**
- Centralized logs are essential for debugging distributed services and incident analysis.
- It gives operational visibility needed during demonstrations and evaluation.

#### 7.2 Backend as Microservices

**Implementation**
- Services are separated by responsibility:
	- `auth_service`: credentials/auth workflows
	- `user_service`: profile and user-centric data
	- `transaction_service`: transfer orchestration and records
	- `blockchain_service`: blockchain/wallet interactions
- Services communicate through internal REST APIs over Docker network.

**Why it is relevant**
- Separation of concerns improves maintainability, testing, and team parallelism.
- Fault isolation and modular evolution are better than a monolithic backend for this project scope.

#### 7.3 Monitoring (Prometheus + Grafana)

**Implementation**
- Prometheus scrapes metrics from application services and infrastructure exporters.
- Grafana dashboards visualize service health, traffic, and platform-level metrics.
- Alerting rules are defined in Prometheus/Alertmanager configuration files.

**Why it is relevant**
- Monitoring proves system behavior under load and during failures.
- It supports observability requirements expected in a modern DevOps workflow.

### 8) Data & Analytics Module (GDPR Features)

**Implementation**
- GDPR endpoints in auth/user services support user data export and deletion request flow.
- Deletion confirmation uses tokenized confirmation flow and notification email/log fallback.
- GDPR-specific persistence (`gdpr_delete_requests`) is stored in PostgreSQL with expiry controls.

**Why it is relevant**
- It demonstrates legal/privacy-aware engineering, not only technical correctness.
- It gives users control over personal data lifecycle (access, portability, erasure).

### 9) Blockchain Module

**Implementation**
- A Solidity smart contract (`MiniBank.sol`) is deployed on the local Hardhat/Avalanche-compatible workflow.
- `blockchain_service` exposes wallet and chain operations to internal services.
- User and transaction flows integrate with blockchain actions and persist references (e.g., wallet/tx metadata).

**Why it is relevant**
- It satisfies the mandatory blockchain objective with immutable transaction-related records.
- It adds trust/integrity guarantees beyond traditional database-only flows.

### Final Relevance Summary

- Together, these modules form a complete platform: secure web app, modular backend, observability stack, compliance flow, and blockchain-backed integrity.
- The architecture is directly aligned with the project’s evaluation criteria and demonstrates both software engineering and DevSecOps maturity.
