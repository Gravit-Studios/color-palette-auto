// ── Color math ────────────────────────────────────────────────────────────────

function hexToHsl(hex) {
  const [r, g, b] = [hex.slice(1,3), hex.slice(3,5), hex.slice(5,7)]
    .map(v => parseInt(v, 16) / 255);
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  const l = (max+min)/2;
  let h=0, s=0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h /= 6;
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h, s, l) {
  s/=100; l/=100;
  const a = s * Math.min(l, 1-l);
  const f = n => {
    const k = (n+h/30)%12;
    const c = a * Math.max(Math.min(k-3,9-k,1),-1);
    return Math.round(255*(l-c)).toString(16).padStart(2,'0');
  };
  return '#'+f(0)+f(8)+f(4);
}

function lum(hex) {
  const [r,g,b] = [hex.slice(1,3),hex.slice(3,5),hex.slice(5,7)]
    .map(v => parseInt(v,16)/255);
  return 0.299*r + 0.587*g + 0.114*b;
}

function contrastHex(bg) { return lum(bg) > 0.5 ? '#111111' : '#ffffff'; }
function clamp(v,mn,mx) { return Math.max(mn, Math.min(mx, v)); }

// ── Scale 100–900 ─────────────────────────────────────────────────────────────
// 100 = lightest, 500 = base, 900 = darkest

function buildScale(hex) {
  const [h, s, baseL] = hexToHsl(hex);
  const stops = [
    { stop:100, lDelta:+42, sMul:0.20 },
    { stop:200, lDelta:+30, sMul:0.38 },
    { stop:300, lDelta:+18, sMul:0.58 },
    { stop:400, lDelta:+ 8, sMul:0.80 },
    { stop:500, lDelta:  0, sMul:1.00 },  // base
    { stop:600, lDelta:- 9, sMul:1.05 },
    { stop:700, lDelta:-19, sMul:1.10 },
    { stop:800, lDelta:-30, sMul:1.13 },
    { stop:900, lDelta:-40, sMul:1.15 },
  ];
  return stops.map(({ stop, lDelta, sMul }) => ({
    stop,
    hex: hslToHex(
      h,
      clamp(Math.round(s * sMul), 0, 100),
      clamp(baseL + lDelta, 3, 97)
    )
  }));
}

// ── Light palette (9 stops: 100 light → 900 dark) ────────────────────────────
// Uses the scale as-is: 100=lightest bg, 500=brand, 900=darkest text

function buildLightPalette(scale) {
  return scale.map(({ stop, hex }) => {
    const isLight = stop <= 300;
    const textColor = contrastHex(hex);
    return { stop, hex, textColor, isLight };
  });
}

// ── Dark palette (inverted luminosity, same hue) ──────────────────────────────
// 100 = darkest bg tone, 500 = brand (adjusted), 900 = lightest text tone

function buildDarkPalette(hex) {
  const [h, s, baseL] = hexToHsl(hex);
  // In dark mode, invert the lightness curve
  const stops = [
    { stop:100, lDelta:-42, sMul:0.15 },  // deepest dark (bg)
    { stop:200, lDelta:-32, sMul:0.25 },
    { stop:300, lDelta:-22, sMul:0.45 },
    { stop:400, lDelta:-10, sMul:0.70 },
    { stop:500, lDelta:+ 5, sMul:0.90 },  // brand (slightly lighter in dark)
    { stop:600, lDelta:+15, sMul:0.85 },
    { stop:700, lDelta:+25, sMul:0.65 },
    { stop:800, lDelta:+36, sMul:0.40 },
    { stop:900, lDelta:+44, sMul:0.20 },  // lightest (text)
  ];
  return stops.map(({ stop, lDelta, sMul }) => {
    const h2 = hslToHex(h, clamp(Math.round(s*sMul),0,100), clamp(baseL+lDelta,3,97));
    return { stop, hex:h2, textColor:contrastHex(h2) };
  });
}

// ── Semantic tokens ───────────────────────────────────────────────────────────

function buildTokens(lightScale, darkScale) {
  const idx = stop => lightScale.findIndex(s => s.stop === stop);
  const didx = stop => darkScale.findIndex(s => s.stop === stop);

  const light = [
    { role:'background', desc:'Fundo da página',      hex: lightScale[idx(100)].hex, stop:100 },
    { role:'surface',    desc:'Cards e painéis',       hex: lightScale[idx(200)].hex, stop:200 },
    { role:'border',     desc:'Bordas e divisores',    hex: lightScale[idx(300)].hex, stop:300 },
    { role:'muted',      desc:'Ícones e texto fraco',  hex: lightScale[idx(400)].hex, stop:400 },
    { role:'primary',    desc:'Cor de marca',          hex: lightScale[idx(500)].hex, stop:500 },
    { role:'emphasis',   desc:'Hover / estado ativo',  hex: lightScale[idx(600)].hex, stop:600 },
    { role:'strong',     desc:'Texto de destaque',     hex: lightScale[idx(800)].hex, stop:800 },
    { role:'on-primary', desc:'Texto sobre primária',  hex: contrastHex(lightScale[idx(500)].hex), stop:null },
  ];

  const dark = [
    { role:'background', desc:'Fundo da página',      hex: darkScale[didx(100)].hex, stop:100 },
    { role:'surface',    desc:'Cards e painéis',       hex: darkScale[didx(200)].hex, stop:200 },
    { role:'border',     desc:'Bordas e divisores',    hex: darkScale[didx(300)].hex, stop:300 },
    { role:'muted',      desc:'Ícones e texto fraco',  hex: darkScale[didx(400)].hex, stop:400 },
    { role:'primary',    desc:'Cor de marca',          hex: darkScale[didx(500)].hex, stop:500 },
    { role:'emphasis',   desc:'Hover / estado ativo',  hex: darkScale[didx(600)].hex, stop:600 },
    { role:'strong',     desc:'Texto de destaque',     hex: darkScale[didx(800)].hex, stop:800 },
    { role:'on-primary', desc:'Texto sobre primária',  hex: contrastHex(darkScale[didx(500)].hex), stop:null },
  ];

  return { light, dark };
}

// ── State ─────────────────────────────────────────────────────────────────────

let lightScale=[], darkScale=[], ltTokens=[], dkTokens=[];

// ── Render: escala lado a lado ────────────────────────────────────────────────

function renderScales() {
  const stops = [100,200,300,400,500,600,700,800,900];

  function swatchRow(scale, isDark) {
    const bg = isDark ? '#0f0f0e' : '#fafaf8';
    const borderCol = isDark ? '#2a2a28' : '#e8e8e4';
    const labelCol  = isDark ? '#888' : '#aaa';
    return `
      <div style="background:${bg};border:0.5px solid ${borderCol};border-radius:12px;padding:16px;">
        <div style="font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:${labelCol};margin-bottom:12px;">
          ${isDark ? '🌙 Dark' : '☀️ Light'}
        </div>
        ${scale.map(s => `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;cursor:pointer;" onclick="copy('${s.hex}')">
            <div style="width:40px;height:36px;border-radius:6px;background:${s.hex};flex-shrink:0;"></div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:500;font-family:monospace;color:${isDark?'#ddd':'#333'}">${s.stop}</div>
              <div style="font-size:11px;font-family:monospace;color:${labelCol}">${s.hex}</div>
            </div>
            <div style="width:28px;height:28px;border-radius:50%;background:${s.hex};border:2px solid ${s.textColor}22;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:9px;font-weight:700;color:${s.textColor};font-family:monospace;">Aa</span>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  document.getElementById('scale-light').innerHTML = swatchRow(lightScale, false);
  document.getElementById('scale-dark').innerHTML  = swatchRow(darkScale,  true);
}

// ── Render: paleta visual (faixas) ───────────────────────────────────────────

function renderPaletteBands() {
  function band(scale, isDark) {
    const bg = isDark ? '#0f0f0e' : '#fafaf8';
    return `
      <div>
        <div style="font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#888;margin-bottom:8px;">${isDark?'🌙 Dark':'☀️ Light'}</div>
        <div style="display:flex;border-radius:10px;overflow:hidden;height:56px;">
          ${scale.map(s=>`
            <div style="flex:1;background:${s.hex};display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:flex .15s;" onclick="copy('${s.hex}')" title="${s.stop} · ${s.hex}">
              <span style="font-size:9px;font-weight:600;color:${s.textColor};font-family:monospace;opacity:.75;">${s.stop}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }
  document.getElementById('band-light').innerHTML = band(lightScale, false);
  document.getElementById('band-dark').innerHTML  = band(darkScale,  true);
}

// ── Render: tokens ────────────────────────────────────────────────────────────

function renderTokenFrame(tokens, isDark, id) {
  const bg      = isDark ? '#0f0f0e' : '#ffffff';
  const border  = isDark ? '#2a2a28' : '#e8e8e4';
  const txtMain = isDark ? '#f0f0ee' : '#1a1a1a';
  const txtSub  = isDark ? '#666'    : '#aaa';

  document.getElementById(id).innerHTML = tokens.map(t => `
    <div style="display:flex;align-items:center;border-bottom:0.5px solid ${border};background:${bg};cursor:pointer;" onclick="copy('${t.hex}')">
      <div style="width:50px;height:42px;background:${t.hex};flex-shrink:0;"></div>
      <div style="flex:1;padding:0 10px;">
        <div style="font-size:12px;font-weight:500;font-family:monospace;color:${txtMain};">${t.role}</div>
        <div style="font-size:11px;color:${txtSub};">${t.desc}${t.stop!==null?' · '+t.stop:''}</div>
      </div>
      <div style="font-size:11px;padding:0 10px;font-family:monospace;color:${txtSub};">${t.hex}</div>
    </div>
  `).join('');
}

// ── Render: preview ───────────────────────────────────────────────────────────

function renderPreview() {
  function card(scale, isDark) {
    const bg      = scale[0].hex;
    const surf    = scale[1].hex;
    const border  = scale[2].hex;
    const primary = scale[4].hex;
    const ctPrim  = contrastHex(primary);
    const text    = scale[8].hex;
    const sub     = scale[6].hex;
    const label   = isDark ? '🌙 Dark mode' : '☀️ Light mode';

    return `
      <div style="background:${bg};border-radius:12px;padding:1.25rem;border:0.5px solid ${border};">
        <div style="font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:${sub};margin-bottom:12px;">${label}</div>

        <div style="background:${surf};border-radius:8px;padding:12px;margin-bottom:12px;border:0.5px solid ${border};">
          <div style="font-size:14px;font-weight:500;color:${text};margin-bottom:4px;">Card de exemplo</div>
          <div style="font-size:12px;color:${sub};">Texto secundário com a paleta gerada.</div>
          <div style="margin-top:8px;display:flex;gap:6px;">
            <span style="font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px;background:${primary}22;color:${primary};">Tag</span>
            <span style="font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px;background:${primary}11;color:${sub};">Outro</span>
          </div>
        </div>

        <div style="display:grid;gap:8px;margin-bottom:12px;">
          <button onclick="void(0)" style="width:100%;padding:9px;border-radius:8px;border:none;background:${primary};color:${ctPrim};font-size:13px;font-weight:500;cursor:pointer;">Ação primária</button>
          <button onclick="void(0)" style="width:100%;padding:8px;border-radius:8px;border:1.5px solid ${primary};background:transparent;color:${primary};font-size:13px;cursor:pointer;">Ação secundária</button>
        </div>

        <div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;background:${primary}18;">
          <div style="width:34px;height:34px;border-radius:50%;background:${primary};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;color:${ctPrim};flex-shrink:0;">AB</div>
          <div>
            <div style="font-size:13px;font-weight:500;color:${text};">Ana Beatriz</div>
            <div style="font-size:11px;color:${sub};">Admin</div>
          </div>
          <span style="margin-left:auto;font-size:11px;font-weight:500;padding:3px 10px;border-radius:20px;background:${primary};color:${ctPrim};">Ativo</span>
        </div>

        <div style="margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
          ${[scale[0],scale[4],scale[8]].map(s=>`
            <div style="border-radius:6px;padding:8px;background:${s.hex};border:0.5px solid ${border};">
              <div style="font-size:10px;font-family:monospace;color:${s.textColor};opacity:.7;">${s.stop}</div>
              <div style="font-size:11px;font-family:monospace;color:${s.textColor};font-weight:500;">${s.hex}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  document.getElementById('preview-grid').innerHTML =
    card(lightScale, false) + card(darkScale, true);
}

// ── Export ────────────────────────────────────────────────────────────────────

function exp(fmt) {
  const lt = ltTokens, dk = dkTokens;
  let out = '';

  if (fmt === 'css') {
    const ltV = lt.map(t=>`  --color-${t.role}: ${t.hex};`).join('\n');
    const dkV = dk.map(t=>`    --color-${t.role}: ${t.hex};`).join('\n');
    const ltScale = lightScale.map(s=>`  --scale-${s.stop}: ${s.hex};`).join('\n');
    const dkScale = darkScale.map(s=>`    --scale-${s.stop}: ${s.hex};`).join('\n');
    out = `/* Light tokens */\n:root {\n${ltV}\n\n  /* Scale */\n${ltScale}\n}\n\n/* Dark tokens */\n@media (prefers-color-scheme: dark) {\n  :root {\n${dkV}\n\n    /* Scale */\n${dkScale}\n  }\n}`;

  } else if (fmt === 'tailwind') {
    const lM = lt.map(t=>`      '${t.role}': '${t.hex}',`).join('\n');
    const dM = dk.map(t=>`      '${t.role}': '${t.hex}',`).join('\n');
    const lS = lightScale.map(s=>`      ${s.stop}: '${s.hex}',`).join('\n');
    const dS = darkScale.map(s=>`      ${s.stop}: '${s.hex}',`).join('\n');
    out = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        light: {\n${lM}\n          scale: {\n${lS}\n          }\n        },\n        dark: {\n${dM}\n          scale: {\n${dS}\n          }\n        }\n      }\n    }\n  }\n}`;

  } else if (fmt === 'json') {
    const lj={}, dj={}, ls={}, ds={};
    lt.forEach(t=>lj[t.role]=t.hex);
    dk.forEach(t=>dj[t.role]=t.hex);
    lightScale.forEach(s=>ls[s.stop]=s.hex);
    darkScale.forEach(s=>ds[s.stop]=s.hex);
    out = JSON.stringify({ light:{tokens:lj,scale:ls}, dark:{tokens:dj,scale:ds} }, null, 2);

  } else if (fmt === 'figma') {
    const fj = { light:{}, dark:{} };
    lt.forEach(t=>fj.light[`color.${t.role}`]={value:t.hex,type:'color'});
    dk.forEach(t=>fj.dark[`color.${t.role}`]={value:t.hex,type:'color'});
    lightScale.forEach(s=>fj.light[`scale.${s.stop}`]={value:s.hex,type:'color'});
    darkScale.forEach(s=>fj.dark[`scale.${s.stop}`]={value:s.hex,type:'color'});
    out = JSON.stringify(fj, null, 2);
  }

  document.getElementById('exp-area').textContent = out;
}

function copyExport() {
  navigator.clipboard.writeText(document.getElementById('exp-area').textContent).catch(()=>{});
  showToast('Código copiado!');
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function copy(hex) {
  navigator.clipboard.writeText(hex).catch(()=>{});
  showToast(hex + ' copiado!');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1600);
}

function tab(name, el) {
  ['scale','tokens','preview','export'].forEach(n=>{
    document.getElementById('t-'+n).classList.toggle('hidden', n!==name);
  });
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function gen() {
  const hex = document.getElementById('bc').value;
  document.getElementById('hx').value = hex;

  lightScale = buildLightPalette(buildScale(hex));
  darkScale  = buildDarkPalette(hex);

  const { light, dark } = buildTokens(lightScale, darkScale);
  ltTokens = light; dkTokens = dark;

  renderPaletteBands();
  renderScales();
  renderTokenFrame(ltTokens, false, 'lt-frame');
  renderTokenFrame(dkTokens, true,  'dk-frame');
  renderPreview();
}

function rnd() {
  const h = Math.floor(Math.random()*360);
  const s = 50 + Math.floor(Math.random()*40);
  const l = 38 + Math.floor(Math.random()*20);
  const hex = hslToHex(h,s,l);
  document.getElementById('bc').value = hex;
  gen();
}

document.getElementById('bc').addEventListener('input', e=>{ document.getElementById('hx').value=e.target.value; gen(); });
document.getElementById('hx').addEventListener('input', e=>{
  const v=e.target.value.trim();
  if(/^#[0-9a-fA-F]{6}$/.test(v)){ document.getElementById('bc').value=v; gen(); }
});

gen();
