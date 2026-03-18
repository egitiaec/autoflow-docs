# Sprint Plan — AutoFlow
**Versión:** 1.1
**Fecha:** 2026-03-17
**Autor:** Axel (Scrum Master, EGIT Consultoría) / Doc (Documentador de Arquitectura)
**Changelog v1.1:** Agregado Sprint 8 (Facturación Electrónica SRI) y Sprint 9 (Configuración Contribuyente) para Epics 9-10
**Duración del Sprint:** 2 semanas (10 días laborables)
**Velocidad estimada:** 40-50 SP por sprint
**Metodología:** Scrum con daily standups, sprint planning, review y retrospective

---

## Visión General del Proyecto

| Parámetro | Valor |
|-----------|-------|
| **Total HUs** | 66 |
| **Total Story Points** | 379 |
| **Total Epics** | 10 + 1 extensión (Chatbot N8N) |
| **Sprints de desarrollo** | 7 + 1 (setup) + 2 (facturación) = 10 sprints |
| **Duración total** | 20 semanas (~5 meses) |
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

## Sprint 8 — Facturación Electrónica SRI (Semana 17-18)

**Objetivo:** Generación completa de comprobantes electrónicos: factura, nota de crédito, retención, firma XML, envío al SRI, autorización y generación de PDF con QR de validación.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-053 | Generar factura electrónica con clave de acceso | Epic 9 | 8 |
| HU-054 | Enviar comprobante al SRI para autorización | Epic 9 | 8 |
| HU-055 | Recibir y almacenar factura autorizada con número de autorización | Epic 9 | 5 |
| HU-056 | Generar XML firmado electrónicamente | Epic 9 | 8 |
| HU-057 | Generar nota de crédito electrónica | Epic 9 | 8 |
| HU-058 | Generar comprobante de retención electrónico | Epic 9 | 8 |
| HU-059 | Cliente valida factura con código QR en web del SRI | Epic 9 | 5 |
| **TOTAL SPRINT 8** | | **7 HUs** | **50 SP** |

### Objetivo del Sprint
> "El sistema genera comprobantes electrónicos completos (facturas, notas de crédito, retenciones), los firma con certificado digital, los envía al SRI para autorización, y genera PDFs con QR de validación que el cliente puede verificar."

### Dependencias
- billing-service operativo con PostgreSQL + integración SRI SOAP
- HashiCorp Vault configurado para almacenar certificados .p12
- Integración con orders-service (evento `order.confirmed`)
- MinIO para almacenar XMLs autorizados, PDFs y QRs
- Integración con crm-service para datos del receptor (RUC/cédula, nombre, dirección)
- Google Cloud SOAP client para web services del SRI

---

## Sprint 9 — Configuración Contribuyente + Chatbot N8N (Semana 19-20)

**Objetivo:** Configuración completa del contribuyente ante el SRI: datos fiscales, upload de certificado .p12, selección de proveedor de firma, gestión de ambientes. Además, integración del chatbot web con N8N para captura de prospectos.

### Historias de Usuario

| HU | Título | Epic | SP |
|----|--------|------|:--:|
| HU-060 | Configurar datos del contribuyente | Epic 10 | 5 |
| HU-061 | Subir y configurar certificado de firma electrónica (.p12/.pfx) | Epic 10 | 5 |
| HU-062 | Almacenar certificado y contraseña en HashiCorp Vault | Epic 10 | 8 |
| HU-063 | Seleccionar y configurar proveedor de firma electrónica | Epic 10 | 3 |
| HU-064 | Generar clave de acceso de 49 dígitos según normativa SRI | Epic 10 | 5 |
| HU-065 | Configurar ambiente SRI (pruebas → producción) | Epic 10 | 5 |
| HU-066 | Integración chatbot con N8N (prospectos) | Epic 8 ext. | 5 |
| **TOTAL SPRINT 9** | | **7 HUs** | **36 SP** |

### Objetivo del Sprint
> "El Admin configura todos los datos fiscales de su empresa, sube el certificado digital, selecciona proveedor de firma y gestiona la transición a producción del SRI. Además, el chatbot web captura prospectos y los envía a N8N para automatización."

### Dependencias
- billing-config-service operativo con integración HashiCorp Vault
- Vault desplegado y accesible para lectura/escritura de secrets
- Proveedores de firma electrónica disponibles (BCE, SDS, etc.)
- N8N instance: `https://n8n.egit.site` con workflow `egit-prospectos`
- MongoDB para colección `prospects`

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
| **Sprint 8** | 17-18 | 7 | 50 | Facturación electrónica SRI (facturas, NC, retenciones) |
| **Sprint 9** | 19-20 | 7 | 36 | Configuración contribuyente + certificado + chatbot N8N |
| **TOTAL** | **20 semanas** | **66 HUs** | **379 SP** | **MVP completo con facturación electrónica + chatbot** |

> **Nota:** Epics 1-8 cubren 52 HUs (Sprints 1-7). Epic 9 agrega 7 HUs (Sprint 8). Epic 10 agrega 6 HUs (Sprint 9). Total: 65 HUs incluidas en los sprints.

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
    │        │                 └──► Sprint 7 (Reportes + Rate Limit)
    │        │                          │
    │        │                          ├──► Sprint 8 (Facturación Electrónica SRI)
    │        │                          │        │
    │        │                          │        └──► Sprint 9 (Config Contribuyente + Chatbot N8N)
    │        │                          │
    │        └──────────────────────────┴──► MVP Listo 🚀
    │
    └── Inversión en infraestructura
```

### Distribución por Epic

| Epic | Nombre | HUs | SP | Sprints |
|------|--------|:---:|:--:|---------|
| Epic 1 | Autenticación & Usuarios | 8 | 42 | Sprint 1 |
| Epic 2 | CRM (Clientes, Pipeline) | 7 | 34 | Sprint 2 |
| Epic 3 | Pedidos & Catálogo | 6 | 39 | Sprint 3 |
| Epic 4 | WhatsApp (Evolution API) | 6 | 33 | Sprint 4 |
| Epic 5 | Notificaciones (FCM + Email) | 5 | 27 | Sprint 5 |
| Epic 6 | Sistema de Citas (Google Calendar) | 8 | 47 | Sprint 5-6 |
| Epic 7 | Reportes & Dashboard | 5 | 34 | Sprint 7 |
| Epic 8 | Configuración Multi-tenant | 7 | 37 | Sprints 1-6 |
| Epic 8 ext | Integración Chatbot N8N | 1 | 5 | Sprint 9 |
| Epic 9 | Facturación Electrónica (SRI) | 7 | 50 | Sprint 8 |
| Epic 10 | Configuración Facturación Electrónica | 6 | 31 | Sprint 9 |
| **TOTAL** | | **66** | **379** | **10 sprints** |

---

*Documento generado por Axel (Scrum Master, AutoFlow — EGIT Consultoría) / Doc (Documentador de Arquitectura)*
*Basado en 65 Historias de Usuario de Maya (Epics 1-10)*
*Fecha: 2026-03-17*
*Actualizado: 2026-03-17 — Agregados Sprint 8 (Facturación SRI) y Sprint 9 (Config Contribuyente + Chatbot)*
