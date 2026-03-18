# Definition of Done (DoD) & Definition of Ready (DoR) — AutoFlow
**Versión:** 1.0  
**Fecha:** 2026-03-17  
**Autor:** Axel (Scrum Master, EGIT Consultoría)  
**Aplicable a:** Todos los sprints de AutoFlow

---

## 1. Definition of Done (DoD) — Checklist Detallado

Una Historia de Usuario o task se considera **"Done"** (terminada) únicamente cuando **todos** los siguientes criterios están cumplidos:

### Código y Revisión

| # | Criterio | Detalle |
|---|----------|---------|
| 1 | **Código escrito y funcional** | La feature implementa correctamente los criterios de aceptación de la HU. El código compila sin errores ni warnings críticos. |
| 2 | **Code Review aprobado** | Pull request revisado y aprobado por al menos **1 developer senior** del equipo. Sin comentarios bloqueantes pendientes. |
| 3 | **Estándares de código respetados** | El código sigue los estándares definidos en la sección 4 de este documento (naming, estructura, patrones). |
| 4 | **Sin code smells críticos** | SonarQube o linting reporta 0 bugs críticos y 0 vulnerabilidades. Code smells críticos resueltos. |

### Testing

| # | Criterio | Detalle |
|---|----------|---------|
| 5 | **Unit tests escritos** | Cobertura mínima del **80%** para clases de negocio (services, validators, utils). Métodos públicos con al menos 1 test. |
| 6 | **Unit tests pasando** | Todos los tests pasan en CI sin flaky tests. Coverage report generado y publicado. |
| 7 | **Integration tests** | Al menos 1 integration test por endpoint nuevo (testcontainers para PostgreSQL/MongoDB). Flujo happy path cubierto. |
| 8 | **Tests de regresión pasando** | Ningún test existente se rompe con el nuevo código. Suite completa verde en CI. |
| 9 | **Edge cases testeados** | Tests para casos límite: inputs vacíos, nulls, valores negativos, duplicados, límites de rate, timeouts. |

### API y Documentación

| # | Criterio | Detalle |
|---|----------|---------|
| 10 | **OpenAPI/Swagger actualizado** | Todos los endpoints nuevos o modificados documentados en el spec OpenAPI. Incluye request/response schemas, códigos de error y ejemplos. |
| 11 | **CHANGELOG actualizado** | El cambio se documenta en el CHANGELOG del servicio con: qué, por qué y link al PR/ticket. |

### Base de Datos e Infraestructura

| # | Criterio | Detalle |
|---|----------|---------|
| 12 | **Migraciones de BD ejecutadas** | Flyway/Liquibase migration pasada y testada en entorno local. Rollback script disponible si aplica. |
| 13 | **Migración reversible** | Las migraciones de esquema soportan rollback sin pérdida de datos. Migration reversibles o con script de rollback. |

### Deploy y Entorno

| # | Criterio | Detalle |
|---|----------|---------|
| 14 | **Deploy exitoso en staging** | El servicio se deploya correctamente en el entorno de staging sin errores de startup. Health check pasa. |
| 15 | **Health checks funcionando** | `/actuator/health` responde `UP` para todos los checks (DB, Redis, RabbitMQ, MongoDB, MinIO). |
| 16 | **Sin regressions visibles** | Funcionalidades existentes operan normalmente tras el deploy. Smoke tests manuales pasan. |

### Seguridad

| # | Criterio | Detalle |
|---|----------|---------|
| 17 | **Sin secrets en el código** | No hay API keys, passwords, tokens o credenciales hardcodeadas. Todo via variables de entorno o secrets manager. |
| 18 | **Inputs validados** | Todos los inputs del usuario son validados (tamaño, formato, tipo). Inyección SQL/HML/imposible. |
| 19 | **Autenticación y autorización** | Endpoints protegidos validan JWT y rol. Datos aislados por `tenant_id`. |

### Performance

| # | Criterio | Detalle |
|---|----------|---------|
| 20 | **Tiempos de respuesta aceptables** | GET single: <200ms (p95). GET list: <500ms (p95). POST/PUT: <1s (p95). Reportes: <3s. Dashboard: <2s. |
| 21 | **Sin N+1 queries** | Queries optimizadas. Uso de JOIN FETCH o batch queries para relaciones. Verificado con Hibernate statistics o logs SQL. |

### Logging y Observabilidad

| # | Criterio | Detalle |
|---|----------|---------|
| 22 | **Logs estructurados** | Uso de SLF4J con campos: `timestamp`, `level`, `service`, `traceId`, `spanId`, `userId`, `tenantId`, `message`. |
| 23 | **Métricas expuestas** | Métricas Prometheus expuestas para: requests count, latency histogram, error rate, business metrics relevantes. |
| 24 | **Manejo de errores centralizado** | `@ControllerAdvice` global. Errores retornan JSON consistente: `{code, message, traceId}`. Errores 500 loggeados con stack trace. |

### Tarea de Seguimiento

| # | Criterio | Detalle |
|---|----------|---------|
| 25 | **Ticket actualizado en tablero** | HU/task movida a columna "Done". Comentarios con link al PR y notas de implementación. |

---

## 2. Definition of Ready (DoR) — Checklist

Una Historia de Usuario debe cumplir **todos** los siguientes criterios antes de ser incluida en un Sprint Backlog:

| # | Criterio | Detalle |
|---|----------|---------|
| 1 | **Historia clara** | Formato correcto: "Como [actor], quiero [acción], para [beneficio]." El equipo entiende QUÉ se construye y POR QUÉ. |
| 2 | **Criterios de aceptación definidos** | Mínimo 4-5 criterios de aceptación específicos, medibles y sin ambigüedad. El PO los ha aprobado. |
| 3 | **Story Points estimados** | El equipo (backend + frontend) ha estimado la HU en consenso (Planning Poker). Si no hay consenso, se divide o se investiga más. |
| 4 | **Prioridad asignada** | El Product Owner ha definido la prioridad: 🔴 Alta, 🟡 Media o 🟢 Baja. |
| 5 | **Sin dependencias bloqueantes** | Todas las dependencias de servicios externos, APIs de terceros o otras HUs han sido resueltas o están en progreso. Si hay bloqueo, se documenta. |
| 6 | **Diseño UI/UX disponible** (si aplica) | Wireframes o mockups aprobados por el PO. Figma/figma link en la HU. Sin "diseñaré después". |
| 7 | **Reglas de negocio documentadas** | Las reglas de negocio, validaciones y edge cases están documentados. El desarrollador no necesita preguntar al PO durante el desarrollo. |
| 8 | **Tamaño adecuado** | La HU cabe en un solo sprint (máximo 13 SP). Si es mayor, se divide en HUs más pequeñas. |
| 9 | **Ambigüedades resueltas** | No hay preguntas abiertas sobre la HU. Si hay dudas, se resuelven ANTES del sprint planning, no durante el desarrollo. |
| 10 | **Dependencias técnicas verificadas** | APIs de terceros (Evolution API, Google Calendar, Firebase) están operativas. Entorno de desarrollo configurado con las integraciones. |
| 11 | **Componentes backend existentes** | Servicios dependientes ya desplegados en staging (ej: si una HU de CRM depende de auth-service, auth-service debe estar funcionando). |
| 12 | **Acceptance Criteria con datos de prueba** | Se definen datos de prueba o el PO indica dónde obtenerlos. No se empieza a desarrollar sin datos de prueba realistas. |

---

## 3. Estándares de Código para el Equipo

### Backend — Spring Boot (Java 17+)

#### Estructura del Proyecto
```
src/main/java/com/egit/autoflow/{service}/
├── controller/
│   └── {Resource}Controller.java        # REST endpoints (thin controllers)
├── service/
│   ├── {Resource}Service.java           # Business logic
│   └── {Resource}ServiceImpl.java       # Implementation
├── repository/
│   └── {Resource}Repository.java        # Spring Data JPA / MongoDB
├── model/
│   ├── entity/                          # JPA entities / MongoDB documents
│   ├── dto/                             # Request/Response DTOs
│   └── mapper/                          # Entity ↔ DTO mappers
├── config/                              # Spring configurations
├── exception/                           # Custom exceptions + @ControllerAdvice
└── util/                                # Utility classes
```

#### Naming Conventions
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Clases | PascalCase | `OrderService`, `ClientRepository` |
| Métodos | camelCase | `findById()`, `createOrder()` |
| Variables | camelCase | `clientId`, `totalAmount` |
| Constantes | SCREAMING_SNAKE | `MAX_RETRY_ATTEMPTS`, `DEFAULT_PAGE_SIZE` |
| Paquetes | lowercase | `com.egit.autoflow.orders` |
| Tablas BD | snake_case | `order_item`, `client_tag` |
| Columnas BD | snake_case | `created_at`, `is_active` |
| Endpoints REST | kebab-case | `/api/v1/order-items`, `/api/v1/sales-reports` |
| DTOs | suffixed | `CreateOrderRequest`, `OrderResponse` |
| Tests | suffixed | `OrderServiceTest`, `OrderControllerIntegrationTest` |

#### Patrones y Convenciones
- **DTOs obligatorios:** Nunca exponer entidades JPA directamente en los endpoints. Siempre mapear a DTOs.
- **Immutabilidad:** DTOs de request son `record` (Java 16+). DTOs de response usan `record` o Lombok `@Value`.
- **Validación:** Usar Jakarta Validation (`@NotNull`, `@Size`, `@Valid`, `@Pattern`) en request DTOs.
- **Servicios:** Interfaces + Implementaciones. Métodos públicos documentados con Javadoc.
- **Repositorios:** Extender `JpaRepository` o `MongoRepository`. Queries complejas en `@Query` o `@NamedQuery`.
- **Eventos:** Usar `@TransactionalEventListener` para procesar eventos post-commit.
- **Sin System.out.println:** Todo logging vía SLF4J `Logger`.

#### Ejemplo de Endpoint
```java
@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse createClient(
            @Valid @RequestBody CreateClientRequest request,
            @AuthenticationPrincipal JwtAuthToken token) {
        return clientService.createClient(request, token.getTenantId());
    }

    @GetMapping
    public Page<ClientResponse> searchClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @AuthenticationPrincipal JwtAuthToken token) {
        return clientService.searchClients(page, size, query, token.getTenantId());
    }
}
```

### Frontend (React + TypeScript)

#### Estructura del Proyecto
```
src/
├── components/           # Componentes reutilizables
│   └── {Component}/
│       ├── index.tsx
│       ├── {Component}.tsx
│       ├── {Component}.styles.ts
│       └── {Component}.test.tsx
├── features/             # Features por dominio
│   ├── auth/
│   ├── crm/
│   ├── orders/
│   └── ...
├── hooks/                # Custom hooks
├── services/             # API clients (axios/fetch)
├── store/                # Estado global (Zustand/Redux)
├── types/                # TypeScript interfaces/types
└── utils/                # Utilidades
```

#### Naming Conventions (Frontend)
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes | PascalCase | `ClientCard`, `OrderForm` |
| Hooks | camelCase con `use` | `useClientSearch`, `useOrderStatus` |
| Servicios API | camelCase | `clientService.create()`, `orderService.getAll()` |
| Tipos/Interfaces | PascalCase | `IClient`, `IOrderResponse` |
| Archivos | kebab-case | `client-card.tsx`, `order-form.tsx` |
| Variables CSS | camelCase | `primaryColor`, `borderRadius` |

### Base de Datos

#### Convenciones SQL
- **Migrations:** Flyway con prefijo `V{n}__{description}.sql`. Ejemplo: `V3__create_order_tables.sql`
- **Índices:** Nombrar como `idx_{table}_{columns}`. Ejemplo: `idx_client_tenant_phone`
- **FK constraints:** Nombrar como `fk_{table}_{referenced_table}`. Ejemplo: `fk_order_client`
- **UNIQUE constraints:** Nombrar como `uk_{table}_{columns}`. Ejemplo: `uk_tenant_email`
- **Soft deletes:** Campo `active BOOLEAN DEFAULT true` o `deleted_at TIMESTAMP`. Nunca `DELETE` directo en tablas de negocio.
- **Timestamps obligatorios:** Toda tabla de negocio tiene `created_at` y `updated_at`. `updated_at` se actualiza vía trigger o `@PreUpdate`.

#### Convenciones MongoDB
- **Collection names:** plural, lowercase. Ejemplo: `messages`, `conversations`, `templates`
- **Document IDs:** usar `_id` como ObjectId. Si se necesita UUID, almacenar en campo `id` y usar `_id` también.
- **TTL indexes:** para documentos temporales (tokens, locks). Ejemplo: `messages` con TTL de 1 año.

---

## 4. Proceso de Code Review

### Flujo de Code Review

```
Developer → Branch feature → PR → CI (build + test) → Reviewer → Approve → Merge
```

### Requisitos del Pull Request

| Requisito | Detalle |
|-----------|---------|
| **Título descriptivo** | Formato: `[HU-001] Descripción corta del cambio`. Ej: `[HU-016] POST /orders endpoint con cálculo de impuestos` |
| **Descripción** | Qué se hizo, por qué, cómo. Screenshots si hay UI. Link a la HU. |
| **Tamaño máximo** | Máximo **400 líneas** cambiadas (excluyendo tests). Si es mayor, dividir en PRs más pequeños. |
| **CI verde** | Todos los checks de CI deben pasar antes de solicitar review. Sin builds rojos. |
| **Tests incluidos** | PR incluye los tests de las funcionalidades nuevas. No se mergea código sin tests. |
| **Docs actualizadas** | Si hay cambios de API, OpenAPI está actualizado. Si hay cambios de arquitectura, docs actualizadas. |

### Checklist del Revisor

El revisor debe verificar:

| # | Checklist |
|---|-----------|
| 1 | **Correctitud:** El código implementa correctamente los criterios de aceptación de la HU. |
| 2 | **Legibilidad:** Otro developer puede entender el código sin explicación. Nombres claros, lógica simple. |
| 3 | **Sin duplicación:** No hay código duplicado que debería extraerse a un método/función compartida. |
| 4 | **Manejo de errores:** Los errores se manejan adecuadamente (try-catch donde aplica, respuestas de error consistentes). |
| 5 | **Seguridad:** No hay inyecciones, no hay secrets hardcodeados, inputs validados, autorización verificada. |
| 6 | **Performance:** Sin queries N+1, sin loops innecesarios, cache usado donde aplica. |
| 7 | **Tests:** Los tests cubren el happy path y los casos borde relevantes. |
| 8 | **Multitenancy:** El código respeta el aislamiento por `tenant_id`. |
| 9 | **Logging:** Logs relevantes agregados (no excesivos, no insuficientes). |
| 10 | **Consistencia:** Sigue los patrones y convenciones existentes del proyecto. |

### Tiempos de Review
- **SLA de review:** máximo **4 horas** hábiles desde que se solicita review.
- **Segunda ronda:** máximo **2 horas** tras aplicar cambios del primer review.
- **Si el revisor no responde:** escalar al Scrum Master tras 4 horas.
- **Reviews pair programming:** para HUs de 8+ SP, considerar pair programming en lugar de review tradicional.

### Comentarios en PR

| Tipo | Cuándo usar | Ejemplo |
|------|-------------|---------|
| **Blocker** | Bug, error de lógica, riesgo de seguridad | `"❌ Este endpoint no valida tenant_id, podría leer datos de otro tenant"` |
| **Suggestion** | Mejora de código, optimización, refactor | `"💡 Podrías usar `Optional.orElseThrow()` aquí en vez del if-null"` |
| **Nitpick** | Estilo, naming, formato (no bloquea) | `"nit: podría ser `orderItems` en vez de `items`"` |
| **Question** | Duda genuina, necesidad de aclaración | `"¿Por qué se usa Redis aquí y no el cache de Hibernate?"` |

---

## 5. Criterios de Testing

### Unit Tests (Jupiter / JUnit 5 + Mockito)

#### Objetivo
Validar la lógica de negocio a nivel de método, aislando dependencias con mocks.

#### Cobertura Mínima
- **Services:** 80% de cobertura de líneas
- **Utils/Validators:** 90% de cobertura
- **Controllers:** 50% (los tests de integración cubren los controllers)

#### Qué Testear
| Tipo | Ejemplo |
|------|---------|
| Happy path | Crear un pedido válido → retorna OrderResponse con total calculado |
| Validación de entrada | Email inválido → retorna 400 con mensaje de error claro |
| Reglas de negocio | Intentar mover pedido de `DRAFT` a `DELIVERED` → retorna 400 (transición inválida) |
| Edge cases | Crear pedido con cantidad 0 → retorna 400. Null fields → retorna 400 |
| Excepciones | Cliente no encontrado → retorna 404. Duplicado → retorna 409 |

#### Estructura de un Test
```java
@Test
@DisplayName("Debería calcular total con IVA 15% cuando el pedido tiene items")
void createOrder_shouldCalculateTotalWithIVATax() {
    // Given
    CreateOrderRequest request = CreateOrderRequestMother.validOrder()
        .withItems(List.of(itemWithPrice(100.00, 2)))
        .build();
    when(clientRepository.existsByIdAndTenantId(any(), any())).thenReturn(true);
    when(productRepository.findByIdAndTenantId(any(), any()))
        .thenReturn(Optional.of(productWithPrice(100.00)));

    // When
    OrderResponse result = orderService.createOrder(request, TENANT_ID, USER_ID);

    // Then
    assertThat(result.subtotal()).isEqualTo(200.00);
    assertThat(result.taxAmount()).isEqualTo(30.00);  // 15% IVA
    assertThat(result.total()).isEqualTo(230.00);
    verify(orderRepository).save(any(Order.class));
}
```

### Integration Tests (Testcontainers)

#### Objetivo
Validar la interacción entre componentes: controller → service → repository → base de datos.

#### Qué Testear
| Tipo | Ejemplo |
|------|---------|
| Endpoints CRUD | `POST /api/v1/clients` → verificar que el cliente se crea en la BD |
| Filtros y paginación | `GET /api/v1/clients?query=Juan&page=0&size=10` → verificar resultados |
| Transacciones | Crear pedido → verificar que order + items + status_history se crean atómicamente |
| Autenticación | Request sin token → 401. Token expirado → 401. Token con rol insuficiente → 403 |
| Multi-tenancy | Cliente de tenant A → no visible desde tenant B |

#### Configuración
- Usar **Testcontainers** con PostgreSQL y MongoDB en contenedores Docker.
- Redis y RabbitMQ mockeados con embedded containers o mocks.
- MinIO mockeado o usado con contenedor de test.
- Cada test clase usa `@SpringBootTest` + `@Testcontainers` + `@DirtiesContext`.

### End-to-End Tests (E2E)

#### Objetivo
Validar flujos completos de negocio desde la API, como lo haría un usuario real.

#### Flujo Críticos a Testear (MVP)

| # | Flujo | Servicios involucrados |
|---|-------|----------------------|
| 1 | Registro empresa → Login → Crear empleado → Login empleado | auth-service |
| 2 | Crear cliente → Buscar cliente → Ver historial | crm-service |
| 3 | Crear producto → Crear pedido → Confirmar → Cambiar estado a DELIVERED | orders-service + crm-service |
| 4 | Recibir mensaje WhatsApp → Crear cliente → Responder → Ver historial | whatsapp-service + crm-service |
| 5 | Configurar horarios → Ver disponibilidad → Reservar cita → Cancelar | appointment-service |
| 6 | Configurar FCM → Registrar token → Crear pedido → Verificar push notification | notifications-service + orders-service |
| 7 | Crear pedido → Generar factura PDF → Enviar por WhatsApp | orders-service + whatsapp-service |

#### Framework
- **Postman/Newman** para tests de API automatizados en CI.
- Scripts de Newman en `tests/e2e/` ejecutados como paso de CI post-deploy a staging.
- Test data setup vía API (no directo a BD) para simular uso real.

### Ejecución de Tests en CI/CD

```
Push/PR → Build → Unit Tests → Integration Tests → E2E (staging) → Deploy
         ↑                              ↑
    Cobertura ≥ 80%             Testcontainers (Docker)
```

| Stage | Timeout | Resultado |
|-------|---------|-----------|
| Unit Tests | 5 min | Blockera PR si falla |
| Integration Tests | 10 min | Blockera PR si falla |
| E2E Tests | 15 min | Bloquea merge a main si falla |
| Cobertura Report | 2 min | Warning si <80%, no bloquea |

---

## Checklist Rápido de Referencia

### ¿Esta HU está "Done"? ✓

- [ ] Código compila sin errores
- [ ] Code Review aprobado (1+ revisor)
- [ ] Unit tests con ≥80% cobertura
- [ ] Integration tests pasando
- [ ] Edge cases testeados
- [ ] OpenAPI/Swagger actualizado
- [ ] Migración de BD ejecutada
- [ ] Deploy en staging exitoso
- [ ] Health checks pasando
- [ ] Sin secrets hardcodeados
- [ ] Inputs validados
- [ ] Multitenancy respetado
- [ ] Logs estructurados
- [ ] Métricas expuestas
- [ ] Errores manejados centralmente
- [ ] Performance dentro de SLA
- [ ] Ticket actualizado en tablero

### ¿Esta HU está "Ready"? ✓

- [ ] Historia clara (formato correcto)
- [ ] Criterios de aceptación (≥4)
- [ ] Story Points estimados
- [ ] Prioridad asignada
- [ ] Sin dependencias bloqueantes
- [ ] Diseño UI/UX disponible (si aplica)
- [ ] Reglas de negocio documentadas
- [ ] Tamaño ≤13 SP
- [ ] Sin ambigüedades
- [ ] APIs externas verificadas
- [ ] Servicios dependientes operativos
- [ ] Datos de prueba definidos

---

*Documento generado por Axel (Scrum Master, AutoFlow — EGIT Consultoría)*  
*Fecha: 2026-03-17*
