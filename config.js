// Fuente de precios: cámbiala aquí (JsonSource('data/catalog.json'), ApiSource('https://...')).
const source = new ScriptSource();
// Distancias de ejemplo en km (ida). El usuario puede editarlas en «Mi cesta».
const DEFAULT_TRIP = {
  kmCost: 0.25, hourValue: 0, speed: 30,
  homeKm: { carrefour: 4.2, ahorramas: 1.1, alcampo: 6.8, dia: 0.5 },
  betweenKm: { 'ahorramas|alcampo': 6.0, 'ahorramas|carrefour': 3.5, 'ahorramas|dia': 0.8, 'alcampo|carrefour': 2.9, 'alcampo|dia': 6.5, 'carrefour|dia': 4.0 }
};
