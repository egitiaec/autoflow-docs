# Tasks: WhatsApp Business Integration

> **Module:** WhatsApp (004)
> **Spec:** `spec.md` | **Plan:** `plan.md`
> **Total Estimated:** 88 hours (11 working days)
> **Last Updated:** 2026-03-18

---

## Phase 1: Core Connection & Messaging (32h)

### T-04.01: Project Setup & Scaffolding [2h]
**Reference:** `plan.md` §1
**Dependencies:** None
**Priority:** Critical

- [ ] Create `autoflow-whatsapp` Spring Boot project with dependencies: Spring Web, Spring AMQP, Spring Data JPA, Spring Data MongoDB, Spring Data Redis, Lombok, MapStruct
- [ ] Configure `application.yml` with profiles: dev, staging, prod
- [ ] Set up Docker Compose service definition (port 8083)
- [ ] Create Flyway migration placeholder `V1.0__initial_schema.sql`
- [ ] Configure `@EnableRabbitListeners`, `@EnableAsync`, `@EnableScheduling`
- [ ] Add health check endpoint: `/actuator/health` with custom WhatsApp connectivity indicator

---

### T-04.02: PostgreSQL Schema & Entities [4h]
**Reference:** `plan.md` §2
**Dependencies:** T-04.01
**Priority:** Critical

- [ ] Write Flyway migration: `whatsapp_connection`, `evolution_instance`, `whatsapp_template` tables
- [ ] Create JPA entities: `WhatsappConnectionEntity`, `EvolutionInstanceEntity`, `WhatsappTemplateEntity`
- [ ] Add `@Table(uniqueConstraints)` for tenant uniqueness
- [ ] Create repositories: `WhatsappConnectionRepository`, `EvolutionInstanceRepository`, `WhatsappTemplateRepository`
- [ ] Add custom query: `findByTenantIdAndEstadoActive(tenantId)`
- [ ] Write unit tests for repository queries with H2 in-memory

---

### T-04.03: MongoDB Message Model & Repository [3h]
**Reference:** `plan.md` §2
**Dependencies:** T-04.01
**Priority:** Critical

- [ ] Create `WhatsappMessage` document class with fields: tenantId, connectionId, direction, from, to, type, content, waMessageId, status, timestamp, metadata
- [ ] Create `WhatsappMessageRepository extends MongoRepository` with custom queries:
  - `findByTenantIdAndConversationOrderByTimestamp(tenantId, contactPhone)`
  - `findDistinctConversationsByTenantId(tenantId)`
  - `countByTenantIdAndTimestampBetween(tenantId, from, to)`
- [ ] Add compound index: `{ tenant_id: 1, timestamp: -1 }`
- [ ] Add text index on `content` for search
- [ ] Write integration test with Embedded MongoDB

---

### T-04.04: Encryption Service (AES-256) [3h]
**Reference:** `plan.md` §4, `constitution.md` §4
**Dependencies:** T-04.01
**Priority:** Critical

- [ ] Create `EncryptionService` using `javax.crypto.Cipher` with AES-256-GCM
- [ ] Key from environment variable `ENCRYPTION_KEY` (Base64 256-bit)
- [ ] Methods: `encrypt(String): String`, `decrypt(String): String`
- [ ] IV as prefix for unique nonces
- [ ] Unit tests: roundtrip, wrong key fails, null handling

---

### T-04.05: Meta WhatsApp Bridge — Connection [6h]
**Reference:** `spec.md` US-01, `plan.md` §3
**Dependencies:** T-04.02, T-04.04
**Priority:** Critical

- [ ] `WhatsappConnectionService`: `createConnection`, `getConnection`, `disconnect`
- [ ] Webhook registration with Meta Graph API
- [ ] `WhatsappConnectionController` REST endpoints (POST, GET, DELETE)
- [ ] DTOs with `@Valid` annotations
- [ ] Integration tests with MockMvc + Testcontainers

---

### T-04.06: Webhook Verification & Ingestion [5h]
**Reference:** `spec.md` US-01, `plan.md` §5
**Dependencies:** T-04.05
**Priority:** Critical

- [ ] `WhatsappWebhookController`: GET (verification), POST (ingestion)
- [ ] HMAC-SHA256 signature verification from Meta
- [ ] Redis dedup: `wa:dedup:{waMessageId}` TTL 300s
- [ ] Normalize payload → store MongoDB → publish RabbitMQ `wa.incoming`
- [ ] Integration tests: verify challenge, receive message, verify storage

---

### T-04.07: Message Sending Service [5h]
**Reference:** `spec.md` US-02, `plan.md` §3, §5
**Dependencies:** T-04.05, T-04.06
**Priority:** Critical

- [ ] `sendTextMessage`: validate phone format, rate limit (Redis 30/min), call Meta API
- [ ] `sendTemplateMessage`: lookup template, validate APPROVED, replace variables
- [ ] `WhatsappMessageController` POST endpoints
- [ ] Unit tests with WireMock

---

## Phase 2: Evolution API Bridge (16h)

### T-04.08: Evolution Instance Management [5h]
**Reference:** `spec.md` US-04, `plan.md` §3
**Dependencies:** T-04.02, T-04.04
**Priority:** High

- [ ] `EvolutionInstanceService`: `createInstance`, `getQRCode`, `disconnect`, `getStatus`
- [ ] One instance per tenant enforcement
- [ ] WireMock tests for Evolution API

### T-04.09: Evolution Webhook & Normalization [4h]
**Reference:** `spec.md` US-04, `plan.md` §1
**Dependencies:** T-04.08, T-04.06
**Priority:** High

- [ ] `MessageNormalizer` interface: `MetaMessageNormalizer`, `EvolutionMessageNormalizer`
- [ ] Same internal DTO format for both bridges
- [ ] Publish to same `wa.incoming` queue

### T-04.10: Evolution Heartbeat Monitoring [3h]
**Reference:** `spec.md` US-04, `plan.md` §2
**Dependencies:** T-04.08
**Priority:** High

- [ ] `@Scheduled` every 30s: check instance status via Evolution API
- [ ] Redis: `evolution:instance:{id}:status` TTL 45s
- [ ] Auto-generate QR on disconnect

### T-04.11: Evolution Outbound Messaging [4h]
**Reference:** `spec.md` US-02, `plan.md` §5
**Dependencies:** T-04.08, T-04.07
**Priority:** High

- [ ] `MessageSenderFactory`: Strategy pattern selects Meta vs Evolution
- [ ] Same rate limiting and storage logic

---

## Phase 3: Conversation & UI Layer (24h)

### T-04.12: Conversation List API [4h]
**Reference:** `spec.md` US-05
- [ ] MongoDB aggregation: group by phone, last message, unread count
- [ ] Search by phone/name, sorted by timestamp DESC

### T-04.13: Message History API [3h]
**Reference:** `spec.md` US-05
- [ ] Paginated message list for a conversation
- [ ] Date grouping for UI separators

### T-04.14: WebSocket Real-Time Messaging [5h]
**Reference:** `plan.md` §4.3
- [ ] Spring STOMP over WebSocket
- [ ] Push to `/topic/whatsapp/{tenantId}` on incoming messages
- [ ] Frontend Angular WebSocket service

### T-04.15: WhatsApp Statistics API [4h]
**Reference:** `spec.md` US-06
- [ ] MongoDB aggregation: sent, delivered, read, failed, open rate, auto vs manual
- [ ] Redis cache TTL 120s

### T-04.16: Template Management API [4h]
**Reference:** `spec.md` US-03
- [ ] CRUD + Meta sync on first connection
- [ ] Template preview with sample variables

---

## Phase 4: Integration & Polish (16h)

### T-04.17: RabbitMQ Queue Configuration [3h]
- [ ] Declare all queues + dead-letter exchanges
- [ ] `@RabbitListener` containers with error handlers

### T-04.18: Event Consumers (Cross-Module) [4h]
- [ ] `OrderEventListener`: pedido.estado.changed → template notification
- [ ] `CustomerEventListener`: cliente.registrado → welcome message
- [ ] `InventoryEventListener`: inventario.bajo → admin alert

### T-04.19: Gateway Integration & Security [3h]
- [ ] JWT validation, CORS, `@PreAuthorize` for admin endpoints
- [ ] Multi-tenancy: tenantId from JWT claims only

### T-04.20: Error Handling & Resilience [3h]
- [ ] `@ControllerAdvice` exception handlers
- [ ] Resilience4j Circuit Breaker + Retry for Meta/Evolution calls
- [ ] Dead-letter queue consumer for manual requeue

---

## Summary

| Phase | Hours | Tasks |
|-------|-------|-------|
| Phase 1: Core Connection & Messaging | 32h | T-04.01 → T-04.07 |
| Phase 2: Evolution API Bridge | 16h | T-04.08 → T-04.11 |
| Phase 3: Conversation & UI Layer | 24h | T-04.12 → T-04.16 |
| Phase 4: Integration & Polish | 16h | T-04.17 → T-04.20 |
| **Total** | **88h** | **20 tasks** |

---

*Generated from spec.md and plan.md. Each task references specific sections of the spec and plan for traceability.*
