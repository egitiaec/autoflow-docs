# Estructura del Proyecto — AutoFlow

| Campo | Valor |
|-------|-------|
| **Estado** | ✅ Actualizado — Doc (2026-03-17) |
| **Estrategia** | Monorepo (único repositorio Git) |
| **Backend** | 8 microservicios Spring Boot (Java 21 + Kotlin) |
| **Mobile** | Apps nativas: Android (Kotlin + Compose) + iOS (SwiftUI) |
| **Basado en** | ADR-001 Stack v2.0, ADR-002 Arquitectura v2.2 |

---

## 1. Monorepo — ¿Por qué?

AutoFlow usa un **monorepo** (único repositorio Git) que contiene todos los microservicios, apps móviles, infraestructura y documentación.

| Decisión | Razón |
|----------|-------|
| **Monorepo** | Shared code entre servicios, atomic commits que tocan múltiples servicios, CI/CD simplificada, versionado unificado |
| **No multi-repo** | Evitar divergencia de código compartido, simplificar dependency management, un solo PR review para cambios cross-service |
| **Gradle root build** | Build config compartido entre microservicios (dependencias, plugins, versiones) |
| **Sin workspace manager JS** | No es necesario — cada microservicio es un proyecto Gradle independiente que compila solo |

---

## 2. Estructura Completa del Monorepo

```
autoflow/
│
├── 📁 services/                          # Todos los microservicios (Spring Boot 3 · Java 21 · Kotlin)
│   │
│   ├── 📁 api-gateway/                   # Puerto 8080 — Spring Cloud Gateway
│   │   ├── build.gradle.kts
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── kotlin/com/autoflow/gateway/
│   │   │   │   │   ├── GatewayApplication.kt
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── SecurityConfig.kt       # JWT filter, rutas públicas
│   │   │   │   │   │   ├── RateLimitConfig.kt      # Redis-backed rate limiting
│   │   │   │   │   │   └── CorsConfig.kt           # CORS global
│   │   │   │   │   ├── filter/
│   │   │   │   │   │   ├── AuthFilter.kt            # Valida JWT, inyecta headers
│   │   │   │   │   │   └── RateLimitFilter.kt
│   │   │   │   │   └── route/
│   │   │   │   │       └── RouteConfig.kt           # Routing dinámico
│   │   │   │   └── resources/
│   │   │   │       └── application.yml
│   │   │   └── test/
│   │   └── Dockerfile
│   │
│   ├── 📁 auth-service/                  # Puerto 8081 — Autenticación y Usuarios
│   │   ├── build.gradle.kts
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── kotlin/com/autoflow/auth/
│   │   │   │   │   ├── AuthApplication.kt
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   ├── AuthController.kt        # /auth/login, /auth/register, /auth/refresh
│   │   │   │   │   │   └── UserController.kt        # /users CRUD
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── AuthService.kt
│   │   │   │   │   │   ├── UserService.kt
│   │   │   │   │   │   ├── JwtTokenService.kt       # Generación y validación JWT (RSA-256)
│   │   │   │   │   │   └── EmailService.kt          # Verificación email, password reset
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── UserRepository.kt        # Spring Data JPA
│   │   │   │   │   │   └── RoleRepository.kt
│   │   │   │   │   ├── model/
│   │   │   │   │   │   ├── User.kt                  # @Entity JPA
│   │   │   │   │   │   ├── Role.kt
│   │   │   │   │   │   ├── Permission.kt
│   │   │   │   │   │   └── RefreshToken.kt
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── LoginRequest.kt
│   │   │   │   │   │   ├── RegisterRequest.kt
│   │   │   │   │   │   ├── TokenResponse.kt
│   │   │   │   │   │   └── UserResponse.kt
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── SecurityConfig.kt        # Spring Security config
│   │   │   │   │   │   └── JwtConfig.kt
│   │   │   │   │   └── security/
│   │   │   │   │       └── JwtAuthFilter.kt
│   │   │   │   ├── resources/
│   │   │   │   │   ├── application.yml
│   │   │   │   │   ├── db/migration/                # Flyway migrations
│   │   │   │   │   │   ├── V1__initial_schema.sql
│   │   │   │   │   │   ├── V2__add_tenant_id.sql
│   │   │   │   │   │   └── V3__rbac_permissions.sql
│   │   │   │   │   └── keys/                        # JWT RSA keys
│   │   │   │   │       ├── private-key.pem
│   │   │   │   │       └── public-key.pem
│   │   │   └── test/
│   │   │       └── kotlin/com/autoflow/auth/
│   │   │           ├── service/AuthServiceTest.kt
│   │   │           └── controller/AuthControllerTest.kt
│   │   └── Dockerfile
│   │
│   ├── 📁 crm-service/                   # Puerto 8082 — Clientes y Pipeline
│   │   ├── build.gradle.kts
│   │   ├── src/main/kotlin/com/autoflow/crm/
│   │   │   ├── CrmApplication.kt
│   │   │   ├── controller/
│   │   │   │   ├── ClientController.kt
│   │   │   │   ├── PipelineController.kt
│   │   │   │   └── InteractionController.kt
│   │   │   ├── service/
│   │   │   │   ├── ClientService.kt
│   │   │   │   ├── PipelineService.kt
│   │   │   │   └── InteractionService.kt
│   │   │   ├── repository/
│   │   │   │   ├── ClientRepository.kt
│   │   │   │   ├── PipelineRepository.kt
│   │   │   │   └── InteractionRepository.kt
│   │   │   ├── model/                               # JPA Entities
│   │   │   ├── dto/
│   │   │   ├── config/
│   │   │   └── messaging/
│   │   │       └── EventPublisher.kt                # Publica a RabbitMQ
│   │   └── Dockerfile
│   │
│   ├── 📁 orders-service/                # Puerto 8083 — Pedidos y Facturación
│   │   ├── build.gradle.kts
│   │   ├── src/main/kotlin/com/autoflow/orders/
│   │   │   ├── OrdersApplication.kt
│   │   │   ├── controller/
│   │   │   │   ├── OrderController.kt
│   │   │   │   ├── ProductController.kt
│   │   │   │   └── InvoiceController.kt
│   │   │   ├── service/
│   │   │   │   ├── OrderService.kt
│   │   │   │   ├── ProductService.kt
│   │   │   │   └── InvoiceService.kt               # Generación PDF
│   │   │   ├── repository/
│   │   │   ├── model/
│   │   │   │   ├── Order.kt                        # Estados: DRAFT→PENDING→CONFIRMED→SHIPPED→DELIVERED→CANCELLED
│   │   │   │   ├── OrderItem.kt
│   │   │   │   ├── Product.kt
│   │   │   │   └── Invoice.kt
│   │   │   ├── dto/
│   │   │   ├── config/
│   │   │   └── messaging/
│   │   │       └── EventPublisher.kt
│   │   └── Dockerfile
│   │
│   ├── 📁 whatsapp-service/              # Puerto 8084 — Integración WhatsApp (Evolution API)
│   │   ├── build.gradle.kts
│   │   ├── src/main/kotlin/com/autoflow/whatsapp/
│   │   │   ├── WhatsappApplication.kt
│   │   │   ├── controller/
│   │   │   │   ├── WebhookController.kt            # POST /webhook/evolution
│   │   │   │   ├── MessageController.kt            # Envío de mensajes
│   │   │   │   └── TemplateController.kt           # Gestión de plantillas
│   │   │   ├── service/
│   │   │   │   ├── MessageService.kt
│   │   │   │   ├── ConversationService.kt
│   │   │   │   └── TemplateService.kt
│   │   │   ├── repository/
│   │   │   │   ├── MessageRepository.kt            # Spring Data MongoDB
│   │   │   │   ├── ConversationRepository.kt
│   │   │   │   └── TemplateRepository.kt
│   │   │   ├── model/
│   │   │   │   ├── Message.kt                      # @Document MongoDB
│   │   │   │   ├── Conversation.kt
│   │   │   │   └── Template.kt
│   │   │   ├── dto/
│   │   │   ├── config/
│   │   │   ├── integration/
│   │   │   │   ├── EvolutionApiClient.kt           # WebClient para Evolution API REST
│   │   │   │   └── EvolutionWebhookDto.kt          # DTOs de webhooks entrantes
│   │   │   └── messaging/
│   │   │       └── EventPublisher.kt
│   │   └── Dockerfile
│   │
│   ├── 📁 notifications-service/         # Puerto 8085 — Notificaciones Multi-canal (FCM)
│   │   ├── build.gradle.kts
│   │   ├── src/main/kotlin/com/autoflow/notifications/
│   │   │   ├── NotificationsApplication.kt
│   │   │   ├── controller/
│   │   │   │   ├── NotificationController.kt
│   │   │   │   ├── FcmTokenController.kt           # Registro/baja de tokens
│   │   │   │   └── TemplateController.kt
│   │   │   ├── service/
│   │   │   │   ├── NotificationService.kt          # Orquestador multi-canal
│   │   │   │   ├── FcmService.kt                   # Firebase Cloud Messaging
│   │   │   │   ├── EmailService.kt                 # SMTP / SendGrid
│   │   │   │   └── WhatsAppDelegate.kt             # Delega a whatsapp-service
│   │   │   ├── repository/
│   │   │   │   ├── NotificationLogRepository.kt    # MongoDB
│   │   │   │   └── FcmTokenRepository.kt           # MongoDB (TTL automático)
│   │   │   ├── model/
│   │   │   │   ├── NotificationLog.kt              # @Document MongoDB
│   │   │   │   └── FcmToken.kt
│   │   │   ├── dto/
│   │   │   ├── config/
│   │   │   └── messaging/
│   │   │       └── EventConsumer.kt                # Consume RabbitMQ events
│   │   └── Dockerfile
│   │
│   ├── 📁 reports-service/               # Puerto 8086 — Dashboard y Analytics
│   │   ├── build.gradle.kts
│   │   ├── src/main/kotlin/com/autoflow/reports/
│   │   │   ├── ReportsApplication.kt
│   │   │   ├── controller/
│   │   │   │   ├── DashboardController.kt
│   │   │   │   ├── SalesReportController.kt
│   │   │   │   ├── WhatsappMetricsController.kt
│   │   │   │   └── AppointmentMetricsController.kt
│   │   │   ├── service/
│   │   │   │   ├── DashboardService.kt
│   │   │   │   ├── SalesService.kt
│   │   │   │   ├── WhatsappMetricsService.kt
│   │   │   │   └── AppointmentMetricsService.kt
│   │   │   ├── repository/
│   │   │   │   ├── ReportSnapshotRepository.kt     # PostgreSQL
│   │   │   │   └── ReportCacheRepository.kt        # MongoDB
│   │   │   ├── model/
│   │   │   └── dto/
│   │   └── Dockerfile
│   │
│   └── 📁 appointment-service/           # Puerto 8087 — Sistema de Citas (NUEVO)
│       ├── build.gradle.kts
│       ├── src/
│       │   ├── main/
│       │   │   ├── kotlin/com/autoflow/appointments/
│       │   │   │   ├── AppointmentApplication.kt
│       │   │   │   ├── controller/
│       │   │   │   │   ├── AppointmentController.kt      # CRUD citas
│       │   │   │   │   ├── ScheduleController.kt          # Horarios de atención
│       │   │   │   │   └── ServiceController.kt           # Tipos de servicio
│       │   │   │   ├── service/
│       │   │   │   │   ├── AppointmentService.kt
│       │   │   │   │   ├── ScheduleService.kt
│       │   │   │   │   └── AvailabilityService.kt         # Verificación de disponibilidad
│       │   │   │   ├── repository/
│       │   │   │   │   ├── AppointmentRepository.kt       # JPA
│       │   │   │   │   ├── ScheduleRepository.kt
│       │   │   │   │   └── ServiceRepository.kt
│       │   │   │   ├── model/
│       │   │   │   │   ├── Appointment.kt                 # @Entity JPA
│       │   │   │   │   ├── AppointmentStatus.kt           # Enum: CONFIRMED, CANCELLED, NO_SHOW
│       │   │   │   │   ├── AppointmentServiceEntity.kt    # Tipo de servicio (duración, buffer, precio)
│       │   │   │   │   ├── BusinessSchedule.kt            # Horarios por día de semana
│       │   │   │   │   └── TenantIntegration.kt          # Config integración por tenant
│       │   │   │   ├── dto/
│       │   │   │   │   ├── CreateAppointmentRequest.kt
│       │   │   │   │   ├── UpdateAppointmentRequest.kt
│       │   │   │   │   ├── AppointmentResponse.kt
│       │   │   │   │   ├── AvailabilityRequest.kt
│       │   │   │   │   └── AvailabilityResponse.kt
│       │   │   │   ├── config/
│       │   │   │   │   └── GoogleCalendarConfig.kt
│       │   │   │   ├── integration/                       ← Adaptadores externos
│       │   │   │   │   ├── GoogleCalendarAdapter.kt       # Google Calendar API client
│       │   │   │   │   ├── GoogleCalendarDtos.kt          # Freebusy, Event DTOs
│       │   │   │   │   ├── CustomApiAdapter.kt            # Adaptador genérico para APIs de terceros
│       │   │   │   │   └── AvailabilityAdapter.kt         # Interface común
│       │   │   │   └── messaging/
│       │   │   │       └── EventPublisher.kt              # appointment.created, .cancelled, .reminder
│       │   │   └── resources/
│       │   │       ├── application.yml
│       │   │       └── db/migration/
│       │   │           ├── V1__initial_appointments_schema.sql
│       │   │           ├── V2__add_tenant_integrations.sql
│       │   │           └── V3__add_google_calendar_event_id.sql
│       │   └── test/
│       │       └── kotlin/com/autoflow/appointments/
│       │           ├── service/AppointmentServiceTest.kt
│       │           ├── service/AvailabilityServiceTest.kt
│       │           └── integration/GoogleCalendarAdapterTest.kt
│       └── Dockerfile
│
├── 📁 infra/                             # Infraestructura (Docker Compose, configs)
│   ├── docker-compose.yml                # Dev: todos los servicios + infraestructura
│   ├── docker-compose.prod.yml           # Prod: stack completo en VPS
│   ├── .env.example                      # Template de variables de entorno (sin valores reales)
│   ├── Caddyfile                         # Configuración de Caddy (reverse proxy)
│   ├── scripts/
│   │   ├── backup.sh                     # Backup diario PostgreSQL + MongoDB
│   │   ├── deploy.sh                     # Deploy script para VPS
│   │   └── setup-local.sh               # Setup inicial del dev environment
│   └── configs/
│       ├── rabbitmq.conf                 # Config de RabbitMQ
│       └── minio/                        # Config de MinIO (buckets iniciales)
│
├── 📁 mobile/                            # Apps móviles nativas
│   │
│   ├── 📁 android/                       # Android App (Kotlin + Jetpack Compose)
│   │   ├── app/
│   │   │   ├── src/main/
│   │   │   │   ├── kotlin/com/autoflow/mobile/
│   │   │   │   │   ├── MainActivity.kt
│   │   │   │   │   ├── di/                          # Dependency injection (Hilt)
│   │   │   │   │   ├── data/
│   │   │   │   │   │   ├── remote/                  # Retrofit API client
│   │   │   │   │   │   └── local/                   # Room database
│   │   │   │   │   ├── domain/
│   │   │   │   │   │   ├── model/                   # Domain models
│   │   │   │   │   │   └── usecase/                 # Use cases
│   │   │   │   │   ├── presentation/
│   │   │   │   │   │   ├── navigation/              # Navigation graphs
│   │   │   │   │   │   ├── screens/
│   │   │   │   │   │   │   ├── home/
│   │   │   │   │   │   │   ├── clients/
│   │   │   │   │   │   │   ├── orders/
│   │   │   │   │   │   │   ├── appointments/
│   │   │   │   │   │   │   ├── whatsapp/
│   │   │   │   │   │   │   └── reports/
│   │   │   │   │   │   └── components/              # Composables reutilizables
│   │   │   │   │   └── viewmodel/
│   │   │   │   └── res/
│   │   │   └── google-services.json                 # Firebase config (NO commit real)
│   │   ├── build.gradle.kts                         # Android Gradle Plugin
│   │   ├── gradle/
│   │   │   └── libs.versions.toml                   # Version catalog
│   │   └── settings.gradle.kts
│   │
│   └── 📁 ios/                           # iOS App (SwiftUI · Swift 6)
│       ├── AutoFlow/
│       │   ├── App/
│       │   │   └── AutoFlowApp.swift
│       │   ├── Core/
│       │   │   ├── Network/                          # URLSession API client
│       │   │   ├── Storage/                          # CoreData persistence
│       │   │   └── Push/                             # APNs / FCM
│       │   ├── Features/
│       │   │   ├── Home/
│       │   │   ├── Clients/
│       │   │   ├── Orders/
│       │   │   ├── Appointments/
│       │   │   ├── WhatsApp/
│       │   │   └── Reports/
│       │   │       ├── View.swift
│       │   │       ├── ViewModel.swift
│       │   │       └── Models/
│       │   ├── Design/
│       │   │   ├── Components/                       # SwiftUI reusable components
│       │   │   └── Theme.swift
│       │   └── Resources/
│       │       └── GoogleService-Info.plist           # Firebase config
│       ├── AutoFlow.xcodeproj
│       ├── AutoFlow.xcworkspace
│       ├── Podfile                                   # CocoaPods (si se usa)
│       └── Package.swift                             # SPM dependencies
│
├── 📁 n8n/                               # Workflows N8N
│   └── workflows/                        # Exportados JSON de N8N
│       ├── onboarding-automatico.json
│       ├── recordatorio-citas.json
│       └── seguimiento-pedidos.json
│
├── 📁 docs/                              # Documentación del proyecto
│   ├── adr-001-stack.md                  # ADR: Stack Tecnológico v2.0
│   ├── adr-002-arquitectura.md           # ADR: Arquitectura de Microservicios v2.2
│   ├── c4-context.md                     # Diagramas C4 (L1, L2, L3)
│   ├── dev-guide.md                      # Guía de Desarrollo
│   └── project-structure.md              # Este documento
│
├── 📁 .github/
│   └── workflows/
│       └── ci.yml                        # GitHub Actions CI/CD
│
├── 📄 build.gradle.kts                   # Build config root (dependencias compartidas, versiones)
├── 📄 settings.gradle.kts                # Incluye todos los servicios: includeBuild("services/*")
└── 📄 gradle/
    └── libs.versions.toml                # Version catalog de Gradle
```

---

## 3. Detalle por Carpeta

### 3.1 `services/` — Microservicios Spring Boot

Cada microservicio sigue el **estándar Spring Boot** con la estructura de paquetes por capa:

```
{servicio}/
├── build.gradle.kts          # Dependencias específicas del servicio
├── src/
│   ├── main/
│   │   ├── kotlin/com/autoflow/{servicio}/
│   │   │   ├── {Servicio}Application.kt   # @SpringBootApplication
│   │   │   ├── controller/                # REST controllers (@RestController)
│   │   │   ├── service/                   # Business logic (@Service)
│   │   │   ├── repository/                # Data access (@Repository)
│   │   │   ├── model/                     # Entities (@Entity / @Document)
│   │   │   ├── dto/                       # Data Transfer Objects
│   │   │   ├── config/                    # Configuration classes
│   │   │   ├── integration/               # External API clients (si aplica)
│   │   │   └── messaging/                 # RabbitMQ publishers/consumers
│   │   └── resources/
│   │       ├── application.yml            # Config del servicio
│   │       ├── db/migration/              # Flyway SQL migrations (servicios con PostgreSQL)
│   │       └── keys/                      # JWT keys (solo auth-service)
│   └── test/
│       └── kotlin/com/autoflow/{servicio}/
│           ├── service/                   # Unit tests
│           └── controller/               # Integration tests
└── Dockerfile                             # Multi-stage build
```

**Servicios y sus puertos:**

| Servicio | Puerto | BD Principal | Spring Data |
|----------|--------|-------------|-------------|
| `api-gateway` | 8080 | Redis | Spring Cloud Gateway |
| `auth-service` | 8081 | PostgreSQL | Spring Data JPA + Spring Security |
| `crm-service` | 8082 | PostgreSQL | Spring Data JPA |
| `orders-service` | 8083 | PostgreSQL | Spring Data JPA |
| `whatsapp-service` | 8084 | MongoDB | Spring Data MongoDB |
| `notifications-service` | 8085 | MongoDB | Spring Data MongoDB + Firebase Admin SDK |
| `reports-service` | 8086 | PostgreSQL + MongoDB | Spring Data JPA + MongoDB |
| `appointment-service` | 8087 | PostgreSQL | Spring Data JPA |

### 3.2 `services/appointment-service/` — Módulo Nuevo (Detallado)

El `appointment-service` es el módulo nuevo añadido en v2.2. Incluye integración con Google Calendar API y adaptadores para APIs propias de terceros:

```kotlin
// Estructura del package integration/
integration/
├── AvailabilityAdapter.kt          // Interface común
├── GoogleCalendarAdapter.kt        // Implementación Google Calendar
├── GoogleCalendarDtos.kt           // DTOs de Google Calendar API
└── CustomApiAdapter.kt             // Adaptador genérico para APIs de terceros
```

**Reglas de negocio:**
- Cada tenant configura horarios de atención y tipos de servicio
- Verificación de disponibilidad consulta Google Calendar + sistema propio (en paralelo)
- Lock optimista en PostgreSQL para evitar doble reserva
- Recordatorios automáticos: 24h antes (WhatsApp + Push) y 2h antes (Push)
- Integración bidireccional con Google Calendar

### 3.3 `mobile/` — Apps Nativas

#### Android (`mobile/android/`)

- **Kotlin + Jetpack Compose** (Material Design 3)
- **Arquitectura:** Clean Architecture (data/domain/presentation)
- **DI:** Hilt (Dagger)
- **Networking:** Retrofit + OkHttp
- **Local storage:** Room
- **Push:** Firebase SDK (FCM)
- **Build:** Gradle con version catalog (`libs.versions.toml`)

#### iOS (`mobile/ios/`)

- **SwiftUI** (Swift 6.x, target iOS 17+)
- **Arquitectura:** MVVM con Features organizados por módulo
- **Networking:** URLSession + async/await
- **Local storage:** CoreData
- **Push:** APNs via FCM bridge
- **Build:** Xcode project con SPM

Ambas apps comparten:
- Misma API backend (Spring Boot, versionada con `/api/v1/`)
- FCM como proveedor de push notifications
- JWT para autenticación
- Navegación offline-first con cache local

### 3.4 `infra/` — Infraestructura

```
infra/
├── docker-compose.yml          # Desarrollo: todos los servicios
├── docker-compose.prod.yml     # Producción: stack completo en VPS
├── .env.example                # Template (solo keys, sin valores reales)
├── Caddyfile                   # Reverse proxy + SSL
├── scripts/
│   ├── backup.sh               # Backup diario PostgreSQL + MongoDB
│   ├── deploy.sh               # Deploy a VPS vía SSH
│   └── setup-local.sh          # Setup inicial del dev environment
└── configs/
    ├── rabbitmq.conf           # Configuración RabbitMQ
    └── minio/
        └── init-buckets.sh     # Crea buckets iniciales al iniciar
```

**Servicios en docker-compose:**
- PostgreSQL 17, MongoDB 8, Redis 7.4, RabbitMQ 3.13, MinIO
- Caddy (solo producción)
- N8N (self-hosted)

### 3.5 `docs/` — Documentación

```
docs/
├── adr-001-stack.md            # ADR-001: Stack Tecnológico (v2.0 ✅)
├── adr-002-arquitectura.md     # ADR-002: Arquitectura de Microservicios (v2.2 ✅)
├── c4-context.md               # Diagramas C4: Context (L1), Container (L2), Component (L3)
├── dev-guide.md                # Guía de Desarrollo (setup, estándares, Git flow)
└── project-structure.md        # Este documento
```

---

## 4. Dependencias entre Servicios

```
api-gateway → auth-service, crm-service, orders-service, whatsapp-service,
              notifications-service, reports-service, appointment-service

whatsapp-service → Evolution API (externo), RabbitMQ, MongoDB
notifications-service → Firebase Cloud Messaging (externo), whatsapp-service, MongoDB
appointment-service → Google Calendar API (externo), RabbitMQ, PostgreSQL
crm-service → RabbitMQ, PostgreSQL
orders-service → RabbitMQ, PostgreSQL, MinIO
reports-service → PostgreSQL, MongoDB
auth-service → PostgreSQL, Redis
```

Inter-servicio vía RabbitMQ (async) para eventos:

| Evento | Producer | Consumers |
|--------|----------|-----------|
| `message.received` | whatsapp-service | crm-service, notifications-service |
| `order.created` | orders-service | notifications-service, n8n |
| `appointment.created` | appointment-service | notifications-service, whatsapp-service, n8n |
| `appointment.cancelled` | appointment-service | notifications-service, whatsapp-service, n8n |
| `appointment.reminder` | appointment-service / n8n | notifications-service, whatsapp-service |
| `user.registered` | auth-service | notifications-service |
| `client.updated` | crm-service | reports-service |

---

## 5. Archivos Clave en la Raíz

| Archivo | Descripción |
|---------|-------------|
| `build.gradle.kts` | Config de build root: versiones compartidas, plugins, subproyectos |
| `settings.gradle.kts` | Incluye todos los servicios y configura repositorios |
| `gradle/libs.versions.toml` | Version catalog: centraliza versiones de dependencias |
| `.github/workflows/ci.yml` | CI/CD: detect cambios, build + test por servicio, Docker image |

---

*Documentado por Doc — Documentador de Arquitectura, EGIT Consultoría*  
*Actualizado: 17 Marzo 2026 · Basado en ADR-001 v2.0 y ADR-002 v2.2*
