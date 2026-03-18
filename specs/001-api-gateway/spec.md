# Plan: API Gateway & Authentication

> **Module:** API Gateway (001)
> **Spec Reference:** `spec.md`
> **Status:** 📋 Placeholder — Pending Plan
> **Last Updated:** 2026-03-18

---

*Plan pending full spec elaboration. See `spec.md` for pending areas to define.*

**Tech stack decisions:** Spring Cloud Gateway, Resilience4j Circuit Breaker, JJWT for RS256 tokens, Redis sliding window rate limiting.

*Refer to `PRODUCT_BACKLOG.md` HU-001 through HU-005 for source material.*
ption plan, and routing requests to the appropriate microservice.

---

## 2. User Stories (from PRODUCT_BACKLOG.md)

| HU | Story | Priority |
|----|-------|----------|
| HU-001 | Registro de nueva empresa (tenant) | Alta |
| HU-002 | Autenticación JWT con refresh tokens | Alta |
| HU-003 | Rate limiting por plan de suscripción | Media |
| HU-004 | Routing dinámico a microservicios | Alta |
| HU-005 | Gestión de roles y permisos | Media |

---

## 3. Pending

> ⚠️ This spec requires full elaboration. Key areas:
> - JWT token structure, claims, rotation
> - Rate limiting algorithm
> - Route configuration per microservice
> - Role-permission matrix
> - Circuit breaker configuration

**Next Steps:** Full `spec.md`, `plan.md`, `tasks/tasks.md` based on PRODUCT_BACKLOG.md.

*Refer to `PRODUCT_BACKLOG.md` HU-001 through HU-005 for source material.*
