export interface GeocodedPlace {
  displayName: string;
  lat: number;
  lon: number;
}

export interface RouteLeg {
  distanceMeters: number;
  distanceKm: number;
  distanceMil: number;
  durationSeconds: number;
  durationText: string;
  fromName: string;
  toName: string;
}

export interface RouteResult {
  distanceMeters: number;
  distanceKm: number;
  distanceMil: number;
  durationSeconds: number;
  durationText: string;
  startPlace: string;
  destPlace: string;
  waypoints?: GeocodedPlace[];
  routeCoordinates?: [number, number][]; // [lat, lon]
  legs?: RouteLeg[];
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
 * Beräknar körsträcka och rutt mellan start, valfria delresmål och slutdestination via OSRM Driving API
 */
export async function calculateRoute(
  startQuery: string,
  destQuery: string,
  waypointQueries: string[] = []
): Promise<RouteResult> {
  const cleanStart = startQuery.trim();
  const cleanDest = destQuery.trim();
  const cleanWaypoints = waypointQueries.map((w) => w.trim()).filter((w) => w.length > 0);

  if (!cleanStart || !cleanDest) {
    throw new Error('Ange både start- och destinationsadress');
  }

  // 1. Geokoda alla platser (start, delresmål och destination)
  const geocodePromises: Promise<GeocodedPlace | null>[] = [
    geocodeAddress(cleanStart),
    ...cleanWaypoints.map((w) => geocodeAddress(w)),
    geocodeAddress(cleanDest),
  ];

  const results = await Promise.all(geocodePromises);
  const startPlace = results[0];
  const destPlace = results[results.length - 1];
  const waypointPlaces = results.slice(1, results.length - 1) as GeocodedPlace[];

  if (!startPlace) {
    throw new Error(`Kunde inte hitta startadressen: "${cleanStart}"`);
  }
  for (let i = 0; i < cleanWaypoints.length; i++) {
    if (!waypointPlaces[i]) {
      throw new Error(`Kunde inte hitta delresmål ${i + 1}: "${cleanWaypoints[i]}"`);
    }
  }
  if (!destPlace) {
    throw new Error(`Kunde inte hitta destinationen: "${cleanDest}"`);
  }

  const allPlaces = [startPlace, ...waypointPlaces, destPlace];

  // 2. Anropa OSRM router med alla koordinater
  // OSRM: lon1,lat1;lon2,lat2;...
  const coordsParam = allPlaces.map((p) => `${p.lon},${p.lat}`).join(';');
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

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

  // Extrahera ruttens geometriska koordinater [lat, lon]
  let routeCoordinates: [number, number][] = [];
  if (primaryRoute.geometry && Array.isArray(primaryRoute.geometry.coordinates)) {
    // GeoJSON är [lon, lat], konvertera till [lat, lon]
    routeCoordinates = primaryRoute.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  } else {
    // Fallback: skapa linje mellan de geokodade platserna
    routeCoordinates = allPlaces.map((p) => [p.lat, p.lon]);
  }

  // Extrahera delsträckor (legs)
  const legs: RouteLeg[] = [];
  if (Array.isArray(primaryRoute.legs)) {
    for (let i = 0; i < primaryRoute.legs.length; i++) {
      const leg = primaryRoute.legs[i];
      const fromName = allPlaces[i]?.displayName.split(',')[0] || `Plats ${i + 1}`;
      const toName = allPlaces[i + 1]?.displayName.split(',')[0] || `Plats ${i + 2}`;
      const legDistKm = Number((leg.distance / 1000).toFixed(1));
      legs.push({
        distanceMeters: leg.distance,
        distanceKm: legDistKm,
        distanceMil: Number((legDistKm / 10).toFixed(1)),
        durationSeconds: leg.duration,
        durationText: formatDuration(leg.duration),
        fromName,
        toName,
      });
    }
  }

  return {
    distanceMeters,
    distanceKm,
    distanceMil,
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    startPlace: startPlace.displayName.split(',')[0],
    destPlace: destPlace.displayName.split(',')[0],
    waypoints: waypointPlaces,
    routeCoordinates,
    legs,
  };
}
