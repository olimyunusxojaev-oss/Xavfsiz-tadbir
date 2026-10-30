/* =========================================================
   Шартнома лойиҳасини шакллантириш (ВМ-205, 15-1-банд асосида намунавий шакл)
   Тиллар: ўзбек (кирилл; лотин — транслитерация), рус, инглиз
   ========================================================= */
(function (global) {
  'use strict';
  const HX = global.HX;
  const I18 = global.HXI18N;

  const TPL = {
    uz: {
      wm: 'ЛОЙИҲА', title: 'ШАРТНОМА № {no}', draftNo: 'Л-{id}',
      sub: 'оммавий тадбир ўтказилишида фуқаролар хавфсизлигини таъминлаш ва жамоат тартибини сақлаш тўғрисида',
      exec1: 'Ўзбекистон Республикаси Миллий гвардиясининг {region} бўйича ҳудудий бўлинмаси', exec2: 'Ички ишлар органларининг {region} бўйича ҳудудий бўлинмаси',
      pre: '{exec} (бундан буён матнда «Ижрочи» деб юритилади) бир томондан, ва <b>{org}</b> (бундан буён матнда «Буюртмачи» деб юритилади) {rep}иккинчи томондан, Вазирлар Маҳкамасининг 2014 йил 29 июлдаги 205-сон қарори билан тасдиқланган Оммавий тадбирларни ўтказиш қоидаларининг 15-1-бандига мувофиқ мазкур шартномани қуйидагилар ҳақида туздилар:',
      rep: '{name} номидан, ',
      h1: '1. Шартнома предмети',
      p11: '1.1. Ижрочи Буюртмачи томонидан ташкил этиладиган «{event}» оммавий тадбири (бундан буён — тадбир) ўтказилишида фуқаролар хавфсизлигини таъминлаш ва жамоат тартибини сақлаш бўйича хизмат кўрсатади, Буюртмачи эса ушбу хизмат ҳақини тўлайди.',
      p12: '1.2. Тадбир ўтказиладиган жой: {address}, {region}. Сана: {date}, {start} – {end} ({dur} соат). Объект тоифаси: {cat}.',
      p13: '1.3. Хизмат кўрсатиладиган ҳудуд: периметр — {P} м, майдон — {S} м², кириш нуқталари (НЎП) — {E} та, ҳисобланган сиғим — {C} киши. Ҳудуд чизмаси шартноманинг ажралмас қисми ҳисобланади (1-илова).',
      h2: '2. Жалб этиладиган куч ва воситалар', thPart: 'Таркибий қисм', thStaff: 'Ходим', total: 'Бир вақтда хизматдаги жами ходимлар',
      p21: '2.1. Навбатлар сони — {shifts} та; хизматга жалб этиладиган жами шахсий таркиб — {persons} нафар; жами {ph} киши-соат. Хавф коэффициенти — {K}.',
      p22: '2.2. Техник воситалар: металлодетектор рамкалари — {fr}, қўл металлодетекторлари — {hd}, радиостанциялар — {ra}{ba}, видеокамералар — {ca}, хизмат автотранспорти — {ve}.',
      ba: ', тўсиқ секциялари — {n}',
      h3: '3. Томонларнинг мажбуриятлари',
      p31: '3.1. Ижрочи: а) шартномада белгиланган ходимларни тадбир бошланишидан олдин жойлаштиради; б) периметр бўйлаб ўтказиш режимини ташкил этади, шахслар ва транспорт воситаларини техник воситалар ёрдамида кўрикдан ўтказади (70-банд); в) ҳуқуқбузарликларнинг олдини олади, зарур ҳолларда эвакуацияни ташкил этади (69-банд); г) хизмат давомида ходимлар фуқароларга мурожаат қилганда ўзини таништиради.',
      p32: '3.2. Буюртмачи: а) иштирокчиларни металлодетектор назорати қўлланилиши ҳақида олдиндан хабардор қилади ва чипталарга тақиқланган буюмлар рўйхатини туширади (61-банд); б) чипталарни объект сиғимига мос ҳолда сотади; в) эвакуация йўллари ва чиқиш жойларини бўш ҳолда сақлайди; г) хизмат ҳақини 4-бўлимда белгиланган тартибда тўлайди.',
      h4: '4. Хизмат қиймати ва ҳисоб-китоб тартиби',
      p41: '4.1. 1 (бир) киши-соат қиймати базавий ҳисоблаш миқдорининг {pct} фоизи — <b>{rate}</b>.',
      p42: '4.2. Шартноманинг умумий қиймати: {ph} киши-соат × {rateN} = <b>{cost}</b>.',
      p43: '4.3. Маблағ Ижрочининг бюджетдан ташқари махсус ҳисобварағига ўтказилади ва хизматга жалб этилган шахсий таркиб сонига мутаносиб тақсимланади (15-1-банд).',
      free: '4.1. Махсус тоифадаги тадбирлар учун хизмат пуллик эмас (15-1-банд).',
      h5: '5. Якуний қоидалар',
      p51: '5.1. Томонлар мажбуриятларни бажармаганлик учун қонунчиликка мувофиқ жавобгар бўлади. Низолар музокаралар йўли билан, келишувга эришилмаганда суд тартибида ҳал этилади.',
      p52: '5.2. Шартнома тадбир бошланишидан камида ўн иш куни олдин тузилади ва томонлар мажбуриятларини тўлиқ бажаргунига қадар амал қилади.',
      sExec: 'ИЖРОЧИ', sCust: 'БУЮРТМАЧИ', unit: '{region} бўйича ҳудудий бўлинма', tin: 'СТИР', signed: 'ЭРИ билан имзоланган',
      foot: 'Платформа прототипи орқали шакллантирилган намунавий шартнома. Юридик кучга эга эмас.',
      next: ' (кейинги кун)', money: function (n) { return HX.fmt(n) + ' сўм'; }, docTitle: 'Шартнома'
    },
    ru: {
      wm: 'ПРОЕКТ', title: 'ДОГОВОР № {no}', draftNo: 'П-{id}',
      sub: 'об обеспечении безопасности граждан и охране общественного порядка при проведении массового мероприятия',
      exec1: 'Территориальное подразделение Национальной гвардии Республики Узбекистан ({region})', exec2: 'Территориальное подразделение органов внутренних дел ({region})',
      pre: '{exec} (далее — «Исполнитель»), с одной стороны, и <b>{org}</b> (далее — «Заказчик») {rep}с другой стороны, в соответствии с пунктом 15-1 Правил проведения массовых мероприятий, утверждённых постановлением Кабинета Министров от 29 июля 2014 года № 205, заключили настоящий договор о нижеследующем:',
      rep: 'в лице {name}, ',
      h1: '1. Предмет договора',
      p11: '1.1. Исполнитель оказывает услуги по обеспечению безопасности граждан и охране общественного порядка при проведении организуемого Заказчиком массового мероприятия «{event}» (далее — мероприятие), а Заказчик оплачивает эти услуги.',
      p12: '1.2. Место проведения: {address}, {region}. Дата: {date}, {start} – {end} ({dur} ч). Категория объекта: {cat}.',
      p13: '1.3. Зона обслуживания: периметр — {P} м, площадь — {S} м², входы (КПП) — {E}, расчётная вместимость — {C} чел. Схема территории является неотъемлемой частью договора (приложение 1).',
      h2: '2. Привлекаемые силы и средства', thPart: 'Составная часть', thStaff: 'Сотр.', total: 'Всего сотрудников одновременно на службе',
      p21: '2.1. Количество смен — {shifts}; всего привлекаемого личного состава — {persons} чел.; всего {ph} чел.-ч. Коэффициент риска — {K}.',
      p22: '2.2. Технические средства: металлодетекторные рамки — {fr}, ручные металлодетекторы — {hd}, радиостанции — {ra}{ba}, видеокамеры — {ca}, служебный автотранспорт — {ve}.',
      ba: ', секции ограждения — {n}',
      h3: '3. Обязанности сторон',
      p31: '3.1. Исполнитель: а) расставляет сотрудников до начала мероприятия; б) организует пропускной режим по периметру, досмотр лиц и транспортных средств с помощью технических средств (п. 70); в) предупреждает правонарушения и при необходимости организует эвакуацию (п. 69); г) сотрудники при обращении к гражданам представляются.',
      p32: '3.2. Заказчик: а) заранее информирует участников о металлодетекторном контроле и указывает на билетах перечень запрещённых предметов (п. 61); б) продаёт билеты в пределах вместимости объекта; в) содержит пути эвакуации и выходы свободными; г) оплачивает услуги в порядке, установленном разделом 4.',
      h4: '4. Стоимость услуг и порядок расчётов',
      p41: '4.1. Стоимость 1 (одного) человеко-часа — {pct}% базовой расчётной величины — <b>{rate}</b>.',
      p42: '4.2. Общая стоимость договора: {ph} чел.-ч × {rateN} = <b>{cost}</b>.',
      p43: '4.3. Средства перечисляются на внебюджетный специальный счёт Исполнителя и распределяются пропорционально численности привлечённого личного состава (п. 15-1).',
      free: '4.1. Для мероприятий особой категории услуга оказывается бесплатно (п. 15-1).',
      h5: '5. Заключительные положения',
      p51: '5.1. Стороны несут ответственность за неисполнение обязательств в соответствии с законодательством. Споры разрешаются путём переговоров, а при недостижении согласия — в судебном порядке.',
      p52: '5.2. Договор заключается не позднее чем за десять рабочих дней до начала мероприятия и действует до полного исполнения сторонами своих обязательств.',
      sExec: 'ИСПОЛНИТЕЛЬ', sCust: 'ЗАКАЗЧИК', unit: 'Территориальное подразделение ({region})', tin: 'ИНН', signed: 'Подписано ЭЦП',
      foot: 'Типовой договор, сформированный прототипом платформы. Юридической силы не имеет.',
      next: ' (следующий день)', money: function (n) { return HX.fmt(n) + ' сум'; }, docTitle: 'Договор'
    },
    en: {
      wm: 'DRAFT', title: 'CONTRACT No. {no}', draftNo: 'D-{id}',
      sub: 'on ensuring public safety and maintaining public order during a mass event',
      exec1: 'The territorial unit of the National Guard of the Republic of Uzbekistan for {region}', exec2: 'The territorial internal affairs unit for {region}',
      pre: '{exec} (the “Contractor”), of the one part, and <b>{org}</b> (the “Customer”){rep}, of the other part, pursuant to clause 15-1 of the Rules for Holding Mass Events approved by Cabinet of Ministers Resolution No. 205 of 29 July 2014, have concluded this contract as follows:',
      rep: ', represented by {name}',
      h1: '1. Subject of the contract',
      p11: '1.1. The Contractor provides services to ensure public safety and maintain public order during the mass event “{event}” (the “event”) organised by the Customer, and the Customer pays for these services.',
      p12: '1.2. Venue: {address}, {region}. Date: {date}, {start} – {end} ({dur} h). Venue category: {cat}.',
      p13: '1.3. Service area: perimeter — {P} m, area — {S} m², entrances (checkpoints) — {E}, calculated capacity — {C} people. The area plan is an integral part of the contract (Annex 1).',
      h2: '2. Forces and means deployed', thPart: 'Component', thStaff: 'Staff', total: 'Total staff on duty simultaneously',
      p21: '2.1. Number of shifts — {shifts}; total personnel deployed — {persons}; total {ph} person-hours. Risk factor — {K}.',
      p22: '2.2. Equipment: walk-through metal detectors — {fr}, hand-held detectors — {hd}, radios — {ra}{ba}, video cameras — {ca}, service vehicles — {ve}.',
      ba: ', barrier sections — {n}',
      h3: '3. Obligations of the parties',
      p31: '3.1. The Contractor shall: a) deploy the agreed staff before the event starts; b) organise access control along the perimeter and screen persons and vehicles with technical means (cl. 70); c) prevent offences and organise evacuation where necessary (cl. 69); d) ensure staff identify themselves when addressing citizens.',
      p32: '3.2. The Customer shall: a) inform attendees in advance about metal-detector screening and print the list of prohibited items on tickets (cl. 61); b) sell tickets within the venue capacity; c) keep evacuation routes and exits clear; d) pay for the services as set out in section 4.',
      h4: '4. Service cost and payment',
      p41: '4.1. The cost of 1 (one) person-hour is {pct}% of the base calculation value — <b>{rate}</b>.',
      p42: '4.2. Total contract value: {ph} person-hours × {rateN} = <b>{cost}</b>.',
      p43: '4.3. Funds are transferred to the Contractor’s off-budget special account and distributed in proportion to the personnel deployed (cl. 15-1).',
      free: '4.1. The service is free of charge for special-category events (cl. 15-1).',
      h5: '5. Final provisions',
      p51: '5.1. The parties are liable for non-performance in accordance with the law. Disputes are settled by negotiation or, failing agreement, in court.',
      p52: '5.2. The contract is concluded at least ten working days before the event and remains in force until the parties have fully performed their obligations.',
      sExec: 'CONTRACTOR', sCust: 'CUSTOMER', unit: '{region} territorial unit', tin: 'TIN', signed: 'E-signed',
      foot: 'Sample contract generated by the platform prototype. Not legally binding.',
      next: ' (next day)', money: function (n) { return 'UZS ' + HX.fmt(n); }, docTitle: 'Contract'
    }
  };

  function langKey() { const l = I18 ? I18.lang() : 'uz-cyrl'; return l.indexOf('uz') === 0 ? 'uz' : l; }
  function f(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }

  function endTime(start, dur, T) {
    const h = HXCalc.parseTime(start) + (+dur || 0);
    const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60);
    return HX.pad(hh) + ':' + HX.pad(mm) + (h >= 24 ? T.next : '');
  }
  function termClause(term, K) {
    if (!term || term.kind !== 'period' || !term.from || !term.to) {
      return K === 'en' ? '1.4. The contract covers a single event for the stated hours.' : (K === 'ru' ? '1.4. Договор заключается на одно мероприятие в указанные часы.' : '1.4. Шартнома бир марталик тадбир учун, кўрсатилган соатлар давомида тузилади.');
    }
    const from = HX.date(term.from), to = HX.date(term.to);
    return K === 'en' ? '1.4. The contract runs from ' + from + ' to ' + to + '.' : (K === 'ru' ? '1.4. Договор действует с ' + from + ' по ' + to + '.' : '1.4. Шартнома муддатли: ' + from + ' дан ' + to + ' гача.');
  }

  HX.contractHTML = function (app) {
    const K = langKey(), T = TPL[K];
    const tr = function (s) { return K === 'uz' || !I18 ? s : I18.t(s); };
    const esc = HX.esc;
    const e = app.event, g = app.geometry, r = app.result, o = app.owner || {};
    const reg = HX.region(e.region);
    const cat = HXCalc.CATEGORIES[e.category] || HXCalc.CATEGORIES['1'];
    const N = HXCalc.getNorms();
    const signed = ['signed', 'paid', 'done'].indexOf(app.status) > -1;
    const region = esc(tr(reg.name));
    const org = esc(tr(o.org || o.name || ''));
    const rows = (r.parts || []).filter(function (p) { return p.value > 0; }).map(function (p, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(tr(p.label)) + '</td><td class="r">' + HX.fmt(p.value) + '</td></tr>';
    }).join('');
    const t = r.tech || {};
    const city = K === 'uz' ? reg.name.replace(' вилояти', '').replace(' шаҳри', ' ш.') : tr(reg.name);
    const no = app.contractNo || f(T.draftNo, { id: app.id });
    const catLabel = tr(cat.label);
    const html = '' +
      '<div class="contract-doc"' + (K === 'uz' ? '' : ' data-no-i18n') + '>' +
      (signed ? '' : '<div class="wm">' + T.wm + '</div>') +
      '<div class="c" style="text-align:center;margin-bottom:8px">' + HX.logo('brand-logo', 72) + '</div>' +
      '<h2>' + f(T.title, { no: esc(no) }) + '</h2>' +
      '<p class="c">' + T.sub + '</p>' +
      '<div class="row"><span>' + esc(city) + '</span><span>' + HX.date(app.signedAt || app.updatedAt || new Date()) + '</span></div>' +
      '<p>' + f(T.pre, { exec: f(cat.id === '1' ? T.exec1 : T.exec2, { region: region }), org: org, rep: o.name ? f(T.rep, { name: esc(tr(o.name)) }) : '' }) + '</p>' +
      '<h3>' + T.h1 + '</h3>' +
      '<p>' + f(T.p11, { event: esc(tr(e.name)) }) + '</p>' +
      '<p>' + f(T.p12, { address: esc(tr(e.address || '—')), region: region, date: HX.date(e.date), start: esc(e.startTime || ''), end: endTime(e.startTime, e.duration, T), dur: e.duration, cat: esc(K === 'en' ? catLabel : catLabel.toLowerCase()) }) + '</p>' +
      '<p>' + ((g.kind === 'route' || e.type === 'marathon')
        ? (K === 'en'
          ? '1.3. The service route is a line drawn along the road: length — ' + HX.fmt(g.perimeter) + ' m. There is no internal patrol. ' + (e.crowd === 'open' ? 'Open attendance, approximate number — ' : 'Limited attendance — ') + HX.fmt(r.attendees) + '.'
          : (K === 'ru'
            ? '1.3. Направление службы задано линией вдоль дороги: длина — ' + HX.fmt(g.perimeter) + ' м. Внутренний патруль не применяется. ' + (e.crowd === 'open' ? 'Неограниченный поток, ориентировочно — ' : 'Ограниченное число участников — ') + HX.fmt(r.attendees) + '.'
            : '1.3. Хизмат йўналиши йўл бўйлаб чизиқ билан белгиланган: узунлик — ' + HX.fmt(g.perimeter) + ' м. Ички ҳудуд патрули қўлланилмайди. ' + (e.crowd === 'open' ? 'Чекланмаган оқим, тахминий иштирокчилар — ' : 'Чекланган иштирокчилар — ') + HX.fmt(r.attendees) + '.'))
        : f(T.p13, { P: HX.fmt(g.perimeter), S: HX.fmt(g.area), E: e.entrances, C: HX.fmt(r.capacity) })) + '</p>' +
      '<p>' + termClause(e.term, K) + '</p>' +
      '<h3>' + T.h2 + '</h3>' +
      '<table><thead><tr><th>№</th><th>' + T.thPart + '</th><th class="r">' + T.thStaff + '</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><td></td><td>' + T.total + '</td><td class="r">' + HX.fmt(r.total) + '</td></tr></tbody></table>' +
      '<p>' + f(T.p21, { shifts: r.shifts, persons: HX.fmt(r.personsTotal), ph: HX.fmt(r.personHours), K: HX.fmtDec(r.K, 2) }) + '</p>' +
      '<p>' + f(T.p22, { fr: t.frames || 0, hd: t.handDetectors || 0, ra: t.radios || 0, ba: t.barriers ? f(T.ba, { n: t.barriers }) : '', ca: t.cameras || 0, ve: t.vehicles || 0 }) + '</p>' +
      '<h3>' + T.h3 + '</h3><p>' + T.p31 + '</p><p>' + T.p32 + '</p>' +
      '<h3>' + T.h4 + '</h3>' +
      (cat.paid
        ? '<p>' + f(T.p41, { pct: Math.round(N.rateShare * 100), rate: T.money(r.rate) }) + '</p><p>' + f(T.p42, { ph: HX.fmt(r.personHours), rateN: HX.fmt(r.rate), cost: T.money(r.cost) }) + '</p><p>' + T.p43 + '</p>'
        : '<p>' + T.free + '</p>') +
      '<h3>' + T.h5 + '</h3><p>' + T.p51 + '</p><p>' + T.p52 + '</p>' +
      '<div class="sign"><div><b>' + T.sExec + '</b><br>' + f(T.unit, { region: region }) + '<br>' + (app.assigned ? esc(tr(app.assigned.commander)) : '________________') + '<br><span class="ln"></span></div>' +
      '<div><b>' + T.sCust + '</b><br>' + org + '<br>' + T.tin + ': ' + esc(o.tin || '—') + '<br>' + (signed ? '<span class="eri">' + T.signed + ' · ' + HX.dateTime(app.signedAt || app.updatedAt) + '</span>' : '<span class="ln"></span>') + '</div></div>' +
      '<p class="foot">' + T.foot + '</p>' +
      '</div>';
    return html;
  };

  HX.contractCSS = '' +
    '.contract-doc{position:relative;max-width:780px;margin:0 auto;background:#fff;color:#111;padding:44px 52px;font:14px/1.6 "Times New Roman",Georgia,serif;border-radius:6px;overflow:hidden}' +
    '.contract-doc h2{text-align:center;font:700 18px/1.3 "Times New Roman",serif;margin:0 0 4px;color:#111}' +
    '.contract-doc h3{font:700 14px "Times New Roman",serif;margin:16px 0 6px;color:#111;text-transform:uppercase}' +
    '.contract-doc p{margin:0 0 8px;color:#111;text-align:justify}' +
    '.contract-doc p.c{text-align:center;font-style:italic}' +
    '.contract-doc .row{display:flex;justify-content:space-between;margin:14px 0}' +
    '.contract-doc table{width:100%;border-collapse:collapse;margin:6px 0 10px;font-size:13.5px}' +
    '.contract-doc th,.contract-doc td{border:1px solid #888;padding:5px 8px;text-align:left;color:#111}' +
    '.contract-doc .r{text-align:right}' +
    '.contract-doc tr.tot td{font-weight:700;background:#f2f2f2}' +
    '.contract-doc .sign{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:24px;font-size:13.5px}' +
    '.contract-doc .ln{display:inline-block;width:160px;border-bottom:1px solid #111;margin-top:26px}' +
    '.contract-doc .eri{display:inline-block;margin-top:10px;padding:4px 8px;border:2px solid #0a7d5b;color:#0a7d5b;font:700 11px Arial,sans-serif;border-radius:4px;transform:rotate(-2deg)}' +
    '.contract-doc .foot{margin-top:22px;font-size:11px;color:#666;text-align:center}' +
    '.contract-doc .wm{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font:800 110px Arial,sans-serif;color:rgba(200,0,0,.07);pointer-events:none;white-space:nowrap}' +
    '@media (max-width:640px){.contract-doc{padding:24px 18px}.contract-doc .sign{grid-template-columns:1fr}}';

  HX.downloadContract = function (app) {
    const K = langKey(), T = TPL[K];
    let body = HX.contractHTML(app);
    let title = T.docTitle + ' ' + (app.contractNo || app.id);
    if (I18 && I18.lang() === 'uz-latn') { body = I18.tHTML(body); title = I18.translit(title); }
    const htmlLang = I18 ? I18.LANGS.find(function (l) { return l.id === I18.lang(); }).html : 'uz-Cyrl';
    const html = '<!doctype html><html lang="' + htmlLang + '"><head><meta charset="utf-8"><title>' + HX.esc(title) + '</title><style>body{margin:0;background:#fff}' + HX.contractCSS + '</style></head><body>' + body + '</body></html>';
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    const safe = String(app.contractNo || app.id).replace(/[^\w\-]+/g, '_');
    a.href = URL.createObjectURL(blob);
    a.download = 'shartnoma-' + safe + '.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  HX.printContract = function (app) {
    const K = langKey(), T = TPL[K];
    const w = global.open('', '_blank');
    if (!w) { HX.toast('Чоп этиш ойнаси очилмади', 'Браузерда қалқиб чиқувчи ойналарга рухсат беринг.', 'warn'); return; }
    let body = HX.contractHTML(app);
    let title = T.docTitle + ' ' + HX.esc(app.contractNo || app.id);
    if (I18 && I18.lang() === 'uz-latn') { body = I18.tHTML(body); title = I18.translit(title); }
    const htmlLang = I18 ? I18.LANGS.find(function (l) { return l.id === I18.lang(); }).html : 'uz-Cyrl';
    w.document.write('<!doctype html><html lang="' + htmlLang + '"><head><meta charset="utf-8"><title>' + title + '</title><style>body{margin:0;background:#fff}' + HX.contractCSS + '@media print{.contract-doc{padding:0}}</style></head><body>' + body + '<script>setTimeout(function(){print()},300)<\/script></body></html>');
    w.document.close();
  };
})(window);
