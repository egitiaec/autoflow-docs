# AutoFlow — Sprint Tracker

> Copiar este template al inicio de cada sprint. Actualizar diariamente.

---

## Sprint Info

- **Sprint #:** [Ej: Sprint 1]
- **Fechas:** [DD/MM/AAAA] → [DD/MM/AAAA]
- **Sprint Goal:** [Objetivo claro y medible del sprint]
- **Velocity Promedio:** [SP de sprints anteriores, usar 0 para S1]
- **Capacity Plan:** [SP planificados para este sprint]

---

## User Stories

| ID | Título | SP | Estado | Assignee | Bloqueado? |
|----|--------|----|--------|----------|------------|
| AF-101 | [Título de HU] | 3 | To Do | @dev1 | No |
| AF-102 | [Título de HU] | 5 | In Progress | @dev2 | No |
| AF-103 | [Título de HU] | 3 | To Do | @dev3 | Sí — AF-102 |
| AF-104 | [Título de HU] | 8 | Review | @dev1 | No |
| AF-105 | [Título de HU] | 2 | Done | @dev2 | No |

### Estados posibles:
- **To Do** → No empezada, cumple Definition of Ready
- **In Progress** → En desarrollo
- **Review** → PR creada, esperando code review
- **Done** → Mergeada, deployed a staging, cumple Definition of Done

---

## Burndown Chart — Data Points

| Día | Fecha | SP Restantes | Notas |
|-----|-------|-------------|-------|
| 0 | DD/MM | [total] | Sprint planning completado |
| 1 | DD/MM | [restantes] | |
| 2 | DD/MM | [restantes] | |
| 3 | DD/MM | [restantes] | |
| 4 | DD/MM | [restantes] | |
| 5 | DD/MM | [restantes] | Mitad del sprint |
| 6 | DD/MM | [restantes] | |
| 7 | DD/MM | [restantes] | |
| 8 | DD/MM | [restantes] | |
| 9 | DD/MM | [restantes] | |
| 10 | DD/MM | [restantes] | Sprint end |

### Línea Ideal:
```
SP ideal por día = Total_SP / 10
```

### Visualización (ASCII):
```
SP
 |█
 |██
 |███
 |████
 |█████
 |██████
 |███████
 |████████
 |█████████
 |██████████
 +------------------ Días
   0  1  2  3  4  5  6  7  8  9  10
```
Marcar con `✗` los puntos reales para ver desviación vs plan.

---

## Notas de Daily Standup

### Día [X] — [DD/MM/AAAA]

| Persona | Ayer | Hoy | Bloqueos |
|---------|------|-----|----------|
| @dev1 | | | |
| @dev2 | | | |
| @dev3 | | | |
| @dev4 | | | |

**Acciones post-standup:**
- [ ] [Acción] → @quien → Para cuándo

---

### Día [X] — [DD/MM/AAAA]

| Persona | Ayer | Hoy | Bloqueos |
|---------|------|-----|----------|
| @dev1 | | | |
| @dev2 | | | |
| @dev3 | | | |
| @dev4 | | | |

**Acciones post-standup:**
- [ ] [Acción] → @quien → Para cuándo

---

## Bloqueos Activos

| ID | HU | Descripción | Nivel | Desde | Asignado | Estado |
|----|----|-------------|-------|-------|----------|--------|
| BLK-01 | AF-103 | [Descripción concreta] | 2 - Equipo | DD/MM HH:MM | @persona | Abierto |
| BLK-02 | AF-105 | [Descripción] | 3 - Externo | DD/MM HH:MM | @persona | En Progreso |

### Niveles:
- **1 - Auto** → Dev resolviendo solo (SLA: 2h)
- **2 - Equipo** → Escalado al equipo (SLA: 4h)
- **3 - Externo** → Requiere persona/equipo externo (SLA: 24h)
- **4 - Management** → Escalado a leadership (SLA: 48h)

---

## Sprint Summary (completar al cierre)

| Métrica | Valor |
|---------|-------|
| SP Planificados | [X] |
| SP Completados | [X] |
| Velocity | [X] |
| Commitment Ratio | [X]% |
| HUs Done | [X] / [total] |
| HUs Carry Over | [X] |
| Bloqueos Resueltos | [X] |
| Bloqueos Pendientes | [X] |

---

*Template v1.0 — AutoFlow Scrum Framework*
*Copiar y renombrar: SPRINT_01_TRACKER.md, SPRINT_02_TRACKER.md, etc.*
