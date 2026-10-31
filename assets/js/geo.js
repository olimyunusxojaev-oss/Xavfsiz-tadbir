/* =========================================================
   Геометрия ва интерактив харита (Leaflet) — 2-версия
   • периметр (м) — Гаверсинус формуласи, майдон (м²) — маҳаллий текис проекция
   • НЎП: қўлда белгилаш (периметрга ёпишади), йўллар бўйича (OpenStreetMap
     Overpass) ёки мантиқий тақсимот (узун томонлар — кўча томони)
   • ички ҳудуд патруль секторларига бўлинади, ҳар бир сектор учун патруль
     йўналиши чизилади ва нарядлар шу йўналиш бўйлаб ҳаракатланади
   • харита плиткалари: http(s) — OpenStreetMap, файлдан очилганда — Esri
     (OSM «Referer»сиз сўровларни блоклайди)
   ========================================================= */
(function (global) {
  'use strict';
  const R = 6371008.8;
  const rad = function (d) { return d * Math.PI / 180; };

  /* ---------- Асосий геометрия ---------- */
  function haversine(a, b) {
    const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function frame(ll) {
    const lat0 = ll.reduce(function (s, p) { return s + p[0]; }, 0) / ll.length;
    const lon0 = ll.reduce(function (s, p) { return s + p[1]; }, 0) / ll.length;
    const k = Math.cos(rad(lat0));
    return {
      toXY: function (p) { return [rad(p[1] - lon0) * R * k, rad(p[0] - lat0) * R]; },
      toLL: function (q) { return [lat0 + (q[1] / R) * 180 / Math.PI, lon0 + (q[0] / (R * k)) * 180 / Math.PI]; }
    };
  }
  function areaXY(xy) { let s = 0; for (let i = 0; i < xy.length; i++) { const a = xy[i], b = xy[(i + 1) % xy.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function centroidXY(xy) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < xy.length; i++) { const p = xy[i], q = xy[(i + 1) % xy.length], cr = p[0] * q[1] - q[0] * p[1]; a += cr; cx += (p[0] + q[0]) * cr; cy += (p[1] + q[1]) * cr; }
    if (Math.abs(a) < 1e-9) { const n = xy.length || 1; return [xy.reduce(function (s, p) { return s + p[0]; }, 0) / n, xy.reduce(function (s, p) { return s + p[1]; }, 0) / n]; }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function measure(ll) {
    if (!ll || ll.length < 2) return { perimeter: 0, area: 0 };
    let per = 0;
    for (let i = 0; i < ll.length; i++) per += haversine(ll[i], ll[(i + 1) % ll.length]);
    if (ll.length < 3) return { perimeter: per, area: 0 };
    const f = frame(ll);
    return { perimeter: per, area: Math.abs(areaXY(ll.map(f.toXY))) };
  }
  function pathLength(ll) {
    if (!ll || ll.length < 2) return 0;
    let per = 0;
    for (let i = 0; i < ll.length - 1; i++) per += haversine(ll[i], ll[i + 1]);
    return per;
  }
  function midpoint(ll) {
    if (!ll || !ll.length) return null;
    if (ll.length === 1) return ll[0].slice();
    const L = pathLength(ll), half = L / 2;
    if (!L) return ll[0].slice();
    let acc = 0;
    for (let i = 0; i < ll.length - 1; i++) {
      const d = haversine(ll[i], ll[i + 1]);
      if (acc + d >= half || i === ll.length - 2) {
        const t = d ? Math.max(0, Math.min(1, (half - acc) / d)) : 0;
        return [ll[i][0] + (ll[i + 1][0] - ll[i][0]) * t, ll[i][1] + (ll[i + 1][1] - ll[i][1]) * t];
      }
      acc += d;
    }
    return ll[ll.length - 1].slice();
  }
  function pointsAlongOpen(ll, n) {
    if (!ll || ll.length < 2 || n <= 0) return [];
    const L = pathLength(ll), out = [];
    for (let k = 0; k < n; k++) {
      const dist = (k + 0.5) * L / n;
      let acc = 0, placed = false;
      for (let i = 0; i < ll.length - 1; i++) {
        const d = haversine(ll[i], ll[i + 1]);
        if (acc + d >= dist || i === ll.length - 2) {
          const t = d ? Math.max(0, Math.min(1, (dist - acc) / d)) : 0;
          out.push([ll[i][0] + (ll[i + 1][0] - ll[i][0]) * t, ll[i][1] + (ll[i + 1][1] - ll[i][1]) * t]);
          placed = true;
          break;
        }
        acc += d;
      }
      if (!placed) out.push(ll[ll.length - 1].slice());
    }
    return out;
  }
  function centroid(ll) { const f = frame(ll); return f.toLL(centroidXY(ll.map(f.toXY))); }
  function insideXY(pt, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if (((a[1] > pt[1]) !== (b[1] > pt[1])) && (pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0])) c = !c;
    }
    return c;
  }
  function inside(pt, poly) { return insideXY(pt, poly); }
  function loopLen(xy) { let L = 0; for (let i = 0; i < xy.length; i++) { const a = xy[i], b = xy[(i + 1) % xy.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; }
  function pointAtXY(xy, d) {
    const L = loopLen(xy); if (!L) return xy[0];
    d = ((d % L) + L) % L;
    for (let i = 0; i < xy.length; i++) {
      const a = xy[i], b = xy[(i + 1) % xy.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= l) { const t = l ? d / l : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
      d -= l;
    }
    return xy[0];
  }
  function pointsAlongXY(xy, n, off) { const L = loopLen(xy), out = []; for (let k = 0; k < n; k++) out.push(pointAtXY(xy, (k + (off || 0)) * L / n)); return out; }
  function pointsAlong(ll, n, off) { if (!ll || ll.length < 2 || n <= 0) return []; const f = frame(ll); return pointsAlongXY(ll.map(f.toXY), n, off).map(f.toLL); }
  function nearestOnPolyXY(p, xy) {
    let best = null, along = 0;
    for (let i = 0; i < xy.length; i++) {
      const a = xy[i], b = xy[(i + 1) % xy.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, l = Math.sqrt(l2);
      let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
      const q = [a[0] + dx * t, a[1] + dy * t], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (!best || d < best.d) best = { p: q, d: d, edge: i, t: t, along: along + l * t, nx: l ? dy / l : 0, ny: l ? -dx / l : 0 };
      along += l;
    }
    return best;
  }
  function segInter(p, p2, q, q2) {
    const r = [p2[0] - p[0], p2[1] - p[1]], s = [q2[0] - q[0], q2[1] - q[1]], den = r[0] * s[1] - r[1] * s[0];
    if (Math.abs(den) < 1e-12) return null;
    const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / den, u = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [p[0] + t * r[0], p[1] + t * r[1]] : null;
  }
  // Сутерленд–Ҳоджмен: кўпбурчакни тўғри тўртбурчак ичига кесиш
  function clipRect(xy, x0, y0, x1, y1) {
    const edges = [
      [function (p) { return p[0] >= x0; }, function (a, b) { const t = (x0 - a[0]) / (b[0] - a[0]); return [x0, a[1] + t * (b[1] - a[1])]; }],
      [function (p) { return p[0] <= x1; }, function (a, b) { const t = (x1 - a[0]) / (b[0] - a[0]); return [x1, a[1] + t * (b[1] - a[1])]; }],
      [function (p) { return p[1] >= y0; }, function (a, b) { const t = (y0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y0]; }],
      [function (p) { return p[1] <= y1; }, function (a, b) { const t = (y1 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), y1]; }]
    ];
    let out = xy;
    edges.forEach(function (e) {
      const inp = out; out = [];
      for (let i = 0; i < inp.length; i++) {
        const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
        if (e[0](cur)) { if (!e[0](prev)) out.push(e[1](prev, cur)); out.push(cur); }
        else if (e[0](prev)) out.push(e[1](prev, cur));
      }
    });
    return out;
  }
  function shrinkXY(xy, k) { const c = centroidXY(xy); return xy.map(function (p) { return [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]; }); }
  function scaleFrom(ll, k, extraM) {
    const f = frame(ll), xy = ll.map(f.toXY), c = centroidXY(xy);
    return xy.map(function (q) { const dx = q[0] - c[0], dy = q[1] - c[1], L = Math.hypot(dx, dy) || 1, s = k + (extraM || 0) / L; return f.toLL([c[0] + dx * s, c[1] + dy * s]); });
  }
  function circleLatLngs(c, r, seg) {
    seg = seg || 48;
    const f = frame([c]); const out = [];
    for (let i = 0; i < seg; i++) { const a = (i / seg) * 2 * Math.PI; out.push(f.toLL([Math.cos(a) * r, Math.sin(a) * r])); }
    return out;
  }
  function interior(ll, n) {
    if (!ll || ll.length < 3 || n <= 0) return [];
    const secs = sectors(ll, n);
    return secs.map(function (s) { return s.center; });
  }

  /* ---------- Патруль секторлари ---------- */
  function sectors(ll, n, maxN) {
    if (!ll || ll.length < 3 || n <= 0) return [];
    const f = frame(ll), xy = ll.map(f.toXY), A = Math.abs(areaXY(xy));
    const xs = xy.map(function (p) { return p[0]; }), ys = xy.map(function (p) { return p[1]; });
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    // катта катакдан бошлаб кичрайтирамиз — ҳудуд тўлиқ қопланади, секторлар сони ≈ n
    let cell = Math.sqrt(A / n) * 1.5, cells = [];
    for (let it = 0; it < 30; it++) {
      cells = [];
      for (let x = minX; x < maxX - 1e-6; x += cell)
        for (let y = minY; y < maxY - 1e-6; y += cell) {
          const c = clipRect(xy, x, y, Math.min(x + cell, maxX), Math.min(y + cell, maxY));
          const a = c.length >= 3 ? Math.abs(areaXY(c)) : 0;
          if (a > 1) cells.push({ xy: c, a: a });
        }
      // жуда кичик бўлакларни қўшни катта бўлакка қўшмасдан ташлаб юбормаслик учун фақат 8% дан катталарини санаймиз
      const big = cells.filter(function (c) { return c.a > cell * cell * 0.08; });
      if (big.length >= n) { cells = big; break; }
      cell *= 0.92;
    }
    cells.sort(function (p, q) { return q.a - p.a; });
    if (maxN && cells.length > maxN) cells = cells.slice(0, maxN);
    // юқоридан пастга, чапдан ўнгга тартиб
    cells.sort(function (p, q) { const a = centroidXY(p.xy), b = centroidXY(q.xy); return Math.abs(b[1] - a[1]) > cell * 0.5 ? b[1] - a[1] : a[0] - b[0]; });
    return cells.map(function (c) { return { ring: c.xy.map(f.toLL), routeXY: shrinkXY(c.xy, 0.62), area: c.a, center: f.toLL(centroidXY(c.xy)), f: f }; });
  }

  /* ---------- НЎП жойлашуви ---------- */
  function snapToPerimeter(ll, p) { const f = frame(ll), xy = ll.map(f.toXY), r = nearestOnPolyXY(f.toXY(p), xy); return { latlng: f.toLL(r.p), dist: r.d }; }
  // йўл маълумоти бўлмаса: узун томонлар (одатда кўча томони) бўйлаб мутаносиб тақсимот
  function heuristicGates(ll, n) {
    if (!ll || ll.length < 3 || n <= 0) return [];
    const f = frame(ll), xy = ll.map(f.toXY);
    const edges = xy.map(function (a, i) { const b = xy[(i + 1) % xy.length]; return { i: i, a: a, b: b, l: Math.hypot(b[0] - a[0], b[1] - a[1]) }; });
    const total = edges.reduce(function (s, e) { return s + e.l; }, 0);
    edges.forEach(function (e) { e.q = n * e.l / total; e.c = Math.floor(e.q); });
    let left = n - edges.reduce(function (s, e) { return s + e.c; }, 0);
    edges.slice().sort(function (p, q) { return (q.q - q.c) - (p.q - p.c); }).forEach(function (e) { if (left > 0) { e.c++; left--; } });
    const out = [];
    edges.sort(function (p, q) { return q.l - p.l; }).forEach(function (e) {
      for (let j = 0; j < e.c; j++) { const t = (j + 1) / (e.c + 1); out.push(f.toLL([e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t])); }
    });
    return out;
  }
  const GATE_RANK = { pedestrian: 5, footway: 5, steps: 4, living_street: 4, residential: 4, service: 3, unclassified: 3, tertiary: 3, secondary: 3, primary: 2, trunk: 1, path: 2, track: 1, cycleway: 2 };
  const DRIVE_RANK = { motorway: 6, trunk: 6, primary: 5, secondary: 4, tertiary: 3, unclassified: 2, residential: 2, living_street: 1, service: 1 };
  function gatesFromRoads(ll, roads, n) {
    if (!roads || !roads.length || n <= 0) return null;
    const f = frame(ll), xy = ll.map(f.toXY), per = loopLen(xy), cands = [];
    roads.forEach(function (w) {
      const rank = GATE_RANK[w.cls] || 1, pts = w.pts.map(f.toXY);
      for (let i = 0; i < pts.length - 1; i++)
        for (let e = 0; e < xy.length; e++) {
          const p = segInter(pts[i], pts[i + 1], xy[e], xy[(e + 1) % xy.length]);
          if (p) cands.push({ p: p, rank: rank, name: w.name });
        }
    });
    if (!cands.length) return null;
    const merged = [];
    cands.sort(function (a, b) { return b.rank - a.rank; }).forEach(function (c) {
      if (!merged.some(function (m) { return Math.hypot(m.p[0] - c.p[0], m.p[1] - c.p[1]) < 25; })) merged.push(c);
    });
    const minD = Math.max(30, per / (n * 2.5)), pick = [];
    merged.forEach(function (c) { if (pick.length < n && !pick.some(function (m) { return Math.hypot(m.p[0] - c.p[0], m.p[1] - c.p[1]) < minD; })) pick.push(c); });
    let out = pick.map(function (c) { return f.toLL(c.p); });
    if (out.length < n) {
      heuristicGates(ll, n * 2).forEach(function (g) {
        if (out.length >= n) return;
        const q = f.toXY(g);
        if (!out.some(function (o) { const r = f.toXY(o); return Math.hypot(r[0] - q[0], r[1] - q[1]) < minD; })) out.push(g);
      });
    }
    return out.slice(0, n);
  }
  function nodeKey(p) { return (+p[0]).toFixed(5) + ',' + (+p[1]).toFixed(5); }
  // Ҳақиқий чорраҳа: графда даражаси 3 ва ундан юқори бўлган тугун (йўл давоми эмас)
  function junctionNodes(roads) {
    const g = {};
    (roads || []).forEach(function (w) {
      if (!w || w.cls === 'motorway' || w.cls === 'motorway_link') return;
      const drive = DRIVE_RANK[w.cls] || 0, walk = GATE_RANK[w.cls] || 0;
      if (!drive && !walk) return;
      const pts = w.pts || [];
      for (let i = 0; i < pts.length - 1; i++) {
        const ka = nodeKey(pts[i]), kb = nodeKey(pts[i + 1]);
        if (ka === kb) continue;
        if (!g[ka]) g[ka] = { p: pts[i], nbr: {}, rank: 0, drive: 0 };
        if (!g[kb]) g[kb] = { p: pts[i + 1], nbr: {}, rank: 0, drive: 0 };
        g[ka].nbr[kb] = 1; g[kb].nbr[ka] = 1;
        const add = drive || 1;
        g[ka].rank += add; g[kb].rank += add;
        if (drive) { g[ka].drive++; g[kb].drive++; }
      }
    });
    return Object.keys(g).map(function (k) { const n = g[k]; n.deg = Object.keys(n.nbr).length; return n; }).filter(function (n) { return n.deg >= 3; });
  }
  function spreadPick(items, n, minD, xyOf) {
    const pick = [];
    items.forEach(function (it) {
      if (pick.length >= n) return;
      const q = xyOf(it);
      if (!pick.some(function (m) { const r = xyOf(m); return Math.hypot(r[0] - q[0], r[1] - q[1]) < minD; })) pick.push(it);
    });
    return pick;
  }
  // НЎП — периметрга яқин чорраҳада (йўл ҳудудга кирадиган кесишма)
  function gatesFromJunctions(ll, roads, n) {
    if (!ll || ll.length < 3 || !roads || !roads.length || n <= 0) return null;
    const f = frame(ll), xy = ll.map(f.toXY), per = loopLen(xy);
    const items = junctionNodes(roads).map(function (j) {
      const q = f.toXY(j.p), r = nearestOnPolyXY(q, xy);
      return { ll: j.p, q: q, d: r.d, score: (j.drive ? 48 : 0) + j.rank - r.d * 0.4 };
    }).filter(function (j) { return j.d < 42 && j.d > 4; }).sort(function (a, b) { return b.score - a.score; });
    if (!items.length) return null;
    const pick = spreadPick(items, n, Math.max(34, per / (n * 2.2)), function (it) { return it.q; });
    return pick.length ? pick.map(function (it) { return it.ll; }) : null;
  }
  // Периметр постлари: кўриш масофаси бўйича тенг оралиқ, яқинида чорраҳа бўлса — шу ерга
  function postPoints(ll, n, roads, gates) {
    if (n <= 0 || !ll || ll.length < 3) return [];
    const f = frame(ll), xy = ll.map(f.toXY), L = loopLen(xy);
    if (L < 1) return [];
    const gxy = (gates || []).map(function (g) { return f.toXY(g); });
    const gap = L / n;
    const gateClear = Math.max(16, Math.min(gap * 0.42, 36));
    const nearGate = function (q) { return gxy.some(function (g) { return Math.hypot(g[0] - q[0], g[1] - q[1]) < gateClear; }); };
    const junctions = [];
    if (roads && roads.length) {
      junctionNodes(roads).forEach(function (j) {
        const q = f.toXY(j.p), r = nearestOnPolyXY(q, xy);
        if (r.d < 30 && !nearGate(q)) junctions.push({ ll: j.p, on: r.p, score: j.rank });
      });
    }
    const used = [], out = [];
    for (let i = 0; i < n; i++) {
      let along = (i + 0.5) * gap;
      let target = pointAtXY(xy, along);
      if (nearGate(target)) {
        along = (i + 0.18) * gap;
        target = pointAtXY(xy, along);
        if (nearGate(target)) target = pointAtXY(xy, (i + 0.82) * gap);
      }
      let best = -1, bd = Math.min(26, gap * 0.35);
      for (let k = 0; k < junctions.length; k++) {
        if (used[k]) continue;
        const d = Math.hypot(junctions[k].on[0] - target[0], junctions[k].on[1] - target[1]);
        if (d < bd) { bd = d; best = k; }
      }
      if (best >= 0) { used[best] = 1; out.push(junctions[best].ll.slice()); }
      else out.push(f.toLL(target));
    }
    return out;
  }
  // НЎП сони тўлгунча: чорраҳа, йўл кесишмаси, қолгани узун томонлар
  function fillGates(ll, roads, n) {
    n = Math.max(1, n || 1);
    let g = [];
    if (roads && roads.length) g = gatesFromJunctions(ll, roads, n) || gatesFromRoads(ll, roads, n) || [];
    if (g.length < n) {
      const f = frame(ll), minD = 28;
      heuristicGates(ll, Math.max(n * 2, n + 2)).forEach(function (h) {
        if (g.length >= n) return;
        const q = f.toXY(h);
        if (!g.some(function (o) { const r = f.toXY(o); return Math.hypot(r[0] - q[0], r[1] - q[1]) < minD; })) g.push(h);
      });
    }
    return g.slice(0, n).map(function (p) { return [+p[0], +p[1]]; });
  }
  // Қўлда сурилган постларни сақлаб, етишмаганини автоматик тўлдиради
  function resolvePosts(ll, n, roads, gates, saved) {
    const auto = postPoints(ll, n, roads, gates);
    if (!saved || !saved.length || n <= 0) return auto;
    if (saved.length === n) return saved.map(function (p) { return [+p[0], +p[1]]; });
    const f = frame(ll), out = [];
    for (let i = 0; i < Math.min(n, saved.length); i++) out.push([+saved[i][0], +saved[i][1]]);
    auto.forEach(function (p) {
      if (out.length >= n) return;
      const q = f.toXY(p);
      if (out.some(function (o) { const r = f.toXY(o); return Math.hypot(r[0] - q[0], r[1] - q[1]) < 14; })) return;
      out.push([+p[0], +p[1]]);
    });
    for (let i = 0; out.length < n && i < auto.length; i++) out.push([+auto[i][0], +auto[i][1]]);
    return out.slice(0, n);
  }
  function trafficPoints(ll, gates, n, roads) {
    if (n <= 0 || !roads || !roads.length || !ll || ll.length < 3) return [];
    const f = frame(ll), xy = ll.map(f.toXY);
    const gxy = (gates || []).map(function (g) { return f.toXY(g); });
    const items = junctionNodes(roads).filter(function (j) { return j.drive > 0; }).map(function (j) {
      const q = f.toXY(j.p), r = nearestOnPolyXY(q, xy), inside = insideXY(q, xy);
      let nearG = 9999;
      gxy.forEach(function (g) { nearG = Math.min(nearG, Math.hypot(g[0] - q[0], g[1] - q[1])); });
      return { ll: j.p, q: q, inside: inside, score: j.rank * 6 + (nearG < 180 ? 22 : 0) - r.d * 0.12, d: r.d };
    }).filter(function (j) { return !j.inside && j.d > 12 && j.d < 190; }).sort(function (a, b) { return b.score - a.score; });
    return spreadPick(items, n, 50, function (it) { return it.q; }).map(function (it) { return it.ll; });
  }

  /* ---------- OpenStreetMap йўллари (Overpass API) ---------- */
  const OVERPASS = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass-api.de/api/interpreter'];
  const roadCache = {};
  function fetchRoads(ll) {
    const lats = ll.map(function (p) { return p[0]; }), lngs = ll.map(function (p) { return p[1]; });
    const dLat = 300 / 111320, dLng = 300 / (111320 * Math.cos(rad(lats[0])));
    const bb = [Math.min.apply(null, lats) - dLat, Math.min.apply(null, lngs) - dLng, Math.max.apply(null, lats) + dLat, Math.max.apply(null, lngs) + dLng].map(function (v) { return v.toFixed(5); });
    const key = bb.join(',');
    if (roadCache[key]) return Promise.resolve(roadCache[key]);
    const q = '[out:json][timeout:18];way["highway"~"primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|footway|path|steps|cycleway"](' + key + ');out geom;';
    return overpass(q).then(function (j) {
      const ways = (j.elements || []).filter(function (e) { return e.type === 'way' && e.geometry && e.tags && e.tags.highway; })
        .map(function (e) { return { cls: e.tags.highway, name: e.tags.name || '', pts: e.geometry.map(function (g) { return [g.lat, g.lon]; }) }; });
      roadCache[key] = ways; return ways;
    });
  }

  /* ---------- Ҳақиқий йўллар бўйлаб патруль ---------- */
  function usableRoad(cls) {
    if (!cls || cls === 'motorway' || cls === 'motorway_link') return false;
    return !!(DRIVE_RANK[cls] || GATE_RANK[cls]);
  }
  function roadsInside(roads, ringLL) {
    if (!roads || !ringLL || ringLL.length < 3) return [];
    const f = frame(ringLL), ring = ringLL.map(f.toXY), lines = [];
    roads.forEach(function (w) {
      if (!usableRoad(w.cls)) return;
      let cur = [];
      const flush = function () { if (cur.length >= 2) lines.push(cur.slice()); cur = []; };
      for (let i = 0; i < w.pts.length - 1; i++) {
        const a = w.pts[i], b = w.pts[i + 1];
        const ma = f.toXY(a), mb = f.toXY(b), mid = [(ma[0] + mb[0]) / 2, (ma[1] + mb[1]) / 2];
        if (insideXY(mid, ring)) { if (!cur.length) cur.push(a); cur.push(b); }
        else flush();
      }
      flush();
    });
    return lines;
  }
  function graphFromLines(lines) {
    const nodes = {};
    const add = function (ll) { const k = nodeKey(ll); if (!nodes[k]) nodes[k] = { k: k, ll: ll, xy: null, e: [] }; return nodes[k]; };
    lines.forEach(function (line) {
      for (let i = 0; i < line.length - 1; i++) {
        const A = add(line[i]), B = add(line[i + 1]);
        if (A.k === B.k) continue;
        if (A.e.indexOf(B.k) < 0) { A.e.push(B.k); B.e.push(A.k); }
      }
    });
    const keys = Object.keys(nodes);
    if (keys.length < 2) return null;
    const f = frame(keys.map(function (k) { return nodes[k].ll; }));
    keys.forEach(function (k) { nodes[k].xy = f.toXY(nodes[k].ll); });
    return { nodes: nodes, f: f, keys: keys };
  }
  function shortestKeys(nodes, from, to) {
    if (from === to) return [from];
    if (!nodes[from] || !nodes[to]) return null;
    const dist = {}, prev = {}, used = {};
    dist[from] = 0;
    for (;;) {
      let u = null, best = Infinity;
      for (const k in dist) if (!used[k] && dist[k] < best) { best = dist[k]; u = k; }
      if (u == null) return null;
      if (u === to) break;
      used[u] = 1;
      nodes[u].e.forEach(function (v) {
        if (!nodes[v] || !nodes[v].xy || !nodes[u].xy) return;
        const w = Math.hypot(nodes[v].xy[0] - nodes[u].xy[0], nodes[v].xy[1] - nodes[u].xy[1]);
        const nd = dist[u] + w;
        if (dist[v] == null || nd < dist[v]) { dist[v] = nd; prev[v] = u; }
      });
    }
    const path = [to];
    let c = to;
    while (prev[c]) { c = prev[c]; path.push(c); }
    path.reverse();
    return path;
  }
  function largestComponent(nodes, keys) {
    const seen = {}, best = [];
    keys.forEach(function (start) {
      if (seen[start]) return;
      const comp = [], st = [start];
      seen[start] = 1;
      while (st.length) {
        const u = st.pop(); comp.push(u);
        nodes[u].e.forEach(function (v) { if (nodes[v] && !seen[v]) { seen[v] = 1; st.push(v); } });
      }
      if (comp.length > best.length) { best.length = 0; comp.forEach(function (k) { best.push(k); }); }
    });
    return best;
  }
  function eulerTour(nodes, keys) {
    if (!keys || keys.length < 2) return null;
    const allow = {};
    keys.forEach(function (k) { allow[k] = 1; });
    const adj = {};
    keys.forEach(function (k) {
      adj[k] = [];
      nodes[k].e.forEach(function (v) { if (allow[v] && adj[k].indexOf(v) < 0) adj[k].push(v); });
    });
    let guard = 0;
    let odd = keys.filter(function (k) { return adj[k].length % 2 === 1; });
    while (odd.length >= 2 && guard < 20) {
      guard++;
      const a = odd[0];
      let bi = 1, bd = Infinity;
      for (let i = 1; i < odd.length; i++) {
        const d = Math.hypot(nodes[odd[i]].xy[0] - nodes[a].xy[0], nodes[odd[i]].xy[1] - nodes[a].xy[1]);
        if (d < bd) { bd = d; bi = i; }
      }
      const b = odd[bi];
      const path = shortestKeys(nodes, a, b);
      if (path && path.length > 1) {
        for (let i = 0; i < path.length - 1; i++) { adj[path[i]].push(path[i + 1]); adj[path[i + 1]].push(path[i]); }
      }
      odd = keys.filter(function (k) { return adj[k].length % 2 === 1; });
      if (!path || path.length < 2) break;
    }
    const A = {};
    keys.forEach(function (k) { A[k] = adj[k].slice(); });
    const st = [keys[0]], out = [];
    let steps = 0;
    while (st.length && steps < 8000) {
      steps++;
      const v = st[st.length - 1];
      if (A[v] && A[v].length) {
        const u = A[v].pop();
        const back = A[u];
        if (back) { const i = back.lastIndexOf(v); if (i >= 0) back.splice(i, 1); }
        st.push(u);
      } else out.push(st.pop());
    }
    out.reverse();
    if (out.length < 3) return null;
    if (out[0] !== out[out.length - 1]) {
      const back = shortestKeys(nodes, out[out.length - 1], out[0]);
      if (back && back.length > 1) return out.concat(back.slice(1));
    }
    return out;
  }
  function roadLoops(roads, ringLL) {
    const lines = roadsInside(roads, ringLL);
    const g = graphFromLines(lines);
    const loops = [];
    if (g) {
      const comp = largestComponent(g.nodes, g.keys);
      const tour = eulerTour(g.nodes, comp);
      if (tour) {
        const xy = tour.map(function (k) { return g.nodes[k].xy; });
        loops.push({ xy: xy, ll: tour.map(function (k) { return g.nodes[k].ll; }), f: g.f, len: loopLen(xy) });
      }
    }
    return { lines: lines, loops: loops };
  }

  /* ---------- Харитадаги объект (бино, майдон, боғ) ---------- */
  const OBJ_LABEL = { stadium: 'Стадион', park: 'Боғ', garden: 'Боғ', pitch: 'Спорт майдони', sports_centre: 'Спорт мажмуаси', swimming_pool: 'Бассейн', school: 'Мактаб', university: 'Университет', college: 'Коллеж', kindergarten: 'Боғча', hospital: 'Шифохона', clinic: 'Поликлиника', theatre: 'Театр', cinema: 'Кинотеатр', marketplace: 'Бозор', place_of_worship: 'Ибодатхона', community_centre: 'Маданият маркази', museum: 'Музей', hotel: 'Меҳмонхона', mall: 'Савдо маркази', supermarket: 'Супермаркет', restaurant: 'Ресторан', cafe: 'Кафе', attraction: 'Диққатга сазовор жой', exhibition_centre: 'Кўргазма маркази', conference_centre: 'Конференция зали', bus_station: 'Автовокзал', library: 'Кутубхона', townhall: 'Ҳокимият' };
  function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function objectName(tags) {
    tags = tags || {};
    const named = tags['name:uz'] || tags.name || tags['name:ru'];
    if (named && named !== 'yes') return named;
    const kind = tags.leisure || tags.amenity || tags.shop || tags.tourism || tags.building;
    return OBJ_LABEL[kind] || 'Объект';
  }
  function objectKind(tags) {
    tags = tags || {};
    if (tags.leisure === 'stadium' || tags.building === 'stadium') return 'stadium';
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
    if (tags.amenity || tags.shop || tags.tourism) return 'place';
    return 'building';
  }
  function ringFromWay(el) {
    if (!el.geometry || el.geometry.length < 4) return null;
    const ll = el.geometry.map(function (g) { return [g.lat, g.lon]; });
    const a = ll[0], b = ll[ll.length - 1];
    if (Math.abs(a[0] - b[0]) > 1e-6 || Math.abs(a[1] - b[1]) > 1e-6) return null;
    return ll.slice(0, -1);
  }
  function parseObjects(elements) {
    const out = [];
    (elements || []).forEach(function (el) {
      if (el.type !== 'way') return;
      const ll = ringFromWay(el);
      if (!ll) return;
      const area = measure(ll).area;
      if (area < 80 || area > 800000) return;
      out.push({ id: el.id, ll: ll, tags: el.tags || {}, name: objectName(el.tags), kind: objectKind(el.tags), area: area });
    });
    return out;
  }
  const objCache = {};
  let overpassChain = Promise.resolve();
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function overpassOnce(q, i) {
    if (i >= OVERPASS.length) return Promise.reject(new Error('overpass-unavailable'));
    const ctl = global.AbortController ? new AbortController() : null;
    const tm = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    return fetch(OVERPASS[i], { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        clearTimeout(tm);
        if (r.status === 429 || r.status === 504) return wait(1600).then(function () { return overpassOnce(q, i + 1); });
        if (!r.ok) return overpassOnce(q, i + 1);
        return r.json();
      })
      .catch(function () { clearTimeout(tm); return wait(700).then(function () { return overpassOnce(q, i + 1); }); });
  }
  function overpass(q) {
    const job = overpassChain.then(function () { return overpassOnce(q, 0); });
    overpassChain = job.then(function () { return wait(350); }, function () { return wait(900); });
    return job;
  }
  function fetchObjectsBBox(south, west, north, east) {
    const key = [south, west, north, east].map(function (v) { return (+v).toFixed(4); }).join(',');
    if (objCache[key]) return Promise.resolve(objCache[key]);
    const bb = key;
    const q = '[out:json][timeout:18];(way["building"](' + bb + ');way["leisure"](' + bb + ');way["amenity"](' + bb + ');way["tourism"](' + bb + ');way["shop"](' + bb + '););out geom 420;';
    return overpass(q).then(function (j) { const list = parseObjects(j.elements); objCache[key] = list; return list; });
  }
  function fetchObjectsAt(lat, lon) {
    const q = '[out:json][timeout:12];(way(around:40,' + lat + ',' + lon + ')["building"];way(around:55,' + lat + ',' + lon + ')["leisure"];way(around:55,' + lat + ',' + lon + ')["amenity"];way(around:55,' + lat + ',' + lon + ')["tourism"];);out geom 80;';
    return overpass(q).then(function (j) { return parseObjects(j.elements); });
  }
  function containsLL(ring, pt) {
    const f = frame(ring); return insideXY(f.toXY(pt), ring.map(f.toXY));
  }
  function pickObject(list, lat, lon) {
    const pt = [lat, lon];
    const hit = list.filter(function (o) { return containsLL(o.ll, pt); }).sort(function (a, b) { return a.area - b.area; });
    if (hit.length) return hit[0];
    let best = null, bd = 48;
    list.forEach(function (o) {
      const c = centroid(o.ll), d = haversine(pt, c);
      if (d < bd) { bd = d; best = o; }
    });
    return best;
  }

  /* ---------- Иллюстрацияли белгилар (SVG) ---------- */
  const ILL = {
    guard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.4 7.3h9.2l-1-2.7a1.6 1.6 0 0 0-1.5-1H9.9a1.6 1.6 0 0 0-1.5 1z" fill="#ffd36b"/><circle cx="12" cy="9.7" r="2.9" fill="#fff"/><path d="M6.6 21v-4.2a5.4 5.4 0 0 1 10.8 0V21z" fill="#fff"/><path d="M12 13.3l1.2 2.2-1.2 3.1-1.2-3.1z" fill="#ffd36b"/></svg>',
    patrol: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 5.8h5.8l-.6-1.7a1 1 0 0 0-1-.7H7.2a1 1 0 0 0-1 .7z" fill="#ffd36b"/><circle cx="8.5" cy="8" r="2.4" fill="#fff"/><path d="M4.2 19v-3.2a4.3 4.3 0 0 1 8.6 0V19z" fill="#fff"/><circle cx="15.9" cy="9" r="2.2" fill="#fff" opacity=".9"/><path d="M12.4 19v-2.7a3.9 3.9 0 0 1 7.8 0V19z" fill="#fff" opacity=".9"/></svg>',
    gate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V6.6A2.6 2.6 0 0 1 7.6 4h8.8A2.6 2.6 0 0 1 19 6.6V21h-2.4V6.9H7.4V21z" fill="#fff"/><circle cx="12" cy="10.6" r="1.7" fill="#ffe2b8"/><path d="M9.7 21v-4.4a2.3 2.3 0 0 1 4.6 0V21z" fill="#ffe2b8"/></svg>',
    traffic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.4 3h3.2l4.6 15H5.8z" fill="#fff"/><path d="M8.7 8.6h6.6l.9 3H7.8z" fill="#e85d04"/><rect x="4" y="18" width="16" height="3" rx="1" fill="#fff"/></svg>',
    hq: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 21V3" stroke="#3a0606" stroke-width="2.2" stroke-linecap="round"/><path d="M7.5 4h11l-2.6 3.6L18.5 11h-11z" fill="#3a0606"/></svg>',
    dog: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="10" r="2" fill="#fff"/><circle cx="17" cy="10" r="2" fill="#fff"/><circle cx="10" cy="5.6" r="2" fill="#fff"/><circle cx="14" cy="5.6" r="2" fill="#fff"/><path d="M12 12.5c-3 0-6 4-6 6.5 0 1.8 1.8 2.3 3 1.8 1-.4 2-.6 3-.6s2 .2 3 .6c1.2.5 3 0 3-1.8 0-2.5-3-6.5-6-6.5z" fill="#fff"/></svg>'
  };
  // Легенда (ҳар бир саҳифада бир хил кўриниш)
  function legendItems(res) {
    if (res && res.shape === 'route') {
      return [
        { k: 'posts', cls: 'post', ill: 'guard', label: 'Пост патруллари', n: res.posts },
        { k: 'routes', cls: 'patrol', ill: 'patrol', label: 'Хизмат йўналиши', n: res.patrols },
        { k: 'traffic', cls: 'traffic', ill: 'traffic', label: 'Йўл ҳаракати постлари', n: res.trafficPosts },
        { k: 'hq', cls: 'hq', ill: 'hq', label: 'Штаб ва захира', n: null }
      ].filter(function (i) { return i.n == null || i.n > 0; });
    }
    return [
      { k: 'posts', cls: 'post', ill: 'guard', label: 'Периметр постлари', n: res ? res.posts : null },
      { k: 'routes', cls: 'patrol', ill: 'patrol', label: 'Патруль нарядлари ва йўналишлари', n: res ? res.patrols : null },
      { k: 'sectors', cls: 'sector', ill: null, label: 'Патруль секторлари', n: null },
      { k: 'cps', cls: 'gate', ill: 'gate', label: 'НЎП (кириш нуқталари)', n: res ? res.entrances : null },
      { k: 'traffic', cls: 'traffic', ill: 'traffic', label: 'Йўл ҳаракати постлари', n: res ? res.trafficPosts : null },
      { k: 'hq', cls: 'hq', ill: 'hq', label: 'Штаб ва захира', n: null }
    ].filter(function (i) { return !res || i.n == null || i.n > 0; });
  }
  function legendSwatch(it) {
    if (it.cls === 'evac') return '<span class="lg-line evac"></span>';
    if (it.cls === 'sector') return '<span class="lg-sector"></span>';
    return '<span class="mk2 ' + it.cls + ' lg">' + ILL[it.ill] + '</span>';
  }

  global.HXGeo = {
    haversine: haversine, measure: measure, pathLength: pathLength, midpoint: midpoint, pointsAlongOpen: pointsAlongOpen, centroid: centroid, pointsAlong: pointsAlong, interior: interior, scaleFrom: scaleFrom,
    circleLatLngs: circleLatLngs, inside: inside, sectors: sectors, snapToPerimeter: snapToPerimeter, heuristicGates: heuristicGates,
    gatesFromRoads: gatesFromRoads, gatesFromJunctions: gatesFromJunctions, postPoints: postPoints, trafficPoints: trafficPoints, fetchRoads: fetchRoads,
    roadLoops: roadLoops, objectName: objectName, ILL: ILL, legendItems: legendItems, legendSwatch: legendSwatch
  };

  /* =========================================================
     PerimeterMap — периметр чизиш, НЎП белгилаш ва кучларни жойлаштириш
     ========================================================= */
  if (!global.L) return;

  const MAP_ATTR = 'Харита';
  const TILES = {
    yandex: { url: 'https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=uz_UZ&projection=web_mercator', attr: MAP_ATTR, maxZoom: 19 },
    osm: { url: 'https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=uz_UZ&projection=web_mercator', attr: MAP_ATTR, maxZoom: 19 }
  };
  TILES.schema = TILES.yandex;
  global.HXTiles = TILES;

  const icon2 = function (cls, ill, size, label) {
    const s = size || 22;
    return L.divIcon({ className: '', html: '<div class="mk2 ' + cls + '" style="width:' + s + 'px;height:' + s + 'px">' + (ILL[ill] || '') + (label ? '<b class="mk2-lbl">' + label + '</b>' : '') + '</div>', iconSize: [s, s], iconAnchor: [s / 2, s / 2] });
  };
  const div = function (cls, html, size) {
    size = size || [16, 16];
    return L.divIcon({ className: '', html: '<div class="mk ' + cls + '">' + (html || '') + '</div>', iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] });
  };
  const T = function (s) { return global.HXI18N ? HXI18N.t(s) : s; };

  function PerimeterMap(el, opt) {
    this.opt = opt = opt || {};
    this.kind = opt.kind === 'route' ? 'route' : 'area';
    this.el = el;
    this.map = L.map(el, { zoomControl: true, attributionControl: true, scrollWheelZoom: opt.scrollZoom !== false }).setView(opt.center || [41.3111, 69.2797], opt.zoom || 16);
    if (this.map.attributionControl) this.map.attributionControl.setPrefix(false);
    this.schema = L.tileLayer(TILES.yandex.url, { attribution: TILES.yandex.attr, maxZoom: 19, className: 'yx-tiles' }).addTo(this.map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(this.map);
    const self = this;
    this.latlngs = [];
    this.gates = [];
    this.manualPosts = null;
    this.manualHq = null;
    this._autoPosts = null;
    this._autoKey = '';
    this._userClearedGates = false;
    this._gatesMoved = false;
    this.shape = L.layerGroup().addTo(this.map);
    this.handles = L.layerGroup().addTo(this.map);
    this.gateLayer = L.layerGroup().addTo(this.map);
    this.groups = {};
    ['sectors', 'evac', 'traffic', 'routes', 'posts', 'cps', 'hq'].forEach(function (k) { self.groups[k] = L.layerGroup().addTo(self.map); });
    this.drawing = false; this.gateMode = false; this.objectMode = false;
    this.objectsOn = opt.objects !== false && opt.editable !== false;
    this.objectLayer = L.layerGroup().addTo(this.map);
    this.pickLayer = L.layerGroup().addTo(this.map);
    this._anim = null; this._roadToken = 0; this._roadsPending = false; this._objToken = 0;
    this.selectedObject = null;
    this._bind();
    if (this.objectsOn) this._bootObjects();
    setTimeout(function () { self.map.invalidateSize(); }, 200);
  }

  PerimeterMap.prototype._bind = function () {
    const self = this, m = this.map;
    this._onClick = function (e) {
      if (self.gateMode) { self._gateClick(e); return; }
      if (!self.drawing && self.objectsOn) {
        if (self.objectMode) {
          if (self.map.getZoom() < 16) { if (self.opt.onHint) self.opt.onHint('zoom'); return; }
          self.pickAt(e.latlng.lat, e.latlng.lng);
        }
        return;
      }
      if (!self.drawing) return;
      const p = [e.latlng.lat, e.latlng.lng], v = self.verts;
      if (self.kind !== 'route' && v.length >= 3) { const a = m.latLngToContainerPoint(v[0]), b = m.latLngToContainerPoint(e.latlng); const near = window.matchMedia('(pointer: coarse)').matches ? 36 : 16; if (a.distanceTo(b) < near) { self.finish(); return; } }
      if (v.length) { const a = m.latLngToContainerPoint(v[v.length - 1]), b = m.latLngToContainerPoint(e.latlng); if (a.distanceTo(b) < 6) return; }
      v.push(p); self._drawTemp();
    };
    this._onMove = function (e) { if (self.drawing) { self.mouse = [e.latlng.lat, e.latlng.lng]; self._drawTemp(); } };
    this._onDbl = function () { if (self.drawing && self.verts.length >= (self.kind === 'route' ? 2 : 3)) self.finish(); };
    this._onKey = function (e) {
      if (self.gateMode && e.key === 'Escape') { self.stopGateMode(); return; }
      if (!self.drawing) return;
      if (e.key === 'Enter') self.finish();
      else if (e.key === 'Escape') self.cancel();
      else if (e.key === 'Backspace') { e.preventDefault(); self.undo(); }
    };
    m.on('click', this._onClick); m.on('mousemove', this._onMove); m.on('dblclick', this._onDbl);
    document.addEventListener('keydown', this._onKey);
  };
  PerimeterMap.prototype._emit = function (type) { if (this.opt.onChange) this.opt.onChange(this.geometry(), type); };
  PerimeterMap.prototype._mode = function (mode) { if (this.opt.onMode) this.opt.onMode(mode, this.verts ? this.verts.length : 0); };

  /* ----- периметр чизиш ----- */
  PerimeterMap.prototype.startDraw = function () {
    this.stopGateMode(true);
    this.clear(true);
    this.drawing = true; this.verts = []; this.mouse = null;
    this.map.doubleClickZoom.disable();
    this.el.classList.add('is-drawing');
    this._mode('drawing');
  };
  PerimeterMap.prototype.undo = function () { if (!this.drawing || !this.verts.length) return; this.verts.pop(); this._drawTemp(); };
  PerimeterMap.prototype.cancel = function () {
    this.drawing = false; this.verts = []; this.shape.clearLayers(); this.handles.clearLayers();
    this.map.doubleClickZoom.enable(); this.el.classList.remove('is-drawing');
    this._mode('idle'); this._emit('clear');
  };
  PerimeterMap.prototype._drawTemp = function () {
    this.shape.clearLayers(); this.handles.clearLayers();
    const v = this.verts, pts = this.mouse ? v.concat([this.mouse]) : v;
    const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2fd4a7';
    if (pts.length >= 2) L.polyline(pts, { color: acc, weight: this.kind === 'route' ? 5 : 3, dashArray: '8 6', lineCap: 'round' }).addTo(this.shape);
    if (this.kind !== 'route' && pts.length >= 3) L.polygon(pts, { stroke: false, fillColor: acc, fillOpacity: 0.12 }).addTo(this.shape);
    const self = this;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    v.forEach(function (p, i) {
      const sz = coarse ? (i === 0 ? [34, 34] : [30, 30]) : (i === 0 ? [18, 18] : [14, 14]);
      L.marker(p, { icon: div('mk-vertex' + (i === 0 ? ' first' : ''), '', sz), interactive: i === 0 && self.kind !== 'route' }).addTo(self.handles)
        .on('click', function (e) { if (self.kind !== 'route' && i === 0 && self.verts.length >= 3) { L.DomEvent.stop(e); self.finish(); } });
    });
    this._mode('drawing');
    if (v.length >= 2 && this.opt.onLive) this.opt.onLive(this.kind === 'route' ? { perimeter: pathLength(pts), area: 0 } : measure(pts));
  };
  PerimeterMap.prototype.finish = function () {
    const min = this.kind === 'route' ? 2 : 3;
    if (this.verts.length < min) return;
    this.drawing = false;
    this.map.doubleClickZoom.enable();
    this.el.classList.remove('is-drawing');
    this.gates = [];
    if (this.kind === 'route') this.setRoute(this.verts.slice(), { fit: false });
    else this.setPolygon(this.verts.slice(), { fit: false });
    this._fitDrawn(false);
    this._mode('done');
  };
  PerimeterMap.prototype.setKind = function (kind) {
    const next = kind === 'route' ? 'route' : 'area';
    if (this.kind === next) return;
    this.kind = next;
    this.stopGateMode(true);
    this.clear(true);
  };
  PerimeterMap.prototype.setRoute = function (ll, o) {
    o = o || {};
    this.kind = 'route';
    this.drawing = false; this.verts = [];
    this.latlngs = (ll || []).map(function (p) { return [+p[0], +p[1]]; });
    this.gates = [];
    this.manualPosts = (o.posts && o.posts.length) ? o.posts.map(function (p) { return [+p[0], +p[1]]; }) : null;
    this.manualHq = (o.hq && o.hq.length === 2) ? [+o.hq[0], +o.hq[1]] : null;
    this._autoPosts = null; this._autoKey = '';
    this._userClearedGates = true;
    this.roads = null;
    this._renderShape();
    if (o.fit !== false && this.latlngs.length) this._fitDrawn(!!o.instant);
    if (!o.silent) this._emit('shape');
  };
  PerimeterMap.prototype.sampleRoute = function () {
    const c = this.map.getCenter();
    const lat = c.lat, lon = c.lng;
    const mlat = 1 / 111320, mlon = 1 / (111320 * Math.cos(lat * Math.PI / 180));
    this.setRoute([
      [lat, lon],
      [lat + 20 * mlat, lon + 220 * mlon],
      [lat - 30 * mlat, lon + 260 * mlon],
      [lat - 35 * mlat, lon + 560 * mlon],
      [lat + 15 * mlat, lon + 640 * mlon]
    ]);
  };
  PerimeterMap.prototype.setPolygon = function (ll, o) {
    o = o || {};
    this.kind = 'area';
    this.drawing = false; this.verts = [];
    this.latlngs = ll.map(function (p) { return [+p[0], +p[1]]; });
    if (o.gates) this.gates = o.gates.map(function (p) { return [+p[0], +p[1]]; });
    this.manualPosts = (o.posts && o.posts.length) ? o.posts.map(function (p) { return [+p[0], +p[1]]; }) : null;
    this.manualHq = (o.hq && o.hq.length === 2) ? [+o.hq[0], +o.hq[1]] : null;
    this._autoPosts = null; this._autoKey = '';
    this._userClearedGates = false;
    this.roads = null;
    if (!this.gates.length) {
      const n = typeof this.opt.entrances === 'function' ? this.opt.entrances() : 3;
      this.gates = fillGates(this.latlngs, null, n);
    }
    this._gatesMoved = !!(o.gates && o.gates.length);
    this._renderShape();
    if (o.fit !== false && this.latlngs.length) this._fitDrawn(!!o.instant);
    this._loadRoads();
    if (!o.silent) this._emit('shape');
  };
  PerimeterMap.prototype._renderShape = function () {
    if (this.kind === 'route') { this._renderRoute(); return; }
    const self = this;
    this.shape.clearLayers(); this.handles.clearLayers();
    if (this.latlngs.length < 3) { this._renderGates(); return; }
    const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2fd4a7';
    this.poly = L.polygon(this.latlngs, { color: acc, weight: 3, fillColor: acc, fillOpacity: 0.08, className: 'perimeter-line', interactive: false }).addTo(this.shape);
    for (let i = 0; i < this.latlngs.length; i++) {
      const a = this.latlngs[i], b = this.latlngs[(i + 1) % this.latlngs.length], d = haversine(a, b);
      if (d < 15) continue;
      L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], { interactive: false, icon: L.divIcon({ className: '', html: '<div class="edge-lbl">' + Math.round(d) + ' м</div>', iconSize: [60, 20], iconAnchor: [30, 10] }) }).addTo(this.shape);
    }
    this._renderGates();
    if (this.opt.editable === false) return;
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    this.latlngs.forEach(function (p, i) {
      const mk = L.marker(p, { draggable: true, autoPan: true, zIndexOffset: 1200, icon: div('mk-vertex', '', coarse ? [28, 28] : [14, 14]), title: T('Сураб ўзгартиринг · ўнг тугма — ўчириш') }).addTo(self.handles);
      let raf = 0;
      mk.on('drag', function (e) {
        self.latlngs[i] = [e.latlng.lat, e.latlng.lng];
        self.poly.setLatLngs(self.latlngs);
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (self.opt.onLive) self.opt.onLive(measure(self.latlngs)); });
      });
      mk.on('dragend', function () { self._afterShapeEdit(); });
      mk.on('contextmenu', function () { if (self.latlngs.length <= 3) return; self.latlngs.splice(i, 1); self._afterShapeEdit(); });
    });
  };
  PerimeterMap.prototype._renderRoute = function () {
    const self = this;
    this.shape.clearLayers(); this.handles.clearLayers(); this.gateLayer.clearLayers();
    if (this.latlngs.length < 2) return;
    const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2fd4a7';
    this.poly = L.polyline(this.latlngs, { color: acc, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round', className: 'perimeter-line', interactive: false }).addTo(this.shape);
    for (let i = 0; i < this.latlngs.length - 1; i++) {
      const a = this.latlngs[i], b = this.latlngs[i + 1], d = haversine(a, b);
      if (d < 12) continue;
      L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], { interactive: false, icon: L.divIcon({ className: '', html: '<div class="edge-lbl">' + Math.round(d) + ' м</div>', iconSize: [60, 20], iconAnchor: [30, 10] }) }).addTo(this.shape);
    }
    if (this.opt.editable === false) return;
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    this.latlngs.forEach(function (p, i) {
      const mk = L.marker(p, { draggable: true, autoPan: true, zIndexOffset: 1200, icon: div('mk-vertex', '', coarse ? [28, 28] : [14, 14]), title: T('Сураб ўзгартиринг · ўнг тугма — ўчириш') }).addTo(self.handles);
      let raf = 0;
      mk.on('drag', function (e) {
        self.latlngs[i] = [e.latlng.lat, e.latlng.lng];
        self.poly.setLatLngs(self.latlngs);
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (self.opt.onLive) self.opt.onLive({ perimeter: pathLength(self.latlngs), area: 0 }); });
      });
      mk.on('dragend', function () { self._afterShapeEdit(); });
      mk.on('contextmenu', function () { if (self.latlngs.length <= 2) return; self.latlngs.splice(i, 1); self._afterShapeEdit(); });
    });
  };
  PerimeterMap.prototype._afterShapeEdit = function () {
    this.manualPosts = null;
    this._autoPosts = null; this._autoKey = '';
    if (this.kind === 'route') {
      this.gates = [];
      this._renderShape();
      this._emit('edit');
      return;
    }
    this._userClearedGates = false;
    this._gatesMoved = false;
    this.gates = [];
    this.roads = null;
    this._renderShape();
    this._loadRoads();
    this._emit('edit');
  };

  /* ----- НЎП (кириш нуқталари) ----- */
  PerimeterMap.prototype._renderGates = function () {
    const self = this;
    this.gateLayer.clearLayers();
    if (this.opt.editable === false || !this.latlngs.length) return;
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    this.gates.forEach(function (g, i) {
      const mk = L.marker(g, { draggable: true, autoPan: true, icon: icon2('gate', 'gate', coarse ? 40 : 28, i + 1), zIndexOffset: 900, title: T('НЎП — сураб кўчиринг, ўнг тугма — ўчириш') }).addTo(self.gateLayer);
      mk.on('dragstart', function () { self._gatesMoved = true; });
      mk.on('dragend', function (e) {
        let p = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        const j = self._nearJunction(p, 14);
        if (j) p = [j[0], j[1]];
        self.gates[i] = p;
        self._autoPosts = null; self._autoKey = '';
        self._renderGates(); self._emit('gates');
      });
      const del = function (e) { if (e && e.originalEvent) L.DomEvent.stop(e); self.gates.splice(i, 1); self._renderGates(); self._emit('gates'); };
      mk.on('contextmenu', del);
      mk.on('click', function (e) { if (self.gateMode) del(e); });
    });
  };
  PerimeterMap.prototype.startGateMode = function () {
    if (this.kind === 'route' || this.latlngs.length < 3) return false;
    if (this.drawing) this.cancel();
    this.gateMode = true; this.el.classList.add('is-gating');
    this._mode('gates'); return true;
  };
  PerimeterMap.prototype.stopGateMode = function (silent) {
    if (!this.gateMode) return;
    this.gateMode = false; this.el.classList.remove('is-gating');
    if (!silent) this._mode('done');
  };
  PerimeterMap.prototype._gateClick = function (e) {
    if (this.latlngs.length < 3) return;
    const raw = [e.latlng.lat, e.latlng.lng];
    const j = this._nearJunction(raw, 48);
    const s = j ? { latlng: j, dist: 0 } : snapToPerimeter(this.latlngs, raw);
    const px = this.map.latLngToContainerPoint(s.latlng).distanceTo(e.containerPoint);
    if (!j && px > 70) { if (this.opt.onHint) this.opt.onHint('far'); return; }
    this.gates.push(s.latlng); this._renderGates(); this._emit('gates');
  };
  PerimeterMap.prototype._nearJunction = function (p, maxM) {
    if (!this.roads) return null;
    const f = frame(this.latlngs), q = f.toXY(p);
    let best = null, bd = maxM;
    junctionNodes(this.roads).forEach(function (j) {
      const d = Math.hypot(f.toXY(j.p)[0] - q[0], f.toXY(j.p)[1] - q[1]);
      if (d < bd) { bd = d; best = j.p; }
    });
    return best;
  };
  PerimeterMap.prototype.setGates = function (g, silent, snap) {
    const self = this;
    this.gates = (g || []).map(function (p) {
      const ll = [+p[0], +p[1]];
      return snap && self.latlngs.length >= 3 ? snapToPerimeter(self.latlngs, ll).latlng : ll;
    });
    this.manualPosts = null;
    this._autoPosts = null; this._autoKey = '';
    this._userClearedGates = !this.gates.length;
    this._gatesMoved = false;
    this._renderGates(); if (!silent) this._emit('gates');
  };
  // НЎПни автоматик жойлаштириш: аввал OpenStreetMap йўллари, бўлмаса мантиқий тақсимот
  PerimeterMap.prototype.autoGates = function (n) {
    const self = this, ll = this.latlngs;
    if (ll.length < 3) return Promise.resolve('none');
    return fetchRoads(ll).then(function (roads) {
      self.roads = roads;
      self.setGates(fillGates(ll, roads, n), false, false);
      return (roads && roads.length) ? 'roads' : 'heuristic';
    }).catch(function () { self.setGates(fillGates(ll, null, n), false, false); return 'heuristic'; });
  };
  PerimeterMap.prototype._loadRoads = function () {
    const self = this, ll = this.latlngs.slice(), token = ++this._roadToken;
    if (ll.length < 3) return;
    this._roadsPending = true;
    const n = typeof this.opt.entrances === 'function' ? this.opt.entrances() : (this.gates.length || 3);
    fetchRoads(ll).then(function (roads) {
      if (token !== self._roadToken) return;
      self.roads = roads;
      self._roadsPending = false;
      if (!self._userClearedGates && !self._gatesMoved) {
        self.gates = fillGates(ll, roads, n);
        self._autoPosts = null; self._autoKey = '';
        self._renderGates();
      }
      self._emit('roads');
    }).catch(function () {
      if (token !== self._roadToken) return;
      self._roadsPending = false;
      if (!self.gates.length && !self._userClearedGates && self.latlngs.length >= 3) {
        self.gates = fillGates(self.latlngs, null, n);
        self._renderGates();
      }
      self._emit('roads');
    });
  };

  PerimeterMap.prototype.clear = function (silent) {
    this.latlngs = []; this.gates = []; this.manualPosts = null; this.manualHq = null; this._autoPosts = null; this._autoKey = ''; this._userClearedGates = false; this._gatesMoved = false; this.roads = null; this.selectedObject = null; this._roadToken++;
    this.shape.clearLayers(); this.handles.clearLayers(); this.gateLayer.clearLayers(); this.pickLayer.clearLayers(); this.clearDeploy();
    if (!silent) this._emit('clear');
  };
  PerimeterMap.prototype._bootObjects = function () {
    const self = this;
    let tm = 0;
    this.map.on('moveend', function () { clearTimeout(tm); tm = setTimeout(function () { self._loadViewportObjects(); }, 320); });
    setTimeout(function () { self._loadViewportObjects(); }, 500);
  };
  PerimeterMap.prototype._loadViewportObjects = function () {
    if (!this.objectsOn || this.map.getZoom() < 16) { this.objectLayer.clearLayers(); if (this.opt.onObjects) this.opt.onObjects(0, false); return; }
    const b = this.map.getBounds(), span = Math.max(b.getNorth() - b.getSouth(), b.getEast() - b.getWest());
    if (span > 0.03) { if (this.opt.onObjects) this.opt.onObjects(0, false); return; }
    const self = this, token = ++this._objToken;
    if (this.opt.onObjects) this.opt.onObjects(null, true);
    fetchObjectsBBox(b.getSouth(), b.getWest(), b.getNorth(), b.getEast()).then(function (list) {
      if (token !== self._objToken) return;
      self._drawObjects(list);
      if (self.opt.onObjects) self.opt.onObjects(list.length, false);
    }).catch(function () { if (token === self._objToken && self.opt.onObjects) self.opt.onObjects(0, false); });
  };
  PerimeterMap.prototype._drawObjects = function (list) {
    const self = this;
    this.objectLayer.clearLayers();
    list.forEach(function (feat) {
      const hot = self.selectedObject && self.selectedObject.id === feat.id;
      const layer = L.polygon(feat.ll, {
        color: hot ? '#d0122d' : '#1a56d6', weight: hot ? 3 : 1.6, opacity: 0.85,
        fillColor: hot ? '#d0122d' : '#1a56d6', fillOpacity: hot ? 0.22 : 0.07,
        className: 'yx-obj', interactive: true
      }).addTo(self.objectLayer);
      layer.bindTooltip('<b>' + escHtml(feat.name) + '</b><br>' + T('Босинг — периметр ва кўрсаткичлар ҳисобланади'), { sticky: true, opacity: 0.95 });
      layer.on('mouseover', function () { if (!hot) layer.setStyle({ weight: 3, fillOpacity: 0.28 }); });
      layer.on('mouseout', function () { if (!hot) layer.setStyle({ weight: 1.6, fillOpacity: 0.07 }); });
      layer.on('click', function (e) {
        if (self.drawing || self.gateMode) return;
        L.DomEvent.stop(e);
        self.selectObject(feat);
      });
    });
  };
  PerimeterMap.prototype.pickAt = function (lat, lon) {
    const self = this;
    if (this.opt.onObjects) this.opt.onObjects(null, true);
    return fetchObjectsAt(lat, lon).then(function (list) {
      const feat = pickObject(list, lat, lon);
      if (!feat) { if (self.opt.onHint) self.opt.onHint('empty'); if (self.opt.onObjects) self.opt.onObjects(0, false); return null; }
      self.selectObject(feat);
      return feat;
    }).catch(function () { if (self.opt.onHint) self.opt.onHint('net'); return null; });
  };
  PerimeterMap.prototype.selectObject = function (feat) {
    if (this.kind === 'route') return;
    this.stopGateMode(true);
    this.drawing = false;
    this.selectedObject = feat;
    this.gates = [];
    this.pickLayer.clearLayers();
    L.polygon(feat.ll, { color: '#d0122d', weight: 4, opacity: 1, fillColor: '#e23b3b', fillOpacity: 0.2, className: 'yx-selected', interactive: false }).addTo(this.pickLayer);
    L.marker(centroid(feat.ll), { interactive: false, zIndexOffset: 700, icon: L.divIcon({ className: '', html: '<div class="obj-pin ' + feat.kind + '"><b>' + escHtml(feat.name) + '</b></div>', iconSize: [180, 36], iconAnchor: [90, 36] }) }).addTo(this.pickLayer);
    this.setPolygon(feat.ll, { fit: true });
    if (this.opt.onObject) this.opt.onObject(feat);
  };
  PerimeterMap.prototype.setObjectMode = function (on) {
    this.objectMode = !!on;
    this.el.classList.toggle('is-picking', this.objectMode);
    if (this.opt.onMode) this.opt.onMode(this.objectMode ? 'pick' : (this.latlngs.length >= 3 ? 'done' : 'idle'), 0);
  };
  PerimeterMap.prototype.geometry = function () {
    const route = this.kind === 'route';
    const g = route ? { perimeter: pathLength(this.latlngs), area: 0 } : measure(this.latlngs);
    const center = route ? midpoint(this.latlngs) : (this.latlngs.length >= 3 ? centroid(this.latlngs) : null);
    return { latlngs: this.latlngs.slice(), gates: route ? [] : this.gates.slice(), posts: (this.manualPosts || []).map(function (p) { return [p[0], p[1]]; }), hq: this.manualHq ? [this.manualHq[0], this.manualHq[1]] : null, perimeter: g.perimeter, area: g.area, center: center, kind: this.kind };
  };
  PerimeterMap.prototype.sample = function (w, h, ang) {
    const c = this.map.getCenter();
    this.gates = [];
    this.setPolygon(global.HX.rectLatLngs([c.lat, c.lng], w || 220, h || 150, ang || 12));
  };
  PerimeterMap.prototype.clearDeploy = function () {
    if (this._anim) cancelAnimationFrame(this._anim); this._anim = null;
    for (const k in this.groups) this.groups[k].clearLayers();
  };
  PerimeterMap.prototype.setLayer = function (name, on) {
    if (name === 'cps' && this.opt.editable !== false) {
      if (on) this.gateLayer.addTo(this.map); else this.map.removeLayer(this.gateLayer);
      return;
    }
    const g = this.groups[name]; if (!g) return;
    if (on) g.addTo(this.map); else this.map.removeLayer(g);
  };

  /* Патруль постлари: суриб кўчирилади. statics берилса — штабдан учиб боради. */
  PerimeterMap.prototype._placePostMarkers = function (postPts, res, postSp, postSz, interactive, o, hq, reduce, statics) {
    const self = this;
    const perPost = res.posts / Math.max(1, postPts.length || 1);
    const atFinal = !statics || o.animate === false || reduce;
    postPts.forEach(function (p, i) {
      const tip = '<b>' + T((self.kind === 'route' ? 'Йўналиш патрули №' : 'Периметр пости №') + (i + 1)) + '</b><br>' + T((perPost > 1.05 ? '≈' + global.HX.fmtDec(perPost, 1) : '1') + ' ходим') + ' · ' + T('оралиқ ≈ ' + Math.round(postSp) + ' м') + (interactive ? '<br>' + T('Суриб ўз жойингизга қўйинг') : '');
      const mk = L.marker(atFinal ? p : hq, {
        draggable: !!interactive, autoPan: !!interactive, zIndexOffset: 640,
        icon: icon2('post', 'guard', postSz),
        title: T('Патруль пости — суриб кўчиринг')
      }).bindTooltip(tip, { direction: 'top', offset: [0, -12] }).addTo(self.groups.posts);
      if (statics) statics.push({ mk: mk, to: p });
      if (!interactive) return;
      mk.on('dragstart', function () {
        if (self._anim) cancelAnimationFrame(self._anim);
        self._anim = null;
        if (statics) statics.forEach(function (it) { it.done = true; if (it.mk !== mk) it.mk.setLatLng(it.to); });
      });
      mk.on('dragend', function (e) {
        let pos = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        const j = self._nearJunction(pos, 14);
        if (j) pos = [j[0], j[1]];
        if (!self.manualPosts || self.manualPosts.length !== postPts.length) self.manualPosts = postPts.map(function (q) { return [q[0], q[1]]; });
        self.manualPosts[i] = pos;
        postPts[i] = pos;
        mk.setLatLng(pos);
        if (statics) statics.forEach(function (it) { if (it.mk === mk) it.to = pos; });
        self._emit('posts');
      });
    });
  };

  PerimeterMap.prototype._hqAt = function (fallback) {
    if (this.manualHq && this.manualHq.length === 2) return [+this.manualHq[0], +this.manualHq[1]];
    return fallback;
  };
  PerimeterMap.prototype._placeHq = function (hq, res, interactive, route) {
    const self = this;
    const tip = '<b>' + T('Штаб / йиғилиш пункти') + '</b><br>' + T('Масъул раҳбар ва командирлар: ' + (res.commanders || 0) + ' нафар') + '<br>' + T('Тезкор захира: ' + (res.reserve || 0) + ' нафар') + (res.k9 ? '<br>' + T('Кинологлар: ' + res.k9) : '') + (route ? '<br>' + T('Ички патрул йўқ — наряд йўл бўйлаб юради') : '') + (interactive ? '<br>' + T('Суриб қулай жойга қўйинг') : '');
    const mk = L.marker(hq, { draggable: !!interactive, autoPan: !!interactive, icon: icon2('hq', 'hq', 34), zIndexOffset: 1000, title: T('Штаб — суриб жойини ўзгартиринг') })
      .bindTooltip(tip, { direction: 'top', offset: [0, -16] }).addTo(this.groups.hq);
    if (!interactive) return;
    mk.on('dragend', function (e) {
      self.manualHq = [e.target.getLatLng().lat, e.target.getLatLng().lng];
      self._emit('hq');
    });
  };

  /* ----- Кучларни жойлаштириш ----- */
  PerimeterMap.prototype._deployRoute = function (res, o) {
    o = o || {};
    this.clearDeploy();
    const ll = this.latlngs;
    if (ll.length < 2 || !res || !res.total) return null;
    const self = this, G = this.groups;
    const reduce = global.HX && global.HX.reducedMotion();
    const interactive = this.opt.editable !== false;
    const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    const routeLen = pathLength(ll);
    const nPosts = Math.min(Math.max(0, res.patrols || res.posts || 0), 80);
    const per = (res.norms && res.norms.patrolSize) || 2;
    const hq = this._hqAt(ll[0]);
    const saved = (o.posts && o.posts.length) ? o.posts : this.manualPosts;
    let postPts = (saved && saved.length === nPosts) ? saved.map(function (p) { return [+p[0], +p[1]]; }) : pointsAlongOpen(ll, nPosts);
    const s3 = getComputedStyle(document.documentElement).getPropertyValue('--s3').trim() || '#199e70';
    Lpolyline(G.routes, ll, s3);
    const mpp = 40075016.686 * Math.cos(rad(ll[0][0])) / Math.pow(2, this.map.getZoom() + 8);
    const postSp = nPosts ? routeLen / nPosts : 0;
    const postPx = postSp / mpp;
    const postSz = coarse ? 40 : (postPx < 16 ? 18 : postPx < 28 ? 22 : 26);
    const shim = { posts: Math.max(1, postPts.length) * per };
    if (o.postsOnly) {
      this._placePostMarkers(postPts, shim, postSp, postSz, interactive, o, hq, reduce, null);
      return { posts: postPts.length, cps: 0, patrols: nPosts, sectors: 0, gateSource: 'route' };
    }
    this._placeHq(hq, res, interactive, true);
    const statics = [];
    this._placePostMarkers(postPts, shim, postSp, postSz, interactive, o, hq, reduce, statics);
    const units = nPosts || 1;
    const shown = Math.max(1, Math.min(units, 8));
    const movers = [];
    for (let j = 0; j < shown; j++) {
      const phase = j / shown;
      const start = pointOnPath(ll, phase * routeLen);
      const mk = L.marker(o.animate === false || reduce ? start : hq, { icon: icon2('patrol', 'patrol', 24), zIndexOffset: 800 })
        .bindTooltip('<b>' + T('Патруль наряди') + '</b><br>' + T(units + ' наряд') + ' · ' + T('йўл бўйлаб ' + Math.round(routeLen) + ' м'), { direction: 'top', offset: [0, -10] }).addTo(G.routes);
      movers.push({ mk: mk, phase: phase, start: start, speed: Math.max(1.8, Math.min(7, routeLen / 70)) });
    }
    const t0 = performance.now(), fly = (o.animate === false || reduce) ? 0 : 900, spread = (o.animate === false || reduce) ? 0 : Math.min(1800, (statics.length + movers.length) * 8);
    const ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    const total = statics.length + movers.length;
    const step = function (t) {
      const el = t - t0;
      statics.forEach(function (it, i) {
        if (it.done) return;
        const delay = total > 1 ? (i / (total - 1)) * spread : 0;
        const p = fly ? Math.min(1, Math.max(0, (el - delay) / fly)) : 1;
        const e = ease(p);
        it.mk.setLatLng([hq[0] + (it.to[0] - hq[0]) * e, hq[1] + (it.to[1] - hq[1]) * e]);
        if (p >= 1) it.done = true;
      });
      movers.forEach(function (m, k) {
        const delay = total > 1 ? ((statics.length + k) / (total - 1)) * spread : 0;
        const local = el - delay;
        if (fly && local < fly) { const e = ease(Math.max(0, local / fly)); m.mk.setLatLng([hq[0] + (m.start[0] - hq[0]) * e, hq[1] + (m.start[1] - hq[1]) * e]); return; }
        if (reduce) return;
        const travelled = m.phase * routeLen + ((local - fly) / 1000) * m.speed;
        const cycle = Math.max(routeLen, 1) * 2;
        let x = ((travelled % cycle) + cycle) % cycle;
        const dist = x <= routeLen ? x : cycle - x;
        m.mk.setLatLng(pointOnPath(ll, dist));
      });
      if (movers.length || statics.some(function (s) { return !s.done; })) self._anim = requestAnimationFrame(step);
      else if (o.onDone) o.onDone();
    };
    this._anim = requestAnimationFrame(step);
    return { posts: postPts.length, cps: 0, patrols: units, sectors: 0, gateSource: 'route' };
  };
  function Lpolyline(group, ll, color) {
    L.polyline(ll, { color: color, weight: 5, opacity: 0.92, lineCap: 'round', lineJoin: 'round', className: 'route-line', interactive: false }).addTo(group);
  }
  function pointOnPath(ll, dist) {
    const len = pathLength(ll);
    const target = Math.max(0, Math.min(len, dist));
    let acc = 0;
    for (let i = 0; i < ll.length - 1; i++) {
      const d = haversine(ll[i], ll[i + 1]);
      if (acc + d >= target || i === ll.length - 2) {
        const t = d ? Math.max(0, Math.min(1, (target - acc) / d)) : 0;
        return [ll[i][0] + (ll[i + 1][0] - ll[i][0]) * t, ll[i][1] + (ll[i + 1][1] - ll[i][1]) * t];
      }
      acc += d;
    }
    return ll[ll.length - 1];
  }
  PerimeterMap.prototype.deploy = function (res, o) {
    o = o || {};
    if (o.hq && o.hq.length === 2) this.manualHq = [+o.hq[0], +o.hq[1]];
    if (this.kind === 'route') return this._deployRoute(res, o);
    this.clearDeploy();
    const ll = this.latlngs;
    if (ll.length < 3 || !res || !res.total) return null;
    const self = this, G = this.groups, F = global.HX.fmt;
    const f = frame(ll), xy = ll.map(f.toXY), cXY = centroidXY(xy), geo = measure(ll);
    const mpp = 40075016.686 * Math.cos(rad(ll[0][0])) / Math.pow(2, this.map.getZoom() + 8);
    const reduce = global.HX && global.HX.reducedMotion();
    const interactive = this.opt.editable !== false;
    const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

    // 1. НЎП — харитадагилари устун, бўлмаса йўл бўйича
    let gates = this.gates.length ? this.gates.map(function (p) { return [+p[0], +p[1]]; }) : ((o.gates && o.gates.length) ? o.gates.map(function (p) { return [+p[0], +p[1]]; }) : null);
    let gateSrc = this.gates.length ? 'manual' : (gates ? 'saved' : 'auto');
    if ((!gates || !gates.length) && !(interactive && this._userClearedGates)) {
      if (this._roadsPending && interactive) return null;
      gates = fillGates(ll, this._roadsPending ? null : this.roads, Math.max(1, res.entrances || 1));
      gateSrc = this.roads && !this._roadsPending ? 'roads' : 'heuristic';
      if (interactive && !this._roadsPending) {
        this.gates = gates.map(function (p) { return [p[0], p[1]]; });
        this._renderGates();
        setTimeout(function () { self._emit('gates'); }, 40);
      }
    }
    if (!gates) gates = [];
    if (!interactive && gates.length) gates = gates.slice(0, Math.max(1, res.entrances || gates.length));
    const gXY = gates.map(f.toXY);
    const outward = function (p) {
      const r = nearestOnPolyXY(p, xy); let nx = r.nx, ny = r.ny;
      if ((r.p[0] + nx - cXY[0]) ** 2 + (r.p[1] + ny - cXY[1]) ** 2 < (r.p[0] - cXY[0]) ** 2 + (r.p[1] - cXY[1]) ** 2) { nx = -nx; ny = -ny; }
      return [nx, ny];
    };
    // штаб — асосий НЎП олдида, 45 м ташқарида
    const n0 = gXY.length ? outward(gXY[0]) : [0, 1];
    const hq = this._hqAt(gXY.length ? f.toLL([gXY[0][0] + n0[0] * 45, gXY[0][1] + n0[1] * 45]) : centroid(ll));

    // 2. патруль постлари — кўриш масофаси бўйича, чорраҳага яқинлаштирилган
    const nPosts = Math.min(res.posts || 0, 80);
    const postSp = nPosts ? geo.perimeter / nPosts : 0;
    const postPx = postSp / mpp;
    const postSz = coarse ? 40 : (postPx < 16 ? 18 : postPx < 28 ? 22 : 26);
    const savedPosts = (o.posts && o.posts.length) ? o.posts : this.manualPosts;
    let postPts;
    if (savedPosts && savedPosts.length) {
      postPts = resolvePosts(ll, nPosts, this.roads, gates, savedPosts);
      if (savedPosts.length !== postPts.length) this.manualPosts = postPts.map(function (p) { return [p[0], p[1]]; });
    } else {
      const key = ll.length + ':' + nPosts + ':' + gates.map(function (p) { return (+p[0]).toFixed(5) + ',' + (+p[1]).toFixed(5); }).join('|');
      if (this._autoPosts && this._autoKey === key) postPts = this._autoPosts.map(function (p) { return [p[0], p[1]]; });
      else {
        postPts = postPoints(ll, nPosts, this.roads, gates);
        this._autoPosts = postPts.map(function (p) { return [p[0], p[1]]; });
        this._autoKey = key;
        postPts = this._autoPosts.map(function (p) { return [p[0], p[1]]; });
      }
    }
    if (o.postsOnly) {
      this._placePostMarkers(postPts, res, postSp, postSz, interactive, o, hq, reduce, null);
      return { posts: postPts.length, cps: gates.length, patrols: res.patrols || 0, sectors: 0, gateSource: gateSrc };
    }

    // 3. патруль секторлари ва йўналишлари
    const units = res.patrols || 0;
    const nSec = units ? Math.max(1, Math.min(12, units, Math.max(Math.ceil(units / 8), Math.round(geo.area / 25000)))) : 0;
    const secs = nSec ? sectors(ll, nSec, units) : [];
    const totA = secs.reduce(function (s, c) { return s + c.area; }, 0) || 1;
    secs.forEach(function (s) { s.q = units * s.area / totA; s.units = Math.max(1, Math.floor(s.q)); });
    let left = units - secs.reduce(function (s, c) { return s + c.units; }, 0);
    secs.slice().sort(function (a, b) { return (b.q - b.units) - (a.q - a.units); }).forEach(function (s) { if (left > 0) { s.units++; left--; } });
    while (left < 0) { const big = secs.slice().sort(function (a, b) { return b.units - a.units; })[0]; if (!big || big.units <= 1) break; big.units--; left++; }

    // 4. йўл ҳаракати постлари
    const trs = trafficPoints(ll, gates, Math.min(res.trafficPosts || 0, 60), this.roads);

    // ----- чизиш -----
    const s3 = getComputedStyle(document.documentElement).getPropertyValue('--s3').trim() || '#199e70';
    const net = this.roads ? roadLoops(this.roads, ll) : { lines: [], loops: [] };
    net.lines.forEach(function (line) {
      L.polyline(line, { color: s3, weight: 5, opacity: 0.92, lineCap: 'round', lineJoin: 'round', className: 'route-line', interactive: false }).addTo(G.routes);
    });
    let loops = net.loops.slice();
    if (!loops.length && !this._roadsPending) {
      const xy2 = shrinkXY(xy, 0.84);
      const ll2 = xy2.map(f.toLL);
      loops = [{ xy: xy2, ll: ll2, f: f, len: loopLen(xy2) }];
      L.polyline(ll2.concat([ll2[0]]), { color: s3, weight: 4, opacity: 0.9, lineCap: 'round', className: 'route-line', interactive: false }).addTo(G.routes);
    }
    const main = loops[0] || null;
    secs.forEach(function (s, i) {
      L.polygon(s.ring, { color: s3, weight: 1, opacity: 0.35, dashArray: '2 6', fillColor: s3, fillOpacity: 0.04, interactive: false }).addTo(G.sectors);
      L.marker(s.center, { interactive: false, icon: L.divIcon({ className: '', html: '<div class="sec-lbl">С-' + (i + 1) + ' · ' + s.units + ' ' + T('наряд') + '</div>', iconSize: [80, 18], iconAnchor: [40, -14] }) }).addTo(G.sectors);
    });
    this._placeHq(hq, res, interactive, false);
    if (res.k9 && gXY.length) L.marker(f.toLL([gXY[0][0] + n0[0] * 45 + 22, gXY[0][1] + n0[1] * 45]), { icon: icon2('k9', 'dog', 24) }).bindTooltip('<b>' + T('Кинолог мутахассислар') + '</b> · ' + res.k9, { direction: 'top' }).addTo(G.hq);

    const statics = [], movers = [];
    const addStatic = function (group, pt, ic, tip) { const mk = L.marker(o.animate === false || reduce ? pt : hq, { icon: ic }).bindTooltip(tip, { direction: 'top', offset: [0, -10] }).addTo(group); statics.push({ mk: mk, to: pt }); };
    self._placePostMarkers(postPts, res, postSp, postSz, interactive, o, hq, reduce, statics);
    const cpPart = (res.parts || []).find(function (x) { return x.id === 'checkpoint'; });
    const nG = Math.max(1, gates.length);
    const perCp = cpPart ? Math.round(cpPart.value / nG) : 0, frPer = Math.max(1, Math.round((res.frames || nG) / nG));
    if (!interactive && gates.length) gates.forEach(function (g, i) { addStatic(G.cps, g, icon2('gate', 'gate', coarse ? 40 : 28, i + 1), '<b>' + T('НЎП-' + (i + 1) + ' (кириш нуқтаси)') + '</b><br>' + T('≈ ' + perCp + ' ходим') + ' · ' + T(frPer + ' металлодетектор рамкаси')); });
    trs.forEach(function (p, i) { addStatic(G.traffic, p, icon2('traffic', 'traffic', 24), '<b>' + T('Йўл ҳаракати пости №' + (i + 1)) + '</b><br>' + T('Йўл кесишмаси')); });

    // ҳаракатланувчи нарядлар — ҳақиқий кўчалар бўйлаб
    const patSz = 24;
    if (main && main.len > 8) {
      const shown = Math.max(1, Math.min(units || 1, 8));
      const ride = { f: main.f, routeXY: main.xy };
      for (let j = 0; j < shown; j++) {
        const phase = j / shown;
        const start = main.f.toLL(pointAtXY(main.xy, phase * main.len));
        const mk = L.marker(o.animate === false || reduce ? start : hq, { icon: icon2('patrol', 'patrol', patSz), zIndexOffset: 800 })
          .bindTooltip('<b>' + T('Патруль наряди') + '</b><br>' + T(units + ' наряд') + ' · ' + T('йўл бўйлаб ≈ ' + Math.round(main.len) + ' м'), { direction: 'top', offset: [0, -10] }).addTo(G.routes);
        movers.push({ mk: mk, s: ride, L: main.len, phase: phase, start: start, speed: Math.max(1.8, Math.min(7, main.len / 70)) });
      }
    }

    // ----- анимация -----
    const t0 = performance.now(), fly = (o.animate === false || reduce) ? 0 : 900, spread = (o.animate === false || reduce) ? 0 : Math.min(1800, (statics.length + movers.length) * 8);
    const ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    const total = statics.length + movers.length;
    const step = function (t) {
      const el = t - t0;
      statics.forEach(function (it, i) {
        if (it.done) return;
        const delay = total > 1 ? (i / (total - 1)) * spread : 0;
        const p = fly ? Math.min(1, Math.max(0, (el - delay) / fly)) : 1, e = ease(p);
        it.mk.setLatLng([hq[0] + (it.to[0] - hq[0]) * e, hq[1] + (it.to[1] - hq[1]) * e]);
        if (p >= 1) it.done = true;
      });
      movers.forEach(function (m, k) {
        const delay = total > 1 ? ((statics.length + k) / (total - 1)) * spread : 0;
        const local = el - delay;
        if (fly && local < fly) { const e = ease(Math.max(0, local / fly)); m.mk.setLatLng([hq[0] + (m.start[0] - hq[0]) * e, hq[1] + (m.start[1] - hq[1]) * e]); return; }
        if (reduce) return;
        const d = m.phase * m.L + ((local - fly) / 1000) * m.speed;
        m.mk.setLatLng(m.s.f.toLL(pointAtXY(m.s.routeXY, d)));
      });
      if (movers.length || statics.some(function (s) { return !s.done; })) self._anim = requestAnimationFrame(step);
      else if (o.onDone) o.onDone();
    };
    this._anim = requestAnimationFrame(step);
    return { posts: postPts.length, cps: gates.length, patrols: units, sectors: secs.length, gateSource: gateSrc };
  };

  PerimeterMap.prototype._fitDrawn = function (instant) {
    if (!this.map || !this.latlngs || this.latlngs.length < 2) return;
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    this.map.fitBounds(L.latLngBounds(this.latlngs), narrow
      ? { paddingTopLeft: [18, 96], paddingBottomRight: [18, 88], maxZoom: 18, animate: !instant }
      : { padding: [48, 48], maxZoom: 18, animate: !instant });
  };
  PerimeterMap.prototype.invalidate = function () { const m = this.map; setTimeout(function () { m.invalidateSize(); }, 60); };
  PerimeterMap.prototype.destroy = function () {
    if (this._anim) cancelAnimationFrame(this._anim);
    document.removeEventListener('keydown', this._onKey);
    try { this.map.remove(); } catch (e) {}
  };

  global.PerimeterMap = PerimeterMap;
})(window);
