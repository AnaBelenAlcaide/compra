const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
const km1 = n => n.toFixed(1).replace('.', ',') + ' km';
const parseD = d => new Date(d + 'T00:00');
const fdate = d => parseD(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
const daysLeft = d => Math.round((parseD(d) - parseD(today())) / 864e5);
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const KEY = 'ahorracesta:lista:v1';
let db, idx, prod = {}, list = loadList();
function loadList() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function saveList() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }
const store = id => db.stores.find(s => s.id === id);
const storeName = id => store(id).name;
const tag = e => e.offer ? `<span class="tag">${esc(e.offer.label)} hasta ${fdate(e.offer.until)}</span>` : '';
const unitPrice = (p, e) => (e.price / p.size).toFixed(2).replace('.', ',') + ' €/' + p.unit;
const rowsFor = p => db.stores.map(s => ({ s, e: idx[p.id]?.[s.id] })).filter(r => r.e).sort((a, b) => a.e.price - b.e.price);
function renderNav() { const n = Object.values(list).reduce((a, b) => a + b, 0); document.querySelectorAll('.count').forEach(e => e.textContent = n); }
// Botón «Añadir» que pasa a selector de cantidad (− n +).
const qc = id => `<span class="qc" data-id="${id}">` + (list[id]
  ? `<button class="ghost sq" data-dec="${id}" aria-label="Quitar uno">−</button><b>${list[id]}</b><button class="sq" data-inc="${id}" aria-label="Añadir uno">+</button>`
  : `<button data-inc="${id}">➕ Añadir</button>`) + '</span>';
document.addEventListener('click', e => {
  const b = e.target.closest('button[data-inc],button[data-dec]'); if (!b) return;
  const id = b.dataset.inc || b.dataset.dec;
  if (b.dataset.inc) list[id] = (list[id] || 0) + 1; else if (--list[id] <= 0) delete list[id];
  saveList(); renderNav();
  document.querySelectorAll(`.qc[data-id="${id}"]`).forEach(el => el.outerHTML = qc(id));
  document.dispatchEvent(new CustomEvent('listchange'));
});
function productCard(p) {
  const rows = rowsFor(p), b = rows[0];
  return `<article class="card"><h3>${esc(p.name)}</h3>
  <p class="meta">${esc(p.brand)} · ${esc(p.format)} · EAN ${esc(p.ean)}</p>
  ${b ? `<p class="best">Desde <b>${eur(b.e.price)}</b> en ${esc(b.s.name)} ${tag(b.e)}</p>` : '<p class="meta">Sin precios</p>'}
  <details><summary>Comparar ${rows.length} supermercados</summary><table>
  ${rows.map((r, i) => `<tr class="${i ? '' : 'win'}"><td>${esc(r.s.name)}</td><td>${r.e.offer ? `<s>${eur(r.e.regular)}</s> ` : ''}${tag(r.e)}<br><small>${unitPrice(p, r.e)}</small></td><td>${eur(r.e.price)}</td></tr>`).join('')}
  </table></details>${qc(p.id)}</article>`;
}
async function boot() {
  try { db = await source.getCatalog(); }
  catch (err) { $('main').innerHTML = '<p class="empty">No se pudieron cargar los precios (data/catalog.js).</p>'; throw err; }
  db.products.forEach(p => prod[p.id] = p); idx = buildIndex(db);
  for (const id of Object.keys(list)) if (!prod[id] || !(list[id] > 0)) delete list[id];
  $('#foot').textContent = `Fuente: ${db.meta.source} · actualizado ${db.meta.updated}. ${db.meta.note || ''}`;
  renderNav();
}
