# AutoFlow — Spec-Driven Development con GitHub Spec Kit

> Guía práctica para aplicar Spec-Driven Development al proyecto AutoFlow usando [github/spec-kit](https://github.com/github/spec-kit).
> Estado: 🟡 Draft v1.0 — Listo para revisión del equipo

---

## 1. ¿Qué es Spec-Driven Development?

**Spec-Driven Development (SDD)** invierte la relación tradicional entre especificaciones y código. En lugar de que los specs sean documentos estáticos que se escriben una vez y se olvidan, **las especificaciones se convierten en artefactos ejecutables que generan implementaciones directamente**.

### Resumen ejecutivo

| Aspecto | Software tradicional | Spec-Driven Development |
|---|---|---|
| Especificación | Documento Word/Confluence, desfasado en semanas | Archivo vivo en markdown, versionado en Git |
| Relación con código | Código diverge del spec constantemente | El spec es la fuente de verdad; el código lo implementa |
| Proceso | Spec → Code (manual, pierde consistencia) | Spec → Plan → Tasks → Code (automatizado, verificable) |
| Validación | QA manual contra acceptance criteria | Specs ejecutables con análisis de cobertura |
| AI Coding | "Vibe coding" — prompts sin estructura | Estructura determinista: constitution → specify → plan → tasks → implement |

### Flujo de 5 fases

```
/speckit.constitution → /speckit.specify → /speckit.clarify → /speckit.plan → /speckit.tasks → /speckit.analyze → /speckit.implement
```

1. **Constitución**: Define los principios, estándares y restricciones del proyecto
2. **Specify**: Describe QUÉ construir (requisitos, user stories)
3. **Clarify**: Detecta y resuelve ambigüedades en la especificación
4. **Plan**: Define CÓMO construir (tech stack, arquitectura)
5. **Tasks**: Genera lista de tareas ejecutables
6. **Analyze**: Valida consistencia cruzada entre specs, plan y tasks
7. **Implement**: Ejecuta las tareas para generar código

---

## 2. ¿Cómo se integra con nuestro flujo actual?

### Transformación: HU → Spec ejecutable

Actualmente我们的`PRODUCT_BACKLOG.md` tiene 70+ User Stories en formato clásico. Con SDD, cada HU se transforma en un **directorio de feature con specs versionados**:

```
# ANTES (actual):
PRODUCT_BACKLOG.md  →  Jira/Trello  →  Código manual

# DESPUÉS (con SDD):
autoflow-specs/
├── constitution.md              ← Tu reglas del juego
├── specs/
│   ├── 001-tenant-registration/  ← HU-001 convertida
│   │   ├── spec.md               ← Requisitos ejecutables
│   │   ├── plan.md               ← Plan técnico por microservicio
│   │   └── tasks/                ← Tareas generadas
│   ├── 002-jwt-auth/             ← HU-002
│   ├── 003-rate-limiting/        ← HU-003
│   └── ...
└── .spec-kit/                    ← Configuración del toolkit
```

### Mapeo HU → Feature

| Backlog actual | Spec-Kit Feature | Módulo |
|---|---|---|
| HU-001 a HU-019 | `001-api-gateway-fundamentals` | API Gateway |
| HU-020 a HU-035 | `002-pedidos-crud` | Pedidos |
| HU-036 a HU-048 | `003-crm-gestion` | CRM |
| HU-049 a HU-058 | `004-whatsapp-integration` | WhatsApp |
| HU-059 a HU-065 | `005-reportes-analytics` | Reportes |
| HU-066 a HU-071 | `006-configuracion-tenant` | Configuración |

### Conversión práctica

Para cada HU del backlog, el flujo de conversión es:

1. **Leer HU** del `PRODUCT_BACKLOG.md` (ya tiene acceptance criteria y spec técnica)
2. **Ejecutar** `/speckit.specify` con el contexto de la HU
3. **Ejecutar** `/speckit.clarify` para identificar ambigüedades
4. **Ejecutar** `/speckit.plan` con el stack real de AutoFlow
5. **Revisar** el plan generado y ajustar por las particularidades de microservicios
6. **Ejecutar** `/speckit.tasks` para generar el checklist de implementación
7. **Ejecutar** `/speckit.implement` para generar el código

---

## 3. Comandos Spec Kit relevantes

### Comandos principales

| Comando | Qué hace | Cuándo usarlo |
|---|---|---|
| `/speckit.constitution` | Crea las reglas fundamentales del proyecto | **Una vez al inicio** — y cuando cambien estándares |
| `/speckit.specify` | Define QUÉ construir (requisitos) | **Cada feature** — input: contexto de HU |
| `/speckit.clarify` | Detecta y resuelve ambigüedades | **Después de specify, antes de plan** — opcional pero recomendado |
| `/speckit.plan` | Define CÓMO construir (tech stack) | **Cada feature** — input: decisiones arquitectónicas |
| `/speckit.tasks` | Genera tareas ejecutables | **Cada feature** — después de plan |
| `/speckit.analyze` | Valida consistencia specs↔plan↔tasks | **Cada feature** — antes de implementar |
| `/speckit.implement` | Ejecuta tareas y genera código | **Cada feature** — revisar PR antes de mergear |

### Ejemplos de uso para AutoFlow

```
# 1. Inicializar el proyecto spec
cd autoflow-docs
specify init . --here --ai claude

# 2. Crear la constitución (una vez)
/speckit.constitution

# 3. Procesar HU-001: Registro de empresa
/speckit.specify
  "Como administrador de PYME, quiero registrar mi empresa con RUC, nombre,
   email y contraseña. El RUC debe ser ecuatoriano (13 dígitos), único en BD.
   Al registrar recibo JWT tokens. Password hasheado con BCrypt.
   Se envía email de verificación asíncrono via RabbitMQ."

/speckit.clarify  # Detecta: ¿qué formato de RUC? ¿doble opt-in? ¿ rate limit en registro?

/speckit.plan
  "Stack: Spring Boot 3 + Java 21, PostgreSQL para datos de tenant,
   RabbitMQ para eventos de email, Redis para tokens.
   Microservicio: API Gateway. Usa Spring Security 6 + JJWT.
   Sigue la arquitectura hexagonal."

/speckit.tasks

/speckit.analyze  # Verifica: ¿el spec cubre todos los acceptance criteria del HU?

/speckit.implement
```

---

## 4. Template de Constitución AutoFlow

La constitución se genera con `/speckit.constitution`. Este es el template base que debemos adaptar:

```markdown
# AutoFlow Constitution

## Principios Fundamentales

### 1. Arquitectura de Microservicios
- **Cada microservicio es desplegable independientamente** — Spring Boot 3 fat JARs
- **Comunicación asíncrona preferida** — RabbitMQ para eventos entre servicios
- **Comunicación síncrona solo cuando sea necesario** — Spring Cloud Gateway para routing
- **Bounded Contexts alineados con módulos de negocio** — Pedidos, CRM, WhatsApp, Reportes, Config
- **Cada microservicio tiene su propio esquema de BD** — PostgreSQL schemas o instancias separadas

### 2. Tecnologías (inviolable)
- **Backend:** Spring Boot 3.x + Java 21 LTS
- **Frontend Web:** Angular 17+ + PrimeNG
- **Frontend Móvil:** Android (Kotlin) + iOS (Swift/SwiftUI)
- **PostgreSQL** para datos transaccionales
- **MongoDB** para logs y datos no estructurados
- **RabbitMQ** para mensajería asíncrona
- **Redis** para caching, rate limiting y sesiones
- **Docker Compose** para desarrollo local

### 3. Coding Standards
- **Java:** Seguir Google Java Style Guide con ajustes del equipo
- **Lombok** permitido para boilerplate (getters, builders), prohibido en dominio crítico
- **Paquetes por feature** dentro de cada microservicio, no por capa
- **DTOs obligatorios** — nunca exponer entidades JPA en controllers
- **Validación con Bean Validation 3.0** — `@Valid` en todos los controllers
- **Manejo global de excepciones** — `@ControllerAdvice` por microservicio
- **API-first** — OpenAPI 3.0 specs antes de implementar endpoints
- **Variables en inglés**, comments en español cuando aporten contexto

### 4. Patrones de Diseño
- **Hexagonal Architecture (Ports & Adapters)** en cada microservicio
- **CQRS** para módulos complejos (Pedidos, Reportes)
- **Event Sourcing** solo donde justificado (auditoría de pedidos)
- **Repository Pattern** con Spring Data JPA/MongoDB
- **Factory Pattern** para builders complejos
- **Strategy Pattern** para lógica variable por plan de suscripción

### 5. Estándares de Testing
- **Cobertura mínima:** 80% en unit tests, 60% overall
- **Unit Tests:** JUnit 5 + Mockito — lógica de negocio y services
- **Integration Tests:** `@SpringBootTest` + Testcontainers (PostgreSQL, RabbitMQ, Redis)
- **API Tests:** MockMvc para controllers, contratos entre microservicios
- **Frontend:** Karma/Jasmine para unit, Cypress para E2E
- **Mobile:** JUnit + Espresso (Android), XCTest (iOS)
- **CI Gate:** Tests deben pasar antes de merge — no exceptions

### 6. Seguridad (inviolable)
- **BCrypt strength 12** para passwords — nunca otra opción
- **JWT con RS256** — private key en Vault, public key compartido
- **Tenancy por header/claim** — `tenantId` en JWT, no en path
- **CORS restringido** — solo dominios del cliente registrados
- **Rate limiting** obligatorio en todos los endpoints públicos
- **Sin secrets en código** — Vault o variables de entorno

### 7. Observabilidad
- **Logging estructurado** — Logback con JSON para ELK
- **Correlation ID** en todas las requests via Spring Cloud Sleuth
- **Health checks** — Spring Boot Actuator + custom por dependencia
- **Metrics** — Micrometer + Prometheus + Grafana

### 8. Condiciones de Aprobación
- Todo PR requiere: tests pasando + cobertura ≥ mínima + approval de 1 reviewer
- Specs actualizados si hay cambio de API o comportamiento
- Breaking changes en APIs requieren plan de migración documentado
```

---

## 5. Template de Spec por Feature

Para cada HU/módulo, el spec se genera con `/speckit.specify`. Este es el formato:

```markdown
# Feature: [Nombre del Feature]

> Módulo: [Gateway/Pedidos/CRM/WhatsApp/Reportes/Config]
> HU relacionada: [HU-XXX]
> Estado: Draft | Review | Approved | Implementing | Done
> Última actualización: [YYYY-MM-DD]

## 1. Contexto y Justificación

¿Por qué existe este feature? Qué problema resuelve para las PYMEs ecuatorianas.

## 2. User Stories

### US-1: [Título]
**Como** [rol],
**Quiero** [acción],
**Para** [beneficio].

#### Acceptance Criteria
- [ ] [Criterio medible y específico]
- [ ] [Criterio medible y específico]
- [ ] [Criterio medible y específico]

#### Escenarios (Gherkin)
```gherkin
Dado que un administrador está en la pantalla de registro
Cuando ingresa un RUC válido de 13 dígitos
Y completa todos los campos obligatorios
Entonces el sistema crea el tenant con estado PENDIENTE_VERIFICACION
Y envía un email de verificación
Y retorna JWT tokens
```

## 3. Definición de Done

- [ ] Código implementado siguiendo constitution
- [ ] Unit tests (≥80% coverage en lógica de negocio)
- [ ] Integration tests con Testcontainers
- [ ] API docs actualizados (OpenAPI 3.0)
- [ ] Frontend: componente renderiza correctamente
- [ ] Mobile: pantalla funcional en dispositivo
- [ ] Code review aprobado
- [ ] Desplegado en ambiente de staging

## 4. Dependencias y Bloqueos

| Depende de | Bloquea | Bloqueado por |
|---|---|---|
| HU-001 (Registro) | HU-002 (Auth) | Ninguna |

## 5. Notas Técnicas

Contexto técnico relevante que el equipo debe saber antes de implementar.
```

---

## 6. Flujo de trabajo propuesto

### Diagrama completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPRINT PLANNING (Scrum)                       │
│  Product Owner selecciona HUs del PRODUCT_BACKLOG.md            │
│  Equipo estima y asigna al sprint                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CREAR FEATURE DIRECTORIO                               │
│  Ejecutar: specify init feature-name (o usar estructura manual) │
│  Output: /autoflow-specs/001-feature-name/                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: ESPECIFICAR (Developer + AI Agent)                     │
│  Input: HU del PRODUCT_BACKLOG.md (copiar acceptance criteria)  │
│  Comando: /speckit.specify                                       │
│  Output: spec.md con requisitos detallados                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: CLARIFICAR (Developer)                                 │
│  Comando: /speckit.clarify                                       │
│  Output: Lista de preguntas/ambigüedades identificadas          │
│  Acción: Team lead responde → spec.md se actualiza              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: PLANIFICAR (Developer + AI Agent)                      │
│  Input: Especificación aprobada + Constitution AutoFlow         │
│  Comando: /speckit.plan                                          │
│  Output: plan.md con arquitectura, tech stack, módulos          │
│  ⚠️  Ajustar: microservicio destino, comunicación inter-servicio │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: GENERAR TAREAS (AI Agent)                              │
│  Comando: /speckit.tasks                                         │
│  Output: tasks/ con checklist de implementación                 │
│  Revisión: Tech lead valida estimación y dependencias           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: ANALIZAR CONSISTENCIA (AI Agent)                       │
│  Comando: /speckit.analyze                                       │
│  Output: Reporte de cobertura, gaps detectados                  │
│  Acción: Corregir spec o plan si hay huecos                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: IMPLEMENTAR (Developer + AI Agent)                     │
│  Comando: /speckit.implement                                     │
│  Output: Código generado según tasks                           │
│  ⚠️  REVISIÓN OBLIGATORIA: Code review antes de merge           │
│  ⚠️  Tests DEBEN pasar — CI gate no se puede saltar            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: PR + REVIEW + MERGE                                    │
│  PR Description: link al feature spec + plan + tasks            │
│  Checklist: tests ✅ | coverage ✅ | docs ✅ | review ✅        │
│  Merge a main/develop → deploy a staging                        │
└─────────────────────────────────────────────────────────────────┘
```

### Roles por paso

| Paso | Responsable | Con AI Agent | Tiempo estimado |
|---|---|---|---|
| 1. Crear feature dir | Developer | No | 5 min |
| 2. Specify | Developer + PO | Sí | 15-30 min |
| 3. Clarify | Tech Lead + PO | Sí (detecta), Humano (responde) | 30-60 min |
| 4. Plan | Tech Lead | Sí | 15-30 min |
| 5. Tasks | Tech Lead | Sí | 10-15 min |
| 6. Analyze | Tech Lead | Sí | 10 min |
| 7. Implement | Developer | Sí (genera), Humano (revisa) | Según complejidad |
| 8. PR + Review | Equipo | No | Según proceso |

### Para una HU típica de 5 SP

| Fase | Tiempo sin SDD | Tiempo con SDD | Ahorro |
|---|---|---|---|
| Especificación | 2-4h (docs manuales) | 30 min (spec + clarify) | ~80% |
| Plan técnico | 1-2h (diseñar) | 20 min (specify plan) | ~75% |
| Implementación | 8-16h | 6-12h (código generado + review) | ~30% |
| **Total** | **11-22h** | **6.5-12h** | **~40-50%** |

---

## 7. Integración con GitHub (repo autoflow-docs)

### Estructura del repositorio

```
autoflow-docs/                          # Repo dedicado a specs y docs
├── README.md                           # Cómo usar este repo
├── constitution.md                     # AutoFlow Constitution (generado por /speckit.constitution)
├── .spec-kit/                          # Configuración de spec-kit
│   ├── config.yaml
│   └── templates/
├── specs/
│   ├── 001-api-gateway-fundamentals/
│   │   ├── spec.md                     # Especificación de feature
│   │   ├── plan.md                     # Plan técnico
│   │   └── tasks/
│   │       ├── task-001.md
│   │       └── task-002.md
│   ├── 002-pedidos-crud/
│   ├── 003-crm-gestion/
│   ├── 004-whatsapp-integration/
│   ├── 005-reportes-analytics/
│   └── 006-configuracion-tenant/
├── decisions/
│   ├── ADR-001-technology-stack.md     # Architecture Decision Records
│   ├── ADR-002-messaging-strategy.md
│   └── ADR-003-database-per-service.md
├── api-contracts/
│   ├── gateway-openapi.yaml
│   ├── pedidos-openapi.yaml
│   └── ...
└── CHANGELOG.md                        # Auto-generated desde specs
```

### Flujo Git

```
# Developer toma una HU del sprint
git checkout -b feature/001-tenant-registration

# Proceso SDD
/speckit.specify  →  spec.md
/speckit.clarify  →  resuelve ambigüedades
/speckit.plan     →  plan.md
/speckit.tasks    →  tasks/
/speckit.analyze  →  reporte consistencia
/speckit.implement → código generado

# Commit convention
git add specs/001-tenant-registration/
git commit -m "spec(001): add tenant registration specification

- US: Registro de empresa con RUC ecuatoriano
- Plan: Spring Boot 3 + PostgreSQL + RabbitMQ
- Tasks: 12 tareas generadas"

# El código va al repo del microservicio
# Los specs van al repo autoflow-docs

git push origin feature/001-tenant-registration
gh pr create --title "spec: HU-001 Tenant Registration" \
             --body "Spec: specs/001-tenant-registration/spec.md"
```

### Integración con los repos de código

| Repo | Qué vive aquí | Link con specs |
|---|---|---|
| `autoflow-docs` | Specs, Constitution, ADRs, API contracts | Fuente de verdad |
| `autoflow-gateway` | Código API Gateway | `@see specs/001-api-gateway/` |
| `autoflow-pedidos` | Código microservicio Pedidos | `@see specs/002-pedidos/` |
| `autoflow-crm` | Código microservicio CRM | `@see specs/003-crm/` |
| `autoflow-whatsapp` | Código microservicio WhatsApp | `@see specs/004-whatsapp/` |
| `autoflow-reportes` | Código microservicio Reportes | `@see specs/005-reportes/` |
| `autoflow-config` | Código microservicio Config | `@see specs/006-config/` |
| `autoflow-web` | Angular frontend | `@see specs/` (cross-reference) |
| `autoflow-android` | App Android | `@see specs/` (cross-reference) |
| `autoflow-ios` | App iOS | `@see specs/` (cross-reference) |

---

## 8. Beneficios para el equipo

### vs el proceso actual

| Problema actual | Solución con SDD | Impacto |
|---|---|---|
| Specs se desfasan en días | Specs versionados en Git, actualizados por AI | Spec siempre sincronizado |
| Cada developer entiende diferente la HU | Spec ejecutable con acceptance criteria validables | Menos rework, menos bugs |
| Diferencia entre backend y frontend en qué construir | Spec como fuente de verdad compartida | Frontend y backend trabajan del mismo doc |
| Code review sin contexto | PRs linkan al spec + plan + tasks | Reviewer entiende por qué existe el código |
| Onboarding lento de nuevos miembros | Constitution + specs documentan decisiones arquitectónicas | Nuevo miembro lee constitution → entiende el sistema |
| "Vibe coding" sin estructura | Pipeline determinista: constitution → specify → plan → tasks → implement | Calidad consistente sin depender del mood |
| Decisiones arquitectónicas perdidas | ADRs en repo + constitution | Know-how preservado institucionalmente |

### Beneficios por rol

| Rol | Beneficio concreto |
|---|---|
| **Product Owner** | Specs legibles como historias de usuario; clarificar ambigüedades antes de dev |
| **Tech Lead** | Constitution como reglas del juego; plan generado automáticamente; consistencia |
| **Backend Dev** | Plan con tech stack definido; tasks con implementation details; código base generado |
| **Frontend Dev** | Misma especificación que backend; screens/flows definidos en spec |
| **Mobile Dev** | API contracts claros desde el spec; no adivinar endpoints |
| **QA** | Acceptance criteria en formato ejecutable; testing standards en constitution |
| **DevOps** | ADRs documentan infra decisions; observabilidad requirements en constitution |

### Métricas esperadas (primer sprint de adopción)

- **Tiempo de onboarding** nueva feature: ↓ 40-50% (spec ya define todo)
- **Rework post-review**: ↓ 60% (ambigüedades resueltas en clarify)
- **Cobertura de tests**: ↑ de ~60% a ≥80% (constitution lo exige)
- **Tiempo de code review**: ↓ 30% (contexto del spec disponible)
- **Bugs en staging**: ↓ 40-50% (specs validan comportamiento antes de código)

---

## 9. Guía de adopción (primer sprint)

### Semana 1: Setup

- [ ] **Día 1:** Instalar spec-kit: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`
- [ ] **Día 1:** Inicializar repo: `specify init . --here --ai claude` en `autoflow-docs`
- [ ] **Día 1:** Ejecutar `/speckit.constitution` con template de esta guía
- [ ] **Día 2:** Tomar 1-2 HUs del Sprint 1 (HU-001, HU-002) como piloto
- [ ] **Día 2:** Ejecutar flujo completo: specify → clarify → plan → tasks → analyze
- [ ] **Día 3-4:** Implementar con `/speckit.implement` y comparar con código existente
- [ ] **Día 5:** Retrospectiva — qué funcionó, qué ajustar en constitution

### Semana 2: Primer sprint completo

- [ ] Todas las HUs del sprint pasan por el flujo SDD
- [ ] Specs publicados en `autoflow-docs`
- [ ] PRs incluyen referencias a specs
- [ ] Constitution actualizada con learnings de semana 1

### Semana 3-4: Normalización

- [ ] Backlog de specs se llena con features previos
- [ ] Todos los equipos usan SDD como proceso estándar
- [ ] Metrics baseline establecidas para comparar

---

## 10. Referencias

| Recurso | URL |
|---|---|
| Spec Kit Repo | https://github.com/github/spec-kit |
| Spec Kit Docs | https://github.github.io/spec-kit/ |
| Video Overview | https://www.youtube.com/watch?v=a9eR1xsfvHg |
| Spring Boot Demo | https://github.com/mnriem/spec-kit-spring-react-demo |
| Brownfield Java Demo | https://github.com/mnriem/spec-kit-java-brownfield-demo |
| Product Backlog | `./PRODUCT_BACKLOG.md` |
| Roles y Equipo | `./ROLES_Y_EQUIPO.md` |
| Scrum Framework | `./SCRUM_FRAMEWORK.md` |

---

> **Nota:** Este documento es un living doc. Se actualiza conforme el equipo aprende y ajusta el proceso.
> Propietario: Tech Lead | Revisión: Quincenal en Sprint Review
