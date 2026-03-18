# Feature: Configuración — Branding, Planes, Integraciones y Onboarding

> Módulo: Configuración
> HUs cubiertas: HU-023, HU-024, HU-025, HU-026, HU-027
> Prototipo visual: `configuracion.html` (sidebar nav con secciones: Branding, Planes, Integraciones, Notificaciones, Onboarding)
> Estado: 🟡 Draft — Pendiente de aprobación
> Última actualización: 2026-03-18

## 1. Contexto y Justificación

El módulo de Configuración es el centro de control para cada tenant. Permite personalizar branding (logo, colores, nombre comercial), gestionar el plan de suscripción, configurar integraciones con N8N, establecer preferencias de notificaciones, y completar el onboarding wizard. Este módulo habilita la multi-tenancy de branding y la personalización del panel para cada PYME.

El prototipo `configuracion.html` presenta una sidebar con secciones (Empresa, Branding, Planes, Integraciones, Notificaciones, Onboarding) y un área de contenido principal con formularios y controles.

## 2. User Stories (resumen)

### US-1: Branding del tenant (HU-023)
- PUT `/api/config/branding` — upload logo (MinIO/S3), colores hex, nombre comercial, slogan
- Logo: thumbnail 200x200 generado automáticamente
- GET `/api/config/branding/{slug}` — acceso público con ETag para CDN
- Validación de contraste WCAG AA

### US-2: Planes y suscripción (HU-024)
- GET `/api/config/subscription` — plan actual, features, fecha renovación
- PUT `/api/config/subscription/upgrade` — cambiar plan (solo platform admin)
- Límites por plan: usuarios_max, pedidos_mes, storage_mb, rate_limit
- Historial de cambios en `subscription_history`

### US-3: Integraciones N8N (HU-025)
- GET/POST `/api/config/integrations/n8n` — estado conexión y workflows activos
- POST `/api/config/integrations/n8n/test` — prueba conexión
- Webhook trigger genérico: POST `/api/config/integrations/n8n/webhook/{tenant_id}/{event}`
- Eventos: `pedido.creado`, `pedido.estado.changed`, `cliente.registrado`, `inventario.bajo`
- HMAC-SHA256 para firmar webhooks

### US-4: Notificaciones internas (HU-026)
- GET/PUT `/api/config/notifications` — preferencias por evento y canal
- Eventos: pedido.nuevo, pedido.cancelado, inventario.bajo, pago.recibido
- Canales: email, WhatsApp, dashboard (push)
- Frecuencia: inmediato o digest diario (8am)
- POST `/api/config/notifications/test` — envío de prueba

### US-5: Onboarding wizard (HU-027)
- Wizard 5 pasos: (1) Datos empresa, (2) Branding, (3) WhatsApp, (4) Primer producto, (5) Primer pedido
- Estado: `tenant.onboarding_step` (0-5)
- Skip option excepto paso 1
- Al completar paso 5 → tenant pasa a estado ACTIVO
- GET `/api/config/onboarding/status` — paso actual y completion %

## 3. Modelo de Datos

### PostgreSQL

```sql
-- Branding (ya en Gateway, pero referencia)
-- tenant_branding: id, tenant_id, logo_url, logo_thumb_url, nombre_comercial,
--   color_primario, color_secundario, slug, slogan

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'BASIC',  -- BASIC, PRO, ENTERPRISE
    estado VARCHAR(20) DEFAULT 'ACTIVE',        -- ACTIVE, PAST_DUE, CANCELLED
    fecha_inicio DATE NOT NULL,
    fecha_renovacion DATE NOT NULL,
    features_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscription_history (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_anterior VARCHAR(20),
    plan_nuevo VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE n8n_integrations (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    api_key_enc TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    last_health_check TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    evento VARCHAR(50) NOT NULL,
    canal VARCHAR(20) NOT NULL,           -- EMAIL, WHATSAPP, DASHBOARD
    frecuencia VARCHAR(20) DEFAULT 'IMMEDIATE', -- IMMEDIATE, DAILY_DIGEST
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, evento, canal)
);
```

## 4. API Contract (resumen)

```
PUT    /api/config/branding                                   → Actualizar branding
GET    /api/config/branding/{slug}                            → Branding público

GET    /api/config/subscription                               → Plan actual
PUT    /api/config/subscription/upgrade                       → Cambiar plan (admin platform)

GET    /api/config/integrations/n8n                           → Estado N8N
POST   /api/config/integrations/n8n/test                      → Test conexión
POST   /api/config/integrations/n8n/webhook/{tenantId}/{event} → Trigger N8N

GET    /api/config/notifications                              → Preferencias
PUT    /api/config/notifications                              → Actualizar preferencias
POST   /api/config/notifications/test                         → Envío de prueba

GET    /api/config/onboarding/status                          → Estado wizard
PUT    /api/config/onboarding/step/{step}/complete            → Completar paso
```

## 5. Branding Flow

```
PUT /config/branding (multipart: logo file + JSON fields)
       │
       ▼
   Upload logo a MinIO: autoflow-branding/{tenantId}/logo.png
       │
       ▼
   Generar thumbnail 200x200 (Thumbnailator o similar)
   Upload thumbnail: autoflow-branding/{tenantId}/logo_thumb.png
       │
       ▼
   Guardar URLs en tenant_branding table
       │
       ▼
   GET /config/branding/{slug} → retorna con ETag header
   (Angular usa para personalizar colores y logo del panel)
```

## 6. N8N Webhook Signing

```java
public boolean verifyWebhookSignature(String payload, String signature, String secret) {
    String expected = HMAC_SHA256.hex(secret, payload);
    return MessageDigest.isEqual(
        expected.getBytes(), signature.getBytes()
    );
}
```

## 7. Onboarding State Machine

```
Step 0 (INIT) ──▶ Step 1 (DATOS_EMPRESA) ──▶ Step 2 (BRANDING)
       │                                           │
       │                                           ▼
       │                                   Step 3 (WHATSAPP)
       │                                           │
       │                                           ▼
       │                                   Step 4 (PRODUCTO)
       │                                           │
       │                                           ▼
       └──────────────────────────────▶ Step 5 (PEDIDO_PRUEBA)
                                              │
                                              ▼
                                        tenant.estado = ACTIVO
                                        tenant.onboarding_completed = TRUE
```

## 8. Acceptance Criteria de Módulo

- [ ] Logo se sube, se genera thumbnail, y es accesible por slug
- [ ] Colores hex se validan y aplican al panel (Angular consume branding API)
- [ ] Plan se puede cambiar (solo platform admin)
- [ ] Límites por plan se aplican en rate limiting (Gateway)
- [ ] Conexión N8N se puede probar
- [ ] Webhooks de eventos se firman con HMAC-SHA256
- [ ] Preferencias de notificación se guardan y leen correctamente
- [ ] Onboarding wizard guía al usuario en 5 pasos
- [ ] Al completar paso 5, tenant se marca como ACTIVO
- [ ] Vista de `configuracion.html` se renderiza correctamente

## 9. Dependencias

| Depende de | Bloquea | Notas |
|---|---|---|
| HU-001 (Tenant) | — | Configuración por tenant |
| HU-016 (WhatsApp) | HU-027 paso 3 | Onboarding incluye conectar WA |
| HU-010 (Productos) | HU-027 paso 4 | Onboarding incluye primer producto |
| HU-006 (Pedidos) | HU-027 paso 5 | Onboarding incluye primer pedido |
| HU-003 (Rate Limit) | HU-024 | Cambio de plan invalida cache rate limits |

## 10. Notas Técnicas

- Logo storage en MinIO bucket `autoflow-branding` con path `{tenantId}/logo.png`
- Thumbnail generado con net.coobird:thumbnailator
- El endpoint público `/branding/{slug}` NO requiere autenticación (el frontend lo consume antes del login para personalizar la página de login)
- N8N integration health check se ejecuta cada 5 minutos vía scheduled task
