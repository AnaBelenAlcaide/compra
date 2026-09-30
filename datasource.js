// Contrato de una fuente de precios: getCatalog() -> Promise<Catalog>
// Catalog = { meta, stores:[{id,name,color}], products:[{id,name,brand,ean,format,size,unit,category}],
//             prices:[{productId,storeId,price,offer:null|{price,from,until,label}}] }  (fechas AAAA-MM-DD)

// Local (doble clic, sin servidor): lee data/catalog.js, que define window.CATALOG.
class ScriptSource {
  async getCatalog() { if (!window.CATALOG) throw new Error('Falta data/catalog.js'); return window.CATALOG; }
}
// Hospedado (GitHub Pages / servidor): lee un JSON.
class JsonSource {
  constructor(url) { this.url = url; }
  async getCatalog() { const r = await fetch(this.url, { cache: 'no-cache' }); if (!r.ok) throw new Error(this.url); return r.json(); }
}
// Futuro: API propia que agregue los extractores de Carrefour, Ahorramás, Alcampo y DIA.
class ApiSource {
  constructor(baseUrl) { this.baseUrl = baseUrl; }
  async getCatalog() { const r = await fetch(this.baseUrl + '/catalog'); if (!r.ok) throw new Error('API no disponible'); return r.json(); }
}
