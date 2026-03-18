# AutoFlow — Roles y Equipo

> Definición de roles, responsabilidades y composición del equipo de desarrollo.

---

## Composición del Equipo

### Fase 1 (Sprints 1-4) — Equipo Core

| Rol | Cantidad | Focus |
|-----|----------|-------|
| Backend Java Senior | 1 | Arquitectura, API Gateway, Auth, servicios complejos |
| Backend Java Mid | 1 | Microservicios CRUD, integraciones, testing |
| Frontend React | 1 | Dashboard, web app, componentes reutilizables |
| Full-stack / N8N | 1 | Workflows N8N, integraciones, scripts, devops ligero |

**Total: 4 devs + 1 Scrum Master + 1 Product Owner**

### Fase 2 (Post-Sprint 4) — Expansión

| Rol | Cantidad | Focus |
|-----|----------|-------|
| Mobile Developer | 1 | App React Native / Flutter |

---

## Responsabilidades por Rol

### 🔧 Backend Java Senior (BE1)
**Dueño de:** Arquitectura técnica, patrones de diseño, code quality

Responsabilidades:
- Definir arquitectura de microservicios y contratos de API
- Diseñar esquemas de base de datos y migraciones
- Implementar módulos complejos (auth, facturación, integración SEB)
- Code review de todo el código backend
- Configurar CI/CD pipeline y ambiente de staging
- Documentar decisiones técnicas (ADR - Architecture Decision Records)
- Mentorear al Backend Java Mid

### 🔧 Backend Java Mid (BE2)
**Dueño de:** Implementación de servicios, testing

Responsabilidades:
- Implementar microservicios según especificaciones
- Escribir tests unitarios y de integración
- Consumir APIs externas (SEB, pasarelas de pago, etc.)
- Actualizar documentación técnica de sus módulos
- Participar activamente en code reviews (dar y recibir)
- Mantener coverage ≥ 80% en sus servicios

### 🎨 Frontend React (FE)
**Dueño de:** UI/UX web, componentes, estado de la app

Responsabilidades:
- Desarrollar dashboard y web app con React/TypeScript
- Crear componente library reutilizable
- Consumir APIs del backend (contract testing)
- Implementar responsive design
- Optimizar performance (lazy loading, code splitting)
- Integrar autenticación JWT en el frontend
- Validaciones de formularios y manejo de errores UX

### ⚡ Full-stack / N8N (FS)
**Dueño de:** Workflows de automatización, integraciones, infraestructura ligera

Responsabilidades:
- Diseñar e implementar workflows en N8N
- Crear integraciones entre microservicios y servicios externos
- Scripts de utilidad (migración, seed, monitoring)
- Configurar webhooks y event handlers
- Soporte de infraestructura (Docker compose, deploy scripts)
- Documentar flows de automatización
- Puente entre backend y herramientas no-code

### 📱 Mobile Developer (Fase 2 — opcional)
**Dueño de:** App móvil

Responsabilidades:
- Desarrollar app React Native o Flutter
- Consumir APIs del backend
- Implementar push notifications
- Store deployment (App Store, Play Store)
- Sincronización offline-first (si aplica)

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
- Git básico (branch, commit, PR)

**Nice to have:**
- Spring Security básico
- Docker básico
- Documentación de APIs (Swagger)
- Patrones de diseño (Repository, Service, Builder)

### 🎨 Frontend React
**Must have:**
- React 18+ / TypeScript (1+ año)
- Estado: Redux Toolkit o Zustand o Context API
- Routing: React Router v6
- Forms: react-hook-form o Formik
- HTTP: Axios o Fetch
- CSS: Tailwind o styled-components o MUI
- Responsive design
- Consumo de APIs REST

**Nice to have:**
- Next.js
- Testing: React Testing Library, Cypress
- WebSocket
- PWA basics
- Design systems

### ⚡ Full-stack / N8N
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

### 📱 Mobile Developer (Fase 2)
**Must have:**
- React Native O Flutter (1+ año)
- Consumo de APIs REST
- Navegación y navegación
- Local storage / persistence
- Push notifications

**Nice to have:**
- App Store / Play Store deployment
- Offline sync
- Native modules (Java/Kotlin o Swift/Dart)

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
*Última actualización: 2026-03-18*
