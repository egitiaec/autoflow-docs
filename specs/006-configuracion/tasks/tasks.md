# Tasks: Tenant Configuration & Settings

> **Module:** Configuracion (006)
> **Spec:** `spec.md` | **Plan:** `plan.md`
> **Total Estimated:** 76 hours (9.5 working days)
> **Last Updated:** 2026-03-18

---

## Phase 1: Core Configuration (24h)

### T-06.01: Project Setup & Scaffolding [2h]
**Reference:** `plan.md` §1
**Dependencies:** None
**Priority:** Critical

- [ ] Create `autoflow-config` Spring Boot project with dependencies: Spring Web, Spring AMQP, Spring Data JPA, Spring Data Redis, Spring Security, Spring Mail, Lombok
- [ ] Configure MinIO client bean for logo storage
- [ ] Configure `@EnableScheduling` for N8N health checks

---

### T-06.02: PostgreSQL Schema & Entities [4h]
**Reference:** `plan.md` §2
**Dependencies:** T-06.01
**Priority:** Critical

- [ ] Flyway migration: `tenant_branding`, `subscription`, `subscription_history`, `n8n_integration`, `notification_preference`
- [ ] ALTER `tenants`: add `onboarding_step INTEGER DEFAULT 0`, `onboarding_completed BOOLEAN DEFAULT FALSE`
- [ ] JPA entities + repositories with custom queries

---

### T-06.03: Business Information CRUD [4h]
**Reference:** `spec.md` US-01
- [ ] RUC validation (13 digits, checksum algorithm)
- [ ] Phone validation (Ecuadorean format)
- [ ] Business type enum: FERRETERIA, CLINICA, RESTAURANTE, RETAIL

---

### T-06.04: Branding Upload & Storage [5h]
**Reference:** `spec.md` US-02, `plan.md` §2
- [ ] File validation: PNG/JPG/SVG, max 2MB
- [ ] Thumbnail generation: 200x200px via Thumbnailator
- [ ] MinIO upload: `autoflow-branding/{tenantId}/logo.png`
- [ ] Color validation: `^#[0-9A-Fa-f]{6}$`
- [ ] Slug generation + uniqueness check
- [ ] Redis cache invalidation + `config.branding.updated` event

### T-06.05: Public Branding Endpoint [3h]
**Reference:** `spec.md` US-02
- [ ] `GET /api/v1/config/branding/{slug}` — no auth required
- [ ] Response: name, colors, logo URL only (no sensitive data)
- [ ] ETag support for CDN
- [ ] 404 for non-existent slugs (no enumeration)

### T-06.06: Subscription Management [6h]
**Reference:** `spec.md` US-03, `plan.md` §4.3
- [ ] Plan enum: BASIC (60/min, 500 clients), PRO (300/min, 5000), ENTERPRISE (1000/min, unlimited)
- [ ] `changePlan`: record history → update → invalidate rate limit caches → publish event
- [ ] Plan comparison endpoint

---

## Phase 2: Integrations & Notifications (28h)

### T-06.07: N8N Integration Management [5h]
- [ ] `connect`, `getIntegration`, `testConnection`, `disconnect`
- [ ] API key encryption (AES-256)
- [ ] Webhook signing: HMAC-SHA256

### T-06.08: N8N Health Check Scheduler [4h]
- [ ] `@Scheduled` every 5 minutes
- [ ] 3 consecutive failures → UNHEALTHY + alert
- [ ] Redis cache: `config:n8n:{tenantId}:health`

### T-06.09: N8N Webhook Trigger Endpoint [4h]
- [ ] `POST /api/v1/config/integrations/n8n/webhook/{tenantId}/{event}`
- [ ] Signature verification, rate limiting
- [ ] Publish to RabbitMQ event queues

### T-06.10: Notification Preference CRUD [4h]
- [ ] Default preferences created during onboarding
- [ ] Batch update, test notification endpoint

### T-06.11: Notification Dispatcher [5h]
- [ ] Route events to DASHBOARD/EMAIL/WHATSAPP channels
- [ ] Frequency: IMMEDIATE vs DAILY_DIGEST (cron at 08:00)

### T-06.12: Dashboard Notification Bell [3h]
- [ ] Redis sorted set: `notifications:dashboard:{tenantId}`
- [ ] Read/unread management, unread count for badge

---

## Phase 3: Onboarding Wizard (24h)

### T-06.13: Onboarding State Machine [5h]
**Reference:** `spec.md` US-06, `plan.md` §4.4
- [ ] 5 steps: Business data (mandatory) → Branding → WhatsApp → Product → Order
- [ ] Out-of-order completion allowed
- [ ] Cache: `config:onboarding:{tenantId}` TTL 120s

### T-06.14: Onboarding REST API [3h]
- [ ] `GET .../status` → step, completion %, completed_steps[], remaining_steps[]
- [ ] `POST .../step/{step}/complete` → update status
- [ ] `POST .../complete` → mark tenant ACTIVO

### T-06.15: Onboarding Step Integrations [6h]
- [ ] Step 0: after business info update → create default notification prefs + BASIC subscription
- [ ] Step 1: after branding update
- [ ] Step 2: listen to `whatsapp.connected` event
- [ ] Step 3: listen to `producto.created` event
- [ ] Step 4: listen to `pedido.creado` event → also mark tenant ACTIVO

### T-06.16: Dashboard Banner Endpoint [3h]
- [ ] `show_banner = !onboarding_completed`
- [ ] Frontend: conditional banner linking to wizard

### T-06.17: Redis Cache Invalidation & Events [3h]
- [ ] Centralized `ConfigCacheService`: invalidateBranding, invalidatePlan, invalidateOnboarding
- [ ] `config.updated` event to RabbitMQ

### T-06.18: Security & Authorization [4h]
- [ ] `@PreAuthorize`: TENANT_ADMIN for config, PLATFORM_ADMIN for plan changes
- [ ] Multi-tenancy: tenantId from JWT only
- [ ] File upload MIME validation
- [ ] Security tests: cross-tenant, role bypass, file type attacks

---

## Summary

| Phase | Hours | Tasks |
|-------|-------|-------|
| Phase 1: Core Configuration | 24h | T-06.01 → T-06.06 |
| Phase 2: Integrations & Notifications | 28h | T-06.07 → T-06.12 |
| Phase 3: Onboarding Wizard | 24h | T-06.13 → T-06.18 |
| **Total** | **76h** | **18 tasks** |

---

*Generated from spec.md and plan.md.*
