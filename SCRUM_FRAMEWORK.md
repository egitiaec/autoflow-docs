# AutoFlow — Scrum Framework

> Guía operativa para el equipo de desarrollo. Estos son los rituales y criterios que seguimos siempre.

---

## 1. Daily Standup (15 min máx)

**Hora:** 9:00 AM, todos los días hábiles
**Dónde:** Llamada remota / presencial
**Quién facilita:** Scrum Master (rota semanal)

### Formato — cada persona responde 3 preguntas:

1. **¿Qué hice ayer?** → Logros concretos, commits, PRs mergeados, tareas cerradas
2. **¿Qué haré hoy?** → HUs específicas con ID, no "trabajar en el backend"
3. **¿Tengo bloqueos?** → Sí/No + descripción concreta. Si hay bloqueo, quién se necesita

### Reglas:
- **NO** se discuten soluciones técnicas en detalle → se saca a post-standup
- **NO** se reporta progreso genérico ("avancé", "sigo trabajando")
- **NO** se esperan más de 15 min
- Si un bloqueo involucra a otra persona → se asigna **post-standup** inmediato
- El SM toma notas de bloqueos en el Sprint Tracker

### Ejemplo correcto:
> "Ayer mergeé el PR de autenticación (AF-102), hoy empiezo AF-103 (login con JWT), bloqueo: necesito que Juan defina el schema de users en la DB."

### Ejemplo incorrecto:
> "Ayer estuve en el módulo de usuarios, hoy sigo con eso, no tengo problemas."

---

## 2. Sprint Retrospective (30-45 min al cierre de sprint)

**Cuándo:** Último día del sprint, después del Review
**Quién:** Todo el equipo (incluye SM y PO)

### Template:

#### 🟢 ¿Qué salió bien?
- Máximo 3-5 puntos
- Con evidencia concreta ("reducimos el lead time de deployments de 2h a 15min")
- Reconocer logros individuales

#### 🟡 ¿Qué podemos mejorar?
- Máximo 3-5 puntos
- Enfocarse en procesos, no en personas
- Ser específico ("la review de PRs tarda 2 días" → no "las reviews son lentas")

#### 🔴 ¿Qué dejamos de hacer?
- Prácticas que no agregaron valor
- Reuniones innecesarias, herramientas que no usamos

#### ✅ Acciones concretas (máximo 3)
Formato: **Qué → Quién → Cuándo**

| Acción | Responsable | Para |
|--------|-------------|------|
| Crear checklist de PR | @juan | Antes de S3 |
| Mover daily a Slack async si no hay bloqueos | @sm | S3 en adelante |
| Automatizar lint en CI | @maria | S2 |

> **Regla:** No más de 3 acciones por sprint. Más que eso no se implementan.

---

## 3. Sprint Review (45-60 min al cierre de sprint)

**Cuándo:** Último día del sprint, antes de la Retro
**Quién:** Equipo dev + stakeholders (PO, clientes si aplica)

### Demo Checklist:
- [ ] Cada HU Done tiene un demo preparado (máx 5 min por HU)
- [ ] Entorno de staging actualizado con los cambios
- [ ] Datos de prueba preparados (no datos reales de producción)
- [ ] Flujos happy path funcionando end-to-end
- [ ] Known issues listos para comunicar (no sorpresas)

### Flujo del Review:
1. **(5 min)** SM presenta el Sprint Goal y resumen de HUs completadas
2. **(30 min)** Demos por HU (orden: mayor valor de negocio primero)
3. **(10 min)** Feedback de stakeholders → se captura en notas
4. **(5 min)** Acuerdos y próximos pasos → backlog refinado

### Stakeholders y su rol:
| Stakeholder | Participación |
|-------------|---------------|
| Product Owner | Aprueba/Rechaza funcionalidad. Define prioridades |
| Cliente(s) | Feedback sobre UX y utilidad. No define tech specs |
| Equipo Dev | Presenta, explica decisiones técnicas si se pregunta |

---

## 4. Velocity Tracking

### Métricas que medimos:
- **Story Points planificados** (al inicio del sprint)
- **Story Points completados** (solo HUs 100% Done según Definition of Done)
- **Velocity promedio** (rolling de últimos 3 sprints)
- **Sprint commitment ratio** = Completados / Planificados

### Proceso:
1. **Día 0 (Planning):** Se estiman HUs, se suman SP del sprint → commitment
2. **Diario:** Se actualizan estados en Sprint Tracker
3. **Último día:** Se cuentan SP de HUs Done → velocity real
4. **Sprint N+1:** Se usa velocity promedio para planificar capacity

### Reglas:
- Si un HU queda In Progress al cierre → NO cuenta para velocity
- Si un HU se partial-deliver (acuerdo con PO) → cuenta mitad de SP
- No forzar cierre de HU para "cumplir la meta" → calidad > quantity
- After sprint 2, recalcular capacity real si hay consistent under/over-commitment

### Gráfico Burndown (en Sprint Tracker):
- X = Días del sprint (1-10)
- Y = Story Points restantes
- Línea ideal = descendente lineal de total SP a 0
- Línea real = datos reales de SP restantes por día

---

## 5. Definition of Ready (DoR)

**Una HU puede entrar a un sprint SOLO si cumple TODOS estos criterios:**

- [ ] Título claro (qué hace, para quién)
- [ ] Historia escrita con formato: "Como [usuario], quiero [acción], para [beneficio]"
- [ ] Criterios de aceptación definidos (mínimo 3, verificables)
- [ ] Dependencias identificadas (HUs bloqueantes, APIs externas, otros equipos)
- [ ] Estimación completada por el equipo (Planning Poker)
- [ ] Diseño UI/UX adjunto (wireframe o mockup si aplica)
- [ ] Datos de prueba disponibles o planificados
- [ ] Tamaño ≤ 8 SP (si es más grande → se divide)

**Si una HU no cumple DoR → se devuelve al backlog. No se empieza "a medias".**

---

## 6. Definition of Done (DoD)

**Una HU está DONE solo cuando:**

- [ ] Código escrito y passa todos los tests unitarios (coverage ≥ 80%)
- [ ] Tests de integración ejecutados y pasando
- [ ] Code review aprobada por al menos 1 otro dev (no auto-approve)
- [ ] CI/CD pipeline verde (build + tests + lint)
- [ ] Deployado a ambiente de staging exitosamente
- [ ] Documentación actualizada (README del módulo, API docs si aplica)
- [ ] Acceptance criteria verificados por QA/PO
- [ ] Sin warnings críticos en SonarQube (bugs, vulnerabilities = 0)
- [ ] Feature flag configurado si el feature es sensible
- [ ] Logica de error manejada (no solo happy path)

### Reglas adicionales:
- El deploy a staging debe poder hacerse con un click (CI/CD automático)
- Si hay un bug encontrado post-Done dentro del sprint → se reabre la HU
- Si hay un bug encontrado en sprint siguiente → se crea nueva HU de bug con prioridad

---

## 7. Blockers Protocol

### Niveles de escalación:

**Nivel 1 — Auto (0-2h)**
- El dev intenta resolverlo solo
- Busca en docs, Stack Overflow, código existente
- Si no resuelve en 2h → escala

**Nivel 2 — Equipo (2-4h)**
- Pregunta en el canal del equipo (Slack/Teams)
- Pair programming session si es técnico
- El SM facilita conexión con quien sabe
- Si no resuelve en 4h → escala

**Nivel 3 — Externo (4-24h)**
- SM contacta a la persona/equipo externo necesario
- Se registra el bloqueo formalmente con: descripción, impacto, desde cuándo
- PO es informado si el bloqueo amenaza el sprint goal
- SLA de respuesta: 24h hábiles

**Nivel 4 — Management (24h+)**
- SM escala a Eduardo (fundador/CTO)
- Se evalúa replanificación del sprint
- Se negocia con PO si se reduce scope del sprint goal

### Registro de bloqueos:
Cada bloqueo se registra en Sprint Tracker con:
- ID del bloqueo
- HU afectada
- Descripción concreta
- Nivel actual de escalación
- Hora de detección
- Persona asignada a resolver
- Estado: Abierto / En Progreso / Resuelto

### SLA de resolución:
| Nivel | Max Resolution Time | Escala si no se resuelve |
|-------|--------------------|-----------------------|
| 1 | 2h | → Nivel 2 |
| 2 | 4h | → Nivel 3 |
| 3 | 24h | → Nivel 4 |
| 4 | 48h | Replanificación |

---

## Referencia Rápida

| Ritual | Frecuencia | Duración | Quién |
|--------|-----------|----------|-------|
| Daily Standup | Diario | 15 min | Equipo completo |
| Sprint Planning | Inicio sprint | 2-4h | Equipo + PO |
| Sprint Review | Fin sprint | 45-60 min | Equipo + stakeholders |
| Sprint Retro | Fin sprint | 30-45 min | Equipo completo |
| Backlog Refinement | Mitad sprint | 1-2h | Equipo + PO |

---

*Documento vivo. Se actualiza en cada Retro si hay mejoras al proceso.*
*Última actualización: 2026-03-18*
