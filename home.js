function renderSearch() {
  const q = norm($('#q').value.trim()), only = $('#onlyOffers').checked;
  const hits = db.products.filter(p => (!q || norm([p.name, p.brand, p.ean, p.category].join(' ')).includes(q)) && (!only || rowsFor(p).some(r => r.e.offer)));
  $('#results').innerHTML = hits.map(productCard).join('') || '<p class="empty">Ningún producto coincide. Prueba con otra palabra.</p>';
}
boot().then(() => { renderSearch(); $('#q').addEventListener('input', renderSearch); $('#onlyOffers').addEventListener('change', renderSearch); });
