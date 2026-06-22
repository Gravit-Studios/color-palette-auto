// ── Color math ──────────────────────────────────────────────────────────────

function hexToHsl(hex) {
  const [r, g, b] = [hex.slice(1,3), hex.slice(3,5), hex.slice(5,7)]
    .map(v => parseInt(v, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * (l - c)).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function lum(hex) {
  const [r, g, b] = [hex.slice(1,3), hex.slice(3,5), hex.slice(5,7)]
    .map(v => parseInt(v, 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function contrastHex(bg) {
  return lum(bg) > 0.5 ? '#1a1a1a' : '#f5f5f5';
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ── Shade generation ─────────────────────────────────────────────────────────

function buildShades(hex) {
  const [h, s, baseL] = hexToHsl(hex);
  const stops = [
    { stop: 50,  l: clamp(baseL + 44, 2, 97), s: clamp(s * 0.25, 0, 100) },
    { stop: 100, l: clamp(baseL + 36, 2, 97), s: clamp(s * 0.35, 0, 100) },
    { stop: 200, l: clamp(baseL + 24, 2, 97), s: clamp(s * 0.5,  0, 100) },
    { stop: 300, l: clamp(baseL + 14, 2, 97), s: clamp(s * 0.7,  0, 100) },
    { stop: 400, l: clamp(baseL + 5,  2, 97), s: clamp(s * 0.85, 0, 100) },
    { stop: 500, l: baseL,                     s: s },
    { stop: 600, l: clamp(baseL - 10, 2, 97), s: clamp(s + 5,   0, 100) },
    { stop: 700, l: clamp(baseL - 20, 2, 97), s: clamp(s + 8,   0, 100) },
    { stop: 800, l: clamp(baseL - 30, 2, 97), s: clamp(s + 10,  0, 100) },
    { stop: 900, l: clamp(baseL - 40, 2, 97), s: clamp(s + 12,  0, 100) },
    { stop: 950, l: clamp(baseL - 46, 2, 97), s: clamp(s + 14,  0, 100) },
  ];
  return stops.map(({ stop, l, s: si }) => ({ stop, hex: hslToHex(h, si, l) }));
}

// ── Semantic tokens ───────────────────────────────────────────────────────────

function buildTokens(sh) {
  const light = [
    { role: 'background', desc: 'Fundo de página',     hex: sh[0].hex,  stop: 50  },
    { role: 'surface',    desc: 'Cards e painéis',      hex: sh[1].hex,  stop: 100 },
    { role: 'subtle',     desc: 'Bordas e divisores',   hex: sh[2].hex,  stop: 200 },
    { role: 'muted',      desc: 'Ícones inativos',      hex: sh[3].hex,  stop: 300 },
    { role: 'default',    desc: 'Cor primária',         hex: sh[5].hex,  stop: 500 },
    { role: 'emphasis',   desc: 'Hover / ativo',        hex: sh[6].hex,  stop: 600 },
    { role: 'strong',     desc: 'Texto em destaque',    hex: sh[8].hex,  stop: 800 },
    { role: 'on-primary', desc: 'Texto sobre primária', hex: contrastHex(sh[5].hex), stop: null },
  ];
  const dark = [
    { role: 'background', desc: 'Fundo de página',     hex: sh[10].hex, stop: 950 },
    { role: 'surface',    desc: 'Cards e painéis',      hex: sh[9].hex,  stop: 900 },
    { role: 'subtle',     desc: 'Bordas e divisores',   hex: sh[8].hex,  stop: 800 },
    { role: 'muted',      desc: 'Ícones inativos',      hex: sh[6].hex,  stop: 600 },
    { role: 'default',    desc: 'Cor primária',         hex: sh[4].hex,  stop: 400 },
    { role: 'emphasis',   desc: 'Hover / ativo',        hex: sh[3].hex,  stop: 300 },
    { role: 'strong',     desc: 'Texto em destaque',    hex: sh[1].hex,  stop: 100 },
    { role: 'on-primary', desc: 'Texto sobre primária', hex: contrastHex(sh[4].hex), stop: null },
  ];
  return { light, dark };
}

// ── State ─────────────────────────────────────────────────────────────────────

let shades = [], ltTokens = [], dkTokens = [];

// ── Render: tokens ────────────────────────────────────────────────────────────

function renderTokenFrame(tokens, isDark, id) {
  const bg       = isDark ? '#111110' : '#ffffff';
  const border   = isDark ? '#2e2e2c' : '#e8e8e4';
  const textMain = isDark ? '#f0f0ee' : '#1a1a1a';
  const textSub  = isDark ? '#777'    : '#999';

  document.getElementById(id).innerHTML = tokens.map(t => `
    <div class="token-row" style="border-color:${border};background:${bg}" onclick="copy('${t.hex}')">
      <div class="token-swatch" style="background:${t.hex}"></div>
      <div class="token-info">
        <div class="token-role" style="color:${textMain}">${t.role}</div>
        <div class="token-desc" style="color:${textSub}">${t.desc}${t.stop !== null ? ' · ' + t.stop : ''}</div>
      </div>
      <div class="token-hex" style="color:${textSub}">${t.hex}</div>
    </div>
  `).join('');
}

// ── Render: scale ─────────────────────────────────────────────────────────────

function renderScale(sh) {
  document.getElementById('scale-row').innerHTML = sh.map(s =>
    `<div class="scale-swatch" style="background:${s.hex}" title="${s.stop} · ${s.hex}" onclick="copy('${s.hex}')"></div>`
  ).join('');

  const recLight = [
    { label: 'Fundo',       hex: sh[0].hex },
    { label: 'Primária',    hex: sh[5].hex },
    { label: 'Hover',       hex: sh[6].hex },
    { label: 'Texto forte', hex: sh[8].hex },
  ];
  const recDark = [
    { label: 'Fundo',       hex: sh[10].hex },
    { label: 'Primária',    hex: sh[4].hex },
    { label: 'Hover',       hex: sh[3].hex },
    { label: 'Texto forte', hex: sh[1].hex },
  ];

  const recHtml = (items, isDark) => items.map(r => `
    <div class="rec-row" onclick="copy('${r.hex}')">
      <div class="rec-swatch" style="background:${r.hex};border:0.5px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}"></div>
      <span class="rec-label">${r.label}</span>
      <span class="rec-hex">${r.hex}</span>
    </div>
  `).join('');

  document.getElementById('rec-light').innerHTML = recHtml(recLight, false);
  document.getElementById('rec-dark').innerHTML  = recHtml(recDark,  true);
}

// ── Render: preview ───────────────────────────────────────────────────────────

function renderPreview(sh) {
  const ltAccent  = sh[5].hex, ltHov = sh[6].hex;
  const ltBg = sh[0].hex, ltSurf = sh[1].hex, ltBorder = sh[2].hex;
  const ltText = sh[9].hex, ltSub = sh[7].hex;

  const dkAccent = sh[4].hex, dkHov = sh[3].hex;
  const dkBg = sh[10].hex, dkSurf = sh[9].hex, dkBorder = sh[8].hex;
  const dkText = sh[1].hex, dkSub = sh[3].hex;

  const card = (accent, bg, surf, border, text, sub, label) => {
    const ct = contrastHex(accent);
    return `
      <div class="preview-card" style="background:${bg};border-color:${border}">
        <div class="mode-title">${label}</div>
        <div class="preview-inner-card" style="background:${surf};border-color:${border}">
          <div class="preview-title" style="color:${text}">Card de exemplo</div>
          <div class="preview-sub" style="color:${sub}">Texto de apoio com a paleta gerada.</div>
          <div style="margin-top:8px;display:flex;gap:6px">
            <span class="chip" style="background:${accent}22;color:${accent}">Tag</span>
            <span class="chip" style="background:${accent}11;color:${sub}">Outro</span>
          </div>
        </div>
        <button class="preview-btn" style="background:${accent};color:${ct}">Ação primária</button>
        <button class="preview-btn-outline" style="color:${accent};border:1.5px solid ${accent}">Ação secundária</button>
        <div class="avatar-row" style="background:${accent}18">
          <div class="avatar" style="background:${accent};color:${ct}">AB</div>
          <div>
            <div class="avatar-name" style="color:${text}">Ana Beatriz</div>
            <div class="avatar-role" style="color:${sub}">Admin</div>
          </div>
          <span class="chip" style="margin-left:auto;background:${accent};color:${ct}">Ativo</span>
        </div>
      </div>
    `;
  };

  document.getElementById('preview-grid').innerHTML =
    card(ltAccent, ltBg, ltSurf, ltBorder, ltText, ltSub, '☀️ Light mode') +
    card(dkAccent, dkBg, dkSurf, dkBorder, dkText, dkSub, '🌙 Dark mode');
}

// ── Export ────────────────────────────────────────────────────────────────────

function exp(fmt) {
  const lt = ltTokens, dk = dkTokens;
  let out = '';

  if (fmt === 'css') {
    const ltVars = lt.map(t => `  --color-${t.role}: ${t.hex};`).join('\n');
    const dkVars = dk.map(t => `    --color-${t.role}: ${t.hex};`).join('\n');
    out = `:root {\n${ltVars}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${dkVars}\n  }\n}`;
  } else if (fmt === 'tailwind') {
    const ltMap = lt.map(t => `      '${t.role}': '${t.hex}',`).join('\n');
    const dkMap = dk.map(t => `      '${t.role}': '${t.hex}',`).join('\n');
    out = `// tailwind.config.js\ncolors: {\n  light: {\n${ltMap}\n  },\n  dark: {\n${dkMap}\n  }\n}`;
  } else if (fmt === 'json') {
    const lj = {}, dj = {};
    lt.forEach(t => lj[t.role] = t.hex);
    dk.forEach(t => dj[t.role] = t.hex);
    out = JSON.stringify({ light: lj, dark: dj }, null, 2);
  } else if (fmt === 'figma') {
    const fj = { light: {}, dark: {} };
    lt.forEach(t => fj.light[`color.${t.role}`] = { value: t.hex, type: 'color' });
    dk.forEach(t => fj.dark[`color.${t.role}`]  = { value: t.hex, type: 'color' });
    out = JSON.stringify(fj, null, 2);
  }

  document.getElementById('exp-area').textContent = out;
}

function copyExport() {
  const text = document.getElementById('exp-area').textContent;
  navigator.clipboard.writeText(text).catch(() => {});
  showToast('Código copiado!');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function copy(hex) {
  navigator.clipboard.writeText(hex).catch(() => {});
  showToast(hex + ' copiado!');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1600);
}

function tab(name, el) {
  ['tokens', 'scale', 'preview', 'export'].forEach(n => {
    document.getElementById('t-' + n).classList.toggle('hidden', n !== name);
  });
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function gen() {
  const hex = document.getElementById('bc').value;
  document.getElementById('hx').value = hex;
  shades = buildShades(hex);
  const { light, dark } = buildTokens(shades);
  ltTokens = light; dkTokens = dark;
  renderTokenFrame(ltTokens, false, 'lt-frame');
  renderTokenFrame(dkTokens, true,  'dk-frame');
  renderScale(shades);
  renderPreview(shades);
}

function rnd() {
  const h = Math.floor(Math.random() * 360);
  const s = 45 + Math.floor(Math.random() * 45);
  const l = 38 + Math.floor(Math.random() * 22);
  const hex = hslToHex(h, s, l);
  document.getElementById('bc').value = hex;
  document.getElementById('hx').value = hex;
  gen();
}

// Sync color picker ↔ text input
document.getElementById('bc').addEventListener('input', e => {
  document.getElementById('hx').value = e.target.value;
  gen();
});
document.getElementById('hx').addEventListener('input', e => {
  const v = e.target.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    document.getElementById('bc').value = v;
    gen();
  }
});

// Init
gen();
