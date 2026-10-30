/* Ҳуқуқий база ва методика саҳифаси */
(function () {
  'use strict';
  const $ = HX.$, $$ = HX.$$, esc = HX.esc, ic = HX.icon, L = window.HXLaws;
  let dirF = null, kindF = 'all', q = '';
  const mf = [];

  HX.ready(function () {
    HX.renderShell('qonun');
    $('#sIc').innerHTML = ic('search');
    $('#kindSeg').innerHTML = '<button class="on" data-k="all">Барчаси</button>' + Object.keys(L.kinds).map(function (k) { return '<button data-k="' + k + '">' + L.kinds[k] + '</button>'; }).join('');
    $$('#kindSeg button').forEach(function (b) { b.onclick = function () { kindF = b.dataset.k; $$('#kindSeg button').forEach(function (x) { x.classList.toggle('on', x === b); }); applyFilter(); }; });
    $('#s').oninput = function () { q = this.value.toLowerCase().trim(); applyFilter(); };
    dirChips(); timeline(); docs(); method(); sources();
    HX.observe(document);
    if (location.hash.indexOf('#doc-') === 0) setTimeout(function () { focusDoc(location.hash.slice(5)); }, 500);
    window.addEventListener('hashchange', function () { if (location.hash.indexOf('#doc-') === 0) focusDoc(location.hash.slice(5)); });
  });

  function dirChips() {
    $('#dirChips').innerHTML = L.directions.map(function (d) {
      const n = L.docs.filter(function (x) { return x.dirs.indexOf(d.id) > -1; }).length;
      return '<button class="dir-chip" data-d="' + d.id + '">' + ic(d.icon) + d.label + '<span class="n">' + n + '</span></button>';
    }).join('');
    $$('#dirChips .dir-chip').forEach(function (b) {
      b.onclick = function () {
        const id = +b.dataset.d; dirF = dirF === id ? null : id;
        $$('#dirChips .dir-chip').forEach(function (x) { x.classList.toggle('on', +x.dataset.d === dirF); });
        applyFilter();
        if (dirF) { const first = $('.doc:not(.dim)'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      };
    });
  }

  function timeline() {
    const years = {};
    L.docs.forEach(function (d) { (years[d.year] = years[d.year] || []).push(d); });
    const tl = $('#tline');
    tl.insertAdjacentHTML('beforeend', Object.keys(years).sort().map(function (y, i) {
      return '<div class="ty" style="--d:' + (i * 0.22) + 's"><div class="yr">' + y + '</div><div class="nd"></div>' + years[y].map(function (d) { return '<button data-go="' + d.id + '">' + esc(d.short) + '</button>'; }).join('') + '</div>';
    }).join(''));
    $$('#tline [data-go]').forEach(function (b) { b.onclick = function () { focusDoc(b.dataset.go); }; });
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { tl.classList.add('in'); io.disconnect(); } }, { threshold: 0.3 }); io.observe(tl); } else tl.classList.add('in');
  }

  function docs() {
    const iconFor = { law: 'scale', decree: 'flag', cm: 'building', draft: 'edit' };
    // муҳимлик тартиби: платформа учун асосий ҳужжатлар биринчи
    const order = ['vm205', 'zrq647', 'zrq647-2026', 'pq360', 'pf27', 'bhm2026', 'reg81559', 'zrq537', 'zrq547', 'zrq395', 'pq4997'];
    const rank = function (d) { const i = order.indexOf(d.id); return i < 0 ? 99 : i; };
    $('#docs').innerHTML = L.docs.slice().sort(function (a, b) { return rank(a) - rank(b); }).map(function (d, i) {
      return '<article class="card doc reveal" id="doc-' + d.id + '" style="--d:' + Math.min(i, 6) * 0.05 + 's" data-id="' + d.id + '">' +
        '<div class="doc-head" role="button" tabindex="0" aria-expanded="false"><div class="doc-ic">' + ic(iconFor[d.kind]) + '</div><div style="flex:1;min-width:0">' +
        '<div class="meta"><span class="chip mono">' + esc(d.short) + '</span><span class="chip">' + d.date + '</span><span class="status st-' + d.status + '">' + L.statuses[d.status] + '</span></div>' +
        '<h3>' + esc(d.title) + '</h3></div><span class="tg">' + ic('arrowRight') + '</span></div>' +
        '<div class="doc-body"><div><div class="doc-inner"><ul class="pts">' + d.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
        '<div class="use">' + ic('cpu') + '<span><b>Платформада:</b> ' + esc(d.platform) + '</span></div>' +
        (d.note ? '<div class="warn-item warning" style="margin-bottom:12px">' + ic('alert') + '<span>' + esc(d.note) + '</span></div>' : '') +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><a class="btn btn-sm" href="' + d.url + '" target="_blank" rel="noopener">' + ic('external') + 'Расмий манба</a>' +
        d.dirs.map(function (id) { const x = L.directions.find(function (z) { return z.id === id; }); return '<span class="chip">' + x.label + '</span>'; }).join('') + '</div></div></div></div></article>';
    }).join('');
    $$('.doc-head').forEach(function (h) {
      const tg = function () { const doc = h.closest('.doc'); doc.classList.toggle('open'); h.setAttribute('aria-expanded', doc.classList.contains('open')); };
      h.onclick = tg; h.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } };
    });
    const first = $('#doc-vm205'); if (first) first.classList.add('open');
  }

  function applyFilter() {
    L.docs.forEach(function (d) {
      const el = $('#doc-' + d.id);
      const text = (d.short + ' ' + d.title + ' ' + d.points.join(' ') + ' ' + d.platform).toLowerCase();
      const ok = (!dirF || d.dirs.indexOf(dirF) > -1) && (kindF === 'all' || d.kind === kindF) && (!q || text.indexOf(q) > -1);
      el.classList.toggle('dim', !ok);
      if (ok && (dirF || q)) el.classList.add('open');
    });
  }

  function focusDoc(id) {
    const el = $('#doc-' + id); if (!el) return;
    el.classList.add('open'); el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }

  /* ---------- Методика: жонли мисол ---------- */
  function method() {
    $('#mType').innerHTML = HXCalc.EVENT_TYPES.map(function (t) { return '<option value="' + t.id + '">' + t.label + '</option>'; }).join('');
    $('#mVenue').innerHTML = Object.values(HXCalc.VENUES).map(function (v) { return '<option value="' + v.id + '">' + v.label + '</option>'; }).join('');
    $('#mFactors').innerHTML = HXCalc.FACTORS.filter(function (f) { return !f.auto; }).map(function (f) { return '<button class="dir-chip" data-f="' + f.id + '" style="padding:6px 11px;font-size:12px">' + f.label + '</button>'; }).join('');
    $$('#mFactors button').forEach(function (b) { b.onclick = function () { b.classList.toggle('on'); const i = mf.indexOf(b.dataset.f); if (i > -1) mf.splice(i, 1); else mf.push(b.dataset.f); run(); }; });
    ['#mType', '#mVenue'].forEach(function (s) { $(s).onchange = run; });
    ['#mP', '#mS', '#mE', '#mD'].forEach(function (s) { $(s).oninput = run; });
    run();
  }
  function run() {
    const N = HXCalc.getNorms();
    const inp = { type: $('#mType').value, venue: $('#mVenue').value, category: '1', perimeter: +$('#mP').value, area: +$('#mS').value, entrances: +$('#mE').value || 1, duration: +$('#mD').value || 1, startTime: '17:00', factors: mf.slice() };
    $('#mPv').textContent = HX.fmt(inp.perimeter) + ' м'; $('#mSv').textContent = HX.fmt(inp.area) + ' м²';
    const r = HXCalc.compute(inp);
    const t = r.type, p = function (id) { return r.parts.find(function (x) { return x.id === id; }); };
    const S = [
      ['Сиғим (C)', 'C = S × ' + N.usableShare + ' × ' + HX.fmtDec(t.density, 1) + ' киши/м²', r.capacity],
      ['Периметр постлари', 'N₁ = ⌈P ÷ ' + r.spacing + ' м⌉ × K', p('perimeter').value],
      ['Ички ҳудуд патруллари', 'N₂ = max(⌈S ÷ ' + t.areaPer + '⌉, ⌈C ÷ ' + t.crowdPer + '⌉) × K → ' + N.patrolSize + ' кишилик наряд', p('internal').value],
      ['НЎП ва кўрик', 'N₃ = (рамка × ' + N.frameStaff + ' + НЎП × ' + N.entranceSupervisor + ') × K; рамка = max(НЎП, ⌈C ÷ ' + (N.frameThroughput * N.arrivalWindow) + '⌉)', p('checkpoint').value],
      ['Хавф коэффициенти (K)', 'K = 1 + ' + HX.fmtDec(t.risk, 2) + ' (тур) + Σ омиллар ≤ ' + HX.fmtDec(N.kMax, 1), HX.fmtDec(r.K, 2)],
      ['Захира, кинолог, командирлар', Math.round(N.reserveShare * 100) + '% захира + кинологлар + ⌈Σ ÷ ' + N.commanderRatio + '⌉ + 1', r.reserve + r.k9 + r.commanders]
    ];
    if (p('traffic').value) S.splice(4, 0, ['Йўл ҳаракати постлари', 'N₄ = (⌈P ÷ ' + N.trafficSpacing + '⌉ + 2) × K', p('traffic').value]);
    $('#fsteps').innerHTML = S.map(function (s, i) { return '<div class="fstep" style="animation-delay:' + i * 0.05 + 's"><div><b class="t">' + s[0] + '</b><span class="formula">' + esc(s[1]) + '</span></div><span class="val">' + (typeof s[2] === 'number' ? HX.fmt(s[2]) : s[2]) + '</span></div>'; }).join('') +
      '<div class="fstep total"><div><b class="t">Жалб этиладиган ходимлар</b><span class="formula">Жами = N₁ + N₂ + N₃ + N₄ + захира + кинолог + командирлар</span></div><span class="val" id="mTot">0</span></div>' +
      '<div class="fstep"><div><b class="t">Шартнома қиймати</b><span class="formula">' + HX.fmt(r.total) + ' × ' + r.duration + ' соат × ' + HX.fmt(r.rate) + ' сўм (БҲМ × ' + Math.round(N.rateShare * 100) + '%)</span></div><span class="val" style="font-size:17px">' + HX.mln(r.cost) + '</span></div>';
    HX.countUp($('#mTot'), r.total, { from: 0, dur: 700 });
    $('#mRisk').innerHTML = HX.riskBadge(r.risk.id);
    $('#normTbl').innerHTML = '<thead><tr><th>Норматив</th><th class="num">Қиймат</th></tr></thead><tbody>' + [
      ['БҲМ', HX.money(N.bhm)], ['1 киши-соат', HX.money(r.rate)], ['Пост оралиғи (очиқ / тўсиқли / ёпиқ)', N.spacing.open + ' / ' + N.spacing.fenced + ' / ' + N.spacing.indoor + ' м'],
      ['Тезкор захира', Math.round(N.reserveShare * 100) + '%'], ['Навбат давомийлиги', N.shiftHours + ' соат'], ['Рамка ўтказувчанлиги', N.frameThroughput + ' киши/соат']
    ].map(function (x) { return '<tr><td>' + x[0] + '</td><td class="num"><b>' + x[1] + '</b></td></tr>'; }).join('') + '</tbody>';
  }

  function sources() {
    $('#srcs').innerHTML = L.docs.map(function (d) { return '<a href="' + d.url + '" target="_blank" rel="noopener">' + ic('external') + '<span class="src-t"><b>' + esc(d.short) + '</b> — ' + esc(d.title) + '</span></a>'; }).join('');
  }
})();
