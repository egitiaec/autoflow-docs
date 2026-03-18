# Feature: Reportes — Dashboard, Exportación y Scheduling

> Módulo: Reportes
> HUs cubiertas: HU-020, HU-021, HU-022
> Prototipo visual: `reportes.html` (dashboard de métricas, reportes programados)
> Estado: 🟡 Draft — Pendiente de aprobación
> Última actualización: 2026-03-18

## 1. Contexto y Justificación

El módulo de Reportes proporciona a las PYMEs visibilidad sobre sus ventas y operaciones. Incluye un dashboard con KPIs en tiempo real (ventas del día, semana, mes, ticket promedio, productos top), exportación de reportes detallados en Excel/PDF, y programación de reportes automáticos que llegan por WhatsApp o email.

El prototipo `reportes.html` muestra tarjetas de reportes disponibles (Ventas, Productos, Clientes, WhatsApp) con opciones de frecuencia, toggle de activación/desactivación, y programación (diario 8am, semanal lunes 8am, mensual primer día 8am).

## 2. User Stories (resumen)

### US-1: Dashboard de ventas (HU-020)
- GET `/api/reportes/dashboard` con KPIs: ventas_hoy, ventas_semana, ventas_mes, pedido_count_hoy, ticket_promedio, top_5_productos
- Cache Redis 60s
- Filtros opcionales: rango de fechas, canal
- Response < 500ms con 10,000+ pedidos

### US-2: Reporte exportable (HU-021)
- POST `/api/reportes/ventas/generar` — job asíncrono (retorna report_id inmediato)
- Parámetros: desde, hasta, formato (EXCEL|PDF), agrupacion (DIA|SEMANA|MES), canal
- GET `/api/reportes/{id}/download` — descarga cuando status=LISTO
- Excel con Apache POI (header logo, tabla, resumen)
- PDF con iText (A4, tabla alternating rows)
- Reports expiran después de 24h

### US-3: Reportes programados (HU-022)
- POST `/api/reportes/schedule` — crea reporte programado
- Frecuencia: DIARIO (8am), SEMANAL (lunes 8am), MENSUAL (1er día 8am)
- Destino: WhatsApp (resumen + archivo) o Email (con adjunto)
- Retry 3 veces con backoff exponencial si falla
- Historial de envíos

## 3. Modelo de Datos

### PostgreSQL

```sql
CREATE TABLE reporte_jobs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    tipo VARCHAR(30) NOT NULL,           -- VENTAS, PRODUCTOS, CLIENTES
    formato VARCHAR(10) NOT NULL,        -- EXCEL, PDF
    parametros_json JSONB NOT NULL,      -- {desde, hasta, agrupacion, canal}
    status VARCHAR(20) DEFAULT 'PROCESANDO', -- PROCESANDO, LISTO, ERROR
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    expires_at TIMESTAMP NOT NULL,       -- created_at + 24h
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE reporte_schedules (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    tipo_reporte VARCHAR(30) NOT NULL,
    frecuencia VARCHAR(20) NOT NULL,     -- DIARIO, SEMANAL, MENSUAL
    destino VARCHAR(20) NOT NULL,        -- WHATSAPP, EMAIL
    recipient VARCHAR(255) NOT NULL,     -- phone o email
    parametros_json JSONB NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 4. API Contract (resumen)

```
GET    /api/reportes/dashboard                               → KPIs en tiempo real
POST   /api/reportes/ventas/generar                          → Crear job de reporte
GET    /api/reportes/{id}/status                             → Estado del job
GET    /api/reportes/{id}/download                           → Descargar archivo
POST   /api/reportes/schedule                                → Crear reporte programado
GET    /api/reportes/schedule                                → Listar schedules
PUT    /api/reportes/schedule/{id}                           → Actualizar schedule
DELETE /api/reportes/schedule/{id}                           → Eliminar schedule
GET    /api/reportes/schedule/{id}/history                   → Historial de envíos
```

## 5. Flujo Asíncrono de Generación

```
POST /reportes/ventas/generar
       │
       ▼
   Crear ReporteJob (status=PROCESANDO)
   Publicar evento en RabbitMQ cola: reportes.generate
       │
       ▼
   Retornar { reportId, status: "PROCESANDO" }
       │
       ▼ (async) ──▶  Consumer lee cola
       │                  │
       │                  ▼
       │              Ejecutar query PostgreSQL (agregaciones)
       │                  │
       │                  ▼
       │              Generar Excel/PDF (Apache POI / iText)
       │                  │
       │                  ▼
       │              Guardar en /data/reports/{tenantId}/{reportId}.xlsx
       │                  │
       │                  ▼
       │              Actualizar job: status=LISTO, file_path, completed_at
       │
       ▼ (frontend poll)
   GET /reportes/{id}/status → LISTO
       │
       ▼
   GET /reportes/{id}/download → stream archivo
```

## 6. Dashboard Query Performance

```sql
-- Optimizado con índices en pedidos(tenant_id, created_at, estado)
SELECT
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as pedidos_hoy,
  SUM(total) FILTER (WHERE created_at >= CURRENT_DATE) as ventas_hoy,
  SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as ventas_semana,
  SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as ventas_mes,
  AVG(total) as ticket_promedio
FROM pedidos
WHERE tenant_id = :tenantId AND estado != 'CANCELADO';
```

## 7. Acceptance Criteria de Módulo

- [ ] Dashboard retorna KPIs con datos correctos
- [ ] Cache Redis funciona (60s TTL)
- [ ] Generación de reporte Excel funciona (Apache POI)
- [ ] Generación de reporte PDF funciona (iText)
- [ ] Job asíncrono: status cambia de PROCESANDO a LISTO
- [ ] Descarga funciona cuando status=LISTO
- [ ] Reports expiran después de 24h
- [ ] Reportes programados se generan en horario correcto
- [ ] Envío por WhatsApp funciona (resumen + archivo adjunto)
- [ ] Retry con backoff si falla envío
- [ ] Vista de `reportes.html` se renderiza correctamente

## 8. Dependencias

| Depende de | Bloquea | Notas |
|---|---|---|
| HU-006 (Pedidos) | — | KPIs se derivan de pedidos |
| HU-017 (WhatsApp) | HU-022 (envío WA) | Reportes programados vía WA |
| HU-018 (Plantillas) | HU-022 | Mensajes con plantillas |

## 9. Notas Técnicas

- Reportes se generan en thread pool separado (no bloquean request thread)
- MinIO/S3 para almacenamiento de archivos generados
- Limpieza nocturna de reports expirados (scheduled job)
- Chart.js server-side (headless browser) o imagen generada con Java (JFreeChart)
