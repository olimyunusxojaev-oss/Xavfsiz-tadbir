/* =========================================================
   Иллюстрациялар: «Хавфсизлик зоналари» интерактив инфографикаси
   (бош саҳифа ва периметр калькуляторида ишлатилади)
   ========================================================= */
(function (global) {
  'use strict';
  const HX = global.HX;

  HX.ZONES = [
    { n: 1, c: 'var(--s4)', t: 'Ташқи зона — йўл ҳаракати', d: 'Йўллар кесишмаларида ва НЎП олдида транспорт оқими тартибга солинади, автотураргоҳ назорат қилинади.' },
    { n: 2, c: 'var(--s2)', t: 'НЎП — кириш нуқталари', d: 'Йўллар ва пиёдалар оқими периметрга етиб келадиган жойларда: металлодетектор рамкаси, қўл билан кўрик, чипта назорати.' },
    { n: 3, c: 'var(--s1)', t: 'Периметр постлари', d: 'Тўсиқ бўйлаб кўриш масофасида (100–200 м) жойлашади, ноқонуний киришнинг олдини олади.' },
    { n: 4, c: 'var(--s3)', t: 'Ички зона — патруль секторлари', d: 'Ҳудуд секторларга бўлинади; ҳар бир сектор бўйича 2 кишилик нарядлар белгиланган йўналишда айланиб юради.' },
    { n: 5, c: '#fab219', t: 'Эвакуация йўналишлари', d: 'Ҳар бир сектордан энг яқин чиқишга; йўлаклар бўш сақланади (ВМ-205, 70-банд).' },
    { n: 6, c: 'var(--gold)', t: 'Штаб ва тезкор захира', d: 'Асосий НЎП олдида: масъул раҳбар, командирлар, захира ва кинологлар.' }
  ];

  HX.zonesSVG = function (id) {
    id = id || 'z';
    const G = function (x, y, s) { return '<use href="#' + id + '-guard" x="' + (x - s / 2) + '" y="' + (y - s / 2) + '" width="' + s + '" height="' + s + '"/>'; };
    // тўсиқ (периметр) бўйлаб постлар
    const fence = [[80, 60], [520, 60], [520, 320], [80, 320]];
    let posts = '';
    [[150, 60], [240, 60], [330, 60], [420, 60], [520, 110], [520, 260], [440, 320], [190, 320], [80, 120], [80, 200], [80, 270]].forEach(function (p) { posts += G(p[0], p[1], 18); });
    // оломон
    let crowd = '';
    const rnd = function (i) { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
    for (let i = 0; i < 170; i++) {
      // оломон саҳна олдида зичроқ
      const x = 100 + rnd(i) * 400, y = 122 + Math.pow(rnd(i + 999), 1.6) * 185;
      crowd += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.9"/>';
    }
    // секторлар (2×3) ва патруль йўналишлари
    let sectors = '', routes = '', movers = '';
    const cols = [80, 227, 373, 520], rows = [115, 217, 320];
    let k = 0;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x0 = cols[c], x1 = cols[c + 1], y0 = rows[r], y1 = rows[r + 1];
      sectors += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" />';
      const ix = x0 + 26, iy = y0 + 22, iw = x1 - x0 - 52, ih = y1 - y0 - 44;
      const path = 'M' + ix + ',' + iy + ' h' + iw + ' v' + ih + ' h' + (-iw) + ' Z';
      routes += '<path id="' + id + '-r' + k + '" d="' + path + '" />';
      movers += '<g><use href="#' + id + '-patrol" x="-9" y="-9" width="18" height="18"/><animateMotion dur="' + (9 + k) + 's" repeatCount="indefinite" begin="-' + (k * 1.7) + 's"><mpath href="#' + id + '-r' + k + '"/></animateMotion></g>';
      sectors += '<text class="sub" x="' + (x0 + 8) + '" y="' + (y0 + 16) + '">С-' + (k + 1) + '</text>';
      k++;
    }
    return '' +
      '<svg class="zones-ill" id="' + id + '" viewBox="0 0 640 420" role="img" aria-label="Хавфсизлик зоналари схемаси">' +
      '<defs>' +
      '<symbol id="' + id + '-guard" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="var(--s1)" stroke="#fff" stroke-width="2"/><g transform="translate(3.6 3.4) scale(.7)"><path d="M7.4 7.3h9.2l-1-2.7a1.6 1.6 0 0 0-1.5-1H9.9a1.6 1.6 0 0 0-1.5 1z" fill="#ffd36b"/><circle cx="12" cy="9.7" r="2.9" fill="#fff"/><path d="M6.6 21v-4.2a5.4 5.4 0 0 1 10.8 0V21z" fill="#fff"/></g></symbol>' +
      '<symbol id="' + id + '-patrol" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="var(--s3)" stroke="#fff" stroke-width="2"/><g transform="translate(3.6 3.6) scale(.7)"><circle cx="8.5" cy="8" r="2.4" fill="#fff"/><path d="M4.2 19v-3.2a4.3 4.3 0 0 1 8.6 0V19z" fill="#fff"/><circle cx="15.9" cy="9" r="2.2" fill="#fff"/><path d="M12.4 19v-2.7a3.9 3.9 0 0 1 7.8 0V19z" fill="#fff"/></g></symbol>' +
      '<symbol id="' + id + '-gate" viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5" fill="var(--s2)" stroke="#fff" stroke-width="2"/><g transform="translate(3.6 3.6) scale(.7)"><path d="M5 21V6.6A2.6 2.6 0 0 1 7.6 4h8.8A2.6 2.6 0 0 1 19 6.6V21h-2.4V6.9H7.4V21z" fill="#fff"/><circle cx="12" cy="10.6" r="1.7" fill="#ffe2b8"/><path d="M9.7 21v-4.4a2.3 2.3 0 0 1 4.6 0V21z" fill="#ffe2b8"/></g></symbol>' +
      '<symbol id="' + id + '-cone" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="var(--s4)" stroke="#fff" stroke-width="2"/><g transform="translate(3.6 3.6) scale(.7)"><path d="M10.4 3h3.2l4.6 15H5.8z" fill="#fff"/><path d="M8.7 8.6h6.6l.9 3H7.8z" fill="#e85d04"/><rect x="4" y="18" width="16" height="3" rx="1" fill="#fff"/></g></symbol>' +
      '<marker id="' + id + '-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#fab219"/></marker>' +
      '</defs>' +
      // фон ва йўллар (1-зона)
      '<rect x="4" y="4" width="632" height="412" rx="22" fill="var(--surface-2)" stroke="var(--line)"/>' +
      '<g class="z" data-z="1">' +
      '<rect x="20" y="352" width="600" height="40" rx="6" fill="color-mix(in srgb, var(--text) 16%, var(--surface-2))"/><line x1="30" y1="372" x2="610" y2="372" stroke="#fff" stroke-width="2" stroke-dasharray="14 12" opacity=".7"/>' +
      '<rect x="560" y="20" width="40" height="372" rx="6" fill="color-mix(in srgb, var(--text) 16%, var(--surface-2))"/><line x1="580" y1="30" x2="580" y2="350" stroke="#fff" stroke-width="2" stroke-dasharray="14 12" opacity=".7"/>' +
      '<use href="#' + id + '-cone" x="290" y="378" width="20" height="20"/><use href="#' + id + '-cone" x="566" y="168" width="20" height="20"/><use href="#' + id + '-cone" x="566" y="356" width="20" height="20"/><use href="#' + id + '-cone" x="140" y="378" width="20" height="20"/>' +
      '<circle cx="580" cy="372" r="15" fill="none" stroke="var(--s4)" stroke-width="2" stroke-dasharray="4 4"/>' +
      '</g>' +
      // ҳудуд ва оломон
      '<rect x="80" y="60" width="440" height="260" rx="14" fill="color-mix(in srgb, var(--accent) 7%, var(--surface))"/>' +
      '<rect x="245" y="72" width="150" height="40" rx="8" fill="color-mix(in srgb, var(--text) 22%, var(--surface))"/><text x="320" y="97" text-anchor="middle">САҲНА</text>' +
      '<g fill="var(--muted)" opacity=".55">' + crowd + '</g>' +
      // 4-зона: секторлар ва патруль йўналишлари
      '<g class="z" data-z="4"><g fill="none" stroke="var(--s3)" stroke-width="1" stroke-dasharray="2 5" opacity=".7">' + sectors + '</g>' +
      '<g fill="none" stroke="var(--s3)" stroke-width="2.2" stroke-dasharray="9 7" class="route-line">' + routes + '</g>' + movers + '</g>' +
      // 5-зона: эвакуация
      '<g class="z" data-z="5" stroke="#fab219" stroke-width="2.5" fill="none" stroke-dasharray="6 6" marker-end="url(#' + id + '-arr)">' +
      '<path class="evac-line" d="M300,270 C300,290 300,300 300,312"/><path class="evac-line" d="M450,170 C480,180 500,185 512,190"/><path class="evac-line" d="M150,270 C150,290 150,300 150,312"/></g>' +
      // 3-зона: периметр
      '<g class="z" data-z="3"><rect x="80" y="60" width="440" height="260" rx="14" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="12 7" class="perimeter-line"/>' + posts + '</g>' +
      // 2-зона: НЎП (йўл томонда)
      '<g class="z" data-z="2"><use href="#' + id + '-gate" x="286" y="306" width="28" height="28"/><use href="#' + id + '-gate" x="506" y="176" width="28" height="28"/><use href="#' + id + '-gate" x="136" y="306" width="28" height="28"/>' +
      '<path d="M300 336 v14 M534 190 h24 M150 336 v14" stroke="var(--s2)" stroke-width="3"/></g>' +
      // 6-зона: штаб
      '<g class="z" data-z="6"><rect x="318" y="327" width="70" height="22" rx="6" fill="var(--gold)" opacity=".9"/><text x="353" y="342" text-anchor="middle" style="fill:#2a1600;font-size:11px">ШТАБ</text><path d="M332 330 v-14" stroke="#2a1600" stroke-width="2"/><path d="M333 316 h12 l-3 4 3 4 h-12z" fill="#2a1600"/></g>' +
      // рақамли изоҳлар
      [[40, 340, 1], [270, 300, 2], [96, 44, 3], [470, 130, 4], [330, 262, 5], [404, 338, 6]].map(function (p) {
        const z = HX.ZONES[p[2] - 1];
        return '<g class="z" data-z="' + p[2] + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="' + z.c + '" stroke="#fff" stroke-width="2"/><text x="' + p[0] + '" y="' + (p[1] + 4) + '" text-anchor="middle" style="fill:#fff;font-size:11px">' + p[2] + '</text></g>';
      }).join('') +
      '</svg>';
  };

  // Инфографика + изоҳлар (ўзаро боғланган ҳолда)
  HX.mountZones = function (el, id) {
    el.innerHTML = '<div class="zones-wrap">' + HX.zonesSVG(id) + '</div><div class="zone-keys">' + HX.ZONES.map(function (z) {
      return '<div class="zone-key" data-z="' + z.n + '"><span class="n" style="background:' + z.c + '">' + z.n + '</span><div><b>' + z.t + '</b><span>' + z.d + '</span></div></div>';
    }).join('') + '</div>';
    const svg = el.querySelector('svg');
    const focus = function (n) {
      svg.classList.toggle('focus', !!n);
      svg.querySelectorAll('.z').forEach(function (g) { g.classList.toggle('on', g.getAttribute('data-z') === String(n)); });
      el.querySelectorAll('.zone-key').forEach(function (k) { k.classList.toggle('on', k.getAttribute('data-z') === String(n)); });
    };
    el.querySelectorAll('.zone-key').forEach(function (k) {
      k.addEventListener('mouseenter', function () { focus(k.getAttribute('data-z')); });
      k.addEventListener('mouseleave', function () { focus(null); });
      k.addEventListener('click', function () { focus(k.classList.contains('on') ? null : k.getAttribute('data-z')); });
    });
    svg.querySelectorAll('.z').forEach(function (g) {
      g.addEventListener('mouseenter', function () { focus(g.getAttribute('data-z')); });
      g.addEventListener('mouseleave', function () { focus(null); });
    });
  };
})(window);
