const UKRAINE = [31.1656, 48.3794];
const DEFAULT_ZOOM = 5.15;
const RETURN_DELAY = 12000;
const REGION_FILES = [
  'UA_05_Vinnytska.geojson',
  'UA_07_Volynska.geojson',
  'UA_09_Luhanska.geojson',
  'UA_12_Dnipropetrovska.geojson',
  'UA_14_Donetska.geojson',
  'UA_18_Zhytomyrska.geojson',
  'UA_21_Zakarpatska.geojson',
  'UA_23_Zaporizka.geojson',
  'UA_26_Ivano_Frankivska.geojson',
  'UA_32_Kyivska.geojson',
  'UA_35_Kirovohradska.geojson',
  'UA_43_Avtonomna_Respublika_Krym.geojson',
  'UA_46_Lvivska.geojson',
  'UA_48_Mykolaivska.geojson',
  'UA_51_Odeska.geojson',
  'UA_53_Poltavska.geojson',
  'UA_56_Rivnenska.geojson',
  'UA_59_Sumska.geojson',
  'UA_61_Ternopilska.geojson',
  'UA_63_Kharkivska.geojson',
  'UA_65_Khersonska.geojson',
  'UA_68_Khmelnytska.geojson',
  'UA_71_Cherkaska.geojson',
  'UA_74_Chernihivska.geojson',
  'UA_77_Chernivetska.geojson'
];



const REGION_NEPTUN_KEYS = [
  'vinnytska',
  'volynska',
  'luhanska',
  'dnipropetrovska',
  'donetska',
  'zhytomyrska',
  'zakarpatska',
  'zaporizka',
  'ivano-frankivska',
  'kyivska',
  'kirovohradska',
  'krymska',
  'lvivska',
  'mykolaivska',
  'odeska',
  'poltavska',
  'rivnenska',
  'sumska',
  'ternopilska',
  'kharkivska',
  'khersonska',
  'khmelnytska',
  'cherkaska',
  'chernihivska',
  'chernivetska'
];

const OBLAST_NAME_TO_KEY = {
  'вінницька': 'vinnytska',
  'волинська': 'volynska',
  'луганська': 'luhanska',
  'дніпропетровська': 'dnipropetrovska',
  'донецька': 'donetska',
  'житомирська': 'zhytomyrska',
  'закарпатська': 'zakarpatska',
  'запорізька': 'zaporizka',
  'івано-франківська': 'ivano-frankivska',
  'київська': 'kyivska',
  'м. київ': 'kyivska',
  'київ': 'kyivska',
  'кіровоградська': 'kirovohradska',
  'автономна республіка крим': 'krymska',
  'ар крим': 'krymska',
  'крим': 'krymska',
  'львівська': 'lvivska',
  'миколаївська': 'mykolaivska',
  'одеська': 'odeska',
  'полтавська': 'poltavska',
  'рівненська': 'rivnenska',
  'сумська': 'sumska',
  'тернопільська': 'ternopilska',
  'харківська': 'kharkivska',
  'херсонська': 'khersonska',
  'хмельницька': 'khmelnytska',
  'черкаська': 'cherkaska',
  'чернігівська': 'chernihivska',
  'чернівецька': 'chernivetska'
};

let regionsGeoJSON = null;
let neptunOblastsGeoJSON = null;
let neptunRaionsGeoJSON = null;
let neptunRestTimer = null;

let neptunThreatsTimer = null;
let neptunRealtimeClient = null;
let neptunRealtimeUnsubscribe = null;
let currentThreats = [];
let threatAnimationFrame = null;
const threatMarkers = new Map();

const THREAT_META = {
  uav:       { label: 'ШАХЕД / БПЛА', short: 'БПЛА', color: '#ff4d4d', iconKey: 'uav' },
  recon:     { label: 'РАЗВЕД-БПЛА', short: 'РАЗВЕД', color: '#f7d154', iconKey: 'recon' },
  fpv:       { label: 'FPV-ДРОН', short: 'FPV', color: '#ff884d', iconKey: 'fpv' },
  missile:   { label: 'РАКЕТА', short: 'РАКЕТА', color: '#ff1f1f', iconKey: 'missile' },
  ballistic: { label: 'БАЛЛИСТИКА', short: 'БАЛЛИСТ.', color: '#ff00d4', iconKey: 'ballistic' },
  kab:       { label: 'КАБ', short: 'КАБ', color: '#ff9f1a', iconKey: 'kab' },
  mig31k:    { label: 'МИГ-31К', short: 'МІГ-31К', color: '#b794ff', iconKey: 'mig31k' },
  unknown:   { label: 'НЕИЗВЕСТНАЯ ЦЕЛЬ', short: 'ЦЕЛЬ', color: '#ffffff', iconKey: 'unknown' }
};

const THREAT_ICON_SVG = {
  // Мінімалістичні силуети зверху. Ніс кожної цілі спрямований вгору (0°).
  uav:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 3 L36 16 L58 35 L45 38 L37 35 L35 39 L38 42 L32 43 L26 42 L29 39 L27 35 L19 38 L6 35 L28 16 Z"/></svg>`,
  recon:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 4 L36 18 L56 34 L43 37 L36 34 L35 51 L40 57 L34 56 L32 61 L30 56 L24 57 L29 51 L28 34 L21 37 L8 34 L28 18 Z"/><circle cx="32" cy="28" r="2.2" class="target-cutout"/></svg>`,
  fpv:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-stroke" d="M23 23 41 41M41 23 23 41M32 24V40M24 32H40"/><circle cx="18" cy="18" r="7" class="target-ring"/><circle cx="46" cy="18" r="7" class="target-ring"/><circle cx="18" cy="46" r="7" class="target-ring"/><circle cx="46" cy="46" r="7" class="target-ring"/><rect x="27" y="27" width="10" height="10" rx="2" class="target-silhouette"/></svg>`,
  missile:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 3 C27 9 26 16 26 25 L26 40 L17 51 L26 48 L28 61 L32 55 L36 61 L38 48 L47 51 L38 40 L38 25 C38 16 37 9 32 3 Z"/><path class="target-cutout" d="M30 17h4v22h-4z"/></svg>`,
  ballistic:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 2 C26 10 25 17 25 27 L25 43 L15 55 L26 51 L29 62 L32 56 L35 62 L38 51 L49 55 L39 43 L39 27 C39 17 38 10 32 2 Z"/></svg>`,
  kab:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 5 C26 11 25 19 26 29 L12 36 L26 39 L28 52 L22 59 L32 56 L42 59 L36 52 L38 39 L52 36 L38 29 C39 19 38 11 32 5 Z"/></svg>`,
  mig31k:`<svg viewBox="0 0 64 64" aria-hidden="true"><path class="target-silhouette" d="M32 2 L37 19 L58 34 L43 37 L37 34 L36 49 L43 57 L35 55 L32 62 L29 55 L21 57 L28 49 L27 34 L21 37 L6 34 L27 19 Z"/></svg>`,
  unknown:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="10" class="target-silhouette"/></svg>`
};

function threatIconSvg(iconKey) {
  return THREAT_ICON_SVG[iconKey] || THREAT_ICON_SVG.unknown;
}

function threatMeta(type) {
  return THREAT_META[type] || THREAT_META.unknown;
}

function destinationPoint(lat, lon, bearingDeg, distanceKm) {
  const R = 6371;
  const d = distanceKm / R;
  const brng = bearingDeg * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lon1 = lon * Math.PI / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { lat: lat2 * 180 / Math.PI, lon: ((lon2 * 180 / Math.PI + 540) % 360) - 180 };
}

function fallbackMotionForThreat(threat) {
  const type = String(threat?.type || 'unknown').toLowerCase();
  const explicitSpeed = Number(threat?.velocity?.speedKmh ?? threat?.speedKmh ?? threat?.speed_kmh);
  const explicitBearing = Number(threat?.velocity?.bearingDeg ?? threat?.heading ?? threat?.bearing);

  // Резервные расчётные скорости используются только когда NEPTUN не передал velocity.
  // Они нужны, чтобы маркер не зависал между редкими координатными обновлениями.
  const defaults = {
    uav:       { speedKmh: 160, maxMinutes: 12 },
    recon:     { speedKmh: 120, maxMinutes: 10 },
    fpv:       { speedKmh: 90,  maxMinutes: 5 },
    missile:   { speedKmh: 780, maxMinutes: 3 },
    ballistic: { speedKmh: 0,   maxMinutes: 0 },
    kab:       { speedKmh: 650, maxMinutes: 4 },
    mig31k:    { speedKmh: 900, maxMinutes: 4 },
    unknown:   { speedKmh: 0,   maxMinutes: 0 }
  };
  const fallback = defaults[type] || defaults.unknown;

  return {
    speedKmh: Number.isFinite(explicitSpeed) && explicitSpeed > 0 ? explicitSpeed : fallback.speedKmh,
    bearingDeg: Number.isFinite(explicitBearing) ? explicitBearing : null,
    maxMinutes: Number.isFinite(explicitSpeed) && explicitSpeed > 0 ? 10 : fallback.maxMinutes,
    hasExplicitVelocity: Number.isFinite(explicitSpeed) && explicitSpeed > 0
  };
}

function predictedThreatPosition(threat, nowMs = Date.now()) {
  const lat = Number(threat?.lat);
  const lon = Number(threat?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const motion = fallbackMotionForThreat(threat);

  // SDK используем только когда в объекте есть настоящая скорость. Без velocity
  // NEPTUN.predict обычно возвращает исходную точку, поэтому маркер визуально зависает.
  if (motion.hasExplicitVelocity && window.NEPTUN && typeof window.NEPTUN.predict === 'function') {
    try {
      const predicted = window.NEPTUN.predict(threat, nowMs);
      const predictedLat = Number(predicted?.lat);
      const predictedLon = Number(predicted?.lon);
      if (Number.isFinite(predictedLat) && Number.isFinite(predictedLon)) {
        return {
          lat: predictedLat,
          lon: predictedLon,
          heading: Number.isFinite(Number(predicted?.heading))
            ? Number(predicted.heading)
            : (motion.bearingDeg ?? 0)
        };
      }
    } catch (error) {
      console.warn('NEPTUN.predict error, використовую локальний fallback:', error);
    }
  }

  if (!Number.isFinite(motion.speedKmh) || motion.speedKmh <= 0 || motion.bearingDeg === null) {
    return { lat, lon, heading: motion.bearingDeg ?? 0 };
  }

  // updatedAt важнее confirmedAt: движение считаем от последней фактической координаты.
  const anchor = Date.parse(threat.updatedAt || threat.confirmedAt || threat.createdAt || '');
  if (!Number.isFinite(anchor)) {
    return { lat, lon, heading: motion.bearingDeg };
  }

  const elapsedMinutes = Math.max(0, Math.min((nowMs - anchor) / 60000, motion.maxMinutes));
  const distanceKm = motion.speedKmh * (elapsedMinutes / 60);
  const p = destinationPoint(lat, lon, motion.bearingDeg, distanceKm);
  return { ...p, heading: motion.bearingDeg };
}

function threatsToGeoJSON(nowMs = Date.now()) {
  const features = currentThreats
    .filter(t => t && t.status !== 'resolved')
    .map(t => {
      const p = predictedThreatPosition(t, nowMs);
      if (!p) return null;
      const meta = threatMeta(t.type);
      const count = Number(t.count) > 1 ? ` ×${Number(t.count)}` : '';
      const location = t.locality || t.district || t.region || '';
      return {
        type: 'Feature',
        id: String(t.id || `${t.type}-${t.lat}-${t.lon}`),
        properties: {
          id: String(t.id || ''),
          type: t.type || 'unknown',
          title: t.title || meta.label,
          label: `${meta.short}${count}`,
          iconKey: meta.iconKey,
          color: meta.color,
          heading: Number.isFinite(Number(p.heading)) ? Number(p.heading) : 0,
          region: t.region || '',
          district: t.district || '',
          locality: location,
          confidence: t.confidenceLevel || '',
          sourceCount: Number(t.sourceCount) || 0,
          updatedAt: t.updatedAt || '',
          explanation: t.explanationShort || ''
        },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
      };
    })
    .filter(Boolean);
  return { type: 'FeatureCollection', features };
}

function trailsToGeoJSON() {
  const features = [];
  for (const t of currentThreats) {
    const points = Array.isArray(t?.trail) ? t.trail : [];
    const coordinates = points
      .map(p => [Number(p.lon), Number(p.lat)])
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
    if (coordinates.length < 2) continue;
    features.push({
      type: 'Feature',
      properties: { color: threatMeta(t.type).color, type: t.type || 'unknown' },
      geometry: { type: 'LineString', coordinates }
    });
  }
  return { type: 'FeatureCollection', features };
}

function createThreatMarkerElement(threat) {
  const meta = threatMeta(threat.type);
  const el = document.createElement('div');
  el.className = 'live-threat-marker';
  el.dataset.threatId = String(threat.id || '');
  el.style.setProperty('--threat-color', meta.color);

  const pulse = document.createElement('span');
  pulse.className = 'live-threat-pulse';

  const icon = document.createElement('span');
  icon.className = 'live-threat-icon';
  icon.innerHTML = threatIconSvg(meta.iconKey);

  const count = Number(threat.count) > 1 ? ` ×${Number(threat.count)}` : '';
  const label = document.createElement('span');
  label.className = 'live-threat-label';
  label.textContent = `${meta.short}${count}`;

  el.append(pulse, icon, label);
  return el;
}

function updateThreatMarkerContent(record, threat) {
  const meta = threatMeta(threat.type);
  record.el.style.setProperty('--threat-color', meta.color);
  const icon = record.el.querySelector('.live-threat-icon');
  const label = record.el.querySelector('.live-threat-label');
  if (icon) icon.innerHTML = threatIconSvg(meta.iconKey);
  if (label) {
    const count = Number(threat.count) > 1 ? ` ×${Number(threat.count)}` : '';
    label.textContent = `${meta.short}${count}`;
  }
  record.threat = threat;
}

function showThreatPopup(threat, marker) {
  const safe = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const updated = threat.updatedAt
    ? new Date(threat.updatedAt).toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';
  const position = predictedThreatPosition(threat, Date.now());
  if (!position) return;
  new maplibregl.Popup({ closeButton: true, closeOnClick: true, offset: 18 })
    .setLngLat([position.lon, position.lat])
    .setHTML(`<div class="threat-popup"><strong>${safe(threat.title || threatMeta(threat.type).label)}</strong><br>${safe(threat.locality || threat.district || threat.region || '')}<br>Курс: ${Math.round(Number(position.heading) || 0)}°<br>Источников: ${Number(threat.sourceCount) || 0}<br>Обновлено: ${safe(updated)}${threat.explanationShort ? `<hr>${safe(threat.explanationShort)}` : ''}</div>`)
    .addTo(map);
}


let syncThreatMarkers = function() {
  const active = currentThreats.filter(t => t && t.status !== 'resolved' && Number.isFinite(Number(t.lat)) && Number.isFinite(Number(t.lon)));
  const activeIds = new Set();

  for (const threat of active) {
    const id = String(threat.id || `${threat.type}-${threat.lat}-${threat.lon}`);
    activeIds.add(id);
    let record = threatMarkers.get(id);
    if (!record) {
      const el = createThreatMarkerElement(threat);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([Number(threat.lon), Number(threat.lat)])
        .addTo(map);
      record = { marker, el, threat };
      el.addEventListener('click', event => {
        event.stopPropagation();
        showThreatPopup(record.threat, record.marker);
      });
      threatMarkers.set(id, record);
    } else {
      updateThreatMarkerContent(record, threat);
    }
  }

  for (const [id, record] of threatMarkers) {
    if (!activeIds.has(id)) {
      record.marker.remove();
      threatMarkers.delete(id);
    }
  }

};

function addNeptunThreatLayers() {
  // Траєкторії залишаються MapLibre-шаром, а самі цілі — DOM-маркерами.
  // Це усуває залежність від glyph/font-шарів і гарантує видимість значків.
  if (!map.getSource('neptun-threat-trails')) {
    map.addSource('neptun-threat-trails', { type: 'geojson', data: emptyFeatureCollection() });
    map.addLayer({
      id: 'neptun-threat-trails',
      type: 'line',
      source: 'neptun-threat-trails',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.3, 8, 2.5, 12, 3.8],
        'line-opacity': 0.68,
        'line-dasharray': [2, 2]
      }
    });
  }
}

function renderThreatsFrame() {
  const now = Date.now();
  for (const record of threatMarkers.values()) {
    const p = predictedThreatPosition(record.threat, now);
    if (!p) continue;
    record.marker.setLngLat([p.lon, p.lat]);
    const icon = record.el.querySelector('.live-threat-icon');
    if (icon) icon.style.transform = `rotate(${Number(p.heading) || 0}deg)`;
  }
  threatAnimationFrame = requestAnimationFrame(renderThreatsFrame);
}

async function fetchNeptunThreats() {
  try {
    const payload = await fetchJSON(`/api/threats?t=${Date.now()}`);
    if (payload?.error) throw new Error(payload.error);
    currentThreats = Array.isArray(payload?.threats) ? payload.threats : [];
    syncThreatMarkers();
    map.getSource('neptun-threat-trails')?.setData(trailsToGeoJSON());
    const counter = document.getElementById('threatCount');
    if (counter) counter.textContent = `ЦЕЛИ: ${currentThreats.length}`;
    console.log('NEPTUN active threats:', currentThreats.length, currentThreats);
  } catch (error) {
    console.warn('REST NEPTUN threats тимчасово недоступний:', error);
    const counter = document.getElementById('threatCount');
    if (counter) counter.textContent = 'ЦЕЛИ: API НЕДОСТУПЕН';
  }
}

function applyThreatSnapshot(snapshot = {}) {
  currentThreats = Array.isArray(snapshot?.threats) ? snapshot.threats : [];
  syncThreatMarkers();
  map.getSource('neptun-threat-trails')?.setData(trailsToGeoJSON());
  const counter = document.getElementById('threatCount');
  if (counter) counter.textContent = `ЦЕЛИ: ${currentThreats.length}`;
}

function startNeptunThreats() {
  clearInterval(neptunThreatsTimer);
  neptunThreatsTimer = null;

  if (threatAnimationFrame !== null) cancelAnimationFrame(threatAnimationFrame);
  threatAnimationFrame = requestAnimationFrame(renderThreatsFrame);

  if (window.NEPTUN && typeof window.NEPTUN.RealtimeClient === 'function') {
    try {
      neptunRealtimeUnsubscribe?.();
      neptunRealtimeClient?.stop?.();

      neptunRealtimeClient = new window.NEPTUN.RealtimeClient('https://neptun.in.ua');
      neptunRealtimeUnsubscribe = neptunRealtimeClient.subscribe((snapshot) => {
        applyThreatSnapshot(snapshot);
        console.log('NEPTUN realtime snapshot:', currentThreats.length, currentThreats);
      });
      neptunRealtimeClient.start();
      return;
    } catch (error) {
      console.warn('WebSocket/SDK NEPTUN недоступен, перехожу на REST:', error);
    }
  }

  // Резервний режим, якщо SDK не завантажився.
  fetchNeptunThreats();
  neptunThreatsTimer = setInterval(fetchNeptunThreats, 5000);
}

function normalizeAdminToken(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenVariants(value = '') {
  const raw = normalizeAdminToken(value);
  if (!raw) return [];
  const variants = new Set([raw]);
  variants.add(raw.replace(/\s+(область|район)$/u, '').trim());
  variants.add(raw.replace(/^автономна\s+республіка\s+/u, '').trim());
  return [...variants].filter(Boolean);
}

function itemTokens(item) {
  if (typeof item === 'string') return new Set(tokenVariants(item));
  const values = [item?.key, item?.name, item?.oblast, item?.region, item?.district];
  return new Set(values.flatMap(tokenVariants));
}

function featureTokens(feature) {
  const p = feature?.properties || {};
  const values = [
    p.key, p.name, p.NAME_1, p.NAME_2, p.name_uk, p.name_ua,
    p.oblast, p.raion, p.district, p.region, p.admin_name,
    p.ADM1_UA, p.ADM2_UA, p.shapeName
  ];
  return new Set(values.flatMap(tokenVariants));
}

function featureMatchesItems(feature, items) {
  const fTokens = featureTokens(feature);
  if (!fTokens.size) return false;
  return items.some(item => {
    for (const token of itemTokens(item)) {
      if (fTokens.has(token)) return true;
    }
    return false;
  });
}

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
}

function applyNeptunAlerts(payload = {}) {
  const activeRaions = Array.isArray(payload.raions) ? payload.raions : [];
  const activeOblasts = Array.isArray(payload.oblasts) ? payload.oblasts : [];

  // Важно: районная тревога подсвечивает только район, а не всю область.
  // Целая область подсвечивается только тогда, когда она есть в payload.oblasts.
  const raionFeatures = (neptunRaionsGeoJSON?.features || []).filter(feature =>
    featureMatchesItems(feature, activeRaions)
  );
  const oblastFeatures = (neptunOblastsGeoJSON?.features || []).filter(feature =>
    featureMatchesItems(feature, activeOblasts)
  );

  map.getSource('neptun-alert-raions')?.setData({
    type: 'FeatureCollection',
    features: raionFeatures
  });
  map.getSource('neptun-alert-oblasts')?.setData({
    type: 'FeatureCollection',
    features: oblastFeatures
  });

  const live = document.querySelector('.live-status');
  if (live) {
    live.textContent = `● ТРЕВОГИ: РАЙОНЫ ${activeRaions.length}/${raionFeatures.length} | ОБЛАСТИ ${activeOblasts.length}/${oblastFeatures.length}`;
  }

  console.log('NEPTUN active raions:', activeRaions.map(x => x.key || x.name));
  console.log('NEPTUN matched raion polygons:', raionFeatures.length);
  console.log('NEPTUN active oblasts:', activeOblasts.map(x => x.key || x.name));
  console.log('NEPTUN matched oblast polygons:', oblastFeatures.length);
}

// ===== Сетевой слой =====
// В браузере (через server.py) запросы идут на локальные /api/*.
// В Android-приложении server.py нет, поэтому ходим напрямую к NEPTUN
// через нативный CapacitorHttp (он не подпадает под CORS).
const IS_NATIVE_APP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
// >>> ИМЯ TELEGRAM-КАНАЛА ДЛЯ НОВОСТЕЙ (без @ и без https://t.me/) <<<
const TG_CHANNEL = 'tlknewsua';

const NEPTUN_BASE = 'https://neptun.in.ua';
const NEPTUN_ROUTES = {
  '/api/alerts': '/api/v1/alerts',
  '/api/threats': '/api/v1/threats',
  '/api/oblasts-geojson': '/oblasts.geojson',
  '/api/raions-geojson': '/raions.geojson'
};

async function nativeGet(url, headers = {}) {
  const http = window.Capacitor.Plugins.CapacitorHttp;
  const res = await http.get({ url, headers, connectTimeout: 12000, readTimeout: 15000, responseType: 'text' });
  if (res.status < 200 || res.status >= 300) throw new Error(`${url}: HTTP ${res.status}`);
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
}

async function fetchJSON(url) {
  if (IS_NATIVE_APP) {
    const route = url.split('?')[0];
    const target = NEPTUN_ROUTES[route];
    if (!target) throw new Error(`Неизвестный маршрут: ${route}`);
    const text = await nativeGet(NEPTUN_BASE + target, { Accept: 'application/json' });
    return JSON.parse(text);
  }
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

// Ограничения, чтобы лента не тормозила приложение
const TG_MAX_ITEMS = 20;     // сколько последних постов показывать
const TG_MAX_CHARS = 600;    // максимум символов на один пост
const TG_MAX_HTML = 400000;  // читаем только «хвост» страницы (там свежие посты)

function parseTelegramPage(page) {
  const tail = page.length > TG_MAX_HTML ? page.slice(-TG_MAX_HTML) : page;
  const doc = new DOMParser().parseFromString(tail, 'text/html');
  const wraps = Array.from(doc.querySelectorAll('.tgme_widget_message_wrap')).slice(-TG_MAX_ITEMS);
  const items = [];
  for (const wrap of wraps) {
    const post = wrap.querySelector('[data-post]')?.getAttribute('data-post');
    const textEl = wrap.querySelector('.tgme_widget_message_text');
    if (!post || !textEl) continue;
    textEl.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    let text = textEl.textContent.replace(/\n{3,}/g, '\n\n').trim();
    if (!text) continue;
    if (text.length > TG_MAX_CHARS) text = text.slice(0, TG_MAX_CHARS) + '…';
    items.push({
      text,
      datetime: wrap.querySelector('time')?.getAttribute('datetime') || '',
      url: 'https://t.me/' + post
    });
  }
  return items;
}

async function fetchTelegramItems() {
  if (IS_NATIVE_APP) {
    const page = await nativeGet('https://t.me/s/' + TG_CHANNEL, { 'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.7' });
    return parseTelegramPage(page);
  }
  const response = await fetch('/api/telegram-news', { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()).items || [];
}

async function loadNeptunBoundaries() {
  const [oblasts, raions] = await Promise.all([
    fetchJSON('/api/oblasts-geojson'),
    fetchJSON('/api/raions-geojson')
  ]);
  if (oblasts?.type !== 'FeatureCollection' || !Array.isArray(oblasts.features)) {
    throw new Error('Некоректний oblasts.geojson');
  }
  if (raions?.type !== 'FeatureCollection' || !Array.isArray(raions.features)) {
    throw new Error('Некоректний raions.geojson');
  }
  neptunOblastsGeoJSON = oblasts;
  neptunRaionsGeoJSON = raions;
  console.log('NEPTUN polygons loaded:', {
    oblasts: oblasts.features.length,
    raions: raions.features.length,
    oblastSample: oblasts.features[0]?.properties,
    raionSample: raions.features[0]?.properties
  });
}

function addNeptunAlertLayers() {
  map.addSource('neptun-alert-oblasts', { type: 'geojson', data: emptyFeatureCollection() });
  map.addSource('neptun-alert-raions', { type: 'geojson', data: emptyFeatureCollection() });

  map.addLayer({
    id: 'neptun-oblast-alert-fill',
    type: 'fill',
    source: 'neptun-alert-oblasts',
    paint: {
      'fill-color': '#ff0000',
      'fill-opacity': 0.18,
      'fill-outline-color': '#ff4a4a'
    }
  });
  map.addLayer({
    id: 'neptun-raion-alert-fill',
    type: 'fill',
    source: 'neptun-alert-raions',
    paint: {
      'fill-color': '#ff0000',
      'fill-opacity': 0.18,
      'fill-outline-color': '#ff4a4a'
    }
  });
  map.addLayer({
    id: 'neptun-raion-alert-border',
    type: 'line',
    source: 'neptun-alert-raions',
    paint: {
      'line-color': '#ff6a6a',
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 8, 1.15, 12, 1.8],
      'line-opacity': 0.95
    }
  });
}

async function fetchNeptunAlerts() {
  try {
    const payload = await fetchJSON('/api/alerts');
    applyNeptunAlerts(payload);
  } catch (error) {
    console.warn('REST NEPTUN временно недоступен:', error);
    const live = document.querySelector('.live-status');
    if (live) live.textContent = '● API ТРЕВОГ НЕДОСТУПЕН';
  }
}

function startNeptunAlerts() {
  fetchNeptunAlerts();
  clearInterval(neptunRestTimer);
  neptunRestTimer = setInterval(fetchNeptunAlerts, 7000);
}

const REGION_BASES = [
  './data/',
  'https://cdn.jsdelivr.net/gh/EugeneBorshch/ukraine_geojson@master/',
  'https://raw.githubusercontent.com/EugeneBorshch/ukraine_geojson/refs/heads/master/'
];

const OBLAST_LABELS = {
  type: 'FeatureCollection',
  features: [
    ['Волинська область', 24.72, 51.12],
    ['Рівненська область', 26.25, 51.04],
    ['Житомирська область', 28.47, 50.67],
    ['Київська область', 30.33, 50.20],
    ['Чернігівська область', 31.85, 51.17],
    ['Сумська область', 34.03, 50.98],
    ['Львівська область', 24.02, 49.82],
    ['Тернопільська область', 25.58, 49.52],
    ['Хмельницька область', 27.02, 49.42],
    ['Вінницька область', 28.73, 49.12],
    ['Черкаська область', 31.55, 49.05],
    ['Полтавська область', 34.02, 49.55],
    ['Харківська область', 36.45, 49.55],
    ['Закарпатська область', 23.20, 48.40],
    ['Івано-Франківська область', 24.72, 48.72],
    ['Чернівецька область', 25.93, 48.25],
    ['Кіровоградська область', 32.02, 48.35],
    ['Дніпропетровська область', 35.03, 48.32],
    ['Донецька область', 37.72, 48.02],
    ['Луганська область', 39.05, 48.95],
    ['Одеська область', 30.18, 46.72],
    ['Миколаївська область', 32.15, 47.02],
    ['Херсонська область', 34.08, 46.70],
    ['Запорізька область', 35.72, 47.20],
    ['Автономна Республіка Крим', 34.15, 45.25]
  ].map(([name, lng, lat]) => ({
    type: 'Feature',
    properties: { name },
    geometry: { type: 'Point', coordinates: [lng, lat] }
  }))
};

const clockEl = document.getElementById('countdown');
const dateEl = document.getElementById('timerState');
function updateUkraineTime() {
  const now = new Date();
  clockEl.textContent = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(now);
  dateEl.textContent = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(now);
}
updateUkraineTime();
setInterval(updateUkraineTime, 1000);

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [{
      id: 'base-map',
      type: 'raster',
      source: 'osm',
      paint: {
        'raster-saturation': -1,
        'raster-contrast': 0.14,
        'raster-brightness-min': 0.18,
        'raster-brightness-max': 0.92
      }
    }]
  },
  center: UKRAINE,
  zoom: DEFAULT_ZOOM,
  attributionControl: false,
  maxZoom: 19,
  minZoom: 3
});

let returnTimer;
function startReturnTimer() {
  clearTimeout(returnTimer);
  returnTimer = setTimeout(() => returnToUkraine(true), RETURN_DELAY);
}
function returnToUkraine(animated = true) {
  clearTimeout(returnTimer);
  map[animated ? 'easeTo' : 'jumpTo']({
    center: UKRAINE,
    zoom: DEFAULT_ZOOM,
    pitch: 0,
    bearing: 0,
    duration: animated ? 1500 : 0,
    essential: true
  });
  setTimeout(startReturnTimer, animated ? 1550 : 0);
}

async function loadRegionsGeoJSON() {
  const cached = localStorage.getItem('ukraine-oblasts-geojson-v3');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data?.type === 'FeatureCollection' && data.features?.length >= 24) {
        data.features.forEach((feature, index) => {
          feature.properties = feature.properties || {};
          feature.properties.neptunKey = feature.properties.neptunKey || REGION_NEPTUN_KEYS[index];
        });
        return data;
      }
    } catch (_) {}
  }

  let lastError;
  for (const base of REGION_BASES) {
    try {
      const responses = await Promise.all(REGION_FILES.map(async file => {
        const response = await fetch(base + file, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        return response.json();
      }));

      const features = responses.flatMap((data, index) => {
        let items = [];
        if (data?.type === 'FeatureCollection') items = data.features || [];
        else if (data?.type === 'Feature') items = [data];
        else if (data?.type === 'Polygon' || data?.type === 'MultiPolygon') {
          items = [{ type: 'Feature', properties: {}, geometry: data }];
        }

        return items.map(feature => ({
          ...feature,
          properties: {
            ...(feature.properties || {}),
            sourceFile: REGION_FILES[index],
            neptunKey: REGION_NEPTUN_KEYS[index]
          }
        }));
      }).filter(feature => ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type));

      if (features.length < 24) throw new Error(`Отримано лише ${features.length} областей`);

      const result = { type: 'FeatureCollection', features };
      try { localStorage.setItem('ukraine-oblasts-geojson-v3', JSON.stringify(result)); } catch (_) {}
      return result;
    } catch (error) {
      lastError = error;
      console.warn('Джерело меж областей недоступне:', base, error);
    }
  }
  throw lastError || new Error('Не вдалося завантажити межі областей');
}

function addRegionLayers(regionsData) {
  regionsGeoJSON = regionsData;
  regionsGeoJSON.features.forEach(feature => {
    feature.properties = feature.properties || {};
    feature.properties.alert = false;
  });

  map.addSource('ukraine-regions', {
    type: 'geojson',
    data: regionsData,
    generateId: true
  });


  map.addLayer({
    id: 'oblast-fill',
    type: 'fill',
    source: 'ukraine-regions',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false], '#bfff68',
        '#65ff83'
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false], 0.16,
        ['interpolate', ['linear'], ['zoom'], 4, 0.075, 7, 0.045, 12, 0.018]
      ]
    }
  });

  // Чёрная подложка не даёт границам потеряться на светлой карте.
  map.addLayer({
    id: 'oblast-border-casing',
    type: 'line',
    source: 'ukraine-regions',
    paint: {
      'line-color': '#440000',
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.1, 8, 1.2, 12, 1.35, 16, 1.5],
      'line-opacity': 0.10,
      'line-blur': 0.2
    }
  });

  // Основной хорошо заметный контур реальных областей.
  map.addLayer({
    id: 'oblast-border-main',
    type: 'line',
    source: 'ukraine-regions',
    paint: {
      'line-color': [
        'case',
        ['boolean', ['get', 'alert'], false], '#ff3030',
        '#ff1f1f'
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.65, 8, 0.72, 12, 0.82, 16, 0.95],
      'line-opacity': [
        'case',
        ['boolean', ['get', 'alert'], false], 0.95,
        0.32
      ]
    }
  });

  // Тонкая зелёная сердцевина создаёт радарное свечение.
  map.addLayer({
    id: 'oblast-border-core',
    type: 'line',
    source: 'ukraine-regions',
    paint: {
      'line-color': '#ff0000',
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.22, 8, 0.28, 12, 0.34, 16, 0.42],
      'line-opacity': 0.18
    }
  });

  map.addSource('oblast-labels', { type: 'geojson', data: OBLAST_LABELS });
  map.addLayer({
    id: 'oblast-label-layer',
    type: 'symbol',
    source: 'oblast-labels',
    minzoom: 4.15,
    maxzoom: 11,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 4.2, 10.5, 6, 12.5, 8, 14.5],
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.04,
      'text-max-width': 10,
      'text-allow-overlap': false,
      'text-ignore-placement': false
    },
    paint: {
      'text-color': '#efffd3',
      'text-halo-color': '#220000',
      'text-halo-width': 2.8,
      'text-halo-blur': 0.35
    }
  });

  let hoveredRegionId = null;
  map.on('mousemove', 'oblast-fill', event => {
    if (!event.features?.length) return;
    if (hoveredRegionId !== null) {
      map.setFeatureState({ source: 'ukraine-regions', id: hoveredRegionId }, { hover: false });
    }
    hoveredRegionId = event.features[0].id;
    map.setFeatureState({ source: 'ukraine-regions', id: hoveredRegionId }, { hover: true });
    map.getCanvas().style.cursor = 'crosshair';
  });
  map.on('mouseleave', 'oblast-fill', () => {
    if (hoveredRegionId !== null) {
      map.setFeatureState({ source: 'ukraine-regions', id: hoveredRegionId }, { hover: false });
    }
    hoveredRegionId = null;
    map.getCanvas().style.cursor = '';
  });

  document.body.classList.add('regions-ready');
}

map.on('load', async () => {
  try {
    const [regionsData] = await Promise.all([
      loadRegionsGeoJSON(),
      loadNeptunBoundaries()
    ]);
    addRegionLayers(regionsData);
    addNeptunAlertLayers();
    addNeptunThreatLayers();
    startNeptunAlerts();
    startNeptunThreats();
  } catch (error) {
    console.error('Дані карти або межі NEPTUN не завантажено:', error);
    const live = document.querySelector('.live-status');
    if (live) live.textContent = '● MAP DATA ERROR';
  }

  startReturnTimer();
  map.fire('move');
});


['dragstart', 'zoomstart', 'rotatestart', 'pitchstart'].forEach(name => map.on(name, () => clearTimeout(returnTimer)));
['dragend', 'zoomend', 'rotateend', 'pitchend'].forEach(name => map.on(name, startReturnTimer));

map.on('mousemove', (event) => {
  const { lng, lat } = event.lngLat;
  document.getElementById('coords').textContent = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'} / ${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
});
map.on('resize', () => map.fire('move'));
document.getElementById('homeBtn').addEventListener('click', () => returnToUkraine(true));
document.getElementById('styleBtn').addEventListener('click', () => document.body.classList.toggle('alt'));
window.addEventListener('resize', () => map.resize());


// Telegram news feed (канал задаётся в TG_CHANNEL)
const telegramFeed = document.getElementById('telegramFeed');
const telegramFeedList = document.getElementById('telegramFeedList');
const telegramFeedStatus = document.getElementById('telegramFeedStatus');
const telegramFeedToggle = document.getElementById('telegramFeedToggle');
const telegramFeedTab = document.getElementById('telegramFeedTab');

function escapeTelegramText(value) {
  return String(value || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function formatTelegramTime(iso) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function renderTelegramNews(items) {
  telegramFeedList.innerHTML = '';
  if (!Array.isArray(items) || !items.length) {
    telegramFeedStatus.textContent = 'НОВОСТЕЙ НЕ НАЙДЕНО';
    return;
  }
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    const link = document.createElement('a');
    link.className = 'telegram-news-item';
    link.href = item.url || ('https://t.me/' + TG_CHANNEL);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = `
      <div class="telegram-news-item__meta">
        <span># ${String(index + 1).padStart(2, '0')}</span>
        <time>${escapeTelegramText(formatTelegramTime(item.datetime))}</time>
      </div>
      <div class="telegram-news-item__text">${escapeTelegramText(item.text)}</div>`;
    fragment.appendChild(link);
  });
  telegramFeedList.appendChild(fragment);
  telegramFeedList.scrollTop = telegramFeedList.scrollHeight;
  telegramFeedStatus.textContent = `Обновлено · ${formatTelegramTime(new Date().toISOString())}`;
}

let telegramBusy = false;
async function loadTelegramNews() {
  if (telegramBusy) return;   // не запускаем новый запрос, пока не закончился прошлый
  telegramBusy = true;
  telegramFeedStatus.textContent = 'ОЬНОВЛЕНИЕ ЛЕНТЫ...';
  try {
    renderTelegramNews(await fetchTelegramItems());
  } catch (error) {
    console.warn('Telegram feed error:', error);
    telegramFeedStatus.textContent = 'ОШИБКА: ' + String(error && error.message || error).slice(0, 80);
  } finally {
    telegramBusy = false;
  }
}

function setTelegramFeedHidden(hidden) {
  telegramFeed.classList.toggle('is-hidden', hidden);
  telegramFeedTab.classList.toggle('is-visible', hidden);
  try { localStorage.setItem('telegram-feed-hidden', hidden ? '1' : '0'); } catch (_) {}
}

telegramFeedToggle?.addEventListener('click', () => setTelegramFeedHidden(true));
telegramFeedTab?.addEventListener('click', () => setTelegramFeedHidden(false));
setTelegramFeedHidden(localStorage.getItem('telegram-feed-hidden') === '1');
loadTelegramNews();
setInterval(loadTelegramNews, 30000);


// === Замена слов из внешних данных (NEPTUN) на русские ===
// Добавляйте сюда новые пары: [/что заменить/g, 'на что']
const WORD_REPLACEMENTS = [
  [/Підтверджень/g, 'Подтверждений'],
  [/підтверджень/g, 'подтверждений'],
  [/ПІДТВЕРДЖЕНЬ/g, 'ПОДТВЕРЖДЕНИЙ']
];

function applyWordReplacements(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue;
    let changed = text;
    for (const [from, to] of WORD_REPLACEMENTS) changed = changed.replace(from, to);
    if (changed !== text) node.nodeValue = changed;
  }
}

applyWordReplacements(document.body);
new MutationObserver(mutations => {
  for (const m of mutations) {
    if (m.type === 'characterData') applyWordReplacements(m.target.parentNode);
    else m.addedNodes.forEach(n => applyWordReplacements(n.nodeType === 1 ? n : n.parentNode));
  }
}).observe(document.body, { childList: true, subtree: true, characterData: true });

// === Вторая вкладка новостей (другой Telegram-канал) ===
const FEED2_CHANNEL = 'kharkiv_info_chanel';   // <-- ваш канал, без @ и без https://t.me/
const FEED2_LABEL = 'Моніторинг ПЦ';       // надпись на вкладке (лучше короткая)
const FEED2_TAB_OFFSET = 130;         // на сколько пикселей ниже первой вкладки

(function initSecondFeed() {
  if (!FEED2_CHANNEL || FEED2_CHANNEL === 'ИМЯ_КАНАЛА') return;
  const panel1 = document.getElementById('telegramFeed');
  const tab1 = document.getElementById('telegramFeedTab');
  if (!panel1 || !tab1) return;

  // Панель и вкладка №2 — копии первых
  const panel2 = panel1.cloneNode(true);
  panel2.id = 'telegramFeed2';
  panel2.setAttribute('aria-label', 'Новини Telegram: ' + FEED2_CHANNEL);
  panel2.classList.add('is-hidden');
  const link2 = 'https://t.me/' + FEED2_CHANNEL;
  const headLink = panel2.querySelector('.telegram-feed__header a');
  headLink.href = link2;
  headLink.textContent = '@' + FEED2_CHANNEL;
  panel2.querySelector('.telegram-feed__open').href = link2;
  const toggle2 = panel2.querySelector('.telegram-feed__toggle');
  toggle2.id = 'telegramFeedToggle2';
  const status2 = panel2.querySelector('.telegram-feed__status');
  status2.id = 'telegramFeedStatus2';
  status2.textContent = 'ЗАГРУЗКА...';
  const list2 = panel2.querySelector('.telegram-feed__list');
  list2.id = 'telegramFeedList2';
  list2.innerHTML = '';
  panel1.after(panel2);

  const tab2 = tab1.cloneNode(true);
  tab2.id = 'telegramFeedTab2';
  tab2.textContent = FEED2_LABEL;
  tab2.classList.add('is-visible');
  tab2.style.top = `calc(50% + ${FEED2_TAB_OFFSET}px)`;
  tab1.after(tab2);

  let busy = false;
  async function loadFeed2() {
    if (busy || panel2.classList.contains('is-hidden')) return;
    busy = true;
    status2.textContent = 'ОБНОВЛЕНИЕ...';
    try {
      if (!IS_NATIVE_APP) throw new Error('працює лише в додатку');
      const page = await nativeGet('https://t.me/s/' + FEED2_CHANNEL, { 'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.7' });
      const items = parseTelegramPage(page);
      list2.innerHTML = '';
      if (!items.length) {
        status2.textContent = 'НОВОСТЕЙ НЕ НАЙДЕНО';
      } else {
        const fragment = document.createDocumentFragment();
        items.forEach((item, index) => {
          const a = document.createElement('a');
          a.className = 'telegram-news-item';
          a.href = item.url || link2;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.innerHTML = `
            <div class="telegram-news-item__meta">
              <span># ${String(index + 1).padStart(2, '0')}</span>
              <time>${escapeTelegramText(formatTelegramTime(item.datetime))}</time>
            </div>
            <div class="telegram-news-item__text">${escapeTelegramText(item.text)}</div>`;
          fragment.appendChild(a);
        });
        list2.appendChild(fragment);
        list2.scrollTop = list2.scrollHeight;
        status2.textContent = `ОБНОВЛЕНО · ${formatTelegramTime(new Date().toISOString())}`;
      }
    } catch (error) {
      console.warn('Feed 2 error:', error);
      status2.textContent = 'ОШИБКА: ' + String((error && error.message) || error).slice(0, 80);
    } finally {
      busy = false;
    }
  }

  function setFeed2Hidden(hidden) {
    panel2.classList.toggle('is-hidden', hidden);
    tab2.classList.toggle('is-visible', hidden);
    if (!hidden) loadFeed2();
  }

  // Открыли №2 — закрываем №1, и наоборот
  tab2.addEventListener('click', () => { setTelegramFeedHidden(true); setFeed2Hidden(false); });
  toggle2.addEventListener('click', () => setFeed2Hidden(true));
  tab1.addEventListener('click', () => setFeed2Hidden(true));

  setInterval(loadFeed2, 30000);   // обновляем только пока панель №2 открыта
})();

// === Метки из постов Telegram: «Место, Тип» добавляет, «Место, відбій» убирает ===
//   Дергачи, FPV            -> метка FPV над Дергачами
//   Золочев, Шахед          -> метка БПЛА над Золочевом
//   Золочев, відбій         -> убрать все метки в Золочеве
//   Дергачи, FPV збито      -> убрать только FPV в Дергачах
const POST_CHANNEL = 'dimsvich_test';   // канал без @ и без https://t.me/
const POST_TTL_MIN = 60;                      // страховка: метка сама исчезает через N минут после последнего поста о ней
const POST_POLL_SEC = 30;                     // как часто читать канал
const POST_VIEWBOX = '34.8,50.6,38.3,48.7';   // где искать населённые пункты (Харківщина): запад,север,восток,юг
const POST_REGION = 'Харківська область';
// Слова, которыми админ снимает метку (строчными буквами; можно добавлять свои):
const POST_REMOVE_WORDS = ['відбій', 'відбой', 'збито', 'збили', 'збит', 'сбит', 'сбито', 'чисто', 'знято', 'знят'];
// Если поиск ошибается с каким-то населённым пунктом, задайте координаты вручную:
// const POST_OVERRIDES = { 'Назва': [широта, довгота] };
const POST_OVERRIDES = {};

(function initPostTracking() {
  if (!POST_CHANNEL) return;

  // ---------- 1. Типы ----------
  const NC = 'а-яёіїєґ';
  const TYPE_RULES = [
    ['mig31k',    new RegExp(`(?<![${NC}])(міг|миг)-?31`, 'i')],
    ['ballistic', new RegExp(`(?<![${NC}])(баліст|баллист|іскандер|искандер)`, 'i')],
    ['missile',   new RegExp(`(?<![${NC}])(ракет|калібр|калибр)`, 'i')],
    ['kab',       new RegExp(`(?<![${NC}])(каб(?![${NC}])|авіабомб|авиабомб)`, 'i')],
    ['fpv',       new RegExp(`(?<![${NC}])(fpv|фпв)`, 'i')],
    ['recon',     new RegExp(`(?<![${NC}])(розвід|разведк|разведыв|орлан)`, 'i')],
    ['uav',       new RegExp(`(?<![${NC}])(шахед|шахід|шахид|герань|бпла|бпак|дрон|ударн)`, 'i')]
  ];
  const REMOVE_RE = new RegExp(`(?<![${NC}])(${POST_REMOVE_WORDS.join('|')})`, 'i');
  const STOP = new Set(['увага', 'внимание', 'обережно', 'ситуація', 'ситуация', 'харківщина', 'харьковщина',
    'зараз', 'наразі', 'сейчас', 'терміново', 'срочно', 'новини', 'новости', 'україна', 'украина']);
  const detectType = s => { for (const [t, re] of TYPE_RULES) if (re.test(s)) return t; return null; };

  // ---------- 2. Разбор строки «Место, Тип» ----------
  function parsePostLine(line) {
    const clean = String(line)
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, ' ')
      .replace(/\s+/g, ' ').trim();
    const parts = clean.split(/\s*[,;]\s*|\s+[-–—]+\s+/);
    if (parts.length < 2) return null;                       // без разделителя — это не команда
    const place = parts[0].replace(/[()"«»\u201C\u201D!?.:]+/g, '').trim();
    const rest = parts.slice(1).join(' ');
    if (place.length < 2 || place.length > 40 || place.split(' ').length > 3) return null;
    if (!/^[А-ЯІЇЄҐЁ]/.test(place) || STOP.has(place.toLowerCase()) || /област|район|громад/i.test(place)) return null;
    const type = detectType(rest);
    if (REMOVE_RE.test(rest)) return { op: '-', place, type };
    if (!type) return null;
    const m = rest.match(/(\d{1,2})\s*[xх×](?=\s|$)|[xх×]\s*(\d{1,2})(?=\s|$)|(?:^|\s)(\d{1,2})(?=\s|$)/i);
    const count = m ? Math.max(1, +(m[1] || m[2] || m[3])) : 1;
    return { op: '+', place, type, count };
  }
  const parsePostText = text => String(text).split(/[\n\r\u2022]+/).map(parsePostLine).filter(Boolean);

  // «Дергачи» = «Дергачі» = «дергачи»
  const norm = s => s.toLowerCase().replace(/[іїы]/g, 'и').replace(/[ёє]/g, 'е').replace(/ґ/g, 'г').replace(/[''ʼ`]/g, '');

  // Проигрываем последние посты по порядку -> что осталось на карте
  function replay(items) {
    const state = new Map();
    for (const item of items) {
      const ts = Date.parse(item.datetime);
      if (!Number.isFinite(ts)) continue;
      for (const c of parsePostText(item.text)) {
        const np = norm(c.place);
        if (c.op === '+') state.set(np + '|' + c.type, { ...c, ts, url: item.url });
        else for (const k of [...state.keys()]) {
          const [p, t] = k.split('|');
          if (p === np && (!c.type || t === c.type)) state.delete(k);
        }
      }
    }
    return state;
  }

  // ---------- 3. Название -> координаты (OpenStreetMap Nominatim, с кэшем) ----------
  const CACHE_KEY = 'postGeoCache_v1';
  let geoCache = {};
  try { geoCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) { geoCache = {}; }
  const saveCache = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(geoCache)); } catch (e) { /* ignore */ } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let geoChain = Promise.resolve();

  function cached(key) {
    const hit = geoCache[key];
    if (!hit) return undefined;
    if (hit.lat != null) return { lat: hit.lat, lon: hit.lon };
    return Date.now() - hit.ts < 6 * 3600 * 1000 ? null : undefined;   // «не найдено» помним 6 часов
  }

  // Варианты написания: русское «Золочев» -> украинское «Золочів» и т.п.
  function variants(place) {
    const v = [place, place.replace(/ев$/, 'ів'), place.replace(/ев$/, 'їв'), place.replace(/ея$/, 'ія'), place.replace(/и$/, 'і')];
    return [...new Set(v)];
  }

  async function nominatim(name) {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=uk'
      + '&countrycodes=ua&bounded=1&viewbox=' + POST_VIEWBOX + '&q=' + encodeURIComponent(name);
    const text = IS_NATIVE_APP
      ? await nativeGet(url, { 'User-Agent': 'ChysteNebo-personal-map/1.0', 'Accept-Language': 'uk' })
      : await (await fetch(url)).text();
    const list = JSON.parse(text);
    const ok = Array.isArray(list) ? list.find(r => r.category === 'place' || r.class === 'place') : null;
    return ok ? { lat: Number(ok.lat), lon: Number(ok.lon) } : null;
  }

  // Возвращает {lat, lon}, null (не найдено) или undefined (ошибка сети — попробуем позже)
  function geocode(place) {
    if (POST_OVERRIDES[place]) return Promise.resolve({ lat: POST_OVERRIDES[place][0], lon: POST_OVERRIDES[place][1] });
    const key = norm(place);
    const hit = cached(key);
    if (hit !== undefined) return Promise.resolve(hit);
    const job = geoChain.then(async () => {
      const again = cached(key);
      if (again !== undefined) return again;
      for (const name of variants(place)) {
        try {
          const geo = await nominatim(name);
          await sleep(1100);                                   // правила Nominatim: не чаще 1 запроса в секунду
          if (geo) { geoCache[key] = { ...geo, ts: Date.now() }; saveCache(); return geo; }
        } catch (e) {
          console.warn('Geocode error:', name, e);
          await sleep(1100);
          return undefined;
        }
      }
      geoCache[key] = { lat: null, ts: Date.now() };
      saveCache();
      return null;
    });
    geoChain = job.catch(() => {});
    return job;
  }

  // ---------- 4. Метки на карте ----------
  let postThreats = [];
  const isFresh = t => Date.now() - Date.parse(t.updatedAt) < POST_TTL_MIN * 60000;

  const origSync = syncThreatMarkers;
  syncThreatMarkers = function () {
    try {
      currentThreats = currentThreats.filter(t => !(t && t.pt)).concat(postThreats.filter(isFresh));
    } catch (e) { console.warn('Post merge error:', e); }
    return origSync.apply(this, arguments);
  };

  function refresh() {
    syncThreatMarkers();
    const counter = document.getElementById('threatCount');
    if (counter) counter.textContent = counter.textContent.replace(/ЦІЛІ: \d+/, 'ЦІЛІ: ' + currentThreats.length);
  }

  let busy = false, lastSig = '';
  async function poll() {
    if (busy || document.hidden || !IS_NATIVE_APP) return;
    busy = true;
    try {
      const page = await nativeGet('https://t.me/s/' + POST_CHANNEL, { 'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.7' });
      const alive = [...replay(parseTelegramPage(page)).entries()]
        .filter(([, c]) => Date.now() - c.ts < POST_TTL_MIN * 60000);
      const next = [];
      for (const [key, c] of alive) {
        const geo = await geocode(c.place);
        if (!geo) continue;                                   // не нашли / нет сети — пропускаем, повторим в след. опросе
        const iso = new Date(c.ts).toISOString();
        next.push({
          id: 'pt-' + key, pt: true, type: c.type, lat: geo.lat, lon: geo.lon, count: c.count,
          title: threatMeta(c.type).label, locality: c.place, region: POST_REGION,
          status: 'active', updatedAt: iso, createdAt: iso, sourceCount: 1,
          explanationShort: 'Telegram @' + POST_CHANNEL
        });
      }
      postThreats = next;
    } catch (e) {
      console.warn('Post tracking error:', e);               // при ошибке сети оставляем то, что уже на карте
    } finally {
      busy = false;
      const sig = JSON.stringify(postThreats.filter(isFresh).map(t => [t.id, t.lat, t.lon, t.count, t.updatedAt]));
      if (sig !== lastSig) { lastSig = sig; refresh(); }
    }
  }

  window.postDebug = { parsePostLine, parsePostText, replay, poll };
  setTimeout(poll, 3000);
  setInterval(poll, POST_POLL_SEC * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
})();

