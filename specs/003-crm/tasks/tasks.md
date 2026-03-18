# Tasks: CRM — Gestión de Clientes, Etiquetas e Historial

> Feature: 003-crm
> Estimación total: 26 SP ≈ 35-45 horas

---

## T1: Setup + Migraciones + MongoDB config (3h)
**Ref spec:** Sección 6 (Modelo de Datos)

- [ ] Inicializar Spring Boot 2.1.x con JPA + MongoDB + Redis + RabbitMQ
- [ ] V1__create_clientes_table.sql (índices tenant, cedula, telefono)
- [ ] V2__create_etiquetas_table.sql (UNIQUE tenant_id+nombre)
- [ ] V3__create_cliente_etiquetas_table.sql
- [ ] MongoConfig.java: text index en cliente_search (weights: nombre=10, cedula=5)
- [ ] Entidades: Cliente, Etiqueta, ClienteEtiqueta (JPA); ClienteSearch, ClienteNota (MongoDB)

## T2: Validación datos ecuatorianos (2h)
**Ref spec:** US-1 (AC)

- [ ] CedulaValidator.java: algoritmo módulo 10 + @ValidCedula annotation
- [ ] TelefonoValidator.java: regex ^09\d{8}$ + @ValidTelefonoEcuatoriano
- [ ] Unit tests: cédulas válidas/inválidas, teléfonos

## T3: CRUD Clientes (HU-011) (5h)
**Ref spec:** US-1 (AC), Sección 7 (Casos de borde)

- [ ] CrearClienteRequest DTO con validaciones completas
- [ ] ClienteService.crearCliente():
  - Unicidad cédula por tenant → 409
  - Unicidad email por tenant → 409
  - Guardar PG + publicar evento cliente.created (sync MongoDB)
- [ ] ClienteService.actualizarCliente() + desactivarCliente() (soft delete)
- [ ] ClienteController: CRUD endpoints
- [ ] Unit tests: éxito, duplicados, formatos inválidos

## T4: Sincronización PG→MongoDB (3h)
**Ref spec:** US-1 (AC §6)

- [ ] ClienteSyncListener.java: escucha cola crm.sync
  - cliente.created → INSERT cliente_search
  - cliente.updated → UPDATE cliente_search
- [ ] ClienteSearch document: nombre_completo, cedula, telefono, email
- [ ] Unit tests: sync correcta, error en sync no bloquea PG

## T5: Búsqueda de clientes (HU-012) (4h)
**Ref spec:** US-2 (AC), Sección 4 (<200ms)

- [ ] ClienteSearchService.buscarClientes():
  - MongoDB $text search (top 10)
  - Fallback: PG ILIKE si vacío
  - Cache Redis: crm:search:{tenant}:{hash} TTL 60s
- [ ] ClienteService.listarClientes(): paginado + filtros (etiqueta, activo)
- [ ] GET /api/crm/clientes?search=juan&limit=10
- [ ] GET /api/crm/clientes?etiqueta=VIP&page=0&size=20
- [ ] Unit tests: búsqueda por nombre/cédula/teléfono, fallback PG, cache

## T6: Etiquetas (HU-013) (4h)
**Ref spec:** US-3 (AC)

- [ ] EtiquetaService CRUD (nombre único por tenant)
- [ ] asignarEtiqueta(): max 10 por cliente → 422 si excede
- [ ] quitarEtiqueta()
- [ ] eliminarEtiqueta(): desasigna de todos los clientes antes
- [ ] EtiquetaController: CRUD + asignación endpoints
- [ ] Unit tests: crear, asignar, max 10, quitar, eliminar

## T7: Historial de interacciones (HU-014) (5h)
**Ref spec:** US-4 (AC), Plan §2 (agregación 3 fuentes)

- [ ] HistorialItemDTO con polimorfismo por tipo (PEDIDO/MENSAJE/NOTA)
- [ ] HistorialService.obtenerHistorial():
  - Paralelizar 3 queries (pedidos PG, mensajes Mongo, notas Mongo)
  - Merge en List<HistorialItemDTO>
  - Sort DESC + Paginate
  - Filtros: tipo, desde, hasta
- [ ] GET /api/crm/clientes/{id}/historial
- [ ] Unit tests: con pedidos, mensajes, notas, combinación, filtros

## T8: Notas manuales (HU-015) (3h)
**Ref spec:** US-5 (AC)

- [ ] NotaService: CRUD en MongoDB cliente_notas
- [ ] crearNota(): autor_id del JWT (X-User-Id header)
- [ ] actualizarNota(): solo autor original → 403
- [ ] eliminarNota(): solo rol admin → 403
- [ ] NotaController: CRUD anidados en cliente
- [ ] Unit tests: crear, listar, editar ok, editar otro (403), delete admin/no-admin

## T9: RabbitMQ events (2h)
**Ref spec:** US-1 (AC §6)

- [ ] RabbitConfig: exchange crm.exchange, colas crm.sync, crm.events
- [ ] ClienteEventPublisher: cliente.created, cliente.updated
- [ ] Integrar en ClienteService
- [ ] Unit tests: publicación, serialization

## T10: Global error handler (1h)

- [ ] @ControllerAdvice: ClienteNotFoundException→404, CedulaDuplicada→409, MaxEtiquetas→422

## T11: Cross-tenant tests (2h)

- [ ] Listar/buscar solo del tenant autenticado
- [ ] Historial solo datos del tenant
- [ ] Etiquetas de A no visibles en B
- [ ] Cédula duplicada solo falla en mismo tenant

---

## DoD
- [ ] Compila sin warnings | Unit tests ≥80% service | Integration tests (PG+Mongo+RabbitMQ)
- [ ] OpenAPI docs | Multi-tenancy validado | Sync PG→MongoDB funciona
- [ ] Búsqueda autocompletado <200ms
