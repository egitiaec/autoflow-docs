# AutoFlow — Sprint Plan

> 4 sprints × 2 semanas = 8 semanas de desarrollo MVP
> Equipo estimado: 3-4 developers full-stack
> Velocity estimado: 35-45 SP/sprint

---

## SPRINT 1: CORE INFRASTRUCTURE

**📅 Fechas:** Semana 1-2 (14 días)
**🎯 Objetivo:** Levantar infraestructura base, autenticación, Gateway routing y módulo de Pedidos funcional.

### HUs Asignadas

| HU | Título | SP | Developer |
|----|--------|----|-----------|
| HU-001 | Registro de nueva empresa (tenant) | 5 | Dev A |
| HU-002 | Autenticación JWT con refresh tokens | 5 | Dev A |
| HU-004 | Routing dinámico a microservicios | 3 | Dev B |
| HU-003 | Rate limiting por plan de suscripción | 5 | Dev B |
| HU-006 | Crear pedido manual | 5 | Dev C |
| HU-007 | Listar y filtrar pedidos | 3 | Dev C |
| HU-008 | Actualizar estado de pedido | 3 | Dev C |
| | **TOTAL SP** | **29** | |

### Infraestructura a configurar (no HU, prerequisite)
- Docker Compose: PostgreSQL, MongoDB, RabbitMQ, Redis
- Spring Boot project scaffold: parent POM con módulos
- Flyway migrations: esquemas `public` (tenants), `pedidos`
- RabbitMQ exchanges: `autoflow.events` (topic), colas: `pedidos.events`, `mail.verify`
- Redis connection pooling en Gateway y Pedidos service
- Swagger/OpenAPI en cada microservicio (`springfox` 3.0)

### Hitos Sprint 1
- [ ] **Día 1-2:** Docker Compose levantado + DB schemas + scaffold Java
- [ ] **Día 3-5:** Auth completo (register + login + JWT) — HU-001, HU-002 ✅
- [ ] **Día 3-5:** Gateway routing + rate limit — HU-003, HU-004 ✅
- [ ] **Día 5-8:** Pedidos CRUD + estados — HU-006, HU-007, HU-008 ✅
- [ ] **Día 9-10:** Integration tests end-to-end, bug fixes, code review
- [ ] **Día 10:** **DEMO SPRINT 1** — Crear tenant → login → crear pedido → cambiar estado

### Criterio de salida (Sprint 1 Exit)
- [ ] Flujo completo: register → login → POST pedido → GET pedidos → PUT estado
- [ ] 3 microservicios corriendo en Docker: gateway, pedidos, auth (integrado en gateway)
- [ ] Tests unitarios + integration con cobertura ≥ 80%
- [ ] CI pipeline ejecutando build + tests

---

## SPRINT 2: CRM + WHATSAPP

**📅 Fechas:** Semana 3-4 (14 días)
**🎯 Objetivo:** CRM funcional con búsqueda y etiquetas, WhatsApp conectado con envío/recepción de mensajes.

### HUs Asignadas

| HU | Título | SP | Developer |
|----|--------|----|-----------|
| HU-005 | Gestión de roles y permisos | 8 | Dev A |
| HU-011 | Registrar cliente con datos ecuatorianos | 5 | Dev B |
| HU-012 | Buscar y listar clientes | 5 | Dev B |
| HU-013 | Etiquetar clientes | 5 | Dev C |
| HU-016 | Conexión WhatsApp Business API | 8 | Dev A |
| HU-017 | Envío de mensajes de texto por WhatsApp | 5 | Dev A |
| HU-009 | Consultar detalle de pedido | 3 | Dev C |
| HU-010 | Gestión básica de inventario | 8 | Dev C |
| | **TOTAL SP** | **47** | |

> ⚠️ **47 SP es ambicioso.** Si el velocity real de Sprint 1 fue < 40, mover HU-005 (roles) a Sprint 3.

### Hitos Sprint 2
- [ ] **Día 1-3:** CRM service: clientes CRUD + búsqueda MongoDB — HU-011, HU-012 ✅
- [ ] **Día 3-5:** Etiquetas + roles — HU-013, HU-005 ✅
- [ ] **Día 3-6:** WhatsApp connection + webhook + envío — HU-016, HU-017 ✅
- [ ] **Día 5-7:** Detalle pedido + inventario — HU-009, HU-010 ✅
- [ ] **Día 8-10:** Testing cross-service, correcciones
- [ ] **Día 10:** **DEMO SPRINT 2** — Buscar cliente → crear pedido con inventario → enviar confirmación WA

### Criterio de salida (Sprint 2 Exit)
- [ ] Flujo: registrar cliente → buscar → crear pedido con stock → enviar WA de confirmación
- [ ] WhatsApp Business conectado con webhook activo (sandbox o producción)
- [ ] Búsqueda de clientes < 200ms (medido con JMeter)
- [ ] Inventario: stock se descuenta al entregar pedido
- [ ] Multi-tenancy validado: tenant A no ve datos de tenant B

---

## SPRINT 3: REPORTES + CONFIGURACIÓN

**📅 Fechas:** Semana 5-6 (14 días)
**🎯 Objetivo:** Dashboard de ventas, reportes exportables, branding, planes de suscripción, templates WhatsApp y Evolution API.

### HUs Asignadas

| HU | Título | SP | Developer |
|----|--------|----|-----------|
| HU-014 | Historial de interacciones del cliente | 8 | Dev A |
| HU-015 | Notas manuales sobre clientes | 3 | Dev A |
| HU-018 | Gestión de plantillas de WhatsApp aprobadas | 8 | Dev B |
| HU-019 | Configuración Evolution API | 8 | Dev B |
| HU-020 | Dashboard de ventas | 8 | Dev C |
| HU-021 | Reporte de ventas exportable | 8 | Dev C |
| HU-023 | Configuración de branding del tenant | 5 | Dev A |
| HU-024 | Gestión de planes y suscripción | 8 | Dev B |
| | **TOTAL SP** | **56** | |

> ⚠️ **56 SP es muy ambicioso.** Se recomienda mover HU-015 (notas, 3 SP) y HU-024 (planes, 8 SP) a Sprint 4 si hay riesgo de slippage.

### Hitos Sprint 3
- [ ] **Día 1-3:** CRM historial + notas — HU-014, HU-015 ✅
- [ ] **Día 2-5:** WhatsApp templates + Evolution API — HU-018, HU-019 ✅
- [ ] **Día 3-6:** Dashboard de ventas + reporte exportable — HU-020, HU-021 ✅
- [ ] **Día 5-8:** Branding + planes — HU-023, HU-024 ✅
- [ ] **Día 8-10:** Testing, performance tuning
- [ ] **Día 10:** **DEMO SPRINT 3** — Dashboard con datos → generar reporte Excel → ver branding → cambiar plan

### Criterio de salida (Sprint 3 Exit)
- [ ] Dashboard con KPIs en tiempo real (cache 60s)
- [ ] Reporte Excel generado y descargable
- [ ] Branding configurado y visible en endpoint público
- [ ] WhatsApp templates sincronizadas con Meta API
- [ ] Evolution API: QR code generado y conexión estable

---

## SPRINT 4: INTEGRACIÓN + TESTING + DEPLOY MVP

**📅 Fechas:** Semana 7-8 (14 días)
**🎯 Objetivo:** Onboarding wizard, reportes programados, N8N integration, testing completo, deploy en producción.

### HUs Asignadas

| HU | Título | SP | Developer |
|----|--------|----|-----------|
| HU-025 | Configuración de integraciones N8N | 8 | Dev A |
| HU-026 | Configuración de notificaciones internas | 5 | Dev A |
| HU-027 | Onboarding wizard de primer uso | 8 | Dev B |
| HU-022 | Reportes programados (scheduling) | 13 | Dev C |
| | **TOTAL SP** | **34** | |

### Actividades adicionales (no HUs)
- End-to-end testing de todos los flujos críticos
- Performance testing (JMeter/k6): 100 concurrent users
- Security audit: OWASP Top 10 checklist
- Load testing RabbitMQ con colas bajo estrés
- Documentación técnica final
- CI/CD pipeline completo (GitHub Actions → Docker → VPS)
- Deploy en producción VPS

### Hitos Sprint 4
- [ ] **Día 1-3:** Onboarding wizard — HU-027 ✅
- [ ] **Día 1-4:** N8N integration + notificaciones — HU-025, HU-026 ✅
- [ ] **Día 2-6:** Reportes programados — HU-022 ✅
- [ ] **Día 4-7:** E2E testing completo + bug fixes
- [ ] **Día 7-8:** Performance + security testing
- [ ] **Día 8-9:** Deploy production pipeline
- [ ] **Día 9-10:** **DEMO MVP FINAL** — Flujo completo desde registro hasta reporte programado

### Criterio de salida (Sprint 4 Exit — MVP READY)
- [ ] Todas las 27 HUs implementadas y aprobadas
- [ ] E2E tests passing: register → onboarding → pedido → WA → reporte
- [ ] Performance: API p95 < 500ms, dashboard < 1s
- [ ] Security: sin vulnerabilidades CRITICAL/HIGH en scan
- [ ] Deploy automatizado en VPS vía CI/CD
- [ ] Documentación de API actualizada (Swagger)
- [ ] README con instrucciones de deploy

---

## VELOCITY Y CAPACITY PLAN

```
Sprint 1:  29 SP  (estimado)  →  Capacidad team: 35-45 SP  →  Utilización: 64-83%  ✅
Sprint 2:  47 SP  (estimado)  →  Capacidad team: 35-45 SP  →  Utilización: 104-134% ⚠️
Sprint 3:  56 SP  (estimado)  →  Capacidad team: 35-45 SP  →  Utilización: 124-160% 🔴
Sprint 4:  34 SP  (estimado)  →  Capacidad team: 35-45 SP  →  Utilización: 76-97%  ✅

TOTAL:     166 SP
```

### Recomendaciones para ajustar capacity

**Si velocity real < 40 SP/sprint (escenario probable):**

| Movimiento | De → A | SP movidos |
|------------|--------|------------|
| HU-005 (Roles) | Sprint 2 → Sprint 3 | 8 SP |
| HU-024 (Planes) | Sprint 3 → Sprint 4 | 8 SP |
| HU-022 (Reportes programados) | Sprint 4 → Post-MVP backlog | 13 SP |

**Con ajustes:**
```
Sprint 1:  29 SP  ✅
Sprint 2:  39 SP  ✅
Sprint 3:  51 SP  (still tight, monitor daily)
Sprint 4:  34 SP  ✅
Post-MVP: HU-022 (13 SP) + HU-005 si no se movió
```

### Burndown por Sprint (ideal vs real)

```
Sprint 1: 29 SP → ideal 2.9 SP/día
Sprint 2: 47 SP → ideal 4.7 SP/día (alta presión)
Sprint 3: 56 SP → ideal 5.6 SP/día (muy alta presión)
Sprint 4: 34 SP → ideal 3.4 SP/día + buffer para deploy
```

---

## GESTIÓN DE RIESGOS POR SPRINT

| Sprint | Riesgo Principal | Acción |
|--------|-----------------|--------|
| S1 | Docker/DB setup take longer than expected | Día 1-2 exclusivo para infra; template de compose listo desde antes |
| S2 | WhatsApp sandbox rate limits | Usar Evolution API como fallback desde Día 1 de S2 |
| S3 | Scope creep en reportes (formatos, gráficos) | MVP reporte = tabla Excel simple; gráficos post-MVP |
| S4 | Deploy issues en producción | Staging environment idéntico a production; deploy rehearsal Día 8 |

---

## CEREMONIAS RECOMENDADAS

| Ceremonia | Frecuencia | Duración |
|-----------|-----------|----------|
| Daily standup | Diario | 15 min |
| Sprint planning | Inicio de sprint | 2 horas |
| Sprint review/demo | Fin de sprint (Día 10) | 1 hora |
| Retrospectiva | Fin de sprint (Día 10) | 45 min |
| Backlog refinement | Mitad de sprint | 1 hora |

---

## DEFINICIÓN DE MVP (Go/No-Go)

El MVP se considera **listo para lanzamiento** cuando:

1. ✅ Un usuario puede registrarse, configurar branding y conectar WhatsApp
2. ✅ Puede crear pedidos manualmente y recibir confirmación por WhatsApp
3. ✅ Puede buscar clientes y ver su historial
4. ✅ Puede ver dashboard de ventas en tiempo real
5. ✅ Puede generar y descargar un reporte de ventas
6. ✅ Las notificaciones automáticas funcionan (pedido nuevo → WhatsApp)
7. ✅ Multi-tenancy validado (aislamiento de datos)
8. ✅ Deploy en producción con CI/CD funcional

**No-Go criteria:**
- ❌ Pérdida de datos entre tenants
- ❌ API p95 > 2s bajo carga normal (50 usuarios)
- ❌ WhatsApp messages perdiendo >5% de envíos
- ❌ Bugs CRITICAL sin fix en funcionalidades core (auth, pedidos, WA)

---

*Document generated: 2026-03-18 | Version: 1.0 | Author: Alfred (PM Agent) | EGIT Consultoría*
