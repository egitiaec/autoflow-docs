# ADR-001: Stack Tecnológico — AutoFlow EGIT (v2.0)

| Campo | Valor |
|-------|-------|
| **Título** | ADR-001 — Selección del Stack Tecnológico para AutoFlow |
| **Estado** | ✅ Aprobado — Eduardo Guerra, 2026-03-17
| **Autor** | Stacky (Research Engineer, I+D EGIT) |
| **Fecha** | 17 Marzo 2026 |
| **Versión** | v2.0 (reescritura completa — stack previo Node.js/Fastify/Supabase descartado) |
| **Contexto** | AutoFlow v1.0 — SaaS multiplataforma para PYMEs ecuatorianas (WhatsApp + CRM + Pedidos) |
| **Roadmap** | [AUTOFLOW-ROADMAP.md](../AUTOFLOW-ROADMAP.md) — Launch: 30 Abr 2026 |

---

## 1. Contexto

AutoFlow es un producto SaaS orientado a PYMEs ecuatorianas que automatiza la atención al cliente vía WhatsApp, gestión de pedidos y CRM. El sistema debe soportar arquitectura multi-tenant, integraciones con múltiples canales (WhatsApp, notificaciones push), flujos de automatización complejos y apps nativas en Android e iOS.

La iteración v1.0 de este ADR (16 Mar 2026) proponía un stack basado en **Node.js + Fastify + Supabase + Vercel/Railway**. Tras análisis interno y decisión estratégica de Eduardo, este stack fue **descartado en su totalidad** y reemplazado por una arquitectura de microservicios con tecnologías enterprise-grade que ofrecen mayor control, escalabilidad y autonomía.

**Motivos del descarte del stack v1.0:**
- Dependencia excesiva de servicios managed (Supabase, Vercel, Railway) con riesgo de vendor lock-in
- Supabase no soporta self-hosting completo (solo pgvector local, sin Auth/Realtime/Storage)
- Node.js no cumple con el requisito de arquitectura orientada a microservicios enterprise
- Costos escalan de forma impredecible con el modelo usage-based de Railway/Vercel
- Falta de control sobre la infraestructura de datos (compliance futuro)

---

## 2. Decisión

Se adopta el siguiente stack tecnológico definitivo para AutoFlow:

### 2.1 Resumen del Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Arquitectura** | Microservicios | — |
| **Backend** | Spring Boot 3 | 3.4.x (Java 21 LTS) |
| **Android** | Kotlin + Jetpack Compose | Kotlin 2.1.x / Compose BOM 2025.x |
| **iOS** | SwiftUI | Swift 6.x / iOS 17+ target |
| **Automatización** | N8N (self-hosted) | 1.80+ |
| **BD Relacional** | PostgreSQL | 17.x |
| **BD NoSQL** | MongoDB | 8.x |
| **Cache / Sesiones** | Redis | 7.4.x |
| **Mensajería** | RabbitMQ | 3.13.x (management plugin) |
| **WhatsApp** | Evolution API (self-hosted) | v2.x (instancia "miAsistente") |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | v3.x (Admin SDK) |
| **File Storage** | MinIO | 2025.03.x (S3-compatible) |
| **Migraciones RDBMS** | Flyway | 10.x |
| **Migraciones NoSQL** | Mongock | 5.x |
| **Reverse Proxy** | Caddy | 2.9.x |
| **Contenedores** | Docker + Docker Compose | 27.x / 2.32.x |
| **CI/CD** | GitHub Actions | — |
| **Control de Versiones** | GitHub | — |

### 2.2 Stack Futuro (Escalado >50 clientes activos)

| Capa | Tecnología | Trigger |
|------|-----------|---------|
| **Orquestación** | Kubernetes (k3s / managed) | >50 clientes activos |
| **Ingress** | NGINX Ingress Controller | Al migrar a K8s |
| **Monitoring** | Prometheus + Grafana | K8s adoption |
| **Service Mesh** | Istio / Linkerd (evaluar) | >20 microservicios |

---

## 3. Justificación Técnica por Decisión

### 3.1 Arquitectura: Microservicios

**Decisión:** Arquitectura orientada a microservicios desde el día 1.

**Justificación:**
- Cada dominio de negocio (auth, CRM, pedidos, WhatsApp, notificaciones) evoluciona independientemente
- Escalado granular: el servicio de WhatsApp puede escalar sin escalar el CRM
- Equipo puede trabajar en servicios en paralelo
- Resiliencia: un fallo en un servicio no afecta a todos

**Alternativas descartadas:**
- *Monolito (Spring Boot)*: más simple inicialmente, pero la migración futura a microservicios es costosa y riesgosa. Mejor empezar bien.
- *Serverless (Lambda/Functions)*: vendor lock-in, cold starts, complejidad de debugging en producción.

### 3.2 Backend: Spring Boot 3 (Java 21 LTS)

**Decisión:** Spring Boot 3.4.x con Java 21 LTS como runtime.

**Justificación:**
- **Java 21 LTS** — soporte hasta 2031+, no hay que migrar runtime por 5+ años
- Spring Boot 3 requiere mínimo Java 17, Java 21 es la LTS recomendada
- Ecosistema enterprise más maduro del mundo Java — Spring Security, Spring Data, Spring Cloud
- Integración nativa con RabbitMQ, MongoDB, PostgreSQL, Redis, Flyway
- Virtual Threads (Project Loom, Java 21) — concurrencia masiva sin el overhead de reactive programming
- Mercado laboral sólido en Ecuador y LATAM (Java sigue siendo #1 en enterprise)
- Spring Cloud Gateway para API Gateway (integración nativa)
- Comunidad enorme, documentación extensa, Stack Overflow con respuestas para todo

**Alternativas descartadas:**
- *Node.js + Fastify* (stack v1.0): descartado por decisión estratégica. Menor madurez enterprise, runtime JS con event loop problemático para CPU-intensive tasks.
- *Go + Gin*: excelente performance pero ecosistema más pequeño, menos developers disponibles, menos frameworks maduros para microservicios.
- *Python + FastAPI*: bueno para ML/data, pero GIL limita concurrencia, typing menos robusto que Java, deployment más complejo.

### 3.3 Android: Kotlin + Jetpack Compose (Nativo)

**Decisión:** App nativa Android con Kotlin + Jetpack Compose.

**Justificación:**
- Kotlin es oficialmente el lenguaje preferido de Google para Android (desde 2019)
- Jetpack Compose es el toolkit moderno de UI declarativa (reemplaza XML layouts)
- Acceso completo a APIs de Android (notificaciones push, cámara, contactos, etc.)
- Performance nativa garantizada — sin bridge layer como React Native/Flutter
- Play Store: apps nativas tienen mejor ranking y menor tasa de rechazo
- Kotlin 2.1.x incluye K2 compiler (2-3x más rápido de compile)
- Material Design 3 integration nativa

**Alternativas descartadas:**
- *React Native (Expo)* (stack v1.0): descartado. Bridge layer causa performance issues, dependencia de Meta, actualizaciones de OS siempre rezagadas.
- *Flutter*: Dart es un lenguaje sin ecosistema fuera de Flutter, mercado laboral casi inexistente en Ecuador, Google con historial de abandonar productos.

### 3.4 iOS: SwiftUI (Nativo)

**Decisión:** App nativa iOS con SwiftUI (Swift 6.x).

**Justificación:**
- SwiftUI es el framework de UI moderno de Apple (declarativo, reactivo)
- Swift 6.x con strict concurrency checking = menos bugs en production
- Acceso completo a todas las APIs de iOS (PushKit, CallKit, LocalAuthentication)
- App Store approval más probable con apps nativas
- Performance nativa sin overhead de frameworks cross-platform
- SwiftUI previews aceleran el desarrollo de UI
- Integration directa con APNs (Apple Push Notification service)

**Alternativas descartadas:**
- *React Native*: mismos problemas que en Android, más complejo por build pipeline de Xcode
- *Flutter*: mismo problema de Dart + mercado laboral
- *Kotlin Multiplatform (KMP)*: todavía inmaduro para UI iOS, mejor usar Swift nativo

### 3.5 Automatización: N8N Self-Hosted

**Decisión:** N8N self-hosted en el VPS propio (Docker).

**Justificación:**
- Plataforma de workflow automation open-source con 400+ integraciones nativas
- Self-hosted = sin límites de ejecución, sin costos por operación
- Interfaz visual para crear flujos (ideal para equipos no-técnicos de EGIT)
- Soporte nativo para webhooks, HTTP requests, WhatsApp integrations
- Puede orquestar microservicios: triggers de N8N → RabbitMQ → microservicios
- Comunidad activa (80k+ GitHub stars)
- Para uso interno de EGIT: lead nurturing, onboarding automático, reportes

**Alternativas descartadas:**
- *Zapier*: $20-800/mes según volumen, impracticable para uso interno de agencia
- *Make (Integromat)*: similar a Zapier, costos altos para volumen
- *n8n cloud*: $24-60/mes cuando self-hosted es gratis

### 3.6 Bases de Datos: PostgreSQL + MongoDB + Redis

**Decisión:** Polyglot persistence — cada base de datos para su caso de uso óptimo.

**Justificación:**

| BD | Uso en AutoFlow | Razón |
|----|----------------|-------|
| **PostgreSQL 17.x** | Usuarios, tenants, pedidos, CRM, facturación | Transacciones ACID, relaciones complejas, JSONB para flexibilidad, Row-Level Security |
| **MongoDB 8.x** | Logs, historiales de chat, auditoría, config por tenant | Schema flexible, writes rápidos, sharding nativo,适合 documentos variados |
| **Redis 7.4.x** | Sesiones, cache de API, rate limiting, colas temporales | Sub-millisecond reads, pub/sub, data structures ricas |

**PostgreSQL 17.x — detalles:**
- Row-Level Security (RLS) para multi-tenancy segura a nivel de base de datos
- JSONB = schema flexible cuando se necesita (configuraciones de tenant)
- Materialized views para reportes rápidos
- Extensions: pgvector (embedding similarity), PostGIS (geolocalización future)

**MongoDB 8.x — detalles:**
- Documentos heterogéneos de chat de WhatsApp (cada conversación tiene estructura diferente)
- Time-series collections para métricas de uso
- Change Streams para triggers en tiempo real
- Mongock para migraciones versionadas

**Redis 7.4.x — detalles:**
- Sesiones JWT con TTL automático
- Cache de queries frecuentes (reduce carga en PostgreSQL)
- Rate limiting distribuido (protección de APIs)
- Pub/Sub para eventos intra-servicios (bajo acoplamiento)

**Alternativas descartadas:**
- *Supabase* (stack v1.0): solo PostgreSQL managed, sin self-hosting completo de Auth/Realtime. Vendor lock-in alto.
- *MongoDB Atlas*: costos altos ($57+/mes), self-hosted MongoDB es gratis y suficiente para MVP.
- *MySQL*: menor flexibilidad que PostgreSQL (menos extensions, peor JSON support).

### 3.7 Mensajería: RabbitMQ

**Decisión:** RabbitMQ 3.13.x como message broker entre microservicios.

**Justificación:**
- Message broker más maduro y probado del ecosistema open-source
- Protocolo AMQP 0.9.1 nativo + STOMP + MQTT para IoT future
- Exchange types (direct, topic, fanout, headers) permiten routing flexible
- Management plugin incluido: UI web para monitoreo de colas
- Retry mechanisms, dead letter queues, TTL — todo nativo
- Integración nativa con Spring Boot (spring-amqp)
- Self-hosted: sin costos adicionales, Docker-ready

**Alternativas descartadas:**
- *Apache Kafka*: overkill para el volumen inicial. Diseñado para streaming de eventos a gran escala (>100k msg/s), complejidad de operación alta.
- *Redis Pub/Sub*: simple pero sin persistencia — si el consumer está caído, el mensaje se pierde.
- *RabbitMQ on CloudAMQP*: $5-190/mes cuando self-hosted es gratis.

### 3.8 WhatsApp: Evolution API (Self-Hosted)

**Decisión:** Evolution API v2.x self-hosted, instancia nombrada "miAsistente".

**Justificación:**
- API RESTful para WhatsApp Business (compatible con WhatsApp Web protocol)
- Self-hosted = control total sobre datos de clientes
- Instancia "miAsistente" = identidad dedicada para AutoFlow
- Soporte para múltiples instancias (un por cliente en futuro)
- Webhooks entrantes → N8N/RabbitMQ → microservicios
- Open-source, comunidad activa, sin costos de licencia
- Compatible con Baileys (WhatsApp Web JS library)

**Alternativas descartadas:**
- *WhatsApp Cloud API (Meta)*: requiere aprobación de Meta, costos por conversación ($0.005-0.095), rate limits estrictos.
- *360dialog*: servicio paid, dependencia de terceros.
- *Twilio*: costos altos ($0.0075-0.015/mensaje), no-self-hosted.

### 3.9 Push Notifications: Firebase Cloud Messaging (FCM)

**Decisión:** Firebase Cloud Messaging con Firebase Admin SDK (Spring Boot).

**Justificación:**
- Plataforma gratuita de Google para push notifications
- Soporta Android nativo, iOS (vía APNs bridge), y web
- Topics para broadcast a segmentos de usuarios
- Android nativo: integración directa con FCM SDK
- iOS: FCM → APNs bridge automático
- Sin costos hasta millones de notificaciones/mes
- Spring Boot Admin SDK: envío desde el backend sin frontend SDK

**Alternativas descartadas:**
- *OneSignal*: $9-999/mes para features avanzadas que FCM ofrece gratis
- *Twilio Notify*: costos adicionales innecesarios

### 3.10 File Storage: MinIO (S3-Compatible Self-Hosted)

**Decisión:** MinIO self-hosted como bucket S3-compatible.

**Justificación:**
- API S3-compatible = código que funciona con AWS S3 funciona con MinIO sin cambios
- Self-hosted en el VPS: sin costos de storage cloud
- Erasure coding para redundancia
- Console web incluido para gestión de buckets
- Si en futuro se migra a AWS S3, el código no cambia (misma API)
- Ideal para: imágenes de productos, documentos de clientes, backups

**Alternativas descartadas:**
- *AWS S3 directo*: costos de egress y storage que se acumulan, innecesario para MVP
- *Cloudinary*: $0-250/mes, overkill para storage simple
- *Supabase Storage*: vendor lock-in con Supabase (que ya fue descartado)

### 3.11 DB Migrations: Flyway + Mongock

**Decisión:** Flyway para PostgreSQL, Mongock para MongoDB.

**Justificación:**

| Tool | BD | Razón |
|------|----|-------|
| **Flyway 10.x** | PostgreSQL | Estándar de facto para migraciones SQL. Versioned migrations (V1__, V2__), undo support, Spring Boot integration nativa. |
| **Mongock 5.x** | MongoDB | ChangeUnits versionados, integración con Spring Boot, manejo de cambios en schemas de documentos. |

**Alternativas descartadas:**
- *Liquibase* (vs Flyway): más complejo, XML-based configuration, menor adopción en equipos pequeños.
- *Migrate-mongo* (vs Mongock): standalone CLI, sin integración Spring Boot.

### 3.12 Reverse Proxy: Caddy

**Decisión:** Caddy 2.9.x como reverse proxy y terminador SSL.

**Justificación:**
- SSL automático con Let's Encrypt — cero configuración manual
- Configuración en Caddyfile (simple, legible) vs nginx.conf (complejo)
- HTTP/3 (QUIC) nativo
- Zero-downtime reloads
- Automatic HTTPS redirect
- Servicios internos: Caddy → Spring Boot (puerto 8080), N8N (puerto 5678), MinIO (puerto 9000)

**Alternativas descartadas:**
- *Nginx*: más potente pero configuración compleja, SSL manual o con certbot, no tiene auto-HTTPS como Caddy.
- *Traefik*: excelente para Docker auto-discovery, pero más complejo para setup inicial simple.

### 3.13 Despliegue MVP: Docker Compose en VPS Propio

**Decisión:** Docker Compose en VPS propio para el MVP (0-50 clientes).

**Justificación:**
- **Costo mínimo**: VPS ya existente en EGIT → costo infraestructura ~$2-5/mes
- Control total: sin dependencia de terceros para infraestructura crítica
- Todos los servicios containerizados: reproducibilidad garantizada
- docker-compose.yml define todo el stack: un comando para levantar todo el entorno
- Desarrollo local idéntico a producción (same containers)

**Alternativas descartadas:**
- *Vercel + Railway + Supabase* (stack v1.0): costos impredecibles con usage-based pricing, vendor lock-in.
- *AWS ECS/Lambda*: costos mínimos ~$30/mes, complejidad de configuración alta para MVP.
- *Google Cloud Run*: similar a AWS, costos variables.

### 3.14 Escalado Futuro: Kubernetes (>50 clientes activos)

**Decisión:** Kubernetes (k3s o managed K8s) cuando se superen 50 clientes activos.

**Justificación:**
- Horizontal Pod Autoscaler para escalar microservicios individualmente
- Service discovery nativo entre pods
- Rolling updates sin downtime
- k3s (lightweight K8s) puede correr en el mismo VPS
- Managed K8s (EKS/GKE) para escala enterprise

**Trigger de migración:** >50 clientes activos, o cuando un solo VPS no alcance.

### 3.15 CI/CD: GitHub Actions + Docker Multi-Stage Build

**Decisión:** GitHub Actions con Docker multi-stage builds.

**Justificación:**
- Integración nativa con repositorio GitHub
- Docker multi-stage: build stage con JDK 21, runtime stage con JRE 21 (imagen pequeña)
- Pipelines: lint → test → build → push to registry → deploy via SSH
- Matrix builds para múltiples microservicios en paralelo
- Sin costos para repositorios públicos, 2000 min/mes gratis para privados

---

## 4. Microservicios Propuestos

| Servicio | Responsabilidad | Tecnología | Puerto |
|----------|----------------|------------|--------|
| **api-gateway** | Routing, rate limiting, auth validation | Spring Cloud Gateway | 8080 |
| **auth-service** | JWT tokens, OAuth2, registro, login | Spring Boot + Spring Security | 8081 |
| **crm-service** | Clientes, pipeline, interacciones | Spring Boot + Spring Data JPA | 8082 |
| **orders-service** | Pedidos, estados, facturación | Spring Boot + Spring Data JPA | 8083 |
| **whatsapp-service** | Evolution API integration, webhooks | Spring Boot + WebClient | 8084 |
| **notifications-service** | FCM push, email, templates | Spring Boot + Firebase SDK | 8085 |
| **reports-service** | Dashboard, analytics, export | Spring Boot + JFreeChart | 8086 |
| **n8n** | Workflows de automatización | N8N (Node.js) | 5678 |
| **minio** | Object storage (S3-compatible) | MinIO | 9000/9001 |

---

## 5. Análisis de Costos

### 5.1 MVP (0-50 clientes activos)

| Concepto | Detalle | Costo/mes |
|----------|---------|-----------|
| **VPS** | 2 vCPU, 4GB RAM, 80GB SSD (Hetzner/Contabo/DigitalOcean) | $2-5 |
| **Dominio** | autoflow.ec / autoflow.com | $1-2 |
| **SSL** | Let's Encrypt via Caddy | $0 |
| **Todos los servicios** | Docker Compose (Spring Boot, N8N, PostgreSQL, MongoDB, Redis, RabbitMQ, MinIO, Caddy, Evolution API) | $0 |
| **FCM** | Google (gratis hasta millones) | $0 |
| **GitHub** | Repositorios privados | $0 |
| **TOTAL MVP** | | **$3-7/mes** |

### 5.2 Crecimiento (50-200 clientes)

| Concepto | Detalle | Costo/mes |
|----------|---------|-----------|
| **VPS upgrade** | 4 vCPU, 8GB RAM, 160GB SSD | $5-15 |
| **Backup off-site** | Backblaze B2 (50GB) | $0.30 |
| **Dominio** | +1 dominio adicional | $1-2 |
| **TOTAL** | | **$6-17/mes** |

### 5.3 Escalado (>50 clientes — trigger K8s)

| Concepto | Detalle | Costo/mes |
|----------|---------|-----------|
| **k3s cluster** | 2-3 VPS (cada uno $5-15) | $15-45 |
| **Managed DB (opcional)** | PostgreSQL managed | $15-30 |
| **Monitoring** | Grafana Cloud free tier | $0 |
| **TOTAL** | | **$30-75/mes** |

### 5.4 Comparación de Costos: Stack v1.0 (descartado) vs v2.0 (aprobado)

| Escenario | Stack v1.0 (Vercel+Railway+Supabase) | Stack v2.0 (Self-Hosted) |
|-----------|--------------------------------------|--------------------------|
| **MVP (0-50)** | $1-7/mes | $3-7/mes |
| **Crecimiento (50-200)** | $88-100/mes | $6-17/mes |
| **Escalado (200+)** | $133-203/mes | $30-75/mes |

> **Conclusión:** El stack v2.0 es significativamente más barato a largo plazo porque elimina costos de Vercel Pro ($20/mes), Railway usage ($15-80/mes), y Supabase Pro ($25/mes). El costo de la VPS es fijo y predecible.

---

## 6. Consecuencias

### 6.1 Positivas

- ✅ **Control total** sobre infraestructura y datos — sin vendor lock-in
- ✅ **Costos predecibles** y bajos (VPS fija vs usage-based cloud)
- ✅ **Arquitectura escalable** desde el diseño (microservicios + K8s ready)
- ✅ **Stack enterprise-grade** (Spring Boot + Java 21 LTS = soporte hasta 2031+)
- ✅ **Apps nativas** = mejor UX, performance, y acceso a features de plataforma
- ✅ **Autonomía operativa** — todos los servicios son self-hosted
- ✅ **Polyglot persistence** — cada BD para su caso de uso óptimo
- ✅ **Migration path claro** — VPS → k3s → managed K8s

### 6.2 Negativas

- ⚠️ **Mayor complejidad operativa** — auto-gestionar PostgreSQL, MongoDB, Redis, RabbitMQ, MinIO, Caddy, N8N, Evolution API
- ⚠️ **Responsabilidad de backups** — no hay managed service que haga backups automáticos
- ⚠️ **Más servicios a monitorear** — necesita dashboards (Prometheus + Grafana) pronto
- ⚠️ **Menor ecosistema de herramientas managed** — Vercel/Railway ofrecen DX features que hay que replicar manualmente
- ⚠️ **Curva de aprendizaje** — Spring Boot es más complejo que Node.js para el equipo actual

### 6.3 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:------------:|:-------:|------------|
| Fallo del VPS (single point of failure) | Media | Alto | Backup diarios a S3 off-site, plan de failover a segundo VPS |
| Pérdida de datos (sin managed backup) | Baja | Crítico | pg_dump + mongodump diarios → Backblaze B2, retención 30 días |
| Curva de aprendizaje de Spring Boot | Alta | Medio | Docs internas, pair programming, empezar con microservicio simple (auth-service) |
| Evolution API incompatible con WhatsApp updates | Media | Alto | Monitorear repositorio, tener WhatsApp Cloud API como fallback |
| Under-provisioning de VPS (sin auto-scaling) | Media | Medio | Monitoreo de CPU/RAM, plan de upgrade inmediato si >80% uso |

---

## 7. Diagrama del Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTOFLOW STACK v2.0                        │
│                    (Docker Compose en VPS)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLIENTES                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Android App │  │  iOS App     │  │  WhatsApp    │          │
│  │  Kotlin +    │  │  Swift +     │  │  Evolution   │          │
│  │  Jetpack     │  │  SwiftUI     │  │  API         │          │
│  │  Compose     │  │              │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │ HTTPS/WSS       │ HTTPS/WSS       │ Webhooks          │
│  ┌──────┴─────────────────┴─────────────────┴───────┐          │
│  │                   CADDY (SSL/TLS)                 │          │
│  └──────┬───────────────────────────────────────────┘          │
│         │                                                       │
│  ┌──────┴───────────────────────────────────────────┐          │
│  │              API GATEWAY (Spring Cloud)           │          │
│  │         Rate limiting, routing, auth validation   │          │
│  └──┬────┬────┬────┬────┬────┬──────────────────────┘          │
│     │    │    │    │    │    │                                  │
│  ┌──┴─┐┌─┴──┐┌┴───┐┌┴──┐┌─┴──┐┌─┴────┐                        │
│  │Auth││CRM ││Order││Wpp││Notif││Reports│  ← Spring Boot 3    │
│  │Svc ││Svc ││Svc  ││Svc││Svc  ││Svc   │    (Java 21 LTS)     │
│  └──┬─┘└─┬──┘└─┬───┘└─┬─┘└─┬──┘└─┬────┘                        │
│     │    │    │    │    │    │                                  │
│  ┌──┴────┴────┴────┴────┴────┴────────────────────┐            │
│  │              RABBITMQ (Message Broker)           │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐            │
│  │                   DATOS                          │            │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐   │            │
│  │  │PostgreSQL │  │ MongoDB   │  │  Redis    │   │            │
│  │  │ 17.x      │  │ 8.x       │  │  7.4.x   │   │            │
│  │  │(Flyway)   │  │(Mongock)  │  │ (cache)  │   │            │
│  │  └───────────┘  └───────────┘  └───────────┘   │            │
│  │  ┌───────────┐                                  │            │
│  │  │  MinIO    │  ← File storage (S3-compatible)  │            │
│  │  └───────────┘                                  │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  N8N         │  │  FCM         │                             │
│  │  (Workflows) │  │  (Push)      │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                 │
│  CI/CD: GitHub Actions → Docker multi-stage → VPS deploy       │
│  Monitoreo: Prometheus + Grafana (fase 2)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Decisiones Relacionadas

| Decisión | Impacto | Fecha |
|----------|---------|-------|
| Arquitectura microservicios (no monolito) | Define estructura del equipo y despliegue | 17 Mar 2026 |
| Spring Boot 3 + Java 21 LTS | Stack backend para 5+ años | 17 Mar 2026 |
| Apps nativas (Kotlin/SwiftUI) | Doble desarrollo vs cross-platform | 17 Mar 2026 |
| Self-hosted todo (VPS) | Autonomía vs complejidad operativa | 17 Mar 2026 |
| Polyglot persistence (PG + Mongo + Redis) | Mayor complejidad, mejor performance | 17 Mar 2026 |
| RabbitMQ como message broker | Desacoplamiento entre microservicios | 17 Mar 2026 |
| K8s como futuro (>50 clientes) | Plan de escalado definido | 17 Mar 2026 |

---

## 9. Referencias

- Spring Boot 3.4 Documentation: https://docs.spring.io/spring-boot/docs/3.4.3/reference/html/
- Java 21 LTS Release Notes: https://openjdk.org/projects/jdk/21/
- Flyway Migration Tool: https://documentation.red-gate.com/flyway
- RabbitMQ Documentation: https://www.rabbitmq.com/docs
- Evolution API GitHub: https://github.com/EvolutionAPI/evolution-api
- MinIO Documentation: https://min.io/docs/minio/linux/index.html
- N8N Documentation: https://docs.n8n.io/
- Caddy Documentation: https://caddyserver.com/docs

---

*ADR v2.0 — Reescritura completa por Stacky (Research Engineer, I+D EGIT)*  
*17 Marzo 2026*  
*Aprobado por: Eduardo (CEO, EGIT Consultoría)*
