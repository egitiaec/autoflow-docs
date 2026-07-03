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
| HU-039 | **[FE]** Scaffold Angular + autenticación | 8 | Dev FE |
| HU-040 | **[FE]** Layout principal (sidebar, header) | 5 | Dev FE |
| | **TOTAL SP** | **60** | |

> ⚠️ **60 SP es ambicioso.** Si el velocity real de Sprint 1 fue < 40, mover HU-005 (roles, 8 SP) a Sprint 3. HUs de frontend asignadas a Dev FE dedicado (paralelo al backend).

### Hitos Sprint 2
- [ ] **Día 1-3:** CRM service: clientes CRUD + búsqueda MongoDB — HU-011, HU-012 ✅
- [ ] **Día 1-3:** **[FE]** Scaffold Angular + login/registro — HU-039 ✅
- [ ] **Día 3-5:** Etiquetas + roles — HU-013, HU-005 ✅
- [ ] **Día 3-5:** **[FE]** Layout con sidebar + routing — HU-040 ✅
- [ ] **Día 3-6:** WhatsApp connection + webhook + envío — HU-016, HU-017 ✅
- [ ] **Día 5-7:** Detalle pedido + inventario — HU-009, HU-010 ✅
- [ ] **Día 8-10:** Testing cross-service, correcciones
- [ ] **Día 10:** **DEMO SPRINT 2** — Login web → buscar cliente → crear pedido con inventario → enviar confirmación WA

### Criterio de salida (Sprint 2 Exit)
- [ ] Flujo: registrar cliente → buscar → crear pedido con stock → enviar WA de confirmación
- [ ] **[FE]** Login y registro funcionales en Angular consumiendo API
- [ ] **[FE]** Layout con sidebar y navegación entre módulos
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
| HU-041 | **[FE]** Dashboard de ventas (frontend) | 8 | Dev FE |
| HU-042 | **[FE]** Gestión de pedidos (frontend) | 8 | Dev FE |
| HU-043 | **[FE]** CRM — clientes (frontend) | 8 | Dev FE |
| | **TOTAL SP** | **80** | |

> ⚠️ **80 SP es muy ambicioso.** Se recomienda mover HU-015 (notas, 3 SP) y HU-024 (planes, 8 SP) a Sprint 4 si hay riesgo de slippage. HUs frontend (24 SP) van en paralelo con Dev FE dedicado.

### Hitos Sprint 3
- [ ] **Día 1-3:** CRM historial + notas — HU-014, HU-015 ✅
- [ ] **Día 1-4:** **[FE]** Dashboard de ventas + gestión de pedidos — HU-041, HU-042 ✅
- [ ] **Día 2-5:** WhatsApp templates + Evolution API — HU-018, HU-019 ✅
- [ ] **Día 3-6:** Dashboard de ventas + reporte exportable — HU-020, HU-021 ✅
- [ ] **Día 5-7:** **[FE]** CRM clientes — HU-043 ✅
- [ ] **Día 5-8:** Branding + planes — HU-023, HU-024 ✅
- [ ] **Día 8-10:** Testing, performance tuning
- [ ] **Día 10:** **DEMO SPRINT 3** — Dashboard web con datos → crear pedido desde panel → ver clientes → generar reporte Excel

### Criterio de salida (Sprint 3 Exit)
- [ ] Dashboard con KPIs en tiempo real (cache 60s)
- [ ] **[FE]** Dashboard, pedidos y CRM funcionales en Angular
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
| HU-044 | **[FE]** Configuración y branding (frontend) | 5 | Dev FE |
| HU-045 | **[FE]** Conversaciones WhatsApp (frontend) | 8 | Dev FE |
| | **TOTAL SP** | **47** | |

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
- [ ] **Día 1-4:** **[FE]** Config/branding + WhatsApp chat — HU-044, HU-045 ✅
- [ ] **Día 2-6:** Reportes programados — HU-022 ✅
- [ ] **Día 4-7:** E2E testing completo + bug fixes
- [ ] **Día 7-8:** Performance + security testing
- [ ] **Día 8-9:** Deploy production pipeline
- [ ] **Día 9-10:** **DEMO MVP FINAL** — Flujo completo web: registro → onboarding → pedido → WA chat → reporte

### Criterio de salida (Sprint 4 Exit — MVP READY)
- [ ] Todas las 32 HUs MVP (27 backend + 5 frontend) implementadas y aprobadas
- [ ] **[FE]** Panel web completo: auth, dashboard, pedidos, CRM, WhatsApp, config
- [ ] E2E tests passing: register → onboarding → pedido → WA → reporte
- [ ] Performance: API p95 < 500ms, dashboard < 1s
- [ ] Security: sin vulnerabilidades CRITICAL/HIGH en scan
- [ ] Deploy automatizado en VPS vía CI/CD
- [ ] Documentación de API actualizada (Swagger)
- [ ] README con instrucciones de deploy

---

## SPRINT 5: FACTURACIÓN ELECTRÓNICA SRI (FASE 2)

**📅 Fechas:** Semana 9-10 (14 días)
**🎯 Objetivo:** Configuración fiscal, gestión de certificados, generación de facturas electrónicas, firma XML y envío al SRI. Inicio del módulo de citas.

### HUs Asignadas

| HU | Título | SP | Developer |
|----|--------|----|-----------|
| HU-028 | Configuración fiscal del contribuyente | 5 | Dev A |
| HU-029 | Gestión de certificados digitales (.p12) | 8 | Dev A |
| HU-030 | Generación de factura electrónica | 13 | Dev B |
| HU-031 | Firma electrónica y envío al SRI | 13 | Dev C |
| HU-033 | Configuración de horarios de atención | 5 | Dev FE |
| HU-034 | Tipos de servicio con duración y precio | 3 | Dev FE |
| | **TOTAL SP** | **47** | |

### Hitos Sprint 5
- [ ] **Día 1-2:** Configuración fiscal del tenant — HU-028 ✅
- [ ] **Día 2-5:** Certificados digitales — HU-029 ✅
- [ ] **Día 2-7:** Generación de facturas + clave de acceso 49 dígitos — HU-030 ✅
- [ ] **Día 3-8:** Firma XML + envío SRI + autorización — HU-031 ✅
- [ ] **Día 1-4:** Horarios de atención + tipos de servicio — HU-033, HU-034 ✅
- [ ] **Día 8-10:** Testing con ambiente de pruebas del SRI
- [ ] **Día 10:** **DEMO SPRINT 5** — Confirmar pedido → factura generada → firmada → autorizada por SRI → PDF con QR

### Criterio de salida (Sprint 5 Exit)
- [ ] Flujo completo: pedido confirmado → factura generada → XML firmado → enviado al SRI → autorizado
- [ ] Certificado .p12 subido y validado
- [ ] Clave de acceso de 49 dígitos generada correctamente según algoritmo SRI
- [ ] PDF con QR de validación generado
- [ ] Testing exitoso contra ambiente de pruebas del SRI
- [ ] Horarios de atención y tipos de servicio configurables

---

## SPRINT 6: CITAS + NOTAS DE CRÉDITO (FASE 2)

**📅 Fechas:** Semana 11-12 (14 días)
**🎯 Objetivo:** Sistema de citas completo (reserva, cancelación, Google Calendar, recordatorios), notas de crédito electrónicas.

### HUs Asignadas

| HU | Título | SP | Developer |
|----|--------|----|-----------|
| HU-032 | Notas de crédito electrónicas | 8 | Dev A |
| HU-035 | Reserva de cita con verificación de disponibilidad | 8 | Dev B |
| HU-036 | Gestión de citas (cancelar, reprogramar, no-show) | 5 | Dev B |
| HU-037 | Integración con Google Calendar | 8 | Dev C |
| HU-038 | Recordatorios automáticos de citas | 5 | Dev C |
| | **TOTAL SP** | **34** | |

### Hitos Sprint 6
- [ ] **Día 1-4:** Reserva de citas + disponibilidad — HU-035 ✅
- [ ] **Día 1-4:** Notas de crédito electrónicas — HU-032 ✅
- [ ] **Día 4-7:** Cancelaciones + reprogramación + no-shows — HU-036 ✅
- [ ] **Día 4-8:** Google Calendar sync — HU-037 ✅
- [ ] **Día 6-8:** Recordatorios automáticos — HU-038 ✅
- [ ] **Día 8-10:** Testing cross-module + integración con WhatsApp para recordatorios
- [ ] **Día 10:** **DEMO FASE 2** — Reservar cita → confirmación WA → Google Cal → recordatorio → factura SRI

### Criterio de salida (Sprint 6 Exit — FASE 2 READY)
- [ ] Sistema de citas completo: reservar, cancelar, reprogramar, no-show
- [ ] Google Calendar sincronizado bidireccionalmente
- [ ] Recordatorios automáticos 24h y 2h antes vía WhatsApp + Push
- [ ] Notas de crédito electrónicas autorizadas por SRI
- [ ] Distributed lock previene doble reserva en mismos slots
- [ ] E2E: cita → confirmación WA → recordatorio → completada → factura

---

## VELOCITY Y CAPACITY PLAN

```
--- MVP (Sprints 1-4) ---
Sprint 1:  29 SP  (backend)       →  Capacidad: 35-45 SP   →  Utilización: 64-83%   ✅
Sprint 2:  60 SP  (47 BE + 13 FE) →  Capacidad: 50-60 SP*  →  Utilización: 100-120% ⚠️
Sprint 3:  80 SP  (56 BE + 24 FE) →  Capacidad: 50-60 SP*  →  Utilización: 133-160% 🔴
Sprint 4:  47 SP  (34 BE + 13 FE) →  Capacidad: 50-60 SP*  →  Utilización: 78-94%   ✅

--- Fase 2 (Sprints 5-6) ---
Sprint 5:  47 SP  (billing + citas)  →  Capacidad: 35-45 SP  →  Utilización: 104-134% ⚠️
Sprint 6:  34 SP  (citas + NC)       →  Capacidad: 35-45 SP  →  Utilización: 76-97%   ✅

TOTAL MVP:   216 SP (4 sprints)
TOTAL Fase2:  81 SP (2 sprints)
TOTAL:       297 SP (6 sprints — 12 semanas)
```

### Recomendaciones para ajustar capacity

**Si velocity real < 40 SP/sprint (escenario probable):**

| Movimiento | De → A | SP movidos |
|------------|--------|------------|
| HU-005 (Roles) | Sprint 2 → Sprint 3 | 8 SP |
| HU-024 (Planes) | Sprint 3 → Sprint 4 | 8 SP |
| HU-022 (Reportes programados) | Sprint 4 → Sprint 5 | 13 SP |
| HU-043 (FE CRM) | Sprint 3 → Sprint 4 | 8 SP |

> *Capacidad 50-60 SP en Sprints 2-4 asume Dev FE dedicado trabajando en paralelo (no compite por capacidad backend).

**Con ajustes (backend only):**
```
Sprint 1:  29 SP  ✅
Sprint 2:  39 SP  ✅ (movió HU-005)
Sprint 3:  48 SP  (still tight, monitor daily)
Sprint 4:  37 SP  ✅
Sprint 5:  60 SP  (billing + HU-022 movido) — considerar extensión
Sprint 6:  34 SP  ✅
```

### Burndown por Sprint (ideal vs real)

```
Sprint 1: 29 SP → ideal 2.9 SP/día
Sprint 2: 60 SP → ideal 6.0 SP/día (alta presión; 4.7 BE + 1.3 FE)
Sprint 3: 80 SP → ideal 8.0 SP/día (muy alta presión; 5.6 BE + 2.4 FE)
Sprint 4: 47 SP → ideal 4.7 SP/día + buffer para deploy
Sprint 5: 47 SP → ideal 4.7 SP/día (facturación SRI requiere testing con SRI)
Sprint 6: 34 SP → ideal 3.4 SP/día + buffer para integración final
```

---

## GESTIÓN DE RIESGOS POR SPRINT

| Sprint | Riesgo Principal | Acción |
|--------|-----------------|--------|
| S1 | Docker/DB setup take longer than expected | Día 1-2 exclusivo para infra; template de compose listo desde antes |
| S2 | WhatsApp sandbox rate limits | Usar Evolution API como fallback desde Día 1 de S2 |
| S2 | Angular scaffold + API integration | Usar proxy config de Angular para evitar CORS; mock API con json-server si backend no está listo |
| S3 | Scope creep en reportes (formatos, gráficos) | MVP reporte = tabla Excel simple; gráficos post-MVP |
| S4 | Deploy issues en producción | Staging environment idéntico a production; deploy rehearsal Día 8 |
| S5 | SRI web service inestable en ambiente de pruebas | Implementar mocks del SRI para testing local; retry con backoff |
| S5 | Certificados .p12 de prueba difíciles de obtener | Generar certificado autofirmado para desarrollo; usar ambiente pruebas del SRI |
| S6 | Google Calendar API requiere configuración OAuth compleja | Usar Service Account con delegación de dominio; graceful degradation si falla |

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
9. ✅ **[FE]** Panel web Angular funcional: login, dashboard, pedidos, CRM, WhatsApp, config

### Definición de Fase 2 (Go/No-Go)

La Fase 2 se considera **lista** cuando:

1. ✅ Facturas electrónicas generadas y autorizadas por SRI (ambiente producción)
2. ✅ Notas de crédito electrónicas funcionales
3. ✅ Sistema de citas: reservar, cancelar, reprogramar, no-show
4. ✅ Google Calendar sincronizado
5. ✅ Recordatorios automáticos 24h y 2h antes

**No-Go criteria:**
- ❌ Pérdida de datos entre tenants
- ❌ API p95 > 2s bajo carga normal (50 usuarios)
- ❌ WhatsApp messages perdiendo >5% de envíos
- ❌ Bugs CRITICAL sin fix en funcionalidades core (auth, pedidos, WA)
- ❌ Facturas electrónicas rechazadas por SRI en ambiente producción (Fase 2)

---

*Document generated: 2026-03-18 | Version: 2.0 | Updated: 2026-07-02 | Author: Alfred (PM Agent) | EGIT Consultoría*
