# C4 Context Diagram — AutoFlow EGIT

## Descripción

El **System Context Diagram** muestra AutoFlow como una caja negra, identificando sus usuarios y sistemas externos. Este es el nivel más alto de la vista arquitectónica.

---

## Diagrama C4 Context (Mermaid)

```mermaid
graph TB
    subgraph "Usuarios"
        Admin["👤 Admin / Dueño<br/><small>Gestiona su negocio,<br/>configura flujos, ve reportes</small>"]
        Employee["👤 Empleado<br/><small>Registra pedidos,<br/>gestiona clientes</small>"]
        Customer["👤 Cliente Final<br/><small>Recibe mensajes de WhatsApp,<br/>consulta catálogo, hace pedidos</small>"]
    end

    AutoFlow[["🏢 <b>AutoFlow EGIT</b><br/><small>Plataforma SaaS de automatización<br/>para PYMEs ecuatorianas</small><br/><br/>Auth · CRM · Pedidos · WhatsApp · Reportes"]]

    subgraph "Sistemas Externos"
        Meta["📱 <b>Meta Cloud API</b><br/><small>WhatsApp Business API</small><br/>Mensajes, catálogo, webhooks"]
        Stripe["💳 <b>Stripe</b><br/><small>Procesamiento de pagos</small><br/>Facturación SaaS"]
        N8N["🔄 <b>N8N</b><br/><small>Motor de workflows</small><br/>Flujos automatizados personalizables"]
        Email["📧 <b>Servidor Email</b><br/><small>SMTP transactional</small><br/>Notificaciones, reportes"]
    end

    Admin -->|"HTTPS<br/>Web Dashboard"| AutoFlow
    Employee -->|"HTTPS<br/>Web Dashboard"| AutoFlow
    Customer -->|"WhatsApp<br/>(vía Meta)"| AutoFlow
    
    AutoFlow -->|"API<br/>Send/Receive Messages"| Meta
    AutoFlow -->|"API<br/>Billing/Subscription"| Stripe
    AutoFlow -->|"Webhook<br/>Trigger/Receive"| N8N
    AutoFlow -->|"SMTP<br/>Emails"| Email

    style AutoFlow fill:#2e86c1,stroke:#1a5276,color:#fff,stroke-width:3px
    style Admin fill:#27ae60,stroke:#1e8449,color:#fff
    style Employee fill:#27ae60,stroke:#1e8449,color:#fff
    style Customer fill:#f39c12,stroke:#d68910,color:#fff
    style Meta fill:#2c3e50,stroke:#1a252f,color:#fff
    style Stripe fill:#8e44ad,stroke:#6c3483,color:#fff
    style N8N fill:#e74c3c,stroke:#c0392b,color:#fff
    style Email fill:#16a085,stroke:#148f77,color:#fff
```

---

## Actores y Sistemas

### Usuarios

| Actor | Plataforma | Descripción |
|-------|-----------|-------------|
| **Admin / Dueño** | Web App | Dueño del negocio. Configura la cuenta, gestiona empleados, ve reportes, define flujos N8N |
| **Empleado** | Web App | Operario del negocio. Registra pedidos, gestiona clientes, envía mensajes de WhatsApp |
| **Cliente Final** | WhatsApp | Cliente del negocio. Recibe catálogo, hace pedidos por WhatsApp, recibe notificaciones |

### Sistemas Externos

| Sistema | Propósito | Integración |
|---------|-----------|-------------|
| **Meta Cloud API** | WhatsApp Business | Envío/recepción de mensajes, catálogo de productos, webhooks entrantes |
| **Stripe** | Pagos SaaS | Suscripciones de clientes de AutoFlow, facturación |
| **N8N** | Workflows automatizados | Motor de automatización self-hosted, ejecuta flujos personalizados por cliente |
| **Servidor Email** | Email transaccional | Notificaciones, reportes semanales, onboarding emails |

---

## Notas de Diseño

1. **El Cliente Final NO interactúa directamente con AutoFlow** — su único canal es WhatsApp. AutoFlow actúa como middleware entre el negocio y su cliente.
2. **N8N está self-hosted** en el mismo VPS de AutoFlow, no es un servicio externo de terceros.
3. **Stripe es el único pago** — se puede reemplazar con pasarela ecuatoriana (Pichincha/Banco del Pacífico) si es necesario.
4. **Multi-tenant es transparente** en este diagrama — cada Admin ve solo su data.

---

## C4 Container Diagram (Vista Expandida)

> ⚠️ **Stack aprobado por Eduardo (ADR-001, 16 Mar 2026):** Microservicios con Spring Boot (Kotlin), apps nativas Android/iOS. Ver [adr-001-stack.md](adr-001-stack.md) y [adr-002-arquitectura.md](adr-002-arquitectura.md).

```mermaid
graph TB
    subgraph "Clientes"
        AndroidApp["📱 Android App<br/>Kotlin + Jetpack Compose"]
        iOSApp["🍎 iOS App<br/>Swift UI"]
        WebDash["🌐 Web Dashboard<br/>Browser"]
    end

    subgraph "VPS EGIT (Docker Compose)"
        Caddy["🌐 Caddy<br/>Reverse Proxy + SSL<br/>Let's Encrypt auto"]
        Gateway["🔀 API Gateway<br/>Spring Cloud Gateway<br/>:8080 — Auth · Rate Limit · Routing"]

        subgraph "Microservicios (Spring Boot / Kotlin)"
            AuthSvc["🔐 auth-service<br/>:8081 — JWT, OAuth2"]
            CrmSvc["👥 crm-service<br/>:8082 — Clientes, pipeline"]
            OrdersSvc["📦 orders-service<br/>:8083 — Pedidos, estados"]
            WASvc["💬 whatsapp-service<br/>:8084 — Webhooks Meta, mensajes"]
            NotifSvc["🔔 notifications-service<br/>:8085 — Push, email, templates"]
            ReportsSvc["📊 reports-service<br/>:8086 — Analytics, dashboard"]
        end

        subgraph "Motor de Automatización"
            N8N["🔄 N8N<br/>:5678 — Workflows visuales"]
        end

        subgraph "Almacenamiento"
            PG["🐘 PostgreSQL 16<br/>Datos transaccionales<br/>(usuarios, clientes, pedidos)"]
            Mongo["🍃 MongoDB<br/>Documentos flexibles<br/>(mensajes, logs, historiales)"]
            Redis["📮 Redis 7<br/>Cache · Sesiones<br/>Rate Limit · Pub/Sub"]
        end
    end

    subgraph "Servicios Externos"
        Meta["📱 Meta Cloud API"]
        Stripe["💳 Stripe API"]
        Email["📧 SMTP Transactional"]
    end

    AndroidApp -->|"HTTPS :443"| Caddy
    iOSApp -->|"HTTPS :443"| Caddy
    WebDash -->|"HTTPS :443"| Caddy

    Caddy --> Gateway
    Caddy -->|":5678"| N8N

    Gateway --> AuthSvc
    Gateway --> CrmSvc
    Gateway --> OrdersSvc
    Gateway --> WASvc
    Gateway --> NotifSvc
    Gateway --> ReportsSvc

    AuthSvc -->|"SQL"| PG
    CrmSvc -->|"SQL"| PG
    OrdersSvc -->|"SQL"| PG
    WASvc -->|"SQL+NoSQL"| Mongo
    WASvc -->|"SQL"| PG
    NotifSvc -->|"SMTP"| Email
    ReportsSvc -->|"SQL+NoSQL"| PG
    ReportsSvc -->|"NoSQL"| Mongo

    AuthSvc -->|"Redis"| Redis
    Gateway -->|"Redis"| Redis

    WASvc -->|"REST API"| Meta
    OrdersSvc -->|"REST API"| Stripe
    Meta -->|"Webhook POST"| Caddy

    style Caddy fill:#1a5276,stroke:#fff,color:#fff
    style Gateway fill:#117a65,stroke:#fff,color:#fff
    style AuthSvc fill:#2e86c1,stroke:#fff,color:#fff
    style CrmSvc fill:#2e86c1,stroke:#fff,color:#fff
    style OrdersSvc fill:#2e86c1,stroke:#fff,color:#fff
    style WASvc fill:#2e86c1,stroke:#fff,color:#fff
    style NotifSvc fill:#2e86c1,stroke:#fff,color:#fff
    style ReportsSvc fill:#2e86c1,stroke:#fff,color:#fff
    style N8N fill:#8e44ad,stroke:#fff,color:#fff
    style PG fill:#2874a6,stroke:#fff,color:#fff
    style Mongo fill:#27ae60,stroke:#fff,color:#fff
    style Redis fill:#c0392b,stroke:#fff,color:#fff
```

---

## Flujo de Datos — Ejemplo: Cliente hace pedido por WhatsApp

```
1. Cliente → envía "Quiero 2 pizza margarita" por WhatsApp
2. Meta Cloud API → POST /webhooks/whatsapp → Caddy → API Fastify
3. API → Busca config del tenant → Dispara flujo N8N si existe
4. N8N → Procesa (detecta intención, genera orden)
5. API → Crea Order en PostgreSQL schema del tenant
6. API → Publica en Redis channel "orders:{tenantId}"
7. Socket.io → Push al dashboard del Admin/Empleado: "Nuevo pedido recibido"
8. BullMQ → Job: enviar WhatsApp de confirmación al cliente
9. BullMQ → Job: actualizar métricas del reporte semanal
```

---

*Documentado por Archy — Arquitecto de Software Senior*  
*EGIT Consultoría — AutoFlow v1*
