// Копирует MapLibre в www/vendor, чтобы карта не зависела от unpkg.com
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'node_modules', 'maplibre-gl', 'dist');
const dst = path.join(__dirname, '..', 'www', 'vendor');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['maplibre-gl.js', 'maplibre-gl.css']) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}
console.log('MapLibre скопирован в www/vendor');
