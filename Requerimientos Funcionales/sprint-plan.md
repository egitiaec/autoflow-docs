# Sprint Plan — AutoFlow
**Versión:** 1.0  
**Fecha:** 2026-03-17  
**Autor:** Axel (Scrum Master, EGIT Consultoría)  
**Duración del Sprint:** 2 semanas (10 días laborables)  
**Velocidad estimada:** 40-50 SP por sprint  
**Metodología:** Scrum con daily standups, sprint planning, review y retrospective

---

## Visión General del Proyecto

| Parámetro | Valor |
|-----------|-------|
| **Total HUs** | 52 |
| **Total Story Points** | 293 |
| **Sprints de desarrollo** | 7 + 1 (setup) = 8 sprints |
| **Duración total** | 16 semanas (~4 meses) |
| **Team size estimado** | 3-4 developers (2 backend, 1-2 frontend) + 1 QA |

---

## Sprint 0 — Setup de Infraestructura (Semana 1-2)

**Objetivo:** Levantar toda la infraestructura base del proyecto. Nada de funcionalidad de negocio, solo cimientos técnicos.

### Tareas del Sprint 0

| Tarea | Descripción | SP |
|-------|-------------|:--:|
| Setup repos Git | Crear repositorios por microservicio + monorepo de infraestructura | 2 |
| Docker Compose base | PostgreSQL, MongoDB, Redis, RabbitMQ, MinIO | 3 |
| CI/CD pipeline | GitHub Actions: build, test, docker push | 5 |
| API Gateway setup | Spring Cloud Gateway con JWT validation y rate limiting | 8 |
| Base de datos auth-service | Flyway migrations iniciales (tenant, user, refresh_token) | 3 |
| Base de datos crm-service | Flyway migrations (client, interaction, tag, pipeline_stage) | 3 |
| Base de datos orders-service | Flyway migrations (order, order_item, product, product_category) | 3 |
| Base de datos appointment-service | Flyway migrations (appointment, service, business_hours) | 3 |
| MongoDB collections | Scripts de inicialización para whatsapp + notifications | 2 |
| Redis setup | Configuración de keyspace, TTL policies | 2 |
| RabbitMQ setup | Crear exchanges, colas y dead letter queues | 3 |
| MinIO setup | Buckets: invoices, avatars, media, exports, templates | 2 |
| Config centralizada | Spring Cloud Config o config maps por servicio | 3 |
| Swagger/OpenAPI | Setup de documentación de APIs por servicio | 2 |
| Monitoring setup | Prometheus + Grafana + health checks | 3 |
| **TOTAL SPRINT 0** | | **47 SP** |

---

## Sprint 1 — Autenticación & Configuración Base (Semana 3-4)

**Objetivo:** Autenticación completa (registro, login, RBAC) + configuración del tenant. El usuario puede registrar empresa, loguearse y configurar su negocio.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-001 | Registro de empresa (tenant) | Epic 1 | 8 |
| HU-002 | Login de usuario | Epic 1 | 5 |
| HU-003 | Renovación de sesión (Refresh Token) | Epic 1 | 5 |
| HU-004 | Consultar perfil del usuario autenticado | Epic 1 | 3 |
| HU-005 | Gestión de usuarios del tenant | Epic 1 | 8 |
| HU-006 | Asignación de roles y permisos | Epic 1 | 5 |
| HU-007 | Recuperación de contraseña | Epic 1 | 5 |
| HU-008 | Logout y cierre de sesión | Epic 1 | 3 |
| HU-046 | Configurar perfil e información de la empresa | Epic 8 | 3 |
| **TOTAL SPRINT 1** | | **8 HUs** | **45 SP** |

### Objetivo del Sprint
> "Cualquier usuario puede registrar su empresa, iniciar sesión, gestionar su equipo y configurar la información básica de su negocio."

### Dependencias
- auth-service completamente funcional
- RabbitMQ para envío de emails de verificación/invitación
- MinIO para almacenamiento de avatares

---

## Sprint 2 — CRM Core + Notificaciones Push (Semana 5-6)

**Objetivo:** CRM completo (clientes, pipeline, etiquetas, historial, vista 360°) + registro de dispositivos para push notifications.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-009 | Crear y editar cliente | Epic 2 | 5 |
| HU-010 | Buscar y filtrar clientes | Epic 2 | 5 |
| HU-011 | Ver historial de interacciones del cliente | Epic 2 | 5 |
| HU-012 | Gestionar pipeline de ventas | Epic 2 | 8 |
| HU-013 | Etiquetar y segmentar clientes | Epic 2 | 3 |
| HU-014 | Registrar interacción manual | Epic 2 | 3 |
| HU-015 | Vista 360° del cliente | Epic 2 | 5 |
| HU-028 | Registrar dispositivo para notificaciones push | Epic 5 | 3 |
| **TOTAL SPRINT 2** | | **8 HUs** | **37 SP** |

### Objetivo del Sprint
> "El equipo de ventas puede gestionar toda su cartera de clientes: crear fichas, organizarlos por etiquetas, hacer seguimiento en el pipeline y registrar cada interacción."

### Dependencias
- crm-service operativo con PostgreSQL + Redis
- Integración con auth-service para validar empleados asignados
- FCM configurado para registro de tokens

---

## Sprint 3 — Pedidos & Catálogo (Semana 7-8)

**Objetivo:** Catálogo de productos completo + ciclo de vida de pedidos + facturación PDF + pedido rápido desde WhatsApp.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-016 | Crear pedido | Epic 3 | 8 |
| HU-017 | Gestionar estados del pedido | Epic 3 | 5 |
| HU-018 | Ver historial de pedidos | Epic 3 | 5 |
| HU-019 | Gestionar catálogo de productos | Epic 3 | 8 |
| HU-020 | Generar factura en PDF | Epic 3 | 8 |
| HU-021 | Pedido rápido desde conversación WhatsApp | Epic 3 | 5 |
| **TOTAL SPRINT 3** | | **6 HUs** | **39 SP** |

### Objetivo del Sprint
> "El equipo puede crear y administrar pedidos con productos del catálogo, hacer seguimiento de estados y generar facturas PDF profesionales."

### Dependencias
- orders-service operativo con PostgreSQL + MinIO
- crm-service para asociar pedidos a clientes
- RabbitMQ para eventos de pedido (order.created, order.status_changed)
- iTextPDF para generación de facturas

---

## Sprint 4 — WhatsApp + Configuración WhatsApp (Semana 9-10)

**Objetivo:** Integración completa con WhatsApp vía Evolution API: bandeja de entrada, envío de mensajes y archivos, plantillas y configuración de la instancia.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-022 | Recibir y visualizar mensajes de WhatsApp | Epic 4 | 8 |
| HU-023 | Enviar mensajes de texto por WhatsApp | Epic 4 | 5 |
| HU-024 | Enviar mensajes con archivos adjuntos | Epic 4 | 5 |
| HU-025 | Gestionar plantillas de mensajes | Epic 4 | 5 |
| HU-026 | Ver historial completo de conversaciones | Epic 4 | 5 |
| HU-027 | Recibir notificación de mensaje nuevo | Epic 4 | 5 |
| HU-047 | Configurar integración con Evolution API (WhatsApp) | Epic 8 | 8 |
| **TOTAL SPRINT 4** | | **7 HUs** | **41 SP** |

### Objetivo del Sprint
> "El equipo puede atender a sus clientes directamente desde AutoFlow: ver conversaciones, responder mensajes, enviar archivos y usar plantillas para respuestas rápidas."

### Dependencias
- whatsapp-service operativo con MongoDB
- Integración con Evolution API (evolutionapi.egit.site)
- crm-service para vincular conversaciones con clientes
- notifications-service para push de mensajes nuevos
- MinIO para almacenamiento de multimedia

---

## Sprint 5 — Notificaciones + Citas Base (Semana 11-12)

**Objetivo:** Motor de notificaciones completo (push + email + plantillas) + configuración de horarios y servicios del sistema de citas + disponibilidad.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-029 | Enviar notificación push por evento del sistema | Epic 5 | 8 |
| HU-030 | Enviar email de notificación | Epic 5 | 8 |
| HU-031 | Gestionar plantillas de notificación | Epic 5 | 5 |
| HU-032 | Ver historial y estado de notificaciones | Epic 5 | 3 |
| HU-033 | Configurar horarios de atención del negocio | Epic 6 | 5 |
| HU-034 | Configurar tipos de servicio y duración | Epic 6 | 3 |
| HU-035 | Consultar disponibilidad de citas | Epic 6 | 8 |
| HU-048 | Configurar Firebase Cloud Messaging (push notifications) | Epic 8 | 5 |
| **TOTAL SPRINT 5** | | **8 HUs** | **45 SP** |

### Objetivo del Sprint
> "El sistema envía notificaciones automáticas por email y push ante eventos de negocio. Los clientes pueden consultar la disponibilidad de citas del negocio."

### Dependencias
- notifications-service operativo con Firebase Admin SDK + SMTP/SendGrid
- appointment-service operativo con PostgreSQL + Redis
- RabbitMQ consumiendo eventos de todos los servicios
- Google Calendar API configurado

---

## Sprint 6 — Citas Completo + Google Calendar + Config N8N (Semana 13-14)

**Objetivo:** Reserva, cancelación, reprogramación y recordatorios de citas. Sincronización con Google Calendar. Configuración de automatizaciones N8N y política de cancelación.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-036 | Reservar una cita | Epic 6 | 8 |
| HU-037 | Cancelar una cita | Epic 6 | 5 |
| HU-038 | Reprogramar una cita | Epic 6 | 5 |
| HU-039 | Recordatorios automáticos de cita | Epic 6 | 8 |
| HU-040 | Ver próximas citas y agenda del día | Epic 6 | 5 |
| HU-049 | Configurar integración con Google Calendar (citas) | Epic 8 | 8 |
| HU-050 | Configurar automatizaciones con N8N | Epic 8 | 5 |
| HU-051 | Configurar política de cancelación de citas | Epic 8 | 3 |
| **TOTAL SPRINT 6** | | **8 HUs** | **47 SP** |

### Objetivo del Sprint
> "Los clientes y el equipo pueden reservar, cancelar y reprogramar citas. Las citas se sincronizan con Google Calendar y los recordatorios se envían automáticamente."

### Dependencias
- appointment-service con Google Calendar API completo
- notifications-service para recordatorios (24h y 2h antes)
- N8N instance desplegada y accesible
- Redis para lock de slots

---

## Sprint 7 — Reportes, Dashboard + Rate Limiting (Semana 15-16)

**Objetivo:** Dashboard de KPIs, reportes de ventas/WhatsApp/citas, exportación CSV/PDF y rate limiting multi-tenant. Cierre del MVP.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-041 | Dashboard principal con KPIs del negocio | Epic 7 | 8 |
| HU-042 | Reporte de ventas y pedidos | Epic 7 | 8 |
| HU-043 | Métricas de WhatsApp | Epic 7 | 8 |
| HU-044 | Métricas de citas | Epic 7 | 5 |
| HU-045 | Exportar reportes a CSV y PDF | Epic 7 | 5 |
| HU-052 | Rate limiting y límites operativos del tenant | Epic 8 | 5 |
| **TOTAL SPRINT 7** | | **6 HUs** | **39 SP** |

### Objetivo del Sprint
> "El Admin puede visualizar el rendimiento de su negocio en tiempo real, generar reportes de ventas y comunicaciones, exportar datos y el sistema aplica límites de uso por plan."

### Dependencias
- reports-service con Materialized Views en PostgreSQL
- Consulta a MongoDB para métricas de WhatsApp
- Redis para cache del dashboard
- MinIO para almacenamiento de exports
- API Gateway con rate limiting por tenant

---

## Resumen de Sprints

| Sprint | Semanas | HUs | SP | Objetivo Principal |
|--------|---------|:---:|:--:|-------------------|
| **Sprint 0** | 1-2 | 0 (infra) | 47 | Setup infraestructura completa |
| **Sprint 1** | 3-4 | 8 | 45 | Auth + gestión de usuarios + config empresa |
| **Sprint 2** | 5-6 | 8 | 37 | CRM completo + registro FCM |
| **Sprint 3** | 7-8 | 6 | 39 | Pedidos + catálogo + facturación PDF |
| **Sprint 4** | 9-10 | 7 | 41 | WhatsApp bidireccional + config Evolution API |
| **Sprint 5** | 11-12 | 8 | 45 | Notificaciones push/email + disponibilidad citas |
| **Sprint 6** | 13-14 | 8 | 47 | Citas completo + Google Calendar + N8N |
| **Sprint 7** | 15-16 | 6 | 39 | Reportes + dashboard + rate limiting |
| **TOTAL** | **16 semanas** | **51 HUs** | **340 SP** | **MVP completo** |

> **Nota:** HU-046 fue incluida en Sprint 1 (parte de configuración base). Total: 52 HUs incluidas en los sprints.

---

## Definition of Done (DoD) Global

Un incremento de producto se considera "Done" cuando cumple **todos** los siguientes criterios:

1. ✅ Código escrito y revisado por al menos 1 peer (Code Review aprobado)
2. ✅ Unit tests escritos con cobertura mínima del 80%
3. ✅ Integration tests pasando para los endpoints/APIs involucrados
4. ✅ API documentada en OpenAPI/Swagger actualizada
5. ✅ Migraciones de base de datos ejecutadas y validadas
6. ✅ Frontend funcional (si aplica) — responsive, sin errores de consola
7. ✅ Pasado por QA — bugs críticos y altos resueltos
8. ✅ Actualizado el tablero de seguimiento (Jira/Trello) — HU movida a "Done"
9. ✅ Deploy exitoso en entorno de staging
10. ✅ Sin regressions en feature flags existentes
11. ✅ Logs estructurados implementados (no solo System.out)
12. ✅ Manejo de errores y edge cases considerado
13. ✅ Seguridad validada — no secrets en código, inputs validados, SQL injection protegido
14. ✅ Performance validada — endpoints responden en los tiempos definidos en las HUs
15. ✅ Documentación de cambio actualizada (si aplica)

---

## Definition of Ready (DoR) Global

Una Historia de Usuario está "Ready for Sprint" cuando cumple **todos** los siguientes criterios:

1. ✅ Historia clara con formato "Como [actor], quiero [acción], para [beneficio]"
2. ✅ Criterios de aceptación definidos (mínimo 4-5 por HU)
3. ✅ Story Points estimados por el equipo (consenso)
4. ✅ Dependencias identificadas y bloqueos resueltos (o planificados)
5. ✅ Diseño UI/UX disponible o aprobado (si aplica frontend)
6. ✅ Reglas de negocio documentadas y aprobadas por el Product Owner
7. ✅ La HU cabe en un solo sprint (máximo 13 SP)
8. ✅ Sin ambigüedades — el equipo puede comenzar a desarrollar sin preguntar al PO
9. ✅ Dependencias de servicios externos verificadas (APIs de terceros, etc.)
10. ✅ Prioridad asignada (Alta, Media, Baja) por el Product Owner

---

## Estándares del Equipo

### Capacidad por Sprint
- **Velocity estimada:** 40-50 SP por sprint
- **Días efectivos:** 8 por sprint (considerando daily, planning, review, retro)
- **Horas por developer:** ~60h por sprint (con meetings)

### Roles por Sprint
- **Sprint Planning:** Todo el equipo + PO
- **Daily Standup:** 15 min, todos los días
- **Sprint Review:** Demo del incremento al PO/stakeholders
- **Sprint Retro:** 45 min — qué fue bien, qué mejorar, action items

### Flujo de Trabajo
```
Backlog → Ready (DoR) → Sprint Backlog → In Progress → Code Review → QA → Done (DoD)
```

### Bloqueos y Gestión de Riesgos
- Si una HU supera los 2 días bloqueada, se escala al Scrum Master
- Si un servicio externo (Evolution API, Google Calendar) no está disponible, se trabaja con mock
- Dependencies entre sprints se documentan al inicio de cada planning
- El Sprint 0 se considera "inversión" — no genera funcionalidad pero es crítico para la calidad del proyecto

---

## Gráfico de Dependencias entre Sprints

```
Sprint 0 (infra)
    │
    ├──► Sprint 1 (Auth + Config Base)
    │        │
    │        ├──► Sprint 2 (CRM + FCM)
    │        │        │
    │        │        ├──► Sprint 3 (Pedidos) ──┐
    │        │        │                         │
    │        │        ├──► Sprint 4 (WhatsApp) ─┤
    │        │        │                         │
    │        │        └──► Sprint 5 (Notif + Citas base)
    │        │                 │
    │        │                 ├──► Sprint 6 (Citas + N8N + GCal)
    │        │                 │
    │        └─────────────────┴──► Sprint 7 (Reportes + Rate Limit)
    │
    └── MVP Listo 🚀
```

---

*Documento generado por Axel (Scrum Master, AutoFlow — EGIT Consultoría)*  
*Basado en 52 Historias de Usuario de Maya*  
*Fecha: 2026-03-17*
