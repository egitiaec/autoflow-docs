// AutoFlow Design System Builder v2 - Figma Plugin

// ─── PALETTE ────────────────────────────────────────────────────────────────
const COLORS = [
  { name: "AutoFlow/Primary",       hex: "#4F46E5" },
  { name: "AutoFlow/Primary Light", hex: "#818CF8" },
  { name: "AutoFlow/Primary Dark",  hex: "#4338CA" },
  { name: "AutoFlow/Accent",        hex: "#06B6D4" },
  { name: "AutoFlow/Success",       hex: "#10B981" },
  { name: "AutoFlow/Warning",       hex: "#F59E0B" },
  { name: "AutoFlow/Error",         hex: "#EF4444" },
  { name: "AutoFlow/Text/Primary",  hex: "#111827" },
  { name: "AutoFlow/Text/Muted",    hex: "#6B7280" },
  { name: "AutoFlow/BG/Light",      hex: "#F9FAFB" },
  { name: "AutoFlow/BG/Dark",       hex: "#0F172A" },
  { name: "AutoFlow/Surface/Light", hex: "#FFFFFF" },
  { name: "AutoFlow/Surface/Dark",  hex: "#1E293B" },
  { name: "AutoFlow/Border",        hex: "#E5E7EB" },
];

const TEXT_STYLES = [
  { name: "AutoFlow/H1",      size: 48, weight: 700 },
  { name: "AutoFlow/H2",      size: 36, weight: 700 },
  { name: "AutoFlow/H3",      size: 28, weight: 600 },
  { name: "AutoFlow/H4",      size: 22, weight: 600 },
  { name: "AutoFlow/Body/Large",   size: 18, weight: 400 },
  { name: "AutoFlow/Body/Regular", size: 16, weight: 400 },
  { name: "AutoFlow/Body/Small",   size: 14, weight: 400 },
  { name: "AutoFlow/Label/Large",  size: 14, weight: 600 },
  { name: "AutoFlow/Label/Small",  size: 12, weight: 500 },
  { name: "AutoFlow/Caption",      size: 11, weight: 400 },
  { name: "AutoFlow/Code",         size: 13, weight: 400 },
];

const SCREENS = [
  { name: "01 - Login",         desc: "Pantalla de inicio de sesión con logo AutoFlow, email, password y botón Entrar.", accent: "#4F46E5" },
  { name: "02 - Dashboard",     desc: "Vista principal: sidebar nav, KPI cards (pedidos, clientes, WhatsApp, reportes), gráfica semanal, actividad reciente.", accent: "#4F46E5" },
  { name: "03 - Pedidos",       desc: "Gestión de pedidos: tabla con ID, cliente, estado (badge), fecha, monto. Filtros y paginación.", accent: "#4F46E5" },
  { name: "04 - CRM Clientes",  desc: "Lista de clientes con avatar, nombre, email, etiqueta (Nuevo/Regular/VIP). Panel detalle lateral.", accent: "#4F46E5" },
  { name: "05 - WhatsApp",      desc: "Panel de mensajería: lista de conversaciones izquierda, chat activo derecha, templates de notificación.", accent: "#25D366" },
  { name: "06 - Reportes",      desc: "Cards de reportes (diario, semanal, ventas, clientes), programación de envío automático.", accent: "#4F46E5" },
  { name: "07 - Configuracion", desc: "Tabs: General, Branding (logo+colores), Integraciones (WhatsApp/N8N), Suscripción (Pro $199/mes).", accent: "#4F46E5" },
  { name: "08 - Perfil",        desc: "Datos personales, cambio de contraseña, 2FA, preferencias de notificaciones.", accent: "#4F46E5" },
];

// ─── HELPER: hex → RGB (sin alpha — Figma solo acepta RGB en color) ──────────
function hex(h) {
  return {
    r: parseInt(h.slice(1, 3), 16) / 255,
    g: parseInt(h.slice(3, 5), 16) / 255,
    b: parseInt(h.slice(5, 7), 16) / 255,
  };
}

async function loadFont(family, style) {
  try { await figma.loadFontAsync({ family, style }); return true; }
  catch (e) { return false; }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  let colorOk = 0, textOk = 0, frameOk = 0;
  const errors = [];

  // ── 1. CARGAR FUENTES ────────────────────────────────────────────────────
  const font = "Inter";
  await loadFont(font, "Regular");
  await loadFont(font, "Medium");
  await loadFont(font, "Semi Bold");
  await loadFont(font, "Bold");

  const W = {
    400: "Regular",
    500: "Medium",
    600: "Semi Bold",
    700: "Bold",
  };

  // ── 2. COLOR STYLES ──────────────────────────────────────────────────────
  figma.notify("Creando color styles…", { timeout: 2000 });

  for (const c of COLORS) {
    try {
      const s = figma.createPaintStyle();
      s.name = c.name;
      s.paints = [{ type: "SOLID", color: hex(c.hex) }];
      colorOk++;
    } catch (e) { errors.push("Color " + c.name + ": " + e.message); }
  }

  // ── 3. TEXT STYLES ───────────────────────────────────────────────────────
  figma.notify("Creando text styles…", { timeout: 2000 });

  for (const t of TEXT_STYLES) {
    try {
      const s = figma.createTextStyle();
      s.name = t.name;
      s.fontSize = t.size;
      s.fontName = { family: font, style: W[t.weight] || "Regular" };
      textOk++;
    } catch (e) { errors.push("Text " + t.name + ": " + e.message); }
  }

  // ── 4. SCREEN FRAMES (en la página actual) ───────────────────────────────
  figma.notify("Creando frames de pantallas…", { timeout: 4000 });

  const W_FRAME = 1440;
  const H_FRAME = 900;
  const GAP = 80;
  const COLS = 2;

  for (let i = 0; i < SCREENS.length; i++) {
    const sc = SCREENS[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    try {
      // Frame principal
      const frame = figma.createFrame();
      frame.name = sc.name;
      frame.x = col * (W_FRAME + GAP);
      frame.y = row * (H_FRAME + GAP);
      frame.resize(W_FRAME, H_FRAME);
      frame.fills = [{ type: "SOLID", color: hex("#F9FAFB") }];
      frame.cornerRadius = 8;
      figma.currentPage.appendChild(frame);

      // Sidebar placeholder (240px, índigo oscuro)
      const sidebar = figma.createRectangle();
      sidebar.name = "Sidebar";
      sidebar.x = 0;
      sidebar.y = 0;
      sidebar.resize(240, H_FRAME);
      sidebar.fills = [{ type: "SOLID", color: hex("#1E1B4B") }];
      frame.appendChild(sidebar);

      // Header bar
      const header = figma.createRectangle();
      header.name = "Header";
      header.x = 240;
      header.y = 0;
      header.resize(W_FRAME - 240, 64);
      header.fills = [{ type: "SOLID", color: hex("#FFFFFF") }];
      frame.appendChild(header);

      // Línea divisora header
      const divider = figma.createRectangle();
      divider.x = 240;
      divider.y = 63;
      divider.resize(W_FRAME - 240, 1);
      divider.fills = [{ type: "SOLID", color: hex("#E5E7EB") }];
      frame.appendChild(divider);

      // Accent bar top (color primario de la pantalla)
      const accentBar = figma.createRectangle();
      accentBar.name = "Accent";
      accentBar.x = 240;
      accentBar.y = 0;
      accentBar.resize(W_FRAME - 240, 4);
      accentBar.fills = [{ type: "SOLID", color: hex(sc.accent) }];
      frame.appendChild(accentBar);

      // Content area placeholder
      const content = figma.createRectangle();
      content.name = "Content Placeholder";
      content.x = 280;
      content.y = 104;
      content.resize(W_FRAME - 320, H_FRAME - 144);
      content.fills = [{ type: "SOLID", color: hex("#F3F4F6") }];
      content.cornerRadius = 8;
      content.strokes = [{ type: "SOLID", color: hex("#E5E7EB") }];
      content.strokeWeight = 1;
      content.dashPattern = [8, 4];
      frame.appendChild(content);

      // Título del screen
      const title = figma.createText();
      title.fontName = { family: font, style: "Bold" };
      title.fontSize = 18;
      title.characters = sc.name;
      title.fills = [{ type: "SOLID", color: hex("#111827") }];
      title.x = 280;
      title.y = 76;
      frame.appendChild(title);

      // Descripción
      const desc = figma.createText();
      desc.fontName = { family: font, style: "Regular" };
      desc.fontSize = 13;
      desc.characters = sc.desc;
      desc.fills = [{ type: "SOLID", color: hex("#6B7280") }];
      desc.x = 280;
      desc.y = H_FRAME - 36;
      desc.textAutoResize = "WIDTH_AND_HEIGHT";
      frame.appendChild(desc);

      // Logo texto en sidebar
      const logo = figma.createText();
      logo.fontName = { family: font, style: "Bold" };
      logo.fontSize = 20;
      logo.characters = "⚡ AutoFlow";
      logo.fills = [{ type: "SOLID", color: hex("#FFFFFF") }];
      logo.x = 20;
      logo.y = 20;
      frame.appendChild(logo);

      frameOk++;
    } catch (e) {
      errors.push("Frame " + sc.name + ": " + e.message);
    }
  }

  // ── 5. RESULTADO ─────────────────────────────────────────────────────────
  const msg = [
    "✅ AutoFlow Design System v2",
    "  🎨 Color styles: " + colorOk + "/" + COLORS.length,
    "  ✏️  Text styles:  " + textOk  + "/" + TEXT_STYLES.length,
    "  🖥  Screen frames: " + frameOk + "/" + SCREENS.length,
    errors.length ? "  ⚠️ Errores: " + errors.length : "  Sin errores",
  ].join("\n");

  if (errors.length) console.log("Errors:", errors);
  console.log(msg);
  figma.notify(msg, { timeout: 8000 });
  figma.closePlugin(msg);
}

main().catch(e => {
  figma.closePlugin("❌ Error: " + e.message);
});
