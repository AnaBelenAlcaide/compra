const f = { store: 'all', cat: 'all', sort: 'pct' };
function offers() {
  return db.prices.map(r => ({ r, p: prod[r.productId], e: idx[r.productId][r.storeId] })).filter(x => x.e.offer).map(x => {
    const best = rowsFor(x.p)[0];
    return { ...x, pct: Math.round(100 * (1 - x.e.price / x.e.regular)), save: x.e.regular - x.e.price, left: daysLeft(x.e.offer.until), isBest: x.e.price <= best.e.price + 1e-9, best };
  });
}
function render() {
  const all = offers();
  let os = all.filter(o => (f.store === 'all' || o.r.storeId === f.store) && (f.cat === 'all' || o.p.category === f.cat));
  const cmp = { pct: (a, b) => b.pct - a.pct, save: (a, b) => b.save - a.save, end: (a, b) => a.left - b.left, price: (a, b) => a.e.price - b.e.price }[f.sort];
  os.sort(cmp); $('#n').textContent = os.length;
  document.querySelectorAll('#chips button').forEach(b => b.classList.toggle('on', b.dataset.store === f.store));
  $('#offers').innerHTML = os.map(o => {
    const s = store(o.r.storeId), when = o.left <= 0 ? 'hoy' : o.left === 1 ? 'mañana' : `en ${o.left} días`;
    return `<article class="card offer"><span class="pct">-${o.pct}%</span><h3>${esc(o.p.name)}</h3>
    <p class="meta">${esc(o.p.brand)} · ${esc(o.p.format)}</p>
    <p class="shop"><i style="background:${esc(s.color)}"></i>${esc(s.name)}</p>
    <p class="best"><b>${eur(o.e.price)}</b> <s>${eur(o.e.regular)}</s> · ahorras ${eur(o.save)}</p>
    <p class="meta">⏳ Termina ${when} (del ${fdate(o.e.offer.from)} al ${fdate(o.e.offer.until)})</p>
    <p class="${o.isBest ? 'ok' : 'meta'}">${o.isBest ? '✔ Es el mejor precio ahora' : 'Aun así, más barato en ' + esc(o.best.s.name) + ' (' + eur(o.best.e.price) + ')'}</p>${qc(o.p.id)}</article>`;
  }).join('') || '<p class="empty">No hay ofertas con estos filtros.</p>';
}
boot().then(() => {
  const all = offers(), ids = [...new Set(all.map(o => o.r.storeId))];
  $('#chips').innerHTML = `<button data-store="all">Todas</button>` + ids.map(id => `<button data-store="${id}"><i style="background:${esc(store(id).color)}"></i>${esc(storeName(id))}</button>`).join('');
  $('#cat').innerHTML = '<option value="all">Todas</option>' + [...new Set(all.map(o => o.p.category))].sort().map(c => `<option>${esc(c)}</option>`).join('');
  $('#chips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { f.store = b.dataset.store; render(); } });
  $('#cat').addEventListener('change', e => { f.cat = e.target.value; render(); });
  $('#sort').addEventListener('change', e => { f.sort = e.target.value; render(); });
  render();
});
