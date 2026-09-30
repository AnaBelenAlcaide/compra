const TRIP_KEY = 'ahorracesta:viaje:v1';
let cfg = loadCfg(), selK = null;
function loadCfg() {
  let s = {}; try { s = JSON.parse(localStorage.getItem(TRIP_KEY)) || {}; } catch {}
  return { kmCost: s.kmCost ?? DEFAULT_TRIP.kmCost, hourValue: s.hourValue ?? DEFAULT_TRIP.hourValue, speed: s.speed ?? DEFAULT_TRIP.speed,
    homeKm: { ...DEFAULT_TRIP.homeKm, ...s.homeKm }, betweenKm: { ...DEFAULT_TRIP.betweenKm, ...s.betweenKm } };
}
const saveCfg = () => { try { localStorage.setItem(TRIP_KEY, JSON.stringify(cfg)); } catch {} };
const num = (a, v) => `<input type="number" min="0" step="0.1" ${a} value="${v}">`;
function renderTrip() {
  const S = db.stores, pairs = [];
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) pairs.push([S[i], S[j]]);
  $('#trip').innerHTML = `<div class="dgrid"><label>Coste por km (€)${num('data-cfg="kmCost" step="0.01"', cfg.kmCost)}</label>
  <label>Valor de tu tiempo (€/h)${num('data-cfg="hourValue"', cfg.hourValue)}</label><label>Velocidad media (km/h)${num('data-cfg="speed" min="1"', cfg.speed)}</label></div>
  <p class="note">A pie o en bici pon 0 € por km. Las distancias son de ida, en km.</p>
  <h4>Desde tu casa</h4><div class="dgrid">${S.map(s => `<label>${esc(s.name)}${num(`data-home="${s.id}"`, cfg.homeKm[s.id] ?? 5)}</label>`).join('')}</div>
  <h4>Entre supermercados</h4><div class="dgrid">${pairs.map(([a, b]) => `<label>${esc(a.name)} ↔ ${esc(b.name)}${num(`data-pair="${pairKey(a.id, b.id)}"`, cfg.betweenKm[pairKey(a.id, b.id)] ?? 5)}</label>`).join('')}</div>`;
}
document.addEventListener('input', e => {
  const t = e.target, v = parseFloat(t.value); if (isNaN(v) || v < 0) return;
  if (t.dataset.cfg) cfg[t.dataset.cfg] = v; else if (t.dataset.home) cfg.homeKm[t.dataset.home] = v; else if (t.dataset.pair) cfg.betweenKm[t.dataset.pair] = v; else return;
  saveCfg(); renderResult();
});
function renderList() {
  const ids = Object.keys(list);
  $('#list').innerHTML = ids.length ? ids.map(id => { const p = prod[id];
    return `<div class="row"><div class="n"><b>${esc(p.name)}</b><br><span class="meta">${esc(p.brand)} · ${esc(p.format)}</span></div>${qc(id)}<button class="ghost sq" data-del="${id}" aria-label="Eliminar ${esc(p.name)}">🗑️</button></div>`; }).join('') +
    '<p><button class="ghost" data-clear>Vaciar lista</button></p>'
    : '<p class="empty">Tu lista está vacía. <a href="index.html">Busca productos</a> o mira las <a href="ofertas.html">ofertas</a>.</p>';
}
const cheapest = (a, k) => a.reduce((m, p) => p[k] < m[k] ? p : m);
function renderResult() {
  if (!Object.keys(list).length) { $('#result').innerHTML = '<p class="empty">Añade productos para comparar.</p>'; return; }
  const plans = allPlans(db, idx, list, cfg);
  if (!plans.length) { $('#result').innerHTML = '<p class="empty">Ningún producto de tu lista tiene precio.</p>'; return; }
  const byK = []; for (let k = 1; k <= db.stores.length; k++) { const c = plans.filter(p => p.used.length === k); if (c.length) byK.push(cheapest(c, 'total')); }
  const best = cheapest(byK, 'total'), single = byK.find(p => p.used.length === 1), minBasket = cheapest(plans, 'basket');
  const sel = byK.find(p => p.used.length === selK) || best;
  let v;
  if (!single) v = 'Ningún supermercado tiene toda tu lista: hay que combinar tiendas.';
  else {
    const n = `<b>${esc(storeName(single.used[0]))}</b>`;
    if (best === single && minBasket.used.length > 1) v = `✔ Compensa comprar todo en ${n}. Repartir en ${minBasket.used.length} tiendas ahorraría ${eur(single.basket - minBasket.basket)} en la compra, pero el viaje extra cuesta ${eur(minBasket.travel - single.travel)} (${km1(minBasket.km)} en total): saldrías perdiendo ${eur(minBasket.total - single.total)}.`;
    else if (best === single) v = `✔ Comprar todo en ${n} es la mejor opción.`;
    else v = `✔ Compensa repartir en ${best.used.length} tiendas: ahorras ${eur(single.basket - best.basket)} en la compra y el viaje extra cuesta ${eur(best.travel - single.travel)}. Ganas ${eur(single.total - best.total)} netos frente a comprar todo en ${n}.`;
  }
  const singles = byK.filter(p => p.used.length === 1), worst = singles.length ? Math.max(...singles.map(p => p.total)) : null;
  const offerSave = sel.lines.reduce((n, l) => n + (l.e.regular - l.e.price) * l.qty, 0);
  const missing = Object.keys(list).filter(id => !idx[id]);
  let h = `<div class="verdict">${v}</div><table><tr><th>Dónde compras</th><th>Compra</th><th>Viaje</th><th>Total</th><th></th></tr>` +
    byK.map(p => `<tr class="${p === best ? 'win' : ''} ${p === sel ? 'sel' : ''}"><td>${p.used.map(storeName).map(esc).join(' + ')}</td><td>${eur(p.basket)}</td><td>${eur(p.travel)}<br><small>${km1(p.km)} · ${p.minutes} min</small></td><td>${eur(p.total)}</td><td><button class="ghost sq" data-k="${p.used.length}">Ver</button></td></tr>`).join('') +
    `</table><p class="note">Total = compra + viaje de ida y vuelta desde casa por la ruta más corta. Solo aparecen combinaciones que cubren toda tu lista.</p>
  <div class="save"><div>Total de esta opción<b>${eur(sel.total)}</b></div>` +
    (worst != null ? `<div>Ahorro vs. la tienda única más cara<b>${eur(worst - sel.total)}</b></div>` : '') +
    `<div>Ahorro por ofertas incluido<b>${eur(offerSave)}</b></div></div>
  <div class="receipt"><p><span>Ruta</span><span>Casa → ${sel.order.map(storeName).map(esc).join(' → ')} → Casa · ${km1(sel.km)}</span></p>`;
  for (const id of sel.order) {
    const ls = sel.lines.filter(l => l.storeId === id);
    h += `<h3>${esc(storeName(id))}</h3>` + ls.map(l => `<p><span>${l.qty} × ${esc(prod[l.id].name)} ${esc(prod[l.id].format)}${l.e.offer ? ' (oferta hasta ' + fdate(l.e.offer.until) + ')' : ''}</span><span>${eur(l.e.price * l.qty)}</span></p>`).join('') +
      `<p><b>Subtotal</b><b>${eur(ls.reduce((n, l) => n + l.e.price * l.qty, 0))}</b></p>`;
  }
  h += `<p><span>Viaje</span><span>${eur(sel.travel)}</span></p><p class="tot"><span>TOTAL</span><span>${eur(sel.total)}</span></p></div>`;
  if (missing.length) h += `<p class="note">Sin precio en ningún supermercado: ${missing.map(id => esc(prod[id].name)).join(', ')}.</p>`;
  $('#result').innerHTML = h;
}
document.addEventListener('click', e => {
  const k = e.target.closest('[data-k]'), d = e.target.closest('[data-del]'), c = e.target.closest('[data-clear]');
  if (k) { selK = +k.dataset.k; renderResult(); }
  else if (d) { delete list[d.dataset.del]; saveList(); renderNav(); renderList(); renderResult(); }
  else if (c) { list = {}; saveList(); renderNav(); renderList(); renderResult(); }
});
document.addEventListener('listchange', () => { renderList(); renderResult(); });
boot().then(() => { renderList(); renderTrip(); renderResult(); });
