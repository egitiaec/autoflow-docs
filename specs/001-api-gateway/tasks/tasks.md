# Tasks: API Gateway

> Feature: 001-api-gateway
> Estimación total: 26 SP ≈ 40-50 horas
> Referencia: spec.md sección indicada en cada tarea

---

## T1: Setup proyecto Spring Cloud Gateway (2h)
**Ref spec:** Plan §2 (Estructura de paquetes)

- [ ] Inicializar Spring Boot 2.1.x con Spring Cloud Gateway
- [ ] Configurar build.gradle con dependencias (Plan §8)
- [ ] Crear estructura de paquetes: config/, auth/, user/, common/, ratelimit/
- [ ] Configurar application.yml con profiles dev/prod
- [ ] GET /api/health responde 200

## T2: Migraciones Flyway + Entidades JPA (4h)
**Ref spec:** Sección 6 (Modelo de Datos), Plan §6

- [ ] V1__create_tenants_table.sql (ruc unique, estado CHECK, plan DEFAULT BASIC)
- [ ] V2__create_users_table.sql (FK tenants, UNIQUE tenant_id+email)
- [ ] V3__create_roles_tables.sql (roles + user_roles join table)
- [ ] V4__create_tenant_branding.sql (colores DEFAULT, slug unique)
- [ ] Índices: idx_users_tenant, idx_roles_tenant, idx_tenants_ruc, idx_tenants_email
- [ ] Entidades JPA: Tenant, User, Role, UserRole, TenantBranding
- [ ] Verificar flywayMigrate ejecuta limpio

## T3: Servicio JWT RS256 (5h)
**Ref spec:** US-2 (AC §1-5), Plan §4

- [ ] JwtService: generateAccessToken (15min TTL, claims: tenantId, userId, roles, plan)
- [ ] JwtService: generateRefreshToken (7d TTL)
- [ ] Key pair RS256: generar al arranque si no existe, almacenar en keystore
- [ ] validateAccessToken(token) → Claims
- [ ] validateRefreshToken(token) → Claims
- [ ] JwtAuthFilter (reactive filter para Spring Cloud Gateway)
- [ ] Unit tests: generación, validación, expiración, token malformado

## T4: Registro de empresa (US-1) (6h)
**Ref spec:** US-1 (AC), Sección 7 (Casos de borde)

- [ ] RucValidator.java: algoritmo módulo 11 + anotación @ValidRuc
- [ ] RegisterRequest DTO: @NotBlank, @Size(13,13), @ValidRuc, @Email
- [ ] AuthService.register():
  - Verificar unicidad RUC → 409
  - Verificar unicidad email → 409
  - BCrypt hash (strength 12)
  - Transacción: crear Tenant + User admin
  - Publicar mail.verify en RabbitMQ
  - Generar JWT tokens, retornar AuthResponse
- [ ] AuthController.register() → POST /api/auth/register
- [ ] Unit tests: éxito, RUC duplicado, email duplicado, password débil
- [ ] Integration test con Testcontainers

## T5: Login con JWT (US-2) (4h)
**Ref spec:** US-2 (AC), Sección 7

- [ ] LoginRequest DTO: email + password
- [ ] AuthService.login():
  - Buscar user por email + tenant
  - Verificar BCrypt password
  - Verificar cuenta activa
  - Generar tokens, guardar refresh en Redis
  - Retornar AuthResponse con user + tenant + branding
- [ ] AuthController.login() → POST /api/auth/login
- [ ] Error genérico (no revelar si email o password incorrecto)
- [ ] Unit tests: éxito, credenciales inválidas, cuenta suspendida

## T6: Refresh token (US-2) (3h)
**Ref spec:** US-2 (AC §2, §5)

- [ ] TokenRefreshRequest DTO
- [ ] AuthService.refresh():
  - Validar refresh token (expiry, signature, Redis existence)
  - Verificar usuario activo
  - Invalidar viejo + generar nuevos tokens
  - Guardar nuevo refresh en Redis
- [ ] AuthController.refresh() → POST /api/auth/refresh
- [ ] AuthController.logout() → POST /api/auth/logout (elimina de Redis)
- [ ] Unit tests: éxito, expirado, no existe en Redis

## T7: Rate limiting por plan (US-3) (5h)
**Ref spec:** US-3 (AC), Plan §5

- [ ] RateLimitFilter.java (reactive, Redis + Lua sliding window)
- [ ] Límites por plan: BASIC=60, PRO=300, ENTERPRISE=1000/min
- [ ] Auth endpoints: 10/min por IP
- [ ] Headers: X-RateLimit-Remaining, X-RateLimit-Limit, X-RateLimit-Reset
- [ ] 429 con retryAfter
- [ ] Fallback Caffeine si Redis cae
- [ ] Unit tests: dentro límite, excedido, ventana deslizante

## T8: Routing dinámico (US-4) (3h)
**Ref spec:** US-4 (AC), Plan §7

- [ ] RouteLocator con predicates por path (5 microservicios)
- [ ] Propagar headers: X-Tenant-Id, X-User-Id, Authorization
- [ ] Timeout 30s
- [ ] Resilience4j Circuit Breaker (50% en 10s)
- [ ] Fallback: 503 con nombre del servicio caído
- [ ] GET /api/health/dependencies

## T9: Roles y permisos (US-5) (5h)
**Ref spec:** US-5 (AC)

- [ ] RoleService CRUD (solo admin del tenant)
- [ ] @RequiresPermission annotation + AOP aspect
- [ ] Seed data: rol admin (todos permisos), rol viewer (solo :read)
- [ ] RoleController: endpoints CRUD
- [ ] PUT /api/users/{id}/roles (asignar roles)
- [ ] No eliminar último admin
- [ ] Unit tests: crear, asignar, eliminar último admin (fail), verificar permisos

## T10: /me endpoint (1h)
**Ref spec:** US-2, Sección 6 (Flujo visual)

- [ ] GET /api/auth/me: extraer usuario de JWT, retornar UserDTO + roles + TenantDTO + branding
- [ ] Unit test: token válido, token expirado 401

## T11: Global error handler (2h)
**Ref spec:** Sección 5 (Error Response), Sección 7

- [ ] @ControllerAdvice: AuthException→401, ValidationException→400, DuplicateKey→409, RateLimit→429
- [ ] Formato: { error, message, details[], timestamp, path }

## T12: CORS + Security headers (2h)
**Ref spec:** Sección 4 (NFR)

- [ ] CorsConfig: whitelist dominios por perfil
- [ ] Headers: X-Content-Type-Options, X-Frame-Options, HSTS, CSP
- [ ] Tests: preflight OPTIONS, whitelisted, blocked

## T13: RabbitMQ - email verification (2h)
**Ref spec:** US-1 (AC §3)

- [ ] RabbitConfig: cola mail.verify durable
- [ ] Publicar MailVerifyEvent tras registro
- [ ] Unit test: evento publicado con JSON serialization

## T14: Cross-tenant integration tests (3h)
**Ref spec:** Sección 7 (data isolation)

- [ ] Tenant A no ve roles de Tenant B
- [ ] Refresh token de A no funciona en B
- [ ] Rate limit separado por tenant
- [ ] Token de A en ruta de B → 403
- [ ] Testcontainers: PostgreSQL + Redis

## T15: Seed data dev (2h)
**Ref spec:** Plan §6

- [ ] V5__seed_default_roles.sql
- [ ] Seed tenant demo: Mi Tienda, admin@demo.com
- [ ] 3-4 tenants con diferentes planes
- [ ] Script reset: drop + recreate + seed

---

## DoD por tarea
- [ ] Compila sin warnings
- [ ] Unit tests ≥80% service layer
- [ ] Integration tests
- [ ] OpenAPI docs
- [ ] Validación Bean Validation
- [ ] Error responses estandarizados
- [ ] Multi-tenancy validado
- [ ] Sin secrets en código
