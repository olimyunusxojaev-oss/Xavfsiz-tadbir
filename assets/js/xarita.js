/* =========================================================
   Периметр калькулятори (тўлиқ экранли харита) — 2-версия
   • периметр чизиш, НЎПни йўлларга қараб белгилаш (қўлда / автоматик)
   • патруль секторлари ва йўналишлари, иллюстрацияли легенда
   ========================================================= */
(function () {
  'use strict';
  const $ = HX.$, $$ = HX.$$, ic = HX.icon, t = function (s) { return window.HXI18N ? HXI18N.t(s) : s; };
  let pm, res = null, deployTimer = 0, setMapMax = function () {};
  const S = Object.assign({ region: (HX.user.get() || {}).region || 'tsh', type: '', mode: '', picked: false, venue: 'open', category: '1', entrances: 3, startTime: '18:00', duration: 4, attendees: '', crowd: 'limited', factors: [], latlngs: [], gates: [], posts: [], hq: null, term: { kind: 'event', from: '', to: '' } }, HX.store.get('hx.calcState', null) || {});
  if (!Array.isArray(S.gates)) S.gates = [];
  if (!Array.isArray(S.posts)) S.posts = [];
  if (S.crowd !== 'open') S.crowd = 'limited';
  if (!S.term || S.term.kind !== 'period') S.term = { kind: 'event', from: '', to: '' };
  else S.term = { kind: 'period', from: S.term.from || '', to: S.term.to || '' };
  S.picked = false;
  function typeMeta(id) {
    return HXCalc.EVENT_TYPES.find(function (x) { return x.id === (id || S.type); }) || {};
  }
  function activeMode(id) { return HXCalc.workMode(typeMeta(id), { mode: id && id !== S.type ? undefined : S.mode }); }
  function routeType(id) { return activeMode(id) === 'route'; }
  function internalOnly(id) { return activeMode(id) === 'area'; }
  function needPts() { return routeType() ? 2 : 3; }

  HX.ready(function () {
    HX.renderShell('xarita');
    setupControls();
    pm = new PerimeterMap($('#bigMap'), {
      center: HX.region(S.region).c, zoom: 16, kind: routeType() ? 'route' : 'area', objects: false,
      entrances: function () { return Math.max(1, +$('#pEnt').value || S.entrances || 3); },
      onChange: function (g, type) {
        if (type === 'hq') { S.hq = g.hq; persist(); return; }
        S.latlngs = g.latlngs; S.gates = g.gates;
        if (type === 'shape' || type === 'clear') { S.posts = []; S.hq = null; }
        else if (type === 'edit') S.posts = [];
        else S.posts = (g.posts || []).map(function (p) { return [p[0], p[1]]; });
        persist();
        syncOverlays();
        syncEntrances();
        if (type === 'posts') return;
        update(type === 'shape' || type === 'edit' ? 'animate' : (type === 'gates' || type === 'roads') ? 'soft' : 'none');
        if (type === 'shape' && !(pm.selectedObject)) HX.toast(routeType() ? 'Йўналиш белгиланди' : (internalOnly() ? 'Майдон белгиланди' : 'Ҳудуд белгиланди'), routeType() ? 'Фақат пост патруллари чизиқ бўйлаб қўйилади. Ички патрул йўқ.' : (internalOnly() ? 'Фақат ички патруллар қўйилади. Пост патруллари йўқ.' : 'НЎП чорраҳаларга, патруль постлари кўриш масофаси бўйича қўйилади. Кейин уларни суринг.'), 'ok', 4200);
        if (type === 'roads' && g.gates.length) HX.toast('Жойлаштирилди', g.gates.length + ' та НЎП ва патруль постлари қўйилди. Суриб ўз жойингизга қўйинг.', 'ok', 4200);
      },
      onObject: function (feat) {
        const card = $('#objCard');
        card.classList.remove('hidden');
        $('#objName').textContent = feat.name;
        $('#objKind').textContent = feat.kind === 'stadium' ? 'Стадион' : feat.kind === 'park' ? 'Боғ / майдон' : feat.kind === 'place' ? 'Жамоат объекти' : 'Бино';
        const m = HXGeo.measure(feat.ll);
        $('#objMeta').textContent = 'Периметр ' + HX.fmt(m.perimeter) + ' м · майдон ' + HX.fmt(m.area) + ' м² · ўртача сиғим ҳисобланмоқда';
        HX.toast('Объект белгиланди', feat.name + ' — периметр, ўртача сиғим ва ходимлар автоматик ҳисобланди.', 'ok', 4200);
      },
      onObjects: function (n, loading) {
        const el = $('#mapStatus');
        if (!el) return;
        el.classList.toggle('on', loading || n > 0);
        el.textContent = loading ? 'Объектлар юкланмоқда…' : (n ? n + ' та объект · босинг' : '');
      },
      onLive: function (g) { hud(g.perimeter, g.area, null); },
      onHint: function (kind) {
        if (kind === 'zoom') HX.toast('Харитани яқинлаштиринг', 'Бино ва майдонлар 16-даражадан кўринади ва босилади.', 'warn', 2800);
        else if (kind === 'empty') HX.toast('Объект топилмади', 'Бино, боғ ёки майдон устига босинг. Йўл чизиғининг ўзида объект бўлмаслиги мумкин.', 'warn', 3200);
        else if (kind === 'net') HX.toast('Харита маълумоти келмади', 'Интернетни текшириб, объектни қайта босинг.', 'warn', 3200);
        else HX.toast('Чорраҳа ёки периметрга яқинроқ босинг', 'НЎП йўл кесишмасига ёки ҳудуд чегарасига қўйилади.', 'warn', 2500);
      },
      onMode: function (mode, n) {
        const b = $('#drawBanner');
        $('#tUndo').disabled = mode !== 'drawing' || !n;
        $('#tDone').disabled = mode !== 'drawing' || n < needPts();
        $('#tDraw').innerHTML = mode === 'drawing' ? ic('x') + t('Чизишни тўхтатиш') : ic('pen') + t(S.latlngs.length ? 'Қайта чизиш' : 'Чизишни бошлаш');
        $('#gMode').innerHTML = mode === 'gates' ? ic('check') + t('Белгилашни тугатиш') : ic('gate') + t('НЎПни харитада белгилаш');
        $('#gMode').classList.toggle('btn-primary', mode === 'gates');
        if (mode === 'drawing') { b.classList.add('on'); b.innerHTML = ic('pen') + (routeType() ? (n < 2 ? t('Йўл бўйлаб нуқта: ' + n + ' / камида 2') : t(n + ' нуқта · Enter ёки икки марта босиш — чизиқ ёпилмайди')) : (n < 3 ? t('Нуқталарни белгиланг: ' + n + ' / камида 3') : t(n + ' нуқта · якунлаш учун биринчи нуқтага босинг ёки Enter'))); $('#emptyMap').classList.add('hidden'); }
        else if (mode === 'gates') { b.classList.add('on'); b.innerHTML = ic('gate') + t('НЎП: чорраҳага ёки периметрга босинг · ўчириш — НЎП устига · Esc — тугатиш'); }
        else if (mode === 'pick') { b.classList.add('on'); b.innerHTML = ic('sparkles') + t('Объект танлаш: бино, боғ ёки майдонга босинг — периметр ўзи чизилади'); }
        else b.classList.remove('on');
      }
    });
    if (routeType() && S.latlngs && S.latlngs.length >= 2) { pm.setRoute(S.latlngs, { silent: true, instant: true, posts: S.posts, hq: S.hq }); syncEntrances(); update('animate'); }
    else if (S.latlngs && S.latlngs.length >= 3) { pm.setPolygon(S.latlngs, { silent: true, instant: true, gates: S.gates, posts: S.posts, hq: S.hq }); syncEntrances(); update('animate'); }
    else update('none');
    applyRouteChrome();
    setupTypeGate();
    setupTerm();
    const narrowMap = function () { return window.matchMedia('(max-width: 900px)').matches; };
    setMapMax = function (on) {
      document.body.classList.toggle('map-max', !!on && narrowMap());
      const b = $('#mapMax');
      if (b) b.innerHTML = ic('map') + ' ' + (document.body.classList.contains('map-max') ? 'Панелга қайтиш' : 'Харитани тўлиқ очиш');
      setTimeout(function () {
        if (!pm) return;
        pm.invalidate();
        setTimeout(function () {
          if (pm.latlngs && pm.latlngs.length >= 2 && pm._fitDrawn) pm._fitDrawn(true);
        }, 180);
      }, 40);
    };
    const startDraw = function () {
      if (pm.drawing) { pm.cancel(); setMapMax(false); }
      else { setMapMax(true); pm.startDraw(); }
    };
    if ($('#mapMax')) $('#mapMax').onclick = function () { setMapMax(!document.body.classList.contains('map-max')); };
    if (!S.picked) setMapMax(true);
    $('#tDraw').innerHTML = ic('pen') + $('#tDraw').textContent; $('#tDraw').onclick = startDraw; $('#eDraw').onclick = startDraw;
    $('#tUndo').innerHTML = ic('undo') + $('#tUndo').textContent; $('#tUndo').onclick = function () { pm.undo(); };
    $('#tDone').innerHTML = ic('check') + $('#tDone').textContent; $('#tDone').onclick = function () { pm.finish(); };
    $('#tSample').innerHTML = ic('sparkles') + $('#tSample').textContent;
    const sample = function () { setMapMax(true); if (routeType()) pm.sampleRoute(); else pm.sample(200 + Math.round(Math.random() * 160), 130 + Math.round(Math.random() * 90), Math.round(Math.random() * 50) - 25); };
    $('#tSample').onclick = sample; $('#eSample').onclick = sample;
    $('#tClear').innerHTML = ic('trash') + $('#tClear').textContent;
    $('#tClear').onclick = function () { pm.clear(); S.latlngs = []; S.gates = []; S.posts = []; persist(); $('#emptyMap').classList.remove('hidden'); $('#objCard').classList.add('hidden'); syncEntrances(); update('none'); };
    window.addEventListener('resize', function () { if (pm) pm.invalidate(); });
    // НЎП асбоблари
    $('#gMode').innerHTML = ic('gate') + $('#gMode').textContent;
    $('#gMode').onclick = function () {
      if (pm.gateMode) { pm.stopGateMode(); return; }
      if (!pm.startGateMode()) HX.toast('Аввал ҳудудни чизинг', 'НЎП периметр чегарасига қўйилади.', 'warn');
    };
    $('#gAuto').innerHTML = ic('route') + $('#gAuto').textContent;
    $('#gAuto').onclick = function () {
      if (S.latlngs.length < 3) { HX.toast('Аввал ҳудудни чизинг', 'НЎП периметр чегарасига қўйилади.', 'warn'); return; }
      const b = this; b.disabled = true; b.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;margin:0"></span>' + t('Йўллар аниқланмоқда…');
      pm.autoGates(Math.max(1, +$('#pEnt').value || S.entrances || 3)).then(function (src) {
        b.disabled = false; b.innerHTML = ic('route') + t('Йўллар бўйича');
        if (src === 'roads') HX.toast('НЎП чорраҳаларга қўйилди', 'Йўл кесишмалари танланди. Патруль йўналиши шу кўчалар бўйлаб ҳаракатланади.', 'ok', 5000);
        else HX.toast('Йўллар маълумоти олинмади', 'НЎП узун томонлар бўйлаб қўйилди — чорраҳага суриб ўтказинг.', 'warn', 6000);
      });
    };
    $('#gClear').innerHTML = ic('trash') + $('#gClear').textContent;
    $('#gClear').onclick = function () { pm.setGates([]); };
    $('#rDeploy').innerHTML = ic('play') + $('#rDeploy').textContent;
    $('#rDeploy').onclick = function () { if (res) { deploy(true); for (const k in off) off[k] = false; legend(); } };
    $('#rApply').onclick = function () {
      const g = pm.geometry();
      HX.store.set('hx.draft', {
        event: { type: S.type, mode: activeMode(), venue: S.venue, category: S.category, entrances: routeType() ? 0 : (g.gates.length || S.entrances), startTime: S.startTime, duration: S.duration, attendees: S.attendees, crowd: S.crowd, factors: S.factors, region: S.region, term: S.term },
        geometry: g.latlngs.length >= needPts() ? { mode: 'map', kind: routeType() ? 'route' : 'area', latlngs: g.latlngs, gates: routeType() ? [] : g.gates, posts: g.posts || [], hq: g.hq || S.hq, perimeter: Math.round(g.perimeter), area: routeType() ? 0 : Math.round(g.area), center: g.center } : undefined
      });
    };
    $('#lgToggle').innerHTML = ic('layers') + $('#lgToggle').textContent;
    $('#lgToggle').onclick = function () { $('#legend').classList.toggle('show'); };
    const zs = $('#zonesSec');
    zs.addEventListener('toggle', function () { if (zs.open && !$('#zones').children.length) HX.mountZones($('#zones'), 'zx'); });
  });

  function applyRouteChrome() {
    const route = routeType();
    if ($('#nupSec')) $('#nupSec').classList.toggle('hidden', route);
    if ($('#hPl')) $('#hPl').textContent = route ? 'Йўналиш' : 'Периметр';
    if ($('#hSl')) $('#hSl').textContent = route ? 'Ички патрул' : 'Майдон';
    if ($('#hSu')) $('#hSu').textContent = route ? '' : 'м²';
    if (route && $('#hS')) $('#hS').textContent = 'йўқ';
    if (route && pm && pm.objectMode) pm.setObjectMode(false);
    const internal = internalOnly();
    const emptyH = $('#emptyMap h3'), emptyP = $('#emptyMap .box p');
    if (emptyH) emptyH.textContent = route ? 'Йўналишни чизинг' : (internal ? 'Майдонни белгиланг' : 'Ҳудудни чизинг');
    if (emptyP) emptyP.textContent = route ? 'Йўл бўйлаб чизиқ тортинг — фақат пост патруллари қўйилади. Ички патрул йўқ.' : (internal ? 'Майдонни полигон билан чизинг. Фақат ички патруллар қўйилади, пост патруллари йўқ.' : '«Қўлда чизиш»ни босинг ва ҳудуд чегарасини нуқталар билан белгиланг.');
    const hint = $('#tHint');
    if (hint) hint.textContent = route ? 'Йўл бўйлаб чизиқ тортинг: камида 2 нуқта. Чизиқ ёпилмайди, ички патрул қўйилмайди.' : (internal ? 'Майдонни полигон билан чизинг. Пост патруллари қўйилмайди, фақат ички патрул қолади.' : '«Қўлда чизиш»ни босинг ва ҳудуд чегарасини нуқталар билан белгиланг. Нуқталарни суриш ва ўнг тугма билан ўчириш мумкин.');
    const sampleBtn = $('#tSample');
    if (sampleBtn && !pm.drawing) sampleBtn.innerHTML = ic('sparkles') + (route ? 'Намуна йўналиш' : 'Намуна ҳудуд');
    syncCrowdUi();
    syncOverlays();
  }
  function syncOverlays() {
    const gate = $('#typeGate');
    const empty = $('#emptyMap');
    const has = S.latlngs && S.latlngs.length >= needPts();
    if (gate) gate.classList.toggle('hidden', !!S.picked);
    if (empty) empty.classList.toggle('hidden', !S.picked || has || !!(pm && pm.drawing));
  }
  function setupTypeGate() {
    const box = $('#typePick'); if (!box) return;
    let pending = S.type || '';
    let pendingMode = S.mode || '';
    function paint() {
      box.innerHTML = HXCalc.EVENT_TYPES.map(function (tp) {
        const mode = tp.modes ? '' : HXCalc.MODE_LABELS[tp.mode];
        return '<button type="button" class="btn type-opt' + (pending === tp.id ? ' on' : '') + '" data-t="' + tp.id + '"><b>' + tp.label + '</b><span>' + (tp.modes ? 'Барча режим' : mode) + '</span></button>';
      }).join('');
      $$('#typePick .type-opt').forEach(function (b) {
        b.onclick = function () {
          pending = b.dataset.t;
          const meta = typeMeta(pending);
          pendingMode = meta.modes ? (meta.modes.indexOf(pendingMode) > -1 ? pendingMode : '') : (meta.mode || 'perimeter');
          paint();
        };
      });
      const meta = typeMeta(pending);
      const modes = $('#modePick');
      const ok = $('#typeOk');
      if (modes) {
        if (meta.modes) {
          modes.classList.remove('hidden');
          modes.innerHTML = '<div class="label" style="margin-bottom:6px">Ишлаш режими</div><div class="seg">' + meta.modes.map(function (m) {
            return '<button type="button" data-m="' + m + '" class="' + (pendingMode === m ? 'on' : '') + '">' + HXCalc.MODE_LABELS[m] + '</button>';
          }).join('') + '</div>';
          $$('#modePick button').forEach(function (b) { b.onclick = function () { pendingMode = b.dataset.m; paint(); }; });
        } else modes.classList.add('hidden');
      }
      if (ok) ok.disabled = !pending || (meta.modes && !pendingMode);
    }
    paint();
    $('#typeOk').onclick = function () {
      if (!pending) return;
      const prevRoute = routeType();
      S.type = pending;
      S.mode = pendingMode;
      S.picked = true;
      const nowRoute = routeType();
      if ($('#pType')) $('#pType').value = pending;
      if (prevRoute !== nowRoute && pm) {
        if (nowRoute) { S.crowd = 'open'; S.entrances = 0; }
        pm.setKind(nowRoute ? 'route' : 'area');
        S.latlngs = []; S.gates = []; S.posts = []; S.hq = null;
      }
      persist();
      applyRouteChrome();
      update('none');
      setMapMax(false);
      HX.toast(HXCalc.MODE_LABELS[activeMode()] || '', typeMeta().label, 'ok', 2200);
    };
    syncOverlays();
  }
  function setupTerm() {
    function note() {
      const term = S.term;
      const el = $('#termNote'); if (!el) return;
      if (term.kind === 'period') {
        if (term.from && term.to && term.to < term.from) el.textContent = 'Тугаш сана бошланиш санасидан кейин бўлиши керак.';
        else if (term.from && term.to) el.textContent = 'Муддатли шартнома: ' + HX.date(term.from) + ' дан ' + HX.date(term.to) + ' гача (' + HXCalc.termDays(term) + ' кун).';
        else el.textContent = 'Бошланиш ва тугаш санасини кун.ой.йил кўринишида белгиланг.';
      } else el.textContent = 'Бир марталик тадбир: қиймат кўрсатилган соатлар бўйича.';
    }
    function paint() {
      $$('#termKind button').forEach(function (b) { b.classList.toggle('on', b.dataset.k === S.term.kind); });
      const period = $('#termPeriod');
      if (period) period.classList.toggle('hidden', S.term.kind !== 'period');
      const from = $('#termFrom'), to = $('#termTo');
      if (from && document.activeElement !== from) from.value = S.term.from || '';
      if (to && document.activeElement !== to) to.value = S.term.to || '';
      note();
    }
    $$('#termKind button').forEach(function (b) {
      b.onclick = function () { S.term.kind = b.dataset.k; persist(); paint(); update('none'); };
    });
    ['termFrom', 'termTo'].forEach(function (id) {
      const el = $('#' + id);
      if (!el) return;
      el.addEventListener('change', function () {
        S.term[id === 'termFrom' ? 'from' : 'to'] = this.value;
        persist(); note(); update('none');
      });
    });
    paint();
  }
  function syncCrowdUi() {
    $$('#pCrowd button').forEach(function (b) { b.classList.toggle('on', b.dataset.c === S.crowd); });
    const lab = $('#pAttL');
    const att = $('#pAtt');
    if (lab) lab.textContent = S.crowd === 'open' ? 'Тахминий иштирокчилар сони' : 'Чекланган иштирокчилар сони';
    if (att) att.placeholder = S.crowd === 'open' ? 'Масалан: 12000' : 'Аниқ сон';
  }
  function persist() { HX.store.set('hx.calcState', S); }
  function syncEntrances() {
    const inp = $('#pEnt'), n = (S.gates || []).length;
    if (n) { inp.value = n; inp.disabled = true; inp.title = t('Харитада белгиланган НЎП сони'); }
    else { inp.disabled = false; inp.value = S.entrances; inp.title = ''; }
  }
  function calcInput(P, A) {
    const route = routeType();
    return Object.assign({}, S, { mode: activeMode(), shape: route ? 'route' : 'area', entrances: route ? 0 : ((S.gates && S.gates.length) || S.entrances), perimeter: P, area: route ? 0 : A, crowd: S.crowd, term: S.term });
  }

  function setupControls() {
    $('#region').innerHTML = HX.REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (S.region === r.id ? ' selected' : '') + '>' + r.name + '</option>'; }).join('');
    $('#pType').innerHTML = HXCalc.EVENT_TYPES.map(function (x) { return '<option value="' + x.id + '"' + (S.type === x.id ? ' selected' : '') + '>' + x.label + '</option>'; }).join('');
    $('#pVenue').innerHTML = Object.values(HXCalc.VENUES).map(function (v) { return '<option value="' + v.id + '"' + (S.venue === v.id ? ' selected' : '') + '>' + v.label + '</option>'; }).join('');
    $('#pCat').innerHTML = Object.values(HXCalc.CATEGORIES).map(function (c) { return '<option value="' + c.id + '"' + (S.category === c.id ? ' selected' : '') + '>' + c.label.replace(' объекти', '').replace(' тадбир', '') + '</option>'; }).join('');
    $('#pEnt').value = S.entrances; $('#pStart').value = S.startTime; $('#pDur').value = S.duration; $('#pAtt').value = S.attendees;
    $('#pFactors').innerHTML = HXCalc.FACTORS.filter(function (f) { return !f.auto; }).map(function (f) { return '<button type="button" data-f="' + f.id + '" class="' + (S.factors.indexOf(f.id) > -1 ? 'on' : '') + '" data-tip="' + HX.esc(t('Хавф коэффициентига +' + HX.fmtDec(f.add, 2))) + '">' + f.label + '</button>'; }).join('');
    $('#region').onchange = function () { S.region = this.value; persist(); pm.map.flyTo(HX.region(S.region).c, 16, { duration: 1.6 }); };
    const bindv = function (id, key, num) { $(id).addEventListener(num ? 'input' : 'change', function () { S[key] = num ? (this.value === '' ? '' : +this.value) : this.value; persist(); update('soft'); }); };
    $('#pType').addEventListener('change', function () {
      const prev = routeType();
      const meta = typeMeta(this.value);
      S.type = this.value;
      if (!meta.modes) S.mode = meta.mode || 'perimeter';
      else if (meta.modes.indexOf(S.mode) < 0) S.mode = '';
      S.picked = !!S.type && !!activeMode();
      if (meta.modes && !S.mode) {
        S.picked = false;
        persist();
        setupTypeGate();
        applyRouteChrome();
        return;
      }
      const now = routeType();
      if (prev !== now && pm) {
        if (now) { S.crowd = 'open'; S.entrances = 0; }
        pm.setKind(now ? 'route' : 'area');
        S.latlngs = []; S.gates = []; S.posts = []; S.hq = null;
        $('#objCard').classList.add('hidden');
        HX.toast(now ? 'Йўналиш режими' : (internalOnly() ? 'Майдон режими' : 'Периметр режими'), now ? 'Чизиқ бўйлаб белгиланг. Фақат пост патруллари, ички патрул йўқ.' : (internalOnly() ? 'Майдонни полигон билан белгиланг. Фақат ички патруллар, пост патруллари йўқ.' : 'Ҳудуд периметри яна полигон билан чизилади.'), 'info', 3200);
      }
      persist();
      applyRouteChrome();
      update('none');
    });
    bindv('#pVenue', 'venue'); bindv('#pCat', 'category'); bindv('#pStart', 'startTime');
    $$('#pCrowd button').forEach(function (b) {
      b.onclick = function () { S.crowd = b.dataset.c; persist(); syncCrowdUi(); update('soft'); };
    });
    syncCrowdUi();
    bindv('#pEnt', 'entrances', true); bindv('#pDur', 'duration', true); bindv('#pAtt', 'attendees', true);
    $$('#pFactors button').forEach(function (b) {
      b.onclick = function () {
        const f = b.dataset.f; b.classList.toggle('on');
        S.factors = S.factors.filter(function (x) { return x !== f; }); if (b.classList.contains('on')) S.factors.push(f);
        persist(); update('soft');
      };
    });
  }

  function hud(P, A, total) {
    const live = total == null;
    HX.countUp($('#hP'), P, { dur: live ? 1 : 500 });
    if (routeType()) { if ($('#hS')) $('#hS').textContent = 'йўқ'; }
    else HX.countUp($('#hS'), A, { dur: live ? 1 : 500 });
    const r = HXCalc.compute(calcInput(P, A));
    HX.countUp($('#hC'), r.capacity, { dur: live ? 1 : 500 });
    HX.countUp($('#hN'), live ? r.total : total, { dur: live ? 1 : 700 });
  }

  function deploy(animate) {
    if (!res || !res.total || S.latlngs.length < needPts()) { pm.clearDeploy(); return; }
    const info = pm.deploy(res, { animate: animate, gates: S.gates, posts: (S.posts && S.posts.length) ? S.posts : null, hq: S.hq });
    if (pm.manualPosts && pm.manualPosts.length && (!S.posts || S.posts.length !== pm.manualPosts.length)) {
      S.posts = pm.manualPosts.map(function (p) { return [p[0], p[1]]; });
      persist();
    }
    applyLegend();
    if (info) $('#rSector').textContent = t(info.sectors + ' та патруль сектори · ' + info.patrols + ' наряд');
  }

  function update(mode) {
    const g = pm.geometry();
    const P = Math.round(g.perimeter), A = Math.round(g.area);
    res = HXCalc.compute(calcInput(P, A));
    hud(P, A, res.total);
    HX.countUp($('#rTotal'), res.total, { dur: 700 });
    $('#rRisk').innerHTML = res.total ? HX.riskBadge(res.risk.id) : '';
    $('#rSub').innerHTML = res.total ? 'K = ' + HX.fmtDec(res.K, 2) + ' · ' + res.shifts + ' навбат · ' + HX.fmt(res.personHours) + ' киши-соат<br><span id="rSector"></span>' : (routeType() ? 'Йўналиш белгиланмаган — чизиқ бўйлаб пост патрули' : (internalOnly() ? 'Майдон белгиланмаган — фақат ички патрул ҳисобланади' : 'Ҳудуд белгиланмаган — харитада периметрни чизинг'));
    const max = Math.max.apply(null, res.parts.map(function (p) { return p.value; })) || 1;
    const bars = $('#rBars');
    const sig = res.parts.map(function (p) { return p.id + p.label; }).join('|');
    if (bars.dataset.sig !== sig) { bars.dataset.sig = sig; bars.innerHTML = res.parts.map(function (p) { return '<div class="bar-row" data-id="' + p.id + '" style="grid-template-columns:135px 1fr 40px"><span>' + p.label + '</span><div class="track"><div class="fill" style="background:' + HX.PART_COLORS[p.id] + '"></div></div><b>0</b></div>'; }).join(''); }
    res.parts.forEach(function (p) {
      const row = bars.querySelector('[data-id="' + p.id + '"]');
      row.querySelector('.fill').style.width = (p.value / max * 100) + '%';
      row.querySelector('b').textContent = p.value;
      row.setAttribute('data-tip', '<b>' + HX.esc(t(p.label)) + '</b><br>' + HX.esc(t(p.formula)));
    });
    const ratio = res.attendees && res.total ? Math.round(res.attendees / res.total) : 0;
    const attLabel = res.crowd === 'open' ? 'тахминий' : (res.attSource === 'auto' ? 'сиғимдан' : 'чекланган');
    const termBit = res.termDays > 1 ? ' · ' + res.termDays + ' кун' : '';
    $('#rKv').innerHTML = res.total ? (res.shape === 'route'
      ? '<dt>Йўналиш</dt><dd>' + HX.fmt(res.perimeter) + ' м</dd><dt>Ички патрул</dt><dd>йўқ</dd><dt>Иштирокчилар</dt><dd>' + HX.fmt(res.attendees) + ' (' + attLabel + ')</dd><dt>Наряд</dt><dd>' + res.patrols + '</dd><dt>Масъул орган</dt><dd>' + res.category.body + '</dd><dt>Тахминий қиймат</dt><dd style="color:var(--accent)">' + HX.money(res.cost) + termBit + '</dd>'
      : '<dt>Ўртача сиғим</dt><dd>' + HX.fmt(res.capacity) + ' киши</dd><dt>Зичлик</dt><dd>' + HX.fmtDec(res.type.density, 2) + ' киши/м²</dd><dt>Иштирокчилар</dt><dd>' + HX.fmt(res.attendees) + ' (' + attLabel + ')</dd><dt>1 ходимга</dt><dd>≈ ' + HX.fmt(ratio) + ' иштирокчи</dd><dt>Металлодетектор рамкаси</dt><dd>' + res.frames + '</dd><dt>НЎП</dt><dd>' + res.entrances + (S.gates.length ? ' (харитада)' : '') + '</dd><dt>Масъул орган</dt><dd>' + res.category.body + '</dd><dt>Тахминий қиймат</dt><dd style="color:var(--accent)">' + HX.money(res.cost) + termBit + '</dd>') : '';
    $('#rWarn').innerHTML = res.warnings.filter(function (w) { return w.level !== 'info'; }).map(function (w) { return '<div class="warn-item ' + w.level + '">' + ic('alert') + '<span>' + w.text + '</span></div>'; }).join('');
    $('#rDeploy').disabled = !res.total;
    legend();
    clearTimeout(deployTimer);
    if (!res.total || g.latlngs.length < needPts()) { pm.clearDeploy(); return; }
    if (mode === 'animate') deployTimer = setTimeout(function () { deploy(true); }, 350);
    else if (mode === 'soft') deployTimer = setTimeout(function () { deploy(false); }, 250);
  }

  /* ---------- Иллюстрацияли легенда (қатламларни ёқиш/ўчириш) ---------- */
  const off = {};
  function legend() {
    const items = HXGeo.legendItems(res && res.total ? res : null);
    $('#legend').innerHTML = '<div class="ill-legend">' + items.map(function (it) {
      return '<button type="button" data-l="' + it.k + '" class="' + (off[it.k] ? 'off' : '') + '">' + HXGeo.legendSwatch(it) + '<span>' + it.label + '</span>' + (it.n != null ? '<b>' + it.n + '</b>' : '') + '</button>';
    }).join('') + '</div>';
    $$('#legend button').forEach(function (b) { b.onclick = function () { off[b.dataset.l] = !off[b.dataset.l]; b.classList.toggle('off'); pm.setLayer(b.dataset.l, !off[b.dataset.l]); }; });
  }
  function applyLegend() { for (const k in off) pm.setLayer(k, !off[k]); }
})();
