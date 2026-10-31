/* =========================================================
   Хизматга жалб этиладиган ходимлар сонини ҳисоблаш методикаси
   ---------------------------------------------------------
   Ҳуқуқий асос:
   • ВМ 29.07.2014 й. 205-сон қарори, 1-илова (Оммавий тадбирларни ўтказиш қоидалари):
     3-банд (100+ киши), 15-банд (тоифалар ва масъул орган),
     15-1-банд (пуллик хизмат, 1 киши-соат = БҲМ × 7%, шартнома 10 иш куни олдин),
     61-банд (чипталар сиғимга мос), 69-банд (куч ва воситалар тадбир кўлами ва
     иштирокчилар сонига қараб жалб этилади), 70-банд (периметр, кўрик, захира).
   • Қўриқлаш-патруль хизмати лойиҳаси (regulation.gov.uz, 2023): наряд 2–3 ходим.
   Норматив коэффициентлар — тавсиявий, «Мониторинг → Методика» бўлимида
   ваколатли орган томонидан ўзгартирилади.
   ========================================================= */
(function (global) {
  'use strict';

  const NORMS_KEY = 'hx.norms.v2'; // 2-версия: реал амалиётга яқинлаштирилган меъёрлар

  const DEFAULT_NORMS = {
    bhm: 440000,            // БҲМ, сўм (2026 йил 1 сентябрдан)
    rateShare: 0.07,        // 1 киши-соат = БҲМ × 7% (ВМ-205, 15-1-банд)
    minShare: 0.5,          // шартнома энг кам қиймати улуши (15-1-банд)
    spacing: { open: 100, fenced: 150, indoor: 200 }, // периметр постлари оралиғи, м (кўриш масофаси)
    usableShare: 0.7,       // майдоннинг иштирокчилар учун фойдали улуши (йўлак, саҳна, хизмат зонаси чиқарилган)
    frameThroughput: 800,   // 1 металлодетектор рамкаси ўтказувчанлиги, киши/соат
    arrivalWindow: 2,       // иштирокчиларнинг келиш даври, соат
    frameStaff: 1,          // 1 рамкага оператор
    entranceSupervisor: 2,  // ҳар бир НЎП: назоратчи + қўл билан кўрик
    patrolSize: 2,          // патруль наряди таркиби
    reserveShare: 0.10,     // тезкор захира (70-банд)
    commanderRatio: 10,     // 1 командир / 10 ходим
    shiftHours: 8,          // битта навбат давомийлиги
    trafficSpacing: 600,    // йўл ҳаракати постлари оралиғи, м
    routeSpacing: 250,      // йўналиш патрули: нарядлар оралиғи, м (йўл бўйлаб)
    k9Threshold: 10000,     // кинологлар жалб қилиш чегараси, киши
    kMax: 1.6               // хавф коэффициентининг юқори чегараси
  };

  // density — бутун объект бўйича ўртача (реал) зичлик, киши/м².
  // Максимал тиқилинч эмас: концертда олд қатор 3–4 киши/м² га етади,
  // лекин майдон, йўлак ва саҳна билан бирга ўртача ≈ 0,9.
  const EVENT_TYPES = [
    { id: 'concert',  label: 'Концерт / шоу дастури',     icon: 'music',    density: 0.90, areaPer: 2500, crowdPer: 400, risk: 0.10, mode: 'perimeter' },
    { id: 'holiday',  label: 'Умумхалқ байрами / сайил',   icon: 'flag',     density: 0.55, areaPer: 3000, crowdPer: 500, risk: 0.10, mode: 'perimeter' },
    { id: 'festival', label: 'Фестиваль / маданий тадбир', icon: 'star',     density: 0.42, areaPer: 3000, crowdPer: 500, risk: 0.08, mode: 'perimeter' },
    { id: 'park',     label: 'Истирохат боғлари / ҳиёбон', icon: 'sun',      density: 0.20, areaPer: 4500, crowdPer: 900, risk: 0.04, mode: 'area' },
    { id: 'forum',    label: 'Конференция / форум',        icon: 'mic',      density: 0.38, areaPer: 2000, crowdPer: 400, risk: 0.05, mode: 'perimeter' },
    { id: 'fair',     label: 'Кўргазма / ярмарка',         icon: 'store',    density: 0.28, areaPer: 3500, crowdPer: 700, risk: 0.03, mode: 'perimeter' },
    { id: 'market',   label: 'Савдо мажмуаси / бозор',     icon: 'store',    density: 0.18, areaPer: 4000, crowdPer: 800, risk: 0.06, mode: 'area' },
    { id: 'opening',  label: 'Очилиш маросими',            icon: 'sparkles', density: 0.45, areaPer: 2800, crowdPer: 450, risk: 0.07, mode: 'perimeter' },
    { id: 'sport',    label: 'Спорт мусобақаси',           icon: 'trophy',   density: 0.55, areaPer: 2500, crowdPer: 350, risk: 0.15, mode: 'perimeter' },
    { id: 'marathon', label: 'Марафон',                    icon: 'flag',     density: 0.12, areaPer: 8000, crowdPer: 250, risk: 0.08, mode: 'route' },
    { id: 'private',  label: 'Хусусий маросим',            icon: 'gift',     density: 0.32, areaPer: 3000, crowdPer: 600, risk: 0.00, mode: 'perimeter' },
    { id: 'other',    label: 'Бошқа турдаги тадбир',       icon: 'layers',   density: 0.40, areaPer: 3000, crowdPer: 500, risk: 0.06, modes: ['perimeter', 'area', 'route'] }
  ];
  const MODE_LABELS = { perimeter: 'Периметр режими', area: 'Майдон режими', route: 'Йўналиш режими' };
  function workMode(type, inp) {
    inp = inp || {};
    if (type && type.modes && type.modes.length) {
      return type.modes.indexOf(inp.mode) > -1 ? inp.mode : type.modes[0];
    }
    return (type && type.mode) || 'perimeter';
  }
  function termDays(term) {
    if (!term || term.kind !== 'period' || !term.from || !term.to) return 1;
    const a = Date.parse(term.from + 'T00:00:00');
    const b = Date.parse(term.to + 'T00:00:00');
    if (!isFinite(a) || !isFinite(b) || b < a) return 1;
    return Math.round((b - a) / 86400000) + 1;
  }

  const VENUES = {
    open:   { id: 'open',   label: 'Очиқ ҳудуд (тўсиқсиз)',            barriers: true },
    fenced: { id: 'fenced', label: 'Очиқ ҳудуд (тўсиқ билан ўралган)', barriers: false },
    indoor: { id: 'indoor', label: 'Ёпиқ иншоот (арена, зал, стадион)', barriers: false }
  };

  const FACTORS = [
    { id: 'vip',     label: 'VIP шахслар / хорижий делегациялар',   add: 0.15 },
    { id: 'fans',    label: 'Мухлислар (фанат) гуруҳлари иштироки',  add: 0.20 },
    { id: 'kids',    label: 'Болалар кўп иштирок этади',             add: 0.05 },
    { id: 'pyro',    label: 'Пиротехника / саҳна эффектлари',        add: 0.05 },
    { id: 'traffic', label: 'Йирик автотураргоҳ / транспорт оқими',  add: 0.03 },
    { id: 'media',   label: 'Тўғридан-тўғри трансляция / ОАВ',       add: 0.03 },
    { id: 'night',   label: 'Тунги вақт (22:00–06:00)',              add: 0.08, auto: true }
  ];

  const CATEGORIES = {
    '1':       { id: '1',       label: 'Биринчи тоифа объекти',   body: 'Миллий гвардия ҳудудий бўлинмаси', paid: true,  ref: 'ВМ-205, 15-банд' },
    '2':       { id: '2',       label: 'Иккинчи тоифа объекти',   body: 'Миллий гвардия ҳудудий бўлинмаси', paid: true, ref: 'ВМ-205, 15-банд' },
    'special': { id: 'special', label: 'Махсус тоифадаги тадбир', body: 'Миллий гвардия (махсус тартиб)', paid: false, ref: 'ВМ-205, 15-1-банд: пуллик эмас' }
  };

  const RISK_LEVELS = [
    { id: 'low',      max: 1.10,     label: 'Паст',       color: 'var(--good)',     ink: 'var(--good-ink)' },
    { id: 'medium',   max: 1.25,     label: 'Ўрта',       color: 'var(--warning)',  ink: 'var(--warning)' },
    { id: 'high',     max: 1.40,     label: 'Юқори',      color: 'var(--serious)',  ink: 'var(--serious)' },
    { id: 'critical', max: Infinity, label: 'Жуда юқори', color: 'var(--critical)', ink: 'var(--critical-ink)' }
  ];

  /* ---------- нормаларни сақлаш ---------- */
  function deepMerge(base, over) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!over || typeof over !== 'object') return out;
    Object.keys(over).forEach(function (k) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object') out[k] = deepMerge(base[k], over[k]);
      else if (over[k] !== undefined && over[k] !== null && over[k] !== '') out[k] = over[k];
    });
    return out;
  }
  function getNorms() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(NORMS_KEY) || 'null'); } catch (e) { saved = global.__hxNorms || null; }
    return deepMerge(DEFAULT_NORMS, saved);
  }
  function setNorms(n) {
    global.__hxNorms = n;
    try { localStorage.setItem(NORMS_KEY, JSON.stringify(n)); } catch (e) { /* хотирада қолади */ }
  }
  function resetNorms() {
    global.__hxNorms = null;
    try { localStorage.removeItem(NORMS_KEY); } catch (e) {}
  }

  /* ---------- ёрдамчи функциялар ---------- */
  const fmt = function (n) { return Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  const clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function parseTime(t) {
    if (!t) return 10;
    const m = String(t).match(/(\d{1,2}):?(\d{2})?/);
    return m ? (+m[1] + (+m[2] || 0) / 60) : 10;
  }
  function isNight(startH, duration) {
    // тадбир 22:00–06:00 оралиғига тўғри келадими
    for (let h = startH; h < startH + duration; h += 0.5) {
      const hh = ((h % 24) + 24) % 24;
      if (hh >= 22 || hh < 6) return true;
    }
    return false;
  }
  function workingDaysUntil(dateStr, from) {
    if (!dateStr) return null;
    const start = from ? new Date(from) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr + 'T00:00:00');
    if (isNaN(end)) return null;
    let d = new Date(start), n = 0;
    while (d < end) {
      d.setDate(d.getDate() + 1);
      if (d < end && d.getDay() !== 0 && d.getDay() !== 6) n++;
    }
    return end < start ? -1 : n;
  }
  function riskLevel(K) { return RISK_LEVELS.find(function (r) { return K < r.max; }); }

  /* ---------- асосий ҳисоб ---------- */
  function compute(inp, normsOverride) {
    const N = normsOverride || getNorms();
    inp = inp || {};
    const type = EVENT_TYPES.find(function (t) { return t.id === inp.type; }) || EVENT_TYPES[0];
    const venue = VENUES[inp.venue] || VENUES.open;
    const cat = CATEGORIES[inp.category] || CATEGORIES['1'];
    const mode = workMode(type, inp);
    const route = mode === 'route';
    const internalOnly = mode === 'area';
    const postsOnly = route;
    const P = Math.max(0, +inp.perimeter || 0);
    const S = route ? 0 : Math.max(0, +inp.area || 0);
    const entrances = route ? clamp(Math.round(+inp.entrances || 0), 0, 60) : clamp(Math.round(+inp.entrances || 1), 1, 60);
    const duration = clamp(+inp.duration || 1, 1, 72);
    const crowd = inp.crowd === 'open' ? 'open' : 'limited';
    const factors = new Set((inp.factors || []).filter(function (f) { return f !== 'night'; }));
    const warnings = [];

    const night = isNight(parseTime(inp.startTime), duration);
    if (night) factors.add('night');

    // 1. Ўртача сиғим (максимал тиқилинч эмас): фойдали майдон × реал ўртача зичлик
    const capacity = Math.floor(S * N.usableShare * type.density);
    let attendees = Math.round(+inp.attendees || 0);
    let attSource = crowd === 'open' ? 'approx' : 'limited';
    if (!attendees) {
      attendees = capacity;
      attSource = crowd === 'open' ? 'auto-approx' : 'auto';
    }
    if (!route && P > 0 && S > (P * P) / (4 * Math.PI) * 1.002) {
      warnings.push({ level: 'critical', text: 'Киритилган майдон шу периметр учун геометрик жиҳатдан мумкин эмас (S ≤ P² / 4π). Қийматларни текширинг.' });
    }
    if (!route && crowd === 'limited' && attSource === 'limited' && capacity > 0 && attendees > capacity) {
      warnings.push({ level: 'serious', text: 'Чекланган иштирокчилар (' + fmt(attendees) + ') майдон сиғимидан (' + fmt(capacity) + ') ошади. ВМ-205, 61-банд: чипталар сони объект сиғимига мос бўлиши шарт.' });
    }
    if (!route && crowd === 'open' && attSource === 'approx' && capacity > 0 && attendees > capacity) {
      warnings.push({ level: 'warning', text: 'Чекланмаган оқим: тахминий сон (' + fmt(attendees) + ') майдон сиғимидан (' + fmt(capacity) + ') юқори. Бу аниқ рўйхат эмас — захирани кўриб чиқинг.' });
    }
    if (!route && attendees > 0 && attendees < 100) {
      warnings.push({ level: 'warning', text: 'Иштирокчилар 100 нафардан кам — ВМ-205, 3-банд бўйича оммавий тадбир ҳисобланмайди.' });
    }
    const crowdDensity = S > 0 ? attendees / S : 0;

    // 2. Хавф коэффициенти
    let K = 1 + type.risk;
    const kTrace = [{ label: 'Тадбир тури: ' + type.label, add: type.risk }];
    FACTORS.forEach(function (f) {
      if (factors.has(f.id)) { K += f.add; kTrace.push({ label: f.label, add: f.add }); }
    });
    if (crowdDensity > 2.5) { K += 0.10; kTrace.push({ label: 'Юқори зичлик (> 2,5 киши/м²)', add: 0.10 }); }
    else if (attendees >= 20000) { K += 0.05; kTrace.push({ label: 'Йирик оломон (20 000+)', add: 0.05 }); }
    K = Math.round(Math.min(K, N.kMax) * 100) / 100;
    const level = riskLevel(K);

    // 3. Таркибий қисмлар (асос)
    const spacing = N.spacing[venue.id];
    const routeSpacing = N.routeSpacing || 250;
    const routeRaw = route && P > 0 ? Math.max(1, Math.ceil(P / routeSpacing)) : 0;
    const perimBase = internalOnly ? 0 : (route ? routeRaw * N.patrolSize : (P > 0 ? Math.ceil(P / spacing) : 0));
    const areaStaff = S > 0 ? Math.ceil(S / type.areaPer) : 0;
    const crowdStaff = attendees > 0 ? Math.ceil(attendees / type.crowdPer) : 0;
    const internalBase = postsOnly ? 0 : Math.ceil(Math.max(areaStaff, crowdStaff) / N.patrolSize) * N.patrolSize;
    const frames = (!route || entrances > 0) ? Math.max(entrances, Math.ceil(attendees / (N.frameThroughput * N.arrivalWindow))) : 0;
    const cpBase = frames * N.frameStaff + entrances * N.entranceSupervisor;
    const trafficBase = factors.has('traffic') ? (route ? Math.max(1, Math.ceil(P / N.trafficSpacing)) : Math.ceil(P / N.trafficSpacing) + 2) : 0;

    // 4. Хавф коэффициенти билан
    const routeN = route ? Math.ceil(routeRaw * K) : 0;
    const perimVal = internalOnly ? 0 : (route ? routeN * N.patrolSize : Math.ceil(perimBase * K));
    const internalVal = postsOnly ? 0 : Math.ceil((internalBase * K) / N.patrolSize) * N.patrolSize;
    const cpVal = Math.ceil(cpBase * K);
    const trafficVal = Math.ceil(trafficBase * K);
    const operational = perimVal + internalVal + cpVal + trafficVal;
    const reserve = operational > 0 ? Math.ceil(operational * N.reserveShare) : 0;
    const k9 = (attendees >= N.k9Threshold || factors.has('vip')) && operational > 0 ? 2 : 0;
    const commanders = operational > 0 ? Math.ceil((operational + reserve + k9) / N.commanderRatio) + 1 : 0;
    const total = operational + reserve + k9 + commanders;

    const parts = [
      { id: 'perimeter',  label: route ? 'Пост патруллари' : 'Периметр постлари', value: perimVal, base: perimBase, formula: internalOnly ? 'Майдон режимида пост патрули қўлланилмайди' : (route ? (routeN + ' наряд × ' + N.patrolSize + ' ходим · ⌈' + fmt(P) + ' м ÷ ' + routeSpacing + ' м⌉ × K') : ('⌈' + fmt(P) + ' м ÷ ' + spacing + ' м⌉ = ' + perimBase + ' → × K')) },
      { id: 'internal',   label: 'Ички ҳудуд патруллари',    value: internalVal, base: internalBase, formula: postsOnly ? 'Бу хизматда ички патрул қўлланилмайди' : ('max(⌈' + fmt(S) + ' м² ÷ ' + type.areaPer + '⌉ = ' + areaStaff + '; ⌈' + fmt(attendees) + ' ÷ ' + type.crowdPer + '⌉ = ' + crowdStaff + ') → ' + N.patrolSize + ' кишилик нарядлар × K') },
      { id: 'checkpoint', label: 'НЎП ва кўрик (кириш)',     value: cpVal,       base: cpBase,       formula: frames + ' рамка × ' + N.frameStaff + ' + ' + entrances + ' НЎП × ' + N.entranceSupervisor + ' = ' + cpBase + ' → × K' },
      { id: 'traffic',    label: 'Йўл ҳаракати постлари',    value: trafficVal,  base: trafficBase,  formula: trafficBase ? '⌈' + fmt(P) + ' ÷ ' + N.trafficSpacing + '⌉ + 2 = ' + trafficBase + ' → × K' : 'Танланмаган' },
      { id: 'reserve',    label: 'Тезкор захира',            value: reserve,     base: reserve,      formula: Math.round(N.reserveShare * 100) + '% × ' + operational },
      { id: 'k9',         label: 'Кинолог мутахассислар',   value: k9,          base: k9,           formula: k9 ? (factors.has('vip') ? 'VIP иштироки' : fmt(N.k9Threshold) + '+ иштирокчи') : 'Талаб этилмайди' },
      { id: 'command',    label: 'Командирлар ва штаб',      value: commanders,  base: commanders,   formula: '⌈' + (operational + reserve + k9) + ' ÷ ' + N.commanderRatio + '⌉ + 1 масъул раҳбар' }
    ];

    // 5. Вақт ва қиймат
    const days = termDays(inp.term);
    const shifts = Math.ceil(duration / N.shiftHours);
    const personsTotal = total * shifts * days;
    const personHours = total * duration * days;
    const rate = Math.round(N.bhm * N.rateShare);
    const cost = cat.paid ? personHours * rate : 0;
    const minCost = Math.round(cost * N.minShare);

    // 6. Техник воситалар
    const tech = {
      frames: frames,
      handDetectors: frames + entrances,
      radios: total,
      barriers: route ? 0 : (venue.barriers ? Math.ceil(P / 2.5) : 0),
      cameras: route ? (P > 0 ? Math.ceil(P / 400) : 0) : (S > 0 ? Math.ceil(S / 2500) + entrances * 2 : 0),
      vehicles: total > 0 ? Math.max(1, Math.ceil(total / 25)) : 0
    };

    // 7. Муддат назорати (15-1-банд)
    let workDays = null;
    if (inp.date) {
      workDays = workingDaysUntil(inp.date);
      if (workDays !== null && workDays < 0) warnings.push({ level: 'critical', text: 'Тадбир санаси ўтиб кетган.' });
      else if (workDays !== null && workDays < 10) warnings.push({ level: 'serious', text: 'Шартнома тадбир бошланишидан камида 10 иш куни олдин тузилиши керак (ВМ-205, 15-1-банд). Ҳозир: ' + workDays + ' иш куни қолган.' });
    }
    if (!cat.paid) warnings.push({ level: 'info', text: 'Махсус тоифадаги тадбирлар учун хизмат пуллик эмас (ВМ-205, 15-1-банд).' });

    return {
      input: Object.assign({}, inp, { factors: Array.from(factors) }),
      type: type, venue: venue, category: cat,
      shape: route ? 'route' : 'area', mode: mode, crowd: crowd,
      term: inp.term || null, termDays: days,
      perimeter: P, area: S, spacing: route ? routeSpacing : spacing,
      capacity: capacity, attendees: attendees, attSource: attSource, crowdDensity: crowdDensity,
      night: night, K: K, kTrace: kTrace, risk: level,
      parts: parts, operational: operational, reserve: reserve, k9: k9, commanders: commanders,
      total: total, patrols: route ? routeN : internalVal / N.patrolSize, posts: internalOnly ? 0 : (route ? routeN : perimVal), entrances: entrances,
      frames: frames, trafficPosts: trafficVal,
      duration: duration, shifts: shifts, personsTotal: personsTotal, personHours: personHours,
      rate: rate, cost: cost, minCost: minCost, tech: tech, workDays: workDays,
      warnings: warnings, norms: N
    };
  }

  /* аризада сақлаш учун ихчам натижа */
  function summarize(r) {
    return {
      total: r.total, operational: r.operational, reserve: r.reserve, commanders: r.commanders, k9: r.k9,
      shifts: r.shifts, personsTotal: r.personsTotal, personHours: r.personHours, rate: r.rate, cost: r.cost,
      shape: r.shape, crowd: r.crowd, attSource: r.attSource,
      K: r.K, risk: r.risk.id, attendees: r.attendees, capacity: r.capacity, patrols: r.patrols, posts: r.posts,
      frames: r.frames, tech: r.tech,
      parts: r.parts.map(function (p) { return { id: p.id, label: p.label, value: p.value }; })
    };
  }

  global.HXCalc = {
    DEFAULT_NORMS: DEFAULT_NORMS, EVENT_TYPES: EVENT_TYPES, MODE_LABELS: MODE_LABELS, VENUES: VENUES, FACTORS: FACTORS,
    workMode: workMode, termDays: termDays,
    CATEGORIES: CATEGORIES, RISK_LEVELS: RISK_LEVELS,
    getNorms: getNorms, setNorms: setNorms, resetNorms: resetNorms,
    compute: compute, summarize: summarize, riskLevel: riskLevel,
    workingDaysUntil: workingDaysUntil, isNight: isNight, parseTime: parseTime
  };
})(window);
