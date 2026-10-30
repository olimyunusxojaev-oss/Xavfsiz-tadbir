/* =========================================================
   Шахсий кабинет: кириш, ариза устаси (5 босқич),
   аризалар, шартномалар, хабарномалар, профил
   ========================================================= */
(function () {
  'use strict';
  const $ = HX.$, $$ = HX.$$, esc = HX.esc, ic = HX.icon;
  let user = null, W = null, wzMap = null, depMap = null, detMap = null, curView = null;

  const STEPS = [['Буюртмачи', 'user'], ['Тадбир', 'doc'], ['Периметр ва майдон', 'polygon'], ['Ҳисоб-китоб', 'users'], ['Тасдиқлаш', 'check']];
  const OWNER_TYPES = { yur: 'Юридик шахс', ytt: 'Якка тартибдаги тадбиркор', jis: 'Жисмоний шахс' };

  HX.ready(function () {
    HX.renderShell('kabinet');
    user = HX.user.get();
    if (!user) renderAuth(); else enterApp();
    window.addEventListener('hashchange', route);
    document.addEventListener('hx:apps', function () {
      if (!user) return;
      renderSide();
      if (['home', 'apps', 'contracts', 'notes'].indexOf(curView) > -1) renderView(curView, true);
    });
  });

  /* ================= КИРИШ ================= */
  function fmtPhone(d) { d = (d || '').replace(/\D/g, '').slice(0, 9); return d.replace(/^(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2}).*/, function (m, a, b, c, e) { return [a, b && ' ' + b, c && '-' + c, e && '-' + e].join(''); }); }

  function renderAuth() {
    $('#appView').classList.add('hidden');
    const box = $('#authView'); box.classList.remove('hidden');
    box.innerHTML =
      '<div class="auth-art reveal from-left">' +
      '<div><span class="chip accent">' + ic('lock') + ' Ҳимояланган кириш</span><h2 style="margin-top:14px">Буюртмачи шахсий кабинети</h2><p>Оммавий тадбирингиз хавфсизлигини таъминлаш учун ариза беринг — ходимлар сони, техник воситалар ва хизмат қиймати автоматик ҳисобланади.</p></div>' +
      '<svg class="big" viewBox="0 0 320 320" aria-hidden="true"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--blue)"/></linearGradient></defs>' +
      '<circle cx="160" cy="160" r="140" fill="none" stroke="var(--line-strong)" stroke-dasharray="4 8"/><g class="orbit"><circle cx="160" cy="20" r="8" fill="var(--accent)"/><circle cx="300" cy="160" r="6" fill="var(--blue)"/><circle cx="160" cy="300" r="7" fill="var(--gold)"/><circle cx="61" cy="61" r="5" fill="var(--s5)"/></g>' +
      '<circle cx="160" cy="160" r="100" fill="none" stroke="var(--line-strong)"/><g class="orbit2"><rect x="54" y="154" width="12" height="12" fill="var(--s2)"/><circle cx="260" cy="160" r="6" fill="var(--accent)"/><circle cx="160" cy="60" r="5" fill="var(--s7)"/></g>' +
      '<image href="' + HX.logoSrc + '" x="84" y="84" width="152" height="152" preserveAspectRatio="xMidYMid meet"/></svg>' +
      '<ul><li>' + ic('check') + 'Периметр ва майдон бўйича ходимлар сонини автоматик ҳисоблаш</li><li>' + ic('check') + 'Шартномани ЭРИ билан электрон имзолаш</li><li>' + ic('check') + 'Ариза ҳолати бўйича тезкор хабарномалар</li><li>' + ic('check') + 'ВМ-205 қоидаларига мослик автоматик текширилади</li></ul></div>' +
      '<div class="card auth-card reveal from-right" id="authCard"></div>';
    authStep1();
    HX.observe(box);
  }

  function authStep1() {
    const c = $('#authCard');
    c.innerHTML = '<div class="auth-step"><h2>Тизимга кириш</h2><p>Шахсингизни телефон рақами орқали тасдиқланг.</p>' +
      '<div class="field" style="margin:18px 0 14px"><span class="label">Буюртмачи тури</span><div class="seg" id="ownerType">' +
      Object.keys(OWNER_TYPES).map(function (k, i) { return '<button type="button" data-t="' + k + '" class="' + (i ? '' : 'on') + '">' + OWNER_TYPES[k] + '</button>'; }).join('') + '</div></div>' +
      '<div class="field" style="margin-bottom:16px"><label for="phone">Телефон рақами</label><div class="input-group"><span class="addon addon-l">+998</span><input class="input" id="phone" inputmode="tel" autocomplete="tel-national" placeholder="90 123-45-67" maxlength="12"></div></div>' +
      '<button class="btn btn-primary btn-lg" id="sendCode" style="width:100%">' + ic('send') + 'Тасдиқлаш кодини олиш</button>' +
      '<div class="divider">ёки</div>' +
      '<button class="btn" id="oneId" style="width:100%">' + ic('key') + 'OneID орқали кириш (демо профил)</button>' +
      '<p class="small muted" style="margin-top:16px">' + ic('info', 'sr-none') + ' Прототип режими: SMS юборилмайди — код экранда кўрсатилади. Маълумотлар фақат шу браузерда сақланади.</p></div>';
    let type = 'yur';
    $$('#ownerType button').forEach(function (b) { b.onclick = function () { $$('#ownerType button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); type = b.dataset.t; }; });
    const ph = $('#phone');
    ph.addEventListener('input', function () { ph.value = fmtPhone(ph.value); ph.classList.remove('invalid'); });
    ph.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#sendCode').click(); });
    $('#sendCode').onclick = function () {
      const d = ph.value.replace(/\D/g, '');
      if (d.length !== 9) { ph.classList.add('invalid'); HX.toast('Телефон рақами нотўғри', '9 та рақам киритинг, масалан: 90 123-45-67', 'err'); return; }
      authStep2(d, type);
    };
    $('#oneId').onclick = function () {
      authStep3({ type: 'yur', phone: '901234567', org: '«Намуна Ивент» МЧЖ', name: 'Каримов Азиз Бахтиёрович', position: 'Директор', tin: '305123456', region: 'tsh', address: 'Тошкент ш., Юнусобод тумани, Амир Темур шоҳ кўчаси, 1-уй', email: 'info@example.uz' }, true);
    };
    setTimeout(function () { ph.focus(); }, 300);
  }

  function authStep2(digits, type) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    HX.toast('Демо: тасдиқлаш коди', 'SMS юборилмади. Кодингиз: ' + code.split('').join(' '), 'info', 9000);
    const c = $('#authCard');
    c.innerHTML = '<div class="auth-step"><button class="btn btn-ghost btn-sm" id="back">' + ic('arrowLeft') + 'Орқага</button>' +
      '<h2 style="margin-top:12px">Кодни киритинг</h2><p>+998 ' + fmtPhone(digits) + ' рақамига юборилган 4 хонали код.</p>' +
      '<div class="otp" id="otp">' + [0, 1, 2, 3].map(function () { return '<input class="input" maxlength="4" inputmode="numeric" autocomplete="one-time-code" aria-label="Код рақами">'; }).join('') + '</div>' +
      '<p class="small muted" style="margin-top:14px" id="resend">Қайта юбориш: <b id="tmr">60</b> сония</p>' +
      '<button class="btn btn-primary btn-lg" id="verify" style="width:100%;margin-top:6px">' + ic('check') + 'Тасдиқлаш</button></div>';
    $('#back').onclick = authStep1;
    const ins = $$('#otp input');
    ins.forEach(function (inp, i) {
      inp.addEventListener('input', function () {
        const dg = inp.value.replace(/\D/g, '');
        inp.value = dg.slice(0, 1);
        for (let k = 1; k < dg.length && i + k < 4; k++) ins[i + k].value = dg[k]; // автотўлдириш ёки тез киритиш
        const next = ins.find(function (x) { return !x.value; });
        if (next) { if (dg) next.focus(); } else verify();
      });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !inp.value && i) ins[i - 1].focus(); });
      inp.addEventListener('paste', function (e) { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4); if (t.length === 4) { e.preventDefault(); ins.forEach(function (x, k) { x.value = t[k]; }); verify(); } });
    });
    ins[0].focus();
    let s = 60; const tm = setInterval(function () { s--; const el = $('#tmr'); if (!el) return clearInterval(tm); el.textContent = s; if (s <= 0) { clearInterval(tm); $('#resend').innerHTML = '<a href="#" id="again">Кодни қайта юбориш</a>'; $('#again').onclick = function (e) { e.preventDefault(); authStep2(digits, type); }; } }, 1000);
    function verify() {
      const v = ins.map(function (x) { return x.value; }).join('');
      if (v !== code) { ins.forEach(function (x) { x.classList.add('invalid'); setTimeout(function () { x.classList.remove('invalid'); }, 500); }); HX.toast('Код нотўғри', 'Қайта уриниб кўринг.', 'err'); return; }
      clearInterval(tm);
      const users = HX.store.get('hx.users', {});
      if (users[digits]) { login(users[digits]); return; }
      authStep3({ type: type, phone: digits });
    }
    $('#verify').onclick = verify;
  }

  function profileFields(p) {
    const t = p.type || 'yur';
    const regOpts = HX.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (p.region === r.id ? ' selected' : '') + '>' + r.name + '</option>'; }).join('');
    const f = function (k, label, ph, extra, cls) { return '<div class="field ' + (cls || '') + '"><label for="pf_' + k + '">' + label + '</label><input class="input" id="pf_' + k + '" data-pf="' + k + '" value="' + esc(p[k] || '') + '" placeholder="' + ph + '" ' + (extra || '') + '></div>'; };
    let html = '<div class="grid-2">';
    if (t === 'yur') html += f('org', 'Ташкилот номи *', '«Ташкилот» МЧЖ', '', 'span-2') + f('tin', 'СТИР (9 рақам) *', '300000000', 'inputmode="numeric" maxlength="9"') + f('name', 'Раҳбар Ф.И.Ш. *', 'Фамилия Исм Шарифи') + f('position', 'Лавозими', 'Директор');
    else if (t === 'ytt') html += f('name', 'Ф.И.Ш. *', 'Фамилия Исм Шарифи', '', 'span-2') + f('tin', 'СТИР (9 рақам) *', '400000000', 'inputmode="numeric" maxlength="9"');
    else html += f('name', 'Ф.И.Ш. *', 'Фамилия Исм Шарифи', '', 'span-2') + f('pinfl', 'ЖШШИР (14 рақам) *', '30000000000000', 'inputmode="numeric" maxlength="14"');
    html += '<div class="field"><label for="pf_region">Ҳудуд *</label><select class="input" id="pf_region" data-pf="region">' + regOpts + '</select></div>' +
      f('email', 'Электрон почта', 'name@example.uz', 'type="email"') + f('address', (t === 'yur' ? 'Юридик манзил' : 'Яшаш манзили') + ' *', 'Шаҳар, туман, кўча, уй', '', 'span-2') + '</div>';
    return html;
  }
  function readProfile(box, base) {
    const p = Object.assign({}, base);
    $$('[data-pf]', box).forEach(function (el) { p[el.dataset.pf] = el.value.trim(); });
    const errs = [];
    const need = function (k, ok) { const el = $('[data-pf="' + k + '"]', box); if (el && !ok) { el.classList.add('invalid'); errs.push(k); } };
    if (p.type === 'yur') { need('org', p.org && p.org.length > 2); need('tin', /^\d{9}$/.test(p.tin || '')); need('name', p.name && p.name.length > 4); }
    else if (p.type === 'ytt') { need('name', p.name && p.name.length > 4); need('tin', /^\d{9}$/.test(p.tin || '')); }
    else { need('name', p.name && p.name.length > 4); need('pinfl', /^\d{14}$/.test(p.pinfl || '')); }
    need('address', p.address && p.address.length > 4);
    if (p.email) need('email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email));
    return { p: p, errs: errs };
  }

  function authStep3(p, demo) {
    const c = $('#authCard');
    c.innerHTML = '<div class="auth-step"><h2>Профилни тўлдиринг</h2><p>' + OWNER_TYPES[p.type] + ' · +998 ' + fmtPhone(p.phone) + (demo ? ' <span class="chip gold">демо маълумотлар</span>' : '') + '</p>' +
      '<div id="pfBox" style="margin:16px 0">' + profileFields(p) + '</div>' +
      '<label class="check" id="consentL"><input type="checkbox" id="consent"><span>Шахсга доир маълумотларимни ариза кўриб чиқиш мақсадида қайта ишлашга розиман («Шахсга доир маълумотлар тўғрисида»ги ЎРҚ-547-сон Қонун)</span></label>' +
      '<button class="btn btn-primary btn-lg" id="saveProf" style="width:100%;margin-top:16px">' + ic('arrowRight') + 'Кабинетга кириш</button></div>';
    $('#consent').onchange = function () { $('#consentL').classList.toggle('on', this.checked); };
    $$('#pfBox .input').forEach(function (el) { el.addEventListener('input', function () { el.classList.remove('invalid'); }); });
    $('#saveProf').onclick = function () {
      const r = readProfile($('#pfBox'), p);
      if (r.errs.length) { HX.toast('Майдонларни текширинг', 'Белгиланган майдонлар нотўғри тўлдирилган.', 'err'); return; }
      if (!$('#consent').checked) { $('#consentL').classList.add('invalid'); HX.toast('Розилик талаб этилади', 'Шахсга доир маълумотларни қайта ишлашга розилик беринг.', 'warn'); return; }
      const u = Object.assign(r.p, { id: 'u_' + p.phone, createdAt: new Date().toISOString(), consentAt: new Date().toISOString() });
      const users = HX.store.get('hx.users', {}); users[p.phone] = u; HX.store.set('hx.users', users);
      login(u);
    };
  }

  function login(u) {
    user = u; HX.user.set(u);
    HX.toast('Хуш келибсиз!', (u.org || u.name) + ' — шахсий кабинет очилди.', 'ok');
    enterApp();
  }

  /* ================= КАБИНЕТ ================= */
  function myApps() { return HX.apps.all().filter(function (a) { return a.ownerId === user.id; }); }

  function enterApp() {
    $('#authView').classList.add('hidden');
    $('#appView').classList.remove('hidden');
    HX.renderHeader();
    renderSide();
    const draft = HX.store.get('hx.draft', null);
    if (draft && (!location.hash || location.hash === '#home')) { location.hash = '#new'; HX.toast('Қоралама топилди', 'Олдин киритилган маълумотлар аризага юкланди.', 'info'); }
    else route();
  }

  function renderSide() {
    const unread = HX.notifications(user).filter(function (n) { return n.unread; }).length;
    const mine = myApps();
    $('#cabProf').innerHTML = '<div class="av">' + esc(HX.initials(user.org || user.name)) + '</div><div style="min-width:0"><b>' + esc(user.org || user.name) + '</b><span>' + OWNER_TYPES[user.type] + '</span></div>';
    const items = [['home', 'grid', 'Бош панел'], ['new', 'plus', 'Янги ариза'], ['apps', 'list', 'Аризаларим', mine.length], ['contracts', 'doc', 'Шартномалар'], ['notes', 'bell', 'Хабарномалар', unread, true], ['profile', 'user', 'Профил']];
    $('#cabMenu').innerHTML = items.map(function (m) {
      return '<button data-v="' + m[0] + '" class="' + (curView === m[0] ? 'on' : '') + '">' + ic(m[1]) + m[2] + (m[3] ? '<span class="' + (m[4] ? 'badge-num' : 'chip') + '" style="margin-left:auto">' + m[3] + '</span>' : '') + '</button>';
    }).join('') + '<button data-v="logout">' + ic('logout') + 'Чиқиш</button>';
    $$('#cabMenu button').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.v === 'logout') { HX.user.logout(); user = null; location.hash = ''; HX.renderHeader(); renderAuth(); HX.toast('Тизимдан чиқдингиз', '', 'info'); return; }
        const h = '#' + b.dataset.v;
        if (location.hash === h) route(); else location.hash = h;
      };
    });
    $('#cabTip').innerHTML = '<b style="display:flex;gap:6px;align-items:center;color:var(--gold)">' + ic('calendar') + ' Муддат</b><span class="muted">Шартнома тадбирдан камида <b>10 иш куни</b> олдин тузилади. Энг яқин мумкин бўлган сана: <b style="color:var(--text)">' + HX.date(earliestDate()) + '</b></span>';
  }

  function earliestDate() {
    let d = HX.addDays(1);
    for (let i = 0; i < 60; i++) { const iso = HX.isoDate(d); if (HXCalc.workingDaysUntil(iso) >= 10) return iso; d = HX.addDays(1, d); }
    return HX.isoDate(HX.addDays(15));
  }

  function route() {
    if (!user) return;
    let h = location.hash.slice(1) || 'home';
    if (h.indexOf('app=') === 0) { const id = decodeURIComponent(h.slice(4)); renderView('apps'); openApp(id); return; }
    if (h.indexOf('edit=') === 0) { const a = HX.apps.get(decodeURIComponent(h.slice(5))); if (a && a.ownerId === user.id) { wizardInit(a); renderView('new', false, true); return; } h = 'apps'; }
    renderView(h);
  }

  function destroyMaps() {
    if (wzMap) { wzMap.destroy(); wzMap = null; }
    if (depMap) { depMap.destroy(); depMap = null; }
  }

  function renderView(v, soft, keepWizard) {
    if (v === curView && soft !== true && v !== 'new') return;
    if (v !== 'new' || !keepWizard) destroyMaps();
    curView = v;
    $$('#cabMenu button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === v); });
    const main = $('#cabMain');
    if (v === 'new') { if (!keepWizard) wizardInit(null); renderWizard(); }
    else if (v === 'apps') main.innerHTML = viewApps();
    else if (v === 'contracts') main.innerHTML = viewContracts();
    else if (v === 'notes') { main.innerHTML = viewNotes(); HX.store.set('hx.seen', Date.now()); setTimeout(function () { renderSide(); HX.renderHeader(); }, 800); }
    else if (v === 'profile') main.innerHTML = viewProfile();
    else { curView = 'home'; main.innerHTML = viewHome(); }
    bindView(curView);
    HX.observe(main);
    if (!soft) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Бош панел ---------- */
  function viewHome() {
    const mine = myApps();
    const active = mine.filter(function (a) { return a.status !== 'rejected'; });
    const inproc = mine.filter(function (a) { return ['submitted', 'review', 'returned'].indexOf(a.status) > -1; }).length;
    const appr = mine.filter(function (a) { return ['approved', 'signed', 'paid', 'done'].indexOf(a.status) > -1; });
    const staff = active.reduce(function (s, a) { return s + a.result.total; }, 0);
    const sum = appr.reduce(function (s, a) { return s + a.result.cost; }, 0);
    const k = [['doc', 'var(--s1)', 'Жами аризалар', mine.length, ''], ['clock', 'var(--s4)', 'Жараёнда', inproc, ''], ['users', 'var(--s3)', 'Жалб этиладиган ходимлар', staff, ''], ['wallet', 'var(--s7)', 'Тасдиқланган шартномалар', Math.round(sum / 1e5) / 10, ' млн']];
    const upcoming = mine.filter(function (a) { return a.event.date >= HX.isoDate(new Date()) && a.status !== 'rejected'; }).sort(function (a, b) { return a.event.date < b.event.date ? -1 : 1; }).slice(0, 4);
    const latest = mine.slice().sort(function (a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); })[0];
    return '<div class="view"><div class="view-head"><div><div class="eyebrow">Шахсий кабинет</div><h2>Ассалому алайкум, ' + esc((user.name || user.org || '').split(' ').slice(0, 2).reverse().join(' ') || 'фойдаланувчи') + '!</h2></div><a class="btn btn-primary" href="#new">' + ic('plus') + 'Янги ариза</a></div>' +
      '<div class="grid-4" style="margin-bottom:18px">' + k.map(function (x, i) {
        return '<div class="card kpi tilt reveal" style="--d:' + i * 0.07 + 's"><div class="k-icon" style="background:color-mix(in srgb,' + x[1] + ' 16%,transparent);color:' + x[1] + '">' + ic(x[0]) + '</div><span class="k-label">' + x[2] + '</span><span class="k-val"><span data-count="' + x[3] + '" data-dec="' + (x[4] ? 1 : 0) + '">0</span>' + x[4] + '</span></div>';
      }).join('') + '</div>' +
      '<div class="grid-2">' +
      '<div class="card reveal from-left"><div class="card-head"><h3>Яқинлашаётган тадбирлар</h3><a href="#apps" class="small">Барчаси →</a></div>' +
      (upcoming.length ? upcoming.map(function (a) {
        const d = new Date(a.event.date + 'T00:00:00');
        return '<div class="note-item" style="cursor:pointer" data-open="' + esc(a.id) + '"><div class="ic" style="flex-direction:column;width:48px;height:48px;line-height:1"><b style="font-size:17px">' + d.getDate() + '</b><span class="small muted">' + HX.MONTHS[d.getMonth()].slice(0, 3) + '</span></div><div style="flex:1;min-width:0"><b>' + esc(a.event.name) + '</b><div class="small muted">' + esc(HX.region(a.event.region).name) + ' · ' + HX.fmt(a.result.total) + ' ходим</div></div>' + HX.statusBadge(a.status) + '</div>';
      }).join('') : '<div class="empty">' + ic('calendar') + '<div>Ҳали тадбирлар йўқ</div><a class="btn btn-sm" href="#new" style="margin-top:12px">Биринчи аризани бериш</a></div>') + '</div>' +
      '<div class="card reveal from-right"><div class="card-head"><h3>Охирги ариза ҳолати</h3>' + (latest ? HX.statusBadge(latest.status) : '') + '</div>' +
      (latest ? '<p style="margin-bottom:14px"><b style="color:var(--text)">' + esc(latest.event.name) + '</b><br><span class="small">' + esc(latest.id) + '</span></p>' + flowTimeline(latest) : '<div class="empty">' + ic('doc') + '<div>Аризалар мавжуд эмас</div></div>') + '</div>' +
      '</div></div>';
  }

  function flowTimeline(a) {
    const st = HX.STATUS[a.status] ? HX.STATUS[a.status].step : 1;
    const hist = a.history || [];
    const neg = a.status === 'rejected' || a.status === 'returned';
    return '<ul class="tl">' + HX.FLOW.map(function (f, i) {
      const h = hist.slice().reverse().find(function (x) { return x.status === f.code; });
      const done = !neg ? st >= i + 1 : i < 1 || (i === 1 && h);
      const now = !neg && st === i && a.status !== 'done';
      return '<li class="' + (done ? 'done' : '') + (now ? ' now' : '') + '" style="animation-delay:' + i * 0.08 + 's"><span class="tl-dot">' + (done ? ic('check') : '') + '</span><b>' + f.label + '</b><span>' + (h ? HX.dateTime(h.at) + (h.note ? ' — ' + esc(h.note) : '') : 'Кутилмоқда') + '</span></li>';
    }).join('') +
      (neg ? '<li class="now"><span class="tl-dot" style="border-color:' + HX.STATUS[a.status].color + '"></span><b style="color:' + HX.STATUS[a.status].color + '">' + HX.STATUS[a.status].label + '</b><span>' + esc((hist.slice().reverse().find(function (x) { return x.status === a.status; }) || {}).note || '') + '</span></li>' : '') + '</ul>';
  }

  /* ---------- Аризалар рўйхати ---------- */
  let appFilter = 'all', appQuery = '';
  function viewApps() {
    return '<div class="view"><div class="view-head"><div><div class="eyebrow">Аризалар</div><h2>Менинг аризаларим</h2></div><a class="btn btn-primary" href="#new">' + ic('plus') + 'Янги ариза</a></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px"><div class="seg" id="appSeg">' +
      [['all', 'Барчаси'], ['proc', 'Жараёнда'], ['ok', 'Тасдиқланган'], ['bad', 'Қайтарилган / рад']].map(function (f) { return '<button data-f="' + f[0] + '" class="' + (appFilter === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') +
      '</div><div class="input-group" style="flex:1;min-width:200px"><span class="addon addon-l">' + ic('search') + '</span><input class="input" id="appQ" placeholder="Номи ёки рақами бўйича қидириш" value="' + esc(appQuery) + '"></div></div>' +
      '<div class="app-cards" id="appCards">' + appCards() + '</div></div>';
  }
  function appCards() {
    const map = { proc: ['submitted', 'review'], ok: ['approved', 'signed', 'paid', 'done'], bad: ['returned', 'rejected'] };
    const list = myApps().filter(function (a) { return appFilter === 'all' || map[appFilter].indexOf(a.status) > -1; })
      .filter(function (a) { const q = appQuery.toLowerCase(); return !q || a.event.name.toLowerCase().indexOf(q) > -1 || a.id.toLowerCase().indexOf(q) > -1; })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    if (!list.length) return '<div class="card empty" style="grid-column:1/-1">' + ic('doc') + '<div>Аризалар топилмади</div><a class="btn btn-sm btn-primary" href="#new" style="margin-top:12px">Ариза бериш</a></div>';
    return list.map(function (a, i) {
      const st = HX.STATUS[a.status].step;
      return '<div class="card app-card tilt reveal" style="--d:' + Math.min(i, 8) * 0.05 + 's" data-open="' + esc(a.id) + '">' +
        '<div class="top"><div><h4>' + esc(a.event.name) + '</h4><span class="small muted mono">' + esc(a.id) + '</span></div>' + HX.statusBadge(a.status) + '</div>' +
        '<div class="mini-flow">' + [1, 2, 3, 4, 5, 6].map(function (k) { return '<i class="' + (st >= k ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="meta"><span>' + ic('calendar') + HX.date(a.event.date) + '</span><span>' + ic('pin') + esc(HX.region(a.event.region).name) + '</span><span>' + ic('ruler') + HX.fmt(a.geometry.perimeter) + ' м</span><span>' + ic('polygon') + HX.fmt(a.geometry.area) + ' м²</span></div>' +
        '<div class="foot"><div><b>' + HX.fmt(a.result.total) + '</b> <span class="small muted">ходим</span></div><span class="small" style="color:var(--text-2)">' + HX.mln(a.result.cost) + '</span></div></div>';
    }).join('');
  }

  /* ---------- Шартномалар ---------- */
  function viewContracts() {
    const list = myApps().filter(function (a) { return ['approved', 'signed', 'paid', 'done'].indexOf(a.status) > -1; });
    return '<div class="view"><div class="view-head"><div><div class="eyebrow">Ҳужжатлар</div><h2>Шартномалар</h2></div></div>' +
      (list.length ? '<div class="table-wrap reveal"><table class="tbl"><thead><tr><th>Шартнома</th><th>Тадбир</th><th>Сана</th><th class="num">Ходим</th><th class="num">Қиймат</th><th>Ҳолат</th><th></th></tr></thead><tbody>' +
        list.map(function (a) {
          return '<tr><td><b class="mono">' + esc(a.contractNo || 'Л-' + a.id) + '</b></td><td>' + esc(a.event.name) + '</td><td>' + HX.date(a.event.date) + '</td><td class="num">' + HX.fmt(a.result.total) + '</td><td class="num">' + HX.money(a.result.cost) + '</td><td>' + HX.statusBadge(a.status) + '</td><td style="white-space:nowrap"><button class="btn btn-sm" data-contract="' + esc(a.id) + '">' + ic('eye') + 'Кўриш</button> <button class="btn btn-sm btn-ghost" data-print="' + esc(a.id) + '" title="Чоп этиш">' + ic('print') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="card empty">' + ic('doc') + '<div>Тасдиқланган шартномалар ҳали йўқ.<br>Ариза Миллий гвардия томонидан тасдиқлангач, шартнома лойиҳаси шу ерда пайдо бўлади.</div></div>') + '</div>';
  }

  /* ---------- Хабарномалар ---------- */
  function viewNotes() {
    const list = HX.notifications(user);
    return '<div class="view"><div class="view-head"><div><div class="eyebrow">Хабарномалар</div><h2>Ариза ҳолати ўзгаришлари</h2></div></div>' +
      '<div class="card" style="padding:6px">' + (list.length ? list.map(function (n, i) {
        const s = HX.STATUS[n.h.status] || HX.STATUS.submitted;
        return '<div class="note-item ' + (n.unread ? 'unread' : '') + '" style="animation-delay:' + i * 0.04 + 's;cursor:pointer" data-open="' + esc(n.app.id) + '"><div class="ic" style="color:' + s.color + '">' + ic(s.icon) + '</div><div style="flex:1;min-width:0"><b>' + s.label + '</b> — ' + esc(n.app.event.name) + '<div class="small muted">' + HX.dateTime(n.h.at) + ' · ' + esc(n.h.by) + (n.h.note ? ' · ' + esc(n.h.note) : '') + '</div></div>' + (n.unread ? '<span class="live-dot"></span>' : '') + '</div>';
      }).join('') : '<div class="empty">' + ic('bell') + '<div>Хабарномалар йўқ</div></div>') + '</div></div>';
  }

  /* ---------- Профил ---------- */
  function viewProfile() {
    return '<div class="view"><div class="view-head"><div><div class="eyebrow">Профил</div><h2>Буюртмачи маълумотлари</h2></div><span class="chip">' + OWNER_TYPES[user.type] + ' · +998 ' + fmtPhone(user.phone) + '</span></div>' +
      '<div class="card reveal"><div id="pfBox">' + profileFields(user) + '</div><div class="wz-nav"><button class="btn btn-danger" id="delMe">' + ic('trash') + 'Профил ва аризаларни ўчириш</button><button class="btn btn-primary" id="saveMe">' + ic('check') + 'Сақлаш</button></div></div></div>';
  }

  /* ---------- Бириктириш ---------- */
  function bindView(v) {
    const main = $('#cabMain');
    $$('[data-open]', main).forEach(function (el) { el.addEventListener('click', function () { openApp(el.dataset.open); }); });
    if (v === 'apps') {
      $$('#appSeg button').forEach(function (b) { b.onclick = function () { appFilter = b.dataset.f; $$('#appSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); $('#appCards').innerHTML = appCards(); bindView('cards'); HX.observe($('#appCards')); }; });
      $('#appQ').oninput = function () { appQuery = this.value; $('#appCards').innerHTML = appCards(); bindView('cards'); HX.observe($('#appCards')); };
    }
    if (v === 'cards') $$('#appCards [data-open]').forEach(function (el) { el.onclick = function () { openApp(el.dataset.open); }; });
    $$('[data-contract]', main).forEach(function (b) { b.onclick = function () { showContract(HX.apps.get(b.dataset.contract)); }; });
    $$('[data-print]', main).forEach(function (b) { b.onclick = function () { HX.printContract(HX.apps.get(b.dataset.print)); }; });
    if (v === 'profile') {
      $$('#pfBox .input').forEach(function (el) { el.addEventListener('input', function () { el.classList.remove('invalid'); }); });
      $('#saveMe').onclick = function () {
        const r = readProfile($('#pfBox'), user);
        if (r.errs.length) { HX.toast('Майдонларни текширинг', '', 'err'); return; }
        user = r.p; HX.user.set(user);
        const users = HX.store.get('hx.users', {}); users[user.phone] = user; HX.store.set('hx.users', users);
        renderSide(); HX.renderHeader(); HX.toast('Профил сақланди', '', 'ok');
      };
      $('#delMe').onclick = function () {
        const m = HX.modal({ title: 'Маълумотларни ўчириш', body: '<p>Профилингиз ва унга тегишли барча аризалар шу браузердан ўчирилади. Давом этасизми?</p>', foot: '<button class="btn" data-close>Бекор қилиш</button><button class="btn btn-danger" id="cDel">' + ic('trash') + 'Ўчириш</button>' });
        $('#cDel', m.el).onclick = function () {
          HX.apps.save(HX.apps.all().filter(function (a) { return a.ownerId !== user.id; }));
          const users = HX.store.get('hx.users', {}); delete users[user.phone]; HX.store.set('hx.users', users);
          HX.user.logout(); HX.store.remove('hx.draft'); user = null; m.close(); location.hash = ''; HX.renderHeader(); renderAuth();
          HX.toast('Маълумотлар ўчирилди', '', 'info');
        };
      };
    }
  }

  /* ================= АРИЗА ТАФСИЛОТЛАРИ ================= */
  function openApp(id) {
    const a = HX.apps.get(id);
    if (!a || a.ownerId !== user.id) { HX.toast('Ариза топилмади', '', 'err'); return; }
    const e = a.event, r = a.result;
    const lastNote = (a.history || []).slice().reverse().find(function (h) { return h.by === 'Оператор' && h.note; });
    const actions = [];
    if (a.status === 'returned') actions.push('<button class="btn btn-primary" id="dEdit">' + ic('edit') + 'Таҳрирлаш ва қайта юбориш</button>');
    if (a.status === 'approved') actions.push('<button class="btn btn-primary" id="dSign">' + ic('pen') + 'Шартномани ЭРИ билан имзолаш</button>');
    if (a.status === 'signed') actions.push('<button class="btn btn-primary" id="dPay">' + ic('wallet') + 'Тўловни амалга ошириш (демо)</button>');
    if (['approved', 'signed', 'paid', 'done'].indexOf(a.status) > -1) actions.push('<button class="btn" id="dDoc">' + ic('doc') + 'Шартнома</button>');
    if (a.payment) actions.push('<button class="btn" id="dRcpt">' + ic('wallet') + 'Тўлов чеки</button>');
    if (a.status === 'submitted') actions.push('<button class="btn btn-danger" id="dWithdraw">' + ic('undo') + 'Қайтариб олиш</button>');
    actions.push('<button class="btn btn-ghost" id="dCopy">' + ic('refresh') + 'Нусха асосида янги ариза</button>');
    const m = HX.modal({
      wide: true,
      title: esc(e.name),
      body: '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px"><span class="chip mono">' + esc(a.id) + '</span>' + HX.statusBadge(a.status) + HX.riskBadge(r.risk) + '<span class="chip">' + esc(HX.typeLabel(e.type)) + '</span></div>' +
        (lastNote && (a.status === 'returned' || a.status === 'rejected') ? '<div class="warn-item serious" style="margin-bottom:16px">' + ic('alert') + '<span><b>Оператор изоҳи:</b> ' + esc(lastNote.note) + '</span></div>' : '') +
        '<div class="grid-2" style="align-items:start"><div>' +
        '<div class="card" style="margin-bottom:14px"><h4>Тадбир</h4><dl class="kv">' +
        '<dt>Сана ва вақт</dt><dd>' + HX.date(e.date) + ', ' + esc(e.startTime) + ' · ' + e.duration + ' соат</dd>' +
        '<dt>Ҳудуд</dt><dd>' + esc(HX.region(e.region).name) + '</dd><dt>Манзил</dt><dd>' + esc(e.address || '—') + '</dd>' +
        '<dt>Тоифа</dt><dd>' + esc((HXCalc.CATEGORIES[e.category] || {}).label || '') + '</dd>' +
        '<dt>' + ((a.geometry && a.geometry.kind === 'route') ? 'Йўналиш' : 'Периметр / майдон') + '</dt><dd>' + ((a.geometry && a.geometry.kind === 'route') ? (HX.fmt(a.geometry.perimeter) + ' м · ички патрул йўқ') : (HX.fmt(a.geometry.perimeter) + ' м / ' + HX.fmt(a.geometry.area) + ' м²')) + '</dd>' +
        '<dt>Иштирокчилар</dt><dd>' + (e.crowd === 'open' ? 'чекланмаган · тахминий ' : 'чекланган · ') + HX.fmt(r.attendees) + (a.geometry && a.geometry.kind === 'route' ? '' : ' (сиғим ' + HX.fmt(r.capacity) + ')') + '</dd>' +
        '<dt>Масъул бўлинма</dt><dd>' + (a.assigned ? esc(a.assigned.unit) + '<br><span class="small muted">' + esc(a.assigned.commander) + '</span>' : '—') + '</dd></dl></div>' +
        '<div class="card"><h4>Ҳисоб-китоб</h4><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div id="dDonut"></div><div style="flex:1;min-width:180px">' + HX.legend(r.parts) + '</div></div>' +
        '<dl class="kv" style="margin-top:12px"><dt>Киши-соат</dt><dd>' + HX.fmt(r.personHours) + '</dd><dt>Навбатлар</dt><dd>' + r.shifts + '</dd><dt>Қиймат</dt><dd>' + HX.money(r.cost) + '</dd></dl></div>' +
        '</div><div>' +
        '<div class="card" style="margin-bottom:14px;padding:0;overflow:hidden"><div id="detMap" style="height:280px"></div></div>' +
        '<div class="card"><h4>Ҳолатлар тарихи</h4>' + flowTimeline(a) + '</div></div></div>',
      foot: actions.join(''),
      onClose: function () { if (detMap) { detMap.destroy(); detMap = null; } if (location.hash.indexOf('#app=') === 0) history.replaceState(null, '', '#apps'); }
    });
    HX.donut($('#dDonut', m.el), r.parts, { size: 160, thickness: 20, total: r.total });
    setTimeout(function () {
      const routeApp = a.geometry.kind === 'route';
      if (!a.geometry.latlngs || a.geometry.latlngs.length < (routeApp ? 2 : 3)) return;
      detMap = new PerimeterMap($('#detMap', m.el), { editable: false, scrollZoom: false, kind: routeApp ? 'route' : 'area' });
      if (routeApp) detMap.setRoute(a.geometry.latlngs, { silent: true, instant: true, posts: a.geometry.posts || [], hq: a.geometry.hq });
      else detMap.setPolygon(a.geometry.latlngs, { silent: true, instant: true, hq: a.geometry.hq });
      const full = HXCalc.compute(Object.assign({}, e, { mode: e.mode, perimeter: a.geometry.perimeter, area: routeApp ? 0 : a.geometry.area, shape: routeApp ? 'route' : 'area', date: null, term: e.term }));
      setTimeout(function () { if (detMap) detMap.deploy(full, { animate: true, gates: a.geometry.gates, posts: a.geometry.posts, hq: a.geometry.hq }); }, 400);
    }, 120);
    const on = function (sel, fn) { const b = $(sel, m.el); if (b) b.onclick = fn; };
    on('#dEdit', function () { m.close(); location.hash = '#edit=' + encodeURIComponent(a.id); });
    on('#dSign', function () { m.close(); signFlow(a); });
    on('#dPay', function () { m.close(); payFlow(a); });
    on('#dDoc', function () { showContract(a); });
    on('#dRcpt', function () { HX.receipt(a); });
    on('#dWithdraw', function () {
      HX.apps.save(HX.apps.all().filter(function (x) { return x.id !== a.id; }));
      m.close(); HX.toast('Ариза қайтариб олинди', a.id, 'info');
    });
    on('#dCopy', function () {
      m.close();
      HX.store.set('hx.draft', { event: Object.assign({}, e, { date: earliestDate(), name: e.name + ' (нусха)' }), geometry: Object.assign({}, a.geometry) });
      location.hash = '#new';
      if (curView === 'new') renderView('new', true);
    });
  }

  function showContract(a) {
    const m = HX.modal({ wide: true, title: 'Шартнома ' + esc(a.contractNo || 'лойиҳаси'), body: '<style>' + HX.contractCSS + '</style><div class="doc-frame">' + HX.contractHTML(a) + '</div>', foot: '<button class="btn" data-close>Ёпиш</button><button class="btn btn-primary" id="cPrint">' + ic('print') + 'Чоп этиш / PDF</button>' });
    $('#cPrint', m.el).onclick = function () { HX.printContract(a); };
  }

  function signFlow(a) {
    const key = 'DEMO · ' + (user.org || user.name) + ' · СТИР ' + (user.tin || user.pinfl || '—');
    const m = HX.modal({
      title: 'Шартномани электрон рақамли имзо (ЭРИ) билан имзолаш',
      body: '<style>' + HX.contractCSS + '</style><p>Шартнома лойиҳаси билан танишиб чиқинг ва ЭРИ калитини танланг.</p><div class="doc-frame" style="max-height:300px;overflow:auto;margin-bottom:14px">' + HX.contractHTML(a) + '</div>' +
        '<div class="eri-key on">' + ic('key') + '<div><b>' + esc(key) + '</b><div class="small muted">Демо калит · амал қилиш муддати: ' + HX.date(HX.addDays(365)) + '</div></div></div><div id="signSt"></div>',
      foot: '<button class="btn" data-close>Бекор қилиш</button><button class="btn btn-primary" id="doSign">' + ic('pen') + 'Имзолаш</button>'
    });
    $('#doSign', m.el).onclick = function () {
      this.disabled = true;
      $('#signSt', m.el).innerHTML = '<div class="spinner"></div><p class="small muted" style="text-align:center">Имзо шакллантирилмоқда…</p>';
      setTimeout(function () {
        const no = 'МГ-' + new Date().getFullYear() + '/' + HX.pad(Math.floor(Math.random() * 99999), 5);
        HX.apps.setStatus(a.id, 'signed', 'Буюртмачи', 'Шартнома ЭРИ билан имзоланди', { contractNo: no, signedAt: new Date().toISOString() });
        m.close(); HX.toast('Шартнома имзоланди', 'Шартнома № ' + no, 'ok'); confetti();
      }, 1400);
    };
  }

  // Тўлов: Click / Payme / Visa (демо) — payments.js
  function payFlow(a) {
    HX.payModal(a, function (payment) {
      const meth = HX.payMethod(payment.method);
      HX.apps.setStatus(a.id, 'paid', 'Буюртмачи', 'Тўлов ' + meth.name + ' орқали амалга оширилди', { payment: payment });
      HX.toast('Тўлов қабул қилинди', HX.money(payment.amount) + ' · ' + meth.name, 'ok');
      confetti();
    });
  }

  function confetti() {
    if (HX.reducedMotion()) return;
    const cols = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--gold)'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i'); c.className = 'confetti';
      c.style.cssText = 'left:' + Math.random() * 100 + 'vw;background:' + cols[i % cols.length] + ';animation-duration:' + (1.8 + Math.random() * 1.8) + 's;animation-delay:' + Math.random() * 0.4 + 's;border-radius:' + (Math.random() > 0.5 ? '50%' : '2px');
      document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4200);
    }
  }

  /* ================= АРИЗА УСТАСИ ================= */
  function wizardInit(editApp) {
    const reg = user.region || 'tsh';
    const base = {
      id: null, step: 1,
      owner: { type: user.type, org: user.org || user.name, name: user.name, tin: user.tin || user.pinfl || '', phone: '+998 ' + fmtPhone(user.phone), email: user.email || '', position: user.position || '' },
      event: { name: '', type: 'concert', mode: 'perimeter', date: earliestDate(), startTime: '18:00', duration: 4, region: reg, address: '', category: '1', venue: 'open', entrances: 3, attendees: '', crowd: 'limited', factors: [], notes: '', term: { kind: 'event', from: '', to: '' } },
      geometry: { mode: 'map', perimeter: 0, area: 0, latlngs: [], gates: [], posts: [], center: null, dims: { a: 200, b: 120, r: 90, p: 700, s: 24000 } }
    };
    if (editApp) {
      W = JSON.parse(JSON.stringify(base));
      W.id = editApp.id;
      Object.assign(W.owner, editApp.owner);
      Object.assign(W.event, editApp.event);
      Object.assign(W.geometry, editApp.geometry, { dims: Object.assign({}, base.geometry.dims, editApp.geometry.dims || {}) });
      lockMapGeometry();
      ensureEvent();
      return;
    }
    const d = HX.store.get('hx.draft', null);
    W = base;
    if (d) {
      if (d.id) W.id = d.id;
      if (d.step) W.step = d.step;
      if (d.owner) Object.assign(W.owner, d.owner);
      if (d.event) Object.assign(W.event, d.event);
      if (d.geometry) {
        Object.assign(W.geometry, d.geometry, { dims: Object.assign({}, base.geometry.dims, d.geometry.dims || {}) });
      }
    }
    lockMapGeometry();
    ensureEvent();
  }
  function ensureEvent() {
    if (!W.event.term || W.event.term.kind !== 'period') W.event.term = { kind: 'event', from: '', to: '' };
    else W.event.term = { kind: 'period', from: W.event.term.from || '', to: W.event.term.to || '' };
    W.event.mode = HXCalc.workMode(typeMeta(), W.event);
  }
  function typeMeta(id) {
    return HXCalc.EVENT_TYPES.find(function (t) { return t.id === (id || (W.event && W.event.type)); }) || HXCalc.EVENT_TYPES[0];
  }
  function isRoute() { return !!(W && W.event && HXCalc.workMode(typeMeta(), W.event) === 'route'); }
  function isInternal() { return !!(W && W.event && HXCalc.workMode(typeMeta(), W.event) === 'area'); }
  function lockMapGeometry() {
    W.geometry.mode = 'map';
    W.geometry.kind = isRoute() ? 'route' : 'area';
    const min = isRoute() ? 2 : 3;
    if (!(W.geometry.latlngs && W.geometry.latlngs.length >= min)) {
      W.geometry.latlngs = [];
      W.geometry.gates = [];
      W.geometry.posts = [];
      W.geometry.perimeter = 0;
      W.geometry.area = 0;
    }
    if (isRoute()) W.geometry.area = 0;
  }
  function saveDraft() { HX.store.set('hx.draft', W); }
  function mapGates() { return !isRoute() && W.geometry.mode === 'map' && W.geometry.gates && W.geometry.gates.length ? W.geometry.gates : null; }
  function mapPosts() { return W.geometry.mode === 'map' && W.geometry.posts && W.geometry.posts.length ? W.geometry.posts : null; }
  function calcInput() {
    const g = mapGates();
    const route = isRoute();
    return Object.assign({}, W.event, {
      mode: HXCalc.workMode(typeMeta(), W.event),
      perimeter: W.geometry.perimeter,
      area: route ? 0 : W.geometry.area,
      shape: route ? 'route' : 'area',
      entrances: route ? (+W.event.entrances || 0) : (g ? g.length : W.event.entrances),
      term: W.event.term
    });
  }
  function clearShape() {
    W.geometry.latlngs = [];
    W.geometry.gates = [];
    W.geometry.posts = [];
    W.geometry.hq = null;
    W.geometry.perimeter = 0;
    W.geometry.area = 0;
    W.geometry.center = null;
    W.geometry.kind = isRoute() ? 'route' : 'area';
  }
  function geoRecord(ll) {
    const route = isRoute();
    return {
      mode: W.geometry.mode,
      kind: route ? 'route' : 'area',
      perimeter: W.geometry.perimeter,
      area: route ? 0 : W.geometry.area,
      latlngs: ll,
      gates: route ? [] : (mapGates() || []),
      posts: mapPosts() || [],
      center: route ? (HXGeo.midpoint(ll) || null) : HXGeo.centroid(ll),
      dims: W.geometry.dims
    };
  }

  function renderWizard() {
    const main = $('#cabMain');
    main.innerHTML = '<div class="view"><div class="view-head"><div><div class="eyebrow">' + (W.id ? 'Аризани таҳрирлаш · ' + esc(W.id) : 'Янги ариза') + '</div><h2>Тадбир хавфсизлигини таъминлаш хизматига ариза</h2></div>' +
      '<button class="btn btn-ghost btn-sm" id="wzReset">' + ic('trash') + 'Қораламани тозалаш</button></div>' +
      '<div class="card" style="padding:18px 12px 14px;margin-bottom:16px"><div class="stepper" id="stepper">' + STEPS.map(function (s, i) {
        return '<div class="s" data-s="' + (i + 1) + '"><div class="c">' + (i + 1) + '</div><div class="t">' + s[0] + '</div></div>';
      }).join('') + '</div></div><div id="wzPanel"></div></div>';
    $('#wzReset').onclick = function () { HX.store.remove('hx.draft'); destroyMaps(); wizardInit(null); renderWizard(); HX.toast('Қоралама тозаланди', '', 'info'); };
    $$('#stepper .s').forEach(function (s) { s.onclick = function () { const n = +s.dataset.s; if (n < W.step) showStep(n, -1); }; });
    showStep(W.step || 1, 1);
  }

  function updateStepper() {
    $$('#stepper .s').forEach(function (s) {
      const n = +s.dataset.s;
      s.classList.toggle('on', n === W.step); s.classList.toggle('done', n < W.step);
      const iconName = n === 3 && isRoute() ? 'route' : STEPS[n - 1][1];
      $('.c', s).innerHTML = n < W.step ? ic('check') : (n === W.step ? ic(iconName) : n);
      const lab = $('.t', s);
      if (lab) lab.textContent = n === 3 && isRoute() ? 'Хизмат йўналиши' : STEPS[n - 1][0];
    });
  }

  function showStep(n, dir) {
    if (wzMap) { wzMap.destroy(); wzMap = null; }
    if (depMap) { depMap.destroy(); depMap = null; }
    W.step = n; saveDraft(); updateStepper();
    const p = $('#wzPanel');
    p.className = 'wz-panel' + (dir < 0 ? ' back' : '');
    void p.offsetWidth;
    p.innerHTML = [null, step1, step2, step3, step4, step5][n]();
    const nav = document.createElement('div'); nav.className = 'wz-nav';
    nav.innerHTML = (n > 1 ? '<button class="btn" id="wzPrev">' + ic('arrowLeft') + 'Орқага</button>' : '<span></span>') +
      (n < 5 ? '<button class="btn btn-primary" id="wzNext">Кейинги қадам' + ic('arrowRight') + '</button>' : '<button class="btn btn-primary btn-lg" id="wzSubmit">' + ic('send') + (W.id ? 'Қайта юбориш' : 'Аризани юбориш') + '</button>');
    p.appendChild(nav);
    if ($('#wzPrev')) $('#wzPrev').onclick = function () { showStep(n - 1, -1); };
    if ($('#wzNext')) $('#wzNext').onclick = function () { if (validate(n)) showStep(n + 1, 1); };
    if ($('#wzSubmit')) $('#wzSubmit').onclick = submit;
    bindInputs(p);
    [null, null, bind2, bind3, bind4, null][n] && [null, null, bind2, bind3, bind4, null][n]();
    HX.observe(p);
    const top = $('#stepper').getBoundingClientRect().top + scrollY - 90;
    if (scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function getPath(path) { return path.split('.').reduce(function (o, k) { return o && o[k]; }, W); }
  function setPath(path, v) { const ks = path.split('.'); const last = ks.pop(); ks.reduce(function (o, k) { return o[k]; }, W)[last] = v; }
  function bindInputs(root) {
    $$('[data-k]', root).forEach(function (el) {
      const ev = el.tagName === 'SELECT' || el.type === 'date' || el.type === 'time' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        el.classList.remove('invalid');
        let v = el.value;
        if (el.type === 'number') v = v === '' ? '' : +v;
        setPath(el.dataset.k, v);
        saveDraft();
        if (el.dataset.k === 'event.date') dateHint();
        if (W.step === 3) recalcGeo();
      });
    });
  }

  /* ---------- 1-қадам: Буюртмачи ---------- */
  function inp(k, label, o) {
    o = o || {};
    const v = getPath(k);
    return '<div class="field ' + (o.cls || '') + '"><label for="f_' + k + '">' + label + '</label>' +
      (o.addon ? '<div class="input-group">' : '') +
      '<input class="input" id="f_' + k + '" data-k="' + k + '" type="' + (o.type || 'text') + '" value="' + esc(v == null ? '' : v) + '" placeholder="' + (o.ph || '') + '" ' + (o.attr || '') + '>' +
      (o.addon ? '<span class="addon">' + o.addon + '</span></div>' : '') + (o.hint ? '<span class="hint" id="h_' + k.replace('.', '_') + '">' + o.hint + '</span>' : '') + '</div>';
  }
  function step1() {
    return '<div class="card"><fieldset class="fs"><legend>' + ic('user') + 'Буюртмачи (тадбир ташкилотчиси)</legend><div class="grid-2">' +
      inp('owner.org', W.owner.type === 'yur' ? 'Ташкилот номи *' : 'Ф.И.Ш. *', { ph: '«Ташкилот» МЧЖ' }) +
      inp('owner.tin', W.owner.type === 'jis' ? 'ЖШШИР' : 'СТИР', { ph: '300000000', attr: 'inputmode="numeric"' }) +
      inp('owner.name', 'Масъул шахс Ф.И.Ш. *', { ph: 'Фамилия Исм Шарифи' }) +
      inp('owner.position', 'Лавозими', { ph: 'Директор' }) +
      inp('owner.phone', 'Алоқа телефони *', { ph: '+998 90 123-45-67', attr: 'inputmode="tel"' }) +
      inp('owner.email', 'Электрон почта', { type: 'email', ph: 'name@example.uz' }) +
      '</div></fieldset><div class="warn-item info">' + ic('info') + '<span>Маълумотлар профилингиздан олинди. Ушбу ариза учун ўзгартиришингиз мумкин — профил ўзгармайди.</span></div></div>';
  }

  /* ---------- 2-қадам: Тадбир ---------- */
  function step2() {
    const e = W.event;
    return '<div class="card">' +
      '<fieldset class="fs"><legend>' + ic('doc') + 'Тадбир ҳақида</legend>' + inp('event.name', 'Тадбир номи *', { ph: 'Масалан: «Баҳор садолари» мусиқа фестивали' }) +
      '<div class="field" style="margin-top:14px"><span class="label">Тадбир тури *</span><div class="type-cards" id="typeCards">' + HXCalc.EVENT_TYPES.map(function (t) {
        return '<button type="button" class="type-card ' + (e.type === t.id ? 'on' : '') + '" data-t="' + t.id + '">' + ic(t.icon) + '<span><b>' + t.label + '</b><small style="display:block;font-weight:500;opacity:.72">' + (t.modes ? 'Барча режим' : HXCalc.MODE_LABELS[t.mode]) + '</small></span></button>';
      }).join('') + '</div>' +
      '<div class="field" id="otherModes" style="margin-top:12px;' + (e.type === 'other' ? '' : 'display:none') + '"><span class="label">Ишлаш режими</span><div class="seg" id="modeSeg">' + ['perimeter', 'area', 'route'].map(function (m) {
        return '<button type="button" data-m="' + m + '" class="' + (HXCalc.workMode(typeMeta('other'), e) === m ? 'on' : '') + '">' + HXCalc.MODE_LABELS[m] + '</button>';
      }).join('') + '</div></div></div></fieldset>' +
      '<fieldset class="fs"><legend>' + ic('calendar') + 'Вақти</legend><div class="grid-3">' +
      inp('event.date', 'Сана *', { type: 'date', attr: 'min="' + HX.isoDate(HX.addDays(1)) + '"', hint: '&nbsp;' }) +
      inp('event.startTime', 'Бошланиш вақти *', { type: 'time' }) +
      inp('event.duration', 'Давомийлиги *', { type: 'number', attr: 'min="1" max="72"', addon: 'соат' }) + '</div></fieldset>' +
      '<fieldset class="fs"><legend>' + ic('calendar') + 'Шартнома муддати</legend><div class="seg" id="termKind">' +
      '<button type="button" data-k="event" class="' + ((!e.term || e.term.kind === 'event') ? 'on' : '') + '">Бир марталик</button>' +
      '<button type="button" data-k="period" class="' + (e.term && e.term.kind === 'period' ? 'on' : '') + '">Муддатли</button></div>' +
      '<div id="termPeriod" style="margin-top:12px;' + (e.term && e.term.kind === 'period' ? '' : 'display:none') + '"><div class="grid-2">' +
      '<div class="field"><label for="f_termFrom">Бошланиш (кун.ой.йил)</label><input class="input" id="f_termFrom" type="date" value="' + HX.esc((e.term && e.term.from) || '') + '"></div>' +
      '<div class="field"><label for="f_termTo">Тугаш (кун.ой.йил)</label><input class="input" id="f_termTo" type="date" value="' + HX.esc((e.term && e.term.to) || '') + '"></div></div></div>' +
      '<p class="small muted" id="termNote" style="margin:10px 0 0"></p></fieldset>' +
      '<fieldset class="fs"><legend>' + ic('pin') + 'Жойлашуви ва объект</legend><div class="grid-2">' +
      '<div class="field"><label for="f_region">Ҳудуд *</label><select class="input" id="f_region" data-k="event.region">' + HX.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (e.region === r.id ? ' selected' : '') + '>' + r.name + '</option>'; }).join('') + '</select></div>' +
      inp('event.address', 'Манзил / объект номи *', { ph: 'Туман, кўча, объект номи' }) + '</div>' +
      '<div class="field" style="margin-top:14px"><span class="label">Объект тоифаси (ВМ-205, 4, 15-бандлар)</span><div class="cat-cards" id="catCards">' + Object.values(HXCalc.CATEGORIES).map(function (c) {
        return '<button type="button" class="cat-card ' + (e.category === c.id ? 'on' : '') + '" data-c="' + c.id + '"><b>' + c.label + '</b>Масъул: ' + c.body + '</button>';
      }).join('') + '</div></div>' +
      '<div class="grid-3" style="margin-top:14px"><div class="field span-2"><span class="label">Объект тури</span><div class="seg" id="venueSeg">' + Object.values(HXCalc.VENUES).map(function (v) {
        return '<button type="button" data-v="' + v.id + '" class="' + (e.venue === v.id ? 'on' : '') + '">' + v.label + '</button>';
      }).join('') + '</div></div>' +
      inp('event.entrances', 'Кириш нуқталари (НЎП) *', { type: 'number', attr: 'min="0" max="60"', addon: 'та', cls: 'ent-field' }) + '</div>' +
      '<div class="warn-item info" id="routeNote" style="display:none;margin-top:12px">' + ic('route') + '<span>Марафон <b>чизиқ бўйлаб</b> белгиланади. Фақат пост патруллари қўйилади, ички патрул йўқ.</span></div>' +
      '<div class="warn-item info" id="internalNote" style="display:none;margin-top:12px">' + ic('store') + '<span>Майдон режимида ҳудуд <b>полигон</b> билан белгиланади. Фақат ички патруллар қўйилади, пост патруллари йўқ.</span></div>' +
      '<div class="field" style="margin-top:14px"><span class="label">Иштирокчилар тартиби *</span><div class="seg" id="crowdSeg">' +
      '<button type="button" data-crowd="limited" class="' + (e.crowd !== 'open' ? 'on' : '') + '">Чекланган</button>' +
      '<button type="button" data-crowd="open" class="' + (e.crowd === 'open' ? 'on' : '') + '">Чекланмаган</button></div>' +
      '<span class="hint" id="crowdHint"></span></div>' +
      '<div class="grid-2">' + inp('event.attendees', e.crowd === 'open' ? 'Тахминий иштирокчилар сони *' : 'Чекланган иштирокчилар сони *', { type: 'number', attr: 'min="1"', ph: e.crowd === 'open' ? 'Масалан: 12000' : 'Масалан: 5000', addon: 'киши', hint: e.crowd === 'open' ? 'Очиқ оқим — аниқ рўйхат йўқ, тахминий сон киритилади.' : 'Чипта ёки рўйхат бўйича аниқ сон. Объект сиғимидан ошмаслиги керак (61-банд).' }) + '</div></fieldset>' +
      '<fieldset class="fs"><legend>' + ic('alert') + 'Хавф омиллари</legend><div class="factor-grid" id="factors">' + HXCalc.FACTORS.filter(function (f) { return !f.auto; }).map(function (f) {
        const on = e.factors.indexOf(f.id) > -1;
        return '<label class="check ' + (on ? 'on' : '') + '"><input type="checkbox" data-f="' + f.id + '" ' + (on ? 'checked' : '') + '><span><b>' + f.label + '</b><br><span class="small muted">Хавф коэффициентига +' + HX.fmtDec(f.add, 2) + '</span></span></label>';
      }).join('') + '</div><p class="small muted" style="margin-top:10px">' + ic('clock', '') + ' Тунги вақт омили (22:00–06:00) бошланиш вақти ва давомийликдан автоматик аниқланади.</p></fieldset>' +
      '<div class="field"><label for="f_notes">Қўшимча маълумот</label><textarea class="input" id="f_notes" data-k="event.notes" placeholder="Саҳна жойлашуви, VIP кириш, автотураргоҳ ва ҳ.к.">' + esc(e.notes || '') + '</textarea></div></div>';
  }
  function dateHint() {
    const h = $('#h_event_date'); if (!h) return;
    const wd = HXCalc.workingDaysUntil(W.event.date);
    if (wd == null) { h.textContent = ''; return; }
    h.innerHTML = wd >= 10 ? '<span style="color:var(--good-ink)">' + ic('check', '') + ' ' + wd + ' иш куни қолган — муддат талабига мос</span>' : '<span style="color:var(--serious)">' + wd + ' иш куни қолган — камида 10 иш куни керак (15-1-банд)</span>';
  }
  function syncCrowdUi() {
    const open = W.event.crowd === 'open';
    const note = $('#routeNote');
    const internal = $('#internalNote');
    const ent = document.querySelector('.ent-field');
    if (note) note.style.display = isRoute() ? '' : 'none';
    if (internal) internal.style.display = isInternal() ? '' : 'none';
    if (ent) ent.style.display = isRoute() ? 'none' : '';
    const hint = $('#crowdHint');
    if (hint) hint.textContent = open ? 'Чекланмаган оқим: аниқ рўйхат йўқ, тахминий сон киритинг.' : 'Чекланган: чипта ёки рўйхат бўйича аниқ сон.';
    const lab = document.querySelector('label[for="f_event.attendees"]');
    if (lab) lab.textContent = open ? 'Тахминий иштирокчилар сони *' : 'Чекланган иштирокчилар сони *';
    const att = document.getElementById('f_event.attendees');
    if (att) att.placeholder = open ? 'Масалан: 12000' : 'Масалан: 5000';
    const h = document.getElementById('h_event_attendees');
    if (h) h.textContent = open ? 'Очиқ оқим — аниқ рўйхат йўқ, тахминий сон киритилади.' : 'Чипта ёки рўйхат бўйича аниқ сон. Объект сиғимидан ошмаслиги керак (61-банд).';
  }
  function bind2() {
    dateHint();
    syncCrowdUi();
    $$('#typeCards .type-card').forEach(function (b) {
      b.onclick = function () {
        const prevRoute = isRoute();
        W.event.type = b.dataset.t;
        const meta = typeMeta();
        if (!meta.modes) W.event.mode = meta.mode || 'perimeter';
        else if (!W.event.mode || meta.modes.indexOf(W.event.mode) < 0) W.event.mode = meta.modes[0];
        const nowRoute = isRoute();
        if (prevRoute !== nowRoute) {
          clearShape();
          if (nowRoute) { W.event.crowd = 'open'; W.event.entrances = 0; }
          else if (!W.event.entrances) W.event.entrances = 3;
        }
        saveDraft();
        $$('#typeCards .type-card').forEach(function (x) { x.classList.toggle('on', x === b); });
        const other = $('#otherModes');
        if (other) other.style.display = b.dataset.t === 'other' ? '' : 'none';
        if (prevRoute !== nowRoute) showStep(2, 1);
        else syncCrowdUi();
      };
    });
    $$('#modeSeg button').forEach(function (b) {
      b.onclick = function () {
        const prevRoute = isRoute();
        W.event.mode = b.dataset.m;
        const nowRoute = isRoute();
        if (prevRoute !== nowRoute) {
          clearShape();
          if (nowRoute) { W.event.crowd = 'open'; W.event.entrances = 0; }
          else if (!W.event.entrances) W.event.entrances = 3;
          saveDraft();
          showStep(2, 1);
          return;
        }
        $$('#modeSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
        saveDraft();
        syncCrowdUi();
      };
    });
    function termNote() {
      const el = $('#termNote'); if (!el) return;
      const term = W.event.term || { kind: 'event' };
      if (term.kind === 'period') {
        if (term.from && term.to && term.to < term.from) el.textContent = 'Тугаш сана бошланиш санасидан кейин бўлиши керак.';
        else if (term.from && term.to) el.textContent = 'Муддатли шартнома: ' + HX.date(term.from) + ' дан ' + HX.date(term.to) + ' гача (' + HXCalc.termDays(term) + ' кун).';
        else el.textContent = 'Бошланиш ва тугаш санасини кун.ой.йил кўринишида белгиланг.';
      } else el.textContent = 'Бир марталик тадбир: қиймат кўрсатилган соатлар бўйича.';
    }
    $$('#termKind button').forEach(function (b) {
      b.onclick = function () {
        W.event.term.kind = b.dataset.k;
        $$('#termKind button').forEach(function (x) { x.classList.toggle('on', x === b); });
        const box = $('#termPeriod'); if (box) box.style.display = b.dataset.k === 'period' ? '' : 'none';
        saveDraft(); termNote();
      };
    });
    ['f_termFrom', 'f_termTo'].forEach(function (id) {
      const el = $('#' + id);
      if (!el) return;
      el.addEventListener('change', function () {
        W.event.term[id === 'f_termFrom' ? 'from' : 'to'] = this.value;
        saveDraft(); termNote();
      });
    });
    termNote();
    $$('#crowdSeg button').forEach(function (b) {
      b.onclick = function () {
        W.event.crowd = b.dataset.crowd;
        $$('#crowdSeg button').forEach(function (x) { x.classList.toggle('on', x === b); });
        saveDraft();
        syncCrowdUi();
      };
    });
    $$('#catCards .cat-card').forEach(function (b) { b.onclick = function () { W.event.category = b.dataset.c; $$('#catCards .cat-card').forEach(function (x) { x.classList.toggle('on', x === b); }); saveDraft(); }; });
    $$('#venueSeg button').forEach(function (b) { b.onclick = function () { W.event.venue = b.dataset.v; $$('#venueSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); saveDraft(); }; });
    $$('#factors input').forEach(function (c) {
      c.onchange = function () {
        const f = c.dataset.f, arr = W.event.factors.filter(function (x) { return x !== f; });
        if (c.checked) arr.push(f);
        W.event.factors = arr; c.closest('.check').classList.toggle('on', c.checked); saveDraft();
      };
    });
  }

  /* ---------- 3-қадам: Периметр ёки йўналиш ---------- */
  function step3() {
    const route = isRoute();
    const reads = route
      ? '<div class="ro"><span>Йўналиш узунлиги</span><b id="roP">0</b> м</div><div class="ro"><span>Ички патрул</span><b>йўқ</b></div><div class="ro"><span>Тахминий / чекланган</span><b id="roC">0</b></div><div class="ro"><span>Наряд</span><b id="roH">0</b></div>'
      : '<div class="ro"><span>Периметр</span><b id="roP">0</b> м</div><div class="ro"><span>Майдон</span><b id="roS">0</b> м²</div><div class="ro"><span>Ўртача сиғим</span><b id="roC">0</b></div><div class="ro"><span>Гектар</span><b id="roH">0</b></div>';
    return '<div class="geo-wrap"><div class="card">' +
      '<div class="card-head"><h3>' + (route ? 'Хизмат йўналиши' : 'Хизмат ҳудуди периметри ва майдони') + '</h3></div>' +
      '<p class="small muted" style="margin:0 0 12px">' + (route ? 'Йўл бўйлаб чизиқ тортинг: нуқталарни кўча бўйлаб қўйинг. Ички ҳудуд патрули бу хизматда йўқ.' : 'Ҳудуд фақат харитада чизилади: нуқталар билан периметрни белгиланг.') + '</p>' +
      '<div id="geoBody"></div></div>' +
      '<aside class="card glow live-panel" id="livePanel">' +
      '<div class="card-head"><h3>Жонли ҳисоб</h3><span id="lpRisk"></span></div>' +
      '<div class="readouts">' + reads + '</div>' +
      '<div style="margin:18px 0 6px" class="small muted">Хизматга жалб этиладиган ходимлар</div><div class="live-total" id="lpTotal">0</div>' +
      '<div class="bars" id="lpBars" style="margin-top:14px"></div><div class="warn-list" id="lpWarn" style="margin-top:12px"></div></aside></div>';
  }
  function gateCount() {
    const el = $('#mGateN'); if (!el) return;
    const n = (W.geometry.gates || []).length;
    el.textContent = n ? 'НЎП: ' + n : 'НЎП белгиланмаган — автоматик тақсимланади';
  }
  function geoBody() {
    const g = W.geometry, b = $('#geoBody'), route = isRoute();
    const need = route ? 2 : 3;
    g.mode = 'map';
    g.kind = route ? 'route' : 'area';
    if (wzMap) { wzMap.destroy(); wzMap = null; }
    {
      b.innerHTML = '<div class="map-tools"><button class="btn btn-sm btn-primary" id="mDraw">' + ic('pen') + 'Чизишни бошлаш</button><button class="btn btn-sm" id="mUndo" disabled>' + ic('undo') + 'Бекор қилиш</button><button class="btn btn-sm" id="mDone" disabled>' + ic('check') + 'Якунлаш</button><button class="btn btn-sm" id="mSample">' + ic('sparkles') + (route ? 'Намуна йўналиш' : 'Намуна ҳудуд') + '</button><button class="btn btn-sm btn-ghost" id="mClear">' + ic('trash') + 'Тозалаш</button></div>' +
        (route ? '' : '<div class="map-tools" style="margin-top:0"><button class="btn btn-sm" id="mGate">' + ic('gate') + 'НЎПни харитада белгилаш</button><button class="btn btn-sm" id="mAuto">' + ic('route') + 'Йўллар бўйича</button><button class="btn btn-sm btn-ghost" id="mGateClear">' + ic('trash') + 'НЎПни тозалаш</button><span class="chip" id="mGateN"></span></div>') +
        '<div class="map-box"><div id="wzMap"></div></div>' +
        '<p class="map-hint" style="margin-top:10px">' + ic('info') + '<span id="mHint">' + (route ? '«Чизишни бошлаш»ни босинг ва йўл бўйлаб нуқталарни қўйинг. Камида 2 та нуқта, якунлаш — Enter ёки икки марта босиш. Фақат пост патруллари, ички патрул йўқ.' : (isInternal() ? '«Чизишни бошлаш»ни босинг ва савдо мажмуи ёки бозор майдонини белгиланг. Фақат ички патруллар қўйилади, пост патруллари йўқ.' : '«Чизишни бошлаш» тугмасини босинг ва харитада ҳудуд чегарасини нуқталар билан белгиланг. Биринчи нуқтага босиш ёки Enter — якунлаш. Периметр аниқлангач НЎП ва патруль постлари ўзлари қўйилади — уларни суриб ўзгартиринг.')) + '</span></p>';
      const reg = HX.region(W.event.region);
      wzMap = new PerimeterMap($('#wzMap'), {
        center: reg.c, zoom: 17, kind: route ? 'route' : 'area', objects: false,
        entrances: function () { return route ? 0 : Math.max(1, (W.geometry.gates && W.geometry.gates.length) || +W.event.entrances || 3); },
        onChange: function (geo, type) {
          if (type === 'hq') { W.geometry.hq = geo.hq; saveDraft(); return; }
          W.geometry.latlngs = geo.latlngs; W.geometry.gates = geo.gates || []; W.geometry.perimeter = Math.round(geo.perimeter); W.geometry.area = route ? 0 : Math.round(geo.area); W.geometry.center = geo.center; W.geometry.kind = route ? 'route' : 'area';
          if (type === 'shape' || type === 'clear') { W.geometry.posts = []; W.geometry.hq = null; }
          else if (type === 'edit') W.geometry.posts = [];
          else W.geometry.posts = geo.posts || [];
          if (!route && geo.gates && geo.gates.length) W.event.entrances = geo.gates.length;
          gateCount();
          saveDraft(); live();
          if (type === 'shape') HX.toast(route ? 'Йўналиш белгиланди' : 'Ҳудуд белгиланди', route ? 'Патруль нарядлари йўл бўйлаб қўйилади. Ички патрул йўқ.' : 'НЎП чорраҳаларга, патруль постлари кўриш масофаси бўйича қўйилади. Кейин уларни суринг.', 'ok', 3200);
          if (type !== 'posts' && wzMap && W.geometry.latlngs.length >= need) {
            const rr = HXCalc.compute(calcInput());
            if (rr.total) wzMap.deploy(rr, { animate: false, posts: W.geometry.posts || [], gates: W.geometry.gates, hq: W.geometry.hq });
          }
        },
        onLive: function (geo) { live({ perimeter: geo.perimeter, area: route ? 0 : geo.area }); },
        onHint: function () { HX.toast('Периметрга яқинроқ босинг', 'НЎП фақат ҳудуд чегарасига қўйилади.', 'warn', 2500); },
        onMode: function (mode, n) {
          $('#mUndo').disabled = mode !== 'drawing' || !n; $('#mDone').disabled = mode !== 'drawing' || n < need;
          $('#mDraw').innerHTML = mode === 'drawing' ? ic('x') + 'Чизишни тўхтатиш' : ic('pen') + (W.geometry.latlngs.length ? 'Қайта чизиш' : 'Чизишни бошлаш');
          if ($('#mGate')) {
            $('#mGate').innerHTML = mode === 'gates' ? ic('check') + 'Белгилашни тугатиш' : ic('gate') + 'НЎПни харитада белгилаш';
            $('#mGate').classList.toggle('btn-primary', mode === 'gates');
          }
          if (mode === 'gates') { $('#mHint').innerHTML = '<b>НЎП белгилаш:</b> йўл ёки пиёдалар йўлаги периметрга етиб келган жойга босинг. Ўчириш — НЎП устига босинг, тугатиш — Esc.'; return; }
          if (mode === 'drawing') $('#mHint').innerHTML = route
            ? '<b>Йўналиш:</b> ' + n + ' та нуқта. ' + (n >= 2 ? 'Якунлаш — Enter ёки икки марта босиш. Чизиқ ёпилмайди.' : 'Камида 2 та нуқта керак.')
            : '<b>Чизиш режими:</b> ' + n + ' та нуқта. ' + (n >= 3 ? 'Якунлаш учун биринчи нуқтага босинг ёки Enter.' : 'Камида 3 та нуқта керак.');
          else $('#mHint').innerHTML = W.geometry.latlngs.length
            ? (route ? 'Йўналиш белгиланди. Нуқталарни суриб йўлга мосланг. Ички патрул йўқ.' : 'Ҳудуд белгиланди. Нуқталарни, НЎП ва патруль постларини суриб ўз жойингизга қўйинг.')
            : (route ? '«Чизишни бошлаш»ни босинг ва йўл бўйлаб чизиқ тортинг.' : '«Чизишни бошлаш» тугмасини босинг ва харитада ҳудуд чегарасини нуқталар билан белгиланг.');
        }
      });
      if (route && g.latlngs && g.latlngs.length >= 2) {
        wzMap.setRoute(g.latlngs, { silent: true, instant: true, posts: g.posts || [], hq: g.hq });
        $('#mDraw').innerHTML = ic('pen') + 'Қайта чизиш';
        $('#mHint').innerHTML = 'Йўналиш белгиланган. Нуқталарни суриб йўлга мосланг.';
      } else if (!route && g.latlngs && g.latlngs.length >= 3) {
        wzMap.setPolygon(g.latlngs, { silent: true, instant: true, gates: g.gates || [], posts: g.posts || [], hq: g.hq });
        $('#mDraw').innerHTML = ic('pen') + 'Қайта чизиш';
        $('#mHint').innerHTML = 'Ҳудуд белгиланган. Нуқталарни, НЎП ва патруль постларини суриб ўз жойингизга қўйинг.';
      }
      $('#mDraw').onclick = function () { if (wzMap.drawing) wzMap.cancel(); else wzMap.startDraw(); };
      $('#mUndo').onclick = function () { wzMap.undo(); };
      $('#mDone').onclick = function () { wzMap.finish(); };
      $('#mSample').onclick = function () { if (route) wzMap.sampleRoute(); else wzMap.sample(220 + Math.round(Math.random() * 120), 140 + Math.round(Math.random() * 80), Math.round(Math.random() * 40) - 20); };
      $('#mClear').onclick = function () { wzMap.clear(); W.geometry.latlngs = []; W.geometry.gates = []; W.geometry.posts = []; W.geometry.perimeter = 0; W.geometry.area = 0; gateCount(); saveDraft(); live(); };
      if ($('#mGate')) $('#mGate').onclick = function () {
        if (wzMap.gateMode) { wzMap.stopGateMode(); return; }
        if (!wzMap.startGateMode()) HX.toast('Аввал ҳудудни чизинг', 'НЎП периметр чегарасига қўйилади.', 'warn');
      };
      if ($('#mAuto')) $('#mAuto').onclick = function () {
        if (W.geometry.latlngs.length < 3) { HX.toast('Аввал ҳудудни чизинг', 'НЎП периметр чегарасига қўйилади.', 'warn'); return; }
        const btn = this; btn.disabled = true;
        wzMap.autoGates(Math.max(1, +W.event.entrances || 3)).then(function (src) {
          btn.disabled = false;
          if (src === 'roads') HX.toast('НЎП йўлларга қараб жойлаштирилди', 'OpenStreetMap маълумотлари бўйича йўл ва пиёдалар йўлаклари периметрни кесиб ўтган жойлар танланди.', 'ok', 5000);
          else HX.toast('Йўллар маълумоти олинмади', 'НЎП узун томонлар (кўча томони) бўйлаб жойлаштирилди — аниқлаштириш учун уларни суриб қўйинг ёки қўлда белгиланг.', 'warn', 6000);
        });
      };
      if ($('#mGateClear')) $('#mGateClear').onclick = function () { wzMap.setGates([]); };
      gateCount();
    }
    bindInputs(b);
    recalcGeo();
  }
  function recalcGeo() {
    const g = W.geometry;
    g.mode = 'map';
    const m = isRoute() ? { perimeter: HXGeo.pathLength(g.latlngs || []), area: 0 } : HXGeo.measure(g.latlngs || []);
    g.perimeter = Math.round(m.perimeter);
    g.area = Math.round(m.area);
    saveDraft();
    live();
  }
  function shapePreview() {
    const el = $('#shapePrev'); if (!el) return;
    const g = W.geometry, d = g.dims;
    let svg = '';
    if (g.mode === 'rect') {
      const a = +d.a || 1, b = +d.b || 1, k = Math.min(300 / a, 170 / b), w = a * k, h = b * k;
      svg = '<svg viewBox="0 0 400 230"><rect class="shp" x="' + (200 - w / 2) + '" y="' + (115 - h / 2) + '" width="' + w + '" height="' + h + '" rx="3"/><text x="200" y="' + (115 - h / 2 - 8) + '" text-anchor="middle">' + HX.fmt(a) + ' м</text><text x="' + (200 + w / 2 + 8) + '" y="119">' + HX.fmt(b) + ' м</text></svg>';
    } else if (g.mode === 'circle') {
      svg = '<svg viewBox="0 0 400 230"><circle class="shp" cx="200" cy="115" r="95"/><line x1="200" y1="115" x2="295" y2="115" stroke="var(--gold)" stroke-width="2"/><circle cx="200" cy="115" r="4" fill="var(--gold)"/><text x="247" y="107" text-anchor="middle">R = ' + HX.fmt(d.r) + ' м</text></svg>';
    } else {
      const P = +d.p || 0, S = +d.s || 0, half = P / 2, disc = half * half - 4 * S;
      if (P > 0 && S > 0 && disc >= 0) {
        const a = (half + Math.sqrt(disc)) / 2, b = half - a, k = Math.min(300 / a, 170 / Math.max(b, 1)), w = a * k, h = Math.max(b * k, 4);
        svg = '<svg viewBox="0 0 400 230"><rect class="shp" x="' + (200 - w / 2) + '" y="' + (115 - h / 2) + '" width="' + w + '" height="' + h + '"/><text x="200" y="' + (115 - h / 2 - 8) + '" text-anchor="middle">≈ ' + HX.fmt(a) + ' × ' + HX.fmt(b) + ' м (эквивалент тўртбурчак)</text></svg>';
      } else if (P > 0 && S > 0 && S <= P * P / (4 * Math.PI)) {
        svg = '<svg viewBox="0 0 400 230"><ellipse class="shp" cx="200" cy="115" rx="130" ry="85"/><text x="200" y="120" text-anchor="middle">Эгри чизиқли ҳудуд</text></svg>';
      } else svg = '<svg viewBox="0 0 400 230"><text x="200" y="120" text-anchor="middle">Қийматларни киритинг</text></svg>';
    }
    el.innerHTML = svg;
  }
  function live(over) {
    const ci = calcInput();
    if (over) { ci.perimeter = over.perimeter; ci.area = over.area; }
    const r = HXCalc.compute(ci);
    const set = function (id, v, dec) { const el = $('#' + id); if (el) HX.countUp(el, v, { dur: over ? 1 : 500, dec: dec || 0 }); };
    set('roP', ci.perimeter);
    if ($('#roS')) set('roS', ci.area);
    set('roC', isRoute() ? r.attendees : r.capacity);
    set('roH', isRoute() ? r.patrols : ci.area / 10000, isRoute() ? 0 : 2);
    set('lpTotal', r.total);
    const rk = $('#lpRisk'); if (rk) rk.innerHTML = r.total ? HX.riskBadge(r.risk.id) : '';
    const bars = $('#lpBars');
    if (bars) {
      const max = Math.max.apply(null, r.parts.map(function (p) { return p.value; })) || 1;
      if (!bars.children.length) bars.innerHTML = r.parts.map(function (p) { return '<div class="bar-row" data-id="' + p.id + '" style="grid-template-columns:130px 1fr 40px"><span>' + p.label + '</span><div class="track"><div class="fill" style="background:' + HX.PART_COLORS[p.id] + '"></div></div><b>0</b></div>'; }).join('');
      r.parts.forEach(function (p) { const row = bars.querySelector('[data-id="' + p.id + '"]'); row.querySelector('.fill').style.width = (p.value / max * 100) + '%'; row.querySelector('b').textContent = p.value; });
    }
    const w = $('#lpWarn');
    if (w) w.innerHTML = r.warnings.filter(function (x) { return x.level === 'critical' || x.level === 'serious'; }).slice(0, 2).map(function (x) { return '<div class="warn-item ' + x.level + '">' + ic('alert') + '<span>' + x.text + '</span></div>'; }).join('');
    return r;
  }
  function bind3() { geoBody(); }

  /* ---------- 4-қадам: Ҳисоб-китоб натижаси ---------- */
  function deployLatLngs() {
    const g = W.geometry, c = HX.region(W.event.region).c;
    if (isRoute() && g.latlngs && g.latlngs.length >= 2) return g.latlngs;
    if (g.mode === 'map' && g.latlngs && g.latlngs.length >= 3) return g.latlngs;
    if (g.mode === 'rect') return HX.rectLatLngs(c, +g.dims.a, +g.dims.b, 0);
    if (g.mode === 'circle') return HXGeo.circleLatLngs(c, +g.dims.r, 40);
    const P = g.perimeter, S = g.area, half = P / 2, disc = half * half - 4 * S;
    if (disc >= 0) { const a = (half + Math.sqrt(disc)) / 2; return HX.rectLatLngs(c, a, half - a, 0); }
    return HXGeo.circleLatLngs(c, Math.sqrt(S / Math.PI), 40);
  }
  function step4() {
    const r = HXCalc.compute(calcInput());
    W._res = r;
    const t = r.tech;
    const synthetic = W.geometry.mode !== 'map';
    return '<div class="card glow" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center">' +
      '<div><div class="small muted">Хизматга бир вақтда жалб этиладиган ходимлар</div><div class="big-total"><b id="r4Total">0</b><span>нафар</span></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' + HX.riskBadge(r.risk.id) + '<span class="chip">K = ' + HX.fmtDec(r.K, 2) + '</span><span class="chip">' + r.shifts + ' навбат · ' + HX.fmt(r.personsTotal) + ' нафар</span><span class="chip">' + esc(r.category.body) + '</span></div></div>' +
      '<div style="text-align:right"><div class="small muted">Хизмат қиймати</div><div style="font-family:var(--font-display);font-size:30px;font-weight:800" id="r4Cost">0</div><div class="small muted">' + HX.fmt(r.personHours) + ' киши-соат × ' + HX.money(r.rate) + '</div></div></div></div>' +
      (r.warnings.length ? '<div class="warn-list" style="margin-bottom:16px">' + r.warnings.map(function (x, i) { return '<div class="warn-item ' + x.level + '" style="animation-delay:' + i * 0.06 + 's">' + ic(x.level === 'info' ? 'info' : 'alert') + '<span>' + x.text + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="res-grid" style="margin-bottom:16px"><div class="card"><h3>Таркиби</h3><div id="r4Donut" style="margin:10px 0 14px"></div>' + HX.legend(r.parts) + '</div>' +
      '<div class="card"><div class="card-head"><h3>Кучларни жойлаштириш схемаси</h3><button class="btn btn-sm" id="r4Replay">' + ic('play') + 'Анимация</button></div>' +
      (synthetic ? '<div class="warn-item info" style="margin-bottom:10px">' + ic('info') + '<span>Ҳудуд харитада чизилмаган — схема ' + esc(HX.region(W.event.region).name) + ' маркази атрофида шартли кўрсатилмоқда.</span></div>' : '') +
      '<div class="map-box"><div id="wzDeployMap"></div></div>' +
      '<div class="ill-legend layer-chips" id="r4Layers" style="margin-top:10px;flex-direction:row;flex-wrap:wrap">' + HXGeo.legendItems(r).map(function (it) {
        return '<button type="button" data-l="' + it.k + '">' + HXGeo.legendSwatch(it) + '<span>' + it.label + '</span>' + (it.n != null ? '<b>' + it.n + '</b>' : '') + '</button>';
      }).join('') + '</div></div></div>' +
      '<div class="grid-2" style="margin-bottom:16px;align-items:start"><div class="card"><h3>Ҳисоблаш формулалари</h3><div class="table-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Қисм</th><th>Ҳисоб</th><th class="num">Ходим</th></tr></thead><tbody>' +
      r.parts.map(function (p) { return '<tr><td><b>' + p.label + '</b></td><td><span class="formula">' + esc(p.formula) + '</span></td><td class="num"><b>' + p.value + '</b></td></tr>'; }).join('') +
      '<tr><td><b>Жами</b></td><td></td><td class="num"><b style="color:var(--accent)">' + r.total + '</b></td></tr></tbody></table></div></div>' +
      '<div class="card"><h3>Хавф коэффициенти (K)</h3><div class="k-trace"><div><span>Асосий қиймат</span><b>1,00</b></div>' + r.kTrace.map(function (k) { return '<div><span>' + esc(k.label) + '</span><b>+' + HX.fmtDec(k.add, 2) + '</b></div>'; }).join('') + '<div style="border:0"><span><b>Натижа</b></span><b style="color:var(--accent)">' + HX.fmtDec(r.K, 2) + '</b></div></div>' +
      '<h3 style="margin-top:18px">Вақт ва қиймат</h3><dl class="kv"><dt>Давомийлик</dt><dd>' + r.duration + ' соат</dd><dt>Навбатлар (' + r.norms.shiftHours + ' соатдан)</dt><dd>' + r.shifts + '</dd><dt>Жами шахсий таркиб</dt><dd>' + HX.fmt(r.personsTotal) + ' нафар</dd><dt>Киши-соат</dt><dd>' + HX.fmt(r.personHours) + '</dd><dt>1 киши-соат (БҲМ × ' + Math.round(r.norms.rateShare * 100) + '%)</dt><dd>' + HX.money(r.rate) + '</dd><dt>Жами қиймат</dt><dd style="color:var(--accent)">' + HX.money(r.cost) + '</dd></dl></div></div>' +
      '<div class="card" style="margin-bottom:16px"><h3>Техник воситалар</h3><div class="tech-grid">' +
      [['gate', t.frames, 'металлодетектор рамкаси'], ['target', t.handDetectors, 'қўл металлодетектори'], ['radio', t.radios, 'радиостанция'], ['barrier', t.barriers, 'тўсиқ секцияси (2,5 м)'], ['camera', t.cameras, 'видеокамера'], ['truck', t.vehicles, 'хизмат автомобили']].filter(function (x) { return x[1] > 0; }).map(function (x, i) {
        return '<div class="tech" style="animation-delay:' + i * 0.06 + 's"><div class="ic">' + ic(x[0]) + '</div><div><b>' + HX.fmt(x[1]) + '</b><span>' + x[2] + '</span></div></div>';
      }).join('') + '</div></div>' +
      '<div class="card"><h3>Шахсий таркиб визуализацияси</h3><div id="r4People"></div></div>';
  }
  function bind4() {
    const r = W._res;
    HX.countUp($('#r4Total'), r.total, { from: 0, dur: 1300 });
    HX.countUp($('#r4Cost'), r.cost, { from: 0, dur: 1300, format: function (v) { return HX.fmt(v) + ' сўм'; } });
    HX.donut($('#r4Donut'), r.parts, { size: 230, total: r.total });
    HX.people($('#r4People'), r.parts, { max: 180 });
    const ll = deployLatLngs();
    depMap = new PerimeterMap($('#wzDeployMap'), { editable: false, kind: isRoute() ? 'route' : 'area', center: HX.region(W.event.region).c, zoom: 17, scrollZoom: false });
    if (isRoute()) depMap.setRoute(ll, { silent: true, instant: true, posts: mapPosts() || [], hq: W.geometry.hq });
    else depMap.setPolygon(ll, { silent: true, instant: true, hq: W.geometry.hq });
    setTimeout(function () { if (depMap) depMap.deploy(r, { animate: true, gates: mapGates(), posts: mapPosts(), hq: W.geometry.hq }); }, 450);
    $('#r4Replay').onclick = function () { depMap.deploy(r, { animate: true, gates: mapGates(), posts: mapPosts(), hq: W.geometry.hq }); $$('#r4Layers button').forEach(function (b) { b.classList.remove('off'); }); };
    $$('#r4Layers button').forEach(function (b) { b.onclick = function () { b.classList.toggle('off'); depMap.setLayer(b.dataset.l, !b.classList.contains('off')); }; });
  }

  /* ---------- 5-қадам: Тасдиқлаш ---------- */
  function termPhrase(term) {
    if (!term || term.kind !== 'period' || !term.from || !term.to) return 'Бир марталик';
    return HX.date(term.from) + ' дан ' + HX.date(term.to) + ' гача';
  }
  function step5() {
    const r = HXCalc.compute(calcInput()), e = W.event, o = W.owner;
    W._res = r;
    const box = function (title, icon, rows) { return '<div class="card reveal"><h4 style="display:flex;gap:8px;align-items:center">' + ic(icon) + title + '</h4><dl class="kv">' + rows.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + x[1] + '</dd>'; }).join('') + '</dl></div>'; };
    return '<div class="sum-grid" style="margin-bottom:16px">' +
      box('Буюртмачи', 'user', [['Номи', esc(o.org)], ['Масъул', esc(o.name)], ['Телефон', esc(o.phone)], ['СТИР / ЖШШИР', esc(o.tin || '—')]]) +
      box('Тадбир', 'doc', [['Номи', esc(e.name)], ['Тури', esc(HX.typeLabel(e.type))], ['Режим', esc(HXCalc.MODE_LABELS[HXCalc.workMode(typeMeta(), e)] || '')], ['Сана', HX.date(e.date) + ', ' + esc(e.startTime)], ['Давомийлик', e.duration + ' соат'], ['Шартнома', esc(termPhrase(e.term))], ['Ҳудуд', esc(HX.region(e.region).name)]]) +
      box('Ҳисоб', 'users', isRoute()
        ? [['Йўналиш', HX.fmt(W.geometry.perimeter) + ' м'], ['Ички патрул', 'йўқ'], ['Иштирокчилар', (e.crowd === 'open' ? 'тахминий ' : 'чекланган ') + HX.fmt(r.attendees)], ['Ходимлар', '<b style="color:var(--accent)">' + HX.fmt(r.total) + '</b> нафар'], ['Қиймат', HX.money(r.cost)]]
        : [['Периметр', HX.fmt(W.geometry.perimeter) + ' м'], ['Майдон', HX.fmt(W.geometry.area) + ' м²'], ['Иштирокчилар', (e.crowd === 'open' ? 'тахминий ' : 'чекланган ') + HX.fmt(r.attendees)], ['Ходимлар', '<b style="color:var(--accent)">' + HX.fmt(r.total) + '</b> нафар'], ['Хавф', r.risk.label + ' (K ' + HX.fmtDec(r.K, 2) + ')'], ['Қиймат', HX.money(r.cost)]]) +
      '</div>' +
      '<div class="card"><h3>Тасдиқлаш</h3><div style="display:flex;flex-direction:column;gap:8px" id="agree">' +
      ['Киритилган маълумотлар тўғрилигини тасдиқлайман', 'ВМ-205 қоидаларининг 59, 61-бандларида белгиланган ташкилотчи мажбуриятлари (металлодетектор назорати ҳақида огоҳлантириш, тақиқланган буюмлар, сиғимга мос чипталар) билан танишдим', 'Шахсга доир маълумотларимни ариза кўриб чиқиш мақсадида қайта ишлашга розиман (ЎРҚ-547)'].map(function (t, i) {
        return '<label class="check"><input type="checkbox" data-a="' + i + '"><span>' + t + '</span></label>';
      }).join('') + '</div>' +
      (r.warnings.some(function (x) { return x.level === 'critical' || x.level === 'serious'; }) ? '<div class="warn-item serious" style="margin-top:14px">' + ic('alert') + '<span>Аризада огоҳлантиришлар мавжуд — улар оператор томонидан кўриб чиқилади ва ариза қайтарилиши мумкин.</span></div>' : '') +
      '</div>';
  }

  function validate(n) {
    const bad = [];
    const req = function (k, ok) { if (!ok) { const el = $('[data-k="' + k + '"]'); if (el) el.classList.add('invalid'); bad.push(k); } };
    if (n === 1) { req('owner.org', (W.owner.org || '').trim().length > 2); req('owner.name', (W.owner.name || '').trim().length > 4); req('owner.phone', (W.owner.phone || '').replace(/\D/g, '').length >= 9); }
    if (n === 2) {
      const e = W.event;
      req('event.name', (e.name || '').trim().length > 3);
      req('event.date', !!e.date && e.date > HX.isoDate(new Date()));
      req('event.startTime', !!e.startTime);
      req('event.duration', +e.duration >= 1 && +e.duration <= 72);
      req('event.address', (e.address || '').trim().length > 3);
      req('event.attendees', +e.attendees > 0);
      if (!isRoute()) req('event.entrances', +e.entrances >= 1);
    }
    if (n === 3) {
      const g = W.geometry;
      if (isRoute()) {
        if (!(g.latlngs && g.latlngs.length >= 2 && g.perimeter > 0)) { HX.toast('Йўналиш белгиланмаган', 'Йўл бўйлаб камида 2 та нуқта қўйинг.', 'err'); return false; }
      } else {
        if (!(g.perimeter > 0 && g.area > 0)) { HX.toast('Ҳудуд белгиланмаган', 'Харитада периметрни чизинг.', 'err'); return false; }
        if (g.area > g.perimeter * g.perimeter / (4 * Math.PI) * 1.002) { HX.toast('Нотўғри қийматлар', 'Майдон шу периметр учун геометрик жиҳатдан мумкин эмас.', 'err'); return false; }
      }
    }
    if (bad.length) { HX.toast('Мажбурий майдонларни тўлдиринг', 'Қизил билан белгиланган майдонларни текширинг.', 'err'); const f = $('.invalid'); if (f) f.focus(); return false; }
    return true;
  }

  function submit() {
    const boxes = $$('#agree input');
    if (!boxes.every(function (b) { return b.checked; })) { boxes.forEach(function (b) { if (!b.checked) b.closest('.check').classList.add('invalid'); setTimeout(function () { b.closest('.check').classList.remove('invalid'); }, 600); }); HX.toast('Тасдиқлаш талаб этилади', 'Барча бандларни белгиланг.', 'warn'); return; }
    const r = HXCalc.compute(calcInput());
    const ll = deployLatLngs();
    const now = new Date().toISOString();
    let app;
    if (W.id && HX.apps.get(W.id)) {
      app = HX.apps.get(W.id);
      app.event = Object.assign({}, W.event); app.owner = Object.assign({}, W.owner);
      app.geometry = geoRecord(ll);
      app.result = HXCalc.summarize(r); app.status = 'submitted';
      app.history.push({ at: now, status: 'submitted', by: 'Буюртмачи', note: 'Ариза тузатилиб қайта юборилди' });
      HX.apps.upsert(app);
    } else {
      app = {
        id: HX.apps.nextId(), createdAt: now, updatedAt: now, ownerId: user.id,
        owner: Object.assign({}, W.owner),
        event: Object.assign({}, W.event),
        geometry: geoRecord(ll),
        result: HXCalc.summarize(r), status: 'submitted',
        history: [{ at: now, status: 'submitted', by: 'Буюртмачи', note: 'Ариза платформа орқали юборилди' }],
        assigned: null
      };
      HX.apps.upsert(app);
    }
    HX.store.remove('hx.draft');
    destroyMaps();
    $('#cabMain').innerHTML = '<div class="view"><div class="card success"><svg class="chk" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="6"/><path d="M38 62l15 15 30-32" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<h2 style="margin-top:16px">Ариза қабул қилинди!</h2><p>Ариза рақами: <b class="mono" style="color:var(--text)">' + esc(app.id) + '</b><br>Ариза ' + esc(HX.region(app.event.region).name) + ' бўйича ҳудудий бўлинмага кўриб чиқиш учун юборилди. Ҳолат ўзгаришлари ҳақида хабарнома оласиз.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px"><a class="btn btn-primary" href="#app=' + encodeURIComponent(app.id) + '">' + ic('eye') + 'Аризани кўриш</a><a class="btn" href="#home">' + ic('grid') + 'Бош панел</a></div></div></div>';
    curView = 'done';
    renderSide();
    confetti();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
})();
