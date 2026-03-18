# Plan: API Gateway

> Feature: 001-api-gateway
> Basado en: constitution.md + spec.md
> Stack: Spring Boot 2.1.x / Java 17

## 1. Tech Stack

| Componente | Tecnología | Razón |
|---|---|---|
| Framework | Spring Cloud Gateway (reactive) | Requiere Netty, reactive por naturaleza |
| Auth | Spring Security 5.1 + JJWT 0.11.x | RS256 support, refresh token flow |
| Rate Limiting | Redis + Lua script (sliding window) | Atomicidad, precisión |
| DB Access | Spring Data JPA + Flyway | Migraciones versionadas |
| Validation | Bean Validation 2.0 (Hibernate Validator) | Integración nativa con Spring |

## 2. Estructura de Paquetes

```
autoflow-gateway/
├── src/main/java/com/autoflow/gateway/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── CorsConfig.java
│   │   ├── RateLimitConfig.java
│   │   └── RouteConfig.java
│   ├── auth/
│   │   ├── controller/AuthController.java
│   │   ├── dto/RegisterRequest.java, LoginRequest.java, AuthResponse.java
│   │   ├── service/AuthService.java, JwtService.java
│   │   └── filter/JwtAuthFilter.java
│   ├── user/
│   │   ├── controller/RoleController.java
│   │   ├── service/RoleService.java
│   │   └── model/Tenant.java, User.java, Role.java
│   ├── common/exception/GlobalExceptionHandler.java
│   └── ratelimit/RateLimitFilter.java
├── src/main/resources/
│   ├── application.yml, application-dev.yml
│   └── db/migration/
│       ├── V1__create_tenants_table.sql
│       ├── V2__create_users_table.sql
│       ├── V3__create_roles_tables.sql
│       └── V4__create_tenant_branding.sql
└── build.gradle
```

## 3. Flujo de Autenticación

```
Client (Angular) ──POST /api/auth/login──▶ API Gateway
                                                │
                                          JwtService.generateAccessToken() (RS256, 15min)
                                          JwtService.generateRefreshToken() (RS256, 7d)
                                          Redis.set("refresh:{id}", token, TTL 7d)
                                                │
◀── { accessToken, refreshToken, user, tenant, branding } ──┘
```

## 4. JWT RS256

```java
public String generateAccessToken(User user) {
    return Jwts.builder()
        .setSubject(user.getId().toString())
        .claim("tenantId", user.getTenantId().toString())
        .claim("roles", user.getRoles().stream().map(Role::getName).collect(toList()))
        .claim("plan", user.getTenant().getPlan().name())
        .setIssuedAt(now())
        .setExpiration(now().plusMinutes(15))
        .signWith(privateKey, RS256)
        .compact();
}
```

## 5. Rate Limiting (Sliding Window Lua)

```lua
-- sliding_window.lua
local key = KEYS[1]; local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2]); local now = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)
if count < limit then
    redis.call('ZADD', key, now, now .. math.random())
    redis.call('EXPIRE', key, window); return 1
end; return 0
```

Límites: BASIC=60/min, PRO=300/min, ENTERPRISE=1000/min, Auth=10/min por IP

## 6. Validación RUC Ecuatoriano

Algoritmo módulo 11: posiciones 1-2=código provincia, 3-6=establecimiento, 13=dígito verificador.
Custom Bean Validation: `@ValidRuc` en RegisterRequest.ruc.

## 7. Rutas del Gateway

| Path | Destination | Port |
|---|---|---|
| /api/pedidos/** | pedidos-service | 8081 |
| /api/crm/** | crm-service | 8082 |
| /api/whatsapp/** | whatsapp-service | 8083 |
| /api/reportes/** | reportes-service | 8084 |
| /api/config/** | config-service | 8085 |

Headers propagados: X-Tenant-Id, X-User-Id, Authorization. Timeout: 30s. Circuit breaker: 50% fallos en 10s.

## 8. Dependencias de Build

```groovy
dependencies {
    implementation 'org.springframework.cloud:spring-cloud-starter-gateway'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis-reactive'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-impl:0.11.5'
    implementation 'io.jsonwebtoken:jjwt-jackson:0.11.5'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.postgresql:postgresql'
    testImplementation 'org.testcontainers:postgresql'
}
```

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Spring Cloud Gateway reactive + JPA blocking | Auth endpoints con WebFlux, JPA solo en service layer |
| JWT private key compromise | Vault/env var, rotación programada |
| Redis downtime → rate limit cae | Fallback in-memory con Caffeine |
