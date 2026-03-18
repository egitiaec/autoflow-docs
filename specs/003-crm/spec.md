# Feature: CRM & Customer Management

> **Module:** CRM (003)
> **HU Coverage:** HU-011, HU-012, HU-013, HU-014, HU-015
> **Status:** 📋 Placeholder — Pending Spec
> **Last Updated:** 2026-03-18
> **Visual Reference:** `autoflow-design/crm.html`

---

## 1. Context & Justification

Customer management with Ecuador-specific ID validation (cédula, RUC), segmentation tags, and unified interaction timeline.

---

## 2. User Stories (from PRODUCT_BACKLOG.md)

| HU | Story | Priority |
|----|-------|----------|
| HU-011 | Registrar cliente con datos ecuatorianos | Alta |
| HU-012 | Buscar y listar clientes | Alta |
| HU-013 | Etiquetar clientes | Media |
| HU-014 | Historial de interacciones del cliente | Media |
| HU-015 | Notas manuales sobre clientes | Baja |

---

## 3. Pending

> ⚠️ Dual-write pattern (PostgreSQL + MongoDB), cédula validation, timeline aggregation.

**Next Steps:** Full `spec.md`, `plan.md`, `tasks/tasks.md`.

*Refer to `PRODUCT_BACKLOG.md` HU-011 through HU-015 for source material.*
