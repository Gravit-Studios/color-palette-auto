// ── Color math ────────────────────────────────────────────────────────────────

function hexToHsl(hex) {
  const [r,g,b] = [hex.slice(1,3),hex.slice(3,5),hex.slice(5,7)].map(v=>parseInt(v,16)/255);
  const max=Math.max(r,g,b), min=Math.min(r,g,b), l=(max+min)/2;
  let h=0, s=0;
  if (max!==min) {
    const d=max-min;
    s = l>.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h,s,l) {
  s/=100; l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12,c=a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*(l-c)).toString(16).padStart(2,'0')};
  return '#'+f(0)+f(8)+f(4);
}

function lum(hex) {
  const [r,g,b]=[hex.slice(1,3),hex.slice(3,5),hex.slice(5,7)].map(v=>parseInt(v,16)/255);
  return .299*r+.587*g+.114*b;
}

function contrastOn(bg)  { return lum(bg)>.5?'#111111':'#ffffff'; }
function clamp(v,mn,mx)  { return Math.max(mn,Math.min(mx,v)); }

function contrastRatio(a,b) {
  const la=lum(a), lb=lum(b);
  return ((Math.max(la,lb)+.05)/(Math.min(la,lb)+.05)).toFixed(1);
}

// ── Scale 100–900 ─────────────────────────────────────────────────────────────

function buildLightScale(hex) {
  const [h,s,L]=hexToHsl(hex);
  return [
    {stop:100, hex:hslToHex(h,clamp(s*.16,0,100),clamp(L+44,3,97))},
    {stop:200, hex:hslToHex(h,clamp(s*.28,0,100),clamp(L+32,3,97))},
    {stop:300, hex:hslToHex(h,clamp(s*.48,0,100),clamp(L+20,3,97))},
    {stop:400, hex:hslToHex(h,clamp(s*.70,0,100),clamp(L+ 9,3,97))},
    {stop:500, hex:hex},
    {stop:600, hex:hslToHex(h,clamp(s*1.05,0,100),clamp(L- 9,3,97))},
    {stop:700, hex:hslToHex(h,clamp(s*1.10,0,100),clamp(L-19,3,97))},
    {stop:800, hex:hslToHex(h,clamp(s*1.13,0,100),clamp(L-30,3,97))},
    {stop:900, hex:hslToHex(h,clamp(s*1.15,0,100),clamp(L-40,3,97))},
  ].map(s=>({...s, textColor:contrastOn(s.hex)}));
}

function buildDarkScale(hex) {
  const [h,s,L]=hexToHsl(hex);
  return [
    {stop:100, hex:hslToHex(h,clamp(s*.10,0,100),clamp(L-43,3,97))},
    {stop:200, hex:hslToHex(h,clamp(s*.20,0,100),clamp(L-33,3,97))},
    {stop:300, hex:hslToHex(h,clamp(s*.38,0,100),clamp(L-22,3,97))},
    {stop:400, hex:hslToHex(h,clamp(s*.62,0,100),clamp(L-10,3,97))},
    {stop:500, hex:hslToHex(h,clamp(s*.88,0,100),clamp(L+ 5,3,97))},
    {stop:600, hex:hslToHex(h,clamp(s*.80,0,100),clamp(L+16,3,97))},
    {stop:700, hex:hslToHex(h,clamp(s*.60,0,100),clamp(L+26,3,97))},
    {stop:800, hex:hslToHex(h,clamp(s*.36,0,100),clamp(L+36,3,97))},
    {stop:900, hex:hslToHex(h,clamp(s*.16,0,100),clamp(L+44,3,97))},
  ].map(s=>({...s, textColor:contrastOn(s.hex)}));
}

// ── Semantic tokens ───────────────────────────────────────────────────────────

function buildTokens(ls, ds) {
  const get = (scale,stop) => scale.find(s=>s.stop===stop).hex;
  return {
    light: [
      {role:'background', desc:'Fundo da página',     hex:get(ls,100), stop:100},
      {role:'surface',    desc:'Cards e painéis',      hex:get(ls,200), stop:200},
      {role:'border',     desc:'Bordas e divisores',   hex:get(ls,300), stop:300},
      {role:'muted',      desc:'Ícones e labels',      hex:get(ls,400), stop:400},
      {role:'primary',    desc:'Cor de marca',         hex:get(ls,500), stop:500},
      {role:'emphasis',   desc:'Hover / estado ativo', hex:get(ls,600), stop:600},
      {role:'strong',     desc:'Texto de destaque',    hex:get(ls,800), stop:800},
      {role:'on-primary', desc:'Texto sobre primária', hex:contrastOn(get(ls,500)), stop:null},
    ],
    dark: [
      {role:'background', desc:'Fundo da página',     hex:get(ds,100), stop:100},
      {role:'surface',    desc:'Cards e painéis',      hex:get(ds,200), stop:200},
      {role:'border',     desc:'Bordas e divisores',   hex:get(ds,300), stop:300},
      {role:'muted',      desc:'Ícones e labels',      hex:get(ds,400), stop:400},
      {role:'primary',    desc:'Cor de marca',         hex:get(ds,500), stop:500},
      {role:'emphasis',   desc:'Hover / estado ativo', hex:get(ds,600), stop:600},
      {role:'strong',     desc:'Texto de destaque',    hex:get(ds,800), stop:800},
      {role:'on-primary', desc:'Texto sobre primária', hex:contrastOn(get(ds,500)), stop:null},
    ],
  };
}

// ── State ─────────────────────────────────────────────────────────────────────
let LS=[], DS=[], LT=[], DK=[];

// ── Render: token tables ──────────────────────────────────────────────────────
function renderTokenTable(tokens, id) {
  document.getElementById(id).innerHTML = tokens.map(t=>`
    <div class="token-row" onclick="copy('${t.hex}')">
      <div class="token-swatch" style="background:${t.hex}"></div>
      <div class="token-info">
        <div class="token-name">${t.role}</div>
        <div class="token-desc">${t.desc}${t.stop!==null?' · '+t.stop:''}</div>
      </div>
      <div class="token-hex">${t.hex.toUpperCase()}</div>
    </div>`).join('');
}

// ── Render: bands ─────────────────────────────────────────────────────────────
function renderBand(scale, id) {
  document.getElementById(id).innerHTML = scale.map(s=>`
    <div class="band-swatch" style="background:${s.hex}" onclick="copy('${s.hex}')" title="${s.stop} · ${s.hex}">
      <span class="band-stop" style="color:${s.textColor}">${s.stop}</span>
    </div>`).join('');
}

// ── Render: scale list ────────────────────────────────────────────────────────
function renderScaleList(scale, isDark, id) {
  const refBg  = isDark ? scale[0].hex : '#ffffff';
  const label  = isDark ? '🌙 Dark' : '☀️ Light';
  document.getElementById(id).innerHTML = `
    <div class="scale-list-header">${label}</div>
    ${scale.map(s=>{
      const cr   = contrastRatio(s.hex, refBg);
      const pass = parseFloat(cr) >= 4.5;
      return `
        <div class="scale-item" onclick="copy('${s.hex}')">
          <div class="scale-swatch" style="background:${s.hex}"></div>
          <span class="scale-stop">${s.stop}</span>
          <span class="scale-hex">${s.hex.toUpperCase()}</span>
          <span class="contrast-badge ${pass?'contrast-badge--pass':'contrast-badge--fail'}">${cr}:1</span>
        </div>`;
    }).join('')}`;
}

// ── Render: preview ───────────────────────────────────────────────────────────
function renderPreview() {
  function card(scale, isDark) {
    const bg    = scale[0].hex;
    const surf  = scale[1].hex;
    const bdr   = scale[2].hex;
    const prim  = scale[4].hex;
    const ctP   = contrastOn(prim);
    const text  = scale[8].hex;
    const sub   = scale[6].hex;
    const label = isDark ? '🌙 Dark mode' : '☀️ Light mode';
    return `
      <div class="prev-card" style="background:${bg};border-color:${bdr}">
        <div class="prev-mode-label" style="color:${sub}">${label}</div>
        <div class="prev-inner" style="background:${surf};border-color:${bdr}">
          <div class="prev-title" style="color:${text}">Card de exemplo</div>
          <div class="prev-sub" style="color:${sub}">Texto de suporte com a paleta gerada.</div>
          <div class="prev-tags">
            <span class="tag" style="background:${prim}22;color:${prim}">Design</span>
            <span class="tag" style="background:${prim}11;color:${sub}">System</span>
          </div>
        </div>
        <div class="prev-actions">
          <button class="prev-btn" style="background:${prim};color:${ctP}">Ação primária</button>
          <button class="prev-btn prev-btn--outline" style="color:${prim};border:1.5px solid ${prim}">Ação secundária</button>
        </div>
        <div class="prev-avatar-row" style="background:${prim}14">
          <div class="prev-avatar" style="background:${prim};color:${ctP}">AB</div>
          <div>
            <div class="prev-avatar-name" style="color:${text}">Ana Beatriz</div>
            <div class="prev-avatar-role" style="color:${sub}">Product Designer</div>
          </div>
          <span class="tag" style="margin-left:auto;background:${prim};color:${ctP}">Ativo</span>
        </div>
      </div>`;
  }
  document.getElementById('preview-grid').innerHTML = card(LS,false)+card(DS,true);
}

// ── Export ────────────────────────────────────────────────────────────────────
function exp(fmt, el) {
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('is-active'));
  el.classList.add('is-active');
  const lt=LT, dk=DK;
  let out='';

  if(fmt==='css'){
    const lv=lt.map(t=>`  --color-${t.role}: ${t.hex};`).join('\n');
    const dv=dk.map(t=>`    --color-${t.role}: ${t.hex};`).join('\n');
    const ls=LS.map(s=>`  --scale-${s.stop}: ${s.hex};`).join('\n');
    const ds=DS.map(s=>`    --scale-${s.stop}: ${s.hex};`).join('\n');
    out=`:root {\n  /* Tokens — light */\n${lv}\n\n  /* Scale — light */\n${ls}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    /* Tokens — dark */\n${dv}\n\n    /* Scale — dark */\n${ds}\n  }\n}`;
  } else if(fmt==='tailwind'){
    const lm=lt.map(t=>`        '${t.role}': '${t.hex}',`).join('\n');
    const dm=dk.map(t=>`        '${t.role}': '${t.hex}',`).join('\n');
    const ls=LS.map(s=>`        ${s.stop}: '${s.hex}',`).join('\n');
    const ds=DS.map(s=>`        ${s.stop}: '${s.hex}',`).join('\n');
    out=`/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        light: {\n${lm}\n          scale: {\n${ls}\n          },\n        },\n        dark: {\n${dm}\n          scale: {\n${ds}\n          },\n        },\n      },\n    },\n  },\n};`;
  } else if(fmt==='json'){
    const lj={},dj={},lsc={},dsc={};
    lt.forEach(t=>lj[t.role]=t.hex); dk.forEach(t=>dj[t.role]=t.hex);
    LS.forEach(s=>lsc[s.stop]=s.hex); DS.forEach(s=>dsc[s.stop]=s.hex);
    out=JSON.stringify({light:{tokens:lj,scale:lsc},dark:{tokens:dj,scale:dsc}},null,2);
  } else if(fmt==='figma'){
    const fj={light:{},dark:{}};
    lt.forEach(t=>fj.light[`color/${t.role}`]={value:t.hex,type:'color'});
    dk.forEach(t=>fj.dark[`color/${t.role}`]={value:t.hex,type:'color'});
    LS.forEach(s=>fj.light[`scale/${s.stop}`]={value:s.hex,type:'color'});
    DS.forEach(s=>fj.dark[`scale/${s.stop}`]={value:s.hex,type:'color'});
    out=JSON.stringify(fj,null,2);
  }
  document.getElementById('exp-area').textContent=out;
}

function copyExport() {
  navigator.clipboard.writeText(document.getElementById('exp-area').textContent).catch(()=>{});
  const btn=document.getElementById('copy-btn');
  btn.textContent='Copiado!';
  setTimeout(()=>btn.textContent='Copiar',1600);
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function copy(hex) {
  navigator.clipboard.writeText(hex).catch(()=>{});
  const t=document.getElementById('toast');
  t.textContent=hex.toUpperCase()+' copiado';
  t.classList.add('is-visible');
  setTimeout(()=>t.classList.remove('is-visible'),1600);
}

function switchTab(name, el) {
  ['tokens','scale','preview','export'].forEach(n=>{
    document.getElementById('t-'+n).classList.toggle('is-hidden', n!==name);
  });
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('is-active'));
  el.classList.add('is-active');
}

// ── Main ──────────────────────────────────────────────────────────────────────
function gen() {
  const hex=document.getElementById('bc').value;
  document.getElementById('hx').value=hex;
  document.getElementById('color-thumb').style.background=hex;

  LS=buildLightScale(hex);
  DS=buildDarkScale(hex);
  const {light,dark}=buildTokens(LS,DS);
  LT=light; DK=dark;

  renderTokenTable(LT,'lt-frame');
  renderTokenTable(DK,'dk-frame');
  renderBand(LS,'band-light');
  renderBand(DS,'band-dark');
  renderScaleList(LS,false,'scale-light');
  renderScaleList(DS,true,'scale-dark');
  renderPreview();
}

function rnd() {
  const h=Math.floor(Math.random()*360), s=50+Math.floor(Math.random()*40), l=38+Math.floor(Math.random()*20);
  const hex=hslToHex(h,s,l);
  document.getElementById('bc').value=hex;
  gen();
}

document.getElementById('bc').addEventListener('input',e=>{document.getElementById('hx').value=e.target.value;gen();});
document.getElementById('hx').addEventListener('input',e=>{const v=e.target.value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v)){document.getElementById('bc').value=v;gen();}});

gen();
