/* =========================================================
   Мониторинг ва бошқарув панели (Миллий гвардия оператори)
   ========================================================= */
(function () {
  'use strict';
  const $ = HX.$, $$ = HX.$$, esc = HX.esc, ic = HX.icon;
  const ACTIVE = ['submitted', 'review', 'approved', 'signed', 'paid'];
  let region = 'all', statusF = null, query = '', sortBy = 'date', map, markers, drawerMap = null;

  let booted = false, queue = 'review', regTab = 'clients', regQuery = '';
  function sectionOf() {
    if (location.hash.indexOf('reestr') > -1) return 'reestr';
    if (location.hash.indexOf('contracts') > -1) return 'contracts';
    return 'admin';
  }
  function scrollHash() {
    const id = sectionOf();
    if (id === 'admin') return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  HX.ready(function () {
    HX.ensureDirectory();
    HX.renderShell(sectionOf());
    window.addEventListener('hashchange', function () {
      HX.renderHeader(sectionOf());
      scrollHash();
    });
    const adm0 = HX.admin.get();
    if (!adm0 || !adm0.login) { showGate(); return; }
    enterAdmin();
  });

  function showGate() {
    const gate = $('#adminGate'), app = $('#adminApp');
    if (gate) gate.classList.remove('hidden');
    if (app) app.classList.add('hidden');
    const btn = $('#admIn');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.onclick = function () {
        const login = ($('#admLogin').value || '').trim();
        const pass = $('#admPass').value || '';
        const row = HX.executors.byLogin(login);
        if (!row || !row.active || row.password !== pass) {
          $('#admLogin').classList.add('invalid');
          $('#admPass').classList.add('invalid');
          HX.toast('Логин ёки парол нотўғри', 'Ҳудуд коди ва демо паролни текширинг.', 'err');
          return;
        }
        const reg = row.region === 'all' ? null : HX.region(row.region);
        HX.admin.set({
          id: row.id, login: row.login, name: row.name, rank: row.rank || '',
          region: row.region, role: row.role,
          unit: reg ? reg.name + ' бўйича ҳудудий бўлинма' : 'Марказий аппарат',
          at: new Date().toISOString()
        });
        enterAdmin();
      };
    }
  }

  function isCentral() {
    const adm = HX.admin.get();
    return !!(adm && adm.region === 'all');
  }
  function enterAdmin() {
    const gate = $('#adminGate'), app = $('#adminApp');
    if (gate) gate.classList.add('hidden');
    if (app) app.classList.remove('hidden');
    HX.renderHeader(sectionOf());
    if (booted) { renderAll(); return; }
    booted = true;
    const adm = HX.admin.get();
    const central = isCentral();
    if ($('#opsTitle')) $('#opsTitle').textContent = central ? 'Мониторинг ва бошқарув панели' : 'Масъул ижрочи шахсий кабинети';
    if ($('#opsRole') && adm) $('#opsRole').textContent = (adm.rank ? adm.rank + ' ' : '') + adm.name + ' · ' + adm.unit + (adm.login ? ' · ' + adm.login : '');
    $('#fRegion').innerHTML = '<option value="all">Барча ҳудудлар</option>' + HX.REGIONS.map(function (r) { return '<option value="' + r.id + '">' + r.name + '</option>'; }).join('');
    if (adm && adm.region && adm.region !== 'all') { region = adm.region; $('#fRegion').value = region; $('#fRegion').disabled = true; }
    $('#fRegion').onchange = function () { region = this.value; renderAll(); focusRegion(true); };
    $('#btnNorms').innerHTML = ic('sliders') + 'Методика нормалари';
    $('#btnNorms').onclick = normsModal;
    if ($('#btnDemo')) {
      if (central) {
        $('#btnDemo').innerHTML = ic('plus') + 'Демо ариза';
        $('#btnDemo').onclick = demoApp;
      } else $('#btnDemo').classList.add('hidden');
    }
    if (!central && $('#qLead')) $('#qLead').textContent = 'Рўйхат шу ҳудуддаги аризалар. Шартномани кўриш ва юклаб олиш мумкин. Юбориш марказий аппарат ваколатида.';
    $('#qIc').innerHTML = ic('search');
    $('#q').oninput = function () { query = this.value.toLowerCase(); table(); };
    $('#sort').onchange = function () { sortBy = this.value; table(); };
    tick(); setInterval(tick, 1000);
    const q = location.hash.match(/q=(review|approved|paid|other)/);
    if (q) queue = q[1];
    initMap();
    renderAll();
    document.addEventListener('hx:apps', renderAll);
    const m = location.hash.match(/app=([^&]+)/); if (m) openApp(decodeURIComponent(m[1]));
    setTimeout(scrollHash, 350);
  }

  function tick() { const d = new Date(); $('#clock').textContent = HX.pad(d.getHours()) + ':' + HX.pad(d.getMinutes()) + ':' + HX.pad(d.getSeconds()); }
  function apps() { return HX.apps.all().filter(function (a) { return region === 'all' || a.event.region === region; }); }
  function renderAll() { kpis(); pipeline(); markersRender(); feed(); chartDays(); chartRegions(); chartTypes(); contracts(); registry(); table(); HX.observe(document); }

  function unitName(id) { return id === 'all' ? 'Марказий аппарат' : (HX.region(id).name + ' бўлинмаси'); }
  function clientKey(o) {
    const tin = String((o && o.tin) || '').replace(/\s/g, '');
    if (tin) return 'tin:' + tin;
    return 'np:' + String((o && (o.org || o.name)) || '').toLowerCase() + '|' + String((o && o.phone) || '').replace(/\D/g, '');
  }
  function collectClients() {
    const rows = {};
    HX.clients.all().forEach(function (c) {
      const row = Object.assign({ apps: 0, source: 'manual' }, c);
      rows[c.id] = row;
    });
    const byKey = {};
    Object.keys(rows).forEach(function (id) { byKey[clientKey(rows[id])] = rows[id]; });
    HX.apps.all().forEach(function (a) {
      const o = a.owner || {};
      const k = clientKey(o);
      let row = byKey[k];
      if (!row) {
        row = { id: 'app:' + k, org: o.org || '', name: o.name || '', phone: o.phone || '', tin: o.tin || '', email: o.email || '', region: a.event.region, source: 'app', apps: 0, notes: '' };
        rows[row.id] = row;
        byKey[k] = row;
      }
      row.apps = (row.apps || 0) + 1;
      if (!row.region) row.region = a.event.region;
    });
    return Object.keys(rows).map(function (id) { return rows[id]; });
  }
  function registry() {
    const box = $('#regSeg'); if (!box) return;
    const adm = HX.admin.get() || {};
    box.innerHTML = '<button type="button" data-t="clients" class="' + (regTab === 'clients' ? 'on' : '') + '">Мижозлар</button><button type="button" data-t="staff" class="' + (regTab === 'staff' ? 'on' : '') + '">Масъул ижрочилар</button>';
    $$('#regSeg button').forEach(function (b) { b.onclick = function () { regTab = b.dataset.t; registry(); }; });
    const add = $('#regAdd');
    const central = isCentral();
    if (add) {
      add.classList.toggle('hidden', !central);
      add.innerHTML = ic('plus') + (regTab === 'clients' ? 'Мижоз қўшиш' : 'Ижрочи қўшиш');
      add.onclick = function () { if (!isCentral()) return; if (regTab === 'clients') clientModal(null); else execModal(null); };
    }
    if (regTab === 'staff') renderExecutors(adm);
    else renderClients(adm);
    const find = $('#regFind');
    if (find) {
      find.classList.toggle('hidden', regTab !== 'clients');
      if (!find.dataset.bound) {
        find.dataset.bound = '1';
        find.addEventListener('input', function () { regQuery = this.value.trim().toLowerCase(); renderClients(HX.admin.get() || {}); });
      }
    }
  }
  function renderClients(adm) {
    const central = isCentral();
    $('#regLead').textContent = central
      ? 'Мижозлар аризалардан ва қўлда киритилган ёзувлардан йиғилади. Таҳрир аризалардаги буюртмачи маълумотига ҳам ёзилади.'
      : 'Шу ҳудуд мижозлари. Қўшиш ва таҳрирлаш марказий аппарат ваколатида.';
    $('#regHead').innerHTML = '<tr><th>Ташкилот</th><th>Масъул</th><th>Телефон</th><th>СТИР</th><th>Ҳудуд</th><th class="num">Ариза</th>' + (central ? '<th>Амаллар</th>' : '') + '</tr>';
    let rows = collectClients();
    if (adm.region && adm.region !== 'all') rows = rows.filter(function (c) { return c.region === adm.region; });
    if (regQuery) {
      rows = rows.filter(function (c) {
        return [c.org, c.name, c.phone, c.tin].join(' ').toLowerCase().indexOf(regQuery) > -1;
      });
    }
    rows.sort(function (a, b) { return String(a.org || a.name).localeCompare(String(b.org || b.name), 'uz'); });
    $('#regBody').innerHTML = rows.map(function (c) {
      return '<tr><td><b>' + esc(c.org || '—') + '</b></td><td>' + esc(c.name || '—') + '</td><td>' + esc(c.phone || '—') + '</td><td class="mono">' + esc(c.tin || '—') + '</td><td>' + esc(c.region ? HX.region(c.region).name : '—') + '</td><td class="num">' + (c.apps || 0) + '</td>' + (central ? '<td><button class="btn btn-sm" data-cedit="' + esc(c.id) + '">' + ic('edit') + 'Таҳрир</button></td>' : '') + '</tr>';
    }).join('') || '<tr><td colspan="' + (central ? 7 : 6) + '" class="empty">' + (regQuery ? 'Қидирув бўйича мижоз топилмади' : 'Мижоз йўқ') + '</td></tr>';
    $$('#regBody [data-cedit]').forEach(function (b) {
      b.onclick = function () {
        const row = collectClients().find(function (c) { return c.id === b.dataset.cedit; });
        if (row) clientModal(row);
      };
    });
  }
  function renderExecutors(adm) {
    const central = isCentral();
    $('#regLead').textContent = central
      ? 'Ҳар бир ҳудудий бўлинмада камида битта ижрочи логини сақланади. Шу ердан яна қўшиш ва таҳрирлаш мумкин.'
      : 'Шу бўлинма масъул ижрочилари. Қўшиш ва таҳрирлаш марказий аппарат ваколатида.';
    $('#regHead').innerHTML = '<tr><th>ФИО</th><th>Бўлинма</th><th>Логин</th><th>Телефон</th><th>Ҳолат</th>' + (central ? '<th>Амаллар</th>' : '') + '</tr>';
    let rows = HX.executors.all();
    if (adm.region && adm.region !== 'all') rows = rows.filter(function (x) { return x.region === adm.region; });
    $('#regBody').innerHTML = rows.map(function (x) {
      return '<tr><td><b>' + esc(x.rank ? x.rank + ' ' + x.name : x.name) + '</b></td><td>' + esc(unitName(x.region)) + '</td><td class="mono">' + esc(x.login) + '</td><td>' + esc(x.phone || '—') + '</td><td>' + (x.active ? '<span class="chip accent">фаол</span>' : '<span class="chip">ўчирилган</span>') + '</td>' + (central ? '<td><button class="btn btn-sm" data-eedit="' + esc(x.id) + '">' + ic('edit') + 'Таҳрир</button></td>' : '') + '</tr>';
    }).join('') || '<tr><td colspan="' + (central ? 6 : 5) + '" class="empty">Ижрочи йўқ</td></tr>';
    $$('#regBody [data-eedit]').forEach(function (b) { b.onclick = function () { const row = HX.executors.get(b.dataset.eedit); if (row) execModal(row); }; });
  }
  function regionOptions(selected, allowAll) {
    const adm = HX.admin.get() || {};
    let regs = HX.REGIONS.slice();
    if (adm.region && adm.region !== 'all') regs = regs.filter(function (r) { return r.id === adm.region; });
    return (allowAll && (!adm.region || adm.region === 'all') ? '<option value="all"' + (selected === 'all' ? ' selected' : '') + '>Марказий аппарат</option>' : '') +
      regs.map(function (r) { return '<option value="' + r.id + '"' + (selected === r.id ? ' selected' : '') + '>' + r.name + '</option>'; }).join('');
  }
  function field(id, label, value, o) {
    o = o || {};
    return '<div class="field"' + (o.wide ? ' style="grid-column:1/-1"' : '') + '><label for="' + id + '">' + label + '</label><input class="input" id="' + id + '" value="' + esc(value || '') + '"' + (o.type ? ' type="' + o.type + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '></div>';
  }
  function clientModal(row) {
    const c = row || { id: '', org: '', name: '', phone: '', tin: '', email: '', region: (HX.admin.get() || {}).region || 'tsh', notes: '', source: 'manual', apps: 0 };
    const oldKey = row ? clientKey(row) : '';
    const m = HX.modal({
      title: row ? 'Мижозни таҳрирлаш' : 'Мижоз қўшиш',
      body: '<div class="reg-form">' +
        field('cOrg', 'Ташкилот / Ф.И.Ш. *', c.org, { wide: true }) +
        field('cName', 'Масъул шахс', c.name) +
        field('cPhone', 'Телефон *', c.phone) +
        field('cTin', 'СТИР / ЖШШИР', c.tin) +
        field('cEmail', 'Электрон почта', c.email, { type: 'email' }) +
        '<div class="field"><label for="cReg">Ҳудуд</label><select class="input" id="cReg">' + regionOptions(c.region, false) + '</select></div>' +
        field('cNotes', 'Изоҳ', c.notes, { wide: true }) +
        '</div>',
      foot: '<button class="btn" data-close>Бекор</button><button class="btn btn-primary" id="cSave">' + ic('check') + 'Сақлаш</button>'
    });
    $('#cSave', m.el).onclick = function () {
      const org = $('#cOrg', m.el).value.trim();
      const phone = $('#cPhone', m.el).value.trim();
      if (org.length < 3 || phone.replace(/\D/g, '').length < 9) { HX.toast('Мажбурий майдонлар', 'Ташкилот ва телефонни тўлдиринг.', 'warn'); return; }
      const saved = {
        id: (c.id && c.id.indexOf('app:') !== 0) ? c.id : ('c-' + Date.now()),
        org: org, name: $('#cName', m.el).value.trim(), phone: phone,
        tin: $('#cTin', m.el).value.trim(), email: $('#cEmail', m.el).value.trim(),
        region: $('#cReg', m.el).value, notes: $('#cNotes', m.el).value.trim(), source: 'manual'
      };
      HX.clients.upsert(saved);
      if (oldKey) {
        const list = HX.apps.all();
        list.forEach(function (a) {
          if (clientKey(a.owner) === oldKey) {
            a.owner.org = saved.org; a.owner.name = saved.name; a.owner.phone = saved.phone; a.owner.tin = saved.tin; a.owner.email = saved.email;
          }
        });
        HX.apps.save(list);
      }
      m.close();
      HX.toast('Мижоз сақланди', saved.org, 'ok');
      registry();
    };
  }
  function execModal(row) {
    const adm = HX.admin.get() || {};
    const x = row || { id: '', name: '', rank: 'лейтенант', login: '', password: '', phone: '', region: adm.region && adm.region !== 'all' ? adm.region : 'tsh', active: true, role: 'executor' };
    const m = HX.modal({
      title: row ? 'Ижрочини таҳрирлаш' : 'Ижрочи қўшиш',
      body: '<div class="reg-form">' +
        field('eName', 'ФИО *', x.name) +
        field('eRank', 'Унвон', x.rank) +
        '<div class="field"><label for="eReg">Бўлинма *</label><select class="input" id="eReg">' + regionOptions(x.region, true) + '</select></div>' +
        field('eLogin', 'Логин *', x.login) +
        field('ePass', row ? 'Янги парол (бўш — ўзгармайди)' : 'Парол *', '', { type: 'password' }) +
        field('ePhone', 'Телефон', x.phone) +
        '<label class="check' + (x.active !== false ? ' on' : '') + '" style="grid-column:1/-1"><input type="checkbox" id="eOn"' + (x.active !== false ? ' checked' : '') + '><span>Фаол ижрочи</span></label>' +
        '</div>',
      foot: (row && row.id !== adm.id ? '<button class="btn btn-danger" id="eDel">' + ic('trash') + 'Ўчириш</button>' : '') + '<button class="btn" data-close>Бекор</button><button class="btn btn-primary" id="eSave">' + ic('check') + 'Сақлаш</button>'
    });
    const on = $('#eOn', m.el);
    if (on) on.onchange = function () { on.closest('.check').classList.toggle('on', on.checked); };
    $('#eSave', m.el).onclick = function () {
      const name = $('#eName', m.el).value.trim();
      const login = $('#eLogin', m.el).value.trim();
      const pass = $('#ePass', m.el).value;
      const regionId = $('#eReg', m.el).value;
      if (name.length < 5 || login.length < 2) { HX.toast('Мажбурий майдонлар', 'ФИО ва логинни тўлдиринг.', 'warn'); return; }
      if (!row && pass.length < 4) { HX.toast('Парол қисқа', 'Камида 4 та белги.', 'warn'); return; }
      const taken = HX.executors.byLogin(login);
      if (taken && (!row || taken.id !== row.id)) { HX.toast('Логин банд', 'Бошқа логин танланг.', 'warn'); return; }
      const saved = {
        id: row ? row.id : ('ex-' + Date.now()),
        name: name, rank: $('#eRank', m.el).value.trim(), login: login,
        password: pass ? pass : row.password,
        phone: $('#ePhone', m.el).value.trim(), region: regionId,
        role: regionId === 'all' ? 'admin' : 'executor', active: $('#eOn', m.el).checked
      };
      const same = HX.executors.all().filter(function (e) { return e.region === saved.region && e.active && e.id !== saved.id; });
      if (!saved.active && !same.length) { HX.toast('Сўнгги ижрочи', 'Бўлинмада камида битта фаол ижрочи қолиши керак.', 'warn'); return; }
      HX.executors.upsert(saved);
      if (adm.id === saved.id) {
        const reg = saved.region === 'all' ? null : HX.region(saved.region);
        HX.admin.set(Object.assign({}, adm, { name: saved.name, login: saved.login, region: saved.region, rank: saved.rank, unit: reg ? reg.name + ' бўйича ҳудудий бўлинма' : 'Марказий аппарат' }));
        if ($('#opsRole')) $('#opsRole').textContent = HX.admin.get().unit + ' · ' + saved.name;
      }
      m.close();
      HX.toast('Ижрочи сақланди', saved.login, 'ok');
      registry();
    };
    const del = $('#eDel', m.el);
    if (del) del.onclick = function () {
      const others = HX.executors.all().filter(function (e) { return e.region === x.region && e.id !== x.id; });
      const activeOthers = others.filter(function (e) { return e.active; });
      if (!others.length || (x.active && !activeOthers.length)) { HX.toast('Сўнгги ижрочи', 'Бўлинмада камида битта фаол ижрочи қолиши керак. Аввал янгисини қўшинг.', 'warn'); return; }
      HX.executors.remove(x.id);
      m.close();
      HX.toast('Ижрочи ўчирилди', x.login, 'info');
      registry();
    };
  }

  const QUEUES = [
    { id: 'review', label: 'Кўриб чиқилмоқда', statuses: ['submitted', 'review'] },
    { id: 'approved', label: 'Тасдиқланган', statuses: ['approved'] },
    { id: 'paid', label: 'Тўланган', statuses: ['paid'] },
    { id: 'other', label: 'Бошқалар', statuses: null }
  ];
  function inQueue(a, id) {
    const q = QUEUES.filter(function (x) { return x.id === id; })[0];
    if (!q) return false;
    if (!q.statuses) return ['submitted', 'review', 'approved', 'paid'].indexOf(a.status) < 0;
    return q.statuses.indexOf(a.status) > -1;
  }
  function authorityName(a) {
    const cat = HXCalc.CATEGORIES[a.event.category] || HXCalc.CATEGORIES['1'];
    return HX.region(a.event.region).name + ' — ' + cat.body;
  }
  function contracts() {
    const box = $('#qSeg'); if (!box) return;
    const A = apps();
    box.innerHTML = QUEUES.map(function (q) {
      const n = A.filter(function (a) { return inQueue(a, q.id); }).length;
      return '<button type="button" data-q="' + q.id + '" class="' + (queue === q.id ? 'on' : '') + '">' + q.label + ' <b>' + n + '</b></button>';
    }).join('');
    $$('#qSeg button').forEach(function (b) { b.onclick = function () { queue = b.dataset.q; contracts(); }; });
    const rows = A.filter(function (a) { return inQueue(a, queue); }).sort(function (a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); });
    $('#qBody').innerHTML = rows.map(function (a) {
      const sent = a.dispatch ? HX.dateTime(a.dispatch.at) : '—';
      return '<tr><td><b class="mono">' + esc(a.contractNo || a.id) + '</b><div class="small muted">' + esc(a.owner.org || a.owner.name || '') + '</div></td>' +
        '<td><b>' + esc(a.event.name) + '</b><div class="small muted">' + HX.date(a.event.date) + '</div></td>' +
        '<td>' + esc(authorityName(a)) + '</td><td>' + HX.statusBadge(a.status) + '</td><td class="small">' + esc(sent) + '</td>' +
        '<td><div class="q-actions"><button class="btn btn-sm" data-open="' + esc(a.id) + '">' + ic('eye') + 'Кўриш</button>' +
        '<button class="btn btn-sm" data-dl="' + esc(a.id) + '">' + ic('download') + 'Юклаб олиш</button>' +
        (isCentral() ? '<button class="btn btn-sm btn-primary" data-send="' + esc(a.id) + '">' + ic('send') + (a.dispatch ? 'Қайта юбориш' : 'Юбориш') + '</button>' : '') + '</div></td></tr>';
    }).join('') || '<tr><td colspan="6" class="empty">Бу рўйхатда шартнома йўқ</td></tr>';
    $$('#qBody [data-open]').forEach(function (b) { b.onclick = function () { openApp(b.dataset.open); }; });
    $$('#qBody [data-dl]').forEach(function (b) { b.onclick = function () { const a = HX.apps.get(b.dataset.dl); if (a) HX.downloadContract(a); }; });
    $$('#qBody [data-send]').forEach(function (b) { b.onclick = function () { const a = HX.apps.get(b.dataset.send); if (a) sendModal(a); }; });
  }
  function sendToAuthority(a) {
    const adm = HX.admin.get() || { name: 'Оператор' };
    const unit = authorityName(a);
    const now = new Date().toISOString();
    a.dispatch = { at: now, unit: unit, by: adm.name };
    a.history = a.history || [];
    a.history.push({ at: now, status: a.status, by: adm.name, note: 'Тегишли ҳудудий масъул органга юборилди: ' + unit });
    HX.apps.upsert(a);
    HX.toast('Ҳудудий органга юборилди', unit, 'ok');
  }
  function sendModal(a, drawer) {
    const unit = authorityName(a);
    const m = HX.modal({
      title: 'Ҳудудий масъул органга юбориш',
      body: '<p>Ариза мижоз платформасидаги ҳақиқий ёзувдан олинади ва қуйидаги органга юборилади. Буюртмачи хабарнома олади.</p><div class="warn-item info">' + ic('send') + '<span><b>' + esc(a.event.name) + '</b><br>' + esc(unit) + '</span></div>',
      foot: '<button class="btn" data-close>Бекор қилиш</button><button class="btn btn-primary" id="sendOk">' + ic('send') + 'Юбориш</button>'
    });
    $('#sendOk', m.el).onclick = function () {
      sendToAuthority(a);
      m.close();
      if (drawer) drawer.close();
      renderAll();
    };
  }

  /* ---------- KPI ---------- */
  function kpis() {
    const A = apps(), today = HX.isoDate(new Date()), in30 = HX.isoDate(HX.addDays(30));
    const cnt = function (s) { return A.filter(function (a) { return s.indexOf(a.status) > -1; }).length; };
    const demand = A.filter(function (a) { return ACTIVE.indexOf(a.status) > -1 && a.event.date >= today && a.event.date <= in30; }).reduce(function (s, a) { return s + a.result.total; }, 0);
    const money = A.filter(function (a) { return ['signed', 'paid', 'done'].indexOf(a.status) > -1; }).reduce(function (s, a) { return s + a.result.cost; }, 0);
    const K = [
      ['send', 'var(--s1)', 'Янги аризалар', cnt(['submitted']), 0, 'кўриб чиқиш кутилмоқда'],
      ['clock', 'var(--s4)', 'Кўриб чиқилмоқда', cnt(['review']), 0, 'жорий иш'],
      ['check', 'var(--s3)', 'Тасдиқланган', cnt(['approved', 'signed', 'paid']), 0, 'шартнома босқичида'],
      ['users', 'var(--s2)', '30 кунлик талаб', demand, 0, 'нафар ходим (бир вақтда)'],
      ['wallet', 'var(--s7)', 'Шартномалар қиймати', money / 1e6, 1, 'млн сўм (имзоланган)']
    ];
    $('#kpis').innerHTML = K.map(function (k, i) {
      return '<div class="card kpi tilt reveal" style="--d:' + i * 0.06 + 's"><div class="k-icon" style="background:color-mix(in srgb,' + k[1] + ' 16%,transparent);color:' + k[1] + '">' + ic(k[0]) + '</div><span class="k-label">' + k[2] + '</span><span class="k-val" data-count="' + k[3] + '" data-dec="' + k[4] + '">0</span><span class="k-sub">' + k[5] + '</span></div>';
    }).join('');
  }

  function pipeline() {
    const A = apps();
    $('#pipeline').innerHTML = Object.keys(HX.STATUS).map(function (code) {
      const s = HX.STATUS[code], n = A.filter(function (a) { return a.status === code; }).length;
      return '<div class="pipe ' + (statusF === code ? 'on' : '') + '" data-s="' + code + '" style="color:' + s.color + ';border-color:color-mix(in srgb,' + s.color + ' 35%,transparent);background:color-mix(in srgb,' + s.color + ' 9%,transparent)"><span>' + ic(s.icon) + s.label + '</span><b>' + n + '</b></div>';
    }).join('');
    $$('#pipeline .pipe').forEach(function (p) { p.onclick = function () { statusF = statusF === p.dataset.s ? null : p.dataset.s; pipeline(); table(); }; });
  }

  /* ---------- Харита ---------- */
  const REGION_SPAN = { tsh: [0.11, 0.14], tv: [0.55, 0.72], and: [0.32, 0.36], nam: [0.34, 0.4], far: [0.42, 0.52], sir: [0.32, 0.42], jiz: [0.48, 0.55], sam: [0.48, 0.55], qash: [0.55, 0.62], sur: [0.55, 0.48], bux: [0.7, 0.95], nav: [0.85, 1.15], xor: [0.32, 0.48], qq: [1.35, 1.7] };
  function focusRegion(animate) {
    if (!map) return;
    const opt = { animate: !!animate, duration: animate ? 1.1 : 0 };
    if (region === 'all') { map.fitBounds([[37.1, 56.0], [45.6, 73.2]], opt); return; }
    const c = HX.region(region).c;
    const s = REGION_SPAN[region] || [0.5, 0.6];
    map.fitBounds([[c[0] - s[0], c[1] - s[1]], [c[0] + s[0], c[1] + s[1]]], opt);
  }
  function initMap() {
    map = L.map('opsMap', { scrollWheelZoom: true, attributionControl: true });
    if (map.attributionControl) map.attributionControl.setPrefix(false);
    L.tileLayer(HXTiles.yandex.url, { attribution: HXTiles.yandex.attr, maxZoom: 19, className: 'yx-tiles' }).addTo(map);
    markers = L.layerGroup().addTo(map);
    focusRegion(false);
    if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
    $('#mapLegend').innerHTML = ['submitted', 'review', 'approved', 'paid', 'rejected'].map(function (c) { return '<span><i class="lg" style="background:' + HX.STATUS[c].color + ';border-radius:50%"></i>' + HX.STATUS[c].label + '</span>'; }).join('');
    setTimeout(function () { map.invalidateSize(); focusRegion(false); }, 300);
  }
  function markersRender() {
    markers.clearLayers();
    apps().forEach(function (a, i) {
      const c = a.geometry.center || HX.region(a.event.region).c;
      const s = HX.STATUS[a.status], sz = Math.round(Math.min(34, 12 + Math.sqrt(a.result.total) * 1.1));
      const mk = L.marker(c, { icon: L.divIcon({ className: '', html: '<div class="mk-event mk-drop" style="width:' + sz + 'px;height:' + sz + 'px;background:' + s.color + ';color:' + s.color + ';animation-delay:' + i * 40 + 'ms"></div>', iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] }) })
        .bindTooltip('<b>' + esc(a.event.name) + '</b><br>' + esc(HX.region(a.event.region).name) + ' · ' + HX.date(a.event.date) + '<br>' + HX.fmt(a.result.total) + ' ходим · ' + s.label, { direction: 'top', offset: [0, -sz / 2] })
        .on('click', function () { openApp(a.id); });
      mk.addTo(markers);
    });
  }

  /* ---------- Жонли лента ---------- */
  function feed() {
    const items = [];
    apps().forEach(function (a) { (a.history || []).forEach(function (h) { items.push({ a: a, h: h }); }); });
    items.sort(function (x, y) { return new Date(y.h.at) - new Date(x.h.at); });
    $('#feed').innerHTML = items.slice(0, 18).map(function (it, i) {
      const d = new Date(it.h.at), s = HX.STATUS[it.h.status] || HX.STATUS.submitted;
      return '<div class="feed-item" style="animation-delay:' + i * 0.04 + 's" data-open="' + esc(it.a.id) + '"><div class="t">' + HX.pad(d.getHours()) + ':' + HX.pad(d.getMinutes()) + '<br><span style="font-size:10px">' + HX.pad(d.getDate()) + '.' + HX.pad(d.getMonth() + 1) + '</span></div><span class="d" style="background:' + s.color + '"></span><div><b>' + s.label + '</b> — ' + esc(it.a.event.name) + '<div class="small muted">' + esc(HX.region(it.a.event.region).name) + ' · ' + esc(it.h.by) + '</div></div></div>';
    }).join('') || '<div class="empty">Ҳодисалар йўқ</div>';
    $$('#feed [data-open]').forEach(function (el) { el.onclick = function () { openApp(el.dataset.open); }; });
  }

  /* ---------- Диаграммалар ---------- */
  function niceMax(v) { if (v <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function chartDays() {
    const A = apps().filter(function (a) { return ACTIVE.indexOf(a.status) > -1; });
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = HX.addDays(i), iso = HX.isoDate(d);
      const list = A.filter(function (a) { return a.event.date === iso; });
      days.push({ d: d, v: list.reduce(function (s, a) { return s + a.result.total; }, 0), n: list.length });
    }
    const ref = region === 'all' ? null : HX.region(region).staff;
    const Wd = 600, H = 250, pl = 44, pr = 12, pt = 20, pb = 38;
    const max = niceMax(Math.max(ref || 0, Math.max.apply(null, days.map(function (x) { return x.v; }))) * 1.08);
    const cw = (Wd - pl - pr) / days.length, bw = Math.min(26, cw - 6);
    const y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    let g = '<g class="grid">', ax = '<g class="axis">';
    for (let k = 0; k <= 4; k++) { const v = max * k / 4, yy = y(v); g += '<line x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + yy + '" y2="' + yy + '"/>'; ax += '<text x="' + (pl - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + HX.fmt(v) + '</text>'; }
    g += '</g>';
    let bars = '';
    days.forEach(function (x, i) {
      const cx = pl + cw * i + cw / 2, x0 = cx - bw / 2, top = y(x.v), base = y(0), r = Math.min(4, bw / 2, base - top);
      const over = ref && x.v > ref;
      const tip = '<b>' + HX.date(x.d) + ', ' + HX.WEEKDAYS[x.d.getDay()] + '</b><br>' + HX.fmt(x.v) + ' нафар ходим · ' + x.n + ' тадбир' + (ref ? '<br>Захира: ' + HX.fmt(ref) + (over ? ' — <b>етишмовчилик ' + HX.fmt(x.v - ref) + '</b>' : '') : '');
      bars += '<g class="col"><rect class="hit" x="' + (pl + cw * i) + '" y="' + pt + '" width="' + cw + '" height="' + (H - pt - pb) + '" data-tip="' + esc(tip) + '"/>';
      if (x.v > 0) bars += '<path class="bar" style="animation-delay:' + i * 45 + 'ms;pointer-events:none" d="M' + x0 + ',' + base + 'V' + (top + r) + 'Q' + x0 + ',' + top + ' ' + (x0 + r) + ',' + top + 'H' + (x0 + bw - r) + 'Q' + (x0 + bw) + ',' + top + ' ' + (x0 + bw) + ',' + (top + r) + 'V' + base + 'Z"/>';
      if (over) bars += '<text class="warn-ic" x="' + cx + '" y="' + (top - 6) + '" text-anchor="middle">!</text>';
      bars += '</g>';
      ax += '<text x="' + cx + '" y="' + (H - pb + 15) + '" text-anchor="middle">' + x.d.getDate() + '</text><text x="' + cx + '" y="' + (H - pb + 29) + '" text-anchor="middle" style="font-size:10px">' + HX.WEEKDAYS[x.d.getDay()] + '</text>';
    });
    ax += '<line x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--line-strong)"/></g>';
    const refSvg = ref ? '<line class="ref" x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + y(ref) + '" y2="' + y(ref) + '"/><text class="ref-l" x="' + (Wd - pr) + '" y="' + (y(ref) - 6) + '" text-anchor="end">Мавжуд захира · ' + HX.fmt(ref) + '</text>' : '';
    $('#chDays').innerHTML = '<div class="vchart"><svg viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="Кунлар бўйича шахсий таркибга талаб">' + g + ax + bars + refSvg + '</svg></div>';
    $('#chDaysLg').innerHTML = ref ? '<span><i style="background:var(--s1)"></i>Талаб этилган ходимлар</span><span><i class="ln"></i>Ҳудуддаги мавжуд захира</span>' : '<span class="muted">Захира чизиғини кўриш учун ҳудудни танланг</span>';
  }
  function hbars(el, items, unit) {
    const max = Math.max.apply(null, items.map(function (x) { return x.v; })) || 1;
    el.innerHTML = items.map(function (x) { return '<div class="hb" data-tip="<b>' + esc(x.l) + '</b><br>' + HX.fmt(x.v) + ' ' + unit + '"><span>' + esc(x.l) + '</span><div class="tr"><div class="fl" data-w="' + (x.v / max * 100) + '"' + (x.hi === false ? ' style="opacity:.35"' : '') + '></div></div><b>' + HX.fmt(x.v) + '</b></div>'; }).join('') || '<div class="empty">Маълумот йўқ</div>';
    requestAnimationFrame(function () { $$('.fl', el).forEach(function (f, i) { setTimeout(function () { f.style.width = f.dataset.w + '%'; }, i * 50); }); });
  }
  function chartRegions() {
    const A = HX.apps.all().filter(function (a) { return ACTIVE.indexOf(a.status) > -1; });
    const items = HX.REGIONS.map(function (r) { return { l: r.name.replace(' вилояти', '').replace('Республикаси', 'Респ.'), v: A.filter(function (a) { return a.event.region === r.id; }).reduce(function (s, a) { return s + a.result.total; }, 0), hi: region === 'all' || region === r.id }; })
      .filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; });
    hbars($('#chRegions'), items, 'нафар ходим');
  }
  function chartTypes() {
    const A = apps();
    const items = HXCalc.EVENT_TYPES.map(function (t) { return { l: t.label.split(' / ')[0], v: A.filter(function (a) { return a.event.type === t.id; }).length }; }).filter(function (x) { return x.v; }).sort(function (a, b) { return b.v - a.v; });
    hbars($('#chTypes'), items, 'ариза');
  }

  /* ---------- Реестр ---------- */
  function table() {
    let A = apps().filter(function (a) { return !statusF || a.status === statusF; })
      .filter(function (a) { return !query || (a.event.name + ' ' + a.id + ' ' + (a.owner.org || '')).toLowerCase().indexOf(query) > -1; });
    A.sort(function (a, b) {
      if (sortBy === 'staff') return b.result.total - a.result.total;
      if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      return a.event.date < b.event.date ? -1 : 1;
    });
    $('#tbody').innerHTML = A.map(function (a, i) {
      const wd = HXCalc.workingDaysUntil(a.event.date);
      return '<tr class="clickable" data-open="' + esc(a.id) + '" style="animation:fadeUp .4s ' + Math.min(i, 15) * 0.03 + 's both"><td><b class="mono">' + esc(a.id) + '</b><div class="small muted">' + HX.date(a.createdAt) + '</div></td><td><b>' + esc(a.event.name) + '</b><div class="small muted">' + esc(a.owner.org || a.owner.name) + '</div></td><td>' + esc(HX.region(a.event.region).name) + '</td><td>' + HX.date(a.event.date) + (wd != null && wd < 10 && ACTIVE.indexOf(a.status) > -1 && ['submitted', 'review'].indexOf(a.status) > -1 ? '<div class="small" style="color:var(--serious)">' + ic('alert', '') + ' ' + Math.max(wd, 0) + ' иш куни</div>' : '') + '</td><td class="num"><b>' + HX.fmt(a.result.total) + '</b></td><td>' + HX.riskBadge(a.result.risk) + '</td><td class="num">' + HX.mln(a.result.cost) + '</td><td>' + HX.statusBadge(a.status) + '</td></tr>';
    }).join('') || '<tr><td colspan="8" class="empty">Аризалар топилмади</td></tr>';
    $$('#tbody [data-open]').forEach(function (tr) { tr.onclick = function () { openApp(tr.dataset.open); }; });
    $$('#tbody .small svg').forEach(function (s) { s.style.cssText = 'width:12px;height:12px;vertical-align:-1px'; });
  }

  /* ---------- Ариза дравери ---------- */
  function openApp(id) {
    const a = HX.apps.get(id); if (!a) return;
    const e = a.event, r = a.result, o = a.owner || {};
    const reg = HX.region(e.region);
    const sameDay = HX.apps.all().filter(function (x) { return x.event.region === e.region && x.event.date === e.date && ACTIVE.indexOf(x.status) > -1; });
    const demand = sameDay.reduce(function (s, x) { return s + x.result.total; }, 0) + (ACTIVE.indexOf(a.status) > -1 ? 0 : r.total);
    const util = demand / reg.staff;
    const uSt = util < 0.7 ? ['good', 'var(--good)', 'var(--good-ink)', 'Ресурс етарли', 'shieldCheck'] : util < 0.9 ? ['warning', 'var(--warning)', 'var(--warning)', 'Юклама юқори', 'alert'] : ['critical', 'var(--critical)', 'var(--critical-ink)', 'Ресурс етишмайди — қўшни ҳудуддан жалб этиш', 'alert'];
    const wd = HXCalc.workingDaysUntil(e.date);
    const factors = (e.factors || []).map(function (f) { const x = HXCalc.FACTORS.find(function (y) { return y.id === f; }); return x ? '<span class="chip">' + x.label + '</span>' : ''; }).join(' ');
    const act = [];
    act.push('<button class="btn" data-act="dl">' + ic('download') + 'Шартномани юклаб олиш</button>');
    if (isCentral()) act.push('<button class="btn" data-act="send">' + ic('send') + (a.dispatch ? 'Қайта юбориш' : 'Ҳудудий органга юбориш') + '</button>');
    if (a.status === 'submitted') act.push('<button class="btn btn-primary" data-act="take">' + ic('clock') + 'Кўриб чиқишга қабул қилиш</button>');
    if (a.status === 'review') act.push('<button class="btn btn-danger" data-act="reject">' + ic('x') + 'Рад этиш</button><button class="btn" data-act="return">' + ic('undo') + 'Қайтариш</button><button class="btn btn-primary" data-act="approve">' + ic('check') + 'Тасдиқлаш</button>');
    if (a.status === 'paid') act.push('<button class="btn btn-primary" data-act="done">' + ic('shieldCheck') + 'Хизматни якунлаш</button>');
    if (['approved', 'signed', 'paid', 'done'].indexOf(a.status) > -1) act.unshift('<button class="btn" data-act="doc">' + ic('doc') + 'Шартнома</button>');
    const waiting = { approved: 'Буюртмачининг ЭРИ имзоси кутилмоқда', signed: 'Тўлов кутилмоқда', returned: 'Буюртмачи томонидан тузатиш кутилмоқда' }[a.status];
    const d = HX.drawer({
      title: esc(e.name),
      body: '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><span class="chip mono">' + esc(a.id) + '</span>' + HX.statusBadge(a.status) + HX.riskBadge(r.risk) + '<span class="chip">' + esc(HX.typeLabel(e.type)) + '</span></div>' +
        (waiting ? '<div class="warn-item info" style="margin-bottom:14px">' + ic('info') + '<span>' + waiting + '</span></div>' : '') +
        (a.dispatch ? '<div class="warn-item info" style="margin-bottom:14px">' + ic('send') + '<span>Юборилган: <b>' + esc(a.dispatch.unit) + '</b> · ' + HX.dateTime(a.dispatch.at) + '</span></div>' : '') +
        (wd != null && wd < 10 && ['submitted', 'review'].indexOf(a.status) > -1 ? '<div class="warn-item serious" style="margin-bottom:14px">' + ic('alert') + '<span>Тадбиргача ' + Math.max(wd, 0) + ' иш куни қолган — ВМ-205, 15-1-банд талаби (10 иш куни) бузилган.</span></div>' : '') +
        '<div class="card" style="margin-bottom:14px"><h4>Ресурс текшируви · ' + HX.date(e.date) + '</h4><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span class="muted">' + esc(reg.name) + ': шу кунги талаб</span><b>' + HX.fmt(demand) + ' / ' + HX.fmt(reg.staff) + '</b></div><div class="meter"><i style="background:' + uSt[1] + '" data-w="' + Math.min(100, util * 100) + '"></i></div><div style="margin-top:8px;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:650;color:' + uSt[2] + '">' + ic(uSt[4]) + uSt[3] + ' · ' + Math.round(util * 100) + '%</div></div>' +
        '<div class="card" style="margin-bottom:14px;padding:0;overflow:hidden"><div id="drMap" style="height:260px"></div></div>' +
        '<div class="card" style="margin-bottom:14px"><h4>Ҳисоб-китоб</h4><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div id="drDonut"></div><div style="flex:1;min-width:190px">' + HX.legend(r.parts) + '</div></div>' +
        '<dl class="kv" style="margin-top:12px"><dt>Хавф коэффициенти</dt><dd>' + HX.fmtDec(r.K, 2) + '</dd><dt>Навбатлар / жами таркиб</dt><dd>' + r.shifts + ' / ' + HX.fmt(r.personsTotal) + '</dd><dt>Киши-соат</dt><dd>' + HX.fmt(r.personHours) + '</dd><dt>Қиймат</dt><dd>' + HX.money(r.cost) + '</dd><dt>Металлодетектор рамкалари</dt><dd>' + r.tech.frames + '</dd><dt>Радиостанциялар</dt><dd>' + r.tech.radios + '</dd></dl></div>' +
        '<div class="card" style="margin-bottom:14px"><h4>Тадбир ва буюртмачи</h4><dl class="kv"><dt>Буюртмачи</dt><dd>' + esc(o.org || o.name) + '</dd><dt>Телефон</dt><dd>' + esc(o.phone || '—') + '</dd><dt>СТИР</dt><dd>' + esc(o.tin || '—') + '</dd><dt>Сана, вақт</dt><dd>' + HX.date(e.date) + ', ' + esc(e.startTime) + ' · ' + e.duration + ' соат</dd><dt>Манзил</dt><dd>' + esc(e.address || '—') + '</dd><dt>Тоифа</dt><dd>' + esc((HXCalc.CATEGORIES[e.category] || {}).label || '') + '</dd><dt>Объект</dt><dd>' + esc((HXCalc.VENUES[e.venue] || {}).label || '') + '</dd><dt>' + ((a.geometry && a.geometry.kind === 'route') ? 'Йўналиш' : 'Периметр / майдон') + '</dt><dd>' + ((a.geometry && a.geometry.kind === 'route') ? (HX.fmt(a.geometry.perimeter) + ' м · ички патрул йўқ') : (HX.fmt(a.geometry.perimeter) + ' м / ' + HX.fmt(a.geometry.area) + ' м²')) + '</dd><dt>НЎП</dt><dd>' + e.entrances + '</dd><dt>Иштирокчилар</dt><dd>' + (e.crowd === 'open' ? 'чекланмаган · тахминий ' : 'чекланган · ') + HX.fmt(r.attendees) + ((a.geometry && a.geometry.kind === 'route') ? '' : (' / сиғим ' + HX.fmt(r.capacity))) + '</dd>' + (a.assigned ? '<dt>Масъул</dt><dd>' + esc(a.assigned.unit) + '<br><span class="small muted">' + esc(a.assigned.commander) + '</span></dd>' : '') + (a.payment ? '<dt>Тўлов</dt><dd>' + esc((HX.payMethod(a.payment.method) || {}).name || a.payment.method) + '<br><span class="small muted mono">' + esc(a.payment.txn) + '</span></dd>' : '') + '</dl>' + (factors ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' + factors + '</div>' : '') + (e.notes ? '<p class="small" style="margin-top:10px">' + esc(e.notes) + '</p>' : '') + '</div>' +
        '<div class="card"><h4>Ҳолатлар тарихи</h4><ul class="tl">' + (a.history || []).map(function (h, i) { const s = HX.STATUS[h.status] || HX.STATUS.submitted; return '<li class="done" style="animation-delay:' + i * 0.05 + 's"><span class="tl-dot" style="background:' + s.color + ';border-color:' + s.color + '">' + ic('check') + '</span><b>' + s.label + '</b><span>' + HX.dateTime(h.at) + ' · ' + esc(h.by) + (h.note ? ' — ' + esc(h.note) : '') + '</span></li>'; }).join('') + '</ul></div>',
      foot: act.join('') || '<span class="muted small">Амаллар мавжуд эмас</span>',
      onClose: function () { if (drawerMap) { drawerMap.destroy(); drawerMap = null; } }
    });
    HX.donut($('#drDonut', d.el), r.parts, { size: 150, thickness: 18, total: r.total });
    setTimeout(function () { $$('.meter i', d.el).forEach(function (m) { m.style.width = m.dataset.w + '%'; }); }, 200);
    setTimeout(function () {
      const routeApp = a.geometry.kind === 'route';
      if (!a.geometry.latlngs || a.geometry.latlngs.length < (routeApp ? 2 : 3)) return;
      drawerMap = new PerimeterMap($('#drMap', d.el), { editable: false, scrollZoom: false, kind: routeApp ? 'route' : 'area' });
      if (routeApp) drawerMap.setRoute(a.geometry.latlngs, { silent: true, instant: true, posts: a.geometry.posts || [] });
      else drawerMap.setPolygon(a.geometry.latlngs, { silent: true, instant: true });
      const full = HXCalc.compute(Object.assign({}, e, { perimeter: a.geometry.perimeter, area: routeApp ? 0 : a.geometry.area, shape: routeApp ? 'route' : 'area', date: null }));
      setTimeout(function () { if (drawerMap) drawerMap.deploy(full, { animate: true, gates: a.geometry.gates, posts: a.geometry.posts }); }, 450);
    }, 380);
    $$('[data-act]', d.el).forEach(function (b) {
      b.onclick = function () {
        const k = b.dataset.act;
        if (k === 'doc') { const m = HX.modal({ wide: true, title: 'Шартнома', body: '<style>' + HX.contractCSS + '</style><div class="doc-frame">' + HX.contractHTML(a) + '</div>', foot: '<button class="btn" data-close>Ёпиш</button><button class="btn" id="dl">' + ic('download') + 'Юклаб олиш</button><button class="btn btn-primary" id="pr">' + ic('print') + 'Чоп этиш</button>' }); $('#pr', m.el).onclick = function () { HX.printContract(a); }; $('#dl', m.el).onclick = function () { HX.downloadContract(a); }; return; }
        if (k === 'dl') { HX.downloadContract(a); return; }
        if (k === 'send') return sendModal(a, d);
        if (k === 'take') { HX.apps.setStatus(a.id, 'review', 'Оператор', 'Ариза кўриб чиқиш учун қабул қилинди'); d.close(); HX.toast('Ариза кўриб чиқишга олинди', a.id, 'ok'); setTimeout(function () { openApp(a.id); }, 380); return; }
        if (k === 'done') { HX.apps.setStatus(a.id, 'done', 'Оператор', 'Хизмат якунланди, ҳодисалар қайд этилмади'); d.close(); HX.toast('Хизмат якунланди', a.id, 'ok'); return; }
        if (k === 'approve') return approveModal(a, d);
        if (k === 'return' || k === 'reject') return reasonModal(a, d, k);
      };
    });
  }

  function approveModal(a, d) {
    const reg = HX.region(a.event.region);
    const m = HX.modal({
      title: 'Аризани тасдиқлаш',
      body: '<p>Ҳисоб-китоб тасдиқлангач, шартнома лойиҳаси шакллантирилади ва буюртмачига ЭРИ билан имзолаш учун юборилади.</p><div class="grid-2">' +
        '<div class="field span-2"><label for="apU">Масъул бўлинма</label><input class="input" id="apU" value="' + esc(reg.name + ' бўйича ҳудудий бўлинма') + '"></div>' +
        '<div class="field"><label for="apC">Масъул командир</label><input class="input" id="apC" value="майор Каримов А."></div>' +
        '<div class="field"><label for="apN">Ходимлар сони</label><input class="input" id="apN" type="number" value="' + a.result.total + '" disabled></div>' +
        '<div class="field span-2"><label for="apM">Изоҳ</label><textarea class="input" id="apM" placeholder="Масалан: йиғилиш пункти — шимолий дарвоза олдида"></textarea></div></div>',
      foot: '<button class="btn" data-close>Бекор қилиш</button><button class="btn btn-primary" id="apOk">' + ic('check') + 'Тасдиқлаш</button>'
    });
    $('#apOk', m.el).onclick = function () {
      const note = $('#apM', m.el).value.trim();
      HX.apps.setStatus(a.id, 'approved', 'Оператор', 'Ҳисоб-китоб тасдиқланди, шартнома лойиҳаси шакллантирилди' + (note ? '. ' + note : ''), { assigned: { unit: $('#apU', m.el).value.trim(), commander: $('#apC', m.el).value.trim() } });
      m.close(); d.close(); HX.toast('Ариза тасдиқланди', 'Буюртмачига хабарнома юборилди.', 'ok');
    };
  }

  function reasonModal(a, d, kind) {
    const quick = ['Периметр чизмаси аниқлаштирилсин', 'Шартнома тадбирдан 10 иш кунидан кам муддат олдин сўралган (ВМ-205, 15-1-банд)', 'Иштирокчилар сони объект сиғимидан ошади (ВМ-205, 61-банд)', 'Объект тоифаси нотўғри кўрсатилган', 'Кириш нуқталари сони ҳудуд ўлчамига мос эмас'];
    const m = HX.modal({
      title: kind === 'reject' ? 'Аризани рад этиш' : 'Қайта ишлашга қайтариш',
      body: '<p>Сабабни кўрсатинг — у буюртмачига хабарнома сифатида юборилади.</p><div class="chips-f" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">' + quick.map(function (q) { return '<button type="button" class="chip" style="cursor:pointer" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div><textarea class="input" id="rsn" placeholder="Сабаб..."></textarea>',
      foot: '<button class="btn" data-close>Бекор қилиш</button><button class="btn ' + (kind === 'reject' ? 'btn-danger' : 'btn-primary') + '" id="rsOk">' + ic(kind === 'reject' ? 'x' : 'undo') + (kind === 'reject' ? 'Рад этиш' : 'Қайтариш') + '</button>'
    });
    $$('[data-q]', m.el).forEach(function (b) { b.onclick = function () { $('#rsn', m.el).value = b.dataset.q; }; });
    $('#rsOk', m.el).onclick = function () {
      const t = $('#rsn', m.el).value.trim();
      if (t.length < 5) { $('#rsn', m.el).classList.add('invalid'); return; }
      HX.apps.setStatus(a.id, kind === 'reject' ? 'rejected' : 'returned', 'Оператор', t);
      m.close(); d.close(); HX.toast(kind === 'reject' ? 'Ариза рад этилди' : 'Ариза қайтарилди', a.id, 'info');
    };
  }

  /* ---------- Методика нормалари ---------- */
  function normsModal() {
    const N = HXCalc.getNorms();
    const ro = !isCentral();
    const F = [
      ['bhm', 'БҲМ, сўм', 1, ''], ['rateShare', '1 киши-соат, БҲМ %', 100, '%'], ['spacing.open', 'Пост оралиғи (очиқ), м', 1, ''], ['spacing.fenced', 'Пост оралиғи (тўсиқли), м', 1, ''], ['spacing.indoor', 'Пост оралиғи (ёпиқ), м', 1, ''],
      ['patrolSize', 'Патруль наряди, ходим', 1, ''], ['reserveShare', 'Тезкор захира, %', 100, '%'], ['commanderRatio', '1 командир / ходим', 1, ''], ['shiftHours', 'Навбат давомийлиги, соат', 1, ''],
      ['frameThroughput', 'Рамка ўтказувчанлиги, киши/соат', 1, ''], ['arrivalWindow', 'Келиш даври, соат', 1, ''], ['usableShare', 'Фойдали майдон улуши, %', 100, '%'], ['k9Threshold', 'Кинолог чегараси, киши', 1, ''], ['trafficSpacing', 'Йўл пости оралиғи, м', 1, '']
    ];
    const get = function (k) { return k.split('.').reduce(function (o, x) { return o[x]; }, N); };
    const m = HX.modal({
      wide: true, title: 'Ҳисоблаш методикаси нормалари',
      body: '<div class="warn-item info" style="margin-bottom:14px">' + ic('info') + '<span>' + (ro ? 'Нормалар кўриш учун очилган. Қуйи орган уларни ўзгартира олмайди.' : 'Нормалар ваколатли орган томонидан белгиланади. Ўзгаришлар барча калькуляторларда (портал, харита, кабинет) дарҳол қўлланилади. 1 киши-соат қиймати ВМ-205, 15-1-бандига кўра — БҲМнинг 7 фоизи.') + '</span></div>' +
        '<div class="norms-grid">' + F.map(function (f) { return '<div class="field"><label for="n_' + f[0].replace('.', '_') + '">' + f[1] + '</label><input class="input" type="number" step="any" id="n_' + f[0].replace('.', '_') + '" data-n="' + f[0] + '" data-mul="' + f[2] + '" value="' + +(get(f[0]) * f[2]).toFixed(4) + '"' + (ro ? ' readonly disabled' : '') + '></div>'; }).join('') + '</div>' +
        '<h4 style="margin-top:20px">Тадбир турлари бўйича меъёрлар</h4><div class="table-wrap"><table class="tbl" style="min-width:560px"><thead><tr><th>Тур</th><th class="num">Зичлик, киши/м²</th><th class="num">м² / 1 ходим</th><th class="num">Иштирокчи / 1 ходим</th><th class="num">Хавф қўшимчаси</th></tr></thead><tbody>' +
        HXCalc.EVENT_TYPES.map(function (t) { return '<tr><td><b>' + t.label + '</b></td><td class="num">' + HX.fmtDec(t.density, 1) + '</td><td class="num">' + t.areaPer + '</td><td class="num">' + t.crowdPer + '</td><td class="num">+' + HX.fmtDec(t.risk, 2) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        (ro ? '' : '<label class="check" style="margin-top:14px"><input type="checkbox" id="recalc" checked><span>Кўриб чиқилмаган аризаларни (юборилди / кўриб чиқилмоқда) янги нормалар бўйича қайта ҳисоблаш</span></label>'),
      foot: ro ? '<button class="btn" data-close>Ёпиш</button>' : '<button class="btn btn-ghost" id="nReset">' + ic('refresh') + 'Стандарт қийматлар</button><button class="btn" data-close>Бекор қилиш</button><button class="btn btn-primary" id="nSave">' + ic('check') + 'Сақлаш</button>'
    });
    if (ro) return;
    $('#nSave', m.el).onclick = function () {
      const out = JSON.parse(JSON.stringify(N));
      let bad = false;
      $$('[data-n]', m.el).forEach(function (el) {
        const v = +el.value / +el.dataset.mul;
        if (!(v > 0)) { el.classList.add('invalid'); bad = true; return; }
        const ks = el.dataset.n.split('.'); const last = ks.pop(); ks.reduce(function (o, x) { return o[x]; }, out)[last] = v;
      });
      if (bad) return;
      HXCalc.setNorms(out);
      if ($('#recalc', m.el).checked) recalcPending();
      m.close(); HX.toast('Нормалар сақланди', 'Ҳисоб-китоблар янгиланди.', 'ok'); renderAll();
    };
    $('#nReset', m.el).onclick = function () { HXCalc.resetNorms(); if ($('#recalc', m.el).checked) recalcPending(); m.close(); HX.toast('Стандарт нормалар тикланди', '', 'info'); renderAll(); };
  }
  function recalcPending() {
    const list = HX.apps.all().map(function (a) {
      if (['submitted', 'review'].indexOf(a.status) < 0) return a;
      const r = HXCalc.compute(Object.assign({}, a.event, { perimeter: a.geometry.perimeter, area: a.geometry.area, date: null }));
      a.result = HXCalc.summarize(r); return a;
    });
    HX.apps.save(list);
  }

  /* ---------- Демо ариза ---------- */
  function demoApp() {
    const names = ['Шаҳар байрами концерти', 'Ёшлар форуми', 'Минифутбол турнири', 'Миллий таомлар фестивали', 'Мусиқа кечаси', 'Китобхонлар ярмаркаси', 'Спорт марафони'];
    const types = ['concert', 'forum', 'sport', 'festival', 'concert', 'fair', 'sport'];
    const i = Math.floor(Math.random() * names.length);
    const reg = HX.REGIONS[Math.floor(Math.random() * HX.REGIONS.length)];
    const w = 80 + Math.round(Math.random() * 220), h = 60 + Math.round(Math.random() * 150);
    const c = [reg.c[0] + (Math.random() - 0.5) * 0.04, reg.c[1] + (Math.random() - 0.5) * 0.05];
    const ev = { name: names[i], type: types[i], region: reg.id, venue: ['open', 'fenced', 'indoor'][Math.floor(Math.random() * 3)], category: Math.random() > 0.25 ? '1' : '2', entrances: 2 + Math.floor(Math.random() * 4), attendees: 0, duration: 3 + Math.floor(Math.random() * 6), startTime: ['10:00', '16:00', '19:00'][Math.floor(Math.random() * 3)], factors: Math.random() > 0.5 ? ['media'] : ['kids'], date: HX.isoDate(HX.addDays(8 + Math.floor(Math.random() * 20))), address: reg.name + ', марказий майдон' };
    const r = HXCalc.compute(Object.assign({}, ev, { perimeter: 2 * (w + h), area: w * h, date: null }));
    const now = new Date().toISOString();
    HX.apps.upsert({
      id: HX.apps.nextId(), createdAt: now, updatedAt: now, ownerId: 'seed',
      owner: { type: 'yur', org: '«' + ['Ивент Про', 'Тадбир Сервис', 'Шоу Плюс', 'Марказ Медиа'][Math.floor(Math.random() * 4)] + '» МЧЖ', tin: String(300000000 + Math.floor(Math.random() * 99999999)), phone: '+998 9' + Math.floor(Math.random() * 10) + ' 555-' + HX.pad(Math.floor(Math.random() * 99)) + '-' + HX.pad(Math.floor(Math.random() * 99)) },
      event: ev, geometry: { mode: 'rect', perimeter: 2 * (w + h), area: w * h, latlngs: HX.rectLatLngs(c, w, h, Math.round((Math.random() - 0.5) * 50)), center: c },
      result: HXCalc.summarize(r), status: 'submitted', history: [{ at: now, status: 'submitted', by: 'Буюртмачи', note: 'Ариза платформа орқали юборилди' }], assigned: null
    });
    HX.toast('Янги ариза келиб тушди', ev.name + ' · ' + reg.name, 'info');
  }
})();
