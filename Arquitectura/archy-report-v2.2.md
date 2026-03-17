# Reporte Ejecutivo — ADR-002 v2.2
**Arquitecto:** Archy — Arquitecto en Jefe, EGIT Consultoría  
**Fecha:** 2026-03-17  
**Para:** Eduardo (CEO)  
**Documento actualizado:** `adr-002-arquitectura.md` → versión **2.2**

---

## Resumen

Aplicados los 4 cambios solicitados por Eduardo en la revisión del ADR-002 v2.1. El documento fue actualizado en la misma ruta y la versión fue incrementada a **v2.2**. El sistema queda con **8 microservicios** (se añadió `appointment-service`), integraciones externas bien definidas (Evolution API + FCM + Google Calendar) y un contrato funcional/técnico completo.

---

## Cambios Aplicados

### 1. ✅ whatsapp-service — Migración a Evolution API (self-hosted)

**Antes:** El servicio conectaba directamente a WhatsApp Business API de Meta (webhooks de Meta, `META_EVOLUTION_API_KEY`).

**Ahora:** El servicio se comunica exclusivamente con **Evolution API** como middleware, instancia ya desplegada por EGIT:
- URL: `evolutionapi.egit.site`
- Instancia: `miAsistente`
- Número: `593984526396`

**Qué cambió en el documento:**
- Título y descripción del servicio actualizados
- Diagrama de arquitectura incluye Evolution API como componente externo
- Webhook path cambiado: `/webhook/meta` → `/webhook/evolution`
- Variables de entorno actualizadas: `EVOLUTION_API_BASE_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `EVOLUTION_INSTANCE_NUMBER`, `EVOLUTION_WEBHOOK_SECRET`
- Diagramas C4 (Context y Container) actualizados
- Tabla de decisiones actualizada con justificación del cambio

---

### 2. ✅ Notificaciones Push — Firebase Cloud Messaging (FCM) especificado

**Antes:** El `notifications-service` mencionaba "Firebase Cloud Messaging" de forma genérica sin detalles de implementación.

**Ahora:** FCM queda especificado como **proveedor oficial** de push notifications para iOS y Android, con:
- SDK: `firebase-admin` Java SDK v9.x+
- Credenciales via Service Account JSON
- Soporte: individual, por topic y multicast (hasta 500 tokens)
- Plataformas: Android nativo + iOS (APNs vía FCM)
- Gestión de tokens: registro, actualización y limpieza de tokens expirados
- Nuevos endpoints: `POST /notifications/fcm/register-token`, `DELETE /notifications/fcm/token/{token}`
- Variables de entorno: `FCM_SERVICE_ACCOUNT_JSON`, `FCM_PROJECT_ID`
- Colección MongoDB `fcm_tokens` para gestión de dispositivos

---

### 3. ✅ Sección 0 — Especificaciones Funcionales y Técnicas Iniciales (nueva)

Añadida como **Sección 0** (antes del detalle técnico) para establecer el contrato del sistema. Contiene:

**Specs Funcionales:**
- Descripción de qué hace AutoFlow (7 capacidades core)
- Tabla de módulos principales con servicio responsable
- 4 flujos básicos documentados con secuencia paso a paso:
  1. Flujo: mensaje WhatsApp entrante
  2. Flujo: creación de pedido
  3. Flujo: reserva de cita *(nuevo)*
  4. Flujo: notificación push FCM

**Specs Técnicas:**
- **Performance:** Latencia p95 < 500ms (MVP), throughput 100 req/seg, 1.000 mensajes WhatsApp/hora
- **Disponibilidad:** SLAs por componente (99%–99.5% MVP), RPO 24h, RTO 2h, ventana de mantenimiento definida
- **Seguridad:** JWT RSA-256, RBAC, multi-tenancy, TLS 1.3, secretos por fase, rate limiting, auditoría
- **Escalabilidad:** Estrategia por eje (vertical → horizontal → cloud), triggers de escala definidos

---

### 4. ✅ appointment-service — Nuevo módulo de Citas (puerto 8087)

Añadido como **8vo microservicio** del sistema. Especificación completa:

**Descripción:** Gestión de citas para restaurantes, barberías, consultorios y clínicas.

**Integraciones:**
- **Google Calendar API:** Verificación de disponibilidad (`freebusy`) + sincronización bidireccional (crear/cancelar eventos)
- **APIs propias de terceros:** Adaptadores configurables por tenant para sistemas de gestión internos

**Flujo documentado:** Cliente solicita → verifica disponibilidad (Google Cal / sistema propio) → confirma → notifica por WhatsApp (Evolution API) + Push (FCM) → programa recordatorios (N8N)

**Reglas de negocio definidas:**
- Horarios de atención (días, horas, excepciones)
- Duración de turnos y buffer entre citas
- Anticipación mínima y máxima para reservar
- Política de cancelaciones configurable por tenant
- Registro de no-shows
- Recordatorios: 24h antes (WhatsApp + Push) + 2h antes (Push)
- Lock optimista en PostgreSQL para evitar doble reserva

**Modelo de datos:** 4 tablas PostgreSQL documentadas (`appointments`, `appointment_services`, `business_schedules`, `tenant_integrations`)

**Endpoints:** 8 endpoints REST documentados

**Eventos RabbitMQ añadidos:** `appointment.created`, `appointment.confirmed`, `appointment.cancelled`, `appointment.reminder`

**CI/CD:** Añadido al pipeline de GitHub Actions

**Estructura de directorios:** Directorio `services/appointment-service/` añadido con `integration/` para adaptadores

---

## Estado Final del Documento

| Métrica | v2.1 | v2.2 |
|---------|------|------|
| Microservicios | 7 | **8** (+appointment-service) |
| Integraciones externas documentadas | 0 (genéricas) | **4** (Evolution API, FCM, Google Calendar, APIs propias) |
| Secciones | 12 | **12 + Sección 0** (specs iniciales) |
| Variables de entorno documentadas | 11 | **17** (+6 nuevas) |
| Eventos RabbitMQ | 5 | **9** (+4 de citas) |
| Puerto máximo | 8086 | **8087** |
| Tamaño del documento | ~15 KB | **~51 KB** |

**Veredicto:** Documento listo para aprobación final. ✅

---

*Reporte generado por Archy — Arquitecto en Jefe, AutoFlow / EGIT Consultoría*  
*2026-03-17*
