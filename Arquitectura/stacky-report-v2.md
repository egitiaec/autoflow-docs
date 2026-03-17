# Stacky Report v2.0 — Reestructuración del ADR-001

| Campo | Valor |
|-------|-------|
| **Autor** | Stacky (Research Engineer, I+D EGIT) |
| **Fecha** | 17 Marzo 2026 |
| **Versión** | v2.0 |
| **Tipo** | Reporte Ejecutivo |
| **Destinatario** | Eduardo (CEO, EGIT Consultoría) |

---

## 1. Resumen Ejecutivo

El ADR-001 (Architecture Decision Record) de AutoFlow ha sido **reescrito completamente** para reflejar el stack tecnológico definitivo aprobado por Eduardo. La versión anterior (v1.0, 16 Mar 2026) documentaba un stack basado en Node.js + Fastify + Supabase + Vercel/Railway que fue descartado en su totalidad.

**El nuevo stack v2.0 es:**
- Arquitectura de microservicios con Spring Boot 3 (Java 21 LTS)
- Apps nativas: Android (Kotlin + Jetpack Compose) / iOS (SwiftUI)
- Full self-hosted: PostgreSQL + MongoDB + Redis + RabbitMQ + MinIO + N8N + Evolution API
- Despliegue: Docker Compose en VPS propio → Kubernetes (>50 clientes)
- **Costo MVP: $3-7/mes** (vs $1-7 con stack v1.0, pero con mucho más control y sin vendor lock-in)

---

## 2. Cambios Clave: v1.0 → v2.0

| Capa | Stack v1.0 (descartado) | Stack v2.0 (aprobado) | Razón del cambio |
|------|------------------------|----------------------|-----------------|
| **Arquitectura** | Monolito | Microservicios | Decisión estratégica de Eduardo — escalabilidad |
| **Backend** | Node.js + Fastify + TypeScript | Spring Boot 3 + Java 21 LTS | Enterprise-grade, soporte hasta 2031+ |
| **BD Relacional** | PostgreSQL (Supabase managed) | PostgreSQL 17.x (self-hosted) | Eliminar vendor lock-in, control total |
| **BD NoSQL** | No incluida | MongoDB 8.x (self-hosted) | Logs, chat history, auditoría con schema flexible |
| **Cache** | Redis (Supabase) | Redis 7.4.x (self-hosted) | Sesiones, rate limiting, cache distribuido |
| **Auth** | Supabase Auth | Spring Security + JWT | Eliminar dependencia de Supabase |
| **Mensajería** | No incluida | RabbitMQ 3.13.x | Desacoplamiento entre microservicios |
| **WhatsApp** | WhatsApp Cloud API (Meta) | Evolution API (self-hosted) | Sin costos por conversación, control total |
| **Push Notifications** | No definido | Firebase Cloud Messaging (FCM) | Plataforma gratuita, soporte multi-plataforma |
| **File Storage** | Supabase Storage | MinIO (S3-compatible) | Self-hosted, API S3-compatible para migración futura |
| **DB Migrations** | No definido | Flyway + Mongock | Migraciones versionadas y auditables |
| **Frontend Hosting** | Vercel | Eliminado (apps nativas) | Apps nativas reemplazan frontend web |
| **Backend Hosting** | Railway | Docker Compose en VPS | Costos predecibles, control total |
| **Reverse Proxy** | No definido | Caddy 2.9.x | SSL automático, configuración simple |
| **Apps Móviles** | React Native (Expo) — v1.1+ | Nativas desde v1.0 | UX superior, performance, acceso completo a APIs |

---

## 3. Análisis de Costos Comparativo

### 3.1 Por Etapa

| Etapa | Stack v1.0 | Stack v2.0 | Diferencia |
|-------|-----------|-----------|------------|
| **MVP (0-50 clientes)** | $1-7/mes | $3-7/mes | +$0-2/mes |
| **Crecimiento (50-200)** | $88-100/mes | $6-17/mes | **-$71-93/mes** |
| **Escalado (200+)** | $133-203/mes | $30-75/mes | **-$58-128/mes** |

### 3.2 Ahorro Anual Proyectado

| Escenario | Ahorro anual vs stack v1.0 |
|-----------|---------------------------|
| **50-200 clientes** | $852 - $1,116/año |
| **200-500 clientes** | $1,236 - $2,736/año |

> El stack v2.0 tiene un costo inicial marginalmente mayor pero **ahorra significativamente a mediano y largo plazo** al eliminar los costos de Vercel Pro ($20/mes), Railway usage-based ($15-80/mes), y Supabase Pro ($25/mes).

---

## 4. Arquitectura de Microservicios

Se definen 6 microservicios de negocio + 3 servicios de infraestructura:

| # | Servicio | Puerto | BD Principal | Mensajería |
|---|----------|--------|--------------|------------|
| 1 | API Gateway | 8080 | — | — |
| 2 | Auth Service | 8081 | PostgreSQL | — |
| 3 | CRM Service | 8082 | PostgreSQL | RabbitMQ |
| 4 | Orders Service | 8083 | PostgreSQL | RabbitMQ |
| 5 | WhatsApp Service | 8084 | MongoDB | RabbitMQ |
| 6 | Notifications Service | 8085 | Redis | RabbitMQ |
| 7 | Reports Service | 8086 | PostgreSQL + MongoDB | — |

---

## 5. Riesgos Identificados

| # | Riesgo | Nivel | Mitigación |
|---|--------|-------|------------|
| 1 | **Single point of failure** (1 solo VPS) | ⚠️ Medio | Backups diarios + plan de failover a segundo VPS |
| 2 | **Complejidad operativa** (9+ servicios auto-gestionados) | ⚠️ Medio | Docker Compose documentado, scripts de deploy automatizados |
| 3 | **Curva de aprendizaje** Spring Boot | 🔴 Alto | Empezar con auth-service (más simple), pair programming |
| 4 | **Evolution API** puede romper con actualizaciones de WhatsApp | ⚠️ Medio | WhatsApp Cloud API como fallback planificado |
| 5 | **Sin auto-scaling** en VPS | ⚠️ Medio | Monitoreo CPU/RAM, upgrade inmediato si >80% |

---

## 6. Roadmap de Implementación

| Fase | Timeline | Entregable |
|------|----------|------------|
| **Fase 0** — Infraestructura | Semana 1 | VPS configurado, Docker Compose base, Caddy, Redis |
| **Fase 1** — Core Services | Semanas 2-3 | Auth Service + API Gateway + PostgreSQL + Flyway |
| **Fase 2** — WhatsApp + N8N | Semana 4 | WhatsApp Service + Evolution API + N8N workflows |
| **Fase 3** — Business Logic | Semanas 5-6 | CRM Service + Orders Service + MongoDB + RabbitMQ |
| **Fase 4** — Apps Nativas | Semanas 7-10 | Android (Kotlin) + iOS (SwiftUI) + FCM |
| **Fase 5** — Reports + Polish | Semanas 11-12 | Reports Service + MinIO + testing + launch prep |

---

## 7. Conclusión

El stack v2.0 representa una **inversión estratégica en autonomía y escalabilidad**. Aunque la complejidad operativa es mayor que un stack managed (v1.0), los beneficios superan los costos:

- **Sin vendor lock-in** — migramos cuando queremos, a donde queremos
- **Costos predecibles** — VPS fija vs usage-based cloud
- **Stack enterprise-grade** — Spring Boot + Java 21 LTS (soporte 5+ años)
- **Escalabilidad probada** — Microservicios → K8s es un path bien documentado

**Recomendación:** Proceder con la Fase 0 (infraestructura) inmediatamente. El primer microservicio (auth-service) debe estar corriendo en Docker en el VPS esta semana.

---

*Reporte generado por Stacky — Research Engineer, I+D EGIT*  
*17 Marzo 2026*
