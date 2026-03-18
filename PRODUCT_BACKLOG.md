# AutoFlow — Product Backlog

> Suite de automatización para PYMEs ecuatorianas (retail, clínicas, restaurantes).
> Stack: Spring Boot 2.1.x / Java 17 / PostgreSQL / MongoDB / RabbitMQ / Redis / N8N self-hosted / WhatsApp Business API / Evolution API / Docker Compose
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
- [ ] `/api/pedidos/**` → Pedidos Service (puerto 8081)
- [ ] `/api/crm/**` → CRM Service (puerto 8082)
- [ ] `/api/whatsapp/**` → WhatsApp Service (puerto 8083)
- [ ] `/api/reportes/**` → Reportes Service (puerto 8084)
- [ ] `/api/config/**` → Config Service (puerto 8085)
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
| R2 | **Spring Boot 2.1.x EOL** — versión sin soporte community, vulnerabilidades de seguridad | Deuda técnica acumulada, dificultad de contratación | Planificar upgrade a Spring Boot 3.x post-MVP; documentar como tech debt prioritaria |
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
| **TOTAL** | **27 HUs** | **166 SP** |

> **Velocity estimado:** 35-45 SP/sprint (equipo de 3-4 developers full-stack)
> **Capacidad 4 sprints:** 140-180 SP → 166 SP es ajustado pero alcanzable con focus

---

*Document generated: 2026-03-18 | Version: 1.0 | Author: Alfred (PM Agent) | EGIT Consultoría*
