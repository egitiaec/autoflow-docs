# AutoFlow Design System — Figma Handoff
> Generado automáticamente · Marzo 2026

---

## 📊 Estado API REST — Qué funcionó y qué no

| Endpoint | Resultado | Notas |
|---|---|---|
| `GET /v1/files/{key}` | ✅ OK | Lee el archivo sin problema |
| `POST /v1/files/{key}/styles` | ❌ 404 Not Found | Este endpoint no existe en la REST API pública |
| `POST /v1/files/{key}/variables` | ❌ 403 Forbidden | Requiere scope `file_variables:write` — no incluido en el token tipo PAT estándar |
| `GET /v1/files/{key}/variables/local` | ❌ 403 Forbidden | Requiere `file_variables:read` — solo disponible en plan Enterprise con OAuth 2.0 |
| `POST /v1/files/{key}/nodes` | ❌ 404 Not Found | Endpoint inexistente — la REST API no soporta escritura de nodos |
| `POST /v1/files/{key}/edits` | ❌ 404 Not Found | La Edits API beta aún no es pública |

### Conclusión
La API REST de Figma es **principalmente de solo lectura** para archivos normales. Para crear nodos, estilos y variables se requiere:
1. **Figma Plugin API** (recomendado) — acceso completo al archivo desde el editor
2. **Figma Variables API** — solo disponible en plan Enterprise con OAuth 2.0, no con PAT tokens simples

---

## 🚀 Solución: Plugin de Figma

Se creó un plugin funcional en `figma-plugin/` que, al ejecutarse dentro del editor de Figma, crea automáticamente todo el design system.

### Cómo ejecutar el plugin (para Brandon)

1. Abre el archivo en Figma: `ZbVahREjuvar4MObRXje7H`
2. En el menú de Figma → **Plugins** → **Development** → **Import plugin from manifest...**
3. Selecciona el archivo `figma-plugin/manifest.json`
4. El plugin aparecerá en tu lista → haz click en **Run**
5. En ~10 segundos el plugin habrá creado:
   - 14 Color Styles en el panel de Estilos
   - 11 Text Styles tipográficos
   - 8 Screen frames (1440×900) en Page 1
   - Una página "🧩 Components" con paleta de colores y guía

---

## 🎨 Paleta de Colores AutoFlow (Completa)

### Colores Primarios
| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `AutoFlow/Primary` | Indigo 600 | `#4F46E5` | CTAs, botones principales, links activos |
| `AutoFlow/Primary Light` | Indigo 400 | `#818CF8` | Hover states, highlights, badges |
| `AutoFlow/Primary Dark` | Indigo 700 | `#4338CA` | Active states, pressed buttons |

### Colores de Acento y Estado
| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `AutoFlow/Accent` | Cyan 500 | `#06B6D4` | Elementos secundarios, íconos de acento, WhatsApp widget |
| `AutoFlow/Success` | Emerald 500 | `#10B981` | Éxito, estado activo, mensajes positivos |
| `AutoFlow/Warning` | Amber 500 | `#F59E0B` | Advertencias, pendientes, estado en proceso |
| `AutoFlow/Error` | Red 500 | `#EF4444` | Errores, eliminación, estados críticos |

### Texto
| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `AutoFlow/Text/Primary` | Gray 900 | `#111827` | Texto principal, títulos |
| `AutoFlow/Text/Muted` | Gray 500 | `#6B7280` | Texto secundario, placeholders, metadata |

### Fondos y Superficies
| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `AutoFlow/BG/Light` | Gray 50 | `#F9FAFB` | Fondo principal (light mode) |
| `AutoFlow/Surface/Light` | White | `#FFFFFF` | Cards, modals, sidebars (light mode) |
| `AutoFlow/Border` | Gray 200 | `#E5E7EB` | Bordes, divisores, líneas de tabla |
| `AutoFlow/BG/Dark` | Slate 950 | `#0F172A` | Fondo principal (dark mode) |
| `AutoFlow/Surface/Dark` | Slate 800 | `#1E293B` | Cards, sidebars (dark mode) |

---

## 📐 Tipografía AutoFlow

Fuente: **Inter** (fallback: Roboto, SF Pro)

| Estilo | Tamaño | Peso | Line Height | Uso |
|---|---|---|---|---|
| Display H1 | 48px | Bold 700 | 110% | Títulos de página principales |
| Display H2 | 36px | Bold 700 | 120% | Secciones, modals grandes |
| Display H3 | 28px | SemiBold 600 | 125% | Subtítulos de sección |
| Display H4 | 22px | SemiBold 600 | 130% | Card titles, widget headers |
| Body Large | 18px | Regular 400 | 160% | Párrafos destacados |
| Body Regular | 16px | Regular 400 | 150% | Texto general |
| Body Small | 14px | Regular 400 | 150% | Texto secundario, descripciones |
| Label Large | 14px | SemiBold 600 | 140% | Labels de formulario, badges |
| Label Small | 12px | Medium 500 | 140% | Tags, chips, metadata |
| Caption | 11px | Regular 400 | 140% | Timestamps, tooltips |
| Code | 13px | Regular 400 | 160% | Snippets de código, IDs |

---

## 🗂️ Estructura de Páginas Recomendada

```
AutoFlow Design System
├── 📄 Page 1 — Screens (8 pantallas desktop 1440×900)
├── 🧩 Components — Componentes reutilizables
├── 🎨 Foundations — Color, tipografía, spacing, iconografía
├── 📱 Mobile — Vistas responsive (375×812)
├── 🔄 Flows — Flujos de usuario y user journeys
└── 📋 Handoff Notes — Notas de desarrollo y specs
```

---

## 📱 Pantallas del Producto (8 Screens)

### Screen 1: Login (`login.html`)
**Frame:** `01 - Login` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Logo AutoFlow centrado
- Card blanca 480px de ancho, sombra suave
- Campo: Email (label + input con ícono)
- Campo: Password (label + input + toggle show/hide)
- Botón primario: "Entrar" (`#4F46E5`, full-width)
- Link secundario: "¿Olvidaste tu contraseña?"
- Footer: "© 2025 AutoFlow - EGIT Consultoría"

---

### Screen 2: Dashboard (`dashboard.html`)
**Frame:** `02 - Dashboard` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Sidebar izquierdo 240px: Logo, navegación principal, avatar usuario
- Header superior: título + fecha + botón "Nuevo Pedido"
- Grid de 4 KPI cards:
  - 📦 Total Pedidos (número grande + variación %)
  - ⚡ Pedidos Activos (número + badge color)
  - 💰 Ingresos del Mes (formato moneda)
  - 👥 Total Clientes (número + tendencia)
- Gráfica de líneas: Ventas últimos 30 días
- Tabla: Actividad reciente (últimos 5 pedidos)

---

### Screen 3: CRM / Clientes (`crm.html`)
**Frame:** `03 - CRM / Clientes` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Sidebar + header (consistente con dashboard)
- Barra de acciones: Buscador + Filtro por estado + "Nuevo Cliente"
- Tabla completa:
  - Columnas: Nombre, Email, WhatsApp, Nº Pedidos, Último Pedido, Estado, Acciones
  - Estados: Activo (verde), Inactivo (gris), VIP (dorado)
  - Row hover state
- Paginación en footer

---

### Screen 4: Pedidos (`pedidos.html`)
**Frame:** `04 - Pedidos` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Vista de tabla con filtros por estado
- Kanban opcional (tabs: Lista | Kanban)
- Columnas tabla: ID, Cliente, Productos, Total, Estado, Fecha, Acciones
- Side panel de detalle (slide-in al hacer click)
- Badges de estado: Nuevo (azul), Procesando (amarillo), Completado (verde), Cancelado (rojo)

---

### Screen 5: WhatsApp Integration (`whatsapp.html`)
**Frame:** `05 - WhatsApp Integration` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Layout de 3 columnas:
  - Izquierda 320px: Lista de conversaciones (avatar, nombre, último mensaje, hora)
  - Centro 680px: Chat activo con burbujas (cliente gris izquierda, agente azul derecha)
  - Derecha 300px: Info del contacto + pedidos relacionados
- Footer: Input de respuesta + templates rápidos + botón enviar
- Header del chat: nombre contacto + estado (En línea/Offline)

---

### Screen 6: Reportes (`reportes.html`)
**Frame:** `06 - Reportes` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Filtros de período: Hoy | 7 días | 30 días | Personalizado
- Botón "Exportar CSV"
- Gráfica de línea: Ventas por mes (últimos 12 meses)
- Gráfica de barras: Pedidos por categoría/producto
- Tabla: Top 10 Clientes (nombre, pedidos, monto total)
- Cards resumen: Ticket promedio, Tasa conversión, Clientes nuevos

---

### Screen 7: Configuración (`configuracion.html`)
**Frame:** `07 - Configuración` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Navegación lateral de secciones: Perfil | Integraciones | Notificaciones | Seguridad
- Sección Integraciones activa:
  - Card WhatsApp Business: conectado ✅ / número activo
  - Card N8N Webhooks: URL de webhook, botón probar
  - Card API Keys: mostrar/ocultar, regenerar
- Toggle switches para notificaciones
- Botón "Guardar cambios"

---

### Screen 8: Perfil de Usuario (`perfil.html`)
**Frame:** `08 - Perfil de Usuario` · 1440×900 · BG: `#F9FAFB`

Contenido:
- Hero con avatar circular grande (iniciales o foto)
- Formulario: Nombre completo, Email, Teléfono, Empresa, Cargo
- Sección Seguridad: Cambiar contraseña
- Historial de actividad reciente
- Botón "Guardar perfil"

---

## 🧩 Componentes a Crear en Figma

### Prioridad Alta
- [ ] **Button** — Primary, Secondary, Ghost, Danger (estados: default, hover, active, disabled)
- [ ] **Input** — Text, Email, Password, Number, Textarea (estados: default, focus, error, disabled)
- [ ] **Card** — Simple, con header, con acciones
- [ ] **Badge / Tag** — Success, Warning, Error, Info, Default
- [ ] **Avatar** — Con imagen, con iniciales, con indicador de estado
- [ ] **Sidebar** — Navegación vertical con grupos y hover states

### Prioridad Media
- [ ] **Table** — Header, row, row hover, row selected, paginación
- [ ] **Modal** — Confirmación, formulario, alerta
- [ ] **Toast / Notification** — Success, error, info, warning
- [ ] **Dropdown** — Simple, con íconos, con grupos
- [ ] **Tabs** — Horizontal, vertical, pill style

### Prioridad Baja
- [ ] **Chart placeholders** — Línea, barras, pie, area
- [ ] **Empty States** — Vacío, sin resultados, error 404
- [ ] **Skeleton Loaders** — Card, tabla, texto
- [ ] **Progress Bar** — Simple, con label
- [ ] **Tooltip** — Top, bottom, left, right

---

## 🔗 Prototipos HTML Locales

Los archivos HTML ya están creados y listos para previsualizar:

| Pantalla | Archivo | Ruta |
|---|---|---|
| Login | `login.html` | `autoflow-design/login.html` |
| Dashboard | `dashboard.html` | `autoflow-design/dashboard.html` |
| CRM / Clientes | `crm.html` | `autoflow-design/crm.html` |
| Pedidos | `pedidos.html` | `autoflow-design/pedidos.html` |
| WhatsApp | `whatsapp.html` | `autoflow-design/whatsapp.html` |
| Reportes | `reportes.html` | `autoflow-design/reportes.html` |
| Configuración | `configuracion.html` | `autoflow-design/configuracion.html` |
| Perfil | `perfil.html` | `autoflow-design/perfil.html` |

**Para previsualizar:** Abre cualquier archivo `.html` directamente en el navegador.

**Para importar a Figma:** 
1. Abre el HTML en Chrome a pantalla completa (1440px de ancho)
2. Screenshot con CMD+SHIFT+4 (Mac) o usa una extensión como GoFullPage
3. En Figma: Arrastra la imagen al frame correspondiente
4. Ajusta la opacidad del screenshot al 70% y rediseña por encima

---

## 📁 Archivos Entregados

```
autoflow-design/
├── FIGMA_HANDOFF.md          ← Este documento
├── figma-plugin/
│   ├── manifest.json         ← Configuración del plugin
│   └── code.js               ← Script principal del plugin (Plugin API)
├── login.html
├── dashboard.html
├── crm.html
├── pedidos.html
├── whatsapp.html
├── reportes.html
├── configuracion.html
├── perfil.html
├── shared.css                ← Estilos compartidos
├── shared.js                 ← JS compartido
└── logos.html                ← Assets de logo
```

---

## ✅ Checklist para Brandon

- [ ] Instalar el plugin desde `figma-plugin/manifest.json`
- [ ] Ejecutar el plugin → verificar 8 frames + estilos creados
- [ ] Revisar que los Color Styles aparezcan en el panel lateral
- [ ] Abrir cada HTML en el navegador para revisar el prototipo
- [ ] Capturar screenshots de cada pantalla para embeberlos en los frames de Figma
- [ ] Crear los componentes base (Button, Input, Card) en la página Components
- [ ] Compartir el archivo Figma con el equipo con permisos de "Can view"

---

*AutoFlow Design System — EGIT Consultoría · 2026*
