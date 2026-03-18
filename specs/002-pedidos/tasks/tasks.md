# Tasks: Pedidos — CRUD, Estados e Inventario

> Feature: 002-pedidos
> Estimación total: 22 SP ≈ 30-40 horas

---

## T1: Setup + Migraciones Flyway (3h)
**Ref spec:** Sección 6 (Modelo de Datos), Plan §2

- [ ] Inicializar Spring Boot 2.1.x (MVC, Tomcat)
- [ ] V1__create_pedidos_table.sql (CHECK estado/canal)
- [ ] V2__create_pedido_items_table.sql (subtotal GENERATED ALWAYS AS)
- [ ] V3__create_pedido_historial_table.sql
- [ ] V4__create_productos_table.sql (version column, UNIQUE tenant_id+sku)
- [ ] Índices en tenant_id, estado, created_at, cliente_id
- [ ] Entidades JPA: Pedido, PedidoItem, PedidoHistorial, Producto

## T2: TenantContextFilter (2h)
**Ref spec:** Sección 4 (NFR), Plan §2

- [ ] TenantContext.java (ThreadLocal tenantId + userId)
- [ ] TenantContextFilter.java (extract headers)
- [ ] TenantInterceptor.java (valida tenant del path = tenant del header)
- [ ] SecurityConfig: endpoints públicos vs protegidos

## T3: Crear pedido (US-1) (5h)
**Ref spec:** US-1 (AC), Sección 7 (Casos de borde)

- [ ] CrearPedidoRequest, PedidoItemRequest DTOs con validaciones
- [ ] PedidoService.crearPedido():
  - Validar cliente pertenece al tenant
  - Por item: producto activo + stock check si gestiona_stock
  - Calcular subtotales y total
  - Transacción: Pedido + Items + Historial (PENDIENTE)
  - Publicar pedido.creado en RabbitMQ
- [ ] PedidoController → POST /api/pedidos
- [ ] Casos borde: items vacíos→400, stock insuficiente→422, producto inactivo→422
- [ ] Unit + Integration tests (Testcontainers PG+RabbitMQ)

## T4: Listar y filtrar pedidos (US-2) (4h)
**Ref spec:** US-2 (AC), Plan §6

- [ ] PedidoSpecification.java (filtros dinámicos con Predicate)
- [ ] PedidoService.listarPedidos(filtros, pageable):
  - Filtros: estado, canal, clienteId, desde, hasta, search
  - Paginación default 20, max 100
  - Solo tenant del contexto
- [ ] PedidoSummaryDTO (ligero, sin items ni historial)
- [ ] Unit tests: filtros individuales, combinados, paginación

## T5: Cambiar estado (US-3) (4h)
**Ref spec:** US-3 (AC), Plan §3 (máquina de estados)

- [ ] EstadoPedidoValidator.java (Map transiciones válidas)
- [ ] CambiarEstadoRequest DTO (nuevoEstado, motivo)
- [ ] PedidoService.cambiarEstado():
  - Validar pertenece al tenant
  - Validar transición
  - Crear PedidoHistorial
  - Si ENTREGADO: descontar stock (InventarioService)
  - Si CANCELADO + estado anterior era EN_PREPARACION/CONFIRMADO: devolver stock
  - Publicar pedido.estado.changed en RabbitMQ
- [ ] PUT /api/pedidos/{id}/estado
- [ ] Casos: transición inválida→422, idempotente(same state)→200, terminal→422
- [ ] Unit tests: cada transición válida/inválida

## T6: Detalle de pedido (US-4) (2h)
**Ref spec:** US-4 (AC)

- [ ] PedidoDetalleDTO: pedido + items[] + cliente summary + historial[] 
- [ ] PedidoService.obtenerDetalle():
  - JOIN FETCH items + historial (ORDER BY created_at ASC)
  - 404 si no existe (no 403)
  - Redis cache: pedido:{tenant}:{id} TTL 30s
  - @CacheEvict al cambiar estado
- [ ] GET /api/pedidos/{id}

## T7: CRUD Productos (US-5) (4h)
**Ref spec:** US-5 (AC)

- [ ] ProductoDTO, CrearProductoRequest DTOs
- [ ] InventarioService CRUD:
  - SKU único por tenant → 409 si duplicado
  - Soft delete: activo=false
  - Paginación
- [ ] InventarioController: CRUD + GET /{id}/stock
- [ ] Unit tests: crear, listar, actualizar, desactivar, SKU duplicado

## T8: Descuento stock atómico (US-5) (3h)
**Ref spec:** US-5 (AC), Plan §5

- [ ] InventarioService.descontarStock(): retry 3 con optimistic locking
- [ ] InventarioService.devolverStock(): para cancelación de pedidos confirmados
- [ ] DB constraint: CHECK (stock_actual >= 0)
- [ ] Integrar con PedidoService.cambiarEstado()
- [ ] Unit tests: descuento ok, insuficiente, concurrent access

## T9: Eventos RabbitMQ (3h)
**Ref spec:** US-1, US-3, Plan §4

- [ ] RabbitConfig: exchange pedidos.exchange, colas pedidos.events/whatsapp/crm
- [ ] PedidoEventPublisher: publicarPedidoCreado(), publicarEstadoChanged()
- [ ] Integrar en PedidoService
- [ ] Unit tests: publicación, serialization

## T10: Estadísticas (2h)
**Ref spec:** Sección 7 (Dashboard KPIs)

- [ ] EstadisticasDTO: ventasHoy, pedidosHoy, ticketPromedio, ventasSemana, ventasMes
- [ ] PedidoService.obtenerEstadisticas(): agregaciones PG + cache Redis 60s
- [ ] GET /api/pedidos/estadisticas (filtros opcionales: desde, hasta, canal)

## T11: Global error handler (2h)
**Ref spec:** Sección 7 (Casos de borde), Sección 5

- [ ] @ControllerAdvice: PedidoNotFoundException→404, StockInsuficienteException→422, TransicionInvalidaException→422, ClienteNoEncontrado→404
- [ ] Formato: { error, message, details[], timestamp, path }

## T12: Cross-tenant tests (2h)
**Ref spec:** Sección 7 (Caso de borde)

- [ ] GET/PUT/DELETE pedido de otro tenant → 404
- [ ] Listar solo retorna pedidos del tenant
- [ ] Estadísticas solo computan del tenant
- [ ] Productos de Tenant A no visibles en B

## T13: Seed data (1h)
- [ ] V5__seed_productos_demo.sql (10-15 productos)
- [ ] V6__seed_pedidos_demo.sql (20-30 pedidos diversos)

---

## DoD por tarea
- [ ] Compila sin warnings | Unit tests ≥80% service | Integration tests (Testcontainers)
- [ ] OpenAPI docs | Validación @Valid | Error responses estandarizados
- [ ] Multi-tenancy validado | Eventos RabbitMQ | Migraciones Flyway
