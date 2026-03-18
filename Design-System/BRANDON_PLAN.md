# BRANDON — Plan de Trabajo AutoFlow Design System
> Generado: Marzo 18, 2026

---

## ✅ Estado actual del archivo Figma

**Archivo:** AutoFlow Design System  
**URL:** https://www.figma.com/design/ZbVahREjuvar4MObRXje7H/AutoFlow-Design-System

| Elemento | Estado | Cantidad |
|----------|--------|----------|
| Páginas | ✅ Creadas | 2 (Page 1 + 🧩 Components) |
| Frames de pantallas | ✅ Creados | 8 frames (1440×900) |
| Color Styles | ✅ Creados | 14 estilos |
| Text Styles | ✅ Creados | 11 estilos |

### Frames existentes en Page 1:
1. `01 - Login`
2. `02 - Dashboard`
3. `03 - CRM / Clientes`
4. `04 - Pedidos`
5. `05 - WhatsApp Integration`
6. `06 - Reportes`
7. `07 - Configuración`
8. `08 - Perfil de Usuario`

---

## 🗓 Plan de Trabajo Priorizado

### FASE A — Foundations & Components (Días 1–2)
*Base del design system. Todo lo demás se construye sobre esto.*

| # | Tarea | Estimado |
|---|-------|----------|
| A1 | Crear componente **Button** (primary, secondary, ghost, danger + estados) | 2h |
| A2 | Crear componente **Input** (text, password, select + estados: default, focus, error) | 1.5h |
| A3 | Crear componente **Badge/Tag** (success, warning, error, info) | 45min |
| A4 | Crear componente **Card** (simple, con header, con acciones) | 1.5h |
| A5 | Crear componente **Sidebar** (navegación con ítem activo y hover) | 2h |
| A6 | Crear componente **Header** (barra superior con avatar, notificaciones, toggle) | 1h |
| A7 | Crear componente **Avatar** (con imagen, iniciales, indicador de estado) | 45min |
| A8 | Poblar página `🧩 Components` con todos los componentes organizados | 1h |

**Total Fase A: ~10.5h**

---

### FASE B — Pantallas Desktop (Días 3–5)
*Diseño real de cada pantalla usando los componentes de Fase A.*

| # | Pantalla | Referencia HTML | Estimado |
|---|----------|-----------------|----------|
| B1 | Login | login.html | 2h |
| B2 | Dashboard | dashboard.html | 4h |
| B3 | Pedidos | pedidos.html | 3h |
| B4 | CRM Clientes | crm.html | 3h |
| B5 | WhatsApp | whatsapp.html | 3h |
| B6 | Reportes | reportes.html | 3h |
| B7 | Configuración | configuracion.html | 2.5h |
| B8 | Perfil | perfil.html | 2h |

**Total Fase B: ~22.5h**

---

### FASE C — Dark Mode (Día 6)
*Variantes dark de las 8 pantallas.*

| # | Tarea | Estimado |
|---|-------|----------|
| C1 | Duplicar cada frame y aplicar tokens dark mode | 4h |
| C2 | Revisar contraste y legibilidad en dark mode | 2h |

**Total Fase C: ~6h**

---

### FASE D — Prototipo Navegable (Día 7)
*Conectar frames con flows de usuario.*

| # | Tarea | Estimado |
|---|-------|----------|
| D1 | Conectar flujo Login → Dashboard | 30min |
| D2 | Conectar navegación sidebar (todas las pantallas) | 1.5h |
| D3 | Conectar flujo Nuevo Pedido (Dashboard → Pedidos) | 1h |
| D4 | Revisar prototipo completo y compartir con Eduardo | 1h |

**Total Fase D: ~4h**

---

## 📋 Preguntas para Eduardo antes de arrancar

1. **Logo:** ¿Cuál de las 4 opciones de logo fue aprobada? (A, B, C o D) → http://100.95.120.42:8765/logos.html
2. **Dark mode:** ¿Es prioridad para el MVP o lo dejamos para v2?
3. **Móvil:** ¿Necesitamos vistas responsive (375px) o solo desktop por ahora?
4. **Flujos adicionales:** ¿Hay pantallas de onboarding, recuperar contraseña, o tour del producto?
5. **Datos reales:** ¿Los mockups deben usar el nombre real del negocio piloto o datos genéricos?

---

## 📁 Referencias

- **Prototipos HTML:** http://100.95.120.42:8765/
- **Design System specs:** FIGMA_HANDOFF.md
- **Paleta:** Primary `#4F46E5` · Accent `#06B6D4` · Fuente: Inter

---

**Estimado total: ~43 horas de diseño**  
Con dedicación full-time: ~5–6 días hábiles para entrega completa.

---

*Plan generado por Brandon (diseñador UI/UX) — EGIT Consultoría 2026*
