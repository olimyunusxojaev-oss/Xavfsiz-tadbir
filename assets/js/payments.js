/* =========================================================
   Тўлов модули (демо): Click, Payme, Visa
   • Реал тизимда: Click — Merchant API (Prepare/Complete),
     Payme — Merchant API (JSON-RPC: CheckPerformTransaction,
     CreateTransaction, PerformTransaction), Visa — эквайер банкнинг
     ҳимояланган тўлов саҳифаси (3-D Secure). Карта маълумотлари
     платформада киритилмайди ва сақланмайди.
   • Бу прототипда ҳеч қандай пул ўтказилмайди.
   ========================================================= */
(function (global) {
  'use strict';
  const HX = global.HX;
  const ic = HX.icon, esc = HX.esc;

  HX.PAY_METHODS = [
    { id: 'click', name: 'Click', mark: '<span class="pm-mark click"><b>CLICK</b></span>', kind: 'app', note: 'Click иловаси ёки USSD орқали' },
    { id: 'payme', name: 'Payme', mark: '<span class="pm-mark payme"><b>pay</b><i>me</i></span>', kind: 'app', note: 'Payme иловаси орқали' },
    { id: 'visa', name: 'Visa', mark: '<span class="pm-mark visa"><b>VISA</b></span>', kind: 'card', note: 'Халқаро банк картаси (3-D Secure)' }
  ];
  HX.payMethod = function (id) { return HX.PAY_METHODS.find(function (m) { return m.id === id; }); };

  // Безакли «демо QR» (ҳисоб рақамидан ҳосил қилинган нақш; сканерланмайди)
  function demoQR(seed) {
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const n = 21, s = 6; let cells = '';
    const rnd = function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    const finder = function (x, y) { return '<rect x="' + x * s + '" y="' + y * s + '" width="' + 7 * s + '" height="' + 7 * s + '" fill="#111"/><rect x="' + (x + 1) * s + '" y="' + (y + 1) * s + '" width="' + 5 * s + '" height="' + 5 * s + '" fill="#fff"/><rect x="' + (x + 2) * s + '" y="' + (y + 2) * s + '" width="' + 3 * s + '" height="' + 3 * s + '" fill="#111"/>'; };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (!inF && rnd() > 0.52) cells += '<rect x="' + x * s + '" y="' + y * s + '" width="' + s + '" height="' + s + '" fill="#111"/>';
    }
    return '<svg class="pm-qr" viewBox="-6 -6 ' + (n * s + 12) + ' ' + (n * s + 12) + '"><rect x="-6" y="-6" width="' + (n * s + 12) + '" height="' + (n * s + 12) + '" fill="#fff" rx="6"/>' + cells + finder(0, 0) + finder(14, 0) + finder(0, 14) + '</svg>';
  }

  HX.payModal = function (app, onPaid) {
    const amount = app.result.cost, invoice = 'INV-' + app.id.replace(/\D/g, '').slice(-8);
    let method = null;
    const m = HX.modal({
      wide: false,
      title: 'Хизмат ҳақини тўлаш',
      body: '<div class="pm-amount"><span>Тўланадиган сумма</span><b>' + HX.fmt(amount) + ' <small>сўм</small></b><em>' + HX.fmt(app.result.personHours) + ' киши-соат × ' + HX.money(app.result.rate) + '</em></div>' +
        '<dl class="kv" style="margin:14px 0"><dt>Ҳисоб рақами</dt><dd class="mono">' + invoice + '</dd><dt>Қабул қилувчи</dt><dd>' + esc(HX.region(app.event.region).name) + ' бўйича ҳудудий бўлинма</dd><dt>Ҳисобварақ тури</dt><dd>Бюджетдан ташқари махсус ҳисобварақ</dd><dt>Тўлов мақсади</dt><dd>Шартнома № ' + esc(app.contractNo || '—') + ' бўйича хизмат ҳақи</dd></dl>' +
        '<div class="label" style="margin-bottom:8px">Тўлов усулини танланг</div>' +
        '<div class="pm-grid">' + HX.PAY_METHODS.map(function (p) {
          return '<button type="button" class="pm-card" data-m="' + p.id + '">' + p.mark + '<span>' + p.note + '</span></button>';
        }).join('') + '</div>' +
        '<div id="pmPanel"></div>' +
        '<div class="warn-item info" style="margin-top:14px">' + ic('lock') + '<span>Прототип: ҳақиқий пул ўтказилмайди. Реал тизимда тўлов тўлов тизимининг ҳимояланган саҳифасида амалга оширилади, карта маълумотлари платформада сақланмайди.</span></div>',
      foot: '<button class="btn" data-close>Бекор қилиш</button><button class="btn btn-primary" id="pmGo" disabled>' + ic('lock') + 'Тўлов усулини танланг</button>'
    });
    const panel = HX.$('#pmPanel', m.el), go = HX.$('#pmGo', m.el);
    HX.$$('.pm-card', m.el).forEach(function (b) {
      b.onclick = function () {
        method = HX.payMethod(b.dataset.m);
        HX.$$('.pm-card', m.el).forEach(function (x) { x.classList.toggle('on', x === b); });
        go.disabled = false;
        go.innerHTML = ic('lock') + (method.kind === 'card' ? 'Ҳимояланган тўлов саҳифасига ўтиш (демо)' : method.name + ' орқали тўлаш (демо)');
        panel.innerHTML = method.kind === 'app'
          ? '<div class="pm-panel"><div>' + demoQR(invoice + method.id) + '<div class="small muted" style="text-align:center;margin-top:4px">демо QR</div></div><ol class="pm-steps"><li>' + method.name + ' иловасини очинг</li><li>QR кодни сканерланг ёки ҳисоб рақамини киритинг: <b class="mono">' + invoice + '</b></li><li>Суммани текшириб, тўловни тасдиқланг</li><li>Тўлов тасдиқлангач, ариза ҳолати автоматик «Тўлов амалга оширилди»га ўзгаради</li></ol></div>'
          : '<div class="pm-panel card-flow"><div class="pm-cardart"><span class="chip-ic"></span><span class="num">•••• •••• •••• ••••</span><span class="brand">VISA</span></div><ol class="pm-steps"><li>Эквайер банкнинг ҳимояланган (3-D Secure) саҳифаси очилади</li><li>Карта маълумотлари шу саҳифада киритилади — платформа уларни кўрмайди</li><li>Банк юборган бир марталик код билан тасдиқланади</li><li>Натижа платформага автоматик қайтади</li></ol></div>';
      };
    });
    go.onclick = function () {
      if (!method) return;
      go.disabled = true;
      panel.innerHTML = '<div class="pm-progress"><div class="spinner"></div><b>' + (method.kind === 'card' ? 'Банк тасдиғи кутилмоқда (3-D Secure)…' : method.name + ' тизимидан тасдиқ кутилмоқда…') + '</b><span class="small muted">Демо режим</span></div>';
      setTimeout(function () {
        const txn = method.id.toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
        const payment = { method: method.id, txn: txn, invoice: invoice, amount: amount, at: new Date().toISOString() };
        m.close();
        if (onPaid) onPaid(payment);
        HX.receipt(Object.assign({}, app, { payment: payment }));
      }, 1600);
    };
    return m;
  };

  // Тўлов чеки
  HX.receipt = function (app) {
    const p = app.payment; if (!p) return;
    const meth = HX.payMethod(p.method) || { name: p.method, mark: '' };
    const m = HX.modal({
      title: 'Тўлов чеки',
      body: '<div class="receipt"><div class="rc-top">' + HX.logo() + '<div><b>ХАВФСИЗ ТАДБИР</b><span>Тўлов чеки (демо)</span></div></div>' +
        '<div class="rc-ok">' + ic('check') + '<b>Тўлов қабул қилинди</b></div>' +
        '<dl class="kv"><dt>Сумма</dt><dd>' + HX.money(p.amount) + '</dd><dt>Тўлов усули</dt><dd>' + meth.name + '</dd><dt>Транзакция</dt><dd class="mono">' + esc(p.txn) + '</dd><dt>Ҳисоб рақами</dt><dd class="mono">' + esc(p.invoice) + '</dd><dt>Ариза</dt><dd class="mono">' + esc(app.id) + '</dd><dt>Шартнома</dt><dd>' + esc(app.contractNo || '—') + '</dd><dt>Сана</dt><dd>' + HX.dateTime(p.at) + '</dd></dl></div>',
      foot: '<button class="btn" data-close>Ёпиш</button><button class="btn btn-primary" id="rcPrint">' + ic('print') + 'Чоп этиш</button>'
    });
    HX.$('#rcPrint', m.el).onclick = function () {
      const w = global.open('', '_blank'); if (!w) return;
      let html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(p.txn) + '</title><style>body{font:14px Arial,sans-serif;max-width:420px;margin:30px auto;color:#111}dl{display:grid;grid-template-columns:auto 1fr;gap:8px 16px}dd{margin:0;text-align:right;font-weight:600}h2{margin:0 0 4px}</style></head><body><h2>ХАВФСИЗ ТАДБИР</h2><p>Тўлов чеки (демо)</p>' + m.el.querySelector('.kv').outerHTML + '<script>setTimeout(function(){print()},300)<\/script></body></html>';
      if (global.HXI18N && HXI18N.lang() !== 'uz-cyrl') html = HXI18N.tHTML(html);
      w.document.write(html); w.document.close();
    };
  };
})(window);
