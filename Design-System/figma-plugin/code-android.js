// ============================================================
// AutoFlow Design System — Android Jetpack Compose UI Kit
// 360×800 · Material Design 3 · Dynamic Color
// Página: "🤖 Android Screens"
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

// ── Android / M3 dimensions ───────────────────────────────
var D = { W: 360, H: 800 };
// Status bar (Android)
var STATUS_H = 24;
// Top App Bar (M3)
var APPBAR_H = 64;
// Bottom Navigation bar (M3)
var BOTTOMNAV_H = 80;
// Usable content top
var CONTENT_TOP = STATUS_H + APPBAR_H;
// Content bottom limit
var CONTENT_BOTTOM = D.H - BOTTOMNAV_H;
// Available height
var CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP;

// M3 color scheme (AutoFlow brand)
var M3 = {
  primary:          '#4F46E5',
  onPrimary:        '#FFFFFF',
  primaryContainer: '#E0E7FF',
  onPrimaryContainer: '#1E1B4B',
  secondary:        '#06B6D4',
  surface:          '#FAFAFA',
  surfaceVariant:   '#F3F4F6',
  outline:          '#E5E7EB',
  onSurface:        '#111827',
  onSurfaceVariant: '#6B7280',
  error:            '#EF4444',
  errorContainer:   '#FEF2F2',
  scrim:            '#000000',
};

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
  } catch (err) { return null; }
}

function mkText(parent, x, y, txt, size, weight, colorHex, opts) {
  try {
    var t = figma.createText();
    parent.appendChild(t);
    t.fontName = { family: 'Inter', style: weight || 'Regular' };
    t.fontSize = size || 14;
    t.fills = solid(colorHex || M3.onSurface);
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

function clearFrame(frame) {
  var children = frame.children.slice();
  for (var i = 0; i < children.length; i++) {
    try { children[i].remove(); } catch (e) {}
  }
}

// ── M3 chip/badge ──────────────────────────────────────────
function mkChip(parent, x, y, label, fillHex, textHex, radius) {
  var r = radius !== undefined ? radius : 8;
  var bg = mkRect(parent, x, y, 80, 28, fillHex || M3.primaryContainer, { radius: r });
  mkText(parent, x + 10, y + 6, label, 12, 'SemiBold', textHex || M3.onPrimaryContainer);
  return bg;
}

// ── M3 Status Bar ──────────────────────────────────────────
function drawStatusBar(parent) {
  mkRect(parent, 0, 0, D.W, STATUS_H, M3.surface);
  mkText(parent, 12, 4, '9:41', 12, 'SemiBold', M3.onSurface);
  mkText(parent, 290, 4, '●●● WiFi 🔋', 10, 'Regular', M3.onSurface);
}

// ── M3 Top App Bar ─────────────────────────────────────────
function drawTopBar(parent, title, showBack, actions) {
  mkRect(parent, 0, STATUS_H, D.W, APPBAR_H, M3.surface);
  if (showBack) {
    mkText(parent, 12, STATUS_H + 20, '←', 20, 'Regular', M3.primary);
  }
  mkText(parent, showBack ? 52 : 16, STATUS_H + 20, title, 20, 'Bold', M3.onSurface);
  if (actions) {
    var ax = D.W - 16;
    for (var ai = actions.length - 1; ai >= 0; ai--) {
      ax -= 32;
      mkText(parent, ax, STATUS_H + 20, actions[ai], 20, 'Regular', M3.onSurfaceVariant);
      ax -= 4;
    }
  }
  // Surface tint line
  mkRect(parent, 0, STATUS_H + APPBAR_H - 1, D.W, 1, M3.outline);
}

// ── M3 Bottom Navigation ───────────────────────────────────
var NAV_ITEMS = [
  { icon: '▦',  label: 'Dashboard', key: 'dashboard' },
  { icon: '📦', label: 'Pedidos',   key: 'pedidos'   },
  { icon: '👥', label: 'CRM',       key: 'crm'       },
  { icon: '💬', label: 'WhatsApp',  key: 'whatsapp'  },
  { icon: '☰',  label: 'Más',      key: 'more'      },
];

function drawBottomNav(parent, activeKey) {
  var bny = CONTENT_BOTTOM;
  mkRect(parent, 0, bny, D.W, BOTTOMNAV_H, M3.surface, { stroke: M3.outline });

  var itemW = D.W / NAV_ITEMS.length;
  for (var i = 0; i < NAV_ITEMS.length; i++) {
    var item = NAV_ITEMS[i];
    var isActive = item.key === activeKey;
    var tx = i * itemW;

    if (isActive) {
      // M3 indicator pill
      mkRect(parent, tx + itemW / 2 - 32, bny + 4, 64, 32, M3.primaryContainer, { radius: 16 });
    }
    mkText(parent, tx + itemW / 2 - 10, bny + 8, item.icon, 20, 'Regular', isActive ? M3.primary : M3.onSurfaceVariant);
    mkText(parent, tx + itemW / 2 - 20, bny + 34, item.label, 11, isActive ? 'SemiBold' : 'Regular', isActive ? M3.primary : M3.onSurfaceVariant);
  }
}

// ── M3 Card (elevated) ─────────────────────────────────────
function mkCard(parent, x, y, w, h, opts) {
  var r = (opts && opts.radius !== undefined) ? opts.radius : 16;
  var bg = (opts && opts.bg) ? opts.bg : '#FFFFFF';
  return mkFrame(parent, x, y, w, h, bg, {
    radius: r,
    stroke: M3.outline,
    strokeW: 1,
  });
}

// ══════════════════════════════════════════════════════════
// SCREEN 1 — Login
// ══════════════════════════════════════════════════════════
function drawLogin(frame) {
  clearFrame(frame);

  // Top gradient
  mkRect(frame, 0, 0, D.W, 280, null, { fills: gradientLinear('#4F46E5', '#06B6D4', 135) });
  mkRect(frame, 0, 280, D.W, D.H - 280, M3.surface);

  drawStatusBar(frame);

  // Branding
  mkRect(frame, 148, 68, 64, 64, null, { fills: solid('#FFFFFF', 0.2), radius: 20 });
  mkText(frame, 163, 80, '⬡', 28, 'Bold', '#FFFFFF');
  mkText(frame, 128, 144, 'AutoFlow', 28, 'ExtraBold', '#FFFFFF');
  mkText(frame, 62, 180, 'Automatiza tu negocio, crece sin límites', 13, 'Regular', '#FFFFFF', { opacity: 0.9 });

  // Bottom sheet (M3 style)
  var sheet = mkFrame(frame, 0, 236, D.W, 564, '#FFFFFF', { radius: 28 });
  // Sheet handle
  mkRect(sheet, 153, 12, 54, 4, '#E5E7EB', { radius: 2 });

  mkText(sheet, 24, 36, 'Bienvenido', 24, 'Bold', M3.onSurface);
  mkText(sheet, 24, 68, 'Ingresa a tu cuenta', 14, 'Regular', M3.onSurfaceVariant);

  // M3 Outlined TextField — Email
  mkText(sheet, 24, 108, 'Correo electrónico', 12, 'SemiBold', M3.primary);
  mkRect(sheet, 24, 128, 312, 52, '#FFFFFF', { radius: 4, stroke: M3.primary, strokeW: 2 });
  mkText(sheet, 36, 140, 'usuario@empresa.com', 14, 'Regular', M3.onSurfaceVariant);

  // M3 Outlined TextField — Password
  mkText(sheet, 24, 196, 'Contraseña', 12, 'SemiBold', M3.onSurfaceVariant);
  mkRect(sheet, 24, 216, 312, 52, '#FFFFFF', { radius: 4, stroke: M3.outline, strokeW: 1 });
  mkText(sheet, 36, 228, '••••••••••••', 15, 'Regular', M3.onSurfaceVariant);
  mkText(sheet, 288, 228, '👁', 16, 'Regular', M3.onSurfaceVariant);

  // Forgot
  mkText(sheet, 200, 280, '¿Olvidaste tu contraseña?', 13, 'Regular', M3.primary);

  // M3 Filled Button
  mkRect(sheet, 24, 316, 312, 52, M3.primary, { radius: 26 });
  mkText(sheet, 128, 330, 'Iniciar sesión', 16, 'SemiBold', '#FFFFFF');

  // M3 Text Button
  mkText(sheet, 80, 388, '¿Nuevo en AutoFlow? Regístrate', 14, 'Regular', M3.primary);
}

// ══════════════════════════════════════════════════════════
// SCREEN 2 — Dashboard
// ══════════════════════════════════════════════════════════
function drawDashboard(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, D.W, D.H, M3.surface);
  drawStatusBar(frame);
  drawTopBar(frame, 'Dashboard', false, ['🔔', 'CM']);

  var cy = CONTENT_TOP + 16;

  // Greeting
  mkText(frame, 16, cy, '¡Buenos días, Carlos! 👋', 18, 'Bold', M3.onSurface);
  mkText(frame, 16, cy + 28, 'Mié, 18 Mar 2026', 13, 'Regular', M3.onSurfaceVariant);
  cy += 60;

  // M3 KPI Cards — 2 column grid
  var kpis = [
    { icon: '📦', num: '48',  label: 'Pedidos hoy',   bg: M3.primaryContainer, tc: M3.onPrimaryContainer, trend: '↑ 12%', tcolor: '#059669' },
    { icon: '👥', num: '312', label: 'Clientes',       bg: '#ECFDF5',           tc: '#065F46',             trend: '↑ 5%',  tcolor: '#059669' },
    { icon: '💬', num: '156', label: 'Mensajes WA',    bg: '#CFFAFE',           tc: '#155E75',             trend: '→',     tcolor: M3.onSurfaceVariant },
    { icon: '📊', num: '7',   label: 'Reportes',       bg: '#FEF3C7',           tc: '#92400E',             trend: '↓ 1',   tcolor: M3.error },
  ];

  var CARD_W = (D.W - 48) / 2;
  for (var i = 0; i < 4; i++) {
    var k = kpis[i];
    var col = i % 2;
    var row = Math.floor(i / 2);
    var kx = 16 + col * (CARD_W + 16);
    var ky = cy + row * 108;
    var kcard = mkCard(frame, kx, ky, CARD_W, 96, { radius: 20, bg: k.bg });
    mkText(kcard, 12, 10, k.icon, 22, 'Regular', '#374151');
    mkText(kcard, 12, 40, k.num, 28, 'Bold', k.tc);
    mkText(kcard, 12, 70, k.label, 12, 'Regular', k.tc);
    mkText(kcard, CARD_W - 48, 10, k.trend, 12, 'SemiBold', k.tcolor);
  }
  cy += 232;

  // Recent activity
  mkText(frame, 16, cy, 'Actividad reciente', 16, 'Bold', M3.onSurface);
  cy += 28;

  var actCard = mkCard(frame, 16, cy, D.W - 32, 212, { radius: 16 });
  var actItems = [
    { text: 'Pedido #1042 — María Andrade', time: '5 min' },
    { text: 'Pedido #1041 — Carlos Méndez', time: '18 min' },
    { text: 'Nuevo cliente: Ana Torres',     time: '42 min' },
  ];
  for (var ai = 0; ai < actItems.length; ai++) {
    var ay = ai * 68;
    mkEllipse(actCard, 12, ay + 14, 40, 40, M3.primary);
    mkText(actCard, 24, ay + 28, 'CM', 12, 'Bold', '#FFFFFF');
    mkText(actCard, 64, ay + 16, actItems[ai].text, 14, 'Medium', M3.onSurface);
    mkText(actCard, 64, ay + 36, 'hace ' + actItems[ai].time, 12, 'Regular', M3.onSurfaceVariant);
    if (ai < actItems.length - 1) mkRect(actCard, 64, ay + 66, (D.W - 32) - 64, 1, M3.outline);
  }

  // FAB (M3 Extended FAB)
  mkRect(frame, D.W - 164, CONTENT_BOTTOM - 76, 148, 56, M3.primary, { radius: 28 });
  mkText(frame, D.W - 148, CONTENT_BOTTOM - 62, '+ Nuevo Pedido', 14, 'SemiBold', '#FFFFFF');

  drawBottomNav(frame, 'dashboard');
}

// ══════════════════════════════════════════════════════════
// SCREEN 3 — Pedidos
// ══════════════════════════════════════════════════════════
function drawPedidos(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, D.W, D.H, M3.surface);
  drawStatusBar(frame);
  drawTopBar(frame, 'Pedidos', false, ['🔍', '⊕']);

  var cy = CONTENT_TOP + 12;

  // M3 Search bar
  mkRect(frame, 16, cy, D.W - 32, 48, '#FFFFFF', { radius: 24, stroke: M3.outline });
  mkText(frame, 40, cy + 14, '🔍  Buscar pedido...', 14, 'Regular', M3.onSurfaceVariant);
  cy += 64;

  // M3 Filter chips
  var filters = [
    { label: 'Todos',      active: true  },
    { label: 'Completado', active: false },
    { label: 'En proceso', active: false },
    { label: 'Pendiente',  active: false },
  ];
  var fx = 16;
  for (var fi = 0; fi < filters.length; fi++) {
    var f = filters[fi];
    var fw = f.label.length * 8 + 28;
    mkRect(frame, fx, cy, fw, 32, f.active ? M3.primaryContainer : '#FFFFFF', {
      radius: 8,
      stroke: f.active ? M3.primary : M3.outline,
    });
    mkText(frame, fx + 12, cy + 8, f.label, 13, f.active ? 'SemiBold' : 'Regular',
      f.active ? M3.onPrimaryContainer : M3.onSurfaceVariant);
    fx += fw + 8;
  }
  cy += 48;

  // Order list
  var rows = [
    { id: '#1042', client: 'María Andrade',  status: 'Completado', bg: '#ECFDF5', tc: '#059669', amount: '$124.00' },
    { id: '#1041', client: 'Carlos Méndez', status: 'En proceso',  bg: M3.primaryContainer, tc: M3.onPrimaryContainer, amount: '$89.50'  },
    { id: '#1040', client: 'Ana Torres',    status: 'Pendiente',   bg: '#FEF3C7', tc: '#92400E', amount: '$245.00' },
    { id: '#1039', client: 'Luis Vargas',   status: 'Cancelado',   bg: M3.errorContainer, tc: M3.error, amount: '$67.00' },
    { id: '#1038', client: 'Sofía Mora',    status: 'Completado',  bg: '#ECFDF5', tc: '#059669', amount: '$189.00' },
  ];

  var listCard = mkCard(frame, 16, cy, D.W - 32, rows.length * 76, { radius: 16 });
  for (var ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    var ry = ri * 76;
    if (ri > 0) mkRect(listCard, 0, ry, D.W - 32, 1, M3.outline, { opacity: 0.5 });
    mkText(listCard, 12, ry + 10, row.id, 15, 'Bold', M3.primary);
    mkText(listCard, 12, ry + 34, row.client, 13, 'Regular', M3.onSurface);
    mkChip(listCard, 12, ry + 54, row.status, row.bg, row.tc, 6);
    mkText(listCard, (D.W - 32) - 80, ry + 14, row.amount, 15, 'SemiBold', M3.onSurface);
    mkText(listCard, (D.W - 32) - 24, ry + 28, '›', 18, 'Regular', M3.onSurfaceVariant);
  }

  // FAB
  mkRect(frame, D.W - 76, CONTENT_BOTTOM - 76, 56, 56, M3.primary, { radius: 28 });
  mkText(frame, D.W - 61, CONTENT_BOTTOM - 62, '+', 28, 'Regular', '#FFFFFF');

  drawBottomNav(frame, 'pedidos');
}

// ══════════════════════════════════════════════════════════
// SCREEN 4 — CRM
// ══════════════════════════════════════════════════════════
function drawCRM(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, D.W, D.H, M3.surface);
  drawStatusBar(frame);
  drawTopBar(frame, 'Clientes CRM', false, ['🔍', '⊕']);

  var cy = CONTENT_TOP + 12;

  // Search
  mkRect(frame, 16, cy, D.W - 32, 48, '#FFFFFF', { radius: 24, stroke: M3.outline });
  mkText(frame, 40, cy + 14, '🔍  Buscar cliente...', 14, 'Regular', M3.onSurfaceVariant);
  cy += 64;

  // Client list
  var clients = [
    { init: 'MA', name: 'María Andrade',  sub: 'VIP · maria@empresa.ec',    tag: 'VIP',     bg: '#FEF3C7', tc: '#92400E', sel: true  },
    { init: 'CM', name: 'Carlos Méndez', sub: 'Regular · carlos@pyme.ec',   tag: 'Regular', bg: M3.surfaceVariant, tc: M3.onSurfaceVariant, sel: false },
    { init: 'AT', name: 'Ana Torres',    sub: 'VIP · ana@tienda.ec',        tag: 'VIP',     bg: '#FEF3C7', tc: '#92400E', sel: false },
    { init: 'LV', name: 'Luis Vargas',   sub: 'Nuevo · lv@gmail.com',       tag: 'Nuevo',   bg: '#ECFDF5', tc: '#065F46', sel: false },
    { init: 'SM', name: 'Sofía Mora',    sub: 'Regular · sofia@negocio.ec', tag: 'Regular', bg: M3.surfaceVariant, tc: M3.onSurfaceVariant, sel: false },
  ];

  for (var ci = 0; ci < clients.length; ci++) {
    var cl = clients[ci];
    var cly = cy + ci * 88;
    var itemCard = mkCard(frame, 16, cly, D.W - 32, 80, {
      radius: 16,
      bg: cl.sel ? M3.primaryContainer : '#FFFFFF',
    });
    mkEllipse(itemCard, 12, 18, 44, 44, cl.sel ? M3.primary : M3.onSurfaceVariant);
    mkText(itemCard, 26, 32, cl.init, 14, 'Bold', '#FFFFFF');
    mkText(itemCard, 68, 14, cl.name, 15, 'SemiBold', cl.sel ? M3.onPrimaryContainer : M3.onSurface);
    mkText(itemCard, 68, 34, cl.sub, 12, 'Regular', cl.sel ? M3.onPrimaryContainer : M3.onSurfaceVariant);
    mkChip(itemCard, 68, 56, cl.tag, cl.bg, cl.tc, 6);
    mkText(itemCard, (D.W - 32) - 28, 30, '›', 18, 'Regular', M3.onSurfaceVariant);
  }

  // FAB
  mkRect(frame, D.W - 76, CONTENT_BOTTOM - 76, 56, 56, M3.primary, { radius: 28 });
  mkText(frame, D.W - 61, CONTENT_BOTTOM - 62, '+', 28, 'Regular', '#FFFFFF');

  drawBottomNav(frame, 'crm');
}

// ══════════════════════════════════════════════════════════
// SCREEN 5 — WhatsApp
// ══════════════════════════════════════════════════════════
function drawWhatsApp(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, D.W, D.H, '#FFFFFF');
  drawStatusBar(frame);
  drawTopBar(frame, 'WhatsApp', false, ['🔍', '⋮']);

  var cy = CONTENT_TOP + 8;

  // Status chip
  mkRect(frame, 16, cy, D.W - 32, 36, '#ECFDF5', { radius: 18, stroke: '#BBF7D0' });
  mkEllipse(frame, 28, cy + 12, 12, 12, '#22C55E');
  mkText(frame, 48, cy + 10, 'WhatsApp Business · 156 mensajes hoy', 12, 'Regular', '#15803D');
  cy += 52;

  var convs = [
    { init: 'MA', name: 'María Andrade',  preview: 'Recibirás tu pedido pronto...', time: '10:24', unread: 2, sel: true  },
    { init: 'CM', name: 'Carlos Méndez', preview: '¿Cuánto tarda la entrega?',     time: '09:45', unread: 0, sel: false },
    { init: 'AT', name: 'Ana Torres',    preview: 'Confirmado ✓✓',                  time: '09:12', unread: 1, sel: false },
    { init: 'LV', name: 'Luis Vargas',   preview: 'Quisiera hacer un pedido...',    time: 'Ayer',  unread: 0, sel: false },
    { init: 'SM', name: 'Sofía Mora',    preview: 'Tu factura está lista',         time: 'Ayer',  unread: 0, sel: false },
  ];

  for (var vi = 0; vi < convs.length; vi++) {
    var cv = convs[vi];
    var viy = cy + vi * 80;
    if (cv.sel) mkRect(frame, 0, viy, D.W, 80, M3.primaryContainer);
    mkEllipse(frame, 12, viy + 16, 48, 48, M3.primary);
    mkText(frame, 25, viy + 34, cv.init, 14, 'Bold', '#FFFFFF');
    mkText(frame, 72, viy + 16, cv.name, 15, 'SemiBold', M3.onSurface);
    mkText(frame, 72, viy + 38, cv.preview.slice(0, 34), 13, 'Regular', M3.onSurfaceVariant);
    mkText(frame, D.W - 48, viy + 16, cv.time, 11, 'Regular', M3.onSurfaceVariant);
    if (cv.unread > 0) {
      mkEllipse(frame, D.W - 36, viy + 40, 20, 20, M3.primary);
      mkText(frame, D.W - 30, viy + 46, String(cv.unread), 10, 'Bold', '#FFFFFF');
    }
    if (vi < convs.length - 1) mkRect(frame, 72, viy + 79, D.W - 72, 1, M3.outline, { opacity: 0.5 });
  }

  // M3 FAB
  mkRect(frame, D.W - 76, CONTENT_BOTTOM - 76, 56, 56, M3.primary, { radius: 28 });
  mkText(frame, D.W - 63, CONTENT_BOTTOM - 62, '✏', 18, 'Regular', '#FFFFFF');

  drawBottomNav(frame, 'whatsapp');
}

// ══════════════════════════════════════════════════════════
// SCREEN 6 — Reportes
// ══════════════════════════════════════════════════════════
function drawReportes(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, D.W, D.H, M3.surface);
  drawStatusBar(frame);
  drawTopBar(frame, 'Reportes', false, ['⋮']);

  var cy = CONTENT_TOP + 16;

  // M3 Cards — 2 col grid
  var reports = [
    { icon: '📊', bg: M3.primaryContainer, tc: M3.onPrimaryContainer, title: 'Diario',   sub: 'Hoy 8:00 AM' },
    { icon: '📈', bg: '#ECFDF5',           tc: '#065F46',             title: 'Semanal',  sub: 'Lun 8:00 AM' },
    { icon: '💰', bg: '#FEF3C7',           tc: '#92400E',             title: 'Mensual',  sub: 'Actualizado' },
    { icon: '👥', bg: '#CFFAFE',           tc: '#155E75',             title: 'Clientes', sub: 'Actualizado' },
  ];

  var CW = (D.W - 48) / 2;
  for (var ri = 0; ri < 4; ri++) {
    var rp = reports[ri];
    var rcol = ri % 2;
    var rrow = Math.floor(ri / 2);
    var rx = 16 + rcol * (CW + 16);
    var ry = cy + rrow * 120;
    var rcard = mkCard(frame, rx, ry, CW, 108, { radius: 20, bg: rp.bg });
    mkText(rcard, 12, 12, rp.icon, 24, 'Regular', '#374151');
    mkText(rcard, 12, 46, rp.title, 16, 'Bold', rp.tc);
    mkText(rcard, 12, 68, rp.sub, 12, 'Regular', rp.tc);
    mkRect(rcard, 12, 84, CW - 24, 16, null, { fills: solid(rp.tc, 0.15), radius: 4 });
    mkText(rcard, 16, 86, '⬇ Descargar', 11, 'Regular', rp.tc);
  }
  cy += 264;

  // Chart
  mkText(frame, 16, cy, 'Ventas últimos 30 días', 15, 'Bold', M3.onSurface);
  cy += 28;
  var chartCard = mkCard(frame, 16, cy, D.W - 32, 132, { radius: 20 });
  var heights = [20,35,28,50,40,60,35,70,45,30,65,50,80,55,40,25,85,48,35,72,42,58,28,68,36,90,52,32,75,48];
  for (var bi = 0; bi < 30; bi++) {
    var bh = heights[bi] || 40;
    var bx = 8 + bi * 10;
    mkRect(chartCard, bx, 108 - bh, 7, bh, M3.primary, { radius: 3, opacity: 0.5 + (bi % 4) * 0.12 });
  }
  mkRect(chartCard, 8, 108, (D.W - 32) - 16, 1, M3.outline);
  mkText(chartCard, 8, 116, '1 Feb', 9, 'Regular', M3.onSurfaceVariant);
  mkText(chartCard, (D.W - 32) / 2 - 12, 116, '15 Feb', 9, 'Regular', M3.onSurfaceVariant);
  mkText(chartCard, (D.W - 32) - 36, 116, '1 Mar', 9, 'Regular', M3.onSurfaceVariant);

  drawBottomNav(frame, 'more');
}

// ══════════════════════════════════════════════════════════
// SCREEN 7 — Configuración
// ══════════════════════════════════════════════════════════
function drawConfig(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, D.W, D.H, M3.surface);
  drawStatusBar(frame);
  drawTopBar(frame, 'Configuración', false);

  var cy = CONTENT_TOP + 16;

  // M3 Preference groups
  mkText(frame, 16, cy, 'Integraciones', 12, 'SemiBold', M3.primary);
  cy += 24;

  var integItems = [
    { icon: '💬', iconBg: '#25D366', name: 'WhatsApp Business', sub: 'Cuenta conectada',    status: 'Conectado', stC: '#059669' },
    { icon: '⚙',  iconBg: '#FF6D00', name: 'N8N Webhooks',       sub: 'Webhooks activos',    status: 'Activo',    stC: M3.primary },
    { icon: '📡', iconBg: M3.primary, name: 'Evolution API',      sub: 'Instancia online',    status: 'Online',    stC: '#16A34A' },
  ];

  var icard = mkCard(frame, 16, cy, D.W - 32, integItems.length * 64, { radius: 16 });
  for (var ii = 0; ii < integItems.length; ii++) {
    var it = integItems[ii];
    var iy = ii * 64;
    if (ii > 0) mkRect(icard, 0, iy, D.W - 32, 1, M3.outline, { opacity: 0.5 });
    mkEllipse(icard, 12, iy + 14, 36, 36, it.iconBg);
    mkText(icard, 21, iy + 22, it.icon, 16, 'Regular', '#FFFFFF');
    mkText(icard, 60, iy + 12, it.name, 15, 'Medium', M3.onSurface);
    mkText(icard, 60, iy + 32, it.sub, 13, 'Regular', it.stC);
    mkText(icard, (D.W - 32) - 28, iy + 22, '›', 18, 'Regular', M3.onSurfaceVariant);
  }
  cy += integItems.length * 64 + 28;

  // Account section
  mkText(frame, 16, cy, 'Cuenta', 12, 'SemiBold', M3.primary);
  cy += 24;

  var accItems = [
    { label: 'Perfil', sub: 'Carlos Méndez' },
    { label: 'Plan', sub: 'Pro — activo' },
    { label: 'Notificaciones', sub: 'Push activado' },
    { label: 'Privacidad', sub: '' },
  ];

  var accard = mkCard(frame, 16, cy, D.W - 32, accItems.length * 52, { radius: 16 });
  for (var ai = 0; ai < accItems.length; ai++) {
    var at = accItems[ai];
    var acy = ai * 52;
    if (ai > 0) mkRect(accard, 0, acy, D.W - 32, 1, M3.outline, { opacity: 0.5 });
    mkText(accard, 16, acy + 10, at.label, 15, 'Regular', M3.onSurface);
    if (at.sub) mkText(accard, 16, acy + 30, at.sub, 13, 'Regular', M3.onSurfaceVariant);
    mkText(accard, (D.W - 32) - 28, acy + 18, '›', 18, 'Regular', M3.onSurfaceVariant);
  }
  cy += accItems.length * 52 + 28;

  // Logout — M3 filled tonal button
  mkRect(frame, 16, cy, D.W - 32, 52, M3.errorContainer, { radius: 26 });
  mkText(frame, (D.W - 32) / 2 - 44, cy + 15, 'Cerrar sesión', 15, 'SemiBold', M3.error);

  drawBottomNav(frame, 'more');
}

// ══════════════════════════════════════════════════════════
// SCREEN 8 — Perfil
// ══════════════════════════════════════════════════════════
function drawPerfil(frame) {
  clearFrame(frame);
  mkRect(frame, 0, 0, D.W, D.H, M3.surface);
  drawStatusBar(frame);
  drawTopBar(frame, 'Mi Perfil', false, ['✏']);

  var cy = CONTENT_TOP + 20;

  // M3 Profile header card
  var profileCard = mkCard(frame, 16, cy, D.W - 32, 148, { radius: 24 });
  mkEllipse(profileCard, (D.W - 32) / 2 - 36, 12, 72, 72, M3.primary);
  mkText(profileCard, (D.W - 32) / 2 - 16, 38, 'CM', 22, 'Bold', '#FFFFFF');
  mkText(profileCard, 72, 96, 'Carlos Méndez', 18, 'Bold', M3.onSurface);
  mkText(profileCard, 88, 120, 'Administrador', 13, 'Regular', M3.onSurfaceVariant);
  cy += 160;

  // Plan badge
  mkRect(frame, (D.W - 100) / 2, cy, 100, 32, null, { fills: gradientLinear('#4F46E5', '#06B6D4', 90), radius: 16 });
  mkText(frame, (D.W - 100) / 2 + 16, cy + 8, '★ Plan Pro', 13, 'SemiBold', '#FFFFFF');
  cy += 52;

  // Stats row
  var stats = [
    { num: '312', label: 'Pedidos' },
    { num: '48',  label: 'Clientes' },
    { num: 'Pro', label: 'Plan'  },
  ];
  var statsCard = mkCard(frame, 16, cy, D.W - 32, 72, { radius: 16 });
  var statW = (D.W - 32) / 3;
  for (var si = 0; si < stats.length; si++) {
    var sx = si * statW;
    if (si > 0) mkRect(statsCard, sx, 8, 1, 56, M3.outline);
    mkText(statsCard, sx + statW / 2 - 16, 12, stats[si].num, 22, 'Bold', M3.primary);
    mkText(statsCard, sx + statW / 2 - 24, 42, stats[si].label, 12, 'Regular', M3.onSurfaceVariant);
  }
  cy += 88;

  // Form fields
  mkText(frame, 16, cy, 'Información personal', 15, 'Bold', M3.onSurface);
  cy += 24;

  var fields = [
    { label: 'Nombre',    val: 'Carlos'              },
    { label: 'Apellido',  val: 'Méndez'              },
    { label: 'Email',     val: 'carlos@constructor.ec' },
    { label: 'Teléfono',  val: '+593 98 452 6396'    },
  ];

  for (var fi = 0; fi < fields.length; fi++) {
    var fd = fields[fi];
    // M3 Outlined text field
    mkText(frame, 28, cy, fd.label, 12, 'SemiBold', M3.primary);
    mkRect(frame, 16, cy + 18, D.W - 32, 48, '#FFFFFF', { radius: 4, stroke: M3.outline });
    mkText(frame, 28, cy + 30, fd.val, 14, 'Regular', M3.onSurface);
    cy += 76;
  }

  // Save button — M3 Filled
  mkRect(frame, 16, cy, D.W - 32, 52, M3.primary, { radius: 26 });
  mkText(frame, (D.W - 32) / 2 - 60, cy + 15, 'Guardar cambios', 16, 'SemiBold', '#FFFFFF');

  drawBottomNav(frame, 'more');
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
async function main() {
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Regular'   }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium'    }),
    figma.loadFontAsync({ family: 'Inter', style: 'SemiBold'  }),
    figma.loadFontAsync({ family: 'Inter', style: 'Bold'      }),
    figma.loadFontAsync({ family: 'Inter', style: 'ExtraBold' }),
  ]);

  // Find or create Android page
  var androidPage = figma.root.children.find(function(p) {
    return p.name === '🤖 Android Screens';
  });
  if (!androidPage) {
    androidPage = figma.root.appendChild(figma.createPage());
    androidPage.name = '🤖 Android Screens';
  }

  var SCREEN_DEFS = [
    { name: 'Android 01 - Login',         fn: drawLogin,     col: 0, row: 0 },
    { name: 'Android 02 - Dashboard',     fn: drawDashboard, col: 1, row: 0 },
    { name: 'Android 03 - Pedidos',       fn: drawPedidos,   col: 2, row: 0 },
    { name: 'Android 04 - CRM',           fn: drawCRM,       col: 3, row: 0 },
    { name: 'Android 05 - WhatsApp',      fn: drawWhatsApp,  col: 0, row: 1 },
    { name: 'Android 06 - Reportes',      fn: drawReportes,  col: 1, row: 1 },
    { name: 'Android 07 - Configuración', fn: drawConfig,    col: 2, row: 1 },
    { name: 'Android 08 - Perfil',        fn: drawPerfil,    col: 3, row: 1 },
  ];

  var GAP = 48;
  var done = 0;
  var errors = [];

  for (var i = 0; i < SCREEN_DEFS.length; i++) {
    var def = SCREEN_DEFS[i];
    try {
      var frame = androidPage.findChild(function(n) { return n.name === def.name && n.type === 'FRAME'; });
      if (!frame) {
        frame = figma.createFrame();
        androidPage.appendChild(frame);
        frame.name = def.name;
      }
      frame.x = def.col * (D.W + GAP);
      frame.y = def.row * (D.H + GAP);
      frame.resize(D.W, D.H);
      frame.clipsContent = true;

      def.fn(frame);
      done++;
    } catch (e) {
      errors.push(def.name + ': ' + e.message);
    }
  }

  var msg = '✅ AutoFlow Android — ' + done + '/8 pantallas creadas en "🤖 Android Screens".';
  if (errors.length > 0) msg += '\n⚠️ ' + errors.join('\n');
  figma.closePlugin(msg);
}

main().catch(function(e) {
  figma.closePlugin('❌ Error fatal Android: ' + e.message);
});
