# Tasks: Reports & Analytics

> **Module:** Reportes (005)
> **Spec:** `spec.md` | **Plan:** `plan.md`
> **Total Estimated:** 72 hours (9 working days)
> **Last Updated:** 2026-03-18

---

## Phase 1: Core Data Layer & Dashboard (24h)

### T-05.01: Project Setup & Scaffolding [2h]
**Reference:** `plan.md` §1
**Dependencies:** None
**Priority:** Critical

- [ ] Create `autoflow-reportes` Spring Boot project with dependencies: Spring Web, Spring AMQP, Spring Data JPA, Spring Data Redis, Apache POI, iText, Lombok
- [ ] Configure `application.yml` with profiles: dev, staging, prod
- [ ] Set up Docker Compose service definition (port 8084)
- [ ] Create volume mount for `/data/reports/`
- [ ] Configure `@EnableScheduling` for cleanup and cron jobs

---

### T-05.02: PostgreSQL Schema & Entities [4h]
**Reference:** `plan.md` §2
**Dependencies:** T-05.01
**Priority:** Critical

- [ ] Write Flyway migration: `reporte_job`, `reporte_schedule`, `reporte_history` tables
- [ ] Create JPA entities and repositories with custom queries
- [ ] Indexes: `(tenant_id, created_at)`, `(tenant_id, status)`, `(next_run)`

---

### T-05.03: Dashboard KPI Service [5h]
**Reference:** `spec.md` US-01, `plan.md` §4.4
**Dependencies:** T-05.02
**Priority:** Critical

- [ ] PostgreSQL aggregations: ventas_hoy/semana/mes, pedido_count, ticket_promedio, top_5_productos
- [ ] Optional channel filter
- [ ] Redis cache: `reportes:dashboard:{tenantId}:{hash}` TTL 60s
- [ ] Cache invalidation on `pedido.creado` RabbitMQ event
- [ ] Text insight generation (weekday comparison)

### T-05.04: Dashboard REST API [3h]
**Reference:** `spec.md` US-01
- [ ] `GET /api/v1/reportes/dashboard` with date/channel filters
- [ ] Response DTO with all KPIs + insights
- [ ] MockMvc + Testcontainers integration tests

---

### T-05.05: RabbitMQ Report Generation Consumer [5h]
**Reference:** `plan.md` §1, §5
**Dependencies:** T-05.01, T-05.02
**Priority:** Critical

- [ ] `reportes.generate` queue with dead-letter exchange
- [ ] Consumer flow: deserialize job → PROCESING → query data → generate file → LISTO
- [ ] `@Retryable` with 3 attempts, exponential backoff
- [ ] On exception: ERROR + DLQ

### T-05.06: Report Job API [5h]
**Reference:** `spec.md` US-02
- [ ] `POST .../generar` → 202 Accepted + job_id
- [ ] `GET .../{id}/status` → status polling
- [ ] `GET .../{id}/download` → file stream or 410 expired

---

## Phase 2: Report Generators (24h)

### T-05.07: Excel Report Generator [8h]
**Reference:** `spec.md` US-02, `plan.md` §5
**Dependencies:** T-05.05
**Priority:** High

- [ ] `ExcelReportGenerator` implementing `ReportGenerator` interface
- [ ] Sheet 1: "Detalle de Pedidos" — order rows, conditional formatting
- [ ] Sheet 2: "Resumen" — period totals, channel breakdown, summary metrics
- [ ] Header: business logo + name + date range
- [ ] `XSSFWorkbook` (xlsx), auto-size columns
- [ ] Write to `/data/reports/{tenantId}/{jobId}.xlsx`

### T-05.08: PDF Report Generator [8h]
**Reference:** `spec.md` US-02, `plan.md` §5
**Dependencies:** T-05.05
**Priority:** High

- [ ] `PdfReportGenerator` implementing `ReportGenerator` interface
- [ ] A4 portrait: gradient header, summary box, alternating-row table
- [ ] iText 7 `PdfDocument` + `Document` API
- [ ] Multi-page with automatic breaks
- [ ] Footer: "Generado por AutoFlow · Pagina X de Y"

### T-05.09: Report Data Aggregation Service [4h]
**Reference:** `plan.md` §5
- [ ] `getOrderDetails()`, `getOrderSummary()`, `getChannelBreakdown()`
- [ ] Timezone: store UTC, display America/Guayaquil
- [ ] Null-safe: empty lists, not nulls

### T-05.10: Report Cleanup Job [4h]
**Reference:** `plan.md` §6
- [ ] `@Scheduled(cron = "0 0 2 * * *")` — daily at 02:00
- [ ] Delete expired report files, update status, log cleanup

---

## Phase 3: Scheduled Reports (24h)

### T-05.11: Schedule Management CRUD [5h]
**Reference:** `spec.md` US-03
- [ ] `createSchedule`, `getSchedules`, `updateSchedule`, `deleteSchedule`
- [ ] `next_run` calculation: DIARIO, SEMANAL, QUINCENAL, MENSUAL

### T-05.12: Report Scheduler (Cron Consumer) [5h]
**Reference:** `spec.md` US-03, `plan.md` §6
- [ ] `@Scheduled` every minute: find due schedules, create jobs, wait completion
- [ ] Max concurrency: 3 concurrent report generations

### T-05.13: Report Delivery Service [6h]
**Reference:** `spec.md` US-03, `plan.md` §6
- [ ] Email delivery: subject + body + attachment via SMTP
- [ ] WhatsApp delivery: summary + document via template message
- [ ] Fallback: WhatsApp fails → email
- [ ] Retry: 3 attempts with 1min, 5min, 15min backoff

### T-05.14: Delivery History API [3h]
- [ ] `GET /api/v1/reportes/schedule/{id}/history`
- [ ] Paginated delivery records with status and error details

### T-05.15: Notification Integration [5h]
- [ ] Listen to `reporte.listo` RabbitMQ event
- [ ] Check tenant notification preferences, route to correct channel
- [ ] Dashboard notification for manual report requests

---

## Summary

| Phase | Hours | Tasks |
|-------|-------|-------|
| Phase 1: Core Data Layer & Dashboard | 24h | T-05.01 → T-05.06 |
| Phase 2: Report Generators | 24h | T-05.07 → T-05.10 |
| Phase 3: Scheduled Reports | 24h | T-05.11 → T-05.15 |
| **Total** | **72h** | **15 tasks** |

---

*Generated from spec.md and plan.md.*
