# Especificaciones Técnicas — AutoFlow
**Versión:** 1.0  
**Fecha:** 2026-03-17  
**Autor:** Axel (Scrum Master, EGIT Consultoría)  
**Referencia:** ADR-001 v2.0 + ADR-002 v2.2 + Historias de Usuario (52 HUs)

---

## Epic 1: Autenticación & Usuarios

### Descripción Técnica
El `auth-service` gestiona toda la infraestructura de identidad y acceso de AutoFlow. Implementa autenticación JWT con rotación de refresh tokens, multi-tenancy basado en `tenant_id`, y RBAC de 3 roles predefinidos. Los tokens revocados se almacenan en Redis con TTL. Las contraseñas se hashean con bcrypt (cost 12). El aislamiento multi-tenant se enforcea a nivel de query con filtro automático por `tenant_id` en cada request autenticado.

### Microservicio Responsable
- **auth-service** (Spring Boot 3.2 + PostgreSQL + Redis)

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/v1/auth/register` | `{name, ruc, email, password, companyName}` | `{tenantId, userId, message}` |
| POST | `/api/v1/auth/verify-email?token=` | — | `{accessToken, refreshToken}` |
| POST | `/api/v1/auth/login` | `{email, password}` | `{accessToken, refreshToken, user: {id, name, roles, tenantId}}` |
| POST | `/api/v1/auth/refresh` | `{refreshToken}` | `{accessToken, refreshToken}` |
| POST | `/api/v1/auth/logout` | `{refreshToken}` | `{message}` |
| POST | `/api/v1/auth/logout-all` | `{refreshToken}` | `{message}` |
| POST | `/api/v1/auth/forgot-password` | `{email}` | `{message}` |
| POST | `/api/v1/auth/reset-password` | `{token, newPassword}` | `{message}` |
| GET | `/api/v1/auth/me` | — | `{id, name, email, roles, tenantId, avatar, createdAt}` |
| PUT | `/api/v1/auth/me` | `{name, phone, avatar}` | `{user}` |
| PUT | `/api/v1/auth/change-password` | `{currentPassword, newPassword}` | `{message}` |
| GET | `/api/v1/users?page=0&size=20` | — | `{content: [...], totalElements, totalPages}` |
| POST | `/api/v1/users` | `{name, email, role}` | `{user}` |
| PUT | `/api/v1/users/{id}` | `{name, role, active}` | `{user}` |
| DELETE | `/api/v1/users/{id}` | — | `{message}` |

### Modelos de Datos Clave

**Tenant**
```
id (UUID PK)
name (VARCHAR 200)
ruc (VARCHAR 13, UNIQUE)
email (VARCHAR 255, UNIQUE)
plan (ENUM: basic, pro, enterprise)
active (BOOLEAN, default true)
logo_url (VARCHAR 500)
brand_color (VARCHAR 7)
timezone (VARCHAR 50, default 'America/Guayaquil')
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**User**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
name (VARCHAR 200)
email (VARCHAR 255) — UNIQUE per tenant
password_hash (VARCHAR 255)
phone (VARCHAR 20)
avatar_url (VARCHAR 500)
role (ENUM: admin, manager, employee)
active (BOOLEAN, default true)
email_verified_at (TIMESTAMP, nullable)
last_login_at (TIMESTAMP)
failed_login_attempts (INT, default 0)
locked_until (TIMESTAMP, nullable)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**RefreshToken**
```
id (UUID PK)
user_id (UUID FK → user)
token_hash (VARCHAR 255)
device_info (VARCHAR 500)
revoked (BOOLEAN, default false)
expires_at (TIMESTAMP)
created_at (TIMESTAMP)
```

**PasswordResetToken**
```
id (UUID PK)
user_id (UUID FK → user)
token_hash (VARCHAR 255)
used (BOOLEAN, default false)
expires_at (TIMESTAMP)
created_at (TIMESTAMP)
```

### Reglas de Negocio Técnicas
1. JWT access token: 15 minutos, claims `{userId, tenantId, roles[], email}`. Firmado con RS256.
2. Refresh token: 7 días, rotación obligatoria (un solo uso por token).
3. Bloqueo de cuenta: tras 5 intentos fallidos → lock 15 minutos. Counter en Redis con key `auth:lockout:{userId}`.
4. Validación de contraseña: mínimo 8 chars, al menos 1 número, 1 carácter especial. Regex: `^(?=.*[0-9])(?=.*[!@#$%^&*])(.{8,})$`.
5. Reset password token: expira en 1 hora, un solo uso, invalida todos los refresh tokens del usuario al usarse.
6. Multi-tenancy: un Admin no puede eliminarse si es el único Admin activo del tenant.
7. Email verification: token válido por 24 horas, se envía vía `notifications-service` a través de RabbitMQ.
8. Rate limiting en login: 20 intentos/minuto por IP (configurado en API Gateway).

### Dependencias con Otros Servicios
- **RabbitMQ:** Publica evento `user.created` y `user.password_reset` para que `notifications-service` envíe emails.
- **Redis:** Almacena token revocados (blocklist) y contadores de intentos fallidos.
- **MinIO:** Almacena avatares/subidas de foto de perfil (URL firmada).
- **API Gateway:** Valida JWT y extrae claims para inyectar headers `X-User-Id`, `X-Tenant-Id`, `X-User-Roles`.

---

## Epic 2: CRM (Clientes, Pipeline)

### Descripción Técnica
El `crm-service` gestiona el ciclo de vida completo de los clientes de la PYME: creación de fichas, búsqueda avanzada con full-text search, historial de interacciones consolidado, pipeline de ventas Kanban y sistema de etiquetas. Utiliza PostgreSQL para datos estructurados y se integra con `whatsapp-service` e `orders-service` vía eventos RabbitMQ para enriquecer el historial de interacciones. Implementa cache en Redis para vistas frecuentes (búsqueda, vista 360°).

### Microservicio Responsable
- **crm-service** (Spring Boot 3.2 + PostgreSQL + Redis)

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/v1/clients` | `{name, company, phones[], emails[], address, tags[], assignedTo}` | `{client}` |
| GET | `/api/v1/clients?page=0&size=20&q=&tags=&stage=&assignedTo=` | — | `{content: [...], totalElements}` |
| GET | `/api/v1/clients/{id}` | — | `{client}` |
| PUT | `/api/v1/clients/{id}` | `{name, company, phones[], emails[], address, tags[], notes}` | `{client}` |
| DELETE | `/api/v1/clients/{id}` | — | `{message}` |
| GET | `/api/v1/clients/{id}/timeline?page=0&size=20` | — | `{content: [Interaction], totalElements}` |
| GET | `/api/v1/clients/{id}/360` | — | `{client, recentOrders, upcomingAppointments, interactions, totalValue}` |
| POST | `/api/v1/clients/{id}/interactions` | `{type, description, duration, outcome, followUpDate, assignedTo}` | `{interaction}` |
| GET | `/api/v1/pipeline?stage=` | — | `{stages: [{name, clients[], value}]}` |
| PUT | `/api/v1/pipeline/clients/{clientId}/stage` | `{fromStage, toStage, estimatedValue, reason}` | `{client}` |
| POST | `/api/v1/pipeline/stages` | `{name, order}` | `{stage}` |
| PUT | `/api/v1/pipeline/stages/{id}` | `{name, order}` | `{stage}` |
| DELETE | `/api/v1/pipeline/stages/{id}` | — | `{message}` |
| GET | `/api/v1/tags` | — | `{tags: [{id, name, color, clientCount}]}` |
| POST | `/api/v1/tags` | `{name, color}` | `{tag}` |
| PUT | `/api/v1/tags/{id}/clients` | `{clientIds[], action: add|remove}` | `{updated}` |
| DELETE | `/api/v1/tags/{id}` | — | `{message}` |

### Modelos de Datos Clave

**Client**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
name (VARCHAR 200)
company (VARCHAR 200, nullable)
address (TEXT, nullable)
assigned_to (UUID FK → user, nullable)
pipeline_stage (VARCHAR 50, default 'nuevo_contacto')
estimated_value (DECIMAL 12,2, default 0)
tags (JSONB) — [{tagId, name, color}]
notes (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**ClientPhone** (one-to-many)
```
id (UUID PK)
client_id (UUID FK → client)
phone (VARCHAR 20)
is_primary (BOOLEAN, default false)
country_code (VARCHAR 5, default '593')
```

**ClientEmail** (one-to-many)
```
id (UUID PK)
client_id (UUID FK → client)
email (VARCHAR 255)
is_primary (BOOLEAN, default false)
```

**Interaction**
```
id (UUID PK)
client_id (UUID FK → client)
type (ENUM: whatsapp_message, order, appointment, call, note, task)
description (TEXT)
metadata (JSONB) — datos específicos por tipo
employee_id (UUID FK → user)
follow_up_date (TIMESTAMP, nullable)
created_at (TIMESTAMP)
```

**Tag**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
name (VARCHAR 100)
color (VARCHAR 7)
created_at (TIMESTAMP)
```

**PipelineStage**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
name (VARCHAR 100)
display_order (INT)
is_default (BOOLEAN)
created_at (TIMESTAMP)
```

### Reglas de Negocio Técnicas
1. Un cliente se identifica como duplicado si comparte el mismo número de WhatsApp principal dentro del mismo tenant (validación en create/update).
2. El phone de WhatsApp debe incluir código de país; se valida con regex `^\d{10,15}$`.
3. Búsqueda full-text: usa `tsvector` + `tsquery` en PostgreSQL sobre campos `name`, `company`, `email`, `phone`. Target p95 < 500ms.
4. Solo un cliente puede estar en una etapa del pipeline a la vez dentro del mismo tenant.
5. Al mover cliente a "Ganado" o "Perdido", se requiere `reason` (opcional pero logged).
6. La vista 360° se cachea en Redis por 5 minutos con key `crm:client:360:{clientId}`.
7. El historial de interacciones es paginado (infinite scroll), no tiene límite de profundidad.
8. Al eliminar una etiqueta, se requiere confirmación si tiene > 0 clientes asociados.

### Dependencias con Otros Servicios
- **whatsapp-service:** Consume evento `message.received` para registrar interacción tipo `whatsapp_message`.
- **orders-service:** Consume evento `order.created` y `order.status_changed` para registrar interacción tipo `order`.
- **appointment-service:** Consume evento `appointment.created` para registrar interacción tipo `appointment`.
- **reports-service:** Expone datos del pipeline para métricas de ventas; consume evento `client.updated`.
- **auth-service:** Valida `assigned_to` (employee/manager existente en el tenant).

---

## Epic 3: Pedidos & Catálogo

### Descripción Técnica
El `orders-service` gestiona el ciclo completo de pedidos: creación, estados, catálogo de productos, facturación PDF y pedido rápido desde WhatsApp. Implementa una máquina de estados finitos para el flujo de pedidos (`DRAFT → PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED`) con validación de transiciones. La facturación usa iTextPDF para generar documentos con branding del tenant. El inventario se valida contra stock disponible al agregar productos al pedido.

### Microservicio Responsable
- **orders-service** (Spring Boot 3.2 + PostgreSQL + MinIO)

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/v1/orders` | `{clientId, items[{productId, quantity}], deliveryAddress, paymentMethod}` | `{order: {id, number, status, subtotal, tax, total, items[]}}` |
| GET | `/api/v1/orders?page=0&size=20&status=&clientId=&dateFrom=&dateTo=` | — | `{content: [...], totalElements}` |
| GET | `/api/v1/orders/{id}` | — | `{order: {id, number, status, client, items[], subtotal, tax, total, history[]}}` |
| PUT | `/api/v1/orders/{id}/status` | `{status, reason?}` | `{order}` |
| PUT | `/api/v1/orders/{id}` | `{items[], deliveryAddress, paymentMethod}` | `{order}` |
| GET | `/api/v1/orders/{id}/invoice` | — | PDF (stream) |
| POST | `/api/v1/orders/{id}/send-invoice` | `{channel: whatsapp|email}` | `{message}` |
| GET | `/api/v1/products?page=0&size=20&category=&q=` | — | `{content: [...], totalElements}` |
| POST | `/api/v1/products` | `{name, description, sku, price, stock, categoryId, image}` | `{product}` |
| PUT | `/api/v1/products/{id}` | `{name, description, sku, price, stock, categoryId, active}` | `{product}` |
| POST | `/api/v1/products/import` | CSV file upload | `{imported, errors[]}` |
| GET | `/api/v1/products/categories` | — | `{categories: [{id, name, parentId, children[]}]}` |
| POST | `/api/v1/products/categories` | `{name, parentId}` | `{category}` |
| POST | `/api/v1/orders/quick` | `{whatsappPhone, items[], paymentMethod}` | `{order}` |

### Modelos de Datos Clave

**Order**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
number (VARCHAR 20, unique per tenant, ej: ORD-2026-0001)
client_id (UUID FK → client)
status (ENUM: draft, pending, confirmed, shipped, delivered, cancelled)
subtotal (DECIMAL 12,2)
tax_rate (DECIMAL 5,2, default 15.00 — IVA Ecuador)
tax_amount (DECIMAL 12,2)
total (DECIMAL 12,2)
delivery_address (TEXT)
payment_method (ENUM: efectivo, tarjeta, transferencia, credito)
cancellation_reason (TEXT, nullable)
created_by (UUID FK → user)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**OrderItem**
```
id (UUID PK)
order_id (UUID FK → order)
product_id (UUID FK → product)
product_name (VARCHAR 200) — snapshot al momento del pedido
product_sku (VARCHAR 50) — snapshot
quantity (INT)
unit_price (DECIMAL 12,2) — snapshot
subtotal (DECIMAL 12,2)
```

**OrderStatusHistory**
```
id (UUID PK)
order_id (UUID FK → order)
from_status (VARCHAR 20)
to_status (VARCHAR 20)
reason (TEXT, nullable)
changed_by (UUID FK → user)
changed_at (TIMESTAMP)
```

**Product**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
name (VARCHAR 200)
description (TEXT)
sku (VARCHAR 50)
price (DECIMAL 12,2)
stock (INT)
category_id (UUID FK → product_category)
image_url (VARCHAR 500)
active (BOOLEAN, default true)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**ProductCategory**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
name (VARCHAR 100)
parent_id (UUID FK → product_category, nullable)
display_order (INT, default 0)
created_at (TIMESTAMP)
```

**Invoice**
```
id (UUID PK)
order_id (UUID FK → order, unique)
number (VARCHAR 20, unique per tenant, ej: FAC-2026-0001)
pdf_url (VARCHAR 500) — MinIO path
generated_at (TIMESTAMP)
```

### Reglas de Negocio Técnicas
1. Flujo de estados válido: `DRAFT→PENDING→CONFIRMED→SHIPPED→DELIVERED` y `DRAFT/CANCELLED`, `PENDING/CANCELLED`, `CONFIRMED/CANCELLED`. Transiciones no lineales no permitidas.
2. Solo se puede cancelar desde `DRAFT`, `PENDING` o `CONFIRMED`. Motivo obligatorio al cancelar.
3. El cálculo de IVA es automático: `tax_amount = subtotal * (tax_rate / 100)`. Default 15% (Ecuador).
4. Al crear pedido, los productos se "snapshottean" con su precio y nombre actuales. Cambios en el catálogo no afectan pedidos existentes.
5. El stock se descuenta al confirmar el pedido (estado `CONFIRMED`), no al crear (`DRAFT`).
6. El número de pedido es consecutivo por tenant y año: `ORD-{YEAR}-{SEQ padded a 4}`.
7. La factura se genera al llegar a estado `CONFIRMED`. Se guarda en MinIO y se cachea la URL.
8. El pedido rápido desde WhatsApp pre-carga los datos del cliente del CRM por número de teléfono.

### Dependencias con Otros Servicios
- **crm-service:** Valida `clientId` existe y pertenece al tenant. Publica evento `order.created` y `order.status_changed` a RabbitMQ.
- **whatsapp-service:** Consume evento para enviar confirmación al cliente desde pedido rápido.
- **notifications-service:** Consume eventos para enviar email/push de confirmación y cambio de estado.
- **reports-service:** Consume eventos para métricas de ventas.
- **MinIO:** Almacena imágenes de productos y PDFs de facturas.

---

## Epic 4: WhatsApp (Evolution API)

### Descripción Técnica
El `whatsapp-service` gestiona toda la comunicación bidireccional vía WhatsApp usando Evolution API. Recibe webhooks de mensajes entrantes, envía mensajes de texto y archivos, gestiona plantillas y administra conversaciones. Utiliza MongoDB para almacenar mensajes (modelo de datos flexibles para contenido multimedia) y Redis para estado de conexión. Se integra con `crm-service` para vincular conversaciones con fichas de cliente y con `notifications-service` para push de mensajes nuevos.

### Microservicio Responsable
- **whatsapp-service** (Spring Boot 3.2 + MongoDB + Redis)

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/v1/whatsapp/webhook` | Evolution API webhook payload | `{status: "ok"}` |
| POST | `/api/v1/whatsapp/send` | `{to, message, type: text, quotedMessageId?}` | `{messageId, status}` |
| POST | `/api/v1/whatsapp/send-media` | `{to, mediaUrl, mediaType, caption?}` | `{messageId, status}` |
| GET | `/api/v1/whatsapp/conversations?page=0&size=20&search=` | — | `{content: [...], totalElements}` |
| GET | `/api/v1/whatsapp/conversations/{phone}/messages?page=0&size=20` | — | `{content: [...], hasMore}` |
| POST | `/api/v1/whatsapp/conversations/{phone}/read` | — | `{updated}` |
| GET | `/api/v1/whatsapp/templates?category=` | — | `{templates: [...]}` |
| POST | `/api/v1/whatsapp/templates` | `{name, category, content, variables[], language}` | `{template}` |
| PUT | `/api/v1/whatsapp/templates/{id}` | `{name, category, content, variables[], active}` | `{template}` |
| GET | `/api/v1/whatsapp/status` | — | `{connected, instanceName, phoneNumber}` |
| POST | `/api/v1/whatsapp/instance/connect` | — | `{qrCode, status}` |

### Modelos de Datos Clave (MongoDB)

**Conversation**
```
_id (ObjectId PK)
tenant_id (UUID)
phone_number (String, index)
contact_name (String, nullable)
contact_avatar (String, nullable)
client_id (UUID, nullable) — vinculado al CRM
last_message_at (Date)
unread_count (Int, default 0)
status (String: active, archived, blocked)
assigned_to (UUID, nullable)
created_at (Date)
updated_at (Date)
```

**Message** (MongoDB — colección `messages`)
```
_id (ObjectId PK)
tenant_id (UUID)
conversation_phone (String, index)
message_id (String, unique — Evolution API ID)
from (String — phone number)
to (String — phone number)
type (String: text, image, document, audio, sticker, video)
content (String — texto o descripción)
media_url (String, nullable)
media_mime_type (String, nullable)
media_size (Long, nullable)
status (String: sent, delivered, read, failed)
direction (String: inbound, outbound)
quoted_message_id (String, nullable)
employee_id (UUID, nullable) — si fue enviado desde el panel
timestamp (Date)
created_at (Date)
```

**MessageTemplate**
```
_id (ObjectId PK)
tenant_id (UUID)
name (String)
category (String: welcome, orders, appointments, support, custom)
content (String)
variables (Array: [{key, description, defaultValue}])
language (String, default 'es')
active (Boolean, default true)
created_by (UUID)
created_at (Date)
updated_at (Date)
```

### Reglas de Negocio Técnicas
1. Webhook de Evolution API: se valida el secret en header `x-evolution-signature` antes de procesar.
2. Mensajes entrantes: si el `phone_number` no existe en el CRM del tenant, se crea una Conversación "sin vincular" con botón "Agregar al CRM" en el frontend.
3. Al abrir una conversación, `unread_count` se resetea a 0 y se emite evento de leído.
4. Límites de archivo: imágenes hasta 16MB, documentos hasta 100MB, audio hasta 16MB. Formatos: JPG, PNG, WEBP (imágenes); PDF, DOCX, XLSX (documentos); MP3, OGG (audio).
5. Flujo de envío: archivo sube a MinIO → URL firmada → Evolution API `sendMedia`.
6. El scroll infinito del historial carga 20 mensajes por página; los documentos son descargables via URL firmada de MinIO.
7. Estado de mensaje: `sent` (Evolution API ACK 1) → `delivered` (ACK 2) → `read` (ACK 3). Actualizado vía webhook.
8. Plantillas soportan variables dinámicas: `{{nombre_cliente}}`, `{{numero_pedido}}`, `{{fecha_cita}}`. Reemplazo server-side antes de enviar.

### Dependencias con Otros Servicios
- **RabbitMQ:** Publica evento `message.received` (inbound) y `message.sent` (outbound) para que `crm-service` registre interacciones y `notifications-service` envíe push.
- **MinIO:** Almacena archivos multimedia enviados/recibidos.
- **crm-service:** Consulta/crea clientes cuando un mensaje llega de un nuevo número. Registra interacciones en el historial.
- **notifications-service:** Consumes evento `message.received` para enviar push notification al empleado asignado.
- **auth-service:** Valida que el `assigned_to` de una conversación es un usuario activo del tenant.

---

## Epic 5: Notificaciones (FCM + Email)

### Descripción Técnica
El `notifications-service` es el motor de notificaciones multicanal de AutoFlow: push notifications vía Firebase Cloud Messaging, emails transaccionales vía SMTP/SendGrid/AWS SES, y orquestación de notificaciones por WhatsApp (delegadas al `whatsapp-service`). Consume eventos de RabbitMQ para enviar notificaciones automáticas ante eventos de negocio. Gestiona plantillas personalizables por tenant y mantiene un log completo de notificaciones enviadas.

### Microservicio Responsable
- **notifications-service** (Spring Boot 3.2 + MongoDB + Firebase Admin SDK)

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/v1/notifications/fcm/register-token` | `{token, deviceId, platform: android|ios}` | `{registered}` |
| DELETE | `/api/v1/notifications/fcm/token/{token}` | — | `{revoked}` |
| POST | `/api/v1/notifications/push` | `{userId?, topic?, tokens[], title, body, data{}, imageUrl?}` | `{results: [{token, status}]}` |
| POST | `/api/v1/notifications/email` | `{to, subject, templateId?, htmlBody?, variables{}}` | `{messageId, status}` |
| GET | `/api/v1/notifications/history?page=0&size=20&channel=&status=` | — | `{content: [...], totalElements}` |
| GET | `/api/v1/notifications/templates?channel=push|email` | — | `{templates: [...]}` |
| POST | `/api/v1/notifications/templates` | `{name, channel, subject?, htmlContent, variables[]}` | `{template}` |
| PUT | `/api/v1/notifications/templates/{id}` | `{name, subject?, htmlContent, variables[], active}` | `{template}` |
| POST | `/api/v1/notifications/templates/{id}/preview` | `{variables{}}` | `{rendered}` |
| POST | `/api/v1/notifications/templates/{id}/restore` | — | `{template}` |

### Modelos de Datos Clave (MongoDB)

**FCMToken**
```
_id (ObjectId PK)
user_id (UUID, index)
tenant_id (UUID)
token (String, unique)
device_id (String)
platform (String: android, ios)
active (Boolean, default true)
last_used_at (Date)
created_at (Date)
```

**NotificationLog**
```
_id (ObjectId PK)
tenant_id (UUID)
channel (String: push, email, whatsapp)
recipient_id (UUID, nullable)
recipient_address (String — email/phone/token)
type (String: order_confirmed, order_status, appointment_reminder, message_received, etc.)
title (String)
body (String)
data (Object, nullable)
status (String: queued, sent, delivered, failed, bounced)
error_message (String, nullable)
sent_at (Date)
delivered_at (Date, nullable)
created_at (Date)
```

**NotificationTemplate**
```
_id (ObjectId PK)
tenant_id (UUID)
name (String)
channel (String: push, email)
subject (String, nullable — solo email)
html_content (String — con variables {{var}})
variables (Array: [{key, description, example}])
active (Boolean, default true)
is_default (Boolean, default false)
created_at (Date)
updated_at (Date)
```

### Reglas de Negocio Técnicas
1. Consumo de RabbitMQ: escucha colas `events.message.received`, `events.order.created`, `events.order.status_changed`, `events.appointment.created`, `events.appointment.reminder`.
2. Push notifications: usa Firebase Admin SDK. Soporta individuales, por topic (rol) y multicast (máximo 500 tokens por lote).
3. Reintentos en fallo FCM: backoff exponencial (1s → 2s → 4s), máximo 3 intentos. El fallo final registra `status: failed` con `error_message`.
4. Emails transaccionales: proveedor configurable por tenant (SMTP propio, SendGrid o AWS SES). Configurado en la tabla `tenant_email_config` (cifrada).
5. Reintentos en fallo email: máximo 3 intentos. Si el email rebota (`bounced`), se registra y se deshabilita temporalmente el envío a esa dirección.
6. Plantillas de email: soportan HTML responsivo con variables dinámicas. El Admin puede previsualizar antes de aplicar.
7. Log de notificaciones: retención de 90 días. Después de 90 días, se archivan a cold storage o se eliminan.
8. Cuando un mensaje llega fuera de horario de atención (configurado por tenant), se envía respuesta automática configurable.

### Dependencias con Otros Servicios
- **RabbitMQ:** Consume eventos de todos los servicios para disparar notificaciones automáticas.
- **Firebase:** Usa Firebase Admin SDK con Service Account JSON configurado por tenant (en `tenant_config`).
- **MinIO:** Almacena plantillas de email con imágenes inline (logos del tenant).
- **auth-service:** Valida tokens FCM de usuarios y gestiona eliminación en logout.
- **whatsapp-service:** Delega envío de notificaciones por WhatsApp cuando el canal es WhatsApp.

---

## Epic 6: Sistema de Citas (Google Calendar)

### Descripción Técnica
El `appointment-service` gestiona el ciclo completo de reservas de citas: configuración de horarios y servicios, verificación de disponibilidad en tiempo real, reserva, cancelación y reprogramación. Se integra con Google Calendar API vía OAuth2 o Service Account para sincronización bidireccional. Implementa lock optimista en PostgreSQL para evitar race conditions en reservas simultáneas y usa Redis para reservas temporales (slots en proceso de reserva).

### Microservicio Responsable
- **appointment-service** (Spring Boot 3.2 + PostgreSQL + Redis + Google Calendar API)

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/v1/appointments/availability?date=&serviceId=&staffId=` | — | `{date, serviceId, slots: [{startTime, endTime, staffId, available}]}` |
| POST | `/api/v1/appointments` | `{serviceId, dateTime, clientName, clientPhone, clientEmail, staffId?, notes}` | `{appointment: {id, status, service, dateTime, client}}` |
| GET | `/api/v1/appointments?page=0&size=20&date=&status=&staffId=` | — | `{content: [...], totalElements}` |
| GET | `/api/v1/appointments/{id}` | — | `{appointment: {id, service, dateTime, client, status, googleEventId, history[]}}` |
| PUT | `/api/v1/appointments/{id}/cancel` | `{reason}` | `{appointment}` |
| PUT | `/api/v1/appointments/{id}/reschedule` | `{newDateTime}` | `{appointment}` |
| GET | `/api/v1/appointments/schedule?view=day|week|month&date=` | — | `{appointments: [...], conflicts[]}` |
| PUT | `/api/v1/appointments/business-hours` | `{schedule: [{dayOfWeek, slots: [{start, end}], active}], holidays: [{date, reason}]}` | `{schedule}` |
| GET | `/api/v1/appointments/business-hours` | — | `{schedule, holidays}` |
| POST | `/api/v1/appointments/services` | `{name, description, durationMinutes, price, bufferMinutes, staffIds[]}` | `{service}` |
| GET | `/api/v1/appointments/services` | — | `{services: [...]}` |
| PUT | `/api/v1/appointments/services/{id}` | `{name, description, durationMinutes, price, bufferMinutes, staffIds[], active}` | `{service}` |
| POST | `/api/v1/appointments/reminders/config` | `{channels[], leadTimes[]}` | `{config}` |

### Modelos de Datos Clave

**Appointment**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
service_id (UUID FK → appointment_service)
staff_id (UUID FK → user, nullable)
client_id (UUID FK → client, nullable)
client_name (VARCHAR 200)
client_phone (VARCHAR 20)
client_email (VARCHAR 255, nullable)
date_time (TIMESTAMP)
end_time (TIMESTAMP — calculado = dateTime + service.duration + service.buffer)
status (ENUM: pending, confirmed, cancelled, completed, no_show)
google_event_id (VARCHAR 255, nullable)
notes (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**AppointmentService**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
name (VARCHAR 200)
description (TEXT)
duration_minutes (INT) — mínimo 15
price (DECIMAL 10,2)
buffer_minutes (INT, default 0) — descanso post-servicio
active (BOOLEAN, default true)
created_at (TIMESTAMP)
```

**AppointmentStaff** (many-to-many: service ↔ staff)
```
id (UUID PK)
service_id (UUID FK → appointment_service)
staff_id (UUID FK → user)
```

**BusinessHours**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
day_of_week (INT: 1=Lunes ... 7=Domingo)
start_time (TIME)
end_time (TIME)
active (BOOLEAN, default true)
```

**BusinessHoursSlot** (turnos partidos)
```
id (UUID PK)
business_hours_id (UUID FK → business_hours)
start_time (TIME)
end_time (TIME)
display_order (INT)
```

**Holiday**
```
id (UUID PK)
tenant_id (UUID FK → tenant)
date (DATE)
reason (VARCHAR 200)
```

**AppointmentHistory**
```
id (UUID PK)
appointment_id (UUID FK → appointment)
action (ENUM: created, confirmed, cancelled, rescheduled, completed, no_show)
old_date_time (TIMESTAMP, nullable)
new_date_time (TIMESTAMP, nullable)
reason (TEXT, nullable)
performed_by (UUID FK → user, nullable)
performed_at (TIMESTAMP)
```

### Reglas de Negocio Técnicas
1. Disponibilidad: se calcula restando citas existentes + eventos de Google Calendar del negocio + slots bloqueados en Redis (reservas en proceso). Target: <500ms de respuesta.
2. Lock optimista en reserva: al confirmar, se verifica que el slot sigue disponible con query condicional `WHERE date_time = ? AND status NOT IN ('cancelled')`. Si falla, se retorna error y se sugieren slots alternativos.
3. Slot temporal en proceso de reserva: al consultar disponibilidad, el slot se bloquea en Redis por 5 minutos (`key: appt:lock:{tenantId}:{serviceId}:{dateTime}`).
4. Buffer entre citas: `end_time = start_time + service.duration + service.buffer`. No se permiten solapamientos.
5. Cancelación: política configurable por tenant. Default: libre hasta 2h antes; después requiere aprobación de Manager. Se valida contra `business_hours` + `holidays`.
6. Sincronización Google Calendar: al crear/confirmar/cancelar/reprogramar cita, se crea/elimina/actualiza evento en Google Calendar. Si Google API falla, la cita se procesa igual y se reintenta.
7. Recordatorios: 24h antes (WhatsApp + push) y 2h antes (push). Se programan vía scheduler interno o N8N.
8. Solo se puede reprogramar hasta 30 días en adelante. Historial de reprogramaciones auditado.
9. Duración mínima de servicio: 15 minutos. Los slots se generan en intervalos de 15 minutos.
10. `no_show`: se registra cuando la cita llega a `end_time` sin haber sido completada ni cancelada. Afecta métricas.

### Dependencias con Otros Servicios
- **Google Calendar API:** Sincronización bidireccional de eventos. OAuth2 o Service Account. Configurado por tenant.
- **RabbitMQ:** Publica eventos `appointment.created`, `appointment.cancelled`, `appointment.rescheduled`, `appointment.reminder` para `notifications-service` y N8N.
- **Redis:** Bloqueo temporal de slots durante proceso de reserva.
- **crm-service:** Consulta/crea clientes al reservar. Publica interacción en el historial del cliente.
- **notifications-service:** Consume eventos para enviar confirmaciones, recordatorios y notificaciones de cancelación.
- **auth-service:** Valida que el `staff_id` es un usuario activo del tenant con rol adecuado.

---

## Epic 7: Reportes & Dashboard

### Descripción Técnica
El `reports-service` genera KPIs en tiempo real, reportes de ventas, métricas de WhatsApp y citas, y soporta exportación a CSV y PDF. Utiliza Materialized Views en PostgreSQL para consultas complejas optimizadas, cache en Redis para el dashboard principal, y MongoDB para agregaciones de datos de WhatsApp. Los reportes se generan en background con notificación al usuario cuando están listos.

### Microservicio Responsable
- **reports-service** (Spring Boot 3.2 + PostgreSQL + MongoDB + Redis)

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/v1/reports/dashboard` | — | `{clients: {total, vsLastMonth}, orders: {today, value}, revenue: {month, vsLastMonth}, appointments: {today}, whatsapp: {activeConversations}}` |
| GET | `/api/v1/reports/sales?period=month&dateFrom=&dateTo=&groupBy=day` | — | `{totalSales, orderCount, avgTicket, topProducts[], topEmployees[], chart: {labels[], data[]}}` |
| GET | `/api/v1/reports/whatsapp?dateFrom=&dateTo=&staffId=` | — | `{messagesSent, messagesReceived, avgFirstResponseTime, avgResolutionTime, hourlyHeatmap[], slaPercentage}` |
| GET | `/api/v1/reports/appointments?dateFrom=&dateTo=&serviceId=` | — | `{confirmed, cancelled, noShows, occupancyRate, byService[], byDay[], revenue}` |
| POST | `/api/v1/reports/export` | `{reportType, format: csv|pdf, filters{}}` | `{exportId, status: processing}` |
| GET | `/api/v1/reports/exports/{id}` | — | `{status, downloadUrl, expiresAt}` |
| GET | `/api/v1/reports/exports` | — | `{content: [{id, reportType, format, createdAt, downloadUrl, expiresAt}]}` |
| GET | `/api/v1/reports/compare?metric=&period=current&period=previous` | — | `{current: {...}, previous: {...}, change: {...}}` |

### Modelos de Datos Clave (PostgreSQL)

**ReportSnapshot** (tabla de snapshots históricos)
```
id (UUID PK)
tenant_id (UUID FK → tenant)
report_type (VARCHAR 50) — daily, weekly, monthly
period_date (DATE)
data (JSONB) — KPIs agregados del período
created_at (TIMESTAMP)
```

**Materialized View:** `mv_sales_daily` (refresh cada 5 minutos)
```
tenant_id, date, total_orders, total_revenue, avg_ticket, top_product_id, employee_with_most_sales_id
```

**Materialized View:** `mv_appointments_daily` (refresh cada 5 minutos)
```
tenant_id, date, total_appointments, confirmed, cancelled, no_shows, occupancy_rate
```

**ExportJob** (MongoDB)
```
_id (ObjectId PK)
tenant_id (UUID)
user_id (UUID)
report_type (String)
filters (Object)
format (String: csv, pdf)
status (String: processing, ready, failed)
file_url (String, nullable — MinIO)
expires_at (Date)
created_at (Date)
```

### Reglas de Negocio Técnicas
1. Dashboard: datos actualizados cada 5 minutos. Cache en Redis con key `reports:dashboard:{tenantId}` TTL 5 min.
2. Las Materialized Views se refrescan cada 5 minutos vía scheduler (`REFRESH MATERIALIZED VIEW CONCURRENTLY`).
3. Todos los datos están aislados por `tenant_id`. El query siempre incluye filtro de tenant.
4. Reportes de ventas: soportan agregación por día, semana, mes, trimestre, año. Datos en gráficos de barras y líneas.
5. Exportación a CSV/PDF: se procesa en background. El usuario recibe push notification cuando el archivo está listo.
6. Archivos exportados: almacenados en MinIO con enlace de descarga válido por 24 horas.
7. Histórico de exportaciones: 30 días. Después se eliminan los archivos de MinIO.
8. Mapa de calor de WhatsApp: distribución por hora del día (0-23h) del volumen de mensajes.
9. SLA de WhatsApp: porcentaje de conversaciones con primera respuesta en <5 minutos (configurable).
10. Comparativa de períodos: calcula delta y porcentaje de cambio entre período actual y anterior.

### Dependencias con Otros Servicios
- **RabbitMQ:** Consume eventos `client.updated`, `order.created`, `order.status_changed`, `appointment.created`, `appointment.cancelled`, `message.received` para mantener datos actualizados.
- **PostgreSQL:** Almacena snapshots históricos y materialized views. Consulta datos de pedidos y citas.
- **MongoDB:** Consulta `messages` y `conversations` de `whatsapp-service` para métricas de WhatsApp.
- **Redis:** Cache del dashboard y cache de reportes frecuentes.
- **MinIO:** Almacena archivos de exportación (CSV, PDF).

---

## Epic 8: Configuración Multi-tenant

### Descripción Técnica
La configuración multi-tenant se distribuye entre `auth-service` (datos del tenant, perfil de empresa) y las configuraciones específicas de cada servicio (Evolution API en `whatsapp-service`, FCM en `notifications-service`, Google Calendar en `appointment-service`, N8N como servicio independiente). Los datos sensibles (API keys, service accounts JSON) se almacenan cifrados en la base de datos. La configuración se cachea en Redis para performance.

### Microservicio Responsable
- **auth-service** (configuración general del tenant) + cada servicio para sus integraciones específicas

### Endpoints de API

| Método | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/v1/config/tenant` | — | `{tenant: {id, name, ruc, address, phone, email, logo, brandColor, timezone}}` |
| PUT | `/api/v1/config/tenant` | `{name, address, phone, email, logo, brandColor, timezone}` | `{tenant}` |
| GET | `/api/v1/config/whatsapp` | — | `{instanceUrl, instanceName, phoneNumber, status: connected|disconnected}` |
| PUT | `/api/v1/config/whatsapp` | `{instanceUrl, apiKey, instanceName, phoneNumber}` | `{config: {instanceUrl, instanceName, phoneNumber, status}}` |
| POST | `/api/v1/config/whatsapp/test` | — | `{status: connected|disconnected, latency}` |
| GET | `/api/v1/config/fcm` | — | `{projectId, configured: true, active: true}` |
| PUT | `/api/v1/config/fcm` | `{projectId, serviceAccountJson}` | `{configured: true}` |
| POST | `/api/v1/config/fcm/test` | — | `{sent: true}` |
| GET | `/api/v1/config/google-calendar` | — | `{calendarId, connected: true, lastSyncAt}` |
| POST | `/api/v1/config/google-calendar/connect` | `{calendarId, oauthToken?|serviceAccountJson?}` | `{connected: true}` |
| DELETE | `/api/v1/config/google-calendar` | — | `{disconnected: true}` |
| GET | `/api/v1/config/n8n` | — | `{baseUrl, active: true, flows: [...]}` |
| POST | `/api/v1/config/n8n/flow` | `{name, trigger, actions[]}` | `{flow}` |
| GET | `/api/v1/config/cancellation-policy` | — | `{minHoursBeforeCancel, lateCancelRequiresApproval, noShowPenalty, autoMessage}` |
| PUT | `/api/v1/config/cancellation-policy` | `{minHoursBeforeCancel, lateCancelRequiresApproval, noShowPenalty, autoMessage}` | `{policy}` |
| GET | `/api/v1/config/rate-limits` | — | `{requestsPerMinute, maxUsers, maxClients, maxMessagesPerMonth, maxAppointmentsPerMonth}` |
| PUT | `/api/v1/config/rate-limits` | `{maxUsers, maxClients, maxMessagesPerMonth, maxAppointmentsPerMonth}` | `{limits}` |

### Modelos de Datos Clave

**TenantConfig** (tabla `tenant_config`)
```
id (UUID PK)
tenant_id (UUID FK → tenant, unique)
name (VARCHAR 200)
ruc (VARCHAR 13)
address (TEXT)
phone (VARCHAR 20)
email (VARCHAR 255)
logo_url (VARCHAR 500)
brand_color (VARCHAR 7)
timezone (VARCHAR 50)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**TenantWhatsAppConfig** (tabla `tenant_whatsapp_config`)
```
id (UUID PK)
tenant_id (UUID FK → tenant, unique)
instance_url (VARCHAR 500)
api_key_encrypted (TEXT) — cifrado AES-256
instance_name (VARCHAR 100)
phone_number (VARCHAR 20)
webhook_secret_encrypted (TEXT) — cifrado AES-256
status (VARCHAR 20: connected, disconnected)
last_connection_check (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**TenantFCMConfig** (tabla `tenant_fcm_config`)
```
id (UUID PK)
tenant_id (UUID FK → tenant, unique)
project_id (VARCHAR 100)
service_account_json_encrypted (TEXT) — cifrado AES-256
active (BOOLEAN, default true)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**TenantGoogleCalendarConfig** (tabla `tenant_gcal_config`)
```
id (UUID PK)
tenant_id (UUID FK → tenant, unique)
calendar_id (VARCHAR 255)
credentials_encrypted (TEXT) — cifrado AES-256
connected (BOOLEAN, default false)
last_sync_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**TenantCancellationPolicy** (tabla `tenant_cancellation_policy`)
```
id (UUID PK)
tenant_id (UUID FK → tenant, unique)
min_hours_before_cancel (INT, default 2)
late_cancel_requires_authorization (BOOLEAN, default false)
no_show_record_penalty (BOOLEAN, default false)
auto_message (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**TenantRateLimit** (tabla `tenant_rate_limit`)
```
id (UUID PK)
tenant_id (UUID FK → tenant, unique)
plan (VARCHAR 20: basic, pro, enterprise)
max_users (INT, default 10)
max_clients (INT, default 1000)
max_whatsapp_messages_month (INT, default 5000)
max_appointments_month (INT, default 500)
requests_per_minute (INT, default 100)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Reglas de Negocio Técnicas
1. Todos los campos sensibles (API keys, service account JSON) se cifran con AES-256-GCM antes de almacenarse. La key de cifrado se gestiona vía secrets management.
2. Al guardar configuración de WhatsApp, el sistema valida la conexión con Evolution API antes de persistir. Muestra estado en tiempo real.
3. Al conectar Google Calendar, sincroniza todas las citas existentes confirmadas como eventos de Google Calendar.
4. La configuración de rate limits se cachea en Redis (`key: config:ratelimit:{tenantId}`) con TTL de 5 minutos.
5. Al alcanzar el 80% del límite mensual, se publica evento `tenant.limit.warning` en RabbitMQ para notificar al Admin.
6. El webhook de Evolution API se registra automáticamente al configurar WhatsApp: `EVOLUTION_WEBHOOK_URL = {autoflow_base}/api/v1/whatsapp/webhook`.
7. Las plantillas de N8N se acceden via SSO o API Key de tenant (no credenciales individuales).
8. Los cambios de configuración se aplican inmediatamente a futuras operaciones; no afectan operaciones ya en proceso.
9. Rate limiting global: 100 requests/minuto por tenant implementado en API Gateway vía Redis sliding window.
10. El Admin de EGIT tiene panel maestro para ver uso de todos los tenants (endpoint maestro).

### Dependencias con Otros Servicios
- **auth-service:** Almacena configuración general del tenant (perfil, branding, timezone).
- **whatsapp-service:** Configuración específica de Evolution API para el tenant.
- **notifications-service:** Configuración de FCM para push notifications.
- **appointment-service:** Configuración de Google Calendar y política de cancelación.
- **API Gateway:** Aplica rate limits configurados por tenant.
- **RabbitMQ:** Publica eventos de cambio de configuración y warnings de límites.
- **Redis:** Cache de configuración de rate limits y datos del tenant.
- **MinIO:** Almacena logos y assets de branding del tenant.

---

## Resumen de Dependencias entre Servicios

```
                    ┌──────────────┐
                    │ API Gateway  │
                    │ (rate limit, │
                    │  JWT auth)   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │   auth    │   │   crm     │   │  orders   │
    │  service  │◄──┤  service  │◄──┤  service  │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
          │         ┌─────▼─────┐   ┌─────▼─────┐
          │         │ whatsapp  │   │   report  │
          │         │  service  │──►│  service  │
          │         └─────┬─────┘   └───────────┘
          │               │
    ┌─────▼─────┐   ┌────▼──────┐
    │  notif.   │   │ appointment│
    │  service  │◄──┤  service  │
    └───────────┘   └───────────┘

    ──►  consume evento     ◄──  publica evento
    
    Infraestructura compartida:
    ├── PostgreSQL (auth, crm, orders, appointments, reports)
    ├── MongoDB (whatsapp, notifications, reports)
    ├── Redis (cache, rate limit, locks, token blocklist)
    ├── RabbitMQ (event bus)
    └── MinIO (archivos: invoices, avatars, media, exports)
```

---

*Documento generado por Axel (Scrum Master, AutoFlow — EGIT Consultoría)*  
*Basado en ADR-001 v2.0, ADR-002 v2.2 y 52 Historias de Usuario*  
*Fecha: 2026-03-17*
