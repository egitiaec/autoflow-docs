// ============================================================
// AutoFlow Design System — Web Screens Plugin
// Fase B · 8 pantallas completas 1440×900
// ============================================================

// ── Color helpers ──────────────────────────────────────────
function hex(h) {
  const x = h.replace('#', '');
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

// ── Node creators ──────────────────────────────────────────
function mkRect(parent, x, y, w, h, fillHex, opts) {
  try {
    var r = figma.createRectangle();
    parent.appendChild(r);
    r.x = x; r.y = y;
    r.resize(w, h);
    if (fillHex) r.fills = solid(fillHex);
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
    e.resize(w, h);
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
    if (opts && opts.autoResize) t.textAutoResize = 'WIDTH_AND_HEIGHT';
    else t.textAutoResize = 'WIDTH_AND_HEIGHT';
    t.x = x; t.y = y;
    if (opts && opts.align) t.textAlignHorizontal = opts.align;
    if (opts && opts.opacity !== undefined) t.opacity = opts.opacity;
    return t;
  } catch (e) { return null; }
}

function mkFrame(parent, x, y, w, h, fillHex, opts) {
  try {
    var f = figma.createFrame();
    if (parent) parent.appendChild(f);
    f.x = x; f.y = y;
    f.resize(w, h);
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

// ── Badge helper ───────────────────────────────────────────
function mkBadge(parent, x, y, label, bgHex, textHex) {
  try {
    var g = figma.createFrame();
    parent.appendChild(g);
    g.layoutMode = 'HORIZONTAL';
    g.paddingLeft = 8; g.paddingRight = 8;
    g.paddingTop = 3; g.paddingBottom = 3;
    g.fills = solid(bgHex || '#ECFDF5');
    g.cornerRadius = 20;
    g.primaryAxisSizingMode = 'AUTO';
    g.counterAxisSizingMode = 'AUTO';
    g.x = x; g.y = y;
    var t = figma.createText();
    g.appendChild(t);
    t.fontName = { family: 'Inter', style: 'SemiBold' };
    t.fontSize = 11;
    t.fills = solid(textHex || '#059669');
    t.characters = label;
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    return g;
  } catch (e) {
    // fallback: simple rect+text
    mkRect(parent, x, y, 80, 22, bgHex || '#ECFDF5', { radius: 20 });
    mkText(parent, x + 8, y + 4, label, 11, 'SemiBold', textHex || '#059669');
    return null;
  }
}

// ── Sidebar ─────────────────────────────────────────────────
var NAV_ITEMS = [
  { icon: '▦', label: 'Dashboard',  key: 'dashboard' },
  { icon: '📦', label: 'Pedidos',   key: 'pedidos'   },
  { icon: '👥', label: 'CRM',       key: 'crm'       },
  { icon: '💬', label: 'WhatsApp',  key: 'whatsapp'  },
  { icon: '📊', label: 'Reportes',  key: 'reportes'  },
  { icon: '⚙',  label: 'Config',   key: 'config'    },
];

function drawSidebar(parent, activeKey) {
  var sb = mkFrame(parent, 0, 0, 240, 900, '#1E1B4B');

  // Logo row
  mkRect(sb, 20, 24, 32, 32, '#4F46E5', { radius: 6, fills: gradientLinear('#4F46E5', '#06B6D4', 135) });
  mkText(sb, 64, 28, 'AutoFlow', 18, 'ExtraBold', '#FFFFFF');

  // Nav items
  for (var i = 0; i < NAV_ITEMS.length; i++) {
    var item = NAV_ITEMS[i];
    var iy = 80 + i * 44;
    var isActive = item.key === activeKey;

    if (isActive) {
      mkRect(sb, 0, iy, 240, 44, null, {
        fills: solid('#6366F1', 0.3),
      });
      mkRect(sb, 0, iy, 3, 44, '#6366F1');
    }

    mkText(sb, 20, iy + 12, item.icon + '  ' + item.label, 14,
      isActive ? 'SemiBold' : 'Regular',
      isActive ? '#FFFFFF' : '#C7D2FE');
  }

  // Avatar bottom
  mkEllipse(sb, 20, 844, 36, 36, '#4F46E5');
  mkText(sb, 29, 854, 'CM', 12, 'SemiBold', '#FFFFFF');

  return sb;
}

// ── Header ──────────────────────────────────────────────────
function drawHeader(parent, title) {
  var hdr = mkFrame(parent, 240, 0, 1200, 64, '#FFFFFF', {
    stroke: '#E5E7EB', strokeW: 1,
  });

  mkText(hdr, 40, 22, title, 20, 'Bold', '#111827');

  // Bell icon
  mkEllipse(hdr, 892, 14, 36, 36, '#F3F4F6');
  mkText(hdr, 900, 20, '🔔', 16, 'Regular', '#374151');

  // Avatar
  mkEllipse(hdr, 940, 14, 36, 36, '#4F46E5');
  mkText(hdr, 949, 24, 'CM', 12, 'SemiBold', '#FFFFFF');

  return hdr;
}

// ══════════════════════════════════════════════════════════
// SCREEN 1 — Login
// ══════════════════════════════════════════════════════════
function drawLogin(frame) {
  clearFrame(frame);

  // Left panel — hero gradient
  var left = mkFrame(frame, 0, 0, 720, 900, null, {
    fills: gradientLinear('#4F46E5', '#06B6D4', 135),
  });

  // Logo hexagon
  mkRect(left, 312, 340, 64, 64, null, {
    fills: solid('#FFFFFF', 0.25), radius: 14,
  });
  mkText(left, 328, 354, '⬡', 32, 'Bold', '#FFFFFF');

  mkText(left, 270, 420, 'AutoFlow', 36, 'ExtraBold', '#FFFFFF');
  mkText(left, 180, 470, 'Automatiza tu negocio, crece sin límites', 16, 'Regular', '#FFFFFF', { opacity: 0.8 });

  // Right panel
  var right = mkFrame(frame, 720, 0, 720, 900, '#F9FAFB');

  // Card
  var card = mkFrame(right, 160, 180, 400, 480, '#FFFFFF', {
    radius: 16,
    stroke: '#E5E7EB',
  });

  mkText(card, 20, 32, 'Bienvenido', 28, 'Bold', '#111827');
  mkText(card, 20, 68, 'Ingresa a tu cuenta AutoFlow', 14, 'Regular', '#6B7280');

  // Email field
  mkText(card, 20, 116, 'Correo electrónico', 13, 'SemiBold', '#374151');
  mkRect(card, 20, 136, 360, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(card, 32, 150, 'usuario@empresa.com', 13, 'Regular', '#9CA3AF');

  // Password field
  mkText(card, 20, 196, 'Contraseña', 13, 'SemiBold', '#374151');
  mkRect(card, 20, 216, 360, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(card, 32, 230, '••••••••••••', 14, 'Regular', '#9CA3AF');

  // Forgot password
  mkText(card, 260, 272, '¿Olvidaste tu contraseña?', 13, 'Regular', '#4F46E5');

  // Login button
  mkRect(card, 20, 300, 360, 44, '#4F46E5', { radius: 8 });
  mkText(card, 148, 314, 'Iniciar sesión', 14, 'SemiBold', '#FFFFFF');

  // Footer
  mkText(card, 60, 360, '¿Nuevo en AutoFlow? Comienza gratis', 13, 'Regular', '#6B7280');
}

// ══════════════════════════════════════════════════════════
// SCREEN 2 — Dashboard
// ══════════════════════════════════════════════════════════
function drawDashboard(frame) {
  clearFrame(frame);
  drawSidebar(frame, 'dashboard');
  drawHeader(frame, 'Dashboard');

  // Content bg
  mkRect(frame, 240, 64, 1200, 836, '#F9FAFB');

  // Section title + date
  mkText(frame, 280, 88, 'Resumen del día', 24, 'Bold', '#111827');
  mkText(frame, 280, 116, 'Miércoles, 18 Mar 2026', 13, 'Regular', '#6B7280');

  // Nuevo Pedido button
  mkRect(frame, 1060, 84, 140, 36, '#4F46E5', { radius: 8 });
  mkText(frame, 1086, 94, 'Nuevo Pedido', 13, 'SemiBold', '#FFFFFF');

  // KPI Cards
  var kpis = [
    { x: 280,  icon: '📦', bg: '#EEF2FF', num: '48',  label: 'Pedidos hoy',      trend: '↑ 12%', tcolor: '#059669' },
    { x: 567,  icon: '👥', bg: '#ECFDF5', num: '312', label: 'Clientes activos', trend: '↑ 5%',  tcolor: '#059669' },
    { x: 854,  icon: '💬', bg: '#F0FDF4', num: '156', label: 'Mensajes WA',      trend: '→ igual', tcolor: '#6B7280' },
    { x: 1141, icon: '📊', bg: '#FFFBEB', num: '7',   label: 'Reportes',         trend: '↓ 1',   tcolor: '#EF4444' },
  ];

  for (var i = 0; i < kpis.length; i++) {
    var k = kpis[i];
    var card = mkFrame(frame, k.x, 140, 267, 100, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
    mkRect(card, 16, 16, 40, 40, k.bg, { radius: 8 });
    mkText(card, 24, 24, k.icon, 20, 'Regular', '#374151');
    mkText(card, 72, 16, k.num, 32, 'Bold', '#111827');
    mkText(card, 72, 54, k.label, 13, 'Regular', '#6B7280');
    mkText(card, 16, 72, k.trend, 12, 'SemiBold', k.tcolor);
  }

  // Actividad reciente
  var act = mkFrame(frame, 280, 260, 560, 300, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  mkText(act, 16, 16, 'Actividad reciente', 16, 'Bold', '#111827');
  mkRect(act, 0, 48, 560, 1, '#E5E7EB');

  var actRows = [
    { name: 'Pedido #1042 — María Andrade', time: 'hace 5 min' },
    { name: 'Pedido #1041 — Carlos Méndez', time: 'hace 18 min' },
    { name: 'Pedido #1040 — Ana Torres',    time: 'hace 42 min' },
    { name: 'Pedido #1039 — Luis Vargas',   time: 'hace 1h' },
    { name: 'Nuevo cliente: Sofía Mora',    time: 'hace 2h' },
  ];
  for (var j = 0; j < actRows.length; j++) {
    var ry = 56 + j * 44;
    mkEllipse(act, 16, ry + 6, 32, 32, '#4F46E5');
    mkText(act, 24, ry + 14, 'CM', 11, 'SemiBold', '#FFFFFF');
    mkText(act, 56, ry + 8, actRows[j].name, 13, 'Medium', '#111827');
    mkText(act, 56, ry + 26, actRows[j].time, 12, 'Regular', '#6B7280');
  }

  // Integraciones
  var intg = mkFrame(frame, 860, 260, 580, 300, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  mkText(intg, 16, 16, 'Estado de integraciones', 16, 'Bold', '#111827');
  mkRect(intg, 0, 48, 580, 1, '#E5E7EB');

  var integRows = [
    { label: 'WhatsApp Business', status: 'Conectado', bg: '#ECFDF5', color: '#059669' },
    { label: 'N8N Webhooks',       status: 'Activo',    bg: '#EEF2FF', color: '#4F46E5' },
    { label: 'Evolution API',      status: 'Online',    bg: '#F0FDF4', color: '#16A34A' },
  ];
  for (var k2 = 0; k2 < integRows.length; k2++) {
    var ir = integRows[k2];
    var iry = 64 + k2 * 64;
    mkEllipse(intg, 16, iry + 8, 10, 10, '#22C55E');
    mkText(intg, 32, iry + 6, ir.label, 14, 'Medium', '#111827');
    mkBadge(intg, 420, iry + 4, ir.status, ir.bg, ir.color);
  }
}

// ══════════════════════════════════════════════════════════
// SCREEN 3 — Pedidos
// ══════════════════════════════════════════════════════════
function drawPedidos(frame) {
  clearFrame(frame);
  drawSidebar(frame, 'pedidos');
  drawHeader(frame, 'Gestión de Pedidos');

  mkRect(frame, 240, 64, 1200, 836, '#F9FAFB');

  // Filter bar
  mkRect(frame, 280, 80, 280, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(frame, 296, 94, '🔍  Buscar pedido...', 13, 'Regular', '#9CA3AF');
  mkRect(frame, 576, 80, 180, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(frame, 592, 94, 'Todos los estados', 13, 'Regular', '#6B7280');
  mkRect(frame, 772, 80, 160, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(frame, 788, 94, 'Esta semana', 13, 'Regular', '#6B7280');
  mkRect(frame, 1220, 80, 140, 44, '#4F46E5', { radius: 8 });
  mkText(frame, 1242, 94, 'Nuevo Pedido', 13, 'SemiBold', '#FFFFFF');

  // Table
  var tbl = mkFrame(frame, 280, 144, 1120, 580, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });

  // Header row
  mkRect(tbl, 0, 0, 1120, 44, '#F9FAFB');
  var cols = ['ID', 'Cliente', 'Producto', 'Estado', 'Fecha', 'Monto', 'Acciones'];
  var colX = [16, 90, 250, 420, 560, 660, 760];
  for (var c = 0; c < cols.length; c++) {
    mkText(tbl, colX[c], 12, cols[c], 12, 'SemiBold', '#6B7280');
  }
  mkRect(tbl, 0, 44, 1120, 1, '#E5E7EB');

  var rows = [
    { id: '#1042', client: 'María Andrade',  prod: 'Producto A', status: 'Completado', statusBg: '#ECFDF5', statusTxt: '#059669', date: '18 Mar', amount: '$124.00' },
    { id: '#1041', client: 'Carlos Méndez', prod: 'Servicio B',  status: 'En proceso', statusBg: '#EEF2FF', statusTxt: '#4F46E5', date: '18 Mar', amount: '$89.50'  },
    { id: '#1040', client: 'Ana Torres',    prod: 'Producto C',  status: 'Pendiente',  statusBg: '#FFFBEB', statusTxt: '#D97706', date: '17 Mar', amount: '$245.00' },
    { id: '#1039', client: 'Luis Vargas',   prod: 'Producto A',  status: 'Cancelado',  statusBg: '#FEF2F2', statusTxt: '#EF4444', date: '17 Mar', amount: '$67.00'  },
    { id: '#1038', client: 'Sofía Mora',    prod: 'Servicio D',  status: 'Completado', statusBg: '#ECFDF5', statusTxt: '#059669', date: '16 Mar', amount: '$189.00' },
    { id: '#1037', client: 'Diego Chávez',  prod: 'Producto B',  status: 'En proceso', statusBg: '#EEF2FF', statusTxt: '#4F46E5', date: '16 Mar', amount: '$320.00' },
  ];

  for (var ri = 0; ri < rows.length; ri++) {
    var row = rows[ri];
    var ry2 = 44 + ri * 56;
    if (ri < rows.length - 1) mkRect(tbl, 0, ry2 + 55, 1120, 1, '#F3F4F6');
    mkText(tbl, colX[0], ry2 + 18, row.id,     13, 'Medium',  '#4F46E5');
    mkText(tbl, colX[1], ry2 + 18, row.client, 13, 'Regular', '#111827');
    mkText(tbl, colX[2], ry2 + 18, row.prod,   13, 'Regular', '#374151');
    mkBadge(tbl, colX[3], ry2 + 16, row.status, row.statusBg, row.statusTxt);
    mkText(tbl, colX[4], ry2 + 18, row.date,   13, 'Regular', '#6B7280');
    mkText(tbl, colX[5], ry2 + 18, row.amount, 13, 'SemiBold','#111827');
    // Action dots
    mkText(tbl, colX[6], ry2 + 14, '• • •', 16, 'Bold', '#9CA3AF');
  }

  // Pagination
  mkText(frame, 280, 740, 'Mostrando 1-6 de 48 pedidos', 13, 'Regular', '#6B7280');
  mkRect(frame, 1140, 736, 90, 32, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(frame, 1160, 746, '← Anterior', 12, 'Regular', '#374151');
  mkRect(frame, 1248, 736, 90, 32, '#4F46E5', { radius: 8 });
  mkText(frame, 1268, 746, 'Siguiente →', 12, 'SemiBold', '#FFFFFF');
}

// ══════════════════════════════════════════════════════════
// SCREEN 4 — CRM
// ══════════════════════════════════════════════════════════
function drawCRM(frame) {
  clearFrame(frame);
  drawSidebar(frame, 'crm');
  drawHeader(frame, 'CRM — Clientes');

  mkRect(frame, 240, 64, 1200, 836, '#F9FAFB');

  // Action bar
  mkRect(frame, 280, 80, 240, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(frame, 296, 94, '🔍  Buscar cliente...', 13, 'Regular', '#9CA3AF');
  mkRect(frame, 536, 80, 160, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(frame, 552, 94, 'Etiqueta', 13, 'Regular', '#6B7280');
  mkRect(frame, 1148, 80, 140, 44, '#4F46E5', { radius: 8 });
  mkText(frame, 1158, 94, '+ Agregar cliente', 13, 'SemiBold', '#FFFFFF');

  // Client list
  var clist = mkFrame(frame, 280, 144, 420, 692, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });

  var clients = [
    { init: 'MA', name: 'María Andrade',  email: 'maria@empresa.ec', tag: 'VIP',     tagBg: '#FEF3C7', tagTxt: '#D97706', selected: true  },
    { init: 'CM', name: 'Carlos Méndez', email: 'carlos@pyme.ec',   tag: 'Regular', tagBg: '#F3F4F6', tagTxt: '#374151', selected: false },
    { init: 'AT', name: 'Ana Torres',    email: 'ana@tienda.ec',    tag: 'VIP',     tagBg: '#FEF3C7', tagTxt: '#D97706', selected: false },
    { init: 'LV', name: 'Luis Vargas',   email: 'lv@gmail.com',     tag: 'Nuevo',   tagBg: '#ECFDF5', tagTxt: '#059669', selected: false },
    { init: 'SM', name: 'Sofía Mora',    email: 'sofia@negocio.ec', tag: 'Regular', tagBg: '#F3F4F6', tagTxt: '#374151', selected: false },
  ];

  for (var ci = 0; ci < clients.length; ci++) {
    var cl = clients[ci];
    var cly = ci * 100;
    if (cl.selected) {
      mkRect(clist, 0, cly, 420, 100, '#EEF2FF');
      mkRect(clist, 0, cly, 3, 100, '#4F46E5');
    }
    mkEllipse(clist, 16, cly + 24, 48, 48, '#4F46E5');
    mkText(clist, 31, cly + 40, cl.init, 14, 'SemiBold', '#FFFFFF');
    mkText(clist, 76, cly + 20, cl.name, 14, 'SemiBold', '#111827');
    mkText(clist, 76, cly + 40, cl.email, 12, 'Regular', '#6B7280');
    mkBadge(clist, 76, cly + 64, cl.tag, cl.tagBg, cl.tagTxt);
    if (ci < clients.length - 1) mkRect(clist, 0, cly + 99, 420, 1, '#F3F4F6');
  }

  // Detail panel
  var detail = mkFrame(frame, 720, 144, 840, 692, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });

  // Header
  mkEllipse(detail, 24, 24, 64, 64, '#4F46E5');
  mkText(detail, 43, 48, 'MA', 20, 'Bold', '#FFFFFF');
  mkText(detail, 104, 28, 'María Andrade', 20, 'Bold', '#111827');
  mkBadge(detail, 104, 60, 'VIP', '#FEF3C7', '#D97706');
  mkRect(detail, 0, 104, 840, 1, '#E5E7EB');

  // Info rows
  var infoRows = [
    { label: 'Email',        val: 'maria@empresa.ec' },
    { label: 'Teléfono',     val: '+593 98 765 4321' },
    { label: 'Empresa',      val: 'Distribuidora Andrade' },
    { label: 'Última visita', val: '18 Mar 2026' },
  ];
  for (var ii = 0; ii < infoRows.length; ii++) {
    var iy2 = 120 + ii * 48;
    mkText(detail, 24, iy2, infoRows[ii].label, 12, 'SemiBold', '#6B7280');
    mkText(detail, 24, iy2 + 18, infoRows[ii].val, 14, 'Regular', '#111827');
  }

  mkRect(detail, 0, 315, 840, 1, '#E5E7EB');
  mkText(detail, 24, 328, 'Historial de interacciones', 14, 'Bold', '#111827');

  var history = [
    { date: '18 Mar', desc: 'Pedido #1042 — Producto A — $124.00' },
    { date: '12 Mar', desc: 'Pedido #1038 — Servicio D — $189.00' },
    { date: '05 Mar', desc: 'Primer contacto vía WhatsApp' },
  ];
  for (var hi = 0; hi < history.length; hi++) {
    var hy = 356 + hi * 64;
    mkEllipse(detail, 24, hy + 8, 8, 8, '#4F46E5');
    mkText(detail, 40, hy, history[hi].date, 11, 'SemiBold', '#6B7280');
    mkText(detail, 40, hy + 16, history[hi].desc, 13, 'Regular', '#374151');
  }

  // Action buttons
  mkRect(detail, 24, 620, 180, 40, '#4F46E5', { radius: 8 });
  mkText(detail, 54, 632, 'Nuevo pedido', 13, 'SemiBold', '#FFFFFF');
  mkRect(detail, 220, 620, 200, 40, '#FFFFFF', { radius: 8, stroke: '#25D366' });
  mkText(detail, 254, 632, '💬 Enviar WhatsApp', 13, 'SemiBold', '#25D366');
}

// ══════════════════════════════════════════════════════════
// SCREEN 5 — WhatsApp
// ══════════════════════════════════════════════════════════
function drawWhatsApp(frame) {
  clearFrame(frame);
  drawSidebar(frame, 'whatsapp');
  drawHeader(frame, 'Notificaciones WhatsApp');

  mkRect(frame, 240, 64, 1200, 836, '#F9FAFB');

  // Status bar
  mkRect(frame, 280, 72, 1120, 36, '#F0FDF4', { radius: 8, stroke: '#BBF7D0' });
  mkEllipse(frame, 296, 83, 10, 10, '#22C55E');
  mkText(frame, 314, 80, 'WhatsApp Business conectado', 13, 'SemiBold', '#15803D');
  mkText(frame, 1180, 80, '156 mensajes hoy', 13, 'Regular', '#6B7280');

  // Conversation list
  var convList = mkFrame(frame, 280, 116, 320, 720, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });

  var convs = [
    { init: 'MA', name: 'María Andrade',  preview: 'Gracias, recibirás tu pedido...', time: '10:24', unread: 2, selected: true  },
    { init: 'CM', name: 'Carlos Méndez', preview: '¿Cuál es el tiempo de entrega?',   time: '09:45', unread: 0, selected: false },
    { init: 'AT', name: 'Ana Torres',    preview: 'Confirmado ✓✓',                     time: '09:12', unread: 1, selected: false },
    { init: 'LV', name: 'Luis Vargas',   preview: 'Hola, quisiera hacer un pedido',    time: 'Ayer',  unread: 0, selected: false },
    { init: 'SM', name: 'Sofía Mora',    preview: 'Tu factura está lista',             time: 'Ayer',  unread: 0, selected: false },
  ];

  for (var vi = 0; vi < convs.length; vi++) {
    var cv = convs[vi];
    var viy = vi * 120;
    if (cv.selected) mkRect(convList, 0, viy, 320, 120, '#EEF2FF');
    mkEllipse(convList, 12, viy + 16, 44, 44, '#4F46E5');
    mkText(convList, 24, viy + 34, cv.init, 14, 'SemiBold', '#FFFFFF');
    mkText(convList, 68, viy + 16, cv.name, 14, 'SemiBold', '#111827');
    mkText(convList, 68, viy + 36, cv.preview.slice(0, 30), 12, 'Regular', '#6B7280');
    mkText(convList, 244, viy + 16, cv.time, 11, 'Regular', '#9CA3AF');
    if (cv.unread > 0) {
      mkEllipse(convList, 268, viy + 38, 20, 20, '#4F46E5');
      mkText(convList, 273, viy + 44, String(cv.unread), 10, 'Bold', '#FFFFFF');
    }
    if (vi < convs.length - 1) mkRect(convList, 0, viy + 119, 320, 1, '#F3F4F6');
  }

  // Active chat
  var chat = mkFrame(frame, 612, 116, 828, 720, '#F9FAFB', { radius: 12, stroke: '#E5E7EB' });

  // Chat header
  mkRect(chat, 0, 0, 828, 64, '#FFFFFF', { stroke: '#E5E7EB' });
  mkEllipse(chat, 16, 14, 36, 36, '#4F46E5');
  mkText(chat, 26, 26, 'MA', 11, 'SemiBold', '#FFFFFF');
  mkText(chat, 60, 14, 'María Andrade', 16, 'Bold', '#111827');
  mkText(chat, 60, 36, 'En línea', 12, 'Regular', '#22C55E');

  // Messages
  var msgs = [
    { side: 'client', text: 'Hola, quisiera confirmar mi pedido #1042', y: 80  },
    { side: 'agent',  text: 'Hola María! Tu pedido está confirmado ✓',  y: 140 },
    { side: 'client', text: '¿Cuándo llegará aproximadamente?',          y: 200 },
    { side: 'agent',  text: 'En 2-3 días hábiles. Te notificamos al despachar 📦', y: 260 },
  ];

  for (var mi = 0; mi < msgs.length; mi++) {
    var msg = msgs[mi];
    var isAgent = msg.side === 'agent';
    var mw = 400;
    var mx = isAgent ? 828 - mw - 16 : 16;
    mkRect(chat, mx, msg.y, mw, 48, isAgent ? '#4F46E5' : '#FFFFFF', {
      radius: 12, stroke: isAgent ? null : '#E5E7EB',
    });
    mkText(chat, mx + 12, msg.y + 14, msg.text, 13, 'Regular', isAgent ? '#FFFFFF' : '#111827');
  }

  // Input footer
  mkRect(chat, 0, 668, 828, 52, '#FFFFFF', { stroke: '#E5E7EB' });
  mkText(chat, 20, 682, 'Escribe un mensaje...', 13, 'Regular', '#9CA3AF');
  mkRect(chat, 772, 676, 40, 40, '#4F46E5', { radius: 20 });
  mkText(chat, 784, 684, '▶', 14, 'Bold', '#FFFFFF');
}

// ══════════════════════════════════════════════════════════
// SCREEN 6 — Reportes
// ══════════════════════════════════════════════════════════
function drawReportes(frame) {
  clearFrame(frame);
  drawSidebar(frame, 'reportes');
  drawHeader(frame, 'Reportes Automáticos');

  mkRect(frame, 240, 64, 1200, 836, '#F9FAFB');

  // Report cards
  var reports = [
    { x: 280,  icon: '📊', bg: '#EEF2FF',  title: 'Reporte Diario',       sub: 'Generado: hoy 8:00 AM' },
    { x: 560,  icon: '📈', bg: '#ECFDF5',  title: 'Reporte Semanal',      sub: 'Generado: Lun 8:00 AM' },
    { x: 840,  icon: '💰', bg: '#FFFBEB',  title: 'Ventas del Mes',       sub: 'Actualizado: hoy'       },
    { x: 1120, icon: '👥', bg: '#F0FDF4',  title: 'Clientes Nuevos',      sub: 'Actualizado: hoy'       },
  ];

  for (var ri2 = 0; ri2 < reports.length; ri2++) {
    var rp = reports[ri2];
    var rcard = mkFrame(frame, rp.x, 88, 260, 140, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
    mkRect(rcard, 16, 16, 48, 48, rp.bg, { radius: 10 });
    mkText(rcard, 28, 26, rp.icon, 22, 'Regular', '#374151');
    mkText(rcard, 16, 76, rp.title, 15, 'Bold', '#111827');
    mkText(rcard, 16, 98, rp.sub, 12, 'Regular', '#6B7280');
    mkRect(rcard, 16, 108, 96, 24, '#EEF2FF', { radius: 6 });
    mkText(rcard, 30, 114, 'Ver', 12, 'SemiBold', '#4F46E5');
    mkRect(rcard, 124, 108, 120, 24, '#F3F4F6', { radius: 6 });
    mkText(rcard, 138, 114, '⬇ Descargar', 12, 'Regular', '#374151');
  }

  // Auto-send toggle
  mkText(frame, 280, 252, 'Envío automático por email', 14, 'SemiBold', '#111827');
  mkRect(frame, 480, 248, 44, 24, '#4F46E5', { radius: 12 });
  mkEllipse(frame, 502, 250, 20, 20, '#FFFFFF');
  mkText(frame, 540, 252, 'Activado', 13, 'Regular', '#059669');

  // Chart area
  var chart = mkFrame(frame, 280, 288, 1120, 480, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  mkText(chart, 20, 20, 'Ventas últimos 30 días', 16, 'Bold', '#111827');
  mkRect(chart, 980, 16, 120, 32, '#F3F4F6', { radius: 8 });
  mkText(chart, 992, 24, '⬇ Exportar CSV', 12, 'Regular', '#374151');

  // Bars simulation
  var barHeights = [60,90,45,120,80,110,70,140,95,55,130,75,160,100,85,45,175,90,65,145,80,115,55,135,70,190,105,60,150,95];
  for (var bi = 0; bi < 30; bi++) {
    var bh = barHeights[bi] || 80;
    var bx = 20 + bi * 36;
    var by2 = 400 - bh;
    mkRect(chart, bx, by2, 28, bh, '#4F46E5', { radius: 4, opacity: 0.6 + (bi % 3) * 0.15 });
  }
  // Axis labels
  mkRect(chart, 20, 400, 1080, 1, '#E5E7EB');
  mkText(chart, 20, 410, '1 Feb', 10, 'Regular', '#9CA3AF');
  mkText(chart, 500, 410, '15 Feb', 10, 'Regular', '#9CA3AF');
  mkText(chart, 1000, 410, '1 Mar', 10, 'Regular', '#9CA3AF');
}

// ══════════════════════════════════════════════════════════
// SCREEN 7 — Configuración
// ══════════════════════════════════════════════════════════
function drawConfig(frame) {
  clearFrame(frame);
  drawSidebar(frame, 'config');
  drawHeader(frame, 'Configuración');

  mkRect(frame, 240, 64, 1200, 836, '#F9FAFB');

  // Tabs
  var tabs = ['General', 'Branding', 'Integraciones', 'Suscripción'];
  var tabX = 280;
  for (var ti = 0; ti < tabs.length; ti++) {
    var tw = ti === 2 ? 130 : 100;
    var isActive = ti === 2;
    mkText(frame, tabX, 90, tabs[ti], 14, isActive ? 'SemiBold' : 'Regular', isActive ? '#4F46E5' : '#6B7280');
    if (isActive) mkRect(frame, tabX, 110, tw, 2, '#4F46E5');
    tabX += tw + 20;
  }
  mkRect(frame, 280, 120, 1120, 1, '#E5E7EB');

  // Integration cards
  var integCards = [
    { icon: '💬', iconBg: '#25D366', name: 'WhatsApp Business', sub: 'Cuenta: +593 98 452 6396', status: 'Conectado', stBg: '#ECFDF5', stTxt: '#059669' },
    { icon: '⚙',  iconBg: '#FF6D00', name: 'N8N Webhooks',       sub: 'URL: https://n8n.autoflow.ec', status: 'Activo',    stBg: '#EEF2FF', stTxt: '#4F46E5' },
    { icon: '📡', iconBg: '#4F46E5', name: 'Evolution API',      sub: 'Instancia: autoflow-prod',    status: 'Online',    stBg: '#F0FDF4', stTxt: '#16A34A' },
  ];

  for (var ic = 0; ic < integCards.length; ic++) {
    var icard = mkFrame(frame, 280, 136 + ic * 96, 1120, 80, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
    mkEllipse(icard, 16, 20, 40, 40, integCards[ic].iconBg);
    mkText(icard, 29, 29, integCards[ic].icon, 18, 'Regular', '#FFFFFF');
    mkText(icard, 72, 16, integCards[ic].name, 15, 'Bold', '#111827');
    mkText(icard, 72, 38, integCards[ic].sub, 13, 'Regular', '#6B7280');
    mkBadge(icard, 900, 20, integCards[ic].status, integCards[ic].stBg, integCards[ic].stTxt);
    mkRect(icard, 1000, 20, 96, 36, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
    mkText(icard, 1026, 30, 'Configurar', 13, 'Regular', '#374151');
  }

  // API Keys section
  var apiSection = mkFrame(frame, 280, 424, 1120, 140, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  mkText(apiSection, 16, 16, 'API Keys', 16, 'Bold', '#111827');
  mkRect(apiSection, 0, 48, 1120, 1, '#E5E7EB');
  mkText(apiSection, 16, 64, 'API Key de producción', 13, 'SemiBold', '#374151');
  mkRect(apiSection, 16, 84, 760, 40, '#F9FAFB', { radius: 8, stroke: '#E5E7EB' });
  mkText(apiSection, 28, 96, 'sk-autoflow-••••••••••••••••••••••••bd4A', 13, 'Regular', '#6B7280');
  mkRect(apiSection, 788, 84, 80, 40, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
  mkText(apiSection, 804, 96, '📋 Copiar', 13, 'Regular', '#4F46E5');
  mkRect(apiSection, 880, 84, 100, 40, '#FEF2F2', { radius: 8, stroke: '#FECACA' });
  mkText(apiSection, 896, 96, '↺ Regenerar', 13, 'Regular', '#EF4444');
}

// ══════════════════════════════════════════════════════════
// SCREEN 8 — Perfil
// ══════════════════════════════════════════════════════════
function drawPerfil(frame) {
  clearFrame(frame);
  drawSidebar(frame, null);
  drawHeader(frame, 'Mi Perfil');

  mkRect(frame, 240, 64, 1200, 836, '#F9FAFB');

  // Left card
  var lcard = mkFrame(frame, 280, 100, 320, 400, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  mkEllipse(lcard, 120, 24, 80, 80, '#4F46E5');
  mkText(lcard, 145, 56, 'CM', 22, 'Bold', '#FFFFFF');
  mkText(lcard, 110, 116, 'Carlos Méndez', 20, 'Bold', '#111827');
  mkText(lcard, 126, 144, 'Administrador', 14, 'Regular', '#6B7280');
  mkText(lcard, 86, 166, 'Ferretería El Constructor', 13, 'Regular', '#374151');

  // Plan badge
  var planBadge = mkRect(lcard, 96, 196, 128, 32, null, { radius: 16, fills: gradientLinear('#4F46E5', '#06B6D4', 90) });
  mkText(lcard, 128, 207, '★ Plan Pro', 13, 'SemiBold', '#FFFFFF');

  // Stats
  mkRect(lcard, 0, 248, 320, 1, '#E5E7EB');
  var stats = [
    { label: 'Pedidos totales', val: '312' },
    { label: 'Clientes activos', val: '48'  },
    { label: 'Miembro desde',   val: 'Ene 2025' },
  ];
  for (var si = 0; si < stats.length; si++) {
    var sy = 264 + si * 44;
    mkText(lcard, 16, sy, stats[si].label, 12, 'Regular', '#6B7280');
    mkText(lcard, 220, sy, stats[si].val, 13, 'SemiBold', '#111827');
    if (si < stats.length - 1) mkRect(lcard, 0, sy + 42, 320, 1, '#F3F4F6');
  }

  // Right card — form
  var rcard = mkFrame(frame, 620, 100, 820, 580, '#FFFFFF', { radius: 12, stroke: '#E5E7EB' });
  mkText(rcard, 20, 20, 'Información personal', 18, 'Bold', '#111827');
  mkRect(rcard, 0, 56, 820, 1, '#E5E7EB');

  var fields = [
    { label: 'Nombre',    val: 'Carlos',                 x: 20,  },
    { label: 'Apellido',  val: 'Méndez',                 x: 420, },
    { label: 'Email',     val: 'carlos@constructor.ec',  x: 20,  row: 1 },
    { label: 'Teléfono',  val: '+593 98 452 6396',       x: 420, row: 1 },
    { label: 'Cargo',     val: 'Administrador',          x: 20,  row: 2 },
    { label: 'Empresa',   val: 'Ferretería El Constructor', x: 420, row: 2 },
  ];
  var rows2 = [72, 164, 256];
  for (var fi = 0; fi < fields.length; fi++) {
    var fd = fields[fi];
    var frow = fd.row || 0;
    var fy = rows2[frow];
    var isRight = fi % 2 === 1;
    var fx = isRight ? 420 : 20;
    mkText(rcard, fx, fy, fd.label, 12, 'SemiBold', '#6B7280');
    mkRect(rcard, fx, fy + 20, 380, 44, '#FFFFFF', { radius: 8, stroke: '#E5E7EB' });
    mkText(rcard, fx + 12, fy + 34, fd.val, 14, 'Regular', '#111827');
  }

  // Save button
  mkRect(rcard, 600, 520, 200, 44, '#4F46E5', { radius: 8 });
  mkText(rcard, 638, 534, 'Guardar cambios', 14, 'SemiBold', '#FFFFFF');
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

  var page = figma.currentPage;
  var frames = page.findAll(function(n) { return n.type === 'FRAME'; });

  var map = {};
  for (var i = 0; i < frames.length; i++) {
    map[frames[i].name] = frames[i];
  }

  var screens = [
    { key: '01 - Login',             fn: drawLogin     },
    { key: '02 - Dashboard',         fn: drawDashboard },
    { key: '03 - Pedidos',           fn: drawPedidos   },
    { key: '03 - CRM / Clientes',    fn: drawCRM       },
    { key: '05 - WhatsApp Integration', fn: drawWhatsApp },
    { key: '06 - Reportes',          fn: drawReportes  },
    { key: '07 - Configuración',     fn: drawConfig    },
    { key: '08 - Perfil de Usuario', fn: drawPerfil    },
  ];

  var done = 0;
  var errors = [];

  for (var si2 = 0; si2 < screens.length; si2++) {
    var s = screens[si2];
    var f = map[s.key];
    if (f) {
      try {
        s.fn(f);
        done++;
      } catch (e) {
        errors.push(s.key + ': ' + e.message);
      }
    } else {
      errors.push('Frame not found: ' + s.key);
    }
  }

  var msg = '✅ AutoFlow Web — ' + done + '/8 pantallas dibujadas.';
  if (errors.length > 0) msg += '\n⚠️ ' + errors.join('\n');
  figma.closePlugin(msg);
}

main().catch(function(e) {
  figma.closePlugin('❌ Error fatal: ' + e.message);
});
