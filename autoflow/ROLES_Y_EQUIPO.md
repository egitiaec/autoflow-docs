# AutoFlow — Roles y Equipo

> Definición de roles, responsabilidades y composición del equipo de desarrollo.

---

## Composición del Equipo

| Rol | Cantidad | Focus |
|-----|----------|-------|
| Backend Java Senior | 1 | Arquitectura, patrones de diseño, code quality |
| Backend Java Mid | 1 | Implementación de servicios, testing |
| Frontend Angular | 1 | UI/UX web, componentes, estado de la app |
| Mobile Developer | 1 | Aplicaciones móviles nativas Android e iOS |
| Full-stack / N8N | 1 | Workflows de automatización, integraciones, infraestructura ligera |
| DBA | 1 | Integridad, rendimiento y disponibilidad de los datos |

**Total: 6 devs + 1 Scrum Master + 1 Product Owner**

---

## Responsabilidades por Rol

### 🔧 Backend Java Senior (BE1)
Dueño de: Arquitectura técnica, patrones de diseño, code quality
Stack principal: Spring Boot, PostgreSQL, Redis, MongoDB
Responsabilidades:
- Definir arquitectura de microservicios y contratos de API (OpenAPI/Swagger)
- Diseñar esquemas relacionales (PostgreSQL) y de documentos (MongoDB), incluyendo estrategia de caché con Redis
- Implementar módulos complejos (auth, facturación, integración con servicios externos)
- Code review de todo el código backend
- Configurar CI/CD pipeline y ambientes de staging/producción
- Documentar decisiones técnicas (ADR - Architecture Decision Records)
- Definir estándares de seguridad: JWT, OAuth2, manejo de secretos
- Mentorear al Backend Java Mid

### 🔧 Backend Java Mid (BE2)
Dueño de: Implementación de servicios, testing
Stack principal: Spring Boot, PostgreSQL, MongoDB
Responsabilidades:
- Implementar microservicios según especificaciones y contratos definidos por BE1
- Escribir tests unitarios y de integración (JUnit, Mockito)
- Consumir APIs externas (pasarelas de pago, servicios de terceros, etc.)
- Actualizar documentación técnica de sus módulos
- Participar activamente en code reviews (dar y recibir)
- Mantener coverage ≥ 80% en sus servicios
- Implementar manejo de errores, logging estructurado y trazabilidad

### 🎨 Frontend Angular (FE)
Dueño de: UI/UX web, componentes, estado de la app
Stack principal: Angular, TypeScript, Bootstrap, PrimeNG
Responsabilidades:
- Desarrollar dashboard y web app con Angular/TypeScript
- Crear componente library reutilizable con PrimeNG y Bootstrap como base
- Consumir APIs del backend (contract testing con Pact o similar)
- Implementar responsive design con Bootstrap y customización PrimeNG
- Optimizar performance (lazy loading, code splitting, OnPush strategy)
- Integrar autenticación JWT en el frontend (guards, interceptors)
- Validaciones de formularios reactivos y manejo de errores UX
- Gestionar estado de la aplicación (NgRx o servicios + signals)

### 📱 Mobile Developer (MOB)
Dueño de: Aplicaciones móviles nativas Android e iOS
Stack principal: Kotlin / Jetpack Compose (Android), Swift / SwiftUI (iOS)
Responsabilidades:
- Desarrollar la app Android con Kotlin y Jetpack Compose
- Desarrollar la app iOS con Swift y SwiftUI
- Consumir APIs REST del backend (Retrofit / URLSession)
- Implementar autenticación JWT y manejo seguro de tokens en dispositivo
- Gestionar navegación, estado local y persistencia (Room / CoreData)
- Asegurar UX consistente entre plataformas respetando guidelines de cada OS (Material3 / HIG)
- Publicar y mantener builds en Google Play y App Store
- Coordinar con FE y BE para alineación de contratos de API

### ⚡ Full-stack / N8N (FS)
Dueño de: Workflows de automatización, integraciones, infraestructura ligera
Stack principal: N8N, Node.js, Docker, Spring (consumo), PostgreSQL
Responsabilidades:
- Diseñar e implementar workflows en N8N
- Crear integraciones entre microservicios y servicios externos (webhooks, APIs, eventos)
- Scripts de utilidad (migración de datos, seed, monitoreo)
- Configurar webhooks y event handlers
- Soporte de infraestructura (Docker Compose, deploy scripts, variables de entorno)
- Documentar flows de automatización y dependencias entre sistemas
- Puente entre backend y herramientas no-code / low-code
- Alertas y notificaciones automáticas (email, Slack, etc.)

### 🗄️ DBA — Database Administrator (DBA)
Dueño de: Integridad, rendimiento y disponibilidad de los datos
Stack principal: PostgreSQL, MongoDB, Redis
Responsabilidades:
- Diseñar y revisar esquemas relacionales (PostgreSQL) y de documentos (MongoDB) en coordinación con BE1
- Crear y mantener migraciones de base de datos (Flyway / Liquibase)
- Definir índices, particionamiento y estrategias de query optimization
- Configurar y administrar Redis como capa de caché y manejo de sesiones
- Implementar políticas de backup, recuperación y retención de datos
- Monitorear performance de queries y proponer optimizaciones (EXPLAIN ANALYZE, slow query log)
- Gestionar roles, permisos y seguridad de acceso a bases de datos
- Documentar modelo de datos y diccionario de datos del proyecto
- Apoyar al equipo de desarrollo con consultas complejas, stored procedures y vistas materializadas
- Coordinar con FS para consistencia de datos en flujos de automatización

---

## RACI Matrix

**Leyenda:**
- **R** = Responsable (hace el trabajo)
- **A** = Aprobador (toma la decisión final)
- **C** = Consultado (da input antes)
- **I** = Informado (se entera después)

### Por Módulo/Servicio:

| Módulo | BE1 | BE2 | FE | FS | PO | SM |
|--------|-----|-----|----|----|----|----|
| **API Gateway** | R/A | C | C | I | I | I |
| **Auth Service** | R/A | C | C | I | I | I |
| **Users Service** | A | R | C | I | C | I |
| **Billing Service** | R/A | C | C | C | C | I |
| **Automation Engine** | A | R | C | R* | C | I |
| **N8N Workflows** | C | I | C | R/A | C | I |
| **Notifications** | A | R | C | R* | C | I |
| **Dashboard Web** | C | C | R/A | C | C | I |
| **API Docs** | R | R | I | I | I | I |
| **CI/CD Pipeline** | R/A | C | I | C | I | I |
| **DB Schema** | R/A | C | I | I | C | I |
| **Sprint Planning** | C | C | C | C | A | R |
| **Sprint Execution** | R | R | R | R | C | A |
| **Code Review** | R | R | R | R | I | I |

*N8N workflows que requieren backend changes → FE1/BE2 consultados*

### Flujo de Decisión Técnica:
1. Dev implementa
2. Code review por otro dev del mismo stack (BE→BE, FE→FE)
3. BE1 aprueba decisiones arquitectónicas
4. PO aprueba decisiones de UX/funcionalidad
5. SM aprueba decisiones de proceso

---

## Asignación de HUs

### Proceso:
1. **Planning:** SM presenta HUs priorizadas del backlog
2. **Estimación:** Equipo estima con Planning Poker (Fibonacci: 1, 2, 3, 5, 8, 13)
3. **Asignación voluntaria:** Cada dev elige HUs según expertise e interés
4. **Balanceo:** SM asegura distribución equitativa (±2 SP entre devs)
5. **Commitment:** Cada dev confirma lo que puede comprometer

### Reglas de asignación:
- **No más de 2 HUs activas por dev** (evitar context switching)
- **HUs de ≥8 SP** van优先 al Senior o se pair-program
- **Cada dev** debe tocar al menos 1 HU fuera de su zona de comfort por sprint
- **Cross-training:** FE puede tocar BE simple, BE puede tocar FS, etc.
- **Si un dev termina temprano** → ayuda a otro antes de tomar HU nueva

### Distribución sugerida por sprint (ejemplo 32 SP):

| Dev | SP sugeridos | Rol focus |
|-----|-------------|-----------|
| BE1 | 8-10 | Arquitectura + 1-2 servicios |
| BE2 | 8-10 | 2-3 servicios CRUD |
| FE | 6-8 | Dashboard + integración APIs |
| FS | 4-6 | N8N + scripts + soporte |

---

## Requisitos Técnicos por Rol

### 🔧 Backend Java Senior
**Must have:**
- Java 17+ / Spring Boot 3.x (2+ años)
- Spring Cloud (Gateway, Config, Eureka/Discovery)
- Spring Security + JWT/OAuth2
- JPA/Hibernate + PostgreSQL
- API design (REST, OpenAPI/Swagger)
- Tests: JUnit 5, Mockito, Testcontainers
- Docker, Docker Compose
- Git flow (branches, PRs, merge strategies)

**Nice to have:**
- Arquitectura de microservicios en producción
- CI/CD (GitHub Actions, Jenkins)
- Redis, RabbitMQ/Kafka
- Performance tuning y monitoring

### 🔧 Backend Java Mid
**Must have:**
- Java 11+ / Spring Boot (1+ año)
- Spring Web (controllers, services, repositories)
- JPA/Hibernate + SQL básico
- Tests unitarios (JUnit 5, Mockito)
- Consumo de APIs REST

**Nice to have:**
- Spring Security básico
- Docker básico
- Documentación de APIs (Swagger)
- Patrones de diseño (Repository, Service, Builder)

### 🎨 Frontend Angular (FE)
**Must have:**
- Angular, TypeScript, Bootstrap, PrimeNG
- Estado: NgRx o servicios + signals
- Routing
- Forms
- HTTP: Axios o Fetch
- Responsive design
- Consumo de APIs REST

**Nice to have:**
- Testing: Jest, Cypress
- WebSocket
- PWA basics
- Design systems

### 📱 Mobile Developer (MOB)
**Must have:**
- Kotlin / Jetpack Compose o Swift / SwiftUI (1+ año)
- Consumo de APIs REST
- Navegación y estado local
- Local storage / persistence

**Nice to have:**
- Push notifications
- App Store / Play Store deployment
- Offline sync
- Native modules (Java/Kotlin o Swift/Dart)

### ⚡ Full-stack / N8N (FS)
**Must have:**
- JavaScript/TypeScript (1+ año)
- N8N (instalar, crear workflows, nodos básicos)
- Node.js básico (scripts, Express mínimo)
- APIs REST (consumo y creación)
- Docker básico
- Git básico
- Webhooks y eventos

**Nice to have:**
- React/Vue básico
- Python (scripts)
- Linux server management
- Monitoring tools
- CI/CD pipelines

### 🗄️ DBA — Database Administrator (DBA)
**Must have:**
- PostgreSQL, MongoDB, Redis (avanzado)
- Diseño y optimización de esquemas
- Backup y recuperación de datos
- Monitoreo de performance (queries, índices)
- Gestión de usuarios y permisos

**Nice to have:**
- Replicación, clustering, sharding
- Herramientas de visualización (Grafana)
- Scripting (Bash, Python) para automatización
- Experiencia con cloud databases (RDS, Atlas)

### 🗄️ DBA — Database Administrator (DBA)
**Must have:**
- PostgreSQL, MongoDB, Redis (avanzado)
- Diseño y optimización de esquemas
- Backup y recuperación de datos
- Monitoreo de performance (queries, índices)
- Gestión de usuarios y permisos

**Nice to have:**
- Replicación, clustering, sharding
- Herramientas de visualización (Grafana)
- Scripting (Bash, Python) para automatización
- Experiencia con cloud databases (RDS, Atlas)

---

## Communication Channels

| Canal | Uso |
|-------|-----|
| **Slack #autoflow-dev** | Daily standup async, preguntas rápidas, bloqueos |
| **Slack #autoflow-alerts** | CI/CD notifications, deploy alerts (solo lectura) |
| **GitHub Repo** | Code, PRs, issues, reviews |
| **Sprint Tracker (este repo)** | Tracking diario, burndown, notas |
| **Llamada diaria (9:00 AM)** | Daily standup sincrónico |

---

## Onboarding Checklist para Nuevo Dev

- [ ] Acceso a GitHub repo
- [ ] Acceso a Slack canales
- [ ] Entorno local levantado (README del repo)
- [ ] Docker Compose funcionando (6 microservicios corriendo)
- [ ] Al menos 1 PR mergeada en primera semana (HUs pequeñas)
- [ ] Assignado buddy (dev experimentado) para primeras dudas
- [ ] Revisado este documento y SCRUM_FRAMEWORK.md

---

*Documento vivo. Actualizar cuando el equipo o proceso evolucione.*
*Última actualización: 2026-03-19*
