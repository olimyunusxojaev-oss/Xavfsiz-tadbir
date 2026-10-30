/* Платформа маълумотини Neon базасига ёзади (Vercel /api/state).
   localStorage заҳира бўлиб қолади; сервер жавоби келгач устун. */
(function () {
  'use strict';
  if (!window.HX || !HX.store) return;
  const KEYS = ['hx.apps', 'hx.clients', 'hx.executors', 'hx.users', 'hx.counter', 'hx.draft', 'hx.norms'];
  const origSet = HX.store.set;
  const origRemove = HX.store.remove;
  let live = false;

  function post(key, value) {
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key, value: value })
    }).catch(function () {});
  }

  HX.store.set = function (k, v) {
    origSet.call(HX.store, k, v);
    if (live && KEYS.indexOf(k) >= 0) post(k, v);
  };
  HX.store.remove = function (k) {
    origRemove.call(HX.store, k);
    if (live && KEYS.indexOf(k) >= 0) post(k, null);
  };

  fetch('/api/state', { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error('state');
    return r.json();
  }).then(function (data) {
    const bag = (data && data.keys) || {};
    let changed = false;
    KEYS.forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(bag, k)) return;
      if (bag[k] == null) {
        if (HX.store.get(k, undefined) !== undefined) { origRemove.call(HX.store, k); changed = true; }
        return;
      }
      if (JSON.stringify(HX.store.get(k, undefined)) !== JSON.stringify(bag[k])) {
        origSet.call(HX.store, k, bag[k]);
        changed = true;
      }
    });
    if (changed) {
      if (sessionStorage.getItem('hx.remoteReload') === '1') { live = true; return; }
      sessionStorage.setItem('hx.remoteReload', '1');
      location.reload();
      return;
    }
    sessionStorage.removeItem('hx.remoteReload');
    live = true;
    KEYS.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(bag, k)) return;
      const v = HX.store.get(k, undefined);
      if (v !== undefined) post(k, v);
    });
  }).catch(function () { live = true; });
})();
