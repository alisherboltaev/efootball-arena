/* eFootball Arena — frontend (Flarnix, telegram: @Flarnix) */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const S = { me: null, admin: null, teams: {}, teamList: [], offset: 0, maxEdits: 3 };

/* ------------------------------------------------------------------ icons */
const I = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ic = {
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: I('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  trophy: I('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  star: I('<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>', 15),
  globe: I('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>', 15),
  table: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>', 15),
  cup: I('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/>', 15),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 14),
  user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', 17),
  users: I('<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>', 17),
  logout: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', 17),
  login: I('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>', 17),
  shield: I('<path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z"/>', 17),
  plus: I('<path d="M12 5v14M5 12h14"/>', 16),
  flag: I('<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>', 16),
  edit: I('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', 16),
  image: I('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>', 26),
  home: I('<path d="M3 11l9-8 9 8M5 10v10h14V10"/>', 17),
  settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', 17),
  alert: I('<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>', 17),
  list: I('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', 15),
  back: I('<path d="M15 18l-6-6 6-6"/>', 16),
  ball: I('<circle cx="12" cy="12" r="10"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/>', 17),
};
const TYPE = {
  ucl: { name: 'UEFA Chempionlar ligasi', icon: ic.star, img: '/img/arena-night.jpg', about: 'Yangi format: liga bosqichi, 1–8 to\'g\'ridan-to\'g\'ri, 9–24 pley-off' },
  wc: { name: 'Jahon chempionati', icon: ic.globe, img: '/img/type-wc.jpg', about: 'Terma jamoalar: guruh bosqichi va pley-off' },
  league: { name: 'Liga', icon: ic.table, img: '/img/stadium-pitch.jpg', about: 'Har kim har kim bilan: 1 yoki 2 aylana' },
  cup: { name: 'Kubok (pley-off)', icon: ic.cup, img: '/img/type-cup.jpg', about: 'Yutqazgan chiqib ketadi — finalgacha' },
};
const BANNERS = ['/img/hero-stadium.jpg', '/img/arena-night.jpg', '/img/stadium-day.jpg', '/img/stadium-pitch.jpg', '/img/ball-pitch.jpg', '/img/pitch-lights.jpg'];
function defaultBanner(id) { let h = 0; for (const c of String(id || 'x')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return BANNERS[h % BANNERS.length]; }
function ava(p, size = 32) {
  if (p && p.avatar) return `<img class="ava" src="${esc(p.avatar)}" width="${size}" height="${size}" alt="" loading="lazy">`;
  const ch = esc(((p && p.nickname) || '?').charAt(0).toUpperCase());
  return `<span class="ava" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${ch}</span>`;
}
function cardsIc(c) {
  if (!c) return '';
  const parts = [];
  for (let i = 0; i < (c.y || 0); i++) parts.push('<i class="y" title="Sariq kartochka"></i>');
  if (c.red) parts.push('<i class="r" title="Qizil kartochka — keyingi o\'yinni o\'tkazib yuboradi"></i>');
  return parts.length ? `<span class="cards-ic">${parts.join('')}</span>` : '';
}
// ---- admin huquqlari (server ham tekshiradi; bu yerda faqat tugmalarni ko'rsatish/yashirish)
const can = (perm) => !!(S.admin && (S.admin.super || (S.admin.perms || {})[perm]));
const ownsT = (t) => !!(S.admin && t && t.createdById === S.admin.id);
const canT = (t, perm) => can(perm) && (S.admin.super || ownsT(t) || can('manage_all'));
const canDelT = (t) => !!(S.admin && (S.admin.super || (ownsT(t) && can('delete_own'))));
const canRemove = (t) => !!(S.admin && (S.admin.super || (ownsT(t) && can('participants'))));
function permToggle(name, label, checked, disabled = false) {
  return `<label class="perm-row"><span>${esc(label)}</span><span class="sw"><input type="checkbox" name="${esc(name)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
    <span class="tr"></span><span class="kn"><svg class="ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><svg class="no" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></span></span></label>`;
}

// jamoali turnirda jamoa logosi/nomi, jamoasiz turnirda o'yinchi rasmi/nik/telegram
const pLogo = (p, size) => (p && p.teamId ? logo(p.teamId, size) : ava(p, size));
const pName = (p) => (p && p.teamId ? team(p.teamId).name : (p && p.nickname) || '—');
const pSub = (p) => (p && p.teamId ? (p.nickname || '') : (p && p.telegram) || '');
const plink = (p) =>(p && p.id ? `<a class="plink" href="#/u/${esc(p.id)}">${esc(p.nickname)}</a>` : esc((p && p.nickname) || ''));
const STATUS = {
  registration: ['Ro\'yxatga olish', 'info'],
  active: ['Davom etmoqda', 'ok'],
  finished: ['Yakunlangan', 'gold'],
};

/* ------------------------------------------------------------------ helpers */
async function api(method, url, body) {
  const opt = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(url, opt);
  let data = {};
  try { data = await r.json(); } catch (e) { /* bo'sh javob */ }
  if (!r.ok) throw new Error(data.error || `Xatolik (${r.status})`);
  return data;
}
function toast(msg, err = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
const now = () => Date.now() + S.offset;
const pad = (n) => String(n).padStart(2, '0');
function fmtDate(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toLocalInput(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (s) => (s ? new Date(s).getTime() : null);
function fmtLeft(ms) {
  if (ms <= 0) return 'Vaqt tugadi';
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
  if (d) return `${d} kun ${h} soat qoldi`;
  if (h) return `${h} soat ${m} daq qoldi`;
  return `${m} daq ${pad(s)} s qoldi`;
}
function dlBadge(ms, withDate = true) {
  if (!ms) return '<span class="dl">Dedlayn belgilanmagan</span>';
  return `<span class="dl">${ic.clock}${withDate ? `${fmtDate(ms)} gacha · ` : ''}<b data-dl="${ms}">${fmtLeft(ms - now())}</b></span>`;
}
function tick() {
  const n = now();
  $$('[data-dl]').forEach((el) => {
    const left = +el.dataset.dl - n;
    el.textContent = fmtLeft(left);
    el.classList.toggle('urgent', left > 0 && left < 6 * 36e5);
    el.classList.toggle('over', left <= 0);
  });
}
const tgLink = (tg) => (tg ? `<a class="tg" href="https://t.me/${esc(tg.replace(/^@/, ''))}" target="_blank" rel="noopener">${esc(tg)}</a>` : '');
const statusBadge = (st) => `<span class="badge ${STATUS[st][1]}">${STATUS[st][0]}</span>`;
const typeIco = (type) => `<span class="type-ico ${type}">${TYPE[type].icon}</span>`;

function settingsSummary(t) {
  const base = settingsSummary0(t);
  return t.settings.teamKind === 'none' ? `Logosiz · ${base}` : base;
}
function settingsSummary0(t) {
  const s = t.settings;
  if (t.type === 'league') return s.legs === 1 ? 'Har bir raqib bilan 1 o\'yin' : `Har bir raqib bilan ${s.legs} o\'yin (uy-mehmon)`;
  if (t.type === 'ucl') return `${s.leagueGames} o'yinli liga bosqichi · 1–${s.direct} to'g'ridan-to'g'ri${s.playoff ? ` · ${s.direct + 1}–${s.direct + s.playoff} pley-off (tasodifiy juftlik)` : ''} · ${s.direct + s.playoff + 1}+ chiqib ketadi`;
  if (t.type === 'wc') return `${s.groups} guruh · har guruhdan ${s.advance} ta chiqadi`;
  return s.koLegs === 2 ? 'Juftliklar 2 o\'yinli' : 'Juftliklar 1 o\'yinli';
}

/* ------------------------------------------------------------------ teams & logos */
function team(id) { return S.teams[id] || { id, name: 'Noma\'lum', short: '?', colors: ['#64748b', '#cbd5e1'] }; }
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
let crestSeq = 0;
function crest(t, size = 40) {
  const [c1, c2] = t.colors || ['#334155', '#e2e8f0'];
  const id = 'cr' + (++crestSeq);
  const ink = lum(c1) > 0.6 ? '#0f172a' : '#ffffff';
  const short = esc(t.short || '?');
  const fs = short.length > 3 ? 9.5 : 12;
  const shape = 'M20 1.5 L37.5 7 V21 C37.5 33 30 40.5 20 44.5 C10 40.5 2.5 33 2.5 21 V7 Z';
  return `<svg class="crest" width="${size}" height="${Math.round(size * 1.12)}" viewBox="0 0 40 46" aria-hidden="true"><defs><clipPath id="${id}"><path d="${shape}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="40" height="46" fill="${c1}"/><path d="M0 31 L40 25 V46 H0Z" fill="${c2}"/><rect x="0" y="0" width="40" height="5" fill="${c2}" opacity=".85"/></g><path d="${shape}" fill="none" stroke="${c2}" stroke-width="2"/><path d="${shape}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".6"/><text x="20" y="22" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-size="${fs}" font-weight="800" fill="${ink}">${short}</text></svg>`;
}
window.crestFallback = (id, size) => crest({ ...team(id), logo: null }, size);
function logo(id, size = 36) {
  if (!id) return `<span style="width:${size}px;height:${size}px;display:inline-block"></span>`;
  const t = team(id);
  if (t.logo) return `<img class="logo custom" src="${esc(t.logo)}" width="${size}" height="${size}" alt="${esc(t.name)}" loading="lazy" onerror="this.outerHTML=crestFallback('${esc(t.id)}',${size})">`;
  if (t.flag) return `<img class="logo flag" src="https://flagcdn.com/w160/${esc(t.flag)}.png" width="${size}" height="${size}" alt="" loading="lazy" onerror="this.outerHTML=crestFallback('${esc(t.id)}',${size})">`;
  return crest(t, size);
}

/* ------------------------------------------------------------------ theme & nav */
function initTheme() {
  const btn = $('#themeBtn');
  const cur = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const paint = () => { btn.innerHTML = cur() === 'dark' ? ic.sun : ic.moon; };
  btn.onclick = () => {
    const next = cur() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* */ }
    paint();
  };
  paint();
}
async function loadMe() {
  const d = await api('GET', '/api/me');
  S.me = d.user; S.admin = d.admin; S.offset = d.now - Date.now(); S.maxEdits = d.maxEdits;
}
async function loadTeams() {
  const d = await api('GET', '/api/teams');
  S.teamList = d.teams; S.teams = {};
  d.teams.forEach((t) => { S.teams[t.id] = t; });
}
function renderNav() {
  const path = location.hash.slice(1) || '/';
  const a = (href, html, cond) => `<a href="#${href}" class="${cond ? 'active' : ''}">${html}</a>`;
  let h = a('/', `${ic.home}<span class="lbl">Turnirlar</span>`, path === '/');
  h += a('/results', `${ic.list}<span class="lbl">Natijalar</span>`, path.startsWith('/results'));
  if (S.me) {
    h += a('/profile', `${ava(S.me, 22)}<span class="lbl">${esc(S.me.nickname)}</span>`, path.startsWith('/profile'));
  }
  if (S.admin) {
    const n = S.admin.openReports;
    h += a('/admin', `${S.admin.avatar ? ava(S.admin, 22) : ic.shield}<span class="lbl">Admin panel</span>${n ? `<span class="pill">${n}</span>` : ''}`, path.startsWith('/admin'));
  }
  if (S.me || S.admin) {
    h += `<button id="logoutBtn">${ic.logout}<span class="lbl">Chiqish</span></button>`;
  } else {
    h += a('/login', `${ic.login}<span class="lbl">Kirish</span>`, path === '/login');
    h += a('/admin/login', `${ic.shield}<span class="lbl">Admin</span>`, path === '/admin/login');
    h += `<a href="#/register" class="cta">${ic.user}<span class="lbl">Ro'yxatdan o'tish</span></a>`;
  }
  $('#nav').innerHTML = h;
  const lb = $('#logoutBtn');
  if (lb) lb.onclick = async () => { await api('POST', '/api/logout', {}); S.me = S.admin = null; location.hash = '#/'; render(); };
}

/* ------------------------------------------------------------------ router */
const routes = () => [
  [/^\/$/, pageHome],
  [/^\/login$/, pageLogin],
  [/^\/register$/, pageRegister],
  [/^\/admin\/login$/, pageAdminLogin],
  [/^\/profile$/, pageProfile],
  [/^\/u\/([\w-]+)$/, pageUser],
  [/^\/results$/, pageResults],
  [/^\/t\/([\w-]+)$/, pageTournament],
  [/^\/m\/([\w-]+)$/, pageMatch],
  [/^\/admin\/t\/([\w-]+)$/, pageAdminTournament],
  [/^\/admin(?:\/(\w+))?$/, pageAdmin],
];
let lastPath = null;
let renderSeq = 0;
async function render() {
  const full = location.hash.slice(1) || '/';
  const [path, query] = full.split('?');
  const params = new URLSearchParams(query || '');
  const app = $('#app');
  const seq = ++renderSeq;
  const pathChanged = path !== lastPath;
  lastPath = path;
  try { await loadMe(); } catch (e) { /* offline */ }
  renderNav();
  for (const [rx, fn] of routes()) {
    const m = path.match(rx);
    if (!m) continue;
    if (pathChanged) app.innerHTML = '<div class="loader"></div>';
    try {
      const html = await fn(...m.slice(1), params);
      if (seq !== renderSeq) return;
      if (typeof html === 'string') app.innerHTML = html;
      app.onclick = null;
      if (pathChanged) { app.classList.remove('page'); void app.offsetWidth; app.classList.add('page'); }
      if (typeof fn.after === 'function') fn.after(app, ...m.slice(1), params);
      enhance(app, pathChanged);
    } catch (e) {
      if (seq !== renderSeq) return;
      app.innerHTML = `<div class="empty"><h3>Xatolik</h3><p>${esc(e.message)}</p><a class="btn" href="#/">Bosh sahifa</a></div>`;
    }
    if (pathChanged) window.scrollTo(0, 0);
    tick();
    return;
  }
  app.innerHTML = '<div class="empty"><h3>Sahifa topilmadi</h3><a class="btn" href="#/">Bosh sahifa</a></div>';
}
const rerender = () => render();

/* ------------------------------------------------------------------ animatsiyalar */
function checkReveal() {
  const h = window.innerHeight || 800;
  $$('.reveal:not(.in)').forEach((e) => { if (e.getBoundingClientRect().top < h * 0.94) e.classList.add('in'); });
}
let revealTick = false;
window.addEventListener('scroll', () => { if (!revealTick) { revealTick = true; setTimeout(() => { revealTick = false; checkReveal(); }, 60); } }, { passive: true });
function enhance(root, fresh) {
  // scroll paytida paydo bo'lish
  if (!fresh) $$('.reveal', root).forEach((e) => e.classList.add('in'));
  setTimeout(checkReveal, 40);
  // raqamlarni sanab chiqish
  if (fresh) $$('[data-count]', root).forEach((el) => {
    const end = +el.dataset.count; const t0 = performance.now(); const dur = 1100;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  // tablar ostidagi sirpanuvchi indikator
  $$('.tabs', root).forEach(moveInk);
}
function moveInk(tabs) {
  let ink = tabs.querySelector('.ink');
  if (!ink) { ink = document.createElement('span'); ink.className = 'ink'; tabs.prepend(ink); }
  const act = tabs.querySelector('.active');
  if (!act) { ink.style.width = '0'; return; }
  ink.style.left = act.offsetLeft + 'px';
  ink.style.width = act.offsetWidth + 'px';
}
window.addEventListener('resize', () => $$('.tabs').forEach(moveInk));

/* page helpers with post-render hooks */
function page(fn, after) { fn.after = after; return fn; }
let CUR = {}; // joriy sahifa ma'lumotlari

/* ------------------------------------------------------------------ shared renderers */
function tCard(t, i = 0) {
  const pct = t.maxPlayers ? Math.min(100, Math.round((t.count / t.maxPlayers) * 100)) : 0;
  return `<a class="tcard reveal" style="--i:${i}" href="#/t/${t.id}">
    <div class="tc-img"><div style="background-image:url(${TYPE[t.type].img})"></div>
      <div class="tc-top"><span class="chip-dark">${typeIco(t.type)}${TYPE[t.type].name}</span>${statusBadge(t.status)}</div></div>
    <div class="tc-body">
      <h3>${esc(t.name)}</h3>
      <div class="meta">${ic.users} ${t.count}${t.maxPlayers ? ' / ' + t.maxPlayers : ''} ishtirokchi</div>
      ${t.status === 'registration' && t.maxPlayers ? `<div class="tbar"><i style="width:${pct}%"></i></div>` : ''}
      <div class="muted" style="font-size:13px;font-weight:600">${esc(settingsSummary(t))}</div>
      ${t.champion ? `<div class="champ"><span class="trophy">${ic.trophy}</span>${pLogo(t.champion, 24)} ${esc(t.champion.nickname)}</div>` : ''}
      ${t.myTeam ? `<div class="row" style="gap:8px;font-size:13px;font-weight:800">${logo(t.myTeam, 24)} Jamoa: ${esc(team(t.myTeam).name)}${cardsIc(t.cards)}</div>` : ''}
      ${t.stat ? `<div class="tstat">${t.stat.pos ? `<span>O'rin: <b>${t.stat.pos}/${t.stat.of}</b>${t.stat.group ? ` (${esc(t.stat.group)})` : ''}</span><span>Ochko: <b>${t.stat.pts}</b></span>` : ''}<span>O'yin: <b>${t.stat.p}</b></span><span>Gollar: <b>${t.stat.gf}:${t.stat.ga}</b></span>${t.stat.stage ? `<span>Bosqich: <b>${esc(t.stat.stage)}</b></span>` : ''}${!t.myTeam && t.cards && (t.cards.y || t.cards.red) ? `<span>Kartochka: ${cardsIc(t.cards)}</span>` : ''}</div>` : ''}
    </div>
  </a>`;
}
function mRow(m, opts = {}) {
  const h = m.homeP || {}, a = m.awayP || {};
  const mine = S.me && (m.home === S.me.id || m.away === S.me.id);
  const score = m.status === 'pending'
    ? '<span class="vs">VS</span>'
    : `<span class="sc">${m.hs} : ${m.as}</span>${m.hp != null ? `<small>pen. ${m.hp}:${m.ap}</small>` : ''}`;
  const extra = m.status === 'auto' ? '<em class="tag auto">Texnik 0:0</em>' : m.forfeit ? '<em class="tag ff">Qizil · 3:0</em>' : '';
  const grp = opts.group && m.group ? `<em class="tag grp">${esc(m.group)} guruh</em>` : '';
  const when = m.status === 'pending' && m.opensAt ? `<span class="dl">${ic.clock}Ochiladi: ${fmtDate(m.opensAt)}</span>` : m.status === 'pending' && m.deadline ? dlBadge(m.deadline) : '';
  const meta = opts.meta ? `<div class="meta-line"><span>${esc(m.tname || '')} · ${esc(m.roundName)}</span>${when}</div>` : '';
  return `<a class="mrow ${mine ? 'mine' : ''}" href="#/m/${m.id}">
    <div class="side home"><div class="tn"><b>${esc(pName(h))}</b><small>${esc(pSub(h))}${cardsIc(h.cards)}</small></div>${pLogo(h, 34)}</div>
    <div class="mid">${score}${extra}${grp}</div>
    <div class="side away">${pLogo(a, 34)}<div class="tn"><b>${esc(pName(a))}</b><small>${esc(pSub(a))}${cardsIc(a.cards)}</small></div></div>
    ${meta}
  </a>`;
}
function tableHTML(rows, P, zoneFn) {
  if (!rows.length) return '<div class="empty">Hali ma\'lumot yo\'q</div>';
  return `<div class="table-wrap"><table class="tbl"><thead><tr>
    <th>#</th><th class="l">Jamoa / o'yinchi</th><th title="O'yinlar">O</th><th title="G'alaba">G'</th><th title="Durang">D</th><th title="Mag'lubiyat">M</th><th title="Gollar">Gollar</th><th title="Gollar farqi">±</th><th>Ochko</th><th class="hide-sm">Forma</th>
  </tr></thead><tbody>${rows.map((r, i) => {
    const p = P[r.userId] || r.pi || {};
    const me = S.me && r.userId === S.me.id;
    const pos = r.pos || i + 1;
    return `<tr class="${zoneFn ? zoneFn(pos - 1) : ''} ${me ? 'me' : ''}" style="--i:${Math.min(i, 30)}">
      <td class="pos">${pos}</td>
      <td class="l"><div class="tcell">${pLogo(p, 28)}<div>${p.teamId
        ? `<b>${esc(team(p.teamId).name)}</b><small>${plink({ id: r.userId, nickname: p.nickname })}${cardsIc(p.cards)}</small>`
        : `<b>${plink({ id: r.userId, nickname: p.nickname })}${cardsIc(p.cards)}</b><small>${esc(p.telegram || '')}</small>`}</div></div></td>
      <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}:${r.ga}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td>
      <td class="pts">${r.pts}</td>
      <td class="hide-sm"><span class="form">${r.form.map((f) => `<i class="${f}">${{ W: 'G', D: 'D', L: 'M' }[f]}</i>`).join('')}</span></td>
    </tr>`;
  }).join('')}</tbody></table></div>`;
}
function bracketHTML(ko, P, matches) {
  if (!ko.length) return '<div class="empty">Pley-off bosqichi hali boshlanmagan</div>';
  const M = {}; matches.forEach((m) => { M[m.id] = m; });
  return `<div class="bracket">${ko.map((k, ki) => `<div class="bcol" style="--i:${ki}"><h4>${esc(k.name)}${k.legs === 2 ? ' · 2 o\'yin' : ''}</h4>${k.collapsed
    ? `<div class="empty" style="padding:14px;margin-bottom:12px;font-size:13px"><b>${k.tieCount} ta juftlik</b><br>To'liq ro'yxat — «O'yinlar» bo'limida${k.ties.length ? '<br>Sizning juftligingiz:' : ''}</div>` : ''}<div class="ties">${k.ties.map((x) => {
    const line = (uid, g) => {
      if (!uid) return '<div class="tl lose"><div class="nm"><b>—</b></div></div>';
      const p = P[uid] || {};
      const cls = x.winner ? (x.winner === uid ? 'win' : 'lose') : x.bothOut ? 'lose' : '';
      return `<div class="tl ${cls}">${pLogo(p, 26)}<div class="nm"><b>${esc(pName(p))}</b><small>${esc(pSub(p))}</small></div><span class="g">${g ?? ''}</span></div>`;
    };
    const first = x.matches[0];
    let foot = '';
    if (!x.a && !x.b) foot = '<span>Bo\'sh o\'rin</span>';
    else if (x.bothOut) foot = '<span style="color:var(--danger)">O\'ynalmadi — ikkalasi ham chiqib ketdi</span>';
    else if (!x.b) foot = '<span>Avtomatik o\'tdi</span>';
    else {
      const last = M[x.matches[x.matches.length - 1]];
      const pens = last && last.hp != null ? `pen. ${last.hp}:${last.ap}` : '';
      foot = `<span>${x.matches.length === 2 ? 'Umumiy hisob' : ''}</span><span>${pens}${x.forced ? ' · admin qarori' : ''}</span>`;
    }
    const body = line(x.a, x.agg ? x.agg[0] : '') + line(x.b, x.agg ? x.agg[1] : '') + `<div class="foot">${foot}</div>`;
    return first ? `<a class="tie" href="#/m/${first}">${body}</a>` : `<div class="tie">${body}</div>`;
  }).join('')}</div></div>`).join('')}</div>`;
}
function pCards(parts) {
  if (!parts.length) return '<div class="empty">Hali ishtirokchilar yo\'q</div>';
  return `<div class="plist">${parts.map((p, i) => (p.teamId
    ? `<div class="pcard" style="--i:${Math.min(i, 40)}">${logo(p.teamId, 42)}<div class="info"><b>${esc(team(p.teamId).name)} ${p.dq ? '<em class="tag dq">Chetlatilgan</em>' : ''}</b><small class="row" style="gap:6px">${ava({ ...p, id: p.userId }, 18)}${plink({ id: p.userId, nickname: p.nickname })}${cardsIc(p.cards)}${p.group ? ` · ${esc(p.group)} guruh` : ''}</small>${tgLink(p.telegram)}</div></div>`
    : `<div class="pcard" style="--i:${Math.min(i, 40)}">${ava(p, 46)}<div class="info"><b>${plink({ id: p.userId, nickname: p.nickname })}${cardsIc(p.cards)} ${p.dq ? '<em class="tag dq">Chetlatilgan</em>' : ''}</b>${tgLink(p.telegram)}${p.group ? `<small>${esc(p.group)} guruh</small>` : ''}</div></div>`)).join('')}</div>`;
}
function partMap(parts) { const P = {}; parts.forEach((p) => { P[p.userId] = p; }); return P; }

/* ------------------------------------------------------------------ image helper */
function compressImage(file, max = 1600, q = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Faqat rasm fayl yuklang'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Rasmni ochib bo\'lmadi'));
      img.onload = () => {
        let { width: w, height: h } = img;
        const k = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
// rasmni aniq o'lchamga markazdan kesish (avatar 1:1, banner 4:1)
function cropImage(file, W, H, q = 0.86) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Faqat rasm fayl yuklang'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Rasmni ochib bo\'lmadi'));
      img.onload = () => {
        const r = W / H;
        let sw = img.width, sh = img.width / r;
        if (sh > img.height) { sh = img.height; sw = img.height * r; }
        const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
// profil tahrirlash formasi (o'yinchi va admin uchun umumiy)
function mediaEditor(p) {
  return `<div class="media-edit">
    <label class="drop" id="avaDrop"><input type="file" accept="image/*" hidden><div><img class="ava-prev" id="avaPrev" src="${esc(p.avatar || '')}" alt="" ${p.avatar ? '' : 'hidden'}>${p.avatar ? '' : ic.image}<small>Profil rasmi</small></div></label>
    <label class="drop" id="banDrop"><input type="file" accept="image/*" hidden><div><img class="ban-prev" id="banPrev" src="${esc(p.banner || defaultBanner(p.id))}" alt=""><small>Banner rasmi (1600×400 ga moslab kesiladi)</small></div></label>
  </div>
  <div class="row mb">${p.avatar ? '<button type="button" class="btn sm ghost" id="avaDel">Profil rasmini o\'chirish</button>' : ''}${p.banner ? '<button type="button" class="btn sm ghost" id="banDel">Bannerni standartga qaytarish</button>' : ''}</div>`;
}
function bindMediaEditor(media) {
  const a = $('#avaDrop'), b = $('#banDrop');
  if (!a) return;
  setupDrop(a, async (f) => { try { media.avatar = await cropImage(f, 400, 400); const pv = $('#avaPrev'); pv.src = media.avatar; pv.hidden = false; a.querySelector('svg')?.remove(); } catch (e) { toast(e.message, true); } });
  setupDrop(b, async (f) => { try { media.banner = await cropImage(f, 1600, 400); $('#banPrev').src = media.banner; } catch (e) { toast(e.message, true); } });
  const ad = $('#avaDel'); if (ad) ad.onclick = () => { media.avatar = ''; $('#avaPrev').hidden = true; toast('Saqlash tugmasini bosing'); };
  const bd = $('#banDel'); if (bd) bd.onclick = () => { media.banner = ''; toast('Saqlash tugmasini bosing'); };
}
function setupDrop(el, onFile) {
  const input = el.querySelector('input[type=file]');
  el.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('over'); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); });
  input.addEventListener('change', () => { if (input.files[0]) onFile(input.files[0]); });
}
function bindForm(form, handler) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;
    try { await handler(Object.fromEntries(new FormData(form).entries())); } catch (err) { toast(err.message, true); }
    if (btn) btn.disabled = false;
  });
}
function confirmBox(text) { return window.confirm(text); }

/* ================================================================== PAGES */

/* ---------------- home */
const pageHome = page(async () => {
  const [{ tournaments }, my] = await Promise.all([
    api('GET', '/api/tournaments'),
    S.me ? api('GET', '/api/my/matches').catch(() => null) : null,
  ]);
  const by = { registration: [], active: [], finished: [] };
  tournaments.forEach((t) => by[t.status].push(t));
  const upcoming = my ? my.matches.filter((m) => m.status === 'pending' && m.tstatus === 'active').slice(0, 6) : [];
  const sec = (title, list, emptyText) => `<section class="section"><div class="section-h reveal"><h2>${title}</h2><span class="count">${list.length}</span></div>
    ${list.length ? `<div class="grid g3">${list.map(tCard).join('')}</div>` : `<div class="empty reveal">${emptyText}</div>`}</section>`;
  const totalPlayers = tournaments.reduce((s, t) => s + t.count, 0);
  const steps = [
    [ic.user, 'Ro\'yxatdan o\'ting', 'Login, parol, nickname va Telegram username bilan hisob yarating.'],
    [ic.shield, 'Jamoani tanlang', '50 ta nomdor klub yoki terma jamoadan birini oling — u faqat sizniki.'],
    [ic.ball, 'O\'ynang', 'Raqibingiz bilan Telegram orqali kelishing va dedlayngacha o\'ynang.'],
    [ic.image, 'Natijani yuboring', 'Hisobni kiriting va skrinshot yuklang. Jadval avtomatik yangilanadi.'],
  ];
  return `
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-emblem"></div>
    <div class="kicker">eFootball turnirlari · 2026</div>
    <h1>Arenaga chiq. <span class="grad-text">Chempion bo'l.</span></h1>
    <p>UEFA Chempionlar ligasi, Jahon chempionati, Ligalar va Kuboklar. Jamoangizni tanlang, raqiblar bilan o'ynang va natijani skrinshot bilan yuboring.</p>
    <div class="row">
      ${S.me ? `<a class="btn primary lg" href="#/profile">${ic.user} Mening profilim</a><button type="button" class="btn glass lg" onclick="document.getElementById('tlist').scrollIntoView({behavior:'smooth'})">Turnirlar</button>`
        : S.admin ? `<a class="btn primary lg" href="#/admin">${ic.shield} Admin panel</a>`
          : `<a class="btn primary lg" href="#/register">Ro'yxatdan o'tish</a><a class="btn glass lg" href="#/login">Kirish</a>`}
    </div>
    <div class="hero-stats">
      <div><b data-count="${by.active.length}">0</b><span>Faol turnir</span></div>
      <div><b data-count="${by.registration.length}">0</b><span>Ro'yxat ochiq</span></div>
      <div><b data-count="${totalPlayers}">0</b><span>Ishtirokchi</span></div>
      <div><b data-count="${by.finished.length}">0</b><span>Yakunlangan</span></div>
    </div>
  </section>
  ${S.me ? `<section class="section"><div class="section-h reveal"><h2>Navbatdagi o'yinlarim</h2><span class="count">${upcoming.length}</span></div>
    ${upcoming.length ? upcoming.map((m) => mRow(m, { meta: true })).join('') : '<div class="empty reveal">Hozircha kutilayotgan o\'yinlar yo\'q</div>'}</section>` : ''}
  <div id="tlist"></div>
  ${sec('Ro\'yxatga olish ochiq', by.registration, 'Hozircha ro\'yxatga olish ochiq turnirlar yo\'q')}
  ${sec('Davom etayotgan turnirlar', by.active, 'Faol turnirlar yo\'q')}
  ${by.finished.length ? sec('Yakunlangan turnirlar', by.finished, '') : ''}
  <section class="section"><div class="section-h reveal"><h2>Turnir turlari</h2></div>
    <div class="grid g4">${Object.entries(TYPE).map(([k, v], i) => `<div class="typecard reveal" style="--i:${i}"><div class="tbg" style="background-image:url(${v.img})"></div>${typeIco(k)}<h3>${v.name}</h3><p>${v.about}</p></div>`).join('')}</div></section>
  <section class="section"><div class="section-h reveal"><h2>Qanday ishlaydi?</h2></div>
    <div class="grid g4">${steps.map(([icon, h, p], i) => `<div class="feature reveal" style="--i:${i}"><span class="num">0${i + 1}</span><div class="fi">${icon}</div><h3>${h}</h3><p>${p}</p></div>`).join('')}</div></section>`;
});

function authLayout(img, title, text, form) {
  return `<div class="auth"><div class="auth-side"><div class="abg" style="background-image:url(${img})"></div><div class="ae"></div><h2>${title}</h2><p>${text}</p></div><div class="auth-form">${form}</div></div>`;
}

/* ---------------- auth pages */
const pageLogin = page(() => {
  if (S.me) { location.hash = '#/profile'; return ''; }
  return authLayout('/img/ball-pitch.jpg', 'Qaytganingizdan xursandmiz!', 'Hisobingizga kiring va navbatdagi o\'yiningizni o\'tkazib yubormang.', `
    <h2>Kirish</h2><div class="sub">O'yinchi hisobingizga kiring</div>
    <form id="f">
      <label class="f"><span>Login</span><div class="input-icon">${ic.user}<input name="username" autocomplete="username" required></div></label>
      <label class="f"><span>Parol</span><div class="input-icon">${ic.shield}<input name="password" type="password" autocomplete="current-password" required></div></label>
      <button class="btn primary block lg" type="submit">Kirish</button>
    </form>
    <div class="alt">Hisobingiz yo'qmi? <a href="#/register">Ro'yxatdan o'ting</a><br>Adminmisiz? <a href="#/admin/login">Admin panelga kirish</a></div>`);
}, () => {
  const f = $('#f'); if (!f) return;
  bindForm(f, async (d) => { await api('POST', '/api/login', d); toast('Xush kelibsiz!'); location.hash = '#/'; });
});

const pageRegister = page(() => {
  if (S.me) { location.hash = '#/profile'; return ''; }
  const R = '<b class="req">*</b>';
  return authLayout('/img/hero-stadium.jpg', 'Arenaga qo\'shiling', 'Jamoangizni tanlang, turnirlarda qatnashing va chempion bo\'ling.', `
    <h2>Ro'yxatdan o'tish</h2><div class="sub">Turnirlarda qatnashish uchun hisob yarating</div>
    <form id="f">
      <div class="fgrid">
        <label class="f"><span>Login ${R}</span><input name="username" autocomplete="username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_.]+"><em>Lotin harflari, raqamlar, _ va .</em></label>
        <label class="f"><span>Parol ${R}</span><input name="password" type="password" autocomplete="new-password" required minlength="6"><em>Kamida 6 belgi</em></label>
      </div>
      <label class="f"><span>Nickname (o'yindagi ismingiz) ${R}</span><input name="nickname" required minlength="2" maxlength="30"></label>
      <label class="f"><span>Telegram username ${R}</span><div class="input-icon"><svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M21.9 4.6l-3 14.3c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L7.1 12.9 2.5 11.5c-1-.3-1-1 .2-1.5l18-6.9c.8-.3 1.6.2 1.2 1.5z"/></svg><input name="telegram" required minlength="5" maxlength="33" pattern="@?[A-Za-z0-9_]{4,32}" title="Masalan: @Flarnix" placeholder="@Flarnix"></div><em>Majburiy — raqiblaringiz siz bilan shu orqali bog'lanadi</em></label>
      <button class="btn primary block lg" type="submit">Ro'yxatdan o'tish</button>
    </form>
    <div class="alt">Hisobingiz bormi? <a href="#/login">Kirish</a></div>`);
}, () => {
  const f = $('#f'); if (!f) return;
  bindForm(f, async (d) => { await api('POST', '/api/register', d); toast('Ro\'yxatdan o\'tdingiz!'); location.hash = '#/profile'; });
});

const pageAdminLogin = page(() => {
  if (S.admin) { location.hash = '#/admin'; return ''; }
  return authLayout('/img/arena-night.jpg', 'Admin panel', 'Turnirlarni yaratish, dedlaynlar, natijalar va shikoyatlarni boshqarish.', `
    <h2>Admin sifatida kirish</h2><div class="sub">Faqat adminlar uchun</div>
    <form id="f">
      <label class="f"><span>Admin login</span><div class="input-icon">${ic.shield}<input name="username" autocomplete="username" required></div></label>
      <label class="f"><span>Parol</span><div class="input-icon">${ic.settings}<input name="password" type="password" autocomplete="current-password" required></div></label>
      <button class="btn primary block lg" type="submit">Kirish</button>
    </form>
    <div class="alt">O'yinchimisiz? <a href="#/login">O'yinchi sifatida kirish</a></div>`);
}, () => {
  const f = $('#f'); if (!f) return;
  bindForm(f, async (d) => { await api('POST', '/api/admin/login', d); toast('Admin panelga xush kelibsiz'); location.hash = '#/admin'; });
});

/* ---------------- profile */
function profileHead(p, sub, actions = '') {
  return `<div class="profile-cover" style="background-image:url(${esc(p.banner || defaultBanner(p.id))})"></div>
    <div class="profile-head">
      <div class="avatar">${p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : esc((p.nickname || '?').charAt(0).toUpperCase())}</div>
      <div class="grow">
        <div class="nickname">${esc(p.nickname)}</div>
        ${tgLink(p.telegram)}
        ${sub ? `<div class="muted" style="font-size:13px;margin-top:2px;font-weight:600">${sub}</div>` : ''}
      </div>${actions}
    </div>`;
}
function profileBody(prof, own) {
  const T = prof.totals;
  const stats = `<div class="stat-strip">
    <div><b data-count="${T.p}">0</b><span>O'yinlar</span></div><div><b data-count="${T.w}">0</b><span>G'alaba</span></div>
    <div><b data-count="${T.d}">0</b><span>Durang</span></div><div><b data-count="${T.l}">0</b><span>Mag'lubiyat</span></div>
    <div><b data-count="${T.titles}">0</b><span>Chempionlik</span></div></div>`;
  return { stats, tours: `<section class="section"><div class="section-h reveal"><h2>${own ? 'Mening turnirlarim' : 'Turnirlari'}</h2><span class="count">${prof.tournaments.length}</span></div>
    ${prof.tournaments.length ? `<div class="grid g3">${prof.tournaments.map(tCard).join('')}</div>` : `<div class="empty">${own ? 'Siz hali hech qaysi turnirga qo\'shilmagansiz.' : 'Turnirlarda qatnashmagan.'}</div>`}</section>`,
    played: prof.matches.length ? `<section class="section"><div class="section-h reveal"><h2>O'ynalgan o'yinlar</h2><span class="count">${prof.matches.length}</span></div>${prof.matches.map((m) => mRow(m, { meta: true })).join('')}</section>` : '' };
}
const pageProfile = page(async () => {
  if (!S.me) { location.hash = '#/login'; return ''; }
  const [d, prof] = await Promise.all([api('GET', '/api/my/matches'), api('GET', `/api/users/${S.me.id}`)]);
  CUR = d;
  const pending = d.matches.filter((m) => m.status === 'pending' && m.tstatus === 'active');
  const B = profileBody(prof, true);
  return `
  <div class="card profile-card">
    ${profileHead(S.me, `Login: ${esc(S.me.username)} · <a class="plink" href="#/u/${S.me.id}">Ommaviy profil</a>`, `<button class="btn" id="editBtn">${ic.edit} Tahrirlash</button>`)}
    <form id="pf" class="hidden profile-form">
      ${mediaEditor(S.me)}
      <div class="fgrid">
        <label class="f"><span>Login</span><input name="username" value="${esc(S.me.username)}" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_.]+"></label>
        <label class="f"><span>Nickname</span><input name="nickname" value="${esc(S.me.nickname)}" required></label>
        <label class="f"><span>Telegram</span><input name="telegram" value="${esc(S.me.telegram)}" required></label>
        <label class="f"><span>Joriy parol (faqat parol almashtirish uchun)</span><input name="oldPassword" type="password" autocomplete="current-password"></label>
        <label class="f"><span>Yangi parol</span><input name="newPassword" type="password" autocomplete="new-password"></label>
      </div>
      <button class="btn primary" type="submit">Saqlash</button>
    </form>
    ${B.stats}
  </div>
  <section class="section"><div class="section-h reveal"><h2>Kutilayotgan o'yinlar</h2><span class="count">${pending.length}</span></div>
    ${pending.length ? pending.map((m) => mRow(m, { meta: true })).join('') : '<div class="empty">Kutilayotgan o\'yinlar yo\'q</div>'}</section>
  ${B.tours}${B.played}`;
}, () => {
  const eb = $('#editBtn'); if (!eb) return;
  eb.onclick = () => $('#pf').classList.toggle('hidden');
  const media = {};
  bindMediaEditor(media);
  bindForm($('#pf'), async (d) => {
    if (!d.newPassword) { delete d.newPassword; delete d.oldPassword; }
    await api('PUT', '/api/me', { ...d, ...media }); toast('Profil saqlandi'); rerender();
  });
});

const pageUser = page(async (id) => {
  const prof = await api('GET', `/api/users/${id}`);
  const B = profileBody(prof, false);
  return `<div class="card profile-card">${profileHead(prof.user, `Ro'yxatdan o'tgan: ${fmtDate(prof.user.created).split(' ')[0]}`)}${B.stats}</div>${B.tours}${B.played}`;
});

const pageResults = page(async (params) => {
  const [{ matches }, { tournaments }] = await Promise.all([api('GET', '/api/results'), api('GET', '/api/tournaments')]);
  const sel = params.get('t') || '';
  const list = sel ? matches.filter((m) => m.tid === sel) : matches;
  return `<div class="thero"><div class="tbg" style="background-image:url(/img/hero-stadium.jpg)"></div>
      <span class="chip-dark">${typeIco('league')}Barcha natijalar</span><h1>O'yin natijalari</h1>
      <div class="sub">Barcha turnirlarda o'ynalgan o'yinlar — eng yangilari tepada</div></div>
    <div class="row mb"><select id="tsel" style="max-width:340px"><option value="">Barcha turnirlar</option>${tournaments.map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
      ${sel ? `<a class="btn" href="#/t/${esc(sel)}?tab=table">Jadvalni ko'rish</a>` : ''}</div>
    ${list.length ? list.map((m) => mRow(m, { meta: true })).join('') : '<div class="empty">Hali o\'ynalgan o\'yinlar yo\'q</div>'}`;
}, () => {
  const s = $('#tsel'); if (s) s.onchange = () => { location.hash = s.value ? `#/results?t=${s.value}` : '#/results'; };
});

/* ---------------- tournament */
// katta turnir: hash'dagi parametrlarni o'zgartirish (sahifa, qidiruv, tur)
function setQ(base, changes) {
  const p = new URLSearchParams((location.hash.split('?')[1]) || '');
  Object.entries(changes).forEach(([k, v]) => (v === null || v === '' || v === undefined ? p.delete(k) : p.set(k, v)));
  location.hash = `${base}?${p.toString()}`;
}
function pager(total, page, key) {
  const pages = Math.ceil(total / 100);
  if (pages <= 1) return '';
  return `<div class="row mt" style="justify-content:center">
    <button class="btn sm" data-q="${key}" data-v="${page - 1}" ${page <= 0 ? 'disabled' : ''}>${ic.back} Oldingi</button>
    <span class="muted" style="font-weight:800">${page + 1} / ${pages} sahifa · ${total} ta</span>
    <button class="btn sm" data-q="${key}" data-v="${page + 1}" ${page >= pages - 1 ? 'disabled' : ''}>Keyingi ${I('<path d="M9 18l6-6-6-6"/>', 16)}</button></div>`;
}
const searchBox = (key, val, ph) => `<input class="qsearch" data-q="${key}" value="${esc(val || '')}" placeholder="${ph}" style="max-width:300px">`;
const BIGQ = ['round', 'mine', 'mq', 'mp', 'tp', 'tq', 'group', 'pp', 'pq'];

const pageTournament = page(async (id, params) => {
  const qs = new URLSearchParams();
  BIGQ.forEach((k) => { if (params.get(k)) qs.set(k, params.get(k)); });
  const d = await api('GET', `/api/tournaments/${id}${qs.toString() ? '?' + qs : ''}`);
  CUR = d;
  const t = d.tournament;
  const extra = [];
  (d.tables || []).forEach((tb) => tb.rows.forEach((r) => r.pi && extra.push(r.pi)));
  (d.ko || []).forEach((k) => [...k.ties, ...(k.undecided || [])].forEach((x) => { if (x.ap) extra.push(x.ap); if (x.bp) extra.push(x.bp); }));
  if (d.mePart) extra.push(d.mePart);
  const P = partMap([...extra, ...d.participants]);
  const head = `<div class="thero"><div class="tbg" style="background-image:url(${TYPE[t.type].img})"></div>
    <div class="row top"><div class="row"><span class="chip-dark">${typeIco(t.type)}${TYPE[t.type].name}</span>${statusBadge(t.status)}</div>
      ${S.admin ? `<a class="btn glass sm" href="#/admin/t/${t.id}">${ic.settings} Boshqarish</a>` : ''}</div>
    <h1>${esc(t.name)}</h1>
    <div class="sub">${esc(settingsSummary(t))} · ${t.count}${t.maxPlayers ? ' / ' + t.maxPlayers : ''} ishtirokchi</div>
    ${t.description ? `<p class="desc">${esc(t.description)}</p>` : ''}
  </div>
  ${t.champion ? `<div class="champ-banner"><span class="trophy">${I('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>', 40)}</span>${pLogo(t.champion, 52)}<div><div class="muted" style="font-weight:700">Chempion</div><div class="big">${esc(t.champion.nickname)}</div><div class="muted">${esc(t.champion.teamId ? team(t.champion.teamId).name : (t.champion.telegram || ''))}</div></div></div>` : ''}`;

  if (t.status === 'registration') return head + regPanel(d);

  const tabs = [];
  if (t.type === 'league' || t.type === 'ucl') tabs.push(['table', 'Jadval']);
  if (t.type === 'wc') tabs.push(['groups', 'Guruhlar']);
  if (t.type !== 'league') tabs.push(['bracket', 'Pley-off']);
  tabs.push(['matches', 'O\'yinlar'], ['players', 'Ishtirokchilar']);
  let active = params.get('tab') || (d.ko.length ? 'bracket' : tabs[0][0]);
  if (!tabs.some((x) => x[0] === active)) active = tabs[0][0];

  const panes = {};
  const s = t.settings;
  const big = d.big;
  const base = `#/t/${t.id}`;
  const tableTools = () => (big && t.type !== 'wc' ? `<div class="row mb">${searchBox('tq', params.get('tq'), 'O\'yinchi qidirish...')}
      ${d.myPos ? `<button class="btn sm" data-q="tp" data-v="${Math.floor((d.myPos.pos - 1) / 100)}" data-clear="tq">${ic.user} Mening o'rnim: ${d.myPos.pos}</button>` : ''}
      <span class="muted" style="font-size:13px;font-weight:700">Jami: ${d.tables[0]?.total ?? 0}</span></div>` : '');
  const tablePager = () => (big && t.type !== 'wc' ? pager(d.tables[0]?.total || 0, +(params.get('tp') || 0), 'tp') : '');
  if (t.type === 'league') {
    panes.table = tableTools() + tableHTML(d.tables[0]?.rows || [], P, (i) => (i === 0 ? 'z-champ' : '')) + tablePager();
  }
  if (t.type === 'ucl') {
    panes.table = tableTools() + tableHTML(d.tables[0]?.rows || [], P, (i) => (i < s.direct ? 'z-direct' : i < s.direct + s.playoff ? 'z-playoff' : 'z-out'))
      + tablePager() + `<div class="legend"><span style="--c:#22c55e">1–${s.direct}: pley-offga to'g'ridan-to'g'ri</span>${s.playoff ? `<span style="--c:var(--violet)">${s.direct + 1}–${s.direct + s.playoff}: pley-off bosqichi</span>` : ''}<span style="--c:var(--red)">${s.direct + s.playoff + 1}+: chiqib ketadi</span></div>`;
  }
  if (t.type === 'wc' && big) {
    const g = d.tables[0];
    panes.groups = `<div class="row mb"><select class="qselect" data-q="group" style="max-width:220px">${(d.groups || []).map((x) => `<option value="${esc(x)}" ${g && g.group === x ? 'selected' : ''}>${esc(x)} guruh</option>`).join('')}</select>
      ${d.myPos ? `<button class="btn sm" data-q="group" data-v="${esc(d.myPos.group)}">${ic.user} Mening guruhim (${esc(d.myPos.group)})</button>` : ''}
      <span class="muted" style="font-size:13px;font-weight:700">${(d.groups || []).length} ta guruh</span></div>
      ${g ? `<h3>${esc(g.name)}</h3>${tableHTML(g.rows, P, (i) => (i < s.advance ? 'z-direct' : ''))}` : '<div class="empty">Guruh topilmadi</div>'}
      <div class="legend"><span style="--c:#22c55e">Pley-offga chiqadi (har guruhdan ${s.advance} ta)</span></div>`;
  } else if (t.type === 'wc') {
    panes.groups = `<div class="grid g2">${d.tables.map((g) => `<div><h3>${esc(g.name)}</h3>${tableHTML(g.rows, P, (i) => (i < s.advance ? 'z-direct' : ''))}</div>`).join('')}</div>
      <div class="legend"><span style="--c:#22c55e">Pley-offga chiqadi (har guruhdan ${s.advance} ta)</span></div>`;
  }
  if (t.type !== 'league') panes.bracket = bracketHTML(d.ko, P, d.matches);
  if (big) {
    const rs = d.roundStats || {};
    const used = t.rounds.filter((r) => rs[r.key] && rs[r.key].total);
    const cur = used.find((r) => r.key === d.matchRound);
    panes.matches = `<div class="row mb">
        <select class="qselect" data-q="round" data-clear="mine,mp" style="max-width:320px">${used.map((r) => `<option value="${r.key}" ${!d.matchMine && r.key === d.matchRound ? 'selected' : ''}>${esc(r.name)} (${rs[r.key].total})</option>`).join('')}</select>
        ${d.mePart ? `<button class="btn sm ${d.matchMine ? 'primary' : ''}" data-q="mine" data-v="${d.matchMine ? '' : '1'}" data-clear="mp">${ic.user} Mening o'yinlarim</button>` : ''}
        ${searchBox('mq', params.get('mq'), 'O\'yinchi bo\'yicha qidirish...')}</div>
      ${!d.matchMine && cur ? `<div class="round-h"><h4>${esc(cur.name)}</h4>${dlBadge(cur.deadline)}</div>` : ''}
      ${d.matches.length ? d.matches.map((m) => mRow(m, { group: t.type === 'wc', meta: d.matchMine })).join('') : '<div class="empty">O\'yinlar topilmadi</div>'}
      ${pager(d.matchTotal, +(params.get('mp') || 0), 'mp')}`;
    panes.players = `<div class="row mb">${searchBox('pq', params.get('pq'), 'O\'yinchi qidirish (nik yoki telegram)...')}<span class="muted" style="font-size:13px;font-weight:700">Jami: ${d.participantTotal}</span></div>
      ${pCards(d.participants)}${pager(d.participantTotal, +(params.get('pp') || 0), 'pp')}`;
  } else {
    const rounds = t.rounds.filter((r) => d.matches.some((m) => m.round === r.key));
    panes.matches = `${S.me && P[S.me.id] ? `<label class="check mb"><input type="checkbox" id="onlyMine"> Faqat mening o'yinlarim</label>` : ''}
      <div id="roundsBox">${rounds.map((r) => `<div class="round"><div class="round-h"><h4>${esc(r.name)}</h4>${dlBadge(r.deadline)}</div>
        ${d.matches.filter((m) => m.round === r.key).map((m) => mRow(m, { group: t.type === 'wc' })).join('')}</div>`).join('') || '<div class="empty">O\'yinlar yo\'q</div>'}</div>`;
    panes.players = pCards(d.participants);
  }

  return head + `<div class="tabs" id="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === active ? 'active' : ''}">${n}</button>`).join('')}</div>
    ${tabs.map(([k]) => `<div class="pane ${k === active ? '' : 'hidden'}" data-pane="${k}">${panes[k]}</div>`).join('')}`;
}, (app, id) => {
  const tabs = $('#tabs');
  if (tabs) {
    tabs.onclick = (e) => {
      const b = e.target.closest('button[data-tab]'); if (!b) return;
      $$('#tabs button').forEach((x) => x.classList.toggle('active', x === b));
      moveInk(tabs);
      $$('.pane').forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== b.dataset.tab));
      history.replaceState(null, '', `#/t/${id}?tab=${b.dataset.tab}`);
      lastPath = `/t/${id}`;
    };
  }
  const om = $('#onlyMine');
  if (om) {
    om.onchange = () => {
      $$('#roundsBox .mrow').forEach((r) => r.classList.toggle('hidden', om.checked && !r.classList.contains('mine')));
      $$('#roundsBox .round').forEach((r) => r.classList.toggle('hidden', om.checked && !r.querySelector('.mrow.mine')));
    };
  }
  bindBigControls(`#/t/${id}`);
  bindRegPanel(id);
});

// katta turnir boshqaruvlari: sahifa tugmalari, qidiruv, tanlovlar (joriy tab saqlanadi)
function bindBigControls(base) {
  const tab = () => ($('#tabs button.active') || {}).dataset?.tab;
  const go = (k, v, clear) => {
    const ch = { [k]: v, tab: tab() };
    if (k !== 'mp' && k !== 'tp' && k !== 'pp' && k !== 'p') { ch.mp = null; ch.tp = null; ch.pp = null; ch.p = null; }
    (clear || '').split(',').filter(Boolean).forEach((c) => { ch[c] = null; });
    setQ(base, ch);
  };
  $$('#app button[data-q]').forEach((b) => { b.onclick = () => go(b.dataset.q, b.dataset.v, b.dataset.clear); });
  $$('#app select.qselect').forEach((s) => { s.onchange = () => go(s.dataset.q, s.value, s.dataset.clear); });
  $$('#app input.qsearch').forEach((inp) => {
    let tm;
    const fire = () => { LASTQ = inp.dataset.q; go(inp.dataset.q, inp.value.trim()); };
    inp.onkeydown = (e) => { if (e.key === 'Enter') { clearTimeout(tm); fire(); } };
    inp.oninput = () => { clearTimeout(tm); tm = setTimeout(fire, 700); };
    if (LASTQ === inp.dataset.q) {   // qayta chizilgandan keyin yozishni davom ettirish
      inp.focus(); const n = inp.value.length; inp.setSelectionRange(n, n);
    }
  });
  LASTQ = null;
}
let LASTQ = null;

function regPanel(d) {
  const t = d.tournament;
  const P = partMap(d.participants);
  const byTeam = {}; d.participants.forEach((p) => { byTeam[p.teamId] = p; });
  const mine = S.me ? (P[S.me.id] || (d.mePart && d.mePart.userId === S.me.id ? d.mePart : null)) : null;
  const full = t.maxPlayers && t.count >= t.maxPlayers && !mine;
  const pool = S.teamList.filter((x) => x.kind === t.settings.teamKind);
  let top = '';
  if (!S.me && !S.admin) top = `<div class="alert info">Ishtirok etish uchun <a href="#/login" style="text-decoration:underline">kiring</a> yoki <a href="#/register" style="text-decoration:underline">ro'yxatdan o'ting</a>.</div>`;
  else if (S.admin && !S.me) top = '<div class="alert info">Siz admin sifatida kirdingiz. Turnirda o\'ynash uchun o\'yinchi hisobidan foydalaning.</div>';
  else if (mine) top = `<div class="alert ok" style="align-items:center">${logo(mine.teamId, 30)}<div class="grow">Siz ishtirokchisiz: <b>${esc(team(mine.teamId).name)}</b>. Turnir boshlanguncha jamoani almashtirishingiz mumkin.</div><button class="btn sm danger" id="leaveBtn">Turnirdan chiqish</button></div>`;
  else if (!t.regOpen) top = '<div class="alert warn">Ro\'yxatga olish vaqtincha yopilgan</div>';
  else if (full) top = '<div class="alert warn">Turnirda bo\'sh joy qolmagan</div>';
  else top = '<div class="alert info">Jamoani tanlang — tanlangan jamoa boshqa o\'yinchilarga yopiladi.</div>';
  const canPick = S.me && t.regOpen && !full;
  if (t.settings.teamKind === 'none') {
    // jamoasiz turnir: jamoa tanlash yo'q, faqat ishtirok etish
    let box;
    if (!S.me && !S.admin) box = `<div class="alert info">Ishtirok etish uchun <a href="#/login" style="text-decoration:underline">kiring</a> yoki <a href="#/register" style="text-decoration:underline">ro'yxatdan o'ting</a>.</div>`;
    else if (S.admin && !S.me) box = '<div class="alert info">Siz admin sifatida kirdingiz. Turnirda o\'ynash uchun o\'yinchi hisobidan foydalaning.</div>';
    else if (mine) box = `<div class="alert ok" style="align-items:center">${ava(S.me, 36)}<div class="grow">Siz ishtirokchisiz! Turnirda profilingiz ko'rinadi: <b>${esc(S.me.nickname)}</b> · ${esc(S.me.telegram)}</div><button class="btn sm danger" id="leaveBtn">Turnirdan chiqish</button></div>`;
    else if (!t.regOpen) box = '<div class="alert warn">Ro\'yxatga olish vaqtincha yopilgan</div>';
    else if (full) box = '<div class="alert warn">Turnirda bo\'sh joy qolmagan</div>';
    else box = `<div class="row" style="justify-content:space-between;align-items:center">
        <div class="row">${ava(S.me, 46)}<div><b>${esc(S.me.nickname)}</b><br>${tgLink(S.me.telegram)}</div></div>
        <button class="btn primary lg" id="joinBtn">${ic.plus} Ishtirok etish</button></div>
      <p class="muted" style="margin:12px 0 0;font-size:13px">Bu turnirda jamoa tanlanmaydi — jadval va o'yinlarda profil rasmingiz, nickname va Telegram'ingiz ko'rinadi. <a class="plink" href="#/profile">Profil rasmini qo'yish</a></p>`;
    return `<div class="grid" style="grid-template-columns:minmax(0,1fr)">
      <div class="card"><div class="card-h"><h3>Ro'yxatdan o'tish</h3><span class="badge info">Jamoasiz turnir</span></div>${box}</div>
      <div class="card"><div class="card-h"><h3>Ishtirokchilar</h3><span class="badge">${t.count}${t.maxPlayers ? ' / ' + t.maxPlayers : ''}</span></div>
        ${d.big ? `<div class="mb">${searchBox('pq', new URLSearchParams(location.hash.split('?')[1] || '').get('pq'), 'O\'yinchi qidirish (nik yoki telegram)...')}</div>`
          : d.participants.length > 12 ? '<input id="psearch" placeholder="O\'yinchi qidirish..." class="mb" style="max-width:320px">' : ''}
        <div id="plistBox">${pCards(d.participants)}</div>
        ${d.big ? pager(d.participantTotal, +(new URLSearchParams(location.hash.split('?')[1] || '').get('pp') || 0), 'pp') : ''}</div>
    </div>`;
  }
  return `<div class="grid" style="grid-template-columns:minmax(0,1fr)">
    <div class="card"><div class="card-h"><h3>Jamoa tanlash</h3><input id="tsearch" placeholder="Jamoa qidirish..." style="max-width:260px"></div>
      ${top}
      <div class="tpicker mt" id="tpicker">${pool.map((x) => {
        const owner = byTeam[x.id];
        const isMine = mine && mine.teamId === x.id;
        const dis = !canPick || (owner && !isMine);
        return `<button class="tpick ${isMine ? 'mine' : ''}" data-team="${esc(x.id)}" data-name="${esc(x.name.toLowerCase())}" ${dis ? 'disabled' : ''}>${logo(x.id, 48)}<span>${esc(x.name)}</span>${owner ? `<small>${isMine ? 'Sizning jamoangiz' : 'Band: ' + esc(owner.nickname)}</small>` : '<small>Bo\'sh</small>'}</button>`;
      }).join('')}</div>
    </div>
    <div class="card"><div class="card-h"><h3>Ishtirokchilar</h3><span class="badge">${t.count}${t.maxPlayers ? ' / ' + t.maxPlayers : ''}</span></div>${pCards(d.participants)}</div>
  </div>`;
}
function bindRegPanel(id) {
  const tp = $('#tpicker');
  if (tp) {
    tp.onclick = async (e) => {
      const b = e.target.closest('.tpick'); if (!b || b.disabled || b.classList.contains('mine')) return;
      try { await api('POST', `/api/tournaments/${id}/join`, { teamId: b.dataset.team }); toast(`${team(b.dataset.team).name} tanlandi`); rerender(); } catch (err) { toast(err.message, true); rerender(); }
    };
    $('#tsearch').oninput = (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$('.tpick', tp).forEach((b) => b.classList.toggle('hidden', q && !b.dataset.name.includes(q)));
    };
  }
  const jb = $('#joinBtn');
  if (jb) jb.onclick = async () => {
    jb.disabled = true;
    try { await api('POST', `/api/tournaments/${id}/join`, {}); toast('Turnirga qo\'shildingiz!'); rerender(); } catch (err) { toast(err.message, true); jb.disabled = false; }
  };
  const ps = $('#psearch');
  if (ps) ps.oninput = () => {
    const q = ps.value.trim().toLowerCase();
    $$('#plistBox .pcard').forEach((c) => c.classList.toggle('hidden', q && !c.textContent.toLowerCase().includes(q)));
  };
  const lb = $('#leaveBtn');
  if (lb) lb.onclick = async () => {
    if (!confirmBox('Turnirdan chiqmoqchimisiz?')) return;
    try { await api('POST', `/api/tournaments/${id}/leave`, {}); toast('Turnirdan chiqdingiz'); rerender(); } catch (err) { toast(err.message, true); }
  };
}

/* ---------------- match */
const pageMatch = page(async (id) => {
  const d = await api('GET', `/api/matches/${id}`);
  CUR = d;
  const m = d.match, t = d.tournament, H = m.homeP, A = m.awayP;
  const myId = S.me?.id;
  const isPart = !!myId && (myId === m.home || myId === m.away);
  const locked = !!m.opensAt && m.opensAt > now();
  const open = t.status === 'active' && m.status !== 'auto' && !m.forfeit && !locked && (!m.deadline || m.deadline > now());
  const used = (m.edits || {})[myId] || 0;
  const left = S.maxEdits - used;
  const canSubmit = isPart && open && (m.status === 'pending' || left > 0);
  const isKO = m.stage === 'ko';
  const score = m.status === 'pending' ? '— : —' : `${m.hs} : ${m.as}`;
  const stBadge = m.forfeit ? '<span class="badge bad">Qizil kartochka — texnik 3:0</span>'
    : locked && m.status === 'pending' ? '<span class="badge warn">Tur hali ochilmagan</span>'
      : { pending: '<span class="badge info live">Natija kutilmoqda</span>', played: '<span class="badge ok">O\'ynalgan</span>', auto: '<span class="badge warn">Texnik 0:0 (dedlayn)</span>' }[m.status];
  const side = (p) => (p.teamId
    ? `<div class="bteam">${logo(p.teamId, 92)}<h2>${esc(team(p.teamId).name)}</h2><div class="nick row" style="gap:6px;justify-content:center">${ava(p, 22)}<a href="#/u/${esc(p.id)}" style="color:inherit">${esc(p.nickname)}</a>${cardsIc(p.cards)}</div>${tgLink(p.telegram)}</div>`
    : `<div class="bteam">${ava(p, 92)}<h2><a href="#/u/${esc(p.id)}" style="color:inherit">${esc(p.nickname)}</a>${cardsIc(p.cards)}</h2>${tgLink(p.telegram)}</div>`);
  let tieInfo = '';
  if (d.tie && d.tie.matches.length > 1 && d.tie.agg) {
    const aIsHome = d.tie.a === m.home;
    tieInfo = `<div class="pens">Umumiy hisob: ${aIsHome ? d.tie.agg[0] : d.tie.agg[1]} : ${aIsHome ? d.tie.agg[1] : d.tie.agg[0]}</div>`;
  }
  const myReportOpen = d.reports.some((r) => r.by === myId && r.status === 'open');

  let form = '';
  if (canSubmit) {
    form = `<div class="card mt"><div class="score-form">
      <h3 class="center">${m.status === 'pending' ? 'Natijani kiritish' : 'Natijani tahrirlash'}</h3>
      <p class="center muted" style="margin-top:0">${m.status === 'pending' ? 'Hisobni kiriting va o\'yin yakunidagi skrinshotni yuklang.' : `Tahrirlash imkoniyati: <b>${left}</b> / ${S.maxEdits} qoldi`}</p>
      <form id="sf">
        <div class="score-labels"><span>${H.teamId ? esc(team(H.teamId).short || '') + ' · ' : ''}${esc(H.nickname)}</span><span>${A.teamId ? esc(team(A.teamId).short || '') + ' · ' : ''}${esc(A.nickname)}</span></div>
        <div class="score-inputs"><input name="hs" type="number" min="0" max="99" required value="${m.hs ?? ''}" inputmode="numeric"><span class="colon">:</span><input name="as" type="number" min="0" max="99" required value="${m.as ?? ''}" inputmode="numeric"></div>
        ${isKO ? `<div id="penBox" class="${m.hp != null ? '' : 'hidden'}"><p class="center muted" style="margin:0;font-weight:700;font-size:13px">Penaltilar seriyasi (umumiy hisob teng bo'lsa)</p>
          <div class="score-inputs pen"><input name="hp" type="number" min="0" max="99" value="${m.hp ?? ''}"><span class="colon">:</span><input name="ap" type="number" min="0" max="99" value="${m.ap ?? ''}"></div></div>
          <p class="center"><button type="button" class="btn sm ghost" id="penToggle">Penaltilar bo'ldimi?</button></p>` : ''}
        <div class="drop" id="drop"><input type="file" accept="image/*" hidden>
          <div id="dropInner">${ic.image}<span>${m.image ? 'Yangi skrinshot yuklash (ixtiyoriy)' : 'Natija skrinshotini yuklang (majburiy)'}</span><small>Bosing yoki rasmni shu yerga tashlang</small></div></div>
        <button class="btn primary block lg mt" type="submit">${m.status === 'pending' ? 'Natijani yuborish' : 'Tahrirni saqlash'}</button>
      </form></div></div>`;
  } else if (isPart && locked && m.status === 'pending' && t.status === 'active') {
    form = `<div class="alert info mt">${ic.clock} Bu tur hali ochilmagan. Oldingi tur dedlayni (<b>${fmtDate(m.opensAt)}</b>) tugagach natija kiritishingiz mumkin.</div>`;
  } else if (isPart && m.forfeit) {
    form = '<div class="alert bad mt">Bu o\'yin qizil kartochka sababli texnik natija (0:3) bilan yakunlangan.</div>';
  } else if (isPart && !open && t.status === 'active') {
    form = '<div class="alert warn mt">Dedlayn tugagan — endi natijani faqat admin o\'zgartira oladi.</div>';
  } else if (isPart && m.status === 'played' && left <= 0 && open) {
    form = '<div class="alert warn mt">Siz tahrirlash limitidan foydalanib bo\'ldingiz. Noto\'g\'ri bo\'lsa adminga xabar bering.</div>';
  }

  let report = '';
  if (isPart && m.status !== 'pending' && t.status !== 'registration') {
    report = myReportOpen
      ? '<div class="alert info mt">Sizning shikoyatingiz admin tomonidan ko\'rib chiqilmoqda.</div>'
      : `<div class="card mt"><div class="card-h"><h3>${ic.flag} Hisob noto'g'ri kiritildimi?</h3><button class="btn danger sm" id="repToggle">Adminga xabar berish</button></div>
        <form id="rf" class="hidden"><label class="f"><span>Izoh: nima noto'g'ri?</span><textarea name="reason" required minlength="3" maxlength="600" placeholder="Masalan: haqiqiy hisob 2:1 edi, raqib 1:2 deb kiritdi"></textarea></label><button class="btn danger" type="submit">Shikoyat yuborish</button></form></div>`;
  }

  let admin = '';
  if (S.admin && canT(t, 'results')) {
    admin = `<div class="card mt"><div class="card-h"><h3>${ic.shield} Admin: natijani o'zgartirish</h3></div>
      <form id="af"><div class="fgrid">
        <label class="f"><span>${esc(H.nickname)} (uy)</span><input name="hs" type="number" min="0" max="99" value="${m.hs ?? ''}" required></label>
        <label class="f"><span>${esc(A.nickname)} (mehmon)</span><input name="as" type="number" min="0" max="99" value="${m.as ?? ''}" required></label>
        ${isKO ? `<label class="f"><span>Penalti (uy)</span><input name="hp" type="number" min="0" max="99" value="${m.hp ?? ''}"></label>
        <label class="f"><span>Penalti (mehmon)</span><input name="ap" type="number" min="0" max="99" value="${m.ap ?? ''}"></label>` : ''}
      </div>
      <label class="check mb"><input type="checkbox" name="resetEdits" value="1"> O'yinchilarning tahrirlash hisoblagichini nollash</label>
      <div class="row"><button class="btn primary" type="submit">Saqlash</button><button class="btn danger" type="button" id="resetBtn">Natijani bekor qilish (qayta ochish)</button></div></form></div>`;
  }
  if (S.admin) {
    if (t.status === 'active' && canT(t, 'cards')) {
      const cardRow = (p) => `<div class="li">${ava(p, 34)}<div class="info"><b>${esc(p.nickname)} ${cardsIc(p.cards)}</b><small>Sariq: ${p.cards?.y || 0} · Qizil: ${p.cards?.red ? 'bor (keyingi o\'yin 0:3)' : 'yo\'q'}</small></div>
        <div class="card-btns"><button class="btn sm yc" data-card="yellow" data-uid="${p.id}">Sariq</button><button class="btn sm rc" data-card="red" data-uid="${p.id}">Qizil</button>
        ${p.cards?.y ? `<button class="btn sm ghost" data-card="remove_yellow" data-uid="${p.id}">−Sariq</button>` : ''}${p.cards?.red ? `<button class="btn sm ghost" data-card="remove_red" data-uid="${p.id}">Qizilni bekor qilish</button>` : ''}</div></div>`;
      admin += `<div class="card mt"><div class="card-h"><h3>Admin: kartochka berish</h3></div>
        <p class="muted" style="margin-top:0">Noto'g'ri hisob kiritgan o'yinchiga beriladi. 2 ta sariq = qizil. Qizil olgan o'yinchi keyingi o'yinida texnik mag'lub bo'ladi (0:3), so'ng qizil o'chadi. Sariq final yoki turnir oxirigacha turadi.</p>
        <div class="list">${cardRow(H)}${cardRow(A)}</div></div>`;
    }
  }

  const reports = d.reports.length ? `<div class="card mt"><h3>Shikoyatlar</h3>${d.reports.map((r) => `<div class="report ${r.status}">
      <div class="row"><b>${esc(r.byP.nickname)}</b><span class="badge ${r.status === 'open' ? 'bad' : 'ok'}">${r.status === 'open' ? 'Ko\'rib chiqilmoqda' : 'Hal qilindi'}</span><span class="muted" style="font-size:13px">${fmtDate(r.created)}</span></div>
      <p style="margin:8px 0 0">${esc(r.reason)}</p>${r.note ? `<p class="muted" style="margin:6px 0 0"><b>Admin javobi:</b> ${esc(r.note)}</p>` : ''}</div>`).join('')}</div>` : '';

  const actName = { submit: 'Natija kiritdi', edit: 'Natijani tahrirladi', admin: 'Admin o\'zgartirdi', auto: 'Avtomatik 0:0', reset: 'Natija bekor qilindi', forfeit: 'Texnik natija' };
  const hist = m.history.length ? `<div class="card mt"><h3>Tarix</h3><ul class="hist">${m.history.slice().reverse().map((h) => `<li><span><b>${esc(h.byName || '')}</b> — ${actName[h.action] || h.action}${h.hs != null ? `: <b>${h.hs}:${h.as}</b>${h.hp != null ? ` (pen. ${h.hp}:${h.ap})` : ''}` : ''}</span><span class="muted">${fmtDate(h.at)}</span></li>`).join('')}</ul></div>` : '';

  return `<div class="row mb"><a class="btn sm ghost" href="#/t/${t.id}">${ic.back} ${esc(t.name)}</a></div>
  <div class="board"><div class="bbg"></div>${side(H)}
    <div class="bscore"><div class="rn">${esc(m.roundName)}${m.group ? ` · ${esc(m.group)} guruh` : ''}</div><div class="big">${score}</div>
      ${m.hp != null ? `<div class="pens">Penaltilar: ${m.hp} : ${m.ap}</div>` : ''}${tieInfo}${stBadge}
      ${locked && m.status === 'pending' ? `<span class="dl">${ic.clock} Ochiladi: ${fmtDate(m.opensAt)} · dedlayn: ${fmtDate(m.deadline)}</span>` : m.status === 'pending' && m.deadline ? dlBadge(m.deadline) : m.deadline ? `<span class="dl">${ic.clock} Dedlayn: ${fmtDate(m.deadline)}</span>` : ''}
    </div>${side(A)}</div>
  ${form}
  ${m.image ? `<div class="card mt"><div class="card-h"><h3>Natija skrinshoti</h3><a class="btn sm" href="${esc(m.image)}" target="_blank" rel="noopener">To'liq ochish</a></div><a href="${esc(m.image)}" target="_blank" rel="noopener"><img class="shot" src="${esc(m.image)}" alt="Natija skrinshoti"></a></div>` : ''}
  ${report}${admin}${reports}${hist}`;
}, (app, id) => {
  const sf = $('#sf');
  if (sf) {
    let image = null;
    setupDrop($('#drop'), async (file) => {
      try { image = await compressImage(file); $('#dropInner').innerHTML = `<img src="${image}" alt=""><small>Boshqa rasm tanlash uchun bosing</small>`; } catch (e) { toast(e.message, true); }
    });
    const pt = $('#penToggle');
    if (pt) pt.onclick = () => $('#penBox').classList.toggle('hidden');
    bindForm(sf, async (f) => {
      const body = { hs: +f.hs, as: +f.as };
      if (f.hp !== undefined && f.hp !== '' && f.ap !== '' && !$('#penBox').classList.contains('hidden')) { body.hp = +f.hp; body.ap = +f.ap; }
      if (image) body.image = image;
      try {
        await api('POST', `/api/matches/${id}/score`, body);
      } catch (e) {
        if (/Penalti/.test(e.message) && $('#penBox')) $('#penBox').classList.remove('hidden');
        throw e;
      }
      toast('Natija saqlandi'); rerender();
    });
  }
  const rt = $('#repToggle');
  if (rt) rt.onclick = () => $('#rf').classList.toggle('hidden');
  const rf = $('#rf');
  if (rf) bindForm(rf, async (f) => { await api('POST', `/api/matches/${id}/report`, f); toast('Shikoyat adminga yuborildi'); rerender(); });
  const af = $('#af');
  if (af) {
    bindForm(af, async (f) => {
      await api('PUT', `/api/admin/matches/${id}`, { hs: f.hs, as: f.as, hp: f.hp ?? '', ap: f.ap ?? '', resetEdits: !!f.resetEdits });
      toast('Natija yangilandi'); rerender();
    });
    $('#resetBtn').onclick = async () => {
      if (!confirmBox('Natijani bekor qilib, o\'yinni qayta ochasizmi?')) return;
      try { await api('PUT', `/api/admin/matches/${id}`, { reset: true, resetEdits: true }); toast('O\'yin qayta ochildi'); rerender(); } catch (e) { toast(e.message, true); }
    };
  }
  if (S.admin) bindCardButtons(CUR.match.tid, id);
});

function bindCardButtons(tid, matchId = null) {
  $$('[data-card]').forEach((b) => {
    b.onclick = async () => {
      const act = b.dataset.card;
      const names = { yellow: 'SARIQ kartochka', red: 'QIZIL kartochka', remove_yellow: 'bitta sariqni olib tashlash', remove_red: 'qizilni bekor qilish' };
      let note = '';
      if (act === 'yellow' || act === 'red') {
        note = prompt(`${names[act]} berish sababi (ixtiyoriy):`, 'Noto\'g\'ri hisob kiritdi');
        if (note === null) return;
      } else if (!confirmBox(`Rostdan ham ${names[act]}?`)) return;
      try {
        const r = await api('POST', `/api/admin/tournaments/${tid}/cards/${b.dataset.uid}`, { action: act, note, match: matchId });
        toast(r.cards && r.cards.red && (act === 'red' || act === 'yellow') ? 'Qizil kartochka — keyingi o\'yin 0:3 texnik mag\'lubiyat' : 'Bajarildi'); rerender();
      } catch (e) { toast(e.message, true); }
    };
  });
}

/* ================================================================== ADMIN */
function adminShell(active, content) {
  const n = S.admin.openReports;
  const items = [['', 'Turnirlar', ic.trophy]];
  if (can('reports')) items.push(['reports', 'Shikoyatlar', ic.alert, n]);
  if (can('users_view')) items.push(['players', 'O\'yinchilar', ic.users]);
  if (can('teams')) items.push(['teams', 'Jamoalar', ic.shield]);
  if (S.admin.super) items.push(['admins', 'Adminlar', ic.user]);
  items.push(['settings', 'Sozlamalar', ic.settings]);
  return `${S.admin.defaultPw ? '<div class="alert warn mb">Siz standart paroldan foydalanmoqdasiz. Xavfsizlik uchun <a href="#/admin/settings" style="text-decoration:underline">parolni almashtiring</a>.</div>' : ''}
  <div class="admin-layout"><nav class="card side-nav">${items.map(([k, label, icon, cnt]) => `<a href="#/admin${k ? '/' + k : ''}" class="${active === k ? 'active' : ''}">${icon}${label}${cnt ? `<span class="pill">${cnt}</span>` : ''}</a>`).join('')}</nav>
  <div>${content}</div></div>`;
}

function settingsFields(type, s = {}) {
  const sel = (name, opts, val) => `<select name="${name}">${opts.map(([v, l]) => `<option value="${v}" ${String(val) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const num = (name, val, min, max) => `<input name="${name}" type="number" min="${min}" max="${max}" value="${val}" required>`;
  const tk = s.teamKind || (type === 'wc' ? 'nation' : 'club');
  let h = `<label class="f"><span>Jamoalar (logo)</span>${sel('teamKind', [['club', 'Logoli: klublar (50 ta nomdor klub)'], ['nation', 'Logoli: terma jamoalar (JCh)'], ['none', 'Logosiz: jamoa tanlanmaydi']], tk)}<em>Logosiz turnirda o'yinchining profil rasmi, nickname va Telegram'i ko'rinadi — katta (1000+) turnirlar uchun qulay</em></label>`;
  if (type === 'league') {
    h += `<label class="f"><span>O'yinlar formati</span>${sel('legs', [[1, '1 aylana — har raqib bilan 1 o\'yin'], [2, '2 aylana — uy va mehmonda (javob o\'yini)'], [3, '3 aylana'], [4, '4 aylana']], s.legs ?? 2)}<em>Masalan, 20 ishtirokchi + 2 aylana = 38 tur (La Liga kabi)</em></label>`;
  }
  if (type === 'ucl') {
    h += `<label class="f"><span>Liga bosqichida har bir jamoa o'yinlari</span>${num('leagueGames', s.leagueGames ?? 8, 1, 60)}<em>Yangi format: 8 ta har xil raqib</em></label>
      <label class="f"><span>To'g'ridan-to'g'ri pley-offga chiqadi (1–N o'rin)</span>${num('direct', s.direct ?? 8, 1, 64)}</label>
      <label class="f"><span>Pley-off bosqichida o'ynaydiganlar soni</span>${num('playoff', s.playoff ?? 16, 0, 64)}<em>Standart: 9–24 o'rinlar (16 ta) tasodifiy juftliklarda o'ynaydi, 8 g'olib 1/8 finalga chiqadi, 25+ chiqib ketadi</em></label>
      <label class="f"><span>Pley-off juftliklari</span>${sel('koLegs', [[2, '2 o\'yinli (uy-mehmon)'], [1, '1 o\'yinli']], s.koLegs ?? 2)}<em>Final har doim 1 o'yin</em></label>`;
  }
  if (type === 'wc') {
    h += `<label class="f"><span>Guruhlar soni</span>${num('groups', s.groups ?? 8, 1, 16)}</label>
      <label class="f"><span>Har guruhdan chiqadi</span>${num('advance', s.advance ?? 2, 1, 4)}<em>Guruhlar × chiquvchilar = 2, 4, 8, 16 yoki 32</em></label>
      <label class="f"><span>Guruh o'yinlari</span>${sel('groupLegs', [[1, '1 aylana'], [2, '2 aylana']], s.groupLegs ?? 1)}</label>
      <label class="f"><span>Pley-off juftliklari</span>${sel('koLegs', [[1, '1 o\'yinli'], [2, '2 o\'yinli']], s.koLegs ?? 1)}</label>`;
  }
  if (type === 'cup') {
    h += `<label class="f"><span>Pley-off juftliklari</span>${sel('koLegs', [[1, '1 o\'yinli'], [2, '2 o\'yinli (uy-mehmon)']], s.koLegs ?? 1)}</label>`;
  }
  return h;
}
function collectSettings(f) {
  const s = {};
  ['teamKind', 'legs', 'leagueGames', 'direct', 'playoff', 'koLegs', 'groups', 'advance', 'groupLegs'].forEach((k) => {
    if (f[k] !== undefined) s[k] = k === 'teamKind' ? f[k] : +f[k];
  });
  return s;
}

const pageAdmin = page(async (tab = '', params = new URLSearchParams()) => {
  if (!S.admin) { location.hash = '#/admin/login'; return ''; }
  tab = tab || '';
  let content = '';
  const denied = (perm) => `<div class="empty">Bu bo'lim uchun sizda ruxsat yo'q. Asosiy adminga murojaat qiling.</div>`;
  if ((tab === 'reports' && !can('reports')) || (tab === 'players' && !can('users_view')) || (tab === 'teams' && !can('teams'))) {
    return adminShell(tab, denied());
  }
  if (tab === '') {
    const { tournaments } = await api('GET', '/api/tournaments');
    const mine = tournaments.filter(ownsT);
    content = (can('create_tournament') ? `<div class="card"><div class="card-h"><h3>${ic.plus} Yangi turnir yaratish</h3></div>
      <form id="cf">
        <div class="fgrid">
          <label class="f"><span>Turnir nomi</span><input name="name" required minlength="3" maxlength="60" placeholder="Masalan: UEFA Chempionlar ligasi 2026"></label>
          <label class="f"><span>Turnir turi</span><select name="type" id="ctype">${Object.entries(TYPE).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></label>
          <label class="f"><span>Maksimal ishtirokchilar (0 = cheklanmagan)</span><input name="maxPlayers" type="number" min="0" max="100000" value="0"></label>
        </div>
        <div class="fgrid" id="csettings">${settingsFields('ucl')}</div>
        <label class="f"><span>Izoh / qoidalar (ixtiyoriy)</span><textarea name="description" maxlength="500" placeholder="Masalan: o'yin vaqti 10 daqiqa, sharoit: Excellent"></textarea></label>
        <button class="btn primary" type="submit">Turnir yaratish</button>
      </form></div>` : '<div class="alert info mb">Sizda turnir yaratish huquqi yo\'q.</div>')
      + `<div class="card"><div class="card-h"><h3>Barcha turnirlar</h3>${!S.admin.super ? `<span class="badge info">Siz yaratganlar: ${mine.length}</span>` : ''}</div>
        ${tournaments.length ? `<div class="list">${tournaments.map((t) => `<div class="li">${typeIco(t.type)}<div class="info"><b>${esc(t.name)} ${ownsT(t) ? '<span class="badge ok">Siz yaratgansiz</span>' : ''}</b><small>${TYPE[t.type].name} · ${t.count} ishtirokchi${t.createdBy ? ` · yaratgan: ${esc(t.createdBy)}` : ''}</small></div>${statusBadge(t.status)}<a class="btn sm" href="#/t/${t.id}">Ko'rish</a>${S.admin.super || ownsT(t) || can('manage_all') ? `<a class="btn sm primary" href="#/admin/t/${t.id}">Boshqarish</a>` : ''}</div>`).join('')}</div>` : '<div class="empty">Turnirlar yo\'q</div>'}
      </div>`;
  } else if (tab === 'reports') {
    const { reports } = await api('GET', '/api/admin/reports');
    content = `<div class="card"><div class="card-h"><h3>Noto'g'ri hisob haqida shikoyatlar</h3></div>
      ${reports.length ? reports.map((r) => `<div class="report ${r.status}">
        <div class="row"><span class="badge ${r.status === 'open' ? 'bad' : 'ok'}">${r.status === 'open' ? 'Yangi' : 'Hal qilindi'}</span><b>${esc(r.tname)}</b><span class="muted" style="font-size:13px">${fmtDate(r.created)}</span></div>
        ${r.match ? `<div class="mt">${mRow(r.match)}</div>` : ''}
        <div class="row mt" style="align-items:flex-start">
          ${r.match && r.match.image ? `<a href="${esc(r.match.image)}" target="_blank" rel="noopener"><img class="thumb" src="${esc(r.match.image)}" alt=""></a>` : ''}
          <div class="grow"><div><b>${esc(r.byP.nickname)}</b> ${tgLink(r.byP.telegram)} shikoyati (kiritilgan hisob ${r.score[0]}:${r.score[1]} bo'lganda):</div><p style="margin:6px 0">${esc(r.reason)}</p>
          ${r.note ? `<div class="muted"><b>Javob (${esc(r.resolvedBy)}):</b> ${esc(r.note)}</div>` : ''}</div>
        </div>
        ${r.status === 'open' ? `<form class="row mt resolve" data-id="${r.id}"><input name="note" placeholder="Javob / izoh (ixtiyoriy)" class="grow" style="flex:1;min-width:200px"><a class="btn sm" href="#/m/${r.matchId}">${ic.edit} Hisobni tuzatish</a><button class="btn sm primary" type="submit">Hal qilindi</button></form>` : ''}
      </div>`).join('') : '<div class="empty">Shikoyatlar yo\'q</div>'}</div>`;
  } else if (tab === 'players') {
    const page0 = +(params.get('p') || 0);
    const uq = params.get('q') || '';
    const { users, total } = await api('GET', `/api/admin/users?p=${page0}${uq ? '&q=' + encodeURIComponent(uq) : ''}`);
    content = `<div class="card"><div class="card-h"><h3>O'yinchilar (${total})</h3>${searchBox('q', uq, 'Nik, login yoki telegram...')}</div>
      ${!S.admin.super ? '<p class="muted" style="margin-top:0">Saytdan o\'yinchini o\'chirish faqat asosiy admin uchun.</p>' : ''}
      ${users.length ? `<div class="list">${users.map((u) => `<div class="li">${ava(u, 40)}
        <div class="info"><b><a class="plink" href="#/u/${u.id}">${esc(u.nickname)}</a></b><small>login: ${esc(u.username)} · ${u.tournaments} turnir · ${fmtDate(u.created)}</small>${tgLink(u.telegram)}</div>
        ${can('users_password') ? `<button class="btn sm" data-reset="${u.id}">Parolni tiklash</button>` : ''}${S.admin.super ? `<button class="btn sm danger" data-del="${u.id}" data-name="${esc(u.nickname)}">Saytdan o'chirish</button>` : ''}</div>`).join('')}</div>` : '<div class="empty">O\'yinchilar topilmadi</div>'}
      ${pager(total, page0, 'p')}</div>`;
  } else if (tab === 'teams') {
    content = `<div class="card"><div class="card-h"><h3>${ic.plus} Yangi jamoa qo'shish</h3></div>
      <form id="tf"><div class="fgrid">
        <label class="f"><span>Nomi</span><input name="name" required minlength="2" maxlength="40"></label>
        <label class="f"><span>Qisqa nomi (2–4 harf)</span><input name="short" required minlength="2" maxlength="4"></label>
        <label class="f"><span>Turi</span><select name="kind"><option value="club">Klub</option><option value="nation">Terma jamoa</option></select></label>
        <label class="f"><span>Asosiy rang</span><input name="c1" type="color" value="#1f6feb" style="height:44px;padding:4px"></label>
        <label class="f"><span>Ikkinchi rang</span><input name="c2" type="color" value="#ffffff" style="height:44px;padding:4px"></label>
        <label class="f"><span>Logotip (ixtiyoriy)</span><input name="logoFile" type="file" accept="image/*"></label>
      </div><button class="btn primary" type="submit">Qo'shish</button></form></div>
      <div class="card"><div class="card-h"><h3>Jamoalar va logotiplar</h3><input id="tsearch2" placeholder="Qidirish..." style="max-width:240px"></div>
      <p class="muted" style="margin-top:0">Istalgan jamoaga o'z logotipingizni yuklashingiz mumkin (PNG, shaffof fon tavsiya etiladi).</p>
      ${['club', 'nation'].map((k) => `<h4 class="mt">${k === 'club' ? 'Klublar' : 'Terma jamoalar'}</h4><div class="tpicker" data-kind="${k}">${S.teamList.filter((x) => x.kind === k).map((x) => `<div class="tpick" data-name="${esc(x.name.toLowerCase())}">${logo(x.id, 48)}<span>${esc(x.name)}</span>
        <div class="row" style="justify-content:center;gap:4px"><label class="btn sm" style="cursor:pointer">Logo<input type="file" accept="image/*" hidden data-logo="${esc(x.id)}"></label>${x.customLogo ? `<button class="btn sm ghost" data-unlogo="${esc(x.id)}" title="Logoni olib tashlash">✕</button>` : ''}${x.extra ? `<button class="btn sm danger" data-tdel="${esc(x.id)}">O'chirish</button>` : ''}</div></div>`).join('')}</div>`).join('')}
      </div>`;
  } else if (tab === 'admins') {
    if (!S.admin.super) { location.hash = '#/admin'; return ''; }
    const { admins, permList, defaults } = await api('GET', '/api/admin/admins');
    const perms = (vals, dis) => `<div class="perm-list">${permList.map(([k, label]) => permToggle(k, label, !!vals[k], dis)).join('')}</div>`;
    content = `<div class="card"><div class="card-h"><h3>${ic.plus} Yangi admin yaratish</h3></div>
      <form id="nf"><div class="fgrid"><label class="f"><span>Login</span><input name="username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_.]+"></label>
      <label class="f"><span>Parol</span><input name="password" type="text" required minlength="6"></label></div>
      <h4>Huquqlar</h4>${perms(defaults)}
      <p class="muted" style="font-size:13px">Saytdan o'yinchini o'chirish va boshqa adminlar turnirini o'chirish — faqat asosiy admin uchun, bu huquqni berib bo'lmaydi.</p>
      <button class="btn primary" type="submit">Admin yaratish</button></form></div>
      <div class="card"><div class="card-h"><h3>Adminlar</h3><span class="badge">${admins.length}</span></div>
      ${admins.map((a) => `<div class="admin-card"><div class="row" style="justify-content:space-between">
          <div class="row">${ava({ nickname: a.nickname, avatar: a.avatar }, 40)}<div><b>${esc(a.username)}</b><br><small>${a.super ? 'Asosiy admin — barcha huquqlar' : 'Admin'} · ${fmtDate(a.created)}</small></div></div>
          ${a.super ? '<span class="badge gold">Asosiy</span>' : `<div class="row"><button class="btn sm" data-areset="${a.id}">Parolni o'zgartirish</button><button class="btn sm danger" data-adel="${a.id}" data-name="${esc(a.username)}">O'chirish</button></div>`}</div>
        ${a.super ? '' : `<details class="mt"><summary style="cursor:pointer;font-weight:800">Huquqlar (${Object.values(a.perms).filter(Boolean).length} / ${permList.length})</summary>
          <form class="permf mt" data-id="${a.id}">${perms(a.perms)}<button class="btn primary mt" type="submit">Huquqlarni saqlash</button></form></details>`}</div>`).join('')}</div>`;
  } else if (tab === 'settings') {
    const A = { ...S.admin, id: 'a' + S.admin.id };
    content = `<div class="card profile-card">${profileHead(A, `${S.admin.super ? 'Asosiy admin' : 'Admin'} · login: ${esc(S.admin.username)}`)}
      <form id="apf" class="profile-form">
        ${mediaEditor(A)}
        <div class="fgrid">
          <label class="f"><span>Login</span><input name="username" value="${esc(S.admin.username)}" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_.]+"></label>
          <label class="f"><span>Nickname</span><input name="nickname" value="${esc(S.admin.nickname || '')}" required minlength="2" maxlength="30"></label>
          <label class="f"><span>Telegram</span><input name="telegram" value="${esc(S.admin.telegram || '')}" placeholder="@Flarnix"></label>
        </div>
        <button class="btn primary" type="submit">Profilni saqlash</button>
      </form></div>
      <div class="card"><div class="card-h"><h3>Parolni almashtirish</h3></div>
      <form id="sf2" style="max-width:420px"><label class="f"><span>Joriy parol</span><input name="oldPassword" type="password" required autocomplete="current-password"></label>
      <label class="f"><span>Yangi parol</span><input name="newPassword" type="password" required minlength="6" autocomplete="new-password"></label>
      <button class="btn primary" type="submit">Saqlash</button></form></div>`;
  } else {
    location.hash = '#/admin'; return '';
  }
  return adminShell(tab, content);
}, (app, tab = '') => {
  tab = tab || '';
  if (!S.admin) return;
  if (tab === '') {
    const ct = $('#ctype');
    if (ct) ct.onchange = () => { $('#csettings').innerHTML = settingsFields(ct.value); };
    const cf = $('#cf');
    if (cf) bindForm(cf, async (f) => {
      const r = await api('POST', '/api/admin/tournaments', { name: f.name, type: f.type, maxPlayers: +f.maxPlayers || 0, description: f.description, settings: collectSettings(f) });
      toast('Turnir yaratildi'); location.hash = `#/admin/t/${r.id}`;
    });
  }
  if (tab === 'reports') {
    $$('form.resolve').forEach((f) => bindForm(f, async (d) => { await api('POST', `/api/admin/reports/${f.dataset.id}/resolve`, d); toast('Shikoyat yopildi'); rerender(); }));
  }
  if (tab === 'players') {
    bindBigControls('#/admin/players');
    app.onclick = async (e) => {
      const r = e.target.closest('[data-reset]'), dl = e.target.closest('[data-del]');
      try {
        if (r) {
          const pw = prompt('Yangi parolni kiriting (kamida 6 belgi):'); if (!pw) return;
          await api('POST', `/api/admin/users/${r.dataset.reset}/password`, { password: pw }); toast('Parol yangilandi');
        }
        if (dl) {
          if (!confirmBox(`${dl.dataset.name} o'yinchisini o'chirasizmi? Bu amalni qaytarib bo'lmaydi.`)) return;
          await api('DELETE', `/api/admin/users/${dl.dataset.del}`); toast('O\'yinchi o\'chirildi'); rerender();
        }
      } catch (err) { toast(err.message, true); }
    };
  } else { app.onclick = null; }
  if (tab === 'teams') {
    const ts = $('#tsearch2');
    if (ts) ts.oninput = () => { const q = ts.value.toLowerCase(); $$('.tpick', app).forEach((b) => b.classList.toggle('hidden', q && !b.dataset.name.includes(q))); };
    const tf = $('#tf');
    if (tf) bindForm(tf, async (f) => {
      const file = tf.querySelector('[name=logoFile]').files[0];
      const body = { name: f.name, short: f.short, kind: f.kind, c1: f.c1, c2: f.c2 };
      if (file) body.logo = await compressImage(file, 400, 0.92);
      await api('POST', '/api/admin/teams', body); await loadTeams(); toast('Jamoa qo\'shildi'); rerender();
    });
    $$('[data-logo]').forEach((inp) => inp.addEventListener('change', async () => {
      try {
        const img = await compressImage(inp.files[0], 400, 0.92);
        await api('PUT', `/api/admin/teams/${inp.dataset.logo}`, { logo: img }); await loadTeams(); toast('Logotip yangilandi'); rerender();
      } catch (err) { toast(err.message, true); }
    }));
    $$('[data-unlogo]').forEach((b) => { b.onclick = async () => { try { await api('PUT', `/api/admin/teams/${b.dataset.unlogo}`, { logo: '' }); await loadTeams(); rerender(); } catch (err) { toast(err.message, true); } }; });
    $$('[data-tdel]').forEach((b) => { b.onclick = async () => { if (!confirmBox('Jamoani o\'chirasizmi?')) return; try { await api('DELETE', `/api/admin/teams/${b.dataset.tdel}`); await loadTeams(); rerender(); } catch (err) { toast(err.message, true); } }; });
  }
  if (tab === 'admins') {
    const nf = $('#nf');
    const readPerms = (form) => Object.fromEntries($$('.perm-list input[type=checkbox]', form).map((c) => [c.name, c.checked]));
    if (nf) bindForm(nf, async (f) => {
      await api('POST', '/api/admin/admins', { username: f.username, password: f.password, perms: readPerms(nf) });
      toast(`Admin "${f.username}" yaratildi`); rerender();
    });
    $$('form.permf').forEach((pf) => bindForm(pf, async () => {
      await api('PUT', `/api/admin/admins/${pf.dataset.id}/perms`, { perms: readPerms(pf) });
      toast('Huquqlar saqlandi'); rerender();
    }));
    $$('[data-adel]').forEach((b) => { b.onclick = async () => { if (!confirmBox(`${b.dataset.name} adminini o'chirasizmi?`)) return; try { await api('DELETE', `/api/admin/admins/${b.dataset.adel}`); toast('Admin o\'chirildi'); rerender(); } catch (err) { toast(err.message, true); } }; });
    $$('[data-areset]').forEach((b) => { b.onclick = async () => { const pw = prompt('Yangi parol (kamida 6 belgi):'); if (!pw) return; try { await api('POST', `/api/admin/admins/${b.dataset.areset}/password`, { password: pw }); toast('Parol yangilandi'); } catch (err) { toast(err.message, true); } }; });
  }
  if (tab === 'settings') {
    const f = $('#sf2');
    if (f) bindForm(f, async (d) => { await api('PUT', '/api/admin/me/password', d); toast('Parol almashtirildi'); f.reset(); rerender(); });
    const media = {};
    bindMediaEditor(media);
    const pf = $('#apf');
    if (pf) bindForm(pf, async (d) => { await api('PUT', '/api/admin/me', { ...d, ...media }); toast('Profil saqlandi'); rerender(); });
  }
});

/* ---------------- admin: tournament management */
const pageAdminTournament = page(async (id, params) => {
  if (!S.admin) { location.hash = '#/admin/login'; return ''; }
  const qs = new URLSearchParams();
  ['pp', 'pq'].forEach((k) => { if (params.get(k)) qs.set(k, params.get(k)); });
  const d = await api('GET', `/api/tournaments/${id}${qs.toString() ? '?' + qs : ''}`);
  CUR = d;
  const t = d.tournament;
  const extra = [];
  (d.ko || []).forEach((k) => [...k.ties, ...(k.undecided || [])].forEach((x) => { if (x.ap) extra.push(x.ap); if (x.bp) extra.push(x.bp); }));
  const P = partMap([...extra, ...d.participants]);
  const rs = d.roundStats || {};
  const pTools = d.big ? `<div class="row mb">${searchBox('pq', params.get('pq'), 'O\'yinchi qidirish...')}<span class="muted" style="font-size:13px;font-weight:700">Jami: ${d.participantTotal}</span></div>` : '';
  const pPager = d.big ? pager(d.participantTotal, +(params.get('pp') || 0), 'pp') : '';
  const s = t.settings;
  const blocks = [];

  blocks.push(`<div class="card"><div class="card-h"><div><div class="row">${typeIco(t.type)}<span class="muted" style="font-weight:700">${TYPE[t.type].name}</span>${statusBadge(t.status)}</div><h2 style="margin:8px 0 0">${esc(t.name)}</h2></div>
    <div class="row"><a class="btn" href="#/t/${t.id}">Ommaviy sahifa</a>${canDelT(t) ? '<button class="btn danger" id="delT">Turnirni o\'chirish</button>' : ''}</div></div>
    ${!S.admin.super ? `<p class="muted" style="margin-top:0">${ownsT(t) ? 'Bu turnirni siz yaratgansiz.' : `Bu turnirni <b>${esc(t.createdBy || 'boshqa admin')}</b> yaratgan — sizga berilgan huquqlar doirasida boshqarasiz.`}</p>` : ''}
    <form id="ef" class="${canT(t, 'create_tournament') ? '' : 'hidden'}"><div class="fgrid">
      <label class="f"><span>Nomi</span><input name="name" value="${esc(t.name)}" required></label>
      ${t.status === 'registration' ? `<label class="f"><span>Maksimal ishtirokchilar (0 = cheklanmagan)</span><input name="maxPlayers" type="number" min="0" max="100000" value="${t.maxPlayers}"></label>` : ''}
    </div>
    ${t.status === 'registration' ? `<div class="fgrid">${settingsFields(t.type, s)}</div>` : `<p class="muted">${esc(settingsSummary(t))}</p>`}
    <label class="f"><span>Izoh / qoidalar</span><textarea name="description" maxlength="500">${esc(t.description)}</textarea></label>
    ${t.status === 'registration' ? `<label class="check mb"><input type="checkbox" name="regOpen" ${t.regOpen ? 'checked' : ''}> Ro'yxatga olish ochiq</label>` : ''}
    <div><button class="btn primary" type="submit">Saqlash</button></div></form></div>`);

  if (t.status === 'registration' && canT(t, 'create_tournament')) {
    let need = '';
    if (t.type === 'ucl') need = `Kamida ${s.direct + s.playoff} ishtirokchi kerak.`;
    if (t.type === 'wc') need = `Kamida ${s.groups * Math.max(2, s.advance)} ishtirokchi kerak (${s.groups} guruh).`;
    const def = new Date(now() + 2 * 864e5); def.setHours(23, 59, 0, 0);
    blocks.push(`<div class="card"><div class="card-h"><h3>Turnirni boshlash</h3><span class="badge">${t.count} ishtirokchi</span></div>
      <p class="muted" style="margin-top:0">Boshlanganda ishtirokchilar tasodifiy taqsimlanadi va ${t.type === 'cup' ? 'birinchi pley-off bosqichi' : 'barcha turlar jadvali'} yaratiladi. ${need}
      Har bir tur uchun dedlayn avtomatik qo'yiladi (keyin alohida o'zgartirish mumkin). Dedlayngacha natija kiritilmasa — 0:0 hisobi qo'yiladi.</p>
      <form id="stf"><div class="fgrid">
        <label class="f"><span>1-tur dedlayni</span><input name="deadline" type="datetime-local" value="${toLocalInput(def.getTime())}" required></label>
        <label class="f"><span>Keyingi turlar oralig'i (soat)</span><input name="intervalHours" type="number" min="1" max="1440" value="24" required><em>Masalan: 24 = har kuni, 48 = 2 kunda bir</em></label>
      </div><button class="btn primary" type="submit">Turnirni boshlash</button></form></div>`);
  }
  if (t.status === 'registration') {
    blocks.push(`<div class="card"><div class="card-h"><h3>Ishtirokchilar</h3></div>${pTools}${d.participants.length ? `<div class="list">${d.participants.map((p) => `<div class="li">${pLogo(p, 36)}<div class="info"><b>${esc(p.nickname)}</b>${p.teamId ? `<small>${esc(team(p.teamId).name)}</small>` : ''}${tgLink(p.telegram)}</div>${canRemove(t) ? `<button class="btn sm danger" data-rm="${p.userId}">Chiqarish</button>` : ''}</div>`).join('')}</div>` : '<div class="empty">Hali hech kim qo\'shilmagan</div>'}${pPager}</div>`);
  }

  if (t.status !== 'registration' && canT(t, 'deadlines')) {
    const pendingCount = (key) => (rs[key] ? rs[key].pending : 0);
    const autoCount = (key) => (rs[key] ? rs[key].auto : 0);
    blocks.push(`<div class="card"><div class="card-h"><h3>${ic.clock} Turlar va dedlaynlar</h3></div>
      <p class="muted" style="margin-top:0">Dedlayn o'yinchilarga ham ko'rinadi. Muddat tugaganda natija kiritilmagan o'yinlarga avtomatik 0:0 qo'yiladi.</p>
      <div class="table-wrap"><table class="tbl dl-table"><thead><tr><th class="l">Tur</th><th class="l">Dedlayn</th><th>Holat</th><th></th></tr></thead><tbody>
      ${t.rounds.map((r) => `<tr><td class="l"><b>${esc(r.name)}</b></td><td class="l"><input type="datetime-local" value="${toLocalInput(r.deadline)}" data-dlinput="${r.key}"></td>
        <td><span class="muted" style="font-size:13px">${pendingCount(r.key)} kutilmoqda${autoCount(r.key) ? ` · ${autoCount(r.key)} texnik` : ''}</span></td>
        <td><div class="row" style="flex-wrap:nowrap">${autoCount(r.key) ? `<label class="check" title="Dedlayn uzaytirilsa texnik 0:0 o'yinlarni qayta ochish"><input type="checkbox" data-reopen="${r.key}"> qayta ochish</label>` : ''}<button class="btn sm primary" data-dlsave="${r.key}">Saqlash</button></div></td></tr>`).join('')}
      </tbody></table></div></div>`);
  }

  if (t.status === 'active') {
    const cc = canT(t, 'cards'), cr = canRemove(t);
    if (cc || cr) blocks.push(`<div class="card"><div class="card-h"><h3>O'yinchilar: kartochka va chetlatish</h3><span class="muted" style="font-size:13px">2 sariq = qizil · qizil = keyingi o'yin 0:3 · chetlatilgan o'yinchining qolgan o'yinlari 0:3</span></div>
      ${pTools}<div class="list">${d.participants.map((p) => `<div class="li">${ava({ ...p, id: p.userId }, 34)}<div class="info"><b>${plink({ id: p.userId, nickname: p.nickname })} ${cardsIc(p.cards)} ${p.dq ? '<em class="tag dq">Chetlatilgan</em>' : ''}</b><small>${esc(p.teamId ? team(p.teamId).name : (p.telegram || ''))} · sariq: ${p.cards?.y || 0}${p.cards?.red ? ' · QIZIL' : ''}</small></div>
        <div class="card-btns">${cc && !p.dq ? `<button class="btn sm yc" data-card="yellow" data-uid="${p.userId}">Sariq</button><button class="btn sm rc" data-card="red" data-uid="${p.userId}">Qizil</button>
        ${p.cards?.y ? `<button class="btn sm ghost" data-card="remove_yellow" data-uid="${p.userId}">−Sariq</button>` : ''}${p.cards?.red ? `<button class="btn sm ghost" data-card="remove_red" data-uid="${p.userId}">Qizilni bekor qilish</button>` : ''}` : ''}
        ${cr && !p.dq ? `<button class="btn sm danger" data-dq="${p.userId}" data-name="${esc(p.nickname)}">Chetlatish</button>` : ''}</div></div>`).join('')}</div>${pPager}</div>`);
    let stageInfo = '';
    const last = d.ko[d.ko.length - 1];
    const isFinal = last && (last.tieCount || last.ties.length) === 1;
    const tieList = last ? (last.collapsed ? last.undecided : last.ties) : [];
    if (t.type !== 'league' && canT(t, 'create_tournament')) {
      const def = new Date(now() + 2 * 864e5); def.setHours(23, 59, 0, 0);
      if (!d.ko.length && t.type !== 'cup') stageInfo = `Barcha ${t.type === 'wc' ? 'guruh' : 'liga bosqichi'} o'yinlari yakunlangach, pley-off juftliklarini yarating.`;
      else if (isFinal) stageInfo = 'Final yakunlangach, chempionni e\'lon qiling.';
      else stageInfo = 'Joriy bosqichdagi barcha juftliklarda g\'olib aniqlangach, keyingi bosqichni yarating. Dedlaynda ikkala o\'yinchi ham natija kiritmagan juftlikdan hech kim o\'tmaydi — keyingi bosqichda raqibi o\'yinsiz o\'tadi (xohlasangiz g\'olibni qo\'lda belgilashingiz mumkin).';
      blocks.push(`<div class="card"><div class="card-h"><h3>${ic.trophy} Pley-off boshqaruvi</h3></div>
        <p class="muted" style="margin-top:0">${stageInfo}</p>
        <form id="nxf">${isFinal ? '' : `<div class="fgrid"><label class="f"><span>Yangi bosqich dedlayni${s.koLegs === 2 ? ' (1-o\'yin)' : ''}</span><input name="deadline" type="datetime-local" value="${toLocalInput(def.getTime())}" required></label>
          ${s.koLegs === 2 ? '<label class="f"><span>2-o\'yingacha oraliq (soat)</span><input name="intervalHours" type="number" min="1" max="1440" value="24"></label>' : ''}</div>`}
          <button class="btn primary" type="submit">${isFinal ? 'Chempionni e\'lon qilish' : 'Keyingi bosqichni yaratish'}</button></form>
        ${last && last.collapsed ? `<h4 class="mt">${esc(last.name)}: ${last.tieCount} ta juftlik</h4>
          <p class="muted" style="margin:0 0 8px">Quyida faqat o'ynalgan, lekin g'olibi aniqlanmagan juftliklar (${last.undecidedTotal} ta) ko'rsatilgan — ularga g'olibni qo'lda belgilang.${last.undecidedTotal > 200 ? ' Birinchi 200 tasi.' : ''}</p>` : ''}
        ${last && tieList.length ? `${last.collapsed ? '' : `<h4 class="mt">${esc(last.name)}: juftliklar</h4>`}<div class="list">${tieList.map((x) => {
          const a = P[x.a] || {}, b = P[x.b] || {};
          if (!x.a && !x.b) return '<div class="li"><div class="info"><b>Bo\'sh o\'rin</b><small>Oldingi bosqichda ikkala o\'yinchi ham chiqib ketgan</small></div></div>';
          if (!x.b) return `<div class="li"><div class="info"><b>${esc(a.nickname)}</b><small>Avtomatik o'tdi</small></div></div>`;
          return `<div class="li"><div class="info"><b>${esc(a.nickname)}${a.teamId ? ` (${esc(team(a.teamId).name)})` : ''} — ${esc(b.nickname)}${b.teamId ? ` (${esc(team(b.teamId).name)})` : ''}</b>
            <small>${x.agg ? `Hisob: ${x.agg[0]}:${x.agg[1]}` : 'O\'ynalmagan'} · G'olib: ${x.winner ? esc((P[x.winner] || {}).nickname) : x.bothOut ? '<b style="color:var(--danger)">yo\'q — ikkalasi ham chiqib ketdi (o\'ynalmadi)</b>' : '<b style="color:var(--danger)">aniqlanmagan</b>'}${x.forced ? ' (admin)' : ''}</small></div>
            <select data-tie="${x.id}" style="max-width:230px" ${canT(t, 'results') ? '' : 'disabled title="Natijalarni o\'zgartirish huquqi yo\'q"'}><option value="">Avtomatik (hisob bo'yicha)</option><option value="${x.a}" ${x.forced === x.a ? 'selected' : ''}>G'olib: ${esc(a.nickname)}</option><option value="${x.b}" ${x.forced === x.b ? 'selected' : ''}>G'olib: ${esc(b.nickname)}</option></select></div>`;
        }).join('')}</div>` : ''}
      </div>`);
    }
    if (canT(t, 'create_tournament')) blocks.push(`<div class="card"><div class="card-h"><h3>Turnirni yakunlash</h3><button class="btn danger" id="finBtn">Yakunlash</button></div>
      <p class="muted" style="margin:0">${t.type === 'league' ? 'Liga jadvalida 1-o\'rindagi o\'yinchi chempion deb e\'lon qilinadi.' : 'Odatda turnir final natijasidan keyin avtomatik yakunlanadi. Bu tugma turnirni majburan yakunlaydi.'}</p></div>`);
  }

  if (t.status !== 'registration' && d.big) {
    blocks.push(`<div class="card"><div class="card-h"><h3>O'yinlar</h3></div>
      <p class="muted" style="margin-top:0">Katta turnirda o'yinlar turlar bo'yicha, 100 tadan ko'rsatiladi. Qidiruv bilan kerakli o'yinchining o'yinini toping va natijasini o'zgartiring.</p>
      <a class="btn primary" href="#/t/${t.id}?tab=matches">O'yinlar ro'yxatini ochish</a></div>`);
  } else if (t.status !== 'registration') {
    const rounds = t.rounds.filter((r) => d.matches.some((m) => m.round === r.key));
    blocks.push(`<div class="card"><div class="card-h"><h3>O'yinlar</h3><span class="muted" style="font-size:13px">O'yinni bosib natijasini tahrirlashingiz mumkin</span></div>
      ${rounds.map((r) => `<div class="round"><div class="round-h"><h4>${esc(r.name)}</h4>${dlBadge(r.deadline)}</div>${d.matches.filter((m) => m.round === r.key).map((m) => mRow(m, { group: t.type === 'wc' })).join('')}</div>`).join('')}</div>`);
  }

  return `<div class="row mb"><a class="btn sm ghost" href="#/admin">${ic.back} Admin panel</a></div>${blocks.join('')}`;
}, (app, id) => {
  if (!S.admin) return;
  const t = CUR.tournament;
  bindForm($('#ef'), async (f) => {
    const body = { name: f.name, description: f.description };
    if (t.status === 'registration') { body.maxPlayers = +f.maxPlayers || 0; body.settings = collectSettings(f); body.regOpen = !!f.regOpen; }
    await api('PUT', `/api/admin/tournaments/${id}`, body); toast('Saqlandi'); rerender();
  });
  const del = $('#delT');
  if (del) del.onclick = async () => {
    if (!confirmBox(`"${t.name}" turnirini butunlay o'chirasizmi? Barcha o'yinlar va natijalar o'chadi.`)) return;
    try { await api('DELETE', `/api/admin/tournaments/${id}`); toast('Turnir o\'chirildi'); location.hash = '#/admin'; } catch (e) { toast(e.message, true); }
  };
  $$('[data-dq]').forEach((b) => {
    b.onclick = async () => {
      if (!confirmBox(`${b.dataset.name} turnirdan chetlatilsinmi? Uning qolgan barcha o'yinlari 0:3 texnik mag'lubiyat bo'ladi. Bu amalni qaytarib bo'lmaydi.`)) return;
      try { await api('POST', `/api/admin/tournaments/${id}/remove/${b.dataset.dq}`, {}); toast('O\'yinchi chetlatildi'); rerender(); } catch (e) { toast(e.message, true); }
    };
  });
  const stf = $('#stf');
  if (stf) bindForm(stf, async (f) => {
    if (!confirmBox('Turnirni boshlaysizmi? Boshlangandan keyin ishtirokchilar va sozlamalarni o\'zgartirib bo\'lmaydi.')) return;
    await api('POST', `/api/admin/tournaments/${id}/start`, { deadline: fromLocalInput(f.deadline), intervalHours: +f.intervalHours });
    toast('Turnir boshlandi!'); rerender();
  });
  $$('[data-rm]').forEach((b) => { b.onclick = async () => { if (!confirmBox('Ishtirokchini chiqarasizmi?')) return; try { await api('POST', `/api/admin/tournaments/${id}/remove/${b.dataset.rm}`, {}); rerender(); } catch (e) { toast(e.message, true); } }; });
  $$('[data-dlsave]').forEach((b) => {
    b.onclick = async () => {
      const key = b.dataset.dlsave;
      const v = $(`[data-dlinput="${key}"]`).value;
      const ro = $(`[data-reopen="${key}"]`);
      try {
        const r = await api('PUT', `/api/admin/tournaments/${id}/rounds/${key}`, { deadline: fromLocalInput(v), reopenAuto: ro ? ro.checked : false });
        toast(`Dedlayn saqlandi${r.reopened ? ` · ${r.reopened} ta o'yin qayta ochildi` : ''}`); rerender();
      } catch (e) { toast(e.message, true); }
    };
  });
  const nxf = $('#nxf');
  if (nxf) bindForm(nxf, async (f) => {
    await api('POST', `/api/admin/tournaments/${id}/next`, { deadline: f.deadline ? fromLocalInput(f.deadline) : null, intervalHours: +(f.intervalHours || 24) });
    toast('Bajarildi'); rerender();
  });
  bindCardButtons(id);
  bindBigControls(`#/admin/t/${id}`);
  $$('[data-tie]').forEach((sel) => { sel.onchange = async () => { try { await api('POST', `/api/admin/tournaments/${id}/ties/${sel.dataset.tie}`, { winner: sel.value || null }); toast('G\'olib belgilandi'); rerender(); } catch (e) { toast(e.message, true); } }; });
  const fb = $('#finBtn');
  if (fb) fb.onclick = async () => {
    if (!confirmBox('Turnirni yakunlaysizmi?')) return;
    try { await api('POST', `/api/admin/tournaments/${id}/finish`, {}); toast('Turnir yakunlandi'); rerender(); } catch (e) { toast(e.message, true); }
  };
});

/* ------------------------------------------------------------------ boot */
(async function boot() {
  initTheme();
  // katta ekran / zoom-out: sayt kichrayib ketmasligi uchun avtomatik masshtab
  const fit = () => {
    const w = window.innerWidth;
    const z = w > 1440 ? Math.min(2.2, w / 1440) : 1;
    document.documentElement.style.zoom = z === 1 ? '' : String(z);
    document.documentElement.style.setProperty('--z', z);
    $$('.tabs').forEach(moveInk);
  };
  window.addEventListener('resize', fit); fit();
  // mobil menyu
  const mb = $('#menuBtn'), nav = $('#nav');
  mb.onclick = (e) => { e.stopPropagation(); const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); };
  document.addEventListener('click', (e) => { if (!e.target.closest('#nav')) nav.classList.remove('open'); });
  window.addEventListener('hashchange', () => nav.classList.remove('open'));
  try { await loadTeams(); } catch (e) { toast('Server bilan aloqa yo\'q', true); }
  window.addEventListener('hashchange', render);
  const tb = $('#topbar');
  const onScroll = () => tb.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  setInterval(tick, 1000);
  render();
})();
