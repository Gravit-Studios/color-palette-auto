// ── Color math ────────────────────────────────────────────────────────────────

function hexToHsl(hex) {
  const [r,g,b] = [hex.slice(1,3),hex.slice(3,5),hex.slice(5,7)].map(v=>parseInt(v,16)/255);
  const max=Math.max(r,g,b), min=Math.min(r,g,b), l=(max+min)/2;
  let h=0,s=0;
  if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;}h/=6;}
  return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}

function hslToHex(h,s,l){
  s/=100;l/=100;const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12,c=a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*(l-c)).toString(16).padStart(2,'0')};
  return'#'+f(0)+f(8)+f(4);
}

function lum(hex){
  const [r,g,b]=[hex.slice(1,3),hex.slice(3,5),hex.slice(5,7)].map(v=>parseInt(v,16)/255);
  return .299*r+.587*g+.114*b;
}

function contrastHex(bg){ return lum(bg)>.5?'#111111':'#ffffff'; }
function clamp(v,mn,mx){ return Math.max(mn,Math.min(mx,v)); }

function contrastRatio(a,b){
  const la=lum(a),lb=lum(b);
  const lighter=Math.max(la,lb),darker=Math.min(la,lb);
  return ((lighter+.05)/(darker+.05)).toFixed(1);
}

// ── Scale 100–900 ─────────────────────────────────────────────────────────────

function buildLightScale(hex){
  const [h,s,baseL]=hexToHsl(hex);
  return [
    {stop:100, hex:hslToHex(h,clamp(s*.18,0,100),clamp(baseL+44,3,97))},
    {stop:200, hex:hslToHex(h,clamp(s*.30,0,100),clamp(baseL+32,3,97))},
    {stop:300, hex:hslToHex(h,clamp(s*.50,0,100),clamp(baseL+20,3,97))},
    {stop:400, hex:hslToHex(h,clamp(s*.72,0,100),clamp(baseL+ 9,3,97))},
    {stop:500, hex:hex},
    {stop:600, hex:hslToHex(h,clamp(s*1.05,0,100),clamp(baseL- 9,3,97))},
    {stop:700, hex:hslToHex(h,clamp(s*1.10,0,100),clamp(baseL-19,3,97))},
    {stop:800, hex:hslToHex(h,clamp(s*1.13,0,100),clamp(baseL-30,3,97))},
    {stop:900, hex:hslToHex(h,clamp(s*1.15,0,100),clamp(baseL-40,3,97))},
  ].map(s=>({...s,textColor:contrastHex(s.hex)}));
}

function buildDarkScale(hex){
  const [h,s,baseL]=hexToHsl(hex);
  return [
    {stop:100, hex:hslToHex(h,clamp(s*.12,0,100),clamp(baseL-43,3,97))},
    {stop:200, hex:hslToHex(h,clamp(s*.22,0,100),clamp(baseL-33,3,97))},
    {stop:300, hex:hslToHex(h,clamp(s*.40,0,100),clamp(baseL-22,3,97))},
    {stop:400, hex:hslToHex(h,clamp(s*.65,0,100),clamp(baseL-10,3,97))},
    {stop:500, hex:hslToHex(h,clamp(s*.90,0,100),clamp(baseL+ 5,3,97))},
    {stop:600, hex:hslToHex(h,clamp(s*.82,0,100),clamp(baseL+16,3,97))},
    {stop:700, hex:hslToHex(h,clamp(s*.62,0,100),clamp(baseL+26,3,97))},
    {stop:800, hex:hslToHex(h,clamp(s*.38,0,100),clamp(baseL+36,3,97))},
    {stop:900, hex:hslToHex(h,clamp(s*.18,0,100),clamp(baseL+44,3,97))},
  ].map(s=>({...s,textColor:contrastHex(s.hex)}));
}

// ── Tokens ────────────────────────────────────────────────────────────────────

function buildTokens(ls,ds){
  const l = (stop,desc,role) => ({role,desc,hex:ls.find(s=>s.stop===stop).hex,stop});
  const d = (stop,desc,role) => ({role,desc,hex:ds.find(s=>s.stop===stop).hex,stop});
  return {
    light:[
      l(100,'Fundo da página','background'),
      l(200,'Cards e painéis','surface'),
      l(300,'Bordas e divisores','border'),
      l(400,'Ícones e labels','muted'),
      l(500,'Cor de marca','primary'),
      l(600,'Hover / ativo','emphasis'),
      l(800,'Texto de destaque','strong'),
      {role:'on-primary',desc:'Texto sobre primária',hex:contrastHex(ls.find(s=>s.stop===500).hex),stop:null},
    ],
    dark:[
      d(100,'Fundo da página','background'),
      d(200,'Cards e painéis','surface'),
      d(300,'Bordas e divisores','border'),
      d(400,'Ícones e labels','muted'),
      d(500,'Cor de marca','primary'),
      d(600,'Hover / ativo','emphasis'),
      d(800,'Texto de destaque','strong'),
      {role:'on-primary',desc:'Texto sobre primária',hex:contrastHex(ds.find(s=>s.stop===500).hex),stop:null},
    ]
  };
}

// ── State ─────────────────────────────────────────────────────────────────────
let LS=[], DS=[], LT=[], DK=[];

// ── Render: mini scale (sidebar) ──────────────────────────────────────────────
function renderMini(){
  document.getElementById('mini-scale').innerHTML = LS.map(s=>
    `<div class="mini-scale-swatch" style="background:${s.hex}" title="${s.stop}" onclick="copy('${s.hex}')"></div>`
  ).join('');
}

// ── Render: bands ─────────────────────────────────────────────────────────────
function renderBand(scale, id){
  document.getElementById(id).innerHTML = scale.map(s=>`
    <div class="band-swatch" style="background:${s.hex}" onclick="copy('${s.hex}')" title="${s.stop} · ${s.hex}">
      <span class="band-stop" style="color:${s.textColor}">${s.stop}</span>
    </div>
  `).join('');
}

// ── Render: scale columns ─────────────────────────────────────────────────────
function renderScaleCol(scale, isDark, id){
  const icon = isDark
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>`;
  const label = isDark ? 'Dark' : 'Light';

  document.getElementById(id).innerHTML = `
    <div class="scale-col-header">${icon}&nbsp;${label}</div>
    ${scale.map(s=>{
      const bg = isDark ? '#0f0f0e' : '#ffffff';
      const cr = contrastRatio(s.hex, bg);
      const passAA = parseFloat(cr) >= 4.5;
      return `
        <div class="scale-row-item" onclick="copy('${s.hex}')">
          <div class="scale-swatch" style="background:${s.hex}"></div>
          <span class="scale-stop-num">${s.stop}</span>
          <span class="scale-hex">${s.hex.toUpperCase()}</span>
          <div class="contrast-pill" style="background:${passAA?'#1a3a1a':'#3a1a1a'};color:${passAA?'#4ade80':'#f87171'}">
            ${cr}:1
          </div>
        </div>`;
    }).join('')}`;
}

// ── Render: tokens ────────────────────────────────────────────────────────────
function renderTokens(tokens, isDark, id){
  const bg     = isDark?'#0f0f0e':'#ffffff';
  const border = isDark?'#2a2a28':'#eaeae6';
  const txt    = isDark?'#f0f0ee':'#1a1a1a';
  const sub    = isDark?'#55554e':'#b0b0a8';

  document.getElementById(id).innerHTML = `
    <div class="token-card" style="background:${bg};border-color:${border}">
      ${tokens.map(t=>`
        <div class="token-item" onclick="copy('${t.hex}')">
          <div class="token-swatch" style="background:${t.hex}"></div>
          <div class="token-body">
            <div class="token-role" style="color:${txt}">${t.role}</div>
            <div class="token-desc" style="color:${sub}">${t.desc}</div>
          </div>
          <div class="token-stop" style="color:${sub}">${t.stop!==null?t.stop:''}</div>
        </div>
      `).join('')}
    </div>`;
}

// ── Render: preview ───────────────────────────────────────────────────────────
function renderPreview(){
  function card(scale, isDark){
    const bg     = scale[0].hex;
    const surf   = scale[1].hex;
    const border = scale[2].hex;
    const prim   = scale[4].hex;
    const ctP    = contrastHex(prim);
    const text   = scale[8].hex;
    const sub    = scale[6].hex;
    const label  = isDark?'🌙 Dark mode':'☀️ Light mode';
    const badgeC = isDark?'#7b9ef0':'#c8a95a';
    const badgeBg= isDark?'#7b9ef01a':'#c8a95a1a';

    return `
      <div class="prev-card" style="background:${bg};border-color:${border}">
        <div class="prev-mode-badge" style="background:${badgeBg};color:${badgeC}">${label}</div>
        <div class="prev-inner" style="background:${surf};border:0.5px solid ${border}">
          <div class="prev-title" style="color:${text}">Componente de card</div>
          <div class="prev-sub" style="color:${sub}">Texto de suporte com a paleta aplicada no contexto certo.</div>
          <div class="prev-tags">
            <span class="tag" style="background:${prim}22;color:${prim}">Design</span>
            <span class="tag" style="background:${prim}11;color:${sub}">System</span>
          </div>
        </div>
        <button class="prev-btn" style="background:${prim};color:${ctP}">Ação primária</button>
        <button class="prev-btn-outline" style="color:${prim};border:1.5px solid ${prim}">Ação secundária</button>
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
  document.getElementById('preview-grid').innerHTML = card(LS,false) + card(DS,true);
}

// ── Export ────────────────────────────────────────────────────────────────────
function exp(fmt, el){
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active-pill'));
  el.classList.add('active-pill');

  const lt=LT, dk=DK;
  let out='';

  if(fmt==='css'){
    const lv=lt.map(t=>`  --color-${t.role}: ${t.hex};`).join('\n');
    const dv=dk.map(t=>`    --color-${t.role}: ${t.hex};`).join('\n');
    const ls=LS.map(s=>`  --scale-${s.stop}: ${s.hex};`).join('\n');
    const ds=DS.map(s=>`    --scale-${s.stop}: ${s.hex};`).join('\n');
    out=`:root {\n  /* Tokens semânticos — light */\n${lv}\n\n  /* Escala — light */\n${ls}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    /* Tokens semânticos — dark */\n${dv}\n\n    /* Escala — dark */\n${ds}\n  }\n}`;
  } else if(fmt==='tailwind'){
    const lm=lt.map(t=>`        '${t.role}': '${t.hex}',`).join('\n');
    const dm=dk.map(t=>`        '${t.role}': '${t.hex}',`).join('\n');
    const ls=LS.map(s=>`        ${s.stop}: '${s.hex}',`).join('\n');
    const ds=DS.map(s=>`        ${s.stop}: '${s.hex}',`).join('\n');
    out=`/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        light: {\n${lm}\n          scale: {\n${ls}\n          },\n        },\n        dark: {\n${dm}\n          scale: {\n${ds}\n          },\n        },\n      },\n    },\n  },\n};`;
  } else if(fmt==='json'){
    const lj={},dj={},lsc={},dsc={};
    lt.forEach(t=>lj[t.role]=t.hex);
    dk.forEach(t=>dj[t.role]=t.hex);
    LS.forEach(s=>lsc[s.stop]=s.hex);
    DS.forEach(s=>dsc[s.stop]=s.hex);
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

function copyExport(){
  const text=document.getElementById('exp-area').textContent;
  navigator.clipboard.writeText(text).catch(()=>{});
  const btn=document.getElementById('copy-btn');
  btn.textContent='Copiado!';
  setTimeout(()=>btn.textContent='Copiar',1600);
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function copy(hex){
  navigator.clipboard.writeText(hex).catch(()=>{});
  const t=document.getElementById('toast');
  t.textContent=hex.toUpperCase()+' copiado';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1600);
}

function tab(name,el){
  ['scale','tokens','preview','export'].forEach(n=>{
    document.getElementById('t-'+n).classList.toggle('hidden',n!==name);
  });
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
}

// ── Main ──────────────────────────────────────────────────────────────────────
function gen(){
  const hex=document.getElementById('bc').value;
  document.getElementById('hx').value=hex;
  document.getElementById('color-thumb').style.background=hex;
  document.getElementById('brand-dot').style.background=hex;

  // HSL readout
  const [h,s,l]=hexToHsl(hex);
  document.getElementById('hsl-readout').textContent=`hsl(${h}, ${s}%, ${l}%)`;

  LS=buildLightScale(hex);
  DS=buildDarkScale(hex);
  const {light,dark}=buildTokens(LS,DS);
  LT=light; DK=dark;

  // accent var for UI
  document.documentElement.style.setProperty('--accent', hex);

  renderMini();
  renderBand(LS,'band-light');
  renderBand(DS,'band-dark');
  renderScaleCol(LS,false,'scale-light');
  renderScaleCol(DS,true,'scale-dark');
  renderTokens(LT,false,'lt-frame');
  renderTokens(DK,true,'dk-frame');
  renderPreview();
}

function rnd(){
  const h=Math.floor(Math.random()*360);
  const s=50+Math.floor(Math.random()*40);
  const l=38+Math.floor(Math.random()*20);
  const hex=hslToHex(h,s,l);
  document.getElementById('bc').value=hex;
  gen();
}

// Sync inputs
document.getElementById('bc').addEventListener('input',e=>{
  document.getElementById('hx').value=e.target.value;
  gen();
});
document.getElementById('hx').addEventListener('input',e=>{
  const v=e.target.value.trim();
  if(/^#[0-9a-fA-F]{6}$/.test(v)){document.getElementById('bc').value=v;gen();}
});

gen();
