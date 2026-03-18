# Feature: WhatsApp — Conexión, Mensajería y Plantillas

> Módulo: WhatsApp
> HUs cubiertas: HU-016, HU-017, HU-018, HU-019
> Prototipo visual: `whatsapp.html` (chat UI tipo WhatsApp Web)
> Estado: 🟡 Draft — Pendiente de aprobación
> Última actualización: 2026-03-18

## 1. Contexto y Justificación

El módulo WhatsApp permite a las PYMEs ecuatorianas comunicarse con sus clientes directamente desde AutoFlow. Soporta dos providers: Meta Business API (oficial, con plantillas aprobadas) y Evolution API (multi-device, sin costo de plantillas). Los mensajes entrantes y salientes se almacenan en MongoDB para búsquedas y generación de historial en CRM.

El prototipo `whatsapp.html` presenta una UI tipo WhatsApp Web: lista de conversaciones a la izquierda (con avatar, nombre, último mensaje, timestamp, badge de no leídos), y chat activo a la derecha con burbujas de mensaje (incoming/outgoing), input de texto con botón de enviar, selector de emoji, y indicador de estado (sent/delivered/read).

## 2. User Stories (resumen)

### US-1: Conexión WhatsApp Business API (HU-016)
- POST `/api/whatsapp/connections` registra configuración (phone_number_id, access_token, webhook_verify_token)
- Webhook GET para verificación de Meta
- Webhook POST recibe mensajes entrantes → RabbitMQ cola `wa.incoming`
- Mensajes entrantes almacenados en MongoDB
- Credenciales encriptadas (AES-256) en PostgreSQL

### US-2: Envío de mensajes de texto (HU-017)
- POST `/api/whatsapp/messages` envía mensaje texto
- Valida formato: 593 + 9 dígitos
- Rate limit: 30 msgs/min por conexión (límites Meta)
- Retorna wa_message_id para tracking

### US-3: Plantillas de WhatsApp (HU-018)
- CRUD plantillas aprobadas por Meta
- Variables `{{1}}`, `{{2}}` reemplazadas dinámicamente
- Sincronización de plantillas existentes al conectar

### US-4: Evolution API (HU-019)
- Crear instancia Evolution API
- QR code para vincular dispositivo
- Webhook para mensajes entrantes
- Reconexión automática con re-emisión de QR

## 3. Modelo de Datos

### PostgreSQL

```sql
CREATE TABLE whatsapp_connections (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    phone_number_id VARCHAR(100) NOT NULL,
    access_token_enc TEXT NOT NULL,      -- AES-256 encrypted
    webhook_verify_token VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    provider VARCHAR(20) DEFAULT 'META', -- META o EVOLUTION
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    connection_id UUID REFERENCES whatsapp_connections(id),
    nombre VARCHAR(100) NOT NULL,
    lenguaje VARCHAR(10) DEFAULT 'es',
    categoria VARCHAR(20),               -- MARKETING, UTILITY, AUTHENTICATION
    body TEXT NOT NULL,
    variables TEXT[],                     -- ['nombre_cliente', 'pedido_total']
    estado VARCHAR(20) DEFAULT 'PENDING',-- PENDING, APPROVED, REJECTED
    meta_template_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE evolution_instances (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    instance_name VARCHAR(100) NOT NULL,
    api_key_enc TEXT NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'DISCONNECTED', -- CONNECTED, DISCONNECTED, CONNECTING
    created_at TIMESTAMP DEFAULT NOW()
);
```

### MongoDB

```javascript
// whatsapp_messages
{
  _id: ObjectId,
  tenant_id: UUID,
  connection_id: UUID,
  direction: "INCOMING" | "OUTGOING",
  from: "593991234567",
  to: "593987654321",
  type: "TEXT" | "IMAGE" | "DOCUMENT" | "LOCATION",
  content: "Hola, quiero hacer un pedido",
  wa_message_id: "wamid.xxx",
  status: "SENT" | "DELIVERED" | "READ",
  cliente_id: UUID,                      -- Linkado con CRM si existe
  timestamp: ISODate
}
// Índices: { tenant_id: 1, timestamp: -1 }, { wa_message_id: 1 }
```

## 4. API Contract (resumen)

```
POST   /api/whatsapp/connections                          → Registrar conexión Meta
GET    /api/whatsapp/connections                          → Listar conexiones + estado
GET    /api/whatsapp/webhook?hub.verify_token=...         → Verificación Meta
POST   /api/whatsapp/webhook                              → Mensajes entrantes Meta
POST   /api/whatsapp/messages                             → Enviar mensaje texto
POST   /api/whatsapp/templates                            → Crear plantilla
GET    /api/whatsapp/templates                            → Listar plantillas
POST   /api/whatsapp/templates/{nombre}/send              → Enviar con plantilla

POST   /api/whatsapp/evolution/instances                  → Crear instancia Evolution
GET    /api/whatsapp/evolution/instances/{id}/qrcode      → Obtener QR code
POST   /api/whatsapp/evolution/webhook                    → Webhook Evolution
```

## 5. Flujo de Mensajería

```
                    OUTGOING
┌──────────┐    ┌──────────┐    ┌─────────────────┐    ┌──────────┐
│  Panel   │───▶│ WhatsApp │───▶│  Meta Graph API  │───▶│  Cliente │
│  (Angular)│   │ Service  │    │  /messages       │    │ (WhatsApp)│
└──────────┘    └─────┬────┘    └─────────────────┘    └─────┬────┘
                      │                                       │
                      │              INCOMING                 │
                      │    ┌─────────────────┐               │
                      │◀───│  Meta Webhook   │◀──────────────┘
                      │    │  POST /webhook  │
                      │    └─────────────────┘
                      │
                      ▼
               ┌──────────────┐
               │   MongoDB    │
               │ (wa.messages)│
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │  RabbitMQ    │
               │ wa.incoming  │──▶ N8N Webhook
               │ wa.sent      │──▶ CRM Historial
               └──────────────┘
```

## 6. Casos de Borde (a definir)

- Webhook verification con token inválido
- Mensaje entrante de número no registrado como cliente
- Rate limit de Meta API excedido (429)
- Token de acceso expirado (refresh token Meta)
- Evolution API desconectada
- Reconexión automática fallida (reintentar con backoff)

## 7. Acceptance Criteria de Módulo

- [ ] Puede conectar WhatsApp Business API con phone_number_id y access_token
- [ ] Webhook recibe y procesa mensajes entrantes
- [ ] Puede enviar mensajes de texto a números válidos (593 + 9 dígitos)
- [ ] Mensajes se almacenan en MongoDB con timestamp
- [ ] Plantillas se pueden crear y enviar con variables reemplazadas
- [ ] Evolution API se conecta con QR code y reconecta automáticamente
- [ ] Chat UI en `whatsapp.html` funciona de extremo a extremo
- [ ] Eventos se publican en RabbitMQ para integraciones

## 8. Dependencias

| Depende de | Bloquea | Notas |
|---|---|---|
| HU-001 (Tenant) | — | Conexiones por tenant |
| HU-011 (Clientes) | HU-014 (Historial CRM) | Mensajes se vinculan a clientes |
| — | HU-020 (Dashboard) | KPIs de WhatsApp |

## 9. Notas Técnicas

- Evolution API como fallback cuando Meta Business API no está aprobada
- Las credenciales de WhatsApp se almacenan encriptadas (AES-256 con key en env var)
- El webhook de Meta requiere HTTPS — usar Nginx con SSL
- MongoDB indexes optimizados para queries de conversación: `{ tenant_id, from, timestamp DESC }`
