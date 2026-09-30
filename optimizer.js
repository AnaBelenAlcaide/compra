// Lógica pura: sin DOM ni red.
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
// La oferta solo cuenta si está vigente en la fecha indicada.
function effective(row, day = today()) {
  const o = row.offer;
  if (o && o.from <= day && day <= o.until) return { price: o.price, regular: row.price, offer: o };
  return { price: row.price, regular: row.price, offer: null };
}
function buildIndex(db, day = today()) { // idx[productId][storeId]
  const idx = {};
  for (const r of db.prices) (idx[r.productId] ??= {})[r.storeId] = effective(r, day);
  return idx;
}
const pairKey = (a, b) => [a, b].sort().join('|');
function legKm(cfg, a, b) {
  if (a === 'home') return cfg.homeKm[b] ?? 5;
  if (b === 'home') return cfg.homeKm[a] ?? 5;
  return cfg.betweenKm[pairKey(a, b)] ?? 5;
}
function heap(k, a, fn) { // permutaciones (algoritmo de Heap)
  if (k <= 1) return fn(a);
  heap(k - 1, a, fn);
  for (let i = 0; i < k - 1; i++) { const j = k % 2 ? 0 : i; [a[j], a[k - 1]] = [a[k - 1], a[j]]; heap(k - 1, a, fn); }
}
// Ruta casa → tiendas → casa más corta.
function bestRoute(cfg, stores) {
  let best = null;
  heap(stores.length, stores.slice(), perm => {
    let km = 0, prev = 'home';
    for (const s of perm) { km += legKm(cfg, prev, s); prev = s; }
    km += legKm(cfg, prev, 'home');
    if (!best || km < best.km) best = { km, order: perm.slice() };
  });
  return best;
}
// Un plan por cada combinación de tiendas realmente usadas: compra + viaje.
function allPlans(db, idx, list, cfg) {
  const ids = Object.keys(list).filter(id => idx[id]); if (!ids.length) return [];
  const sids = db.stores.map(s => s.id), byUsed = new Map();
  for (let m = 1; m < 1 << sids.length; m++) {
    const sub = sids.filter((_, i) => (m >> i) & 1); let basket = 0, ok = true; const lines = [];
    for (const id of ids) {
      let pick = null;
      for (const s of sub) { const e = idx[id][s]; if (e && (!pick || e.price < pick.e.price)) pick = { s, e }; }
      if (!pick) { ok = false; break; }
      lines.push({ id, storeId: pick.s, e: pick.e, qty: list[id] }); basket += pick.e.price * list[id];
    }
    if (!ok) continue;
    const used = [...new Set(lines.map(l => l.storeId))].sort(), key = used.join('|'), old = byUsed.get(key);
    if (!old || basket < old.basket - 1e-9) byUsed.set(key, { used, basket, lines });
  }
  return [...byUsed.values()].map(p => {
    const r = bestRoute(cfg, p.used), sp = cfg.speed || 30;
    const travel = r.km * cfg.kmCost + (r.km / sp) * cfg.hourValue;
    return { ...p, km: r.km, order: r.order, minutes: Math.round(r.km / sp * 60), travel, total: p.basket + travel };
  });
}
