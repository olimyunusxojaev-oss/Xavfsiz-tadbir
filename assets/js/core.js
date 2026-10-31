/* =========================================================
   «ХАВФСИЗ ТАДБИР» — умумий ядро
   (иконкалар, сақлаш, мавзу, сарлавҳа/футер, тост, модал,
    анимациялар, ҳудудлар, ариза ҳолатлари, демо маълумотлар)
   ========================================================= */
(function (global) {
  'use strict';
  const HX = global.HX = {};

  /* ---------- DOM ёрдамчилари ---------- */
  HX.$ = function (s, r) { return (r || document).querySelector(s); };
  HX.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  HX.esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  HX.ready = function (fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); };
  HX.reducedMotion = function () { return global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };

  /* ---------- Иконкалар (24×24, чизиқли) ---------- */
  const I = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2.2.6 3.5 2.4 3.5 5.5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
    scale: '<path d="M12 3v18M6 21h12M5 7h14"/><path d="M5 7l-3 7a3 3 0 006 0L5 7zM19 7l-3 7a3 3 0 006 0l-3-7z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>',
    shieldCheck: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    doc: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M9 4H5v16h4M14 8l4 4-4 4M18 12H8"/>',
    bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4l2-2z"/><path d="M10 20a2 2 0 004 0"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    polygon: '<path d="M5 7l7-4 8 5-2 11-12 2z"/><circle cx="5" cy="7" r="1.5"/><circle cx="12" cy="3" r="1.5"/><circle cx="20" cy="8" r="1.5"/><circle cx="18" cy="19" r="1.5"/><circle cx="6" cy="21" r="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    phone: '<path d="M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    building: '<path d="M4 21V5l8-2v18M12 8h8v13M3 21h18"/><path d="M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3"/>',
    store: '<path d="M4 9l2-5h12l2 5M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8c-2 0-4-1-4-3s3-2 4 3c1-5 4-5 4-3s-2 3-4 3z"/>',
    camera: '<path d="M3 7l13 4-2 5L3 12z"/><path d="M16 11l4 1M9 14l-1 5H4"/>',
    radio: '<rect x="5" y="8" width="14" height="13" rx="2"/><path d="M9 8l6-5M9 13h6M9 17h2"/>',
    truck: '<path d="M3 16V7h11v9M14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    gate: '<path d="M5 21V4h14v17M9 21V8h6v13M3 21h18"/>',
    paw: '<circle cx="7" cy="10" r="2"/><circle cx="17" cy="10" r="2"/><circle cx="10" cy="5.5" r="2"/><circle cx="14" cy="5.5" r="2"/><path d="M12 12.5c-3 0-6 4-6 6.5 0 1.8 1.8 2.3 3 1.8 1-.4 2-.6 3-.6s2 .2 3 .6c1.2.5 3 0 3-1.8 0-2.5-3-6.5-6-6.5z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    barrier: '<path d="M3 10h18v5H3zM6 15v6M18 15v6M8 10l-3 5M14 10l-3 5M20 10l-3 5"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    handshake: '<path d="M2 11l4-4 5 2 3-2 4 1 4 4"/><path d="M6 7l-4 4 7 7 2-1.5 2 1.5 2-1.5 2 1.5 4-5"/><path d="M11 9l-3 3 2 2 3-2"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 000-7H9a3.5 3.5 0 010-7h7"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
    pen: '<path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.6 14.5L13 18z"/><circle cx="11" cy="11" r="2"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    square: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'
  };
  HX.icons = I;
  HX.icon = function (name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="-2 -2 28 28" overflow="visible" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || I.info) + '</svg>';
  };
  HX.logoSrc = 'assets/img/milliy-gvardiya.png';
  HX.logo = function (cls, size) {
    const style = size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '';
    return '<img class="' + (cls || 'brand-logo') + '" src="' + HX.logoSrc + '" alt="Миллий гвардия эмблемаси"' + style + ' decoding="async">';
  };
  HX.logoSvg = function () { return HX.logo(); };

  /* ---------- Сақлаш (localStorage + хотира заҳираси) ---------- */
  const mem = {};
  HX.store = {
    get: function (k, d) {
      try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (e) {}
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : d;
    },
    set: function (k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    remove: function (k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- Формат ---------- */
  HX.fmt = function (n) { return Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  HX.fmtDec = function (n, d) { return (+n || 0).toFixed(d == null ? 1 : d).replace('.', ','); };
  HX.money = function (n) { return HX.fmt(n) + ' сўм'; };
  HX.mln = function (n) { return HX.fmtDec((+n || 0) / 1e6, 1) + ' млн сўм'; };
  HX.pad = function (n, l) { return String(n).padStart(l || 2, '0'); };
  HX.date = function (d) {
    if (!d) return '—';
    const x = typeof d === 'string' && d.length === 10 ? new Date(d + 'T00:00:00') : new Date(d);
    if (isNaN(x)) return '—';
    return HX.pad(x.getDate()) + '.' + HX.pad(x.getMonth() + 1) + '.' + x.getFullYear();
  };
  HX.dateTime = function (d) { const x = new Date(d); return HX.date(x) + ' ' + HX.pad(x.getHours()) + ':' + HX.pad(x.getMinutes()); };
  HX.isoDate = function (x) { return x.getFullYear() + '-' + HX.pad(x.getMonth() + 1) + '-' + HX.pad(x.getDate()); };
  HX.addDays = function (n, from) { const d = from ? new Date(from) : new Date(); d.setDate(d.getDate() + n); return d; };
  HX.MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  HX.WEEKDAYS = ['Як', 'Ду', 'Се', 'Чо', 'Па', 'Жу', 'Ша'];
  HX.initials = function (s) {
    const words = String(s || '?').replace(/[«»"'“”()]/g, ' ').trim().split(/\s+/).filter(function (w) { return /^[\p{L}]/u.test(w) && !/^(МЧЖ|АЖ|ХК|ЯТТ)$/.test(w); });
    return (words.slice(0, 2).map(function (w) { return w[0]; }).join('') || '?').toUpperCase();
  };

  /* ---------- Мавзу ---------- */
  HX.theme = {
    get: function () {
      return HX.store.get('hx.theme') || (global.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    },
    apply: function (t) { document.documentElement.setAttribute('data-theme', t); },
    toggle: function () {
      const t = HX.theme.get() === 'dark' ? 'light' : 'dark';
      HX.store.set('hx.theme', t); HX.theme.apply(t);
      document.dispatchEvent(new CustomEvent('hx:theme', { detail: t }));
      const b = HX.$('#themeBtn'); if (b) b.innerHTML = HX.icon(t === 'dark' ? 'sun' : 'moon');
    }
  };
  HX.theme.apply(HX.theme.get());
  HX.cssVar = function (name, el) { return getComputedStyle(el || document.documentElement).getPropertyValue(name).trim(); };

  /* ---------- Ҳудудлар (вилоят марказлари) ---------- */
  HX.REGIONS = [
    { id: 'tsh',  name: 'Тошкент шаҳри',               c: [41.3111, 69.2797], staff: 1200 },
    { id: 'tv',   name: 'Тошкент вилояти',             c: [41.0442, 69.3578], staff: 650 },
    { id: 'and',  name: 'Андижон вилояти',             c: [40.7821, 72.3442], staff: 420 },
    { id: 'nam',  name: 'Наманган вилояти',            c: [40.9983, 71.6726], staff: 400 },
    { id: 'far',  name: 'Фарғона вилояти',             c: [40.3842, 71.7843], staff: 450 },
    { id: 'sir',  name: 'Сирдарё вилояти',             c: [40.4897, 68.7842], staff: 220 },
    { id: 'jiz',  name: 'Жиззах вилояти',              c: [40.1158, 67.8422], staff: 260 },
    { id: 'sam',  name: 'Самарқанд вилояти',           c: [39.6542, 66.9597], staff: 560 },
    { id: 'qash', name: 'Қашқадарё вилояти',           c: [38.8606, 65.7891], staff: 430 },
    { id: 'sur',  name: 'Сурхондарё вилояти',          c: [37.2242, 67.2783], staff: 340 },
    { id: 'bux',  name: 'Бухоро вилояти',              c: [39.7747, 64.4286], staff: 400 },
    { id: 'nav',  name: 'Навоий вилояти',              c: [40.0844, 65.3792], staff: 260 },
    { id: 'xor',  name: 'Хоразм вилояти',              c: [41.5500, 60.6333], staff: 330 },
    { id: 'qq',   name: 'Қорақалпоғистон Республикаси', c: [42.4600, 59.6100], staff: 380 }
  ];
  HX.region = function (id) { return HX.REGIONS.find(function (r) { return r.id === id; }) || HX.REGIONS[0]; };

  /* ---------- Ариза ҳолатлари ---------- */
  HX.STATUS = {
    submitted: { label: 'Юборилди',                   color: 'var(--blue)',        icon: 'send',        step: 1 },
    review:    { label: 'Кўриб чиқилмоқда',           color: 'var(--warning)',     icon: 'clock',       step: 2 },
    returned:  { label: 'Қайта ишлашга қайтарилди',   color: 'var(--serious)',     icon: 'undo',        step: 2 },
    approved:  { label: 'Тасдиқланди',                color: 'var(--good-ink)',    icon: 'check',       step: 3 },
    signed:    { label: 'Шартнома имзоланди',         color: 'var(--accent)',      icon: 'pen',         step: 4 },
    paid:      { label: 'Тўлов амалга оширилди',      color: 'var(--accent)',      icon: 'wallet',      step: 5 },
    done:      { label: 'Хизмат якунланди',           color: 'var(--muted)',       icon: 'shieldCheck', step: 6 },
    rejected:  { label: 'Рад этилди',                 color: 'var(--critical-ink)', icon: 'x',          step: -1 }
  };
  HX.FLOW = [
    { code: 'submitted', label: 'Ариза юборилди' },
    { code: 'review', label: 'Миллий гвардия кўриб чиқмоқда' },
    { code: 'approved', label: 'Ҳисоб-китоб тасдиқланди' },
    { code: 'signed', label: 'Шартнома ЭРИ билан имзоланди' },
    { code: 'paid', label: 'Тўлов махсус ҳисобварақга тушди' },
    { code: 'done', label: 'Хизмат кўрсатилди' }
  ];
  HX.statusBadge = function (code) {
    const s = HX.STATUS[code] || HX.STATUS.submitted;
    return '<span class="status" style="color:' + s.color + ';border-color:color-mix(in srgb,' + s.color + ' 40%,transparent);background:color-mix(in srgb,' + s.color + ' 12%,transparent)">' + HX.icon(s.icon) + s.label + '</span>';
  };
  HX.riskBadge = function (id) {
    const r = (global.HXCalc ? HXCalc.RISK_LEVELS : []).find(function (x) { return x.id === id; });
    if (!r) return '';
    return '<span class="status" style="color:' + r.ink + ';border-color:color-mix(in srgb,' + r.color + ' 45%,transparent);background:color-mix(in srgb,' + r.color + ' 13%,transparent)">' + HX.icon(id === 'low' ? 'shieldCheck' : 'alert') + r.label + ' хавф</span>';
  };
  HX.typeLabel = function (id) { const t = global.HXCalc && HXCalc.EVENT_TYPES.find(function (x) { return x.id === id; }); return t ? t.label : id; };

  /* таркибий қисмлар учун қатъий ранг тартиби (тасдиқланган категориал палитра) */
  HX.PART_COLORS = { perimeter: 'var(--s1)', internal: 'var(--s2)', checkpoint: 'var(--s3)', traffic: 'var(--s4)', reserve: 'var(--s5)', k9: 'var(--s6)', command: 'var(--s7)' };

  /* ---------- Фойдаланувчи ---------- */
  HX.user = {
    get: function () { return HX.store.get('hx.user', null); },
    set: function (u) { HX.store.set('hx.user', u); },
    logout: function () { HX.store.remove('hx.user'); }
  };

  /* Админ сессияси мижоз кабинетидан алоҳида. Аризалар эса бир hx.apps омборида. */
  HX.admin = {
    get: function () { return HX.store.get('hx.admin', null); },
    set: function (a) { HX.store.set('hx.admin', a); },
    logout: function () { HX.store.remove('hx.admin'); }
  };
  HX.isAdminPage = function () {
    return document.body && document.body.getAttribute('data-platform') === 'admin';
  };

  /* Ҳар бир ҳудудий бўлинмада камида битта ижрочи. Парол демо учун очиқ. */
  HX.DEMO_PASS = 'mg2026';
  HX.executors = {
    all: function () { return HX.store.get('hx.executors', []); },
    save: function (list) { HX.store.set('hx.executors', list); },
    get: function (id) { return HX.executors.all().find(function (x) { return x.id === id; }); },
    byLogin: function (login) {
      const q = String(login || '').trim().toLowerCase();
      return HX.executors.all().find(function (x) { return String(x.login || '').toLowerCase() === q; });
    },
    upsert: function (row) {
      const list = HX.executors.all();
      const i = list.findIndex(function (x) { return x.id === row.id; });
      if (i >= 0) list[i] = row; else list.push(row);
      HX.executors.save(list);
      return row;
    },
    remove: function (id) {
      HX.executors.save(HX.executors.all().filter(function (x) { return x.id !== id; }));
    }
  };
  HX.clients = {
    all: function () { return HX.store.get('hx.clients', []); },
    save: function (list) { HX.store.set('hx.clients', list); },
    upsert: function (row) {
      const list = HX.clients.all();
      const i = list.findIndex(function (x) { return x.id === row.id; });
      if (i >= 0) list[i] = row; else list.unshift(row);
      HX.clients.save(list);
      return row;
    },
    remove: function (id) {
      HX.clients.save(HX.clients.all().filter(function (x) { return x.id !== id; }));
    }
  };
  HX.ensureDirectory = function () {
    if (HX.executors.all().length) return;
    const names = ['Каримов Алишер', 'Тошматов Жасур', 'Юсупов Дилшод', 'Холматов Бахтиёр', 'Норматов Отабек', 'Қодиров Жаҳонгир', 'Саидов Фаррух', 'Эргашев Мурод', 'Исмоилов Азиз', 'Бердиев Шерзод', 'Маматкулов Улуғбек', 'Атаев Баҳодир', 'Жуманиязов Даврон', 'Рўзиев Аброр'];
    const list = [{
      id: 'ex-markaz', region: 'all', name: 'Раҳимов Сардор', rank: 'подполковник',
      login: 'markaz', password: HX.DEMO_PASS, phone: '+998 71 200-00-01', role: 'admin', active: true
    }];
    HX.REGIONS.forEach(function (r, i) {
      list.push({
        id: 'ex-' + r.id, region: r.id, name: names[i % names.length], rank: i % 2 ? 'капитан' : 'майор',
        login: r.id, password: HX.DEMO_PASS, phone: '+998 71 200-' + HX.pad(10 + i) + '-' + HX.pad(20 + i),
        role: 'executor', active: true
      });
    });
    HX.executors.save(list);
  };

  /* ---------- Аризалар ---------- */
  HX.apps = {
    all: function () { return HX.store.get('hx.apps', []); },
    save: function (list) { HX.store.set('hx.apps', list); document.dispatchEvent(new CustomEvent('hx:apps')); },
    get: function (id) { return HX.apps.all().find(function (a) { return a.id === id; }); },
    upsert: function (app) {
      const list = HX.apps.all();
      const i = list.findIndex(function (a) { return a.id === app.id; });
      app.updatedAt = new Date().toISOString();
      if (i >= 0) list[i] = app; else list.unshift(app);
      HX.apps.save(list);
      return app;
    },
    nextId: function () {
      const n = (HX.store.get('hx.counter', 1040) || 1040) + 1;
      HX.store.set('hx.counter', n);
      return 'XT-' + new Date().getFullYear() + '-' + HX.pad(n, 6);
    },
    setStatus: function (id, status, by, note, extra) {
      const app = HX.apps.get(id); if (!app) return null;
      app.status = status;
      app.history = app.history || [];
      app.history.push({ at: new Date().toISOString(), status: status, by: by || 'Тизим', note: note || '' });
      if (extra) Object.assign(app, extra);
      return HX.apps.upsert(app);
    }
  };

  HX.notifications = function (user) {
    if (!user) return [];
    const seen = HX.store.get('hx.seen', 0);
    const out = [];
    HX.apps.all().filter(function (a) { return a.ownerId === user.id; }).forEach(function (a) {
      (a.history || []).forEach(function (h) {
        if (h.by !== 'Буюртмачи') out.push({ app: a, h: h, unread: new Date(h.at).getTime() > seen });
      });
    });
    return out.sort(function (x, y) { return new Date(y.h.at) - new Date(x.h.at); });
  };

  /* ---------- Геометрия ёрдамчиси (демо учун) ---------- */
  HX.rectLatLngs = function (c, w, h, ang) {
    const a = (ang || 0) * Math.PI / 180, R = 6371008.8, lat0 = c[0] * Math.PI / 180;
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(function (p) {
      const xr = p[0] * Math.cos(a) - p[1] * Math.sin(a), yr = p[0] * Math.sin(a) + p[1] * Math.cos(a);
      return [+(c[0] + (yr / R) * 180 / Math.PI).toFixed(6), +(c[1] + (xr / (R * Math.cos(lat0))) * 180 / Math.PI).toFixed(6)];
    });
  };

  /* ---------- Демо маълумотлар ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  HX.SEED_V = 6;
  HX.seed = function (force) {
    if (!global.HXCalc) return;
    if (!force && HX.store.get('hx.seeded', false) === HX.SEED_V) return;
    const own = HX.store.get('hx.apps', []).filter(function (a) { return a.ownerId && a.ownerId !== 'seed'; });
    HX.store.set('hx.apps', own);
    HX.store.set('hx.seeded', HX.SEED_V);
  };

  /* ---------- Навигация: мижоз ва админ алоҳида ---------- */
  HX.CLIENT_NAV = [
    { id: 'portal', href: 'index.html', label: 'Бош саҳифа', short: 'Бош', icon: 'home' },
    { id: 'xarita', href: 'xarita.html', label: 'Периметр калькулятори', short: 'Харита', icon: 'map' },
    { id: 'kabinet', href: 'kabinet.html', label: 'Шахсий кабинет', short: 'Кабинет', icon: 'user' },
    { id: 'qonun', href: 'qonunchilik.html', label: 'Ҳуқуқий база', short: 'Қонунлар', icon: 'scale' }
  ];
  HX.ADMIN_NAV = [
    { id: 'admin', href: 'admin.html', label: 'Мониторинг', short: 'Мониторинг', icon: 'chart' },
    { id: 'contracts', href: 'admin.html#contracts', label: 'Шартномалар', short: 'Шартнома', icon: 'doc' },
    { id: 'reestr', href: 'admin.html#reestr', label: 'Реестр', short: 'Реестр', icon: 'users' },
    { id: 'portal', href: 'index.html', label: 'Мижоз платформаси', short: 'Мижоз', icon: 'home' }
  ];
  HX.NAV = HX.CLIENT_NAV;

  HX.renderShell = function (active) {
    HX.renderHeader(active);
    HX._renderFooterAndFx();
  };
  HX.renderHeader = function (active) {
    if (active) HX._active = active; else active = HX._active;
    HX.NAV = HX.isAdminPage() ? HX.ADMIN_NAV : HX.CLIENT_NAV;
    const header = HX.$('#app-header');
    const u = HX.user.get();
    const adm = HX.admin.get();
    if (header) {
      const unread = u ? HX.notifications(u).filter(function (n) { return n.unread; }).length : 0;
      header.className = 'site-header';
      header.innerHTML =
        '<div class="flag-band" aria-hidden="true"></div>' +
        '<div class="container bar">' +
        '<a class="brand" href="index.html">' + HX.logo() +
        '<span class="brand-text"><b>ХАВФСИЗ ТАДБИР</b><span>Ўзбекистон Республикаси Миллий гвардияси</span></span></a>' +
        '<span class="proto-badge" title="Платформа прототипи — маълумотлар фақат шу браузерда сақланади">Прототип</span>' +
        '<nav class="nav" id="mainNav">' + HX.NAV.map(function (n) {
          return '<a href="' + n.href + '" title="' + n.label + '" class="' + (n.id === active ? 'active' : '') + '">' + HX.icon(n.icon) + '<span class="lbl">' + n.label + '</span></a>';
        }).join('') + '</nav>' +
        '<div class="header-tools">' +
        (global.HXI18N ? '<select class="lang-sel" id="langSel" data-no-i18n aria-label="Тил / Language">' + HXI18N.LANGS.map(function (l) {
          return '<option value="' + l.id + '"' + (l.id === HXI18N.lang() ? ' selected' : '') + (HXI18N.ready(l.id) ? '' : ' disabled') + '>' + l.short + '</option>';
        }).join('') + '</select>' : '') +
        '<button class="icon-btn" id="themeBtn" title="' + (HX.theme.get() === 'dark' ? 'Кундузги режим' : 'Тунги режим') + '" aria-label="Кундузги / тунги режим">' + HX.icon(HX.theme.get() === 'dark' ? 'sun' : 'moon') + '</button>' +
        (HX.isAdminPage()
          ? (adm ? '<button type="button" class="user-chip" id="admOut" title="Админ платформасидан чиқиш"><span class="av">' + HX.esc(HX.initials(adm.name)) + '</span><span>' + HX.esc(adm.name) + '</span></button>' : '<span class="chip">Тизим</span>')
          : (u ? '<a class="user-chip" href="kabinet.html" title="Шахсий кабинет"><span class="av">' + HX.esc(HX.initials(u.org || u.name)) + '</span><span>' + HX.esc(u.org || u.name) + '</span>' + (unread ? '<span class="badge-num">' + unread + '</span>' : '') + '</a>'
            : '<a class="btn btn-primary btn-sm" href="kabinet.html">' + HX.icon('key') + '<span>Кириш</span></a>')) +
        '<button class="icon-btn burger" id="burgerBtn" aria-label="Меню">' + HX.icon('menu') + '</button>' +
        '</div></div>';
      HX.$('#themeBtn').addEventListener('click', HX.theme.toggle);
      const admOut = HX.$('#admOut');
      if (admOut) admOut.addEventListener('click', function () { HX.admin.logout(); location.href = 'admin.html'; });
      if (HX.$('#langSel')) HX.$('#langSel').addEventListener('change', function () { HXI18N.setLang(this.value); });
      HX.$('#burgerBtn').addEventListener('click', function () { HX.$('#mainNav').classList.toggle('open'); });
      // мобил пастки меню
      let tb = HX.$('#tabbar');
      if (!tb) { tb = document.createElement('nav'); tb.id = 'tabbar'; tb.className = 'tabbar'; tb.setAttribute('aria-label', 'Мобил меню'); document.body.appendChild(tb); }
      tb.innerHTML = HX.NAV.map(function (n) {
        return '<a href="' + n.href + '" class="' + (n.id === active ? 'active' : '') + '">' + HX.icon(n.icon) + '<span>' + n.short + '</span>' + (n.id === 'kabinet' && unread ? '<span class="badge-num">' + unread + '</span>' : '') + '</a>';
      }).join('');
    }
  };
  HX._renderFooterAndFx = function () {
    const footer = HX.$('#app-footer');
    if (footer) {
      footer.className = 'site-footer';
      footer.innerHTML =
        '<div class="container"><div class="cols">' +
        '<div><a class="brand" href="index.html" style="margin-bottom:12px">' + HX.logo() + '<span class="brand-text"><b>ХАВФСИЗ ТАДБИР</b><span>Миллий гвардия тизими учун</span></span></a>' +
        '<p class="small">Хусусий сектор билан шартнома асосида оммавий тадбирларда фуқаролар хавфсизлиги ва жамоат тартибини таъминлаш хизматини ташкил этишнинг ягона интерактив электрон платформаси.</p></div>' +
        '<div><h4>Бўлимлар</h4>' + HX.NAV.map(function (n) { return '<a href="' + n.href + '">' + n.label + '</a>'; }).join('') + '</div>' +
        '<div><h4>Ҳуқуқий асос</h4><a href="qonunchilik.html#doc-zrq647">ЎРҚ-647 (Миллий гвардия тўғрисида)</a><a href="qonunchilik.html#doc-vm205">ВМ қарори № 205</a><a href="qonunchilik.html#doc-pf27">Жамоат хавфсизлиги концепцияси</a><a href="qonunchilik.html#doc-zrq537">Давлат-хусусий шериклик</a></div>' +
        '<div><h4>Ёрдам</h4><a href="qonunchilik.html#metodika">Ҳисоблаш методикаси</a><a href="kabinet.html">Ариза бериш тартиби</a><a href="xarita.html">Периметрни чизиш</a>' + (HX.isAdminPage() ? '<a href="index.html">Мижоз платформаси</a>' : '<a href="admin.html">Тизимга кириш</a>') + '<a href="#" id="resetDemo">Демо маълумотларни тиклаш</a></div>' +
        '</div><div class="legal"><span>© ' + new Date().getFullYear() + ' «Хавфсиз тадбир» — платформа прототипи. Ҳисоб-китоблар тавсиявий хусусиятга эга, якуний қарорни ваколатли орган қабул қилади.</span><span>Маълумотлар фақат шу қурилмадаги браузерда сақланади.</span></div></div>';
      const rd = HX.$('#resetDemo');
      if (rd) rd.addEventListener('click', function (e) {
        e.preventDefault();
        HX.store.remove('hx.apps'); HX.store.remove('hx.seeded'); HX.seed(true);
        HX.toast('Демо маълумотлар тикланди', 'Намунавий аризалар қайта яратилди.', 'ok');
        setTimeout(function () { location.reload(); }, 700);
      });
    }
    // саҳифа ўтиш пардаси
    const c = document.createElement('div'); c.className = 'curtain'; c.innerHTML = HX.logo('c-logo'); document.body.appendChild(c);
    setTimeout(function () { c.remove(); }, 700);
    document.addEventListener('click', function (e) {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const href = a.getAttribute('href');
      if (!href || !/^[\w-]+\.html(#.*)?$/.test(href) || HX.reducedMotion()) return;
      if (href.split('#')[0] === location.pathname.split('/').pop() && href.indexOf('#') > -1) return;
      e.preventDefault();
      const cur = document.createElement('div'); cur.className = 'curtain in'; cur.innerHTML = HX.logo('c-logo') + '<div class="bar-line"></div>';
      document.body.appendChild(cur);
      setTimeout(function () { location.href = href; }, 320);
    });
    global.addEventListener('pageshow', function (e) { if (e.persisted) HX.$$('.curtain.in').forEach(function (x) { x.remove(); }); });
    HX.initFx();
  };

  /* ---------- Тост ---------- */
  HX.toast = function (title, text, type, ms) {
    let box = HX.$('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    const ic = { ok: 'check', info: 'info', warn: 'alert', err: 'x' }[type || 'ok'];
    t.innerHTML = '<div class="ti">' + HX.icon(ic) + '</div><div><b>' + HX.esc(title) + '</b>' + (text ? '<span>' + HX.esc(text) + '</span>' : '') + '</div>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 380); }, ms || 4200);
  };

  /* ---------- Модал ва дравер ---------- */
  HX.modal = function (o) {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="modal ' + (o.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><div class="modal-head"><h3>' + (o.title || '') + '</h3><button class="icon-btn" data-close aria-label="Ёпиш">' + HX.icon('x') + '</button></div><div class="modal-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    const close = function () {
      ov.classList.add('out'); document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { ov.remove(); if (o.onClose) o.onClose(); }, 240);
    };
    const onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-close]')) close(); });
    return { el: ov.querySelector('.modal'), close: close };
  };
  HX.drawer = function (o) {
    const bg = document.createElement('div'); bg.className = 'drawer-overlay';
    const d = document.createElement('aside'); d.className = 'drawer'; d.setAttribute('role', 'dialog');
    d.innerHTML = '<div class="modal-head"><h3>' + (o.title || '') + '</h3><button class="icon-btn" data-close aria-label="Ёпиш">' + HX.icon('x') + '</button></div><div class="drawer-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '');
    document.body.appendChild(bg); document.body.appendChild(d);
    const close = function () {
      d.classList.add('out'); bg.style.animation = 'fadeOut .3s forwards';
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { d.remove(); bg.remove(); if (o.onClose) o.onClose(); }, 330);
    };
    const onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('click', close);
    d.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    return { el: d, close: close };
  };

  /* ---------- Анимациялар ---------- */
  HX.countUp = function (el, to, opt) {
    opt = opt || {};
    const from = opt.from != null ? opt.from : (+el.dataset.cur || 0);
    const dur = HX.reducedMotion() ? 1 : (opt.dur || 1200);
    const dec = opt.dec || 0;
    const t0 = performance.now();
    el.dataset.cur = to;
    const fmt = opt.format || function (v) { return dec ? HX.fmtDec(v, dec) : HX.fmt(v); };
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = (opt.prefix || '') + fmt(from + (to - from) * e) + (opt.suffix || '');
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  };

  HX.initFx = function () {
    // кўринишда пайдо бўлиш
    const io = 'IntersectionObserver' in global ? new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        if (en.target.dataset.count != null) HX.countUp(en.target, +en.target.dataset.count, { dec: +(en.target.dataset.dec || 0), suffix: en.target.dataset.suffix || '' });
        io.unobserve(en.target);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 12% 0px' }) : null;
    HX.observe = function (root) {
      HX.$$('.reveal:not(.in), [data-count]', root).forEach(function (el) {
        if (io) io.observe(el); else { el.classList.add('in'); if (el.dataset.count != null) el.textContent = HX.fmt(el.dataset.count); }
      });
    };
    HX.observe(document);
    setTimeout(function () {
      HX.$$('.reveal:not(.in)').forEach(function (el) {
        el.classList.add('in');
        if (el.dataset.count != null) HX.countUp(el, +el.dataset.count, { dec: +(el.dataset.dec || 0), suffix: el.dataset.suffix || '' });
        if (io) io.unobserve(el);
      });
    }, 900);
    // тугмалардаги тўлқин
    document.addEventListener('pointerdown', function (e) {
      const b = e.target.closest && e.target.closest('.btn');
      if (!b || HX.reducedMotion()) return;
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
      const sp = document.createElement('span'); sp.className = 'ripple';
      sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      b.appendChild(sp); setTimeout(function () { sp.remove(); }, 650);
    });
    // 3D оғиш
    document.addEventListener('pointermove', function (e) {
      const c = e.target.closest && e.target.closest('.tilt');
      if (!c || HX.reducedMotion() || e.pointerType !== 'mouse') return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = 'perspective(900px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateY(-3px)';
    });
    document.addEventListener('pointerout', function (e) {
      const c = e.target.closest && e.target.closest('.tilt');
      if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
    });
    // сузувчи изоҳ (tooltip)
    let tip = null;
    document.addEventListener('pointerover', function (e) {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) return;
      if (!tip) { tip = document.createElement('div'); tip.className = 'hx-tip'; document.body.appendChild(tip); }
      tip.innerHTML = t.getAttribute('data-tip'); tip.classList.add('on');
    });
    document.addEventListener('pointermove', function (e) {
      if (!tip || !tip.classList.contains('on')) return;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let x = e.clientX + 14, y = e.clientY + 14;
      if (x + w > innerWidth - 8) x = e.clientX - w - 14;
      if (y + h > innerHeight - 8) y = e.clientY - h - 14;
      tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    document.addEventListener('pointerout', function (e) {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (t && tip && !t.contains(e.relatedTarget)) tip.classList.remove('on');
    });
  };

  /* ---------- Умумий визуал компонентлар ---------- */
  // Ҳалқа диаграмма (таркибий қисмлар)
  HX.donut = function (el, parts, opt) {
    opt = opt || {};
    const size = opt.size || 220, th = opt.thickness || 26, r = (size - th) / 2, C = 2 * Math.PI * r;
    const items = parts.filter(function (p) { return p.value > 0; });
    const total = items.reduce(function (s, p) { return s + p.value; }, 0) || 1;
    const gap = items.length > 1 ? 2.5 : 0;
    let acc = 0;
    const segs = items.map(function (p, i) {
      const len = Math.max(0, (p.value / total) * C - gap);
      const seg = '<circle class="dn-seg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (HX.PART_COLORS[p.id] || 'var(--s8)') + '" stroke-width="' + th + '" stroke-dasharray="0 ' + C + '" data-len="' + len + '" data-off="' + (-acc) + '" style="--i:' + i + '" data-tip="<b>' + HX.esc(p.label) + '</b><br>' + HX.fmt(p.value) + ' нафар · ' + HX.fmtDec(p.value / total * 100, 1) + '%"/>';
      acc += (p.value / total) * C;
      return seg;
    }).join('');
    el.innerHTML = '<div class="donut" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 ' + size + ' ' + size + '" style="transform:rotate(-90deg)"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="' + th + '"/>' + segs + '</svg>' +
      '<div class="donut-center"><b class="mono" data-dn-total>0</b><span>' + (opt.caption || 'нафар ходим') + '</span></div></div>';
    const circles = HX.$$('.dn-seg', el);
    requestAnimationFrame(function () {
      circles.forEach(function (c, i) {
        setTimeout(function () {
          c.style.transition = 'stroke-dasharray .9s cubic-bezier(.2,.8,.2,1), stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)';
          c.setAttribute('stroke-dasharray', c.dataset.len + ' ' + C);
          c.setAttribute('stroke-dashoffset', c.dataset.off);
        }, HX.reducedMotion() ? 0 : 80 + i * 90);
      });
    });
    HX.countUp(HX.$('[data-dn-total]', el), opt.total != null ? opt.total : total, { from: 0, dur: 1100 });
  };
  HX.legend = function (parts) {
    return '<ul class="legend">' + parts.filter(function (p) { return p.value > 0; }).map(function (p) {
      return '<li><i style="background:' + (HX.PART_COLORS[p.id] || 'var(--s8)') + '"></i><span>' + HX.esc(p.label) + '</span><b class="mono">' + HX.fmt(p.value) + '</b></li>';
    }).join('') + '</ul>';
  };
  // Ходимлар «одамчалар» тўри
  HX.people = function (el, parts, opt) {
    opt = opt || {};
    const max = opt.max || 150;
    const total = parts.reduce(function (s, p) { return s + p.value; }, 0);
    const unit = total > max ? Math.ceil(total / max) : 1;
    let html = '', i = 0;
    const svg = '<svg viewBox="0 0 20 28"><circle cx="10" cy="6" r="5"/><path d="M2 27v-7a8 8 0 0116 0v7z"/></svg>';
    parts.forEach(function (p) {
      if (!p.value) return;
      const n = Math.max(1, Math.round(p.value / unit));
      for (let k = 0; k < n; k++) { html += '<i class="pp" style="--c:' + (HX.PART_COLORS[p.id] || 'var(--s8)') + ';--i:' + i + '" data-tip="' + HX.esc(p.label) + '">' + svg + '</i>'; i++; }
    });
    el.innerHTML = '<div class="people">' + html + '</div><div class="people-cap small muted">Ҳар бир белги — ' + unit + ' нафар ходим</div>';
  };

  /* ---------- Тарқатиш (бошқа вкладкада ўзгариш) ---------- */
  global.addEventListener('storage', function (e) {
    if (e.key === 'hx.apps') document.dispatchEvent(new CustomEvent('hx:apps'));
    if (e.key === 'hx.theme') { HX.theme.apply(HX.theme.get()); document.dispatchEvent(new CustomEvent('hx:theme')); }
  });

  // демо маълумотларни тайёрлаш
  HX.ensureDirectory();
  HX.seed(false);
})(window);

/* Офлайн ва телефонга ўрнатиш (PWA) — фақат http(s) да */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
