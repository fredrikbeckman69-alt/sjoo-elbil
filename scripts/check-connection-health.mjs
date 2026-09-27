/**
 * scripts/check-connection-health.mjs
 * 
 * Schemalagt cron-skript för kontinuerlig kontroll och upprätthållande av nätverksstabilitet:
 * 1. Kontrollerar och förvärmer OSRM routing-servern (router.project-osrm.org)
 * 2. Kontrollerar och förvärmer Komoot Photon geokodnings-API (photon.komoot.io)
 * 3. Kontrollerar OpenStreetMap Nominatim tillgänglighet
 * 4. Kontrollerar molnsynkronisering för användardata (MockAPI)
 * 5. Genererar public/data/connection_health.json för appens driftstatusvisning
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const HEALTH_FILE = path.join(ROOT_DIR, 'public', 'data', 'connection_health.json');

console.log('🌐 Startar schemalagd kontroll av anslutningsstabilitet och API-hälsa...');

async function pingEndpoint(name, url, options = {}) {
  const start = Date.now();
  const timeoutMs = options.timeoutMs || 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SjooElbilConnectionHealthBot/1.0',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    if (res.ok) {
      console.log(`  ✅ ${name}: OK (${latencyMs} ms, HTTP ${res.status})`);
      return {
        name,
        status: 'healthy',
        statusCode: res.status,
        latencyMs,
        error: null,
      };
    } else {
      console.warn(`  ⚠️ ${name}: Svarade med HTTP ${res.status} (${latencyMs} ms)`);
      return {
        name,
        status: 'degraded',
        statusCode: res.status,
        latencyMs,
        error: `HTTP ${res.status}`,
      };
    }
  } catch (err) {
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    console.error(`  ❌ ${name}: Misslyckades (${latencyMs} ms) - ${err.message}`);
    return {
      name,
      status: 'unreachable',
      statusCode: 0,
      latencyMs,
      error: err.message,
    };
  }
}

async function runHealthCheck() {
  const timestamp = new Date().toISOString();

  // Test-endpoints som används av appen
  const endpoints = [
    {
      name: 'OSRM Route Engine',
      url: 'https://router.project-osrm.org/route/v1/driving/13.000157,55.605293;23.364730,67.209036?overview=false',
      timeoutMs: 9000,
    },
    {
      name: 'Photon Geocoding (Komoot)',
      url: 'https://photon.komoot.io/api/?q=Malm%C3%B6&limit=1&bbox=11,55,24,69',
      timeoutMs: 6000,
    },
    {
      name: 'Nominatim Geocoding (OSM)',
      url: 'https://nominatim.openstreetmap.org/search?format=json&q=Stockholm&countrycodes=se&limit=1',
      timeoutMs: 6000,
    },
    {
      name: 'User Data Cloud Sync (Restful API Dev)',
      url: 'https://api.restful-api.dev/objects?id=ff808181a09d98f701a0dce86db71af9',
      timeoutMs: 7000,
    },
    {
      name: 'GitHub Pages Production',
      url: 'https://fredrikbeckman69-alt.github.io/sjoo-elbil/',
      timeoutMs: 8000,
    },
  ];

  const results = [];
  for (const ep of endpoints) {
    const res = await pingEndpoint(ep.name, ep.url, { timeoutMs: ep.timeoutMs });
    results.push(res);
  }

  const allHealthy = results.every((r) => r.status === 'healthy');
  const criticalServicesDown = results.filter((r) => r.name.includes('OSRM') && r.status === 'unreachable');

  const report = {
    updatedAt: timestamp,
    overallStatus: allHealthy ? 'stable' : criticalServicesDown.length > 0 ? 'degraded' : 'acceptable',
    summary: allHealthy
      ? 'Samtliga nätverksresurser och externa API:er fungerar optimalt.'
      : 'Vissa externa tjänster har förhöjd svarstid. Lokal svensk ortsdatabas och syntetisk vägnätsmodell hanterar rutter automatiskt utan störning.',
    activeFallbackStrategy: 'Multi-tier fallback aktiv: 1. Lokal ortsdatabas -> 2. LocalStorage -> 3. Photon -> 4. Haversine 1.25x vägmodell',
    endpoints: results,
  };

  const dataDir = path.dirname(HEALTH_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(HEALTH_FILE, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📊 Hälso- och stabilitetsrapport sparad till ${HEALTH_FILE}`);
  console.log(`Övergripande status: ${report.overallStatus.toUpperCase()}`);
}

runHealthCheck().then(() => {
  console.log('✅ Cron-kontroll för anslutningsstabilitet avslutades framgångsrikt.');
  process.exit(0);
}).catch((err) => {
  console.error('Kritiskt fel under hälskontroll:', err);
  process.exit(1);
});
