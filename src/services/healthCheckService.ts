/**
 * src/services/healthCheckService.ts
 * 
 * Hanterar klientbaserad anslutningshälsa, förvärmning av anslutningar (keepalive)
 * och inläsning av hälsorapporter från det schemalagda cron-jobbet.
 */

export interface EndpointHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unreachable';
  statusCode: number;
  latencyMs: number;
  error: string | null;
}

export interface ConnectionHealthReport {
  updatedAt: string;
  overallStatus: 'stable' | 'degraded' | 'acceptable';
  summary: string;
  activeFallbackStrategy: string;
  endpoints: EndpointHealth[];
}

let cachedHealth: ConnectionHealthReport | null = null;
let isWarmedUp = false;

/**
 * Hämtar den senast genererade hälsorapporten från det schemalagda cron-jobbet.
 */
export async function fetchConnectionHealth(): Promise<ConnectionHealthReport | null> {
  try {
    const basePath = import.meta.env.BASE_URL || '/';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const res = await fetch(`${cleanBase}data/connection_health.json?t=${Date.now()}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      cachedHealth = data;
      return data;
    }
  } catch (err) {
    console.debug('Kunde inte läsa connection_health.json:', err);
  }
  return cachedHealth;
}

/**
 * Förvärmer nätverksanslutningar (DNS-uppslag, TLS-handslag) till geokodnings-
 * och rutt-tjänsterna så att första användarsökningen sker med minimal latens.
 */
export async function warmupRoutingConnections(): Promise<void> {
  if (isWarmedUp) return;
  isWarmedUp = true;

  try {
    // Förvärm Photon CORS-anslutning med minimal timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    fetch('https://photon.komoot.io/api/?q=Sverige&limit=1&bbox=11,55,24,69', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
      .then(() => clearTimeout(timer))
      .catch(() => clearTimeout(timer));
  } catch {
    // Tyst felhantering vid förvärmning
  }
}

/**
 * Startar klientens schemalagda keepalive som med jämna mellanrum håller
 * anslutningar och cache färsk samt kontrollerar API-tillgänglighet.
 */
export function initConnectionKeepAlive(intervalMinutes = 15): () => void {
  // Kör omedelbar förvärmning
  warmupRoutingConnections();

  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(() => {
    warmupRoutingConnections();
    fetchConnectionHealth();
  }, intervalMs);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      warmupRoutingConnections();
      fetchConnectionHealth();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
