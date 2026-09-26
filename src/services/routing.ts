export interface GeocodedPlace {
  displayName: string;
  lat: number;
  lon: number;
}

export interface RouteResult {
  distanceMeters: number;
  distanceKm: number;
  distanceMil: number;
  durationSeconds: number;
  durationText: string;
  startPlace: string;
  destPlace: string;
}

/**
 * Geocodar en adress via OpenStreetMap Nominatim
 */
export async function geocodeAddress(query: string): Promise<GeocodedPlace | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Kunde inte söka adress (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const first = data[0];
    return {
      displayName: first.display_name,
      lat: parseFloat(first.lat),
      lon: parseFloat(first.lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

/**
 * Formaterar sekunder till läsbar restid på svenska (t.ex. "1 tim 45 min" eller "25 min")
 */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} tim ${minutes > 0 ? `${minutes} min` : ''}`.trim();
  }
  return `${minutes} min`;
}

/**
 * Beräknar körsträcka och rutt mellan två platser via OSRM Driving API
 */
export async function calculateRoute(startQuery: string, destQuery: string): Promise<RouteResult> {
  if (!startQuery.trim() || !destQuery.trim()) {
    throw new Error('Ange både start- och destinationsadress');
  }

  // 1. Geokoda båda adresserna
  const [startPlace, destPlace] = await Promise.all([
    geocodeAddress(startQuery),
    geocodeAddress(destQuery),
  ]);

  if (!startPlace) {
    throw new Error(`Kunde inte hitta startadressen: "${startQuery}"`);
  }
  if (!destPlace) {
    throw new Error(`Kunde inte hitta destinationen: "${destQuery}"`);
  }

  // 2. Anropa OSRM router
  // Obs: OSRM förväntar sig lon,lat;lon,lat
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startPlace.lon},${startPlace.lat};${destPlace.lon},${destPlace.lat}?overview=false`;

  const response = await fetch(osrmUrl);
  if (!response.ok) {
    throw new Error(`Kunde inte beräkna rutt via routing-tjänst (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('Ingen körbar bilrutt hittades mellan adresserna');
  }

  const primaryRoute = data.routes[0];
  const distanceMeters = primaryRoute.distance;
  const distanceKm = Number((distanceMeters / 1000).toFixed(1));
  const distanceMil = Number((distanceKm / 10).toFixed(1)); // 1 mil = 10 km
  const durationSeconds = primaryRoute.duration;

  return {
    distanceMeters,
    distanceKm,
    distanceMil,
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    startPlace: startPlace.displayName.split(',')[0],
    destPlace: destPlace.displayName.split(',')[0],
  };
}
