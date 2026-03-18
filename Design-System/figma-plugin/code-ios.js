// ============================================================
// AutoFlow Design System — iOS UI Kit Plugin
// iPhone 390×844 · Safe Areas · iOS Patterns
// Página: "📱 iOS Screens"
// ============================================================

// ── Color helpers ──────────────────────────────────────────
function hex(h) {
  var x = h.replace('#', '');
  return {
    r: parseInt(x.slice(0, 2), 16) / 255,
    g: parseInt(x.slice(2, 4), 16) / 255,
    b: parseInt(x.slice(4, 6), 16) / 255,
  };
}
function solid(h, opacity) {
  var fill = { type: 'SOLID', color: hex(h) };
  if (opacity !== undefined) fill.opacity = opacity;
  return [fill];
}
function gradientLinear(h1, h2, angleDeg) {
  var a = ((angleDeg || 135) * Math.PI) / 180;
  var c = Math.cos(a), s = Math.sin(a);
  return [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [c, s, (1 - c) / 2 - s / 2],
      [-s, c, s / 2 + (1 - c) / 2],
    ],
    gradientStops: [
      { position: 0, color: Object.assign({}, hex(h1), { a: 1 }) },
      { position: 1, color: Object.assign({}, hex(h2), { a: 1 }) },
    ],
  }];
}
function strokeFill(h) { return [{ type: 'SOLID', color: hex(h) }]; }

// ── iPhone dimensions ──────────────────────────────────────
var PH = { W: 390, H: 844 };
// Safe areas (iPhone 14 style)
var SAFE = { top: 59, bottom: 34 };  // status bar + home indicator
// Navigation bar height
var NAV_H = 44;
// Tab bar height
var TAB_H = 83;
// Usable content height
var CONTENT_TOP = SAFE.top + NAV_H;  // 103
var CONTENT_H = PH.H - CONTENT_TOP - TAB_H - SAFE.bottom;  // 844-103-83-34 = 624

// ── Node creators ──────────────────────────────────────────
function mkRect(parent, x, y, w, h, fillHex, opts) {
  try {
    var r = figma.createRectangle();
    parent.appendChild(r);
    r.x = x; r.y = y;
    r.resize(Math.max(w, 1), Math.max(h, 1));
    if (fillHex) r.fills = solid(fillHex);
    else r.fills = [];
    if (opts) {
      if (opts.fills) r.fills = opts.fills;
      if (opts.radius !== undefined) r.cornerRadius = opts.radius;
      if (opts.stroke) { r.strokes = strokeFill(opts.stroke); r.strokeWeight = opts.strokeW || 1; }
      if (opts.opacity !== undefined) r.opacity = opts.opacity;
    }
    return r;
  } catch (e) { return null; }
}

function mkEllipse(parent, x, y, w, h, fillHex) {
  try {
    var e = figma.createEllipse();
    parent.appendChild(e);
    e.x = x; e.y = y;
    e.resize(Math.max(w, 1), Math.max(h, 1));
    if (fillHex) e.fills = solid(fillHex);
    return e;
  } catch (e2) { return null; }
}

function mkText(parent, x, y, txt, size, weight, colorHex, opts) {
  try {
    var t = figma.createText();
    parent.appendChild(t);
    t.fontName = { family: 'Inter', style: weight || 'Regular' };
    t.fontSize = size || 14;
    t.fills = solid(colorHex || '#111827');
    t.characters = String(txt);
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    t.x = x; t.y = y;
    if (opts && opts.align) t.textAlignHorizontal = opts.align;
    return t;
  } catch (e) { return null; }
}

function mkFrame(parent, x, y, w, h, fillHex, opts) {
  try {
    var f = figma.createFrame();
    if (parent) parent.appendChild(f);
    f.x = x; f.y = y;
    f.resize(Math.max(w, 1), Math.max(h, 1));
    f.clipsContent = true;
    if (fillHex) f.fills = solid(fillHex);
    else f.fills = [];
    if (opts) {
      if (opts.fills) f.fills = opts.fills;
      if (opts.radius !== undefined) f.cornerRadius = opts.radius;
      if (opts.stroke) { f.strokes = strokeFill(opts.stroke); f.strokeWeight = opts.strokeW || 1; }
    }
    return f;
  } catch (e) { return null; }
}

function mkBadge(parent, x, y, label, bgHex, textHex) {
  try {
    var g = figma.createFrame();
    parent.appendChild(g);
    g.fills = solid(bgHex || '#ECFDF5');
    g.cornerRadius = 20;
    g.x = x; g.y = y;
    g.resize(60, 22);
    var t = figma.createText();
    g.appendChild(t);
    t.fontName = { family: 'Inter', style: 'SemiBold' };
    t.fontSize = 10;
    t.fills = solid(textHex || '#059669');
    t.characters = label;
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    t.x = 8; t.y = 4;
    return g;
  } catch (e) { return null; }
}

// ── iOS Status Bar ─────────────────────────────────────────
// Simplified — shows time + battery/signal on dark or light bg
function drawStatusBar(parent, y, dark) {
  var textColor = dark ? '#FFFFFF' : '#111827';
  mkText(parent, 20,  y + 16, '9:41', 15, 'SemiBold', textColor);
  mkText(parent, 332, y + 16, '●●●  WiFi  🔋', 12, 'Regular', textColor);
}

// ── iOS Navigation Bar ─────────────────────────────────────
function drawNavBar(parent, y, title, showBack, bgHex, textColor) {
  var bg = bgHex || '#FFFFFF';
  var tc = textColor || '#111827';
  mkRect(parent, 0, y, PH.W, NAV_H, bg);
  // Title centered
  mkText(parent, 0, y + 12, title, 17, 'SemiBold', tc, { align: 'CENTER' });
  // Resize to full width for center effect
  // (Figma text with CENTER align needs fixed width)
  // Use approximate centering manually
  if (showBack) {
    mkText(parent, 16, y + 12, '< Volver', 15, 'Regular', '#4F46E5');
  }
  // Separator
  mkRect(parent, 0, y + NAV_H - 1, PH.W, 1, '#E5E7EB');
}

// ── iOS Tab Bar ─────────────────────────────────────────────
var TAB_ITEMS = [
  { icon: '▦',  label: 'Dashboard', key: 'dashboard' },
  { icon: '📦', label: 'Pedidos',   key: 'pedidos'   },
  { icon: '👥', label: 'CRM',       key: 'crm'       },
  { icon: '💬', label: 'WhatsApp',  key: 'whatsapp'  },
  { icon: '☰',  label: 'Más',      key: 'more'      },
];

function drawTabBar(parent, activeKey) {
  var tby = PH.H - TAB_H;
  mkRect(parent, 0, tby, PH.W, TAB_H, '#FFFFFF', { stroke: '#E5E7EB' });
  // Home indicator
  mkRect(parent, 130, tby + TAB_H - 12, 130, 4, '#111827', { radius: 2, opacity: 0.2 });

  var tabW = PH.W / TAB_ITEMS.length;
  for (var i = 0; i < TAB_ITEMS.length; i++) {
    var item = TAB_ITEMS[i];
    var tx = i * tabW;
    var isActive = item.key === activeKey;
    var color = isActive ? '#4F46E5' : '#9CA3AF';
    mkText(parent, tx + tabW / 2 - 10, tby + 10, item.icon, 20, 'Regular', color);
    mkText(parent, tx + tabW / 2 - 22, tby + 34, item.label, 10, isActive ? 'SemiBold' : 'Regular', color);
  }
}

function clearFrame(frame) {
  var children = frame.children.slice();
  for (var i = 0; i < children.length; i++) {
    try { children[i].remove(); } catch (e) {}
  }
}

// ══════════════════════════════════════════════════════════
// SCREEN 1 — Login
// ══════════════════════════════════════════════════════════
function drawLogin(frame) {
  clearFrame(frame);

  // Gradient background (top 40%)
  mkRect(frame, 0, 0, PH.W, 338, null, { fills: gradientLinear('#4F46E5', '#06B6D4', 135) });
  mkRect(frame, 0, 338, PH.W, PH.H - 338, '#F9FAFB');

  // Status bar (light text on gradient)
  drawStatusBar(frame, 0, true);

  // Hero section
  mkRect(frame, 163, 80, 64, 64, null, { fills: solid('#FFFFFF', 0.2), radius: 16 });
  mkText(frame, 177, 92, '⬡', 28, 'Bold', '#FFFFFF');
  mkText(frame, 153, 156, 'AutoFlow', 28, 'ExtraBold', '#FFFFFF');
  mkText(frame, 55, 192, 'Automatiza tu negocio', 14, 'Regular', '#FFFFFF', { opacity: 0.9 });

  // Card (sheet style)
  var card = mkFrame(frame, 16, 280, 358, 480, '#FFFFFF', { radius: 20, stroke: '#E5E7EB' });
  mkText(card, 20, 24, 'Bienvenido', 24, 'Bold', '#111827');
  mkText(card, 20, 56, 'Ingresa a tu cuenta', 14, 'Regular', '#6B7280');

  // Email
  mkText(card, 20, 96, 'Correo electrónico', 13, 'SemiBold', '#374151');
  mkRect(card, 20, 116, 318, 48, '#F9FAFB', { radius: 12, stroke: '#E5E7EB' });
  mkText(card, 32, 128, 'usuario@empresa.com', 14, 'Regular', '#9CA3AF');

  // Password
  mkText(card, 20, 180, 'Contraseña', 13, 'SemiBold', '#374151');
  mkRect(card, 20, 200, 318, 48, '#F9FAFB', { radius: 12, stroke: '#E5E7EB' });
  mkText(card, 32, 212, '••••••••••••', 15, 'Regular', '#9CA3AF');

  // Forgot
  mkText(card, 188, 260, '¿Olvidaste tu contraseña?', 13, 'Regular', '#4F46E5');

  // Button (full-width iOS style)
  mkRect(card, 20, 300, 318, 52, '#4F46E5', { radius: 14 });
  mkText(card, 128, 316, 'Iniciar sesión', 16, 'SemiBold', '#FFFFFF');

  // Sign up
  mkText(card, 70, 372, '¿Nuevo? Comienza gratis →', 14, 'Regular', '#4F46E5');

  // Home indicator
  mkRect(frame, 130, PH.H - 12, 130, 4, '#111827', { radius: 2, opacity: 0.2 });
}

// ══════════════════════════════════════════════════════════
// SCREEN 2 — Dashboard
// ══════════════════════════════════════════════════════════
function drawDashboard(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, PH.W, PH.H, '#F9FAFB');
  drawStatusBar(frame, 0, false);
  drawNavBar(frame, SAFE.top, 'Dashboard');

  var cy = CONTENT_TOP + 12;

  // Greeting
  mkText(frame, 16, cy, 'Buenos días, Carlos 👋', 18, 'Bold', '#111827');
  mkText(frame, 16, cy + 28, 'Miércoles, 18 Mar 2026', 13, 'Regular', '#6B7280');
  cy += 64;

  // KPI row (2×2 grid)
  var kpis = [
    { icon: '📦', num: '48',  label: 'Pedidos hoy',      bg: '#EEF2FF' },
    { icon: '👥', num: '312', label: 'Clientes',          bg: '#ECFDF5' },
    { icon: '💬', num: '156', label: 'Mensajes WA',       bg: '#F0FDF4' },
    { icon: '📊', num: '7',   label: 'Reportes',          bg: '#FFFBEB' },
  ];
  for (var i = 0; i < 4; i++) {
    var kx = (i % 2 === 0) ? 16 : 206;
    var ky = cy + Math.floor(i / 2) * 104;
    var kc = mkFrame(frame, kx, ky, 174, 92, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
    mkRect(kc, 12, 12, 36, 36, kpis[i].bg, { radius: 8 });
    mkText(kc, 20, 20, kpis[i].icon, 18, 'Regular', '#374151');
    mkText(kc, 56, 14, kpis[i].num, 26, 'Bold', '#111827');
    mkText(kc, 12, 60, kpis[i].label, 12, 'Regular', '#6B7280');
  }
  cy += 220;

  // Recent activity card
  mkText(frame, 16, cy, 'Actividad reciente', 16, 'Bold', '#111827');
  cy += 28;
  var actCard = mkFrame(frame, 16, cy, 358, 220, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  var actItems = [
    { text: 'Pedido #1042 — María Andrade', time: '5 min' },
    { text: 'Pedido #1041 — Carlos Méndez', time: '18 min' },
    { text: 'Nuevo cliente: Ana Torres',     time: '42 min' },
    { text: 'Pedido #1040 cancelado',        time: '1h' },
  ];
  for (var ai = 0; ai < actItems.length; ai++) {
    var ay = ai * 52;
    mkEllipse(actCard, 12, ay + 12, 32, 32, '#4F46E5');
    mkText(actCard, 20, ay + 22, 'CM', 10, 'SemiBold', '#FFFFFF');
    mkText(actCard, 52, ay + 10, actItems[ai].text, 13, 'Medium', '#111827');
    mkText(actCard, 52, ay + 28, 'hace ' + actItems[ai].time, 11, 'Regular', '#6B7280');
    if (ai < actItems.length - 1) mkRect(actCard, 52, ay + 50, 306, 1, '#F3F4F6');
  }

  drawTabBar(frame, 'dashboard');
}

// ══════════════════════════════════════════════════════════
// SCREEN 3 — Pedidos
// ══════════════════════════════════════════════════════════
function drawPedidos(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, PH.W, PH.H, '#F9FAFB');
  drawStatusBar(frame, 0, false);
  drawNavBar(frame, SAFE.top, 'Pedidos');

  var cy = CONTENT_TOP + 12;

  // Search bar (iOS style)
  mkRect(frame, 16, cy, 358, 44, '#E5E7EB', { radius: 12 });
  mkText(frame, 32, cy + 12, '🔍  Buscar pedido...', 14, 'Regular', '#9CA3AF');
  cy += 60;

  // Filter chips
  var filters = ['Todos', 'Completado', 'En proceso', 'Pendiente'];
  var fx = 16;
  for (var fi = 0; fi < filters.length; fi++) {
    var isActive = fi === 0;
    var fw = filters[fi].length * 8 + 24;
    mkRect(frame, fx, cy, fw, 32, isActive ? '#4F46E5' : '#FFFFFF', { radius: 16, stroke: isActive ? null : '#E5E7EB' });
    mkText(frame, fx + 10, cy + 8, filters[fi], 13, isActive ? 'SemiBold' : 'Regular', isActive ? '#FFFFFF' : '#6B7280');
    fx += fw + 8;
  }
  cy += 48;

  // Order list
  var rows = [
    { id: '#1042', client: 'María Andrade',  status: 'Completado', bg: '#ECFDF5', tc: '#059669', amount: '$124.00', date: '18 Mar' },
    { id: '#1041', client: 'Carlos Méndez', status: 'En proceso',  bg: '#EEF2FF', tc: '#4F46E5', amount: '$89.50',  date: '18 Mar' },
    { id: '#1040', client: 'Ana Torres',    status: 'Pendiente',   bg: '#FFFBEB', tc: '#D97706', amount: '$245.00', date: '17 Mar' },
    { id: '#1039', client: 'Luis Vargas',   status: 'Cancelado',   bg: '#FEF2F2', tc: '#EF4444', amount: '$67.00',  date: '17 Mar' },
    { id: '#1038', client: 'Sofía Mora',    status: 'Completado',  bg: '#ECFDF5', tc: '#059669', amount: '$189.00', date: '16 Mar' },
  ];

  var listCard = mkFrame(frame, 16, cy, 358, rows.length * 76, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  for (var ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    var ry = ri * 76;
    if (ri > 0) mkRect(listCard, 0, ry, 358, 1, '#F3F4F6');
    mkText(listCard, 16, ry + 14, row.id, 15, 'Bold', '#4F46E5');
    mkText(listCard, 16, ry + 36, row.client, 13, 'Regular', '#6B7280');
    mkBadge(listCard, 16, ry + 54, row.status, row.bg, row.tc);
    mkText(listCard, 290, ry + 14, row.amount, 15, 'SemiBold', '#111827');
    mkText(listCard, 302, ry + 36, row.date, 12, 'Regular', '#9CA3AF');
  }

  // FAB — nuevo pedido
  mkRect(frame, 310, PH.H - TAB_H - 72, 56, 56, '#4F46E5', { radius: 28 });
  mkText(frame, 324, PH.H - TAB_H - 60, '+', 28, 'Regular', '#FFFFFF');

  drawTabBar(frame, 'pedidos');
}

// ══════════════════════════════════════════════════════════
// SCREEN 4 — CRM
// ══════════════════════════════════════════════════════════
function drawCRM(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, PH.W, PH.H, '#F9FAFB');
  drawStatusBar(frame, 0, false);
  drawNavBar(frame, SAFE.top, 'Clientes CRM');

  var cy = CONTENT_TOP + 12;

  // Search
  mkRect(frame, 16, cy, 358, 44, '#E5E7EB', { radius: 12 });
  mkText(frame, 32, cy + 12, '🔍  Buscar cliente...', 14, 'Regular', '#9CA3AF');
  cy += 56;

  var clients = [
    { init: 'MA', name: 'María Andrade',  sub: 'VIP · maria@empresa.ec',      tag: 'VIP',     bg: '#FEF3C7', tc: '#D97706', selected: true  },
    { init: 'CM', name: 'Carlos Méndez', sub: 'Regular · carlos@pyme.ec',     tag: 'Regular', bg: '#F3F4F6', tc: '#374151', selected: false },
    { init: 'AT', name: 'Ana Torres',    sub: 'VIP · ana@tienda.ec',          tag: 'VIP',     bg: '#FEF3C7', tc: '#D97706', selected: false },
    { init: 'LV', name: 'Luis Vargas',   sub: 'Nuevo · lv@gmail.com',         tag: 'Nuevo',   bg: '#ECFDF5', tc: '#059669', selected: false },
    { init: 'SM', name: 'Sofía Mora',    sub: 'Regular · sofia@negocio.ec',   tag: 'Regular', bg: '#F3F4F6', tc: '#374151', selected: false },
  ];

  var listCard = mkFrame(frame, 16, cy, 358, clients.length * 80, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  for (var ci = 0; ci < clients.length; ci++) {
    var cl = clients[ci];
    var cly = ci * 80;
    if (cl.selected) {
      mkRect(listCard, 0, cly, 358, 80, '#EEF2FF');
      mkRect(listCard, 0, cly, 3, 80, '#4F46E5');
    }
    mkEllipse(listCard, 12, cly + 20, 44, 44, '#4F46E5');
    mkText(listCard, 26, cly + 36, cl.init, 14, 'Bold', '#FFFFFF');
    mkText(listCard, 68, cly + 18, cl.name, 15, 'SemiBold', '#111827');
    mkText(listCard, 68, cly + 40, cl.sub, 12, 'Regular', '#6B7280');
    mkText(listCard, 300, cly + 28, '›', 20, 'Regular', '#9CA3AF');
    if (ci < clients.length - 1) mkRect(listCard, 0, cly + 79, 358, 1, '#F3F4F6');
  }

  // FAB
  mkRect(frame, 310, PH.H - TAB_H - 72, 56, 56, '#4F46E5', { radius: 28 });
  mkText(frame, 324, PH.H - TAB_H - 60, '+', 28, 'Regular', '#FFFFFF');

  drawTabBar(frame, 'crm');
}

// ══════════════════════════════════════════════════════════
// SCREEN 5 — WhatsApp
// ══════════════════════════════════════════════════════════
function drawWhatsApp(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, PH.W, PH.H, '#FFFFFF');
  drawStatusBar(frame, 0, false);
  drawNavBar(frame, SAFE.top, 'WhatsApp');

  var cy = CONTENT_TOP + 8;

  // Status pill
  mkRect(frame, 16, cy, 358, 32, '#F0FDF4', { radius: 16, stroke: '#BBF7D0' });
  mkEllipse(frame, 28, cy + 10, 10, 10, '#22C55E');
  mkText(frame, 46, cy + 8, 'WhatsApp Business · 156 mensajes hoy', 12, 'Regular', '#15803D');
  cy += 48;

  // Conversations
  var convs = [
    { init: 'MA', name: 'María Andrade',  preview: 'Gracias, recibirás tu pedido pronto', time: '10:24', unread: 2 },
    { init: 'CM', name: 'Carlos Méndez', preview: '¿Cuánto tarda la entrega?',            time: '09:45', unread: 0 },
    { init: 'AT', name: 'Ana Torres',    preview: 'Confirmado ✓✓',                         time: '09:12', unread: 1 },
    { init: 'LV', name: 'Luis Vargas',   preview: 'Quisiera hacer un pedido',              time: 'Ayer',  unread: 0 },
    { init: 'SM', name: 'Sofía Mora',    preview: 'Tu factura está lista',                time: 'Ayer',  unread: 0 },
  ];

  for (var vi = 0; vi < convs.length; vi++) {
    var cv = convs[vi];
    var viy = cy + vi * 72;
    if (vi === 0) mkRect(frame, 0, viy, PH.W, 72, '#EEF2FF');
    mkEllipse(frame, 12, viy + 12, 48, 48, '#4F46E5');
    mkText(frame, 25, viy + 30, cv.init, 14, 'Bold', '#FFFFFF');
    mkText(frame, 72, viy + 12, cv.name, 15, 'SemiBold', '#111827');
    mkText(frame, 72, viy + 34, cv.preview.slice(0, 32), 13, 'Regular', '#6B7280');
    mkText(frame, 320, viy + 12, cv.time, 11, 'Regular', '#9CA3AF');
    if (cv.unread > 0) {
      mkEllipse(frame, 332, viy + 34, 20, 20, '#4F46E5');
      mkText(frame, 338, viy + 40, String(cv.unread), 10, 'Bold', '#FFFFFF');
    }
    if (vi < convs.length - 1) mkRect(frame, 72, viy + 71, 318, 1, '#F3F4F6');
  }

  drawTabBar(frame, 'whatsapp');
}

// ══════════════════════════════════════════════════════════
// SCREEN 6 — Reportes
// ══════════════════════════════════════════════════════════
function drawReportes(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, PH.W, PH.H, '#F9FAFB');
  drawStatusBar(frame, 0, false);
  drawNavBar(frame, SAFE.top, 'Reportes');

  var cy = CONTENT_TOP + 16;

  // Report cards (vertical stack)
  var reports = [
    { icon: '📊', bg: '#EEF2FF', title: 'Reporte Diario',  sub: 'Generado: hoy 8:00 AM' },
    { icon: '📈', bg: '#ECFDF5', title: 'Reporte Semanal', sub: 'Generado: Lun 8:00 AM' },
    { icon: '💰', bg: '#FFFBEB', title: 'Ventas del Mes',  sub: 'Actualizado: hoy'       },
    { icon: '👥', bg: '#F0FDF4', title: 'Clientes Nuevos', sub: 'Actualizado: hoy'       },
  ];

  for (var ri = 0; ri < reports.length; ri++) {
    var rp = reports[ri];
    var rcard = mkFrame(frame, 16, cy, 358, 80, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
    mkRect(rcard, 12, 12, 48, 48, rp.bg, { radius: 12 });
    mkText(rcard, 24, 22, rp.icon, 22, 'Regular', '#374151');
    mkText(rcard, 72, 16, rp.title, 15, 'Bold', '#111827');
    mkText(rcard, 72, 38, rp.sub, 12, 'Regular', '#6B7280');
    mkText(rcard, 300, 28, '⬇', 20, 'Regular', '#4F46E5');
    cy += 92;
  }

  // Mini chart
  mkText(frame, 16, cy, 'Ventas últimos 30 días', 15, 'Bold', '#111827');
  cy += 32;
  var chartCard = mkFrame(frame, 16, cy, 358, 120, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  var heights = [20,35,28,50,40,60,35,70,45,30,65,50,80,55,40,25,85,48,35,72,42,58,28,68,36,90,52,32,75,48];
  for (var bi = 0; bi < 30; bi++) {
    var bh = heights[bi] || 40;
    var bx = 6 + bi * 11;
    mkRect(chartCard, bx, 100 - bh, 8, bh, '#4F46E5', { radius: 2, opacity: 0.55 + (bi % 3) * 0.15 });
  }

  drawTabBar(frame, 'more');
}

// ══════════════════════════════════════════════════════════
// SCREEN 7 — Configuración
// ══════════════════════════════════════════════════════════
function drawConfig(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, PH.W, PH.H, '#F9FAFB');
  drawStatusBar(frame, 0, false);
  drawNavBar(frame, SAFE.top, 'Configuración');

  var cy = CONTENT_TOP + 12;

  // Grouped table sections (iOS style)
  // Section 1: Integraciones
  mkText(frame, 20, cy, 'INTEGRACIONES', 11, 'SemiBold', '#6B7280');
  cy += 24;

  var integItems = [
    { icon: '💬', iconBg: '#25D366', name: 'WhatsApp Business', status: 'Conectado', stColor: '#059669' },
    { icon: '⚙',  iconBg: '#FF6D00', name: 'N8N Webhooks',       status: 'Activo',    stColor: '#4F46E5' },
    { icon: '📡', iconBg: '#4F46E5', name: 'Evolution API',      status: 'Online',    stColor: '#16A34A' },
  ];

  var integCard = mkFrame(frame, 16, cy, 358, integItems.length * 56, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  for (var ii = 0; ii < integItems.length; ii++) {
    var it = integItems[ii];
    var iy = ii * 56;
    if (ii > 0) mkRect(integCard, 56, iy, 302, 1, '#F3F4F6');
    mkEllipse(integCard, 12, iy + 12, 32, 32, it.iconBg);
    mkText(integCard, 21, iy + 19, it.icon, 14, 'Regular', '#FFFFFF');
    mkText(integCard, 56, iy + 10, it.name, 15, 'Medium', '#111827');
    mkText(integCard, 56, iy + 30, it.status, 13, 'Regular', it.stColor);
    mkText(integCard, 330, iy + 18, '›', 18, 'Regular', '#C7D2FE');
  }
  cy += integItems.length * 56 + 24;

  // Section 2: Cuenta
  mkText(frame, 20, cy, 'CUENTA', 11, 'SemiBold', '#6B7280');
  cy += 24;

  var accountItems = [
    { label: 'Perfil de usuario', sub: 'Carlos Méndez' },
    { label: 'Plan',              sub: 'Pro · activo'  },
    { label: 'Notificaciones',    sub: 'Activadas'     },
    { label: 'Privacidad',        sub: '' },
  ];

  var accCard = mkFrame(frame, 16, cy, 358, accountItems.length * 52, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  for (var ai = 0; ai < accountItems.length; ai++) {
    var at = accountItems[ai];
    var acy = ai * 52;
    if (ai > 0) mkRect(accCard, 16, acy, 342, 1, '#F3F4F6');
    mkText(accCard, 16, acy + 10, at.label, 15, 'Regular', '#111827');
    if (at.sub) mkText(accCard, 16, acy + 30, at.sub, 13, 'Regular', '#6B7280');
    mkText(accCard, 336, acy + 18, '›', 18, 'Regular', '#9CA3AF');
  }
  cy += accountItems.length * 52 + 24;

  // Danger zone
  var dangerCard = mkFrame(frame, 16, cy, 358, 52, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  mkText(dangerCard, 16, 14, 'Cerrar sesión', 15, 'Regular', '#EF4444');

  drawTabBar(frame, 'more');
}

// ══════════════════════════════════════════════════════════
// SCREEN 8 — Perfil
// ══════════════════════════════════════════════════════════
function drawPerfil(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, PH.W, PH.H, '#F9FAFB');
  drawStatusBar(frame, 0, false);
  drawNavBar(frame, SAFE.top, 'Mi Perfil');

  var cy = CONTENT_TOP + 20;

  // Profile header card
  var profileCard = mkFrame(frame, 16, cy, 358, 160, '#FFFFFF', { radius: 16, stroke: '#E5E7EB' });
  mkEllipse(profileCard, 139, 20, 80, 80, '#4F46E5');
  mkText(profileCard, 163, 50, 'CM', 22, 'Bold', '#FFFFFF');
  mkText(profileCard, 124, 112, 'Carlos Méndez', 18, 'Bold', '#111827');
  mkText(profileCard, 145, 136, 'Administrador', 13, 'Regular', '#6B7280');
  cy += 176;

  // Plan badge
  mkRect(frame, 148, cy, 94, 28, null, { fills: gradientLinear('#4F46E5', '#06B6D4', 90), radius: 14 });
  mkText(frame, 161, cy + 6, '★ Plan Pro', 12, 'SemiBold', '#FFFFFF');
  cy += 48;

  // Personal info — form fields (iOS grouped)
  mkText(frame, 20, cy, 'INFORMACIÓN PERSONAL', 11, 'SemiBold', '#6B7280');
  cy += 24;

  var fields = [
    { label: 'Nombre',    val: 'Carlos'             },
    { label: 'Apellido',  val: 'Méndez'             },
    { label: 'Email',     val: 'carlos@constructor.ec' },
    { label: 'Teléfono',  val: '+593 98 452 6396'   },
    { label: 'Empresa',   val: 'Ferretería El Constructor' },
  ];

  var formCard = mkFrame(frame, 16, cy, 358, fields.length * 60, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  for (var fi = 0; fi < fields.length; fi++) {
    var fd = fields[fi];
    var fy = fi * 60;
    if (fi > 0) mkRect(formCard, 16, fy, 342, 1, '#F3F4F6');
    mkText(formCard, 16, fy + 10, fd.label, 12, 'SemiBold', '#6B7280');
    mkText(formCard, 16, fy + 30, fd.val, 14, 'Regular', '#111827');
  }
  cy += fields.length * 60 + 20;

  // Save button (iOS style — full width)
  mkRect(frame, 16, cy, 358, 52, '#4F46E5', { radius: 14 });
  mkText(frame, 130, cy + 16, 'Guardar cambios', 16, 'SemiBold', '#FFFFFF');

  drawTabBar(frame, 'more');
}

// ══════════════════════════════════════════════════════════
// MAIN — Create/find iOS page + frames
// ══════════════════════════════════════════════════════════
async function main() {
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular'   }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium'    }),
    figma.loadFontAsync({ family: 'Inter', style: 'SemiBold'  }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold'      }),
    figma.loadFontAsync({ family: 'Inter', style: 'ExtraBold' }),
  ]);

  // Find or create iOS page
  var iosPage = figma.root.children.find(function(p) {
    return p.name === '📱 iOS Screens';
  });
  if (!iosPage) {
    iosPage = figma.root.appendChild(figma.createPage());
    iosPage.name = '📱 iOS Screens';
  }

  var SCREEN_DEFS = [
    { name: 'iOS 01 - Login',             fn: drawLogin,     col: 0 },
    { name: 'iOS 02 - Dashboard',         fn: drawDashboard, col: 1 },
    { name: 'iOS 03 - Pedidos',           fn: drawPedidos,   col: 2 },
    { name: 'iOS 04 - CRM',               fn: drawCRM,       col: 3 },
    { name: 'iOS 05 - WhatsApp',          fn: drawWhatsApp,  col: 0, row: 1 },
    { name: 'iOS 06 - Reportes',          fn: drawReportes,  col: 1, row: 1 },
    { name: 'iOS 07 - Configuración',     fn: drawConfig,    col: 2, row: 1 },
    { name: 'iOS 08 - Perfil',            fn: drawPerfil,    col: 3, row: 1 },
  ];

  var GAP = 48;
  var done = 0;
  var errors = [];

  for (var i = 0; i < SCREEN_DEFS.length; i++) {
    var def = SCREEN_DEFS[i];
    try {
      // Find existing frame or create new one
      var frame = iosPage.findChild(function(n) { return n.name === def.name && n.type === 'FRAME'; });
      if (!frame) {
        frame = figma.createFrame();
        iosPage.appendChild(frame);
        frame.name = def.name;
      }
      var col = def.col;
      var row = def.row || 0;
      frame.x = col * (PH.W + GAP);
      frame.y = row * (PH.H + GAP);
      frame.resize(PH.W, PH.H);
      frame.clipsContent = true;

      def.fn(frame);
      done++;
    } catch (e) {
      errors.push(def.name + ': ' + e.message);
    }
  }

  var msg = '✅ AutoFlow iOS — ' + done + '/8 pantallas creadas en "📱 iOS Screens".';
  if (errors.length > 0) msg += '\n⚠️ ' + errors.join('\n');
  figma.closePlugin(msg);
}

main().catch(function(e) {
  figma.closePlugin('❌ Error fatal iOS: ' + e.message);
});
