# Plan: Pedidos — CRUD, Estados e Inventario

> Feature: 002-pedidos
> Basado en: constitution.md + spec.md
> Stack: Spring Boot 2.1.x / Java 17 / PostgreSQL / RabbitMQ / Redis

## 1. Tech Stack

| Componente | Tecnología | Razón |
|---|---|---|
| Framework | Spring Boot 2.1.x (MVC, Tomcat) | Microservicio HTTP tradicional |
| DB Access | Spring Data JPA + Flyway | Migraciones, repositories |
| Messaging | Spring AMQP (RabbitMQ) | Eventos para WhatsApp/CRM/N8N |
| Cache | Spring Data Redis | Cache detalle pedido (30s TTL) |

## 2. Estructura de Paquetes

```
autoflow-pedidos/
├── config/         RabbitConfig.java, CacheConfig.java
├── pedido/
│   ├── controller/ PedidoController.java, InventarioController.java
│   ├── dto/        CrearPedidoRequest, PedidoDTO, PedidoDetalleDTO, EstadisticasDTO
│   ├── service/    PedidoService, InventarioService, EstadoPedidoValidator
│   ├── model/      Pedido, PedidoItem, PedidoHistorial, Producto
│   ├── repository/ PedidoRepository (Specification), ProductoRepository
│   └── event/      PedidoEventPublisher, PedidoCreadoEvent, PedidoEstadoChangedEvent
├── common/exception/ GlobalExceptionHandler, StockInsuficienteException, TransicionInvalidaException
└── security/       TenantContextFilter, TenantInterceptor
```

## 3. Máquina de Estados

```
PENDIENTE ──▶ CONFIRMADO ──▶ EN_PREPARACION ──▶ ENTREGADO (terminal)
     │              │               │
     └──▶ CANCELADO (terminal) ◀───┘
     └──────────────┘
```

Transiciones válidas codificadas en `EstadoPedidoValidator.java` con Map<Estado, Set<Estado>>.

## 4. Eventos RabbitMQ

Cola `pedidos.events` (fanout exchange: `pedidos.exchange`):

```json
// pedido.creado
{ "eventType": "pedido.creado", "tenantId": "uuid", "pedidoId": "uuid", "clienteId": "uuid", "canal": "WHATSAPP", "total": 39.00 }

// pedido.estado.changed
{ "eventType": "pedido.estado.changed", "tenantId": "uuid", "pedidoId": "uuid", "estadoAnterior": "PENDIENTE", "estadoNuevo": "CONFIRMADO", "motivo": "Pago confirmado" }
```

Consumidores: WhatsApp Service (envía mensaje al cliente), CRM Service (actualiza timeline), N8N (webhooks).

## 5. Optimistic Locking en Inventario

```java
@Transactional
public Producto descontarStock(UUID productoId, int cantidad) {
    for (int i = 0; i < 3; i++) {
        Producto p = repository.findById(productoId).orElseThrow();
        if (p.getStockActual() < cantidad) throw new StockInsuficienteException();
        p.setStockActual(p.getStockActual() - cantidad);
        try { return repository.save(p); }
        catch (OptimisticLockingFailureException e) { if (i == 2) throw e; }
    }
}
```

Safety net: `CHECK (stock_actual >= 0)` en DB.

## 6. Query de Listado (JPA Specification)

Filtros dinámicos: estado, canal, cliente_id, desde, hasta, search. Paginación default 20, max 100. Orden: created_at DESC. Filtrado automático por tenant_id del contexto.

## 7. Estadísticas Dashboard

```sql
SELECT COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as pedidos_hoy,
       SUM(total) FILTER (WHERE created_at >= CURRENT_DATE) as ventas_hoy,
       AVG(total) as ticket_promedio
FROM pedidos WHERE tenant_id = :tenantId AND estado != 'CANCELADO';
```

Cache Redis: `estadisticas:{tenantId}` TTL 60s.

## 8. Dependencias de Build

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-amqp'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.postgresql:postgresql'
    testImplementation 'org.testcontainers:postgresql'
    testImplementation 'org.testcontainers:rabbitmq'
}
```
