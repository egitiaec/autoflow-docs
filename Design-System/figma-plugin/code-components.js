// AutoFlow Components Builder — Fase A
// Design System: AutoFlow by EGIT Consultoría
// Página destino: "🧩 Components"

(async () => {
  // ─── Helpers ────────────────────────────────────────────────────────────────

  function hexToRGB(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16) / 255,
      g: parseInt(h.substring(2, 4), 16) / 255,
      b: parseInt(h.substring(4, 6), 16) / 255,
    };
  }

  function solidFill(hex, alpha) {
    const { r, g, b } = hexToRGB(hex);
    return [{ type: "SOLID", color: { r, g, b }, opacity: alpha !== undefined ? alpha : 1 }];
  }

  function strokeBorder(hex, weight) {
    const { r, g, b } = hexToRGB(hex);
    return [{ type: "SOLID", color: { r, g, b } }];
  }

  async function makeText(content, fontSize, fontStyle, hexColor, opts) {
    const t = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: fontStyle || "Regular" });
    t.fontName = { family: "Inter", style: fontStyle || "Regular" };
    t.fontSize = fontSize || 14;
    t.characters = content;
    const { r, g, b } = hexToRGB(hexColor || "#111827");
    t.fills = [{ type: "SOLID", color: { r, g, b } }];
    if (opts) {
      if (opts.width) { t.textAutoResize = "HEIGHT"; t.resize(opts.width, t.height); }
      if (opts.align) t.textAlignHorizontal = opts.align;
    }
    return t;
  }

  // ─── Find target page ────────────────────────────────────────────────────────

  let page = figma.root.children.find(p => p.name === "🧩 Components");
  if (!page) {
    figma.notify("❌ Página '🧩 Components' no encontrada", { error: true });
    figma.closePlugin();
    return;
  }
  figma.currentPage = page;

  // ─── Pre-load fonts ──────────────────────────────────────────────────────────

  const fonts = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "SemiBold" },
    { family: "Inter", style: "Bold" },
    { family: "Inter", style: "ExtraBold" },
  ];
  for (const f of fonts) {
    try { await figma.loadFontAsync(f); } catch (e) { /* fallback ok */ }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. BUTTONS (x=40, y=40, w=800, h=280)
  // ════════════════════════════════════════════════════════════════════════════

  async function createButton(label, bgHex, textHex, borderHex, isTransparent) {
    const comp = figma.createComponent();
    comp.name = `Button / ${label}`;
    comp.resize(160, 44);
    comp.cornerRadius = 8;
    comp.layoutMode = "HORIZONTAL";
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.paddingLeft = 20;
    comp.paddingRight = 20;
    comp.paddingTop = 10;
    comp.paddingBottom = 10;
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";

    if (isTransparent) {
      comp.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0 }];
    } else {
      comp.fills = solidFill(bgHex);
    }

    if (borderHex) {
      comp.strokes = strokeBorder(borderHex);
      comp.strokeWeight = 1.5;
      comp.strokeAlign = "INSIDE";
    } else {
      comp.strokes = [];
    }

    const txt = await makeText(label, 14, "SemiBold", textHex);
    comp.appendChild(txt);
    return comp;
  }

  const buttonsFrame = figma.createFrame();
  buttonsFrame.name = "Buttons";
  buttonsFrame.x = 40;
  buttonsFrame.y = 40;
  buttonsFrame.resize(800, 280);
  buttonsFrame.fills = solidFill("#F8FAFC");
  buttonsFrame.cornerRadius = 12;
  buttonsFrame.layoutMode = "HORIZONTAL";
  buttonsFrame.itemSpacing = 16;
  buttonsFrame.paddingLeft = 24;
  buttonsFrame.paddingRight = 24;
  buttonsFrame.paddingTop = 40;
  buttonsFrame.paddingBottom = 40;
  buttonsFrame.counterAxisAlignItems = "CENTER";
  buttonsFrame.primaryAxisSizingMode = "FIXED";
  buttonsFrame.counterAxisSizingMode = "FIXED";
  page.appendChild(buttonsFrame);

  const buttonDefs = [
    { label: "Botón Primario",   bg: "#4F46E5", text: "#FFFFFF", border: null,      transparent: false },
    { label: "Secundario",       bg: "#EEF2FF", text: "#4F46E5", border: "#4F46E5", transparent: false },
    { label: "Ghost",            bg: null,      text: "#4F46E5", border: "#E5E7EB", transparent: true  },
    { label: "Danger",           bg: "#EF4444", text: "#FFFFFF", border: null,      transparent: false },
    { label: "Deshabilitado",    bg: "#E5E7EB", text: "#9CA3AF", border: null,      transparent: false },
  ];

  for (const d of buttonDefs) {
    const btn = await createButton(d.label, d.bg, d.text, d.border, d.transparent);
    buttonsFrame.appendChild(btn);
  }

  // Section label
  const btnLabel = await makeText("Buttons", 11, "SemiBold", "#94A3B8");
  btnLabel.x = 24;
  btnLabel.y = 16;
  buttonsFrame.appendChild(btnLabel);

  // ════════════════════════════════════════════════════════════════════════════
  // 2. BADGES (x=40, y=340, w=600, h=120)
  // ════════════════════════════════════════════════════════════════════════════

  async function createBadge(label, bgHex, textHex) {
    const comp = figma.createComponent();
    comp.name = `Badge / ${label}`;
    comp.layoutMode = "HORIZONTAL";
    comp.primaryAxisAlignItems = "CENTER";
    comp.counterAxisAlignItems = "CENTER";
    comp.paddingLeft = 12;
    comp.paddingRight = 12;
    comp.paddingTop = 4;
    comp.paddingBottom = 4;
    comp.cornerRadius = 20;
    comp.fills = solidFill(bgHex);
    comp.strokes = [];
    comp.primaryAxisSizingMode = "AUTO";
    comp.counterAxisSizingMode = "AUTO";

    const txt = await makeText(label, 12, "Medium", textHex);
    comp.appendChild(txt);
    return comp;
  }

  const badgesFrame = figma.createFrame();
  badgesFrame.name = "Badges";
  badgesFrame.x = 40;
  badgesFrame.y = 340;
  badgesFrame.resize(600, 120);
  badgesFrame.fills = solidFill("#F8FAFC");
  badgesFrame.cornerRadius = 12;
  badgesFrame.layoutMode = "HORIZONTAL";
  badgesFrame.itemSpacing = 12;
  badgesFrame.paddingLeft = 24;
  badgesFrame.paddingRight = 24;
  badgesFrame.paddingTop = 40;
  badgesFrame.paddingBottom = 40;
  badgesFrame.counterAxisAlignItems = "CENTER";
  badgesFrame.primaryAxisSizingMode = "FIXED";
  badgesFrame.counterAxisSizingMode = "FIXED";
  page.appendChild(badgesFrame);

  const badgeDefs = [
    { label: "Completado", bg: "#ECFDF5", text: "#059669" },
    { label: "Pendiente",  bg: "#FFFBEB", text: "#D97706" },
    { label: "Cancelado",  bg: "#FEF2F2", text: "#DC2626" },
    { label: "En proceso", bg: "#EEF2FF", text: "#4F46E5" },
  ];

  for (const d of badgeDefs) {
    const badge = await createBadge(d.label, d.bg, d.text);
    badgesFrame.appendChild(badge);
  }

  const badgeLabel = await makeText("Badges", 11, "SemiBold", "#94A3B8");
  badgeLabel.x = 24;
  badgeLabel.y = 16;
  badgesFrame.appendChild(badgeLabel);

  // ════════════════════════════════════════════════════════════════════════════
  // 3. INPUT FIELDS (x=40, y=480, w=400, h=280)
  // ════════════════════════════════════════════════════════════════════════════

  async function createInputGroup(labelText, state) {
    // Wrapper group (vertical stack)
    const group = figma.createFrame();
    group.name = `Input / ${state}`;
    group.layoutMode = "VERTICAL";
    group.itemSpacing = 6;
    group.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0 }];
    group.strokes = [];
    group.primaryAxisSizingMode = "AUTO";
    group.counterAxisSizingMode = "FIXED";
    group.resize(340, 44 + 6 + 16 + (state === "error" ? 6 + 14 : 0));

    // Label
    const lbl = await makeText(labelText, 12, "SemiBold", "#6B7280");
    group.appendChild(lbl);

    // Input box
    const inputBox = figma.createComponent();
    inputBox.name = `InputBox / ${state}`;
    inputBox.resize(340, 44);
    inputBox.cornerRadius = 8;
    inputBox.fills = solidFill("#FFFFFF");
    inputBox.layoutMode = "HORIZONTAL";
    inputBox.primaryAxisAlignItems = "MIN";
    inputBox.counterAxisAlignItems = "CENTER";
    inputBox.paddingLeft = 14;
    inputBox.paddingRight = 14;
    inputBox.paddingTop = 10;
    inputBox.paddingBottom = 10;
    inputBox.primaryAxisSizingMode = "FIXED";
    inputBox.counterAxisSizingMode = "FIXED";

    if (state === "normal") {
      inputBox.strokes = strokeBorder("#E5E7EB");
      inputBox.strokeWeight = 1;
      inputBox.strokeAlign = "INSIDE";
    } else if (state === "focus") {
      inputBox.strokes = strokeBorder("#4F46E5");
      inputBox.strokeWeight = 2;
      inputBox.strokeAlign = "INSIDE";
      // Simulate glow with outer shadow
      inputBox.effects = [{
        type: "DROP_SHADOW",
        color: { r: 79 / 255, g: 70 / 255, b: 229 / 255, a: 0.1 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 3,
        visible: true,
        blendMode: "NORMAL",
      }];
    } else if (state === "error") {
      inputBox.strokes = strokeBorder("#EF4444");
      inputBox.strokeWeight = 1.5;
      inputBox.strokeAlign = "INSIDE";
    }

    const placeholder = await makeText(
      state === "error" ? "nombre-invalido@" : "Nombre del negocio",
      14,
      "Regular",
      state === "error" ? "#111827" : "#9CA3AF"
    );
    inputBox.appendChild(placeholder);
    group.appendChild(inputBox);

    // Error message
    if (state === "error") {
      const errMsg = await makeText("Este campo es requerido", 12, "Regular", "#EF4444");
      group.appendChild(errMsg);
    }

    return group;
  }

  const inputsFrame = figma.createFrame();
  inputsFrame.name = "Inputs";
  inputsFrame.x = 40;
  inputsFrame.y = 480;
  inputsFrame.resize(400, 280);
  inputsFrame.fills = solidFill("#F8FAFC");
  inputsFrame.cornerRadius = 12;
  inputsFrame.layoutMode = "VERTICAL";
  inputsFrame.itemSpacing = 20;
  inputsFrame.paddingLeft = 24;
  inputsFrame.paddingRight = 24;
  inputsFrame.paddingTop = 40;
  inputsFrame.paddingBottom = 24;
  inputsFrame.primaryAxisSizingMode = "FIXED";
  inputsFrame.counterAxisSizingMode = "FIXED";
  page.appendChild(inputsFrame);

  const inputLabel = await makeText("Input Fields", 11, "SemiBold", "#94A3B8");
  inputLabel.x = 24;
  inputLabel.y = 16;
  inputsFrame.appendChild(inputLabel);

  const inputStates = [
    { label: "Nombre del negocio", state: "normal" },
    { label: "Sitio web",          state: "focus"  },
    { label: "Email",              state: "error"  },
  ];

  for (const d of inputStates) {
    const inp = await createInputGroup(d.label, d.state);
    inputsFrame.appendChild(inp);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. CARDS (x=40, y=780, w=960, h=240)
  // ════════════════════════════════════════════════════════════════════════════

  async function createKPICard() {
    const card = figma.createComponent();
    card.name = "Card / KPI";
    card.resize(280, 160);
    card.cornerRadius = 12;
    card.fills = solidFill("#FFFFFF");
    card.strokes = strokeBorder("#E5E7EB");
    card.strokeWeight = 1;
    card.strokeAlign = "INSIDE";
    card.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.06 },
      offset: { x: 0, y: 2 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    }];
    card.layoutMode = "VERTICAL";
    card.itemSpacing = 8;
    card.paddingLeft = 20;
    card.paddingRight = 20;
    card.paddingTop = 20;
    card.paddingBottom = 20;
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "FIXED";

    // Icon placeholder
    const iconBox = figma.createFrame();
    iconBox.resize(32, 32);
    iconBox.cornerRadius = 8;
    iconBox.fills = solidFill("#EEF2FF");
    iconBox.strokes = [];
    const iconTxt = await makeText("⚡", 16, "Regular", "#4F46E5");
    iconBox.appendChild(iconTxt);
    iconTxt.x = 7;
    iconTxt.y = 6;
    card.appendChild(iconBox);

    // Number
    const num = await makeText("12,450", 28, "Bold", "#111827");
    card.appendChild(num);

    // Label
    const lbl = await makeText("Clientes activos", 12, "Regular", "#6B7280");
    card.appendChild(lbl);

    // Trend
    const trend = await makeText("↑ 8.2% este mes", 11, "Medium", "#059669");
    card.appendChild(trend);

    return card;
  }

  async function createContentCard() {
    const card = figma.createComponent();
    card.name = "Card / Content";
    card.resize(280, 160);
    card.cornerRadius = 12;
    card.fills = solidFill("#FFFFFF");
    card.strokes = strokeBorder("#E5E7EB");
    card.strokeWeight = 1;
    card.strokeAlign = "INSIDE";
    card.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.06 },
      offset: { x: 0, y: 2 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    }];
    card.layoutMode = "VERTICAL";
    card.itemSpacing = 10;
    card.paddingLeft = 20;
    card.paddingRight = 20;
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "FIXED";

    // Header
    const header = await makeText("Automatizaciones", 15, "SemiBold", "#111827");
    card.appendChild(header);

    // Divider
    const divider = figma.createFrame();
    divider.resize(240, 1);
    divider.fills = solidFill("#F1F5F9");
    divider.strokes = [];
    card.appendChild(divider);

    // Body placeholder lines
    const body1 = await makeText("Resumen de flujos activos y", 12, "Regular", "#9CA3AF");
    const body2 = await makeText("métricas de automatización.", 12, "Regular", "#9CA3AF");
    card.appendChild(body1);
    card.appendChild(body2);

    return card;
  }

  async function createStatusCard() {
    const card = figma.createComponent();
    card.name = "Card / Status";
    card.resize(280, 160);
    card.cornerRadius = 12;
    card.fills = solidFill("#FFFFFF");
    card.strokes = strokeBorder("#E5E7EB");
    card.strokeWeight = 1;
    card.strokeAlign = "INSIDE";
    card.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.06 },
      offset: { x: 0, y: 2 },
      radius: 8,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    }];
    card.layoutMode = "VERTICAL";
    card.itemSpacing = 10;
    card.paddingLeft = 20;
    card.paddingRight = 20;
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "FIXED";

    // Header row (title + badge)
    const headerRow = figma.createFrame();
    headerRow.layoutMode = "HORIZONTAL";
    headerRow.primaryAxisAlignItems = "SPACE_BETWEEN";
    headerRow.counterAxisAlignItems = "CENTER";
    headerRow.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0 }];
    headerRow.strokes = [];
    headerRow.resize(240, 24);
    headerRow.primaryAxisSizingMode = "FIXED";
    headerRow.counterAxisSizingMode = "AUTO";

    const title = await makeText("Estado del sistema", 14, "SemiBold", "#111827");
    headerRow.appendChild(title);

    // Inline badge
    const badgeBox = figma.createFrame();
    badgeBox.layoutMode = "HORIZONTAL";
    badgeBox.primaryAxisAlignItems = "CENTER";
    badgeBox.counterAxisAlignItems = "CENTER";
    badgeBox.paddingLeft = 8;
    badgeBox.paddingRight = 8;
    badgeBox.paddingTop = 3;
    badgeBox.paddingBottom = 3;
    badgeBox.cornerRadius = 20;
    badgeBox.fills = solidFill("#ECFDF5");
    badgeBox.strokes = [];
    badgeBox.primaryAxisSizingMode = "AUTO";
    badgeBox.counterAxisSizingMode = "AUTO";

    const badgeTxt = await makeText("Activo", 11, "Medium", "#059669");
    badgeBox.appendChild(badgeTxt);
    headerRow.appendChild(badgeBox);

    card.appendChild(headerRow);

    // Divider
    const divider = figma.createFrame();
    divider.resize(240, 1);
    divider.fills = solidFill("#F1F5F9");
    divider.strokes = [];
    card.appendChild(divider);

    const body1 = await makeText("Todos los servicios operan", 12, "Regular", "#9CA3AF");
    const body2 = await makeText("con normalidad.", 12, "Regular", "#9CA3AF");
    card.appendChild(body1);
    card.appendChild(body2);

    return card;
  }

  const cardsFrame = figma.createFrame();
  cardsFrame.name = "Cards";
  cardsFrame.x = 40;
  cardsFrame.y = 780;
  cardsFrame.resize(960, 240);
  cardsFrame.fills = solidFill("#F8FAFC");
  cardsFrame.cornerRadius = 12;
  cardsFrame.layoutMode = "HORIZONTAL";
  cardsFrame.itemSpacing = 20;
  cardsFrame.paddingLeft = 24;
  cardsFrame.paddingRight = 24;
  cardsFrame.paddingTop = 40;
  cardsFrame.paddingBottom = 40;
  cardsFrame.counterAxisAlignItems = "CENTER";
  cardsFrame.primaryAxisSizingMode = "FIXED";
  cardsFrame.counterAxisSizingMode = "FIXED";
  page.appendChild(cardsFrame);

  const cardsLabel = await makeText("Cards", 11, "SemiBold", "#94A3B8");
  cardsLabel.x = 24;
  cardsLabel.y = 16;
  cardsFrame.appendChild(cardsLabel);

  cardsFrame.appendChild(await createKPICard());
  cardsFrame.appendChild(await createContentCard());
  cardsFrame.appendChild(await createStatusCard());

  // ════════════════════════════════════════════════════════════════════════════
  // 5. LOGO AUTOFLOW (x=40, y=1040, w=400, h=120)
  // ════════════════════════════════════════════════════════════════════════════

  const logoFrame = figma.createFrame();
  logoFrame.name = "Logo";
  logoFrame.x = 40;
  logoFrame.y = 1040;
  logoFrame.resize(400, 120);
  logoFrame.fills = solidFill("#FFFFFF");
  logoFrame.cornerRadius = 12;
  logoFrame.strokes = strokeBorder("#E5E7EB");
  logoFrame.strokeWeight = 1;
  logoFrame.strokeAlign = "INSIDE";
  page.appendChild(logoFrame);

  const logoLabel = await makeText("Logo / Principal", 11, "SemiBold", "#94A3B8");
  logoLabel.x = 24;
  logoLabel.y = 16;
  logoFrame.appendChild(logoLabel);

  // Hexágono (approximation using polygon node)
  // Figma API supports polygons via VectorNode with paths
  // We'll build the hexagon shape via createVector with path data

  // Points from SVG: "20,6 38,6 47,22 38,38 20,38 11,22"
  // Offset to center in the frame (logo starts around x=20, y=28 offset)
  const offsetX = 20;
  const offsetY = 28;

  const hexOuter = figma.createVector();
  hexOuter.vectorPaths = [{
    windingRule: "NONZERO",
    data: `M ${20 + offsetX} ${6 + offsetY} L ${38 + offsetX} ${6 + offsetY} L ${47 + offsetX} ${22 + offsetY} L ${38 + offsetX} ${38 + offsetY} L ${20 + offsetX} ${38 + offsetY} L ${11 + offsetX} ${22 + offsetY} Z`,
  }];
  hexOuter.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: { r: 79 / 255, g: 70 / 255, b: 229 / 255, a: 1 } },
      { position: 1, color: { r: 6 / 255,  g: 182 / 255, b: 212 / 255, a: 1 } },
    ],
  }];
  hexOuter.strokes = [];
  logoFrame.appendChild(hexOuter);

  // Inner hex overlay (dark tint)
  const hexInner = figma.createVector();
  hexInner.vectorPaths = [{
    windingRule: "NONZERO",
    data: `M ${23 + offsetX} ${13 + offsetY} L ${35 + offsetX} ${13 + offsetY} L ${41 + offsetX} ${22 + offsetY} L ${35 + offsetX} ${31 + offsetY} L ${23 + offsetX} ${31 + offsetY} L ${17 + offsetX} ${22 + offsetY} Z`,
  }];
  hexInner.fills = [{ type: "SOLID", color: { r: 15 / 255, g: 23 / 255, b: 42 / 255 }, opacity: 0.5 }];
  hexInner.strokes = [];
  logoFrame.appendChild(hexInner);

  // Center dot
  const dot = figma.createEllipse();
  dot.resize(9, 9);
  dot.x = 29 + offsetX - 4.5;
  dot.y = 22 + offsetY - 4.5;
  dot.fills = solidFill("#FFFFFF");
  dot.strokes = [];
  logoFrame.appendChild(dot);

  // Wordmark "Auto"
  const wordAuto = await makeText("Auto", 21, "ExtraBold", "#F1F5F9");
  wordAuto.x = 55 + offsetX;
  wordAuto.y = 27 + offsetY - 18;
  logoFrame.appendChild(wordAuto);

  // Wordmark "Flow" — gradient fill
  const wordFlow = await makeText("Flow", 21, "ExtraBold", "#4F46E5");
  wordFlow.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: { r: 79 / 255, g: 70 / 255, b: 229 / 255, a: 1 } },
      { position: 1, color: { r: 6 / 255,  g: 182 / 255, b: 212 / 255, a: 1 } },
    ],
  }];
  wordFlow.x = 107 + offsetX;
  wordFlow.y = 27 + offsetY - 18;
  logoFrame.appendChild(wordFlow);

  // ─── Final: fit viewport ────────────────────────────────────────────────────

  figma.viewport.scrollAndZoomIntoView([
    buttonsFrame, badgesFrame, inputsFrame, cardsFrame, logoFrame,
  ]);

  figma.notify(
    "✅ AutoFlow Design System — Fase A completada: Buttons · Badges · Inputs · Cards · Logo",
    { timeout: 5000 }
  );

  figma.closePlugin();
})();
