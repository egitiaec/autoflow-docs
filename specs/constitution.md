# AutoFlow — Constitution

> **Project:** AutoFlow — SaaS de automatización para PYMEs ecuatorianas
> **Version:** 1.0.0
> **Last Updated:** 2026-03-18
> **Status:** Active

---

## Preamble

AutoFlow es una plataforma SaaS multi-tenant que permite a pequeñas y medianas empresas ecuatorianas (retail, clínicas, restaurantes) automatizar sus operaciones diarias mediante integración con WhatsApp Business, gestión de pedidos, CRM básico y reportes automáticos. El sistema debe ser simple de configurar (onboarding < 15 min), confiable (99.5% uptime) y asequible ($99–299/mes).

---

## 1. Architectural Principles

### 1.1 Multi-Tenancy Isolation
- **Every request must be scoped to a tenant.** The tenant ID is extracted from the JWT claim, never from the request body or URL path.
- **Data isolation is non-negotiable.** PostgreSQL row-level security (RLS) or schema-per-tenant must prevent cross-tenant data leakage.
- **Shared infrastructure is acceptable; shared data is not.** Multiple tenants share the same database instance but never see each other's data.

### 1.2 Event-Driven Communication
- **Asynchronous first.** Inter-service communication uses RabbitMQ events. Synchronous REST calls only for queries that require an immediate response.
- **Every state-changing operation publishes an event.** Order created, status changed, client registered — all emit domain events to RabbitMQ.
- **Events are immutable and idempotent.** Consumers must handle duplicate deliveries gracefully.

### 1.3 API-First Design
- **OpenAPI 3.0 specs are written before implementation.** Every endpoint is defined in a spec file, reviewed, and approved.
- **RESTful conventions.** Standard HTTP methods, status codes, and pagination (cursor or offset-based).
- **Versioned APIs.** All endpoints prefixed with `/api/v1/`. Breaking changes require a new version prefix.

### 1.4 Resilience and Graceful Degradation
- **Circuit breakers on all external calls.** WhatsApp API, N8N webhooks, and inter-service calls use Resilience4j.
- **Timeouts are mandatory.** No infinite waits. Default: 30s for downstream services, 5s for external APIs.
- **Cached data is acceptable; stale data is not.** Redis caches must have bounded TTL and explicit invalidation on writes.

---

## 2. Technology Mandates

These decisions are **inviolable** for the MVP. Changes require a formal Architecture Decision Record (ADR) approved by the Tech Lead.

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Backend Framework | Spring Boot | 2.1.x | Compatibility with OpenJDK 17 on VPS constraints |
| Java Runtime | OpenJDK | 17 (LTS) | Long-term support, stability, ecosystem compatibility |
| Frontend Web | Angular | 17+ | PrimeNG component library, TypeScript, enterprise-grade |
| Frontend Mobile (iOS) | Swift / SwiftUI | 5.9+ | Native iOS performance and UX |
| Frontend Mobile (Android) | Kotlin + Jetpack Compose | 1.5+ | Material Design 3, modern declarative UI |
| Relational DB | PostgreSQL | 15+ | ACID compliance, multitenancy via RLS, JSONB support |
| Document DB | MongoDB | 7+ | Unstructured data: logs, message history, flexible reports |
| Cache / Sessions | Redis | 7+ | Rate limiting, session storage, response caching |
| Message Broker | RabbitMQ | 3.12 | Reliable queues, dead-letter exchanges, event routing |
| Workflow Engine | N8N | Latest (self-hosted) | No-code automation for tenant-specific workflows |
| WhatsApp Bridge | Evolution API | Latest | WhatsApp multi-device without Meta template approval friction |
| Containerization | Docker | 24+ | Docker Compose for local dev, Docker Swarm for production |
| Reverse Proxy | Nginx | 1.24+ | SSL termination, load balancing, static asset serving |
| CI/CD | GitHub Actions | — | Automated build, test, and deploy pipeline |
| Monitoring | Prometheus + Grafana | — | Metrics collection and dashboards |

---

## 3. Coding Standards

### 3.1 Java / Spring Boot
- **Package structure:** By feature within each microservice (`com.autoflow.pedidos.controller`, `com.autoflow.pedidos.service`, etc.)
- **DTOs mandatory:** Entities are never exposed directly in controllers. Use MapStruct for mapping.
- **Validation:** Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@Pattern`) on every request DTO.
- **Error responses:** Standardized format: `{ "error": "CODE", "message": "Human-readable", "details": [...] }`
- **Async processing:** `@Async` with thread pool configuration. No blocking calls in event listeners.
- **No null returns.** Use `Optional<>` or throw specific exceptions handled by `@ControllerAdvice`.

### 3.2 Angular / TypeScript
- **Standalone components** (Angular 17+). No NgModules for new components.
- **Smart/Container + Presentational pattern.** Smart components handle data; presentational components handle display.
- **Strong typing.** No `any`. Interfaces for all API responses.
- **Lazy loading** for all feature modules.
- **RxJS:** Use `signal()` where possible (Angular 16+). Minimize `subscribe()` in templates.

### 3.3 Database
- **Migrations via Flyway.** Naming: `V{major}.{minor}__{description}.sql`. No manual schema changes.
- **Indexes on foreign keys and frequently queried columns.** Review with `EXPLAIN ANALYZE` before merging.
- **Constraints at DB level.** `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` — never rely solely on application-level validation.
- **Soft deletes** where data retention is required (clients, orders). Hard deletes only for test data.

---

## 4. Security Principles

### 4.1 Authentication & Authorization
- **JWT with RS256.** Access tokens: 15-minute expiry. Refresh tokens: 7-day expiry, stored in Redis.
- **BCrypt strength 12** for password hashing. No exceptions.
- **Role-based access control (RBAC).** Four roles: `admin`, `manager`, `operator`, `viewer`. Permissions are additive (union of all roles).
- **Refresh token rotation.** Each refresh invalidates the previous token and issues a new pair.

### 4.2 Data Protection
- **Encryption at rest** for sensitive fields (WhatsApp access tokens, API keys). AES-256 with per-tenant keys.
- **Encryption in transit** for all communications. TLS 1.2+ mandatory.
- **No secrets in code or config files.** Environment variables or HashiCorp Vault.
- **Password masking in logs.** Never log credentials, tokens, or PII.

### 4.3 API Security
- **Rate limiting per plan.** Basic: 60 req/min, Pro: 300 req/min, Enterprise: 1000 req/min. Auth endpoints: 10 req/min per IP.
- **CORS:** Only registered client domains. No wildcard `*` in production.
- **Input sanitization.** All user input validated server-side. No client-side-only validation.
- **SQL injection prevention:** JPA parameterized queries only. No string concatenation in queries.

---

## 5. Quality Standards

### 5.1 Testing Requirements
- **Unit test coverage:** ≥ 80% of service layer. Measured by JaCoCo.
- **Integration tests:** Every REST endpoint tested with `MockMvc`. Testcontainers for PostgreSQL, RabbitMQ, Redis.
- **Contract tests:** Consumer-driven contract tests for inter-service API calls.
- **No tests, no merge.** CI pipeline blocks merging if tests fail or coverage drops below threshold.

### 5.2 Definition of Done
A feature is **done** when:
- [ ] Code compiles with zero warnings
- [ ] Unit tests pass with ≥ 80% service coverage
- [ ] Integration tests pass for all endpoints
- [ ] OpenAPI spec updated and validated
- [ ] Code reviewed and approved by ≥ 1 peer
- [ ] No TODOs or FIXMEs without a tracked ticket
- [ ] README updated if public-facing behavior changes
- [ ] Deployed to staging and smoke-tested

---

## 6. Observability

- **Structured logging.** JSON format via Logback. Every log entry includes: `timestamp`, `level`, `service`, `correlationId`, `tenantId`, `message`.
- **Correlation IDs.** Generated at gateway, propagated via `X-Correlation-Id` header to all services.
- **Health checks.** Spring Boot Actuator `/actuator/health` with custom liveness/readiness probes for each dependency (DB, Redis, RabbitMQ).
- **Metrics.** Micrometer → Prometheus → Grafana. Key metrics: request rate, error rate, latency percentiles (p50/p95/p99), queue depth.

---

## 7. Deployment & Operations

- **Infrastructure as code.** Docker Compose definitions versioned in Git. No manual server configuration.
- **Zero-downtime deployments.** Rolling updates with health check gates.
- **Backup strategy.** PostgreSQL: daily pg_dump to S3-compatible storage. MongoDB: mongodump daily. Redis: RDB snapshots every 6 hours.
- **Log retention.** 30 days hot (in Grafana/Loki), 1 year cold (in S3/Glacier).

---

## 8. Ecuador-Specific Requirements

- **RUC validation:** 13-digit format validated with algorithmic checksum.
- **Cédula validation:** 10-digit format validated with algorithmic checksum.
- **Phone format:** Ecuadorean mobile numbers: `09XXXXXXXX` (10 digits) or `+5939XXXXXXXX` (international).
- **Currency:** All amounts in USD. Two decimal places. No currency conversion.
- **Timezone:** `America/Guayaquil` (GMT-5). All timestamps stored in UTC, displayed in local timezone.
- **WhatsApp context:** Ecuadorean businesses heavily rely on WhatsApp for customer communication. This is not optional — it's the primary communication channel.

---

## 9. Constraints & Trade-offs

- **Spring Boot 2.1.x is a known tech debt.** It is EOL. This is accepted for MVP velocity but must be upgraded to Spring Boot 3.x post-launch. Documented as `TECH-DEBT-001`.
- **No payment integration in MVP.** Subscription billing is manual. Stripe/PayPal integration is a Phase 2 priority.
- **Single-region deployment.** No geo-redundancy in MVP. VPS-based in Ecuador or US-East.
- **Self-hosted N8N.** No N8N Cloud. Each tenant shares the N8N instance with workflow isolation.

---

*This constitution is a living document. Changes require an ADR and approval from the Tech Lead. Last review: 2026-03-18.*
