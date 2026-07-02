# AutoFlow — Product Backlog

> Suite de automatización para PYMEs ecuatorianas (retail, clínicas, restaurantes).
> Stack: Spring Boot 3.4.x / Kotlin / Java 21 / PostgreSQL 17 / MongoDB 8 / RabbitMQ 3.13 / Redis 7.4 / N8N self-hosted / Evolution API / Docker Compose
> Moneda: USD | Suscripción: $99–299/mes

---

## MÓDULO 1: API GATEWAY

### HU-001: Registro de nueva empresa (tenant)
**Como** administrador de una PYME,
**Quiero** registrar mi empresa en la plataforma con nombre, RUC, email y contraseña,
**Para** poder acceder al sistema y comenzar a configurar mis automatizaciones.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** API Gateway
**Sprint:** 1
**Acceptance Criteria:**
- [ ] POST /api/auth/register crea tenant con estado PENDIENTE_VERIFICACION
- [ ] Valida RUC ecuatoriano (13 dígitos) único en BD
- [ ] Envía email de verificación via RabbitMQ (cola `mail.verify`)
- [ ] Retorna JWT access token + refresh token al registrar
- [ ] Password hasheado con BCrypt (strength 12)
**Spec técnica:**
- Endpoint: POST `/api/auth/register`
- Request: `{ "ruc": "179xxxxxxx01", "nombre": "Mi Tienda", "email": "admin@mitienda.com", "password": "Str0ng!Pass" }`
- Modelo: `Tenant` (PostgreSQL) — id, ruc, nombre, email, password_hash, estado[PENDIENTE|ACTIVO|SUSPENDIDO], plan[BASIC|PRO|ENTERPRISE], created_at, updated_at
- Dependencias: Ninguna (HU raíz)

---

### HU-002: Autenticación JWT con refresh tokens
**Como** usuario del sistema,
**Quiero** iniciar sesión con email/contraseña y recibir tokens de acceso,
**Para** poder consumir los endpoints protegidos de la API.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** API Gateway
**Sprint:** 1
**Acceptance Criteria:**
- [ ] POST /api/auth/login valida credenciales y retorna JWT access (15min) + refresh (7d)
- [ ] POST /api/auth/refresh acepta refresh token válido y emite nuevos tokens
- [ ] Access token incluye claims: tenantId, userId, roles, plan
- [ ] Token inválido o expirado retorna 401 con body `{ "error": "UNAUTHORIZED" }`
- [ ] Refresh token almacenado en Redis con TTL 7 días
**Spec técnica:**
- Endpoint: POST `/api/auth/login`, POST `/api/auth/refresh`
- Modelo: RefreshToken (Redis) — key: `refresh:{tokenId}`, value: `{userId, tenantId, expiresAt}`
- Dependencias: HU-001

---

### HU-003: Rate limiting por plan de suscripción
**Como** platform admin,
**Quiero** que cada plan tenga límites de requests por minuto diferentes,
**Para** proteger la infraestructura y incentivar upgrades de plan.
**Prioridad:** Media
**Story Points:** 5
**Módulo:** API Gateway
**Sprint:** 1
**Acceptance Criteria:**
- [ ] Basic (99$/mes): 60 req/min, Pro (199$/mes): 300 req/min, Enterprise (299$/mes): 1000 req/min
- [ ] Límite almacenado en Redis con ventana sliding de 60s
- [ ] Exceder límite retorna 429 `{ "error": "RATE_LIMIT_EXCEEDED", "retryAfter": 12 }`
- [ ] Header `X-RateLimit-Remaining` y `X-RateLimit-Limit` en cada respuesta
- [ ] Endpoints de auth (/login, /register) tienen rate limit propio: 10 req/min por IP
**Spec técnica:**
- Implementación: Spring Cloud Gateway filter con Redis INCR + EX
- Redis key: `ratelimit:{tenantId}:{endpoint}` con TTL 60s
- Dependencias: HU-001, HU-019

---

### HU-004: Routing dinámico a microservicios
**Como** desarrollador,
**Quiero** que el Gateway enrute las peticiones a los microservicios correctos basándose en el path,
**Para** tener una entrada única (single entry point) para todo el platform.
**Prioridad:** Alta
**Story Points:** 3
**Módulo:** API Gateway
**Sprint:** 1
**Acceptance Criteria:**
- [ ] `/api/auth/**` → Auth Service (puerto 8081)
- [ ] `/api/crm/**` → CRM Service (puerto 8082)
- [ ] `/api/pedidos/**` → Orders Service (puerto 8083)
- [ ] `/api/whatsapp/**` → WhatsApp Service (puerto 8084)
- [ ] `/api/notifications/**` → Notifications Service (puerto 8085)
- [ ] `/api/reportes/**` → Reports Service (puerto 8086)
- [ ] `/api/billing/**` → Billing Service (puerto 8087)
- [ ] `/api/appointments/**` → Appointment Service (puerto 8088)
- [ ] Headers propagados: `X-Tenant-Id`, `X-User-Id`, `Authorization`
- [ ] Timeout de 30s por request downstream; fallback 503 si servicio cae
**Spec técnica:**
- Implementación: Spring Cloud Gateway `RouteLocator` con predicates por path
- Resilience4j Circuit Breaker configurado con umbral 50% en 10s
- Dependencias: Ninguna (infraestructura base)

---

### HU-005: Gestión de roles y permisos
**Como** administrador de empresa,
**Quiero** asignar roles (admin, manager, operator, viewer) a los usuarios de mi organización,
**Para** controlar quién puede hacer qué dentro de la plataforma.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** API Gateway
**Sprint:** 2
**Acceptance Criteria:**
- [ ] CRUD de roles vía `/api/users/roles` (solo admin)
- [ ] Cada rol tiene permisos granulares: `pedidos:read`, `pedidos:write`, `crm:read`, etc.
- [ ] Los endpoints validan permisos vía anotación `@RequiresPermission("modulo:action")`
- [ ] Un usuario puede tener múltiples roles; permisos se unen (union)
- [ ] Cambio de rol notifica al usuario por email
**Spec técnica:**
- Endpoint: CRUD `/api/users/roles`, `/api/users/{id}/roles` (PUT)
- Modelo: `Role` (PostgreSQL) — id, tenant_id, name, permissions[TEXT[]], created_at
- Modelo: `UserRole` (PostgreSQL) — user_id, role_id
- Dependencias: HU-001, HU-002

---

## MÓDULO 2: PEDIDOS

### HU-006: Crear pedido manual
**Como** operador de tienda,
**Quiero** crear un pedido con cliente, items, cantidades y precio,
**Para** registrar ventas presenciales o por WhatsApp en el sistema.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** Pedidos
**Sprint:** 1
**Acceptance Criteria:**
- [ ] POST `/api/pedidos` crea pedido con estado `PENDIENTE`
- [ ] Request incluye: `cliente_id`, `items[{producto_id, cantidad, precio_unitario}]`, `notas`, `canal[TIENDA|WHATSAPP|WEB]`
- [ ] Calcula `total` automáticamente: sum(cantidad × precio_unitario)
- [ ] Valida stock si producto tiene inventario gestionado (flag `gestiona_stock`)
- [ ] Publica evento `pedido.creado` en RabbitMQ (cola `pedidos.events`)
**Spec técnica:**
- Endpoint: POST `/api/pedidos`
- Modelo: `Pedido` (PostgreSQL) — id, tenant_id, cliente_id, canal, estado[PENDIENTE|CONFIRMADO|EN_PREPARACION|ENTREGADO|CANCELADO], total, notas, created_at, updated_at
- Modelo: `PedidoItem` (PostgreSQL) — id, pedido_id, producto_id, cantidad, precio_unitario, subtotal
- Dependencias: HU-001, HU-011

---

### HU-007: Listar y filtrar pedidos
**Como** manager,
**Quiero** ver todos los pedidos con filtros por estado, fecha, cliente y canal,
**Para** tener visibilidad del flujo de ventas y tomar decisiones.
**Prioridad:** Alta
**Story Points:** 3
**Módulo:** Pedidos
**Sprint:** 1
**Acceptance Criteria:**
- [ ] GET `/api/pedidos` retorna paginado (default 20/page, max 100)
- [ ] Filtros query params: `estado`, `canal`, `cliente_id`, `desde`, `hasta`, `search` (nombre cliente)
- [ ] Ordenado por `created_at DESC` por defecto
- [ ] Respuesta incluye `total_pages`, `total_elements`, `current_page`
- [ ] Solo retorna pedidos del `tenant_id` del usuario autenticado (multi-tenancy)
**Spec técnica:**
- Endpoint: GET `/api/pedidos?estado=PENDIENTE&desde=2026-03-01&hasta=2026-03-18&page=0&size=20`
- Query: Spring Data JPA Specification con Predicate dinámico
- Dependencias: HU-006

---

### HU-008: Actualizar estado de pedido
**Como** operador,
**Quiero** cambiar el estado de un pedido (confirmar, preparar, entregar, cancelar),
**Para** mantener el flujo de trabajo actualizado y notificar al cliente.
**Prioridad:** Alta
**Story Points:** 3
**Módulo:** Pedidos
**Sprint:** 1
**Acceptance Criteria:**
- [ ] PUT `/api/pedidos/{id}/estado` actualiza con validación de transiciones válidas
- [ ] Transiciones válidas: PENDIENTE→CONFIRMADO→EN_PREPARACION→ENTREGADO; cualquier→CANCELADO
- [ ] Estado inválido retorna 422 `{ "error": "TRANSICION_INVALIDA", "estadoActual": "..." }`
- [ ] Cada cambio publica evento `pedido.estado.changed` en RabbitMQ
- [ ] Si estado = ENTREGADO, decrementa stock de items (si aplica)
**Spec técnica:**
- Endpoint: PUT `/api/pedidos/{id}/estado` body: `{ "nuevoEstado": "CONFIRMADO", "motivo": "Pago confirmado" }`
- Modelo: `PedidoHistorial` (PostgreSQL) — id, pedido_id, estado_anterior, estado_nuevo, usuario_id, motivo, created_at
- Dependencias: HU-006

---

### HU-009: Consultar detalle de pedido
**Como** usuario,
**Quiero** ver el detalle completo de un pedido incluyendo items, historial de estados y datos del cliente,
**Para** resolver consultas y hacer seguimiento.
**Prioridad:** Media
**Story Points:** 3
**Módulo:** Pedidos
**Sprint:** 2
**Acceptance Criteria:**
- [ ] GET `/api/pedidos/{id}` retorna pedido con items anidados y cliente resumido
- [ ] Incluye `historial_estados[]` ordenado por fecha
- [ ] Si pedido no pertenece al tenant, retorna 404 (no 403 — evitar info leak)
- [ ] Response cacheable por 30s (Redis) para reducir queries
**Spec técnica:**
- Endpoint: GET `/api/pedidos/{id}`
- Response DTO: PedidoDTO + List<PedidoItemDTO> + ClienteSummaryDTO + List<PedidoHistorialDTO>
- Redis cache key: `pedido:{tenantId}:{pedidoId}` TTL 30s
- Dependencias: HU-006, HU-007

---

### HU-010: Gestión básica de inventario
**Como** manager,
**Quiero** registrar productos con stock y que el sistema descuente automáticamente al confirmar pedidos,
**Para** evitar vender productos sin stock.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** Pedidos
**Sprint:** 2
**Acceptance Criteria:**
- [ ] CRUD productos: POST/GET/PUT/DELETE `/api/inventario/productos`
- [ ] Producto tiene: nombre, SKU, precio, stock_actual, stock_minimo, gestiona_stock (bool)
- [ ] Al crear pedido con items, valida stock disponible por cada producto
- [ ] Al cambiar estado a ENTREGADO, descuenta stock vía transacción atómica
- [ ] Si stock < stock_minimo, publica evento `inventario.bajo` en RabbitMQ
- [ ] Stock nunca puede quedar negativo (constraint DB + optimistic locking)
**Spec técnica:**
- Endpoint: CRUD `/api/inventario/productos`, GET `/api/inventario/productos/{id}/stock`
- Modelo: `Producto` (PostgreSQL) — id, tenant_id, sku, nombre, precio, stock_actual, stock_minimo, gestiona_stock, created_at
- Optimistic locking con `@Version` en stock_actual
- Dependencias: HU-006, HU-008

---

## MÓDULO 3: CRM

### HU-011: Registrar cliente con datos ecuatorianos
**Como** operador,
**Quiero** registrar un cliente con nombre, cédula/RUC, teléfono, email y dirección,
**Para** tener la base de contactos para pedidos y comunicaciones.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** CRM
**Sprint:** 2
**Acceptance Criteria:**
- [ ] POST `/api/crm/clientes` crea cliente con validación de cédula ecuatoriana (10 dígitos) o RUC (13 dígitos)
- [ ] Campos: nombre, apellido, cedula, telefono, email, direccion, ciudad, notas
- [ ] Valida formato email y teléfono ecuatoriano (09xxxxxxxx)
- [ ] Verifica unicidad de cédula/RUC por tenant
- [ ] Sincroniza con MongoDB para búsquedas de texto libre
**Spec técnica:**
- Endpoint: POST `/api/crm/clientes`
- Modelo: `Cliente` (PostgreSQL) — id, tenant_id, nombre, apellido, cedula, telefono, email, direccion, ciudad, created_at
- Documento MongoDB: `ClienteSearch` — cedula, nombre_completo, telefono, tenant_id (índice de texto)
- Dependencias: HU-001

---

### HU-012: Buscar y listar clientes
**Como** operador,
**Quiero** buscar clientes por nombre, cédula o teléfono con autocompletado,
**Para** encontrar rápidamente un cliente al crear un pedido.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** CRM
**Sprint:** 2
**Acceptance Criteria:**
- [ ] GET `/api/crm/clientes?search=juan` busca en nombre, apellido, cédula, teléfono
- [ ] Búsqueda full-text en MongoDB con texto parcial (no solo prefix)
- [ ] Retorna top 10 resultados para autocompletado (response < 200ms)
- [ ] GET `/api/crm/clientes` (sin search) lista paginados ordenados por created_at
- [ ] Resultados filtrados por tenant_id
**Spec técnica:**
- Endpoint: GET `/api/crm/clientes?search=jua&limit=10`
- Implementación: MongoDB `$text` search + fallback a regex para partial match
- Redis cache para búsquedas frecuentes: `crm:search:{tenantId}:{hash(query)}` TTL 60s
- Dependencias: HU-011

---

### HU-013: Etiquetar clientes
**Como** manager,
**Quiero** crear etiquetas (VIP, frecuente, nuevo, etc.) y asignarlas a clientes,
**Para** segmentar mi base de clientes para campañas y atención diferenciada.
**Prioridad:** Media
**Story Points:** 5
**Módulo:** CRM
**Sprint:** 2
**Acceptance Criteria:**
- [ ] CRUD etiquetas: POST/GET/DELETE `/api/crm/etiquetas`
- [ ] Asignar etiqueta: POST `/api/crm/clientes/{id}/etiquetas` body: `{ "etiqueta_id": "..." }`
- [ ] Cada etiqueta tiene: nombre, color (hex), icono (emoji)
- [ ] Máximo 10 etiquetas por cliente
- [ ] GET `/api/crm/clientes?etiqueta=VIP` filtra por etiqueta
**Spec técnica:**
- Endpoint: CRUD `/api/crm/etiquetas`, POST/DELETE `/api/crm/clientes/{id}/etiquetas`
- Modelo: `Etiqueta` (PostgreSQL) — id, tenant_id, nombre, color, icono
- Modelo: `ClienteEtiqueta` (PostgreSQL) — cliente_id, etiqueta_id (many-to-many)
- Dependencias: HU-011

---

### HU-014: Historial de interacciones del cliente
**Como** manager,
**Quiero** ver el historial completo de pedidos, mensajes de WhatsApp y notas de un cliente,
**Para** entender la relación completa con el cliente.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** CRM
**Sprint:** 3
**Acceptance Criteria:**
- [ ] GET `/api/crm/clientes/{id}/historial` retorna timeline unificado
- [ ] Timeline incluye: pedidos (fecha, monto, estado), mensajes WA (fecha, dirección, preview), notas manuales
- [ ] Ordenado cronológicamente DESC, paginado
- [ ] Cada item del timeline indica tipo: `PEDIDO`, `MENSAJE`, `NOTA`
- [ ] Se puede filtrar por tipo y rango de fechas
**Spec técnica:**
- Endpoint: GET `/api/crm/clientes/{id}/historial?tipo=PEDIDO&desde=2026-01-01&page=0&size=20`
- Implementación: Agregación de datos de PostgreSQL (pedidos) + MongoDB (mensajes) + PostgreSQL (notas)
- Timeline unificado como `List<HistorialItemDTO>` con polimorfismo por tipo
- Dependencias: HU-006, HU-011, HU-016

---

### HU-015: Notas manuales sobre clientes
**Como** operador,
**Quiero** agregar notas de texto libre sobre un cliente,
**Para** registrar información importante como preferencias, restricciones o acuerdos.
**Prioridad:** Baja
**Story Points:** 3
**Módulo:** CRM
**Sprint:** 3
**Acceptance Criteria:**
- [ ] POST `/api/crm/clientes/{id}/notas` crea nota con texto y autor
- [ ] GET `/api/crm/clientes/{id}/notas` lista notas ordenadas por fecha DESC
- [ ] PUT `/api/crm/clientes/{id}/notas/{nota_id}` actualiza nota (solo autor original)
- [ ] DELETE `/api/crm/clientes/{id}/notas/{nota_id}` elimina nota (solo admin)
**Spec técnica:**
- Endpoint: CRUD `/api/crm/clientes/{id}/notas`
- Modelo: `ClienteNota` (MongoDB) — id, cliente_id, tenant_id, autor_id, texto, created_at, updated_at
- Dependencias: HU-011

---

## MÓDULO 4: WHATSAPP

### HU-016: Conexión WhatsApp Business API
**Como** administrador,
**Quiero** conectar mi número de WhatsApp Business a la plataforma,
**Para** poder recibir y enviar mensajes automatizados.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** WhatsApp
**Sprint:** 2
**Acceptance Criteria:**
- [ ] POST `/api/whatsapp/connections` registra configuración con `phone_number_id`, `access_token`, `webhook_verify_token`
- [ ] GET `/api/whatsapp/connections` retorna estado de conexión (ACTIVO/DESCONECTADO)
- [ ] Webhook GET `/api/whatsapp/webhook` responde verificación de Meta
- [ ] Webhook POST `/api/whatsapp/webhook` recibe mensajes entrantes y publica en RabbitMQ (cola `wa.incoming`)
- [ ] Almacena mensajes entrantes en MongoDB con timestamp y metadata
- [ ] Las credenciales se almacenan encriptadas (AES-256) en PostgreSQL
**Spec técnica:**
- Endpoint: POST/GET `/api/whatsapp/connections`, GET/POST `/api/whatsapp/webhook`
- Modelo: `WhatsappConnection` (PostgreSQL) — id, tenant_id, phone_number_id, access_token_enc, webhook_verify_token, estado, webhook_url, created_at
- Documento MongoDB: `WhatsappMessage` — id, tenant_id, connection_id, direction[INCOMING|OUTGOING], from, to, type[TEXT|IMAGE|DOCUMENT|LOCATION], content, wa_message_id, status[SENT|DELIVERED|READ], timestamp
- Dependencias: HU-001

---

### HU-017: Envío de mensajes de texto por WhatsApp
**Como** operador,
**Quiero** enviar mensajes de texto a clientes por WhatsApp desde el panel,
**Para** comunicarme directamente sin salir de la plataforma.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** WhatsApp
**Sprint:** 2
**Acceptance Criteria:**
- [ ] POST `/api/whatsapp/messages` envía mensaje texto a número específico
- [ ] Body: `{ "to": "5939xxxxxxxx", "mensaje": "Hola..." }`
- [ ] Valida formato de número (593 + 9 dígitos)
- [ ] Retorna `wa_message_id` de Meta API
- [ ] Publica evento `wa.message.sent` en RabbitMQ para tracking de estado
- [ ] Rate limit: máximo 30 mensajes/minuto por conexión (respeta límites de Meta)
**Spec técnica:**
- Endpoint: POST `/api/whatsapp/messages`
- Llamada: POST `https://graph.facebook.com/v18.0/{phone_number_id}/messages` con Bearer token
- Modelo: Registro en `WhatsappMessage` (MongoDB) con status=SENT
- Dependencias: HU-016

---

### HU-018: Gestión de plantillas de WhatsApp aprobadas
**Como** admin,
**Quiero** crear y gestionar plantillas de mensajes (hola, recordatorio, confirmación) que Meta ya aprobó,
**Para** enviar mensajes transaccionales sin que el cliente haya escrito primero.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** WhatsApp
**Sprint:** 3
**Acceptance Criteria:**
- [ ] CRUD plantillas: POST/GET/PUT/DELETE `/api/whatsapp/templates`
- [ ] Campos: nombre, lenguaje, categoria[MARKETING|UTILITY|AUTHENTICATION], body con variables `{{1}}`, `{{2}}`
- [ ] POST `/api/whatsapp/templates/{nombre}/send` envía con variables reemplazadas
- [ ] Valida que plantilla esté aprobada antes de enviar
- [ ] Sincroniza plantillas existentes de Meta API al crear conexión
- [ ] Variables se reemplazan con datos del cliente/pedido dinámicamente
**Spec técnica:**
- Endpoint: CRUD `/api/whatsapp/templates`, POST `/api/whatsapp/templates/{nombre}/send`
- Modelo: `WhatsappTemplate` (PostgreSQL) — id, tenant_id, nombre, lenguaje, categoria, body, variables[TEXT[]], estado[PENDING|APPROVED|REJECTED], meta_template_id
- Llamada: POST `https://graph.facebook.com/v18.0/{phone_number_id}/messages` con `type: template`
- Dependencias: HU-016

---

### HU-019: Configuración Evolution API (WhatsApp multi-device)
**Como** admin,
**Quiero** conectar WhatsApp vía Evolution API como alternativa a Meta Business API,
**Para** tener WhatsApp en modo multi-device sin costo de verificación de plantillas.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** WhatsApp
**Sprint:** 3
**Acceptance Criteria:**
- [ ] POST `/api/whatsapp/evolution/instances` crea instancia Evolution
- [ ] GET `/api/whatsapp/evolution/instances/{id}/qrcode` retorna QR code para vincular
- [ ] Webhook `/api/whatsapp/evolution/webhook` recibe eventos de mensajes entrantes
- [ ] Soporta envío de texto, imágenes, documentos y ubicaciones
- [ ] Reconexión automática al perder sesión con re-emisión de QR
- [ ] Almacena estado de instancia en Redis para monitoreo
**Spec técnica:**
- Endpoint: POST/GET `/api/whatsapp/evolution/instances`, GET `/api/whatsapp/evolution/instances/{id}/qrcode`
- Modelo: `EvolutionInstance` (PostgreSQL) — id, tenant_id, instance_name, api_key, base_url, status[CONNECTED|DISCONNECTED|CONNECTING], created_at
- Redis: `evolution:instance:{instanceId}:status` con heartbeat cada 30s
- Dependencias: HU-016

---

## MÓDULO 5: REPORTES

### HU-020: Dashboard de ventas
**Como** manager,
**Quiero** ver un dashboard con métricas clave (ventas del día, semana, mes, ticket promedio, productos top),
**Para** tomar decisiones informadas sobre mi negocio.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Reportes
**Sprint:** 3
**Acceptance Criteria:**
- [ ] GET `/api/reportes/dashboard` retorna KPIs del tenant
- [ ] KPIs: ventas_hoy, ventas_semana, ventas_mes, pedido_count_hoy, ticket_promedio, top_5_productos
- [ ] Datos en tiempo real (cache 60s en Redis)
- [ ] Filtro opcional por rango de fechas y canal (TIENDA/WHATSAPP/WEB)
- [ ] Respuesta < 500ms incluso con >10,000 pedidos históricos
**Spec técnica:**
- Endpoint: GET `/api/reportes/dashboard?desde=2026-03-01&hasta=2026-03-18&canal=WHATSAPP`
- Query: Agregaciones PostgreSQL (`SUM`, `COUNT`, `AVG`) con índices en `created_at` y `tenant_id`
- Redis cache: `reportes:dashboard:{tenantId}:{hash(filtros)}` TTL 60s
- Dependencias: HU-006

---

### HU-021: Reporte de ventas exportable
**Como** manager,
**Quiero** generar un reporte detallado de ventas por período y descargarlo en Excel/PDF,
**Para** presentar a contabilidad o socios.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** Reportes
**Sprint:** 3
**Acceptance Criteria:**
- [ ] POST `/api/reportes/ventas/generar` crea job asíncrono de generación
- [ ] Parámetros: `desde`, `hasta`, `formato[EXCEL|PDF]`, `agrupacion[DIA|SEMANA|MES]`, `canal`
- [ ] Job retorna `report_id` inmediatamente (status: PROCESANDO)
- [ ] GET `/api/reportes/{report_id}/download` descarga cuando status = LISTO
- [ ] Excel generado con Apache POI: header con logo, tabla de pedidos, resumen con totales
- [ ] PDF generado con iText: formato A4, tabla con alternating rows
- [ ] Reports expiran después de 24h
**Spec técnica:**
- Endpoint: POST `/api/reportes/ventas/generar`, GET `/api/reportes/{id}/download`
- Modelo: `ReporteJob` (PostgreSQL) — id, tenant_id, tipo, formato, parametros_json, status[PROCESANDO|LISTO|ERROR], file_path, expires_at, created_at
- Procesamiento: RabbitMQ cola `reportes.generate`, consumer en thread aparte
- Archivos en `/data/reports/{tenantId}/` con cleanup job nocturno
- Dependencias: HU-006, HU-020

---

### HU-022: Reportes programados (scheduling)
**Como** manager,
**Quiero** programar reportes que se generen automáticamente y lleguen a mi WhatsApp o email,
**Para** recibir insights sin tener que entrar al sistema.
**Prioridad:** Baja
**Story Points:** 13
**Módulo:** Reportes
**Sprint:** 4
**Acceptance Criteria:**
- [ ] POST `/api/reportes/schedule` crea reporte programado
- [ ] Frecuencia: DIARIO (8am), SEMANAL (lunes 8am), MENSUAL (1er día del mes 8am)
- [ ] Destino: WhatsApp (mensaje con resumen + archivo) o Email (con adjunto)
- [ ] Incluye gráfico de tendencia de ventas (Chart.js server-side o imagen generada)
- [ ] Si falla la generación, reintentar 3 veces con backoff exponencial
- [ ] Historial de envíos en `/api/reportes/schedule/{id}/history`
**Spec técnica:**
- Endpoint: CRUD `/api/reportes/schedule`, GET `/api/reportes/schedule/{id}/history`
- Modelo: `ReporteSchedule` (PostgreSQL) — id, tenant_id, tipo_reporte, frecuencia, destino[WHATSAPP|EMAIL], recipient, parametros_json, activo, last_run, next_run
- Scheduler: Spring `@Scheduled` con CRON personalizado por frecuencia
- Dependencias: HU-017, HU-021, HU-018

---

## MÓDULO 6: CONFIGURACIÓN

### HU-023: Configuración de branding del tenant
**Como** admin,
**Quiero** subir el logo, elegir colores primario/secundario y nombre de mi negocio,
**Para** que las mini-apps y mensajes reflejen mi marca.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** Configuración
**Sprint:** 3
**Acceptance Criteria:**
- [ ] PUT `/api/config/branding` actualiza logo (upload), nombre comercial, colores (hex), slogan
- [ ] Logo se almacena en MinIO/S3-compatible y se genera thumbnail 200x200
- [ ] Configuración accesible públicamente via GET `/api/config/branding/{tenant_slug}`
- [ ] Colores validados: formato hex (#RRGGBB), contraste mínimo WCAG AA
- [ ] Cache público con ETag para CDN
**Spec técnica:**
- Endpoint: PUT `/api/config/branding`, GET `/api/config/branding/{slug}`
- Modelo: `TenantBranding` (PostgreSQL) — id, tenant_id, logo_url, logo_thumb_url, nombre_comercial, color_primario, color_secundario, slug, slogan
- Storage: MinIO bucket `autoflow-branding/{tenantId}/logo.png`
- Dependencias: HU-001

---

### HU-024: Gestión de planes y suscripción
**Como** admin de platform,
**Quiero** asignar y cambiar planes de suscripción (Basic/Pro/Enterprise) a tenants,
**Para** gestionar el modelo de negocio SaaS.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Configuración
**Sprint:** 3
**Acceptance Criteria:**
- [ ] GET `/api/config/subscription` retorna plan actual, features habilitadas, fecha de renovación
- [ ] PUT `/api/config/subscription/upgrade` cambia plan (solo platform admin)
- [ ] Cada plan define límites: usuarios_max, pedidos_mes, storage_mb, rate_limit
- [ ] Al cambiar plan, invalida cache de rate limits (Redis)
- [ ] Historial de cambios de plan en tabla `subscription_history`
- [ ] NOTA: Stripe/PayPal integration es HU futuro (backlog separado)
**Spec técnica:**
- Endpoint: GET/PUT `/api/config/subscription`
- Modelo: `Subscription` (PostgreSQL) — id, tenant_id, plan[BASIC|PRO|ENTERPRISE], estado[ACTIVE|PAST_DUE|CANCELLED], fecha_inicio, fecha_renovacion, features_json
- Modelo: `SubscriptionHistory` (PostgreSQL) — id, tenant_id, plan_anterior, plan_nuevo, changed_by, changed_at
- Dependencias: HU-003

---

### HU-025: Configuración de integraciones N8N
**Como** admin,
**Quiero** ver y activar/desactivar integraciones con N8N para automatizaciones personalizadas,
**Para** extender la funcionalidad sin código adicional.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** Configuración
**Sprint:** 4
**Acceptance Criteria:**
- [ ] GET `/api/config/integrations/n8n` retorna estado de conexión y workflows activos
- [ ] POST `/api/config/integrations/n8n/test` prueba conexión con N8N instance del tenant
- [ ] Webhook trigger genérico: POST `/api/config/integrations/n8n/webhook/{tenant_id}/{event}`
- [ ] Eventos disponibles: `pedido.creado`, `pedido.estado.changed`, `cliente.registrado`, `inventario.bajo`
- [ ] Listado de workflows N8N activos con nombre, triggers y última ejecución
- [ ] Los webhooks se firman con HMAC-SHA256 para verificación
**Spec técnica:**
- Endpoint: GET/POST `/api/config/integrations/n8n`, POST `/api/config/integrations/n8n/webhook/{tenantId}/{event}`
- Modelo: `N8nIntegration` (PostgreSQL) — id, tenant_id, base_url, api_key_enc, activo, last_health_check
- Modelo: `N8nWorkflow` (MongoDB) — tenant_id, workflow_id, nombre, triggers[], activo, last_execution
- Dependencias: HU-001, HU-006, HU-011

---

### HU-026: Configuración de notificaciones internas
**Como** admin,
**Quiero** configurar qué eventos generan notificaciones y a qué canales (email, WhatsApp, dashboard),
**Para** recibir alertas importantes sin ruido innecesario.
**Prioridad:** Baja
**Story Points:** 5
**Módulo:** Configuración
**Sprint:** 4
**Acceptance Criteria:**
- [ ] GET/PUT `/api/config/notifications` gestiona preferencias de notificación
- [ ] Eventos configurables: `pedido.nuevo`, `pedido.cancelado`, `inventario.bajo`, `pago.recibido`
- [ ] Canales por evento: email, WhatsApp, push (dashboard)
- [ ] Frecuencia: inmediato o digest diario (8am)
- [ ] Test de notificación: POST `/api/config/notifications/test` envía de prueba
**Spec técnica:**
- Endpoint: GET/PUT `/api/config/notifications`, POST `/api/config/notifications/test`
- Modelo: `NotificationPreference` (PostgreSQL) — id, tenant_id, evento, canal[EMAIL|WHATSAPP|DASHBOARD], frecuencia[IMMEDIATE|DAILY_DIGEST], activo
- Dependencias: HU-017, HU-016

---

### HU-027: Onboarding wizard de primer uso
**Como** nuevo usuario,
**Quiero** un wizard paso a paso que me guíe en la configuración inicial (datos empresa, branding, conexión WhatsApp, primer pedido de prueba),
**Para** empezar a usar la plataforma en menos de 15 minutos.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** Configuración
**Sprint:** 4
**Acceptance Criteria:**
- [ ] Wizard de 5 pasos: (1) Datos empresa, (2) Branding, (3) Conexión WhatsApp, (4) Primer producto, (5) Primer pedido
- [ ] Estado del wizard persistido en `tenant.onboarding_step` (0-5)
- [ ] Cada paso tiene skip option (excepto paso 1)
- [ ] Al completar paso 5, marca tenant como ACTIVO
- [ ] GET `/api/config/onboarding/status` retorna paso actual y completion %
- [ ] Dashboard muestra banner "Completar configuración" hasta step 5
**Spec técnica:**
- Endpoint: GET/PUT `/api/config/onboarding/status`, POST `/api/config/onboarding/step/{step}/complete`
- Modelo: `Tenant` (campo added): onboarding_step INTEGER DEFAULT 0, onboarding_completed BOOLEAN DEFAULT FALSE
- Dependencias: HU-001, HU-023, HU-016, HU-010, HU-006

---

## MÓDULO 7: FACTURACIÓN ELECTRÓNICA SRI

### HU-028: Configuración fiscal del contribuyente
**Como** administrador de empresa,
**Quiero** registrar los datos fiscales de mi negocio (RUC, razón social, establecimiento, punto de emisión, tipo contribuyente),
**Para** que las facturas electrónicas se generen con la información correcta según el SRI.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** Facturación
**Sprint:** 5
**Acceptance Criteria:**
- [ ] POST `/api/billing/config` crea configuración fiscal del tenant
- [ ] Campos: ruc, razon_social, nombre_comercial, direccion_matricial, establecimiento (3 dígitos), punto_emision (3 dígitos), tipo_contribuyente
- [ ] Valida RUC ecuatoriano (13 dígitos) con checksum algorítmico
- [ ] Valida que establecimiento y punto de emisión sean numéricos (001-999)
- [ ] GET `/api/billing/config` retorna configuración actual
- [ ] PUT `/api/billing/config` actualiza datos fiscales (solo admin)
- [ ] POST `/api/billing/environment/switch` cambia entre ambiente pruebas ↔ producción del SRI
**Spec técnica:**
- Endpoint: GET/POST/PUT `/api/billing/config`, POST `/api/billing/environment/switch`
- Modelo: `TenantBillingConfig` (PostgreSQL) — id, tenant_id, ruc, razon_social, nombre_comercial, direccion_matricial, establecimiento, punto_emision, tipo_contribuyente, ambiente_sri[PRUEBA|PRODUCCION], signing_provider, created_at, updated_at
- Variables de entorno: `BILLING_SRI_ENVIRONMENT`, `BILLING_SRI_RECEPTION_URL`, `BILLING_SRI_AUTHORIZATION_URL`
- Dependencias: HU-001

---

### HU-029: Gestión de certificados digitales (.p12)
**Como** administrador,
**Quiero** subir mi certificado de firma electrónica (.p12/.pfx) y gestionar su vigencia,
**Para** poder firmar comprobantes electrónicos válidos ante el SRI.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Facturación
**Sprint:** 5
**Acceptance Criteria:**
- [ ] POST `/api/billing/certificate/upload` recibe archivo .p12/.pfx + contraseña
- [ ] Valida que el certificado sea un PKCS#12 válido y no esté expirado
- [ ] Almacena certificado encriptado en HashiCorp Vault (producción) o Docker Secrets (staging)
- [ ] GET `/api/billing/certificate` retorna metadata (emisor, vigencia, proveedor) sin exponer el archivo
- [ ] POST `/api/billing/rotate-certificate` permite rotar certificado sin downtime
- [ ] Alerta automática 30 días antes de expiración del certificado (evento `certificate.expiring`)
- [ ] Soporta proveedores: BCE, Security Data (SDS), ANF Ecuador, Ecuacert, GlobalSign, DigiCert
**Spec técnica:**
- Endpoint: POST `/api/billing/certificate/upload`, GET `/api/billing/certificate`, POST `/api/billing/rotate-certificate`
- Storage: HashiCorp Vault path `secret/data/billing/{tenant_id}/certificate`
- Validación: Java KeyStore API para leer .p12 y verificar cadena de certificados
- Dependencias: HU-028

---

### HU-030: Generación de factura electrónica
**Como** sistema (automático),
**Quiero** generar una factura electrónica con clave de acceso de 49 dígitos cuando un pedido sea confirmado,
**Para** cumplir con la normativa de facturación electrónica del SRI de Ecuador.
**Prioridad:** Alta
**Story Points:** 13
**Módulo:** Facturación
**Sprint:** 5
**Acceptance Criteria:**
- [ ] Consume evento `order.confirmed` de RabbitMQ y genera factura automáticamente
- [ ] POST `/api/billing/invoices/generate` permite generación manual con `order_id`
- [ ] Genera clave de acceso de 49 dígitos según algoritmo del SRI (fecha, tipo comprobante, RUC, ambiente, serie, secuencial, código numérico, dígito verificador módulo 11)
- [ ] Genera XML del comprobante conforme al XSD oficial del SRI (versión 1.1.0)
- [ ] Secuencial auto-incrementa por establecimiento + punto de emisión
- [ ] Calcula subtotal, IVA (15%), ICE (si aplica), IR (si aplica), total
- [ ] Almacena factura en PostgreSQL con status `GENERADA`
- [ ] Genera PDF con datos de la factura y código QR de validación SRI
**Spec técnica:**
- Endpoint: POST `/api/billing/invoices/generate` body: `{ "order_id": "..." }`
- Modelo: `Invoice` (PostgreSQL) — id, tenant_id, order_id, invoice_type, clave_acceso, secuencial, establishment_code, emission_point, invoice_date, subtotal, iva, ice, ir, total, status[GENERADA|FIRMADA|ENVIADA|AUTORIZADA|RECHAZADA], sri_authorization_number, sri_environment, created_at
- Modelo: `InvoiceItem` (PostgreSQL) — id, invoice_id, product_code, description, quantity, unit_price, subtotal, iva_rate
- QR URL base: `https://verififact.sri.gob.ec/cgi-bin/cfaces/CeFacSWSPLE?cmp=`
- Dependencias: HU-028, HU-029, HU-008

---

### HU-031: Firma electrónica y envío al SRI
**Como** sistema (automático),
**Quiero** firmar electrónicamente el XML de la factura y enviarlo al web service del SRI para autorización,
**Para** que la factura tenga validez legal y el cliente reciba su comprobante autorizado.
**Prioridad:** Alta
**Story Points:** 13
**Módulo:** Facturación
**Sprint:** 5
**Acceptance Criteria:**
- [ ] POST `/api/billing/invoices/{id}/sign` firma el XML con certificado .p12 del tenant (RSA-SHA256)
- [ ] POST `/api/billing/invoices/{id}/send-to-sri` envía XML firmado al web service de recepción del SRI
- [ ] Maneja respuestas: RECIBIDA, DEVUELTA (errores de formato), RECHAZADA
- [ ] Si RECIBIDA → consulta servicio de autorización del SRI con reintentos (máx. 3 intentos, backoff exponencial)
- [ ] Si AUTORIZADA → almacena número de autorización, fecha y XML autorizado
- [ ] GET `/api/billing/invoices/{id}/authorized-xml` retorna XML autorizado
- [ ] Publica evento `invoice.authorized` en RabbitMQ → notifica al tenant (push + email + WhatsApp)
- [ ] Registra cada interacción con SRI en `InvoiceSriLog` para auditoría
- [ ] Almacena XML y PDF en MinIO: `invoices/{tenantId}/{year}/{month}/{claveAcceso}.xml|pdf`
**Spec técnica:**
- Endpoint: POST `/api/billing/invoices/{id}/sign`, POST `/api/billing/invoices/{id}/send-to-sri`, GET `/api/billing/invoices/{id}/authorized-xml`
- SRI Pruebas: `https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline`
- SRI Producción: `https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline`
- Firma: Apache XML Security / BouncyCastle para XAdES-BES
- Modelo: `InvoiceSriLog` (PostgreSQL) — id, invoice_id, action, request_xml, response_xml, sri_status, sri_messages, attempt, created_at
- Dependencias: HU-029, HU-030

---

### HU-032: Notas de crédito electrónicas
**Como** administrador,
**Quiero** generar notas de crédito electrónicas para anular o modificar facturas autorizadas,
**Para** corregir errores o procesar devoluciones conforme a la normativa del SRI.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** Facturación
**Sprint:** 6
**Acceptance Criteria:**
- [ ] POST `/api/billing/invoices/{invoiceId}/credit-note` genera nota de crédito referenciando factura original
- [ ] Requiere: motivo de modificación, items afectados, montos
- [ ] Genera clave de acceso propia (tipo comprobante 04)
- [ ] Firma XML y envía al SRI (mismo flujo que factura)
- [ ] Valida que la factura original esté en estado AUTORIZADA
- [ ] Publica evento `invoice.voided` en RabbitMQ
- [ ] Actualiza estado de factura original a ANULADA (si nota de crédito es total)
**Spec técnica:**
- Endpoint: POST `/api/billing/invoices/{invoiceId}/credit-note`
- Modelo: `CreditNote` (PostgreSQL) — id, tenant_id, invoice_id_original, clave_acceso_original, clave_acceso_nota, secuencial, motivo, total_abonado, status[GENERADA|FIRMADA|ENVIADA|AUTORIZADA|RECHAZADA], created_at
- Dependencias: HU-030, HU-031

---

## MÓDULO 8: CITAS (APPOINTMENTS)

### HU-033: Configuración de horarios de atención
**Como** administrador de negocio,
**Quiero** configurar los días y horarios de atención de mi establecimiento,
**Para** que los clientes solo puedan reservar en horarios disponibles.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** Citas
**Sprint:** 5
**Acceptance Criteria:**
- [ ] POST `/api/appointments/schedules` crea horario por día de semana (lunes a domingo)
- [ ] Campos por día: day_of_week, open_time (HH:mm), close_time (HH:mm), is_closed (bool)
- [ ] GET `/api/appointments/schedules` retorna horarios del tenant
- [ ] PUT `/api/appointments/schedules/{id}` modifica horario individual
- [ ] Soporta excepciones (feriados, vacaciones): valid_from, valid_until para horarios temporales
- [ ] Valida que open_time < close_time y que no haya solapamiento
- [ ] Timezone fijo: America/Guayaquil (GMT-5)
**Spec técnica:**
- Endpoint: GET/POST `/api/appointments/schedules`, PUT `/api/appointments/schedules/{id}`
- Modelo: `BusinessSchedule` (PostgreSQL) — id, tenant_id, day_of_week (0-6), open_time, close_time, is_closed, valid_from, valid_until, created_at
- Dependencias: HU-001

---

### HU-034: Tipos de servicio con duración y precio
**Como** administrador,
**Quiero** definir los tipos de servicio que ofrece mi negocio con duración, buffer y precio,
**Para** que las citas se reserven con la duración correcta y el cliente conozca el costo.
**Prioridad:** Alta
**Story Points:** 3
**Módulo:** Citas
**Sprint:** 5
**Acceptance Criteria:**
- [ ] CRUD `/api/appointments/services` gestiona tipos de servicio
- [ ] Campos: name, duration_minutes, buffer_minutes (tiempo entre citas), price, active (bool)
- [ ] Valida: duration_minutes > 0, buffer_minutes ≥ 0, price ≥ 0
- [ ] Servicio inactivo no aparece en disponibilidad pero se mantiene para histórico
- [ ] GET retorna lista paginada con filtro `?active=true`
**Spec técnica:**
- Endpoint: CRUD `/api/appointments/services`
- Modelo: `AppointmentService` (PostgreSQL) — id, tenant_id, name, duration_minutes, buffer_minutes, price, active, created_at
- Dependencias: HU-001

---

### HU-035: Reserva de cita con verificación de disponibilidad
**Como** cliente (vía app o WhatsApp),
**Quiero** reservar una cita seleccionando fecha, hora y tipo de servicio,
**Para** asegurar mi turno en el horario que me conviene.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Citas
**Sprint:** 5
**Acceptance Criteria:**
- [ ] GET `/api/appointments/availability?date=2026-04-01&serviceId=...` retorna slots disponibles del día
- [ ] Calcula slots basándose en: horario del negocio, duración del servicio, buffer, citas existentes
- [ ] POST `/api/appointments` crea cita con estado CONFIRMED
- [ ] Validaciones: slot disponible, anticipación mínima (configurable, default 2h), anticipación máxima (configurable, default 30 días)
- [ ] Distributed lock en Redis para evitar doble reserva en el mismo slot (race condition)
- [ ] Publica evento `appointment.created` en RabbitMQ → notifica al cliente (WhatsApp + Push)
- [ ] Respuesta incluye: id, fecha/hora, servicio, duración, estado
**Spec técnica:**
- Endpoint: GET `/api/appointments/availability`, POST `/api/appointments`
- Modelo: `Appointment` (PostgreSQL) — id, tenant_id, client_id, service_id, staff_id, start_time, end_time, status[CONFIRMED|CANCELLED|COMPLETED|NO_SHOW], google_calendar_event_id, notes, created_at
- Redis lock: `appointment:lock:{tenantId}:{date}:{slot}` TTL 10s
- Dependencias: HU-033, HU-034, HU-011

---

### HU-036: Gestión de citas (cancelar, reprogramar, no-show)
**Como** operador o administrador,
**Quiero** cancelar, reprogramar o marcar como no-show una cita existente,
**Para** mantener la agenda actualizada y registrar inasistencias.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** Citas
**Sprint:** 6
**Acceptance Criteria:**
- [ ] PUT `/api/appointments/{id}/cancel` cancela cita con motivo obligatorio
- [ ] Política de cancelación configurable: libre hasta X horas antes (default 24h), después requiere autorización admin
- [ ] PUT `/api/appointments/{id}/reschedule` reprogramar a nueva fecha/hora (valida disponibilidad)
- [ ] PUT `/api/appointments/{id}/status` body: `{ "status": "NO_SHOW" }` registra inasistencia
- [ ] Cada cambio publica evento correspondiente: `appointment.cancelled`, `appointment.confirmed`
- [ ] GET `/api/appointments?status=CONFIRMED&desde=...&hasta=...` lista citas con filtros
- [ ] GET `/api/appointments/upcoming` retorna próximas citas (para recordatorios)
**Spec técnica:**
- Endpoint: PUT `/api/appointments/{id}/cancel`, PUT `/api/appointments/{id}/reschedule`, GET `/api/appointments`, GET `/api/appointments/upcoming`
- Transiciones válidas: CONFIRMED→CANCELLED, CONFIRMED→COMPLETED, CONFIRMED→NO_SHOW; CANCELLED→CONFIRMED (re-reserva)
- Dependencias: HU-035

---

### HU-037: Integración con Google Calendar
**Como** administrador,
**Quiero** sincronizar las citas con Google Calendar de mi negocio,
**Para** ver la agenda en mi calendario habitual y evitar conflictos.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** Citas
**Sprint:** 6
**Acceptance Criteria:**
- [ ] POST `/api/appointments/integrations/google` configura integración Google Calendar por tenant
- [ ] Al confirmar cita → crea evento en Google Calendar (POST /calendars/{id}/events)
- [ ] Al cancelar cita → elimina evento de Google Calendar
- [ ] Al reprogramar → actualiza evento en Google Calendar
- [ ] GET `/api/appointments/availability` consulta freebusy de Google Calendar para verificar conflictos externos
- [ ] Soporta Service Account con delegación de dominio (configurable por tenant)
- [ ] Manejo de errores: si Google Calendar no responde, la cita se crea igual (graceful degradation)
**Spec técnica:**
- Endpoint: POST `/api/appointments/integrations/google`
- Modelo: `TenantIntegration` (PostgreSQL) — id, tenant_id, integration_type[GOOGLE_CALENDAR|CUSTOM_API], config_json, active
- Google API: `google-api-services-calendar` SDK, OAuth2 Service Account
- Variables: `GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON`, `GOOGLE_CALENDAR_DELEGATED_USER`
- Dependencias: HU-035, HU-036

---

### HU-038: Recordatorios automáticos de citas
**Como** cliente con cita reservada,
**Quiero** recibir recordatorios automáticos antes de mi cita (24h y 2h antes),
**Para** no olvidar mi turno y poder cancelar a tiempo si es necesario.
**Prioridad:** Media
**Story Points:** 5
**Módulo:** Citas
**Sprint:** 6
**Acceptance Criteria:**
- [ ] Scheduler interno consulta citas próximas cada 15 minutos
- [ ] 24 horas antes: publica evento `appointment.reminder` → envía WhatsApp + Push notification
- [ ] 2 horas antes: publica evento `appointment.reminder` → envía Push notification
- [ ] Mensaje incluye: nombre del servicio, fecha/hora, dirección del negocio, link para cancelar
- [ ] Frecuencia de recordatorios configurable por tenant (PUT `/api/config/appointments/reminders`)
- [ ] No envía recordatorio si la cita ya fue cancelada
- [ ] Registra envío en `notifications_log` para evitar duplicados
**Spec técnica:**
- Scheduler: Spring `@Scheduled(fixedRate = 900000)` (cada 15 min)
- Query: `SELECT * FROM appointments WHERE start_time BETWEEN NOW() + interval '23h 45m' AND NOW() + interval '24h 15m' AND status = 'CONFIRMED' AND reminder_24h_sent = false`
- Eventos RabbitMQ: `appointment.reminder` consumido por notifications-service y whatsapp-service
- Dependencias: HU-035, HU-016

---

## MÓDULO 9: FRONTEND WEB (ANGULAR)

### HU-039: Scaffold Angular + autenticación (login/registro)
**Como** usuario,
**Quiero** acceder a la plataforma web con login y registro desde el navegador,
**Para** gestionar mi negocio desde cualquier dispositivo con pantalla grande.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Frontend Web
**Sprint:** 2
**Acceptance Criteria:**
- [ ] Scaffold Angular 17+ con PrimeNG, standalone components, lazy loading
- [ ] Pantalla de login: email + contraseña → consume POST `/api/auth/login`
- [ ] Pantalla de registro: nombre empresa, RUC, email, contraseña → consume POST `/api/auth/register`
- [ ] Almacena JWT en memoria (no localStorage) con refresh automático via interceptor
- [ ] Guard de autenticación: rutas protegidas redirigen a `/login` si no hay token válido
- [ ] Interceptor HTTP: agrega `Authorization: Bearer {token}` a cada request
- [ ] Manejo de errores 401 → refresh token automático o redirect a login
- [ ] Responsive: funcional en desktop (1440px) y tablet (768px)
**Spec técnica:**
- Framework: Angular 17+ con signals, standalone components
- UI Library: PrimeNG (theme AutoFlow: primario #4F46E5 Indigo)
- Auth: `AuthService` + `AuthInterceptor` + `AuthGuard`
- State: Angular signals para estado de auth; no NgRx para MVP
- Dependencias: HU-001, HU-002

---

### HU-040: Layout principal (sidebar, header, routing)
**Como** usuario autenticado,
**Quiero** navegar entre módulos (Dashboard, Pedidos, CRM, WhatsApp, Reportes, Config) desde un sidebar,
**Para** acceder rápidamente a cada sección de la plataforma.
**Prioridad:** Alta
**Story Points:** 5
**Módulo:** Frontend Web
**Sprint:** 2
**Acceptance Criteria:**
- [ ] Layout con sidebar izquierdo colapsable + header superior
- [ ] Sidebar items: Dashboard, Pedidos, Clientes, WhatsApp, Reportes, Citas, Configuración
- [ ] Header: avatar del usuario, nombre del tenant, botón de notificaciones, toggle sidebar
- [ ] Routing lazy-loaded por módulo: `/dashboard`, `/pedidos`, `/clientes`, `/whatsapp`, `/reportes`, `/citas`, `/config`
- [ ] Sidebar indica ruta activa con highlight visual
- [ ] Sidebar muestra/oculta items según rol del usuario (admin vs operator vs viewer)
- [ ] Responsive: sidebar se colapsa a iconos en tablet, se oculta en mobile con hamburger
**Spec técnica:**
- Componentes: `LayoutComponent`, `SidebarComponent`, `HeaderComponent` (standalone)
- PrimeNG: `p-sidebar`, `p-menuitem`, `p-avatar`, `p-badge`
- Colores del Design System: primario #4F46E5, sidebar bg #1E1B4B
- Dependencias: HU-039

---

### HU-041: Dashboard de ventas (frontend)
**Como** manager,
**Quiero** ver los KPIs de ventas en un dashboard visual con gráficos y tarjetas,
**Para** tener visibilidad instantánea del rendimiento de mi negocio.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Frontend Web
**Sprint:** 3
**Acceptance Criteria:**
- [ ] Consume GET `/api/reportes/dashboard` y renderiza KPIs
- [ ] Tarjetas de KPI: ventas_hoy (USD), ventas_semana, ventas_mes, pedidos_hoy, ticket_promedio
- [ ] Gráfico de barras: ventas por día (últimos 7 días) — PrimeNG Charts (Chart.js)
- [ ] Gráfico de dona: distribución por canal (TIENDA, WHATSAPP, WEB)
- [ ] Tabla: top 5 productos más vendidos con cantidad y monto
- [ ] Filtro de rango de fechas (date picker PrimeNG)
- [ ] Auto-refresh cada 60 segundos
- [ ] Skeleton loading mientras se cargan los datos
**Spec técnica:**
- Componentes: `DashboardComponent`, `KpiCardComponent`, `SalesChartComponent`, `TopProductsComponent`
- PrimeNG: `p-chart`, `p-card`, `p-calendar`, `p-table`, `p-skeleton`
- Dependencias: HU-020, HU-040

---

### HU-042: Gestión de pedidos (frontend)
**Como** operador,
**Quiero** crear, listar y gestionar pedidos desde el panel web,
**Para** registrar ventas y hacer seguimiento sin usar herramientas externas.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Frontend Web
**Sprint:** 3
**Acceptance Criteria:**
- [ ] Tabla de pedidos con filtros: estado, canal, fecha, búsqueda por cliente — consume GET `/api/pedidos`
- [ ] Paginación server-side con PrimeNG `p-table` lazy loading
- [ ] Dialog/modal para crear pedido: seleccionar cliente (autocompletado), agregar items (producto, cantidad), notas
- [ ] Botones de acción por pedido: Confirmar, Preparar, Entregar, Cancelar — consume PUT `/api/pedidos/{id}/estado`
- [ ] Detalle de pedido en panel lateral o página dedicada — consume GET `/api/pedidos/{id}`
- [ ] Badge de color por estado: PENDIENTE (amarillo), CONFIRMADO (azul), EN_PREPARACION (naranja), ENTREGADO (verde), CANCELADO (rojo)
- [ ] Toast notifications al cambiar estado exitosamente
**Spec técnica:**
- Componentes: `PedidosListComponent`, `PedidoCreateDialogComponent`, `PedidoDetailComponent`
- PrimeNG: `p-table`, `p-dialog`, `p-autoComplete`, `p-dropdown`, `p-tag`, `p-toast`
- Servicio: `PedidosService` con HttpClient y observables
- Dependencias: HU-006, HU-007, HU-008, HU-040

---

### HU-043: CRM — lista y detalle de clientes (frontend)
**Como** operador,
**Quiero** buscar, listar y ver el detalle de clientes desde el panel web,
**Para** gestionar mi base de contactos y consultar el historial de cada cliente.
**Prioridad:** Alta
**Story Points:** 8
**Módulo:** Frontend Web
**Sprint:** 3
**Acceptance Criteria:**
- [ ] Búsqueda de clientes con autocompletado (nombre, cédula, teléfono) — consume GET `/api/crm/clientes?search=`
- [ ] Tabla de clientes con columnas: nombre, cédula, teléfono, email, etiquetas, fecha registro
- [ ] Dialog para crear/editar cliente con validación de campos ecuatorianos (cédula, RUC, teléfono 09XXXXXXXX)
- [ ] Vista detalle de cliente con tabs: Datos, Pedidos, Mensajes WhatsApp, Notas
- [ ] Asignar/quitar etiquetas desde el detalle del cliente (chip selector con colores)
- [ ] Filtro por etiqueta en la lista de clientes
**Spec técnica:**
- Componentes: `ClientesListComponent`, `ClienteDetailComponent`, `ClienteFormDialogComponent`, `EtiquetasSelectorComponent`
- PrimeNG: `p-table`, `p-autoComplete`, `p-chip`, `p-tabView`, `p-dialog`, `p-inputMask`
- Servicio: `ClientesService`, `EtiquetasService`
- Dependencias: HU-011, HU-012, HU-013, HU-014, HU-040

---

### HU-044: Configuración y branding (frontend)
**Como** administrador,
**Quiero** configurar el branding de mi empresa y gestionar mi suscripción desde el panel web,
**Para** personalizar la plataforma y administrar mi cuenta.
**Prioridad:** Media
**Story Points:** 5
**Módulo:** Frontend Web
**Sprint:** 4
**Acceptance Criteria:**
- [ ] Página `/config/branding`: subir logo, elegir color primario/secundario (color picker), nombre comercial, slogan
- [ ] Preview en tiempo real del branding aplicado
- [ ] Página `/config/perfil`: datos de la empresa (nombre, RUC, email, teléfono)
- [ ] Página `/config/suscripcion`: plan actual, features, fecha renovación, botón upgrade (info)
- [ ] Página `/config/usuarios`: lista de usuarios del tenant, asignar roles (solo admin)
- [ ] Consume endpoints PUT `/api/config/branding`, GET/PUT `/api/config/subscription`
**Spec técnica:**
- Componentes: `BrandingConfigComponent`, `PerfilComponent`, `SubscripcionComponent`, `UsuariosComponent`
- PrimeNG: `p-fileUpload`, `p-colorPicker`, `p-inputText`, `p-card`, `p-dataView`
- Dependencias: HU-023, HU-024, HU-005, HU-040

---

### HU-045: Conversaciones WhatsApp (frontend)
**Como** operador,
**Quiero** ver las conversaciones de WhatsApp y enviar mensajes desde el panel web,
**Para** gestionar la comunicación con clientes sin cambiar de aplicación.
**Prioridad:** Media
**Story Points:** 8
**Módulo:** Frontend Web
**Sprint:** 4
**Acceptance Criteria:**
- [ ] Vista tipo chat: lista de conversaciones a la izquierda, mensajes a la derecha
- [ ] Lista de conversaciones ordenada por último mensaje, con preview y timestamp
- [ ] Área de mensajes: burbujas incoming/outgoing con timestamp y status (enviado, entregado, leído)
- [ ] Input de mensaje con botón enviar — consume POST `/api/whatsapp/messages`
- [ ] Indicador de estado de conexión WhatsApp (CONECTADO/DESCONECTADO)
- [ ] Búsqueda de conversaciones por nombre o número
- [ ] Polling cada 10 segundos para nuevos mensajes (WebSocket en fase 2)
**Spec técnica:**
- Componentes: `WhatsappLayoutComponent`, `ConversationListComponent`, `ChatWindowComponent`, `MessageBubbleComponent`
- PrimeNG: `p-listbox`, `p-inputTextarea`, `p-badge`, `p-avatar`
- Servicio: `WhatsappService` con polling interval
- Dependencias: HU-016, HU-017, HU-040

---

## DEFINITION OF DONE (DoD)

Todo Story Point completado debe cumplir:

### Código
- [ ] Código compila sin warnings
- [ ] Unit tests escritos con cobertura ≥ 80% del service layer
- [ ] Integration tests para endpoints REST (MockMvc / TestRestTemplate)
- [ ] Code review aprobado por al menos 1 peer
- [ ] No hay TODOs ni FIXMEs sin trackear en Jira/issue tracker

### API
- [ ] Endpoint documentado en OpenAPI/Swagger (`@ApiOperation`, `@ApiResponse`)
- [ ] Validación de entrada con `@Valid` y `@NotBlank`/`@Size`/`@Pattern`
- [ ] Respuestas de error estandarizadas: `{ "error": "CODE", "message": "...", "details": [...] }`
- [ ] Paginación implementada con `Pageable` (no listas infinitas)

### Seguridad
- [ ] Endpoint protegido con `@PreAuthorize` o filtro JWT
- [ ] Multi-tenancy validado: tenant_id extraído de token, nunca de request body
- [ ] SQL injection prevention: JPA queries (no raw SQL concatenado)
- [ ] Passwords: BCrypt strength ≥ 12; tokens nunca loggeados

### Base de Datos
- [ ] Migraciones Flyway/Vibedd con nombre descriptivo (`V1.2__add_pedido_historial_table.sql`)
- [ ] Índices en foreign keys y campos de búsqueda frecuente
- [ ] Constraints de integridad (FK, UNIQUE, NOT NULL) definidos en DDL

### Infraestructura
- [ ] Dockerfile optimizado (multi-stage build, imagen < 300MB)
- [ ] Health checks configurados en docker-compose
- [ ] Logs estructurados JSON con correlationId por request
- [ ] Environment variables para config sensible (no hardcoded)

### Documentación
- [ ] README del módulo actualizado
- [ ] Diagrama de secuencia para flows complejos (>3 pasos)
- [ ] CHANGELOG entry

---

## RIESGOS Y DEPENDENCIAS DEL PROYECTO

### 🔴 Riesgos Altos

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| R1 | **WhatsApp Business API aprobación lenta** — Meta puede tardar 2-4 semanas en aprobar cuenta y plantillas | Bloquea HU-016, HU-017, HU-018 | Implementar Evolution API (HU-019) como fallback paralelo; iniciar proceso de aprobación Meta el día 1 del proyecto |
| R2 | **Complejidad de microservicios desde el día 1** — 9 servicios requieren coordinación y testing cross-service | Mayor tiempo de desarrollo y debugging | Empezar con servicios core (auth, orders, crm); agregar los demás incrementalmente; integration tests con Testcontainers |
| R3 | **Multi-tenancy data isolation** — error de aislamiento expone datos entre tenants | Brecha de seguridad grave, pérdida de confianza legal | Tests de integración específicos para validación cross-tenant; row-level security en PostgreSQL como capa adicional |

### 🟡 Riesgos Medios

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| R4 | **VPS单点故障** — sin redundancia, caída del servidor = plataforma down | SLA roto, churn de clientes | Plan de deploy con Docker Swarm o lightweight Kubernetes para failover; monitoring con UptimeRobot + alertas Telegram |
| R5 | **N8N self-hosted performance** — workflows complejos pueden saturar el VPS | Lentitud general del sistema | Rate limit interno de N8N; monitoreo de CPU/RAM con alertas; considerar instancia dedicada para tenants Enterprise |
| R6 | **Cobranza suscripciones** — sin integración de pagos automática, cobro manual es frágil | Revenue leak, operación manual | Priorizar integración Stripe/PayPal post-MVP (backlog fase 2); sistema de gracia de 7 días antes de suspender |
| R7 | **Adopción de usuarios PYME** — curva de aprendizaje puede ser alta | Baja retención, alto soporte | HU-027 (onboarding wizard) es critical; tutoriales embebidos; soporte WhatsApp nativo |

### 🔵 Dependencias Críticas

| Dependencia | HUs afectadas | Resolución |
|-------------|---------------|------------|
| PostgreSQL + schemas por tenant | Todas | Flyway setup en Sprint 1, Día 1 |
| MongoDB para búsqueda y mensajes | HU-011, HU-012, HU-015, HU-016 | Docker Compose init en Sprint 1 |
| RabbitMQ colas y exchanges | HU-001, HU-006, HU-008, HU-016, HU-021 | Declaración de colas en `@RabbitListener` con `@PostConstruct` |
| Redis para cache + rate limit + tokens | HU-002, HU-003, HU-009, HU-012, HU-020 | Conexión Jedis/Lettuce en Gateway y cada microservicio |
| Evolution API instance corriendo | HU-019 | Docker compose service + health check |
| Certificados SSL para webhooks | HU-016 | Let's Encrypt via Certbot en VPS |

### 📊 Resumen del Backlog

| Módulo | HUs | Story Points |
|--------|-----|--------------|
| API Gateway | 5 (HU-001 a HU-005) | 26 |
| Pedidos | 5 (HU-006 a HU-010) | 22 |
| CRM | 5 (HU-011 a HU-015) | 26 |
| WhatsApp | 4 (HU-016 a HU-019) | 29 |
| Reportes | 3 (HU-020 a HU-022) | 29 |
| Configuración | 5 (HU-023 a HU-027) | 34 |
| Facturación Electrónica SRI | 5 (HU-028 a HU-032) | 47 |
| Citas (Appointments) | 6 (HU-033 a HU-038) | 34 |
| Frontend Web (Angular) | 7 (HU-039 a HU-045) | 50 |
| **TOTAL** | **45 HUs** | **297 SP** |

> **MVP (Sprints 1-4):** 27 HUs backend + 5 HUs frontend (HU-039 a HU-043) = 32 HUs / 203 SP
> **Fase 2 (Sprints 5-6):** Facturación SRI + Citas + frontend restante = 13 HUs / 94 SP
> **Velocity estimado:** 35-45 SP/sprint (equipo de 3-4 developers full-stack)
> **Capacidad 6 sprints total:** 210-270 SP → 297 SP requiere priorización estricta

---

*Document generated: 2026-03-18 | Version: 2.0 | Updated: 2026-07-02 | Author: Alfred (PM Agent) | EGIT Consultoría*
