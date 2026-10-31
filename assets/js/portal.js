/* Бош портал саҳифаси */
(function () {
  'use strict';
  const $ = HX.$;

  HX.ready(function () {
    HX.renderShell('portal');
    heroCanvas();
    typed();
    heroCard();
    stats();
    directions();
    steps();
    quickCalc();
    services();
    modules();
    news();
    checklist();
    banned();
    HX.mountZones($('#zonesHome'), 'zh');
    tips();
    sos();
    faq();
    HX.observe(document);
  });

  /* ---------- Расмий сайт янгиликлари ---------- */
  const MG_FALLBACK = [
    { d: '02 Oct 2026', t: 'Milliy gvardiya va YXHT o‘rtasidagi yangi bosqichdagi hamkorlikning muhim masalalari muhokama qilindi.', x: 'Bugun Milliy gvardiya qo‘mondoni, general-polkovnik B. Tashmatov hamda Yevropada xavfsizlik va hamkorlik tashkilotining O‘zbekistondagi Loyihalar koordinatori bilan uchrashuv bo‘lib o‘tdi.', href: 'https://milliygvardiya.uz/oz/news/millij-gvardi-va-eht-r', img: 'https://milliygvardiya.uz/storage/uploads/new/TaqpvB5DNLiEXyWnKdi8bOGLGCLKX3OgGbw180bL.jpg' },
    { d: '26 Sep 2026', t: 'Mamlakatimizda rasmiy tashrif bilan bo‘lib turgan Amerika Qo‘shma Shtatlarining Missisipi shtati Milliy gvardiyasi delegatsiyasi Milliy gvardiyada bo‘ldi.', x: 'Delegatsiya a’zolari O‘zbekiston Respublikasi Milliy gvardiyasi qo‘mondoni, general-polkovnik B. Tashmatov bilan uchrashdi.', href: 'https://milliygvardiya.uz/oz/news/delegatsi-vo-glave-s-koma', img: 'https://milliygvardiya.uz/storage/uploads/new/adnqqRlkKte61ZTGQtWoaAiwOHGJqrO4ran9LWd8.png' },
    { d: '21 Sep 2026', t: 'Bugun Milliy gvardiya qo‘mondoni, general-polkovnik Bahodir Tashmatov Xitoy Xalq Respublikasining Favqulodda va Muxtor Elchisi Yu Szyun bilan uchrashdi.', x: 'Uchrashuv davomida ikki tomonlama hamkorlikni yangi bosqichga olib chiqish hamda uni amaliy yo‘nalishlar bilan boyitish masalalari muhokama qilindi.', href: 'https://milliygvardiya.uz/oz/news/today-commander-of-the-n', img: 'https://milliygvardiya.uz/storage/uploads/new/9ZEU5FMNDpHwZ4Wzuqtj7ZwJu7gKPDBzPMCc5eVh.png' },
    { d: '12 Sep 2026', t: 'Jamoat xavfsizligi universitetiga yangi qabul qilingan kursantlarning Vatanga qasamyod qabul qilish marosimi bo‘lib o‘tdi.', x: 'Tantanali marosimda Milliy gvardiya qo‘mondoni, general-polkovnik B. Tashmatov ishtirok etdi.', href: 'https://milliygvardiya.uz/oz/news/a-ceremony-of-taking-the-', img: 'https://milliygvardiya.uz/storage/uploads/new/89q9nsDB2bfs2rOPUyBUUL9gx7KrczHT1LGD1z1S.png' }
  ];
  function parseMgNews(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const root = doc.querySelector('#tab1') || doc;
    return Array.prototype.slice.call(root.querySelectorAll('a.news-item')).map(function (a) {
      const img = a.querySelector('img');
      const h = a.querySelector('h2');
      const p = a.querySelector('p');
      const date = a.querySelector('.date');
      let href = a.getAttribute('href') || '';
      if (href && href.indexOf('http') !== 0) href = 'https://milliygvardiya.uz' + (href.charAt(0) === '/' ? '' : '/') + href;
      let src = img ? (img.getAttribute('src') || '') : '';
      if (src && src.indexOf('http') !== 0) src = 'https://milliygvardiya.uz' + (src.charAt(0) === '/' ? '' : '/') + src;
      return { href: href, img: src, t: h ? h.textContent.trim() : '', x: p ? p.textContent.trim() : '', d: date ? date.textContent.trim() : '' };
    }).filter(function (n) { return n.t && n.img; }).slice(0, 8);
  }
  function newsCard(n, i) {
    return '<article class="card news-card tilt reveal in" style="animation:fadeUp .5s ' + i * 0.06 + 's both"><a class="cover photo" href="' + HX.esc(n.href) + '" target="_blank" rel="noopener"><img src="' + HX.esc(n.img) + '" alt="" loading="lazy"><span class="date">' + HX.esc(n.d) + '</span></a>' +
      '<div class="body"><span class="chip" style="align-self:flex-start">milliygvardiya.uz</span><h4>' + HX.esc(n.t) + '</h4><p>' + HX.esc(n.x) + '</p><a class="more" href="' + HX.esc(n.href) + '" target="_blank" rel="noopener">Батафсил ' + HX.icon('arrowRight') + '</a></div></article>';
  }
  function drawMg(items) {
    const box = $('#news'); if (!box) return;
    box.innerHTML = items.map(newsCard).join('') || '<div class="empty">Янгиликлар юкланмади. <a href="https://milliygvardiya.uz/oz" target="_blank" rel="noopener">Расмий сайт</a></div>';
  }
  function news() {
    const cached = HX.store.get('hx.mgnews', null);
    drawMg(cached && cached.items && cached.items.length ? cached.items : MG_FALLBACK);
    const src = 'https://milliygvardiya.uz/oz';
    const tries = [src, 'https://api.allorigins.win/get?url=' + encodeURIComponent(src)];
    const pull = function (i) {
      if (i >= tries.length) return;
      const ctl = new AbortController();
      const timer = setTimeout(function () { ctl.abort(); }, 9000);
      fetch(tries[i], { signal: ctl.signal }).then(function (r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('status');
        return r.text();
      }).then(function (txt) {
        if (txt && txt.charAt(0) === '{') { try { const j = JSON.parse(txt); if (j && j.contents) txt = j.contents; } catch (e) {} }
        const items = parseMgNews(txt);
        if (!items.length) throw new Error('empty');
        HX.store.set('hx.mgnews', { at: Date.now(), items: items });
        drawMg(items);
        const st = $('#newsStatus'); if (st) st.textContent = 'Расмий сайтдан янгиланди';
      }).catch(function () { pull(i + 1); });
    };
    pull(0);
  }
  const CHECK = [
    ['Объект рўйхатда эканини текширинг', 'Тадбирлар фақат тасдиқланган объектлар рўйхатидаги жойларда ўтказилади (4-банд)'],
    ['Рухсатнома олинг', 'Махсус электрон тизим орқали; рухсатномагача чипта сотилмайди ва реклама қилинмайди (5-банд)'],
    ['Хавфсизлик шартномасини тузинг', 'Тадбир бошланишидан камида 10 иш куни олдин (15-1-банд)'],
    ['Чипталар сонини сиғимга мослаштиринг', 'Сотилган чипталар объект сиғимидан ошмаслиги керак (61-банд)'],
    ['Иштирокчиларни огоҳлантиринг', 'Металлодетектор назорати ва тақиқланган буюмлар рўйхати чипталарда кўрсатилади (61-банд)'],
    ['Фарқловчи белгилар тайёрланг', 'Ташкилотчилар учун бейж ёки белбоғ (61-банд)'],
    ['Эвакуация йўлларини бўшатинг', 'Чиқишлар ва йўлаклар доим очиқ бўлиши шарт (70-банд)'],
    ['Спиртли ичимликлар савдосини назорат қилинг', 'Тадбирдан камида 2 соат олдин 500 м радиусда тўхтатилади (60-банд)']
  ];
  function checklist() {
    let st = HX.store.get('hx.checklist', []);
    const box = $('#checklist');
    box.innerHTML = CHECK.map(function (c, i) {
      return '<div class="ck' + (st.indexOf(i) > -1 ? ' on' : '') + '" data-i="' + i + '" role="checkbox" tabindex="0" aria-checked="' + (st.indexOf(i) > -1) + '"><span class="box">' + HX.icon('check') + '</span><div><b>' + c[0] + '</b><span>' + c[1] + '</span></div></div>';
    }).join('');
    const ring = function () {
      const p = st.length / CHECK.length, C = 2 * Math.PI * 26;
      $('#ckRing').innerHTML = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--surface-3)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (p * C) + ' ' + C + '" style="transition:stroke-dasharray .6s"/></svg><b>' + st.length + '/' + CHECK.length + '</b>';
    };
    box.querySelectorAll('.ck').forEach(function (el) {
      const tg = function () {
        const i = +el.dataset.i, k = st.indexOf(i);
        if (k > -1) st.splice(k, 1); else st.push(i);
        el.classList.toggle('on', k < 0); el.setAttribute('aria-checked', k < 0);
        HX.store.set('hx.checklist', st); ring();
        if (st.length === CHECK.length) HX.toast('Тайёргарлик якунланди', 'Барча бандлар бажарилди — энди ариза беришингиз мумкин.', 'ok');
      };
      el.onclick = tg; el.onkeydown = function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tg(); } };
    });
    ring();
  }

  /* ---------- Тақиқланган буюмлар (пиктограммалар) ---------- */
  const BAN_OVER = '<circle cx="24" cy="24" r="21" fill="none" stroke="#d03b3b" stroke-width="4"/><path d="M9.5 9.5 L38.5 38.5" stroke="#d03b3b" stroke-width="4" stroke-linecap="round"/>';
  const BANS = [
    ['Ўқотар ва совуқ қурол', '<path d="M12 34 L33 13 l3 3 -18 18 z" fill="#9aa4b2"/><path d="M10 36 l4-4 3 3 -4 4z" fill="#6b4f3a"/>'],
    ['Пиротехника', '<path d="M24 27 v13" stroke="#e85d04" stroke-width="3"/><circle cx="24" cy="18" r="3" fill="#f0b94a"/><path d="M24 8v5M14 18h5M29 18h5M17 11l3 3M31 11l-3 3M17 25l3-3M31 25l-3-3" stroke="#f0b94a" stroke-width="2.5" stroke-linecap="round"/>'],
    ['Ўткир ва кесувчи буюмлар', '<circle cx="16" cy="32" r="5" fill="none" stroke="#5b6b82" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="none" stroke="#5b6b82" stroke-width="3"/><path d="M19 28 L33 10 M29 28 L15 10" stroke="#9aa4b2" stroke-width="3" stroke-linecap="round"/>'],
    ['Тез ёнувчи моддалар', '<path d="M24 8c6 8 10 12 10 19a10 10 0 0 1-20 0c0-5 3-8 5-11 1 4 3 5 5 6-1-6 0-10 0-14z" fill="#e85d04"/><path d="M24 24c3 3 4 5 4 8a4 4 0 0 1-8 0c0-2 2-5 4-8z" fill="#fab219"/>'],
    ['Спиртли ичимликлар', '<path d="M21 8h6v7l3 5v18a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V20l3-5z" fill="#2f7d4f"/><rect x="19" y="24" width="10" height="8" rx="1" fill="#f3e2b0"/>'],
    ['Шиша идишлар', '<path d="M15 10h18l-3 26a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#9fd3e6"/><path d="M16.5 18h15" stroke="#fff" stroke-width="2"/>'],
    ['Лазер кўрсаткичлар', '<rect x="10" y="26" width="18" height="6" rx="3" transform="rotate(-30 19 29)" fill="#5b6b82"/><path d="M27 23 L40 12" stroke="#e34948" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="12" r="2.5" fill="#e34948"/>'],
    ['Дронлар (рухсатсиз)', '<rect x="19" y="21" width="10" height="7" rx="2" fill="#5b6b82"/><path d="M19 22 L12 16 M29 22 L36 16 M19 27 L12 33 M29 27 L36 33" stroke="#5b6b82" stroke-width="2.5"/><ellipse cx="12" cy="15" rx="6" ry="1.8" fill="#9aa4b2"/><ellipse cx="36" cy="15" rx="6" ry="1.8" fill="#9aa4b2"/><ellipse cx="12" cy="34" rx="6" ry="1.8" fill="#9aa4b2"/><ellipse cx="36" cy="34" rx="6" ry="1.8" fill="#9aa4b2"/>']
  ];
  function banned() {
    $('#banGrid').innerHTML = BANS.map(function (b, i) {
      return '<div class="ban reveal" style="--d:' + (i * 0.05) + 's"><div class="pic"><svg viewBox="0 0 48 48" aria-hidden="true">' + b[1] + BAN_OVER + '</svg></div>' + b[0] + '</div>';
    }).join('');
  }

  /* ---------- Иштирокчиларга маслаҳатлар ва фавқулодда рақамлар ---------- */
  function tips() {
    const T = [
      ['clock', 'Эртароқ келинг', 'Кириш нуқталарида кўрик вақт олади'],
      ['doc', 'Ҳужжат ва чиптани олинг', 'Шахсни тасдиқловчи ҳужжат сўралиши мумкин'],
      ['users', 'Болаларни кузатинг', 'Адашиб қолсангиз — учрашув жойини олдиндан келишинг'],
      ['route', 'Чиқишларни эслаб қолинг', 'Энг яқин эвакуация йўналишини билиб олинг'],
      ['shieldCheck', 'Хизматчига мурожаат қилинг', 'У ўзини таништириши ва ёрдам бериши шарт'],
      ['alert', 'Шубҳали вазиятни хабар қилинг', 'Эгасиз буюм ёки хавфли ҳаракатни дарҳол айтинг']
    ];
    $('#tips').innerHTML = T.map(function (x) { return '<div class="tip"><span class="ti">' + HX.icon(x[0]) + '</span><div><b>' + x[1] + '</b>' + x[2] + '</div></div>'; }).join('');
  }
  function sos() {
    const S = [['101', 'Ёнғин хавфсизлиги', 'var(--s2)'], ['102', 'Миллий гвардия', 'var(--s1)'], ['103', 'Тез тиббий ёрдам', 'var(--s8)'], ['104', 'Газ авария хизмати', 'var(--s4)']];
    $('#sos').innerHTML = S.map(function (s) { return '<a class="sos-n" href="tel:' + s[0] + '"><b style="color:' + s[2] + '">' + s[0] + '</b><span>' + s[1] + '</span></a>'; }).join('');
  }

  /* ---------- Саволлар ва жавоблар ---------- */
  function faq() {
    const F = [
      ['Шартномани қачон тузиш керак?', 'Тадбир бошланишидан камида 10 иш куни олдин (ВМ-205, 15-1-банд). Платформа санани автоматик текширади ва муддат етарли бўлмаса огоҳлантиради.'],
      ['Хизмат қанча туради?', '1 киши-соат қиймати — БҲМнинг 7 фоизи, 2026 йил 1 сентябрдан 30 800 сўм. Жами қиймат = бир вақтда хизматдаги ходимлар × тадбир давомийлиги (соат) × 30 800 сўм.'],
      ['Ходимлар сони қандай аниқланади?', 'Периметр, майдон, сиғим, кириш нуқталари ва хавф омиллари асосида (ВМ-205, 69-банд). Ҳисоб формулалари «Ҳуқуқий база → Методика» бўлимида очиқ кўрсатилган.'],
      ['Қайси орган масъул бўлади?', 'Барча тоифаларда хавфсизликни Миллий гвардия ҳудудий бўлинмаси таъминлайди.'],
      ['Махсус тоифадаги тадбирлар учун тўлов борми?', 'Йўқ, махсус тоифадаги тадбирлар учун хизмат пуллик эмас (15-1-банд).'],
      ['НЎП қаерга қўйилади?', 'Йўллар ва пиёдалар йўлаклари периметрга етиб келадиган жойларга. Харитада уларни қўлда белгилаш ёки «Йўллар бўйича» тугмаси билан автоматик жойлаштириш мумкин.'],
      ['Қандай тўлов усуллари мавжуд?', 'Click, Payme ва Visa банк картаси. Тўловдан сўнг электрон чек шакллантирилади (прототипда демо режимда).']
    ];
    $('#faq').innerHTML = F.map(function (q, i) { return '<details class="reveal" style="--d:' + (i * 0.04) + 's"' + (i === 0 ? ' open' : '') + '><summary>' + q[0] + '</summary><p>' + q[1] + '</p></details>'; }).join('');
  }

  /* ---------- Hero анимацияси: радар, периметр постлари, патруллар ---------- */
  function heroCanvas() {
    const cv = $('#heroCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, dpr, col = {}, nodes = [], t0 = performance.now();
    function rgb(hex) { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)].join(',') : '47,212,167'; }
    function readColors() {
      col.accent = HX.cssVar('--accent'); col.blue = HX.cssVar('--blue'); col.gold = HX.cssVar('--gold');
      col.line = HX.cssVar('--line-strong'); col.text = HX.cssVar('--text');
      col.acc = rgb(col.accent);
    }
    function resize() {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (w < 2 || h < 2 || (w === W && h === H)) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = w; H = h;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = Array.from({ length: Math.max(8, Math.round(W * H / 26000)) }, function () {
        return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 };
      });
    }
    readColors(); resize();
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(cv);
    document.addEventListener('hx:theme', readColors);
    const shape = [[-1, -0.55], [-0.35, -0.95], [0.55, -0.8], [1, -0.15], [0.8, 0.6], [0.1, 0.95], [-0.7, 0.75], [-1.05, 0.15]];
    function along(pts, n) {
      const segs = []; let total = 0;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l, total]); total += l; }
      const out = [];
      for (let k = 0; k < n; k++) {
        const d = (k / n) * total; const s = segs.find(function (q) { return d >= q[3] && d <= q[3] + q[2]; }) || segs[segs.length - 1];
        const tt = (d - s[3]) / s[2]; out.push([s[0][0] + (s[1][0] - s[0][0]) * tt, s[0][1] + (s[1][1] - s[0][1]) * tt]);
      }
      return out;
    }
    const posts = along(shape, 28);
    const reduce = HX.reducedMotion();
    function frame(now) {
      if (!W || !H) { if (!reduce) requestAnimationFrame(frame); return; }
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // тармоқ
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) { ctx.globalAlpha = (1 - d / 120) * 0.35; ctx.strokeStyle = col.blue; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        ctx.globalAlpha = 0.5; ctx.fillStyle = col.blue; ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // тадбир ҳудуди
      const wide = W > 960;
      const cx = wide ? W * 0.74 : W * 0.5, cy = wide ? H * 0.5 : H * 0.3;
      const sc = Math.min(W, H) * (wide ? 0.27 : 0.3);
      const P = function (p) { return [cx + p[0] * sc, cy + p[1] * sc]; };
      // радар доиралари
      ctx.strokeStyle = col.accent;
      for (let r = 1; r <= 4; r++) { ctx.globalAlpha = 0.09; ctx.beginPath(); ctx.arc(cx, cy, sc * 0.38 * r, 0, 7); ctx.stroke(); }
      // радар нури
      const ang = reduce ? 0.8 : t * 0.9;
      const grd = ctx.createConicGradient ? ctx.createConicGradient(ang, cx, cy) : null;
      if (grd) {
        grd.addColorStop(0, 'rgba(' + col.acc + ',0.28)'); grd.addColorStop(0.08, 'rgba(' + col.acc + ',0.05)'); grd.addColorStop(0.2, 'rgba(' + col.acc + ',0)'); grd.addColorStop(1, 'rgba(' + col.acc + ',0)');
        ctx.globalAlpha = 1; ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, sc * 1.55, 0, 7); ctx.fill();
      }
      // периметр
      ctx.globalAlpha = 0.95; ctx.strokeStyle = col.accent; ctx.lineWidth = 2.2; ctx.setLineDash([12, 7]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); shape.forEach(function (p, i) { const q = P(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 0.07; ctx.fillStyle = col.accent; ctx.fill();
      // постлар (радар ўтганда ёнади)
      posts.forEach(function (p) {
        const q = P(p);
        let a = Math.atan2(q[1] - cy, q[0] - cx); if (a < 0) a += Math.PI * 2;
        let diff = ((ang % (Math.PI * 2)) - a); if (diff < 0) diff += Math.PI * 2;
        const glow = Math.max(0, 1 - diff / 1.6);
        ctx.globalAlpha = 0.35 + glow * 0.65; ctx.fillStyle = col.blue;
        ctx.beginPath(); ctx.arc(q[0], q[1], 4 + glow * 3, 0, 7); ctx.fill();
        if (glow > 0.2) { ctx.globalAlpha = glow * 0.35; ctx.beginPath(); ctx.arc(q[0], q[1], 10 + glow * 8, 0, 7); ctx.fill(); }
      });
      // НЎП (кириш нуқталари)
      [0, 7, 14, 21].forEach(function (i) {
        const q = P(posts[i]); ctx.globalAlpha = 1; ctx.fillStyle = col.gold;
        ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore();
      });
      // патруллар
      for (let k = 0; k < 6; k++) {
        const ph = t * (0.35 + k * 0.05) + k * 1.7;
        const px = cx + Math.cos(ph) * sc * (0.25 + 0.08 * k) , py = cy + Math.sin(ph * 1.3) * sc * (0.22 + 0.05 * (k % 3));
        ctx.globalAlpha = 0.9; ctx.fillStyle = col.accent; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function typed() {
    const el = $('#typed'); if (!el || HX.reducedMotion()) return;
    const words = ['ходимлар сонини автоматик ҳисоблаш', 'шартнома ва тўловни электрон расмийлаштириш', 'кучларни харитада жойлаштириш', 'тадбир хавфсизлиги мониторинги']
      .map(function (w) { return window.HXI18N ? HXI18N.t(w) : w; });
    el.setAttribute('data-no-i18n', '');
    let wi = 0, ci = words[0].length, del = true;
    setInterval(function () {
      const w = words[wi];
      if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; } }
      else { ci++; if (ci >= words[wi].length) { del = true; ci = words[wi].length + 18; } }
      el.textContent = words[wi].slice(0, Math.max(0, Math.min(ci, words[wi].length))) || ' ';
      void w;
    }, 55);
  }

  function heroCard() {
    const samples = [
      { type: 'concert', venue: 'indoor', perimeter: 760, area: 32000, entrances: 4, duration: 4, startTime: '19:00', factors: ['pyro'] },
      { type: 'sport', venue: 'indoor', perimeter: 1100, area: 64000, entrances: 6, duration: 4, startTime: '18:00', factors: ['fans', 'traffic'] },
      { type: 'holiday', venue: 'open', perimeter: 1600, area: 120000, entrances: 6, duration: 8, startTime: '15:00', factors: ['kids'] },
      { type: 'fair', venue: 'fenced', perimeter: 540, area: 17000, entrances: 3, duration: 9, startTime: '10:00', factors: [] }
    ];
    let i = 0;
    function show() {
      const r = HXCalc.compute(Object.assign({ category: '1' }, samples[i]));
      $('#hcType').textContent = r.type.label;
      $('#hcP').textContent = HX.fmt(r.perimeter) + ' м';
      $('#hcS').textContent = HX.fmt(r.area) + ' м²';
      $('#hcC').textContent = HX.fmt(r.capacity) + ' киши';
      $('#hcK').textContent = HX.fmtDec(r.K, 2) + ' · ' + r.risk.label;
      HX.countUp($('#hcN'), r.total, { dur: 900 });
      $('#hcCost').textContent = 'Тахминий қиймат: ' + HX.mln(r.cost);
      const card = $('#heroCard'); card.animate([{ opacity: 0.5, transform: 'scale(.98)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' });
      i = (i + 1) % samples.length;
    }
    show(); setInterval(show, 4200);
  }

  function stats() {
    const apps = HX.apps.all();
    const active = apps.filter(function (a) { return a.status !== 'rejected'; });
    const staff = active.reduce(function (s, a) { return s + (a.result ? a.result.total : 0); }, 0);
    const contracts = apps.filter(function (a) { return ['approved', 'signed', 'paid', 'done'].indexOf(a.status) > -1; }).length;
    const regions = new Set(apps.map(function (a) { return a.event.region; })).size;
    const items = [
      { ic: 'doc', c: 'var(--s1)', v: apps.length, l: 'Платформадаги аризалар' },
      { ic: 'users', c: 'var(--s3)', v: staff, l: 'Жалб этиладиган ходимлар' },
      { ic: 'handshake', c: 'var(--s2)', v: contracts, l: 'Тасдиқланган шартномалар' },
      { ic: 'pin', c: 'var(--s7)', v: regions, l: 'Қамраб олинган ҳудудлар' }
    ];
    $('#stats').innerHTML = items.map(function (s, i) {
      return '<div class="card stat tilt reveal" style="--d:' + (i * 0.08) + 's"><div class="ic" style="background:color-mix(in srgb,' + s.c + ' 16%,transparent);color:' + s.c + '">' + HX.icon(s.ic) + '</div><div class="v" data-count="' + s.v + '">0</div><div class="l">' + s.l + '</div></div>';
    }).join('');
  }

  function directions() {
    const D = [
      ['shield', 'Оммавий тадбирларда фуқаролар хавфсизлиги', 'Миллий гвардия органларининг вазифаларидан бири — оммавий тадбирлар ўтказилаётганда фуқаролар хавфсизлигини ва жамоат тартибини таъминлаш. Биринчи тоифа объектларида — Миллий гвардия масъул.', ['ЎРҚ-647', 'ВМ-205, 15-банд']],
      ['handshake', 'Шартнома асосидаги пуллик хизмат', 'Ташкилотчи ҳудудий бўлинма билан шартнома тузади. 1 киши-соат қиймати — БҲМнинг 7 фоизи; маблағ бюджетдан ташқари махсус ҳисобварақга тушади.', ['ВМ-205, 15-1-банд']],
      ['users', 'Куч ва воситаларни асосли жалб этиш', 'Ходимлар сони тадбир кўлами, хусусияти ва иштирокчилар сонига қараб белгиланади — платформа буни периметр ва майдон бўйича автоматик ҳисоблайди.', ['ВМ-205, 69-банд']],
      ['gate', 'Периметр ва ўтказиш режими', 'Тадбир ҳудуди периметри белгиланади, рухсатнома билан ўтказиш, шахслар ва транспортни техник воситалар ёрдамида кўрикдан ўтказиш ташкил этилади.', ['ВМ-205, 69–70-бандлар']],
      ['doc', 'Ташкилотчи мажбуриятлари', 'Металлодетектор назорати ҳақида огоҳлантириш, тақиқланган буюмлар рўйхати, чипталар сонининг объект сиғимига мослиги, фарқловчи белгилар.', ['ВМ-205, 59, 61-бандлар']],
      ['calendar', 'Муддатлар назорати', 'Шартнома тадбир бошланишидан 10 иш куни олдин тузилади — платформа санани автоматик текширади ва огоҳлантиради.', ['ВМ-205, 15-1-банд']],
      ['cpu', 'Рақамлаштириш ва маълумотлар ҳимояси', 'Рухсатнома электрон тизим орқали берилади; давлат хизматлари электрон шаклда кўрсатилади, шахсга доир маълумотлар қонун асосида ҳимояланади.', ['ВМ-205, 5-банд', 'ЎРҚ-395', 'ЎРҚ-547']],
      ['handshake', 'Давлат-хусусий шериклик', 'Жамоат хавфсизлиги концепцияси давлат органлари ва жамият ҳамкорлигини, ДХШ тўғрисидаги қонун эса хусусий сектор билан шерикликнинг ҳуқуқий асосини белгилайди.', ['ПФ-27', 'ЎРҚ-537']],
      ['alert', '2026 йилги қонунчилик ўзгаришлари', 'Оммавий тартибсизликларга чек қўйиш вазифаси ва хизматчининг фуқарога ўзини таништириш мажбурияти (Сенат 10.09.2026 да маъқуллаган). Объект қўриқлаш Миллий гвардия ваколатида.', ['ЎРҚ-647 ўзгартишлари', 'ПҚ-360']]
    ];
    $('#dirs').innerHTML = D.map(function (d, i) {
      return '<a class="card dir tilt reveal" href="qonunchilik.html" style="--d:' + ((i % 3) * 0.08) + 's;color:inherit;text-decoration:none"><span class="num">' + HX.pad(i + 1) + '</span><div class="ic">' + HX.icon(d[0]) + '</div><h3>' + d[1] + '</h3><p>' + d[2] + '</p><div class="ref">' + d[3].map(function (r) { return '<span class="chip">' + r + '</span>'; }).join('') + '</div></a>';
    }).join('');
  }

  function steps() {
    const S = [
      ['key', 'Рўйхатдан ўтиш', 'СТИР / ЖШШИР ва телефон рақами орқали кириш'],
      ['doc', 'Тадбир маълумотлари', 'Тури, санаси, манзили, тоифаси, иштирокчилар'],
      ['polygon', 'Периметр ва майдон', 'Харитада чизиш ёки ўлчамларни киритиш'],
      ['users', 'Автоматик ҳисоб', 'Ходимлар сони, техник воситалар, қиймат'],
      ['pen', 'Шартнома', 'Кўриб чиқиш, ЭРИ билан имзолаш, тўлов'],
      ['shieldCheck', 'Хизмат кўрсатиш', 'Кучлар жойлаштирилади, мониторинг юритилади']
    ];
    const box = $('#steps');
    box.insertAdjacentHTML('beforeend', S.map(function (s, i) {
      return '<div class="step reveal" style="--d:' + (i * 0.35) + 's"><div class="dot" style="--d:' + (i * 0.38) + 's">' + HX.icon(s[0]) + '</div><h4>' + (i + 1) + '. ' + s[1] + '</h4><p>' + s[2] + '</p></div>';
    }).join(''));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { box.classList.add('in'); io.disconnect(); } }, { threshold: 0.3 });
      io.observe(box);
    } else box.classList.add('in');
  }

  function quickCalc() {
    const tSel = $('#qcType'), vSel = $('#qcVenue');
    tSel.innerHTML = HXCalc.EVENT_TYPES.map(function (t) { return '<option value="' + t.id + '">' + t.label + '</option>'; }).join('');
    vSel.innerHTML = Object.values(HXCalc.VENUES).map(function (v) { return '<option value="' + v.id + '">' + v.label + '</option>'; }).join('');
    const ids = ['qcP', 'qcS', 'qcD', 'qcE'];
    let last = null;
    function run() {
      const meta = HXCalc.EVENT_TYPES.find(function (t) { return t.id === tSel.value; }) || {};
      const route = HXCalc.workMode(meta, { mode: meta.modes ? meta.modes[0] : meta.mode }) === 'route';
      const pLab = $('#qcP').closest('.range-row').querySelector('.label');
      const sRow = $('#qcS').closest('.range-row');
      const eRow = $('#qcE').closest('.range-row');
      if (pLab) pLab.textContent = route ? 'Йўналиш узунлиги' : 'Периметр';
      if (sRow) sRow.style.display = route ? 'none' : '';
      if (eRow) eRow.style.display = route ? 'none' : '';
      const inp = { type: tSel.value, mode: HXCalc.workMode(meta, {}), venue: vSel.value, category: '1', perimeter: +$('#qcP').value, area: route ? 0 : +$('#qcS').value, duration: +$('#qcD').value, entrances: route ? 0 : +$('#qcE').value, startTime: '17:00', factors: [], shape: route ? 'route' : 'area', crowd: route ? 'open' : 'limited', attendees: route ? 8000 : '' };
      $('#qcPv').textContent = HX.fmt(inp.perimeter) + ' м';
      $('#qcSv').textContent = route ? 'йўқ' : (HX.fmt(inp.area) + ' м²');
      $('#qcDv').textContent = inp.duration + ' соат';
      $('#qcEv').textContent = inp.entrances;
      const r = HXCalc.compute(inp);
      last = inp;
      HX.countUp($('#qcTotal'), r.total, { dur: 600 });
      HX.countUp($('#qcCap'), r.capacity, { dur: 600 });
      HX.countUp($('#qcPH'), r.personHours, { dur: 600 });
      HX.countUp($('#qcCost'), r.cost / 1e6, { dur: 600, dec: 1 });
      $('#qcRisk').innerHTML = HX.riskBadge(r.risk.id);
      const max = Math.max.apply(null, r.parts.map(function (p) { return p.value; })) || 1;
      const bars = $('#qcBars');
      const sig = r.parts.map(function (p) { return p.label; }).join('|');
      if (bars.dataset.sig !== sig) { bars.dataset.sig = sig; bars.innerHTML = r.parts.map(function (p) { return '<div class="bar-row" data-id="' + p.id + '"><span>' + p.label + '</span><div class="track"><div class="fill" style="background:' + HX.PART_COLORS[p.id] + '"></div></div><b>0</b></div>'; }).join(''); }
      r.parts.forEach(function (p) {
        const row = bars.querySelector('[data-id="' + p.id + '"]');
        row.querySelector('.fill').style.width = (p.value / max * 100) + '%';
        row.querySelector('b').textContent = HX.fmt(p.value);
        row.setAttribute('data-tip', '<b>' + p.label + '</b><br>' + HX.esc(p.formula));
      });
      $('#qcWarn').innerHTML = r.warnings.filter(function (w) { return w.level === 'critical'; }).map(function (w) { return '<div class="warn-item critical">' + HX.icon('alert') + '<span>' + w.text + '</span></div>'; }).join('');
    }
    ids.forEach(function (id) { $('#' + id).addEventListener('input', run); });
    tSel.addEventListener('change', run); vSel.addEventListener('change', run);
    $('#qcGo').addEventListener('click', function () {
      HX.store.set('hx.draft', { event: { type: last.type, venue: last.venue, duration: last.duration, entrances: last.entrances, crowd: last.crowd, attendees: last.attendees || '' }, geometry: { mode: 'map', kind: last.shape === 'route' ? 'route' : 'area', latlngs: [], perimeter: 0, area: 0 } });
    });
    setTimeout(run, 300);
  }

  function services() {
    const S = [['shield', 'Тадбир хавфсизлигини таъминлаш'], ['store', 'Савдо мажмуи ва бозор — ички патрул'], ['flag', 'Марафон — пост патрули'], ['gate', 'Назорат-ўтказиш пунктлари'], ['target', 'Металлодетектор назорати'], ['users', 'Патруль нарядлари'], ['truck', 'Йўл ҳаракатини тартибга солиш'], ['paw', 'Кинологик текширув'], ['camera', 'Видеокузатув'], ['radio', 'Алоқа ва бошқарув'], ['barrier', 'Тўсиқлар билан ўраш']];
    const one = S.map(function (s) { return '<span class="svc">' + HX.icon(s[0]) + s[1] + '</span>'; }).join('');
    $('#svc').innerHTML = one + one;
  }

  function modules() {
    const box = $('#mods');
    if (!box) return;
    const M = [
      ['xarita.html', 'map', 'var(--s1)', 'Периметр калькулятори', 'Ҳудудни харитада чизинг — периметр, майдон ва кучлар жойлашуви автоматик.'],
      ['kabinet.html', 'user', 'var(--s3)', 'Шахсий кабинет', 'Буюртмачи учун: ариза устаси, аризалар ҳолати, шартнома ва хабарномалар.'],
      ['qonunchilik.html', 'scale', 'var(--s7)', 'Ҳуқуқий база', 'Амалдаги ҳужжатлар, асосий йўналишлар ва ҳисоблаш методикаси.']
    ];
    box.innerHTML = M.map(function (m, i) {
      return '<a class="card mod tilt reveal" href="' + m[0] + '" style="--d:' + (i * 0.08) + 's"><div class="ic" style="background:' + m[2] + '">' + HX.icon(m[1]) + '</div><h3>' + m[3] + '</h3><p>' + m[4] + '</p><span class="go">Очиш ' + HX.icon('arrowRight') + '</span></a>';
    }).join('');
  }
})();
