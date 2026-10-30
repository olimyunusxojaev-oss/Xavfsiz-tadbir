/* =========================================================
   Кўп тиллилик (i18n): ўзбек (кирилл / лотин), рус, инглиз
   • Асосий матн — ўзбек кирилл ёзувида.
   • Ўзбек лотин — расмий қоидалар бўйича автоматик транслитерация.
   • Рус ва инглиз — i18n-dict.js луғати (аниқ мос, рақамли шаблон,
     {*} шаблонлари ва « · », « — » бўйича бўлиб таржима қилиш).
   • DOM MutationObserver орқали таржима қилинади — динамик контент ҳам.
   ========================================================= */
(function (global) {
  'use strict';
  const LANGS = [
    { id: 'uz-cyrl', label: 'Ўзбекча', short: 'ЎЗ', html: 'uz-Cyrl' },
    { id: 'uz-latn', label: 'Oʻzbekcha', short: 'OʻZ', html: 'uz-Latn' },
    { id: 'ru', label: 'Русский', short: 'РУ', html: 'ru' },
    { id: 'en', label: 'English', short: 'EN', html: 'en' }
  ];
  let lang = 'uz-cyrl';
  try { const v = JSON.parse(localStorage.getItem('hx.lang') || 'null'); if (LANGS.some(function (l) { return l.id === v; })) lang = v; } catch (e) {}
  let debug = false;
  try { debug = localStorage.getItem('hx.i18n.debug') === '1'; } catch (e) {}

  /* ---------- Кирилл → лотин транслитерация ---------- */
  const MAP = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ё': 'yo', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': 'ʼ', 'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': 'oʻ', 'қ': 'q', 'ғ': 'gʻ', 'ҳ': 'h' };
  const VOW = 'аеёиоуўэюяaeiou';
  const isUp = function (c) { return !!c && c !== c.toLowerCase(); };
  const isLow = function (c) { return !!c && c !== c.toUpperCase(); };
  function translit(s) {
    if (!/[Ѐ-ӿ]/.test(s)) return s;
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], lo = ch.toLowerCase();
      let r;
      if (lo === 'е') {
        const p = (s[i - 1] || ' ').toLowerCase();
        r = (i === 0 || !/[a-zа-яёўқғҳʻʼ]/i.test(p) || VOW.indexOf(p) > -1 || p === 'ъ' || p === 'ь') ? 'ye' : 'e';
      } else if (lo === 'ц') {
        r = VOW.indexOf((s[i - 1] || ' ').toLowerCase()) > -1 ? 'ts' : 's';
      } else if (Object.prototype.hasOwnProperty.call(MAP, lo)) r = MAP[lo];
      else { out += ch; continue; }
      if (isUp(ch) && r) {
        const all = isUp(s[i + 1]) || (isUp(s[i - 1]) && !isLow(s[i + 1]));
        r = all ? r.toUpperCase() : r[0].toUpperCase() + r.slice(1);
      }
      out += r;
    }
    return out;
  }

  /* ---------- Луғат ---------- */
  const NUM = /\d+(?:[  .,]\d+)*/g;
  const MARK = '\u0001';
  const exact = { ru: new Map(), en: new Map() };
  const tmpl = { ru: new Map(), en: new Map() };
  const wild = [];
  const done = { ru: new Set(), en: new Set() }; // аллақачон таржима қилинган қийматлар
  function norm(s) { const nums = []; const k = s.replace(NUM, function (m) { nums.push(m); return MARK; }); return { k: k, nums: nums }; }
  function add(rows) {
    rows.forEach(function (r) {
      const src = r[0];
      if (src.indexOf('{*}') > -1) {
        const re = new RegExp('^' + src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\\\*\\\}/g, '([\\s\\S]+?)') + '$');
        wild.push({ re: re, ru: r[1], en: r[2], spec: src.replace(/\{\*\}/g, '').length });
        // аниқроқ (узунроқ) шаблонлар биринчи текширилади
        wild.sort(function (a, b) { return b.spec - a.spec; });
        return;
      }
      ['ru', 'en'].forEach(function (L, i) {
        const val = r[i + 1];
        if (val == null) return;
        exact[L].set(src, val);
        done[L].add(val);
        const n = norm(src);
        if (n.nums.length) { const v = norm(val); tmpl[L].set(n.k, { k: v.k, nums: v.nums }); }
      });
    });
  }
  function fill(tp, nums) {
    let i = 0;
    return tp.k.replace(new RegExp(MARK, 'g'), function () { const v = nums[i] != null ? nums[i] : tp.nums[i]; i++; return v; });
  }
  const misses = new Set();
  function miss(s) {
    if (!debug || misses.has(s)) return;
    misses.add(s);
    try { const a = JSON.parse(localStorage.getItem('hx.i18n.miss') || '[]'); if (a.indexOf(s) < 0) { a.push(s); localStorage.setItem('hx.i18n.miss', JSON.stringify(a)); } } catch (e) {}
  }
  function lookup(s, L, depth) {
    let v = exact[L].get(s);
    if (v != null) return v;
    const n = norm(s);
    if (n.nums.length) { const tp = tmpl[L].get(n.k); if (tp) return fill(tp, n.nums); }
    for (let w = 0; w < wild.length; w++) {
      const m = s.match(wild[w].re);
      if (m) { let gi = 0; return wild[w][L].replace(/\{\*\}/g, function () { gi++; return t(m[gi].trim(), depth + 1); }); }
    }
    // бўлиб таржима қилиш (ажратгичлар бўйича)
    const seps = [' · ', ' — ', ' / ', ': '];
    for (let i = 0; i < seps.length; i++) {
      if (s.indexOf(seps[i]) > 0 && depth < 4) {
        const parts = s.split(seps[i]);
        let changed = false;
        const out = parts.map(function (p) { const tr = /[Ѐ-ӿ]/.test(p) ? t(p.trim(), depth + 1, true) : p; if (tr !== p.trim()) changed = true; return tr; });
        if (changed) return out.join(seps[i]);
      }
    }
    return null;
  }
  function t(s, depth, quiet) {
    if (s == null || lang === 'uz-cyrl') return s;
    s = String(s);
    if (!/[Ѐ-ӿ]/.test(s)) return s;
    if (lang === 'uz-latn') return translit(s);
    if (done[lang].has(s)) return s;
    const r = lookup(s, lang, depth || 0);
    // таржима топилмаса: инглиз тилида ўзбек лотин ёзувига ўгирилади (масалан, фойдаланувчи киритган номлар)
    if (r == null) { if (!quiet) miss(s); return lang === 'en' ? translit(s) : s; }
    return r;
  }
  // HTML сатрини таржима қилиш (тег ва атрибутларга тегмасдан)
  function tHTML(html) {
    if (lang === 'uz-cyrl') return html;
    return String(html).replace(/>([^<]+)</g, function (m, txt) {
      const core = txt.trim(); if (!core) return m;
      const lead = txt.match(/^\s*/)[0], trail = txt.match(/\s*$/)[0];
      return '>' + lead + t(core) + trail + '<';
    });
  }

  /* ---------- DOM таржимаси ---------- */
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const doneText = new WeakMap(), doneAttr = new WeakMap();
  const CYR = /[Ѐ-ӿ]/;
  function skipEl(el) { return !el || SKIP[el.nodeName] || (el.closest && el.closest('[data-no-i18n]')); }
  function tNode(n) {
    const d = n.data;
    if (doneText.get(n) === d || !CYR.test(d) || skipEl(n.parentNode)) return;
    const core = d.trim(); if (!core) return;
    const out = d.match(/^\s*/)[0] + t(core) + d.match(/\s*$/)[0];
    doneText.set(n, out);
    if (out !== d) n.data = out;
  }
  function tAttrs(el) {
    if (!el || el.nodeType !== 1 || skipEl(el)) return;
    let rec = doneAttr.get(el); if (!rec) { rec = {}; doneAttr.set(el, rec); }
    ATTRS.forEach(function (a) {
      const v = el.getAttribute(a);
      if (!v || rec[a] === v || !CYR.test(v)) return;
      const out = t(v); rec[a] = out;
      if (out !== v) el.setAttribute(a, out);
    });
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return tNode(root);
    if (root.nodeType !== 1 || skipEl(root)) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let n; while ((n = tw.nextNode())) tNode(n);
    tAttrs(root);
    if (root.querySelectorAll) root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(tAttrs);
  }
  function start() {
    const meta = LANGS.find(function (l) { return l.id === lang; });
    document.documentElement.setAttribute('lang', meta.html);
    if (lang === 'uz-cyrl') return;
    const mo = new MutationObserver(function (muts) {
      for (let i = 0; i < muts.length; i++) {
        const m = muts[i];
        if (m.type === 'characterData') tNode(m.target);
        else if (m.type === 'attributes') tAttrs(m.target);
        else for (let j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const titleFix = function () { const tt = t(document.title); if (tt !== document.title) document.title = tt; };
    titleFix();
    walk(document.documentElement);
    document.addEventListener('DOMContentLoaded', function () { titleFix(); walk(document.body); });
  }

  function setLang(id) {
    try { localStorage.setItem('hx.lang', JSON.stringify(id)); } catch (e) {}
    location.reload();
  }

  global.HXI18N = {
    LANGS: LANGS, lang: function () { return lang; }, setLang: setLang, t: t, tHTML: tHTML, translit: translit, add: add,
    misses: function () { return Array.from(misses); }, start: start,
    ready: function (L) { return L.indexOf('uz') === 0 || (exact[L] && exact[L].size > 0); }
  };
})(window);
