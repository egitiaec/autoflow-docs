# Guía de Desarrollo — AutoFlow

| Campo | Valor |
|-------|-------|
| **Estado** | ✅ Actualizado — Doc (2026-03-17) |
| **Stack** | Java 21 · Spring Boot 3 · Kotlin · Docker Compose |
| **Basado en** | ADR-001 Stack v2.0, ADR-002 Arquitectura v2.2 |

Guía completa para configurar el entorno de desarrollo y contribuir al proyecto AutoFlow.

---

## 1. Requisitos Previos

| Herramienta | Versión mínima | Notas |
|-------------|---------------|-------|
| **Java (JDK)** | 21 LTS | Eclipse Temurin o Amazon Corretto |
| **Kotlin** | 2.1.x | Incluido en Gradle wrapper |
| **Gradle** | 8.x | Usar el Gradle wrapper del proyecto (`./gradlew`) |
| **Docker** | 24+ | Docker Desktop o Docker Engine |
| **Docker Compose** | v2+ | Incluido en Docker Desktop |
| **Git** | 2.40+ | Cualquier versión reciente |
| **IDE** | — | IntelliJ IDEA Community (recomendado para Kotlin/Spring) |
| **Postman / Insomnia** | — | Para testing de APIs (opcional) |

### Instalar JDK 21 (macOS con SDKMAN)

```bash
# Instalar SDKMAN (si no tienes)
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Instalar Java 21
sdk install java 21-tem
sdk use java 21-tem

# Verificar
java -version
# openjdk version "21.x.x"
```

### Instalar JDK 21 (Linux)

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
java -version
```

---

## 2. Setup del Entorno de Desarrollo

### 2.1 Clonar el repositorio

```bash
git clone https://github.com/egit-consultoria/autoflow.git
cd autoflow
```

### 2.2 Estructura del monorepo

```
autoflow/
├── services/               # Todos los microservicios
│   ├── api-gateway/
│   ├── auth-service/
│   ├── crm-service/
│   ├── orders-service/
│   ├── whatsapp-service/
│   ├── notifications-service/
│   ├── reports-service/
│   └── appointment-service/
├── infra/                  # Docker Compose, configs
│   ├── docker-compose.yml
│   └── .env.example
├── mobile/                 # Apps móviles
│   ├── android/            # Kotlin + Jetpack Compose
│   └── ios/                # SwiftUI
├── n8n/                    # Workflows N8N
│   └── workflows/
├── docs/                   # Documentación
│   ├── adr-001-stack.md
│   ├── adr-002-arquitectura.md
│   ├── c4-context.md
│   ├── dev-guide.md
│   └── project-structure.md
├── .github/workflows/      # CI/CD
│   └── ci.yml
├── build.gradle.kts        # Build config compartido
└── settings.gradle.kts     # Incluye todos los services/
```

### 2.3 Configurar variables de entorno

```bash
cd infra
cp .env.example .env
```

Editar `.env` con las credenciales de desarrollo:

```env
# ──────────────────────────────────────
# PostgreSQL
# ──────────────────────────────────────
POSTGRES_DB=autoflow_db
POSTGRES_USER=autoflow
POSTGRES_PASSWORD=autoflow_dev
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/autoflow_db
SPRING_DATASOURCE_USERNAME=autoflow
SPRING_DATASOURCE_PASSWORD=autoflow_dev

# ──────────────────────────────────────
# MongoDB
# ──────────────────────────────────────
MONGO_DB=autoflow_mongo
MONGO_USER=admin
MONGO_PASSWORD=admin_dev
SPRING_DATA_MONGODB_URI=mongodb://localhost:27017/autoflow_mongo

# ──────────────────────────────────────
# Redis
# ──────────────────────────────────────
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# ──────────────────────────────────────
# RabbitMQ
# ──────────────────────────────────────
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin_dev
SPRING_RABBITMQ_HOST=localhost
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=admin
SPRING_RABBITMQ_PASSWORD=admin_dev

# ──────────────────────────────────────
# Auth (auth-service)
# ──────────────────────────────────────
JWT_PRIVATE_KEY_PATH=classpath:keys/private-key.pem
JWT_PUBLIC_KEY_PATH=classpath:keys/public-key.pem
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# ──────────────────────────────────────
# WhatsApp / Evolution API
# ──────────────────────────────────────
EVOLUTION_API_BASE_URL=https://evolutionapi.egit.site
EVOLUTION_API_KEY=tu-api-key-aqui
EVOLUTION_INSTANCE_NAME=miAsistente
EVOLUTION_INSTANCE_NUMBER=593984526396
EVOLUTION_WEBHOOK_SECRET=tu-webhook-secret
EVOLUTION_WEBHOOK_URL=http://localhost:8084/webhook/evolution

# ──────────────────────────────────────
# Firebase Cloud Messaging (notifications-service)
# ──────────────────────────────────────
FCM_SERVICE_ACCOUNT_JSON=classpath:firebase-service-account.json
FCM_PROJECT_ID=tu-firebase-project-id

# ──────────────────────────────────────
# Google Calendar API (appointment-service)
# ──────────────────────────────────────
GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON=classpath:google-service-account.json

# ──────────────────────────────────────
# MinIO (file storage)
# ──────────────────────────────────────
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin_dev
MINIO_BUCKET_WHATSAPP_MEDIA=whatsapp-media
MINIO_BUCKET_INVOICES=invoices

# ──────────────────────────────────────
# Email (notifications-service)
# ──────────────────────────────────────
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@autoflow.ec

# ──────────────────────────────────────
# App
# ──────────────────────────────────────
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
APP_BASE_URL=http://localhost:8080
N8N_ENCRYPTION_KEY=tu-encryption-key
```

> **⚠️ Seguridad:** Nunca commitear `.env` con valores reales. El archivo `.env.example` solo incluye keys y valores placeholder.

### 2.4 Levantar infraestructura con Docker Compose

```bash
cd infra
docker compose up -d
```

Esto inicia los servicios de infraestructura:

| Servicio | Puerto Host | Descripción |
|----------|-------------|-------------|
| **PostgreSQL** | 5432 | BD relacional principal |
| **MongoDB** | 27017 | BD NoSQL (mensajes, logs, tokens) |
| **Redis** | 6379 | Cache, sesiones, rate limiting |
| **RabbitMQ** | 5672 / 15672 (UI) | Message broker entre microservicios |
| **MinIO** | 9000 / 9001 (UI) | File storage S3-compatible |
| **Caddy** | 80 / 443 | Reverse proxy (solo en producción) |

Verificar que todo está corriendo:

```bash
docker compose ps
# Todos los servicios deben mostrar "Up"

# RabbitMQ Management UI: http://localhost:15672 (admin/admin_dev)
# MinIO Console: http://localhost:9001 (minioadmin/minioadmin_dev)
```

### 2.5 Levantar Evolution API (externo)

La Evolution API corre en un servidor separado de EGIT:

```bash
# La API ya está corriendo en:
# https://evolutionapi.egit.site
# Instancia: miAsistente
# Número: 593984526396

# Verificar que responde:
curl -X GET "https://evolutionapi.egit.site/instance/connect/miAsistente" \
  -H "apikey: tu-api-key-aqui"
```

Para desarrollo local contra la Evolution API remota, solo asegúrate de que las variables `EVOLUTION_API_*` estén configuradas en `.env`.

### 2.6 Levantar un microservicio

```bash
# Desde la raíz del proyecto
cd services/auth-service

# Opción A: Con Gradle wrapper
./gradlew bootRun

# Opción B: Con IntelliJ IDEA
# → Abrir services/auth-service como proyecto
# → Run/Debug: AuthServiceApplication.kt

# El servicio estará en http://localhost:8081
```

Para levantar **todos** los microservicios a la vez:

```bash
# Terminal 1
cd services/api-gateway && ./gradlew bootRun

# Terminal 2
cd services/auth-service && ./gradlew bootRun

# Terminal 3
cd services/crm-service && ./gradlew bootRun

# Terminal 4
cd services/orders-service && ./gradlew bootRun

# Terminal 5
cd services/whatsapp-service && ./gradlew bootRun

# Terminal 6
cd services/notifications-service && ./gradlew bootRun

# Terminal 7
cd services/reports-service && ./gradlew bootRun

# Terminal 8
cd services/appointment-service && ./gradlew bootRun
```

### 2.7 Levantar N8N

```bash
# N8N ya está corriendo como contenedor Docker
# Acceder en: http://localhost:5678

# Login inicial: configurar en primera vez
# Usuario: admin
# Contraseña: configurar en N8N_BASIC_AUTH_PASSWORD
```

---

## 3. Puertos de Desarrollo

| Servicio | Puerto | URL |
|----------|--------|-----|
| **API Gateway** | 8080 | http://localhost:8080/api/v1/... |
| **auth-service** | 8081 | http://localhost:8081 |
| **crm-service** | 8082 | http://localhost:8082 |
| **orders-service** | 8083 | http://localhost:8083 |
| **whatsapp-service** | 8084 | http://localhost:8084 |
| **notifications-service** | 8085 | http://localhost:8085 |
| **reports-service** | 8086 | http://localhost:8086 |
| **appointment-service** | 8087 | http://localhost:8087 |
| **N8N** | 5678 | http://localhost:5678 |
| **PostgreSQL** | 5432 | jdbc:postgresql://localhost:5432/autoflow_db |
| **MongoDB** | 27017 | mongodb://localhost:27017 |
| **Redis** | 6379 | redis://localhost:6379 |
| **RabbitMQ Management** | 15672 | http://localhost:15672 |
| **MinIO Console** | 9001 | http://localhost:9001 |

> En desarrollo puedes apuntar directamente a cada microservicio. En producción, todo pasa por el API Gateway (`:8080`).

---

## 4. Cómo Conectar a Evolution API Localmente

### 4.1 Configuración

El `whatsapp-service` se comunica con Evolution API remota. Las variables clave ya están en `.env`:

```
EVOLUTION_API_BASE_URL=https://evolutionapi.egit.site
EVOLUTION_API_KEY=tu-api-key
EVOLUTION_INSTANCE_NAME=miAsistente
EVOLUTION_WEBHOOK_SECRET=tu-webhook-secret
```

### 4.2 Probar la conexión

```bash
# Verificar estado de la instancia
curl -X GET "https://evolutionapi.egit.site/instance/connect/miAsistente" \
  -H "apikey: $EVOLUTION_API_KEY"

# Enviar mensaje de prueba
curl -X POST "https://evolutionapi.egit.site/message/sendText/miAsistente" \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{
    "number": "593XXXXXXXXX",
    "text": "Mensaje de prueba desde AutoFlow dev"
  }'
```

### 4.3 Webhooks

El webhook de Evolution API apunta al API Gateway:

```
EVOLUTION_WEBHOOK_URL=https://autoflow.egit.site/api/v1/webhook/evolution
```

Para desarrollo local con webhooks (si necesitas recibir mensajes entrantes en tu máquina local):

1. Usar **ngrok** o **localtunnel** para exponer tu puerto local:
   ```bash
   npx ngrok http 8080
   # Anota la URL: https://xxxx.ngrok.io
   ```

2. Actualizar el webhook en Evolution API:
   ```bash
   curl -X POST "https://evolutionapi.egit.site/webhook/set/miAsistente" \
     -H "Content-Type: application/json" \
     -H "apikey: $EVOLUTION_API_KEY" \
     -d '{
       "webhook": {
         "url": "https://xxxx.ngrok.io/api/v1/webhook/evolution",
         "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE"]
       }
     }'
   ```

3. Los mensajes entrantes llegarán a `POST /api/v1/webhook/evolution` en tu `whatsapp-service`.

### 4.4 Endpoints clave de Evolution API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/instance/connect/{instance}` | Estado de conexión |
| POST | `/message/sendText/{instance}` | Enviar texto |
| POST | `/message/sendMedia/{instance}` | Enviar archivo |
| GET | `/message/findMessages/{instance}` | Historial |
| POST | `/webhook/set/{instance}` | Configurar webhook |
| GET | `/instance/fetchInstances` | Listar instancias |

---

## 5. Estandares de Código

### 5.1 Kotlin

- **Estilo Kotlin Idiomatico:** usar `data class`, `sealed class`, `extension functions`, `null safety`.
- **Null safety:** evitar `!!`. Usar `?.`, `?:`, `let {}`.
- **Inmutabilidad preferida:** `val` sobre `var`, `data class` con `val`.
- **Paquetes por capa:** `controller`, `service`, `repository`, `model`, `dto`, `config`, `integration`.

Estructura estándar de un microservicio:

```
src/main/kotlin/com/autoflow/{servicio}/
├── controller/
│   └── {Entity}Controller.kt
├── service/
│   └── {Entity}Service.kt
├── repository/
│   └── {Entity}Repository.kt
├── model/
│   ├── {Entity}.kt            # Entidad JPA/Mongo
│   └── {Entity}Status.kt      # Enum de estados
├── dto/
│   ├── Create{Entity}Request.kt
│   ├── Update{Entity}Request.kt
│   └── {Entity}Response.kt
├── config/
│   ├── SecurityConfig.kt
│   └── MongoConfig.kt         # Si usa MongoDB
├── integration/               # Si tiene integraciones externas
│   └── EvolutionApiClient.kt
└── {Servicio}Application.kt   # @SpringBootApplication
```

### 5.2 Spring Boot

- **Lombok:** NO usar — Kotlin ya provee boilerplate reduction.
- **DTOs:** siempre separar request/response de entidades JPA.
- **Validación:** `@Valid`, `@NotBlank`, `@NotNull` en DTOs de entrada.
- **Excepciones:** usar `@ControllerAdvice` + `@ExceptionHandler` centralizado.
- **Logging:** SLF4J via `companion object { private val logger = LoggerFactory.getLogger(...) }`.

### 5.3 Tests

- **Unit tests:** JUnit 5 + MockK (para mocks en Kotlin).
- **Integration tests:** `@SpringBootTest` + Testcontainers (PostgreSQL, MongoDB).
- **Nombres de test:** `should_{behavior}_when_{condition}` — ej: `should_throw_when_user_not_found`.

```bash
# Correr tests de un servicio
cd services/auth-service
./gradlew test

# Correr tests de todos los servicios
./gradlew test

# Correr un test específico
./gradlew test --tests "com.autoflow.auth.service.AuthServiceTest"

# Coverage
./gradlew jacocoTestReport
# Reporte en: build/reports/jacoco/test/html/index.html
```

### 5.4 Code Quality

- **Kotlin DSL:** `build.gradle.kts` (no Groovy).
- **Dependencies:** versiones definidas en `build.gradle.kts` root (ext) o `libs.versions.toml`.
- **Spotless:** formato automático de código Kotlin.
- **Detekt:** linter estático para Kotlin.

```bash
# Aplicar formato
./gradlew spotlessApply

# Verificar formato
./gradlew spotlessCheck

# Ejecutar detekt
./gradlew detekt
```

---

## 6. Flujo de Git

### 6.1 Branches

```
main           ← código en producción (protegido, merge con PR aprobado + CI green)
 │
 └── develop   ← rama de integración (todas las features se mergean aquí)
      │
      ├── feature/HU-001-login-jwt
      ├── feature/HU-015-gestion-citas
      ├── feature/HU-008-whatsapp-webhook
      ├── bugfix/fix-appointment-timezone
      └── ...
```

### 6.2 Flujo de trabajo

**1. Crear feature branch desde `develop`:**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/HU-001-login-jwt
```

**2. Trabajar y commitear (Conventional Commits):**

```bash
git add .
git commit -m "feat(auth): agregar endpoint de login con JWT"

# Otros ejemplos:
# fix(orders): corregir cálculo de total con IVA
# feat(appointments): agregar verificación de disponibilidad v2
# docs(dev-guide): actualizar instrucciones de setup
# test(crm): agregar tests unitarios para ClientService
# refactor(whatsapp): extraer EvolutionApiClient como bean
# chore(infra): agregar MinIO a docker-compose
```

**3. Push y abrir Pull Request:**

```bash
git push origin feature/HU-001-login-jwt
```

Abrir PR en GitHub: `feature/HU-001-login-jwt` → `develop`

- Título: `feat(auth): Login con JWT y refresh tokens` (o el título del HU)
- Descripción: qué se hizo, qué se probó, screenshots si aplica
- Review: mínimo 1 aprobación antes de merge

**4. Merge a `develop`:** Squash merge preferido para features limpios.

**5. Release:** Crear `release/vX.Y.Z` desde `develop` → test final → merge a `main` + tag.

### 6.3 Nomenclatura de branches

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feature/HU-XXX` | Nueva funcionalidad | `feature/HU-015-gestion-citas` |
| `bugfix/` | Corrección de bug | `bugfix/fix-appointment-timezone` |
| `hotfix/` | Fix urgente en producción | `hotfix/fix-crash-login` |
| `release/vX.Y.Z` | Preparación de release | `release/v1.0.0` |
| `docs/` | Solo documentación | `docs/update-dev-guide` |

### 6.4 Convención de Commits

Formato: `<tipo>(<alcance>): <descripción>`

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formato, sin cambio de lógica |
| `refactor` | Reestructuración sin cambio funcional |
| `test` | Agregar o corregir tests |
| `chore` | Tareas de mantenimiento (dependencias, CI) |
| `perf` | Mejora de performance |

---

## 7. Despliegue en Producción (VPS)

### 7.1 Levantar todo el stack

```bash
# En el VPS
git clone https://github.com/egit-consultoria/autoflow.git
cd autoflow

# Configurar variables de producción
cp infra/.env.example infra/.env
# Editar infra/.env con credenciales REALES (permisos 600)

# Levantar todo
cd infra
docker compose -f docker-compose.prod.yml up -d --build
```

### 7.2 Comandos útiles en Producción

```bash
# Ver logs de un servicio
docker compose logs -f auth-service

# Reiniciar un servicio
docker compose restart whatsapp-service

# Actualizar todo
git pull
docker compose up -d --build

# Ver estado de todos los contenedores
docker compose ps

# Acceder a una shell dentro de un contenedor
docker exec -it autoflow-postgres psql -U autoflow autoflow_db
docker exec -it autoflow-mongo mongosh
docker exec -it autoflow-rabbitmq rabbitmqctl list_users
```

### 7.3 Backup

```bash
# Ejecutar backup manual
./infra/scripts/backup.sh

# Los backups corren diario a las 02:00 vía cron
# PostgreSQL → /backups/pg_YYYYMMDD_HHMMSS.sql.gz
# MongoDB → /backups/mongo_YYYYMMDD_HHMMSS.archive.gz
```

---

## 8. Troubleshooting

### Problemas Comunes

| Problema | Solución |
|----------|---------|
| `Connection refused` a PostgreSQL/Mongo | Verificar que Docker Compose está corriendo: `docker compose ps` |
| `EVOLUTION_API_KEY` inválido | Confirmar que la key es correcta en `.env`. La API está en `evolutionapi.egit.site` |
| Puerto ocupado | Verificar: `lsof -i :8080`. Cambiar puerto en `application.yml` del servicio |
| Tests fallan con Testcontainers | Asegurar que Docker está corriendo y tiene suficiente RAM |
| Gradle no encuentra JDK 21 | Verificar `JAVA_HOME` apunta a JDK 21: `echo $JAVA_HOME` |
| Flyway migration falla | No hacer cambios de schema directamente en BD. Usar archivos de migración en `db/migration/` |

### Verificar conexiones entre servicios

```bash
# Test auth-service (directo)
curl http://localhost:8081/actuator/health

# Test a través del gateway
curl http://localhost:8080/api/v1/auth/me

# Test MongoDB
docker exec -it autoflow-mongo mongosh --eval "db.adminCommand('ping')"

# Test RabbitMQ
docker exec -it autoflow-rabbitmq rabbitmqctl list_queues

# Test MinIO
curl http://localhost:9000/minio/health/live
```

---

*Documentado por Doc — Documentador de Arquitectura, EGIT Consultoría*  
*Actualizado: 17 Marzo 2026 · Basado en ADR-001 v2.0 y ADR-002 v2.2*
