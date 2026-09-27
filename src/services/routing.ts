import { findPredefinedPlace } from '../data/swedishPlaces';

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
  isFallbackEstimate?: boolean;
}

// Lokal minnescache för adresser under sessionen
const geocodeMemoryCache = new Map<string, GeocodedPlace>();

/**
 * Hämtar cachad geokodad plats från LocalStorage eller minnescache
 */
function getCachedGeocode(cleanQuery: string): GeocodedPlace | null {
  const normKey = cleanQuery.toLowerCase();
  if (geocodeMemoryCache.has(normKey)) {
    return geocodeMemoryCache.get(normKey)!;
  }
  try {
    const raw = localStorage.getItem(`geo_${normKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
        geocodeMemoryCache.set(normKey, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignorera fel vid LocalStorage-läsning
  }
  return null;
}

/**
 * Sparar geokodad plats i minne och LocalStorage
 */
function setCachedGeocode(cleanQuery: string, place: GeocodedPlace): void {
  const normKey = cleanQuery.toLowerCase();
  geocodeMemoryCache.set(normKey, place);
  try {
    localStorage.setItem(`geo_${normKey}`, JSON.stringify(place));
  } catch {
    // Ignorera fel vid LocalStorage-skrivning
  }
}

/**
 * Haversine-beräkning av fågelavstånd i km
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Jordens radie i km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
 * Geokodar en plats med 4-stegs redundans:
 * 1. Lokal svensk ortsdatabas (0 ms, 100% offline, kraschar aldrig)
 * 2. Session / LocalStorage cache
 * 3. Photon Geocoder (CORS-vänlig, snabb, bounding box över Sverige)
 * 4. Nominatim OpenStreetMap (med timeout och felhantering)
 */
export async function geocodeAddress(query: string): Promise<GeocodedPlace | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  // 1. Kontrollera lokal svensk ortsdatabas (Malmö, Pajala, Stockholm etc.)
  const predefined = findPredefinedPlace(cleanQuery);
  if (predefined) {
    const res: GeocodedPlace = {
      displayName: `${predefined.name}, ${predefined.county}, Sverige`,
      lat: predefined.lat,
      lon: predefined.lon,
    };
    setCachedGeocode(cleanQuery, res);
    return res;
  }

  // 2. Kontrollera cache
  const cached = getCachedGeocode(cleanQuery);
  if (cached) return cached;

  // 3. Testa Photon API (Komoot OpenStreetMap)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=3&bbox=11,55,24,69`;
    const res = await fetch(photonUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features) && data.features.length > 0) {
        const feat = data.features[0];
        const [lon, lat] = feat.geometry.coordinates;
        const name = feat.properties?.name || cleanQuery;
        const county = feat.properties?.county || feat.properties?.state || 'Sverige';
        const place: GeocodedPlace = {
          displayName: `${name}, ${county}`,
          lat: Number(lat),
          lon: Number(lon),
        };
        setCachedGeocode(cleanQuery, place);
        return place;
      }
    }
  } catch (err) {
    console.warn('Photon geocoding gav fel, testar fallback:', err);
  }

  // 4. Fallback till OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&countrycodes=se&limit=1`;
    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const place: GeocodedPlace = {
          displayName: first.display_name,
          lat: parseFloat(first.lat),
          lon: parseFloat(first.lon),
        };
        setCachedGeocode(cleanQuery, place);
        return place;
      }
    }
  } catch (err) {
    console.warn('Nominatim geocoding gav fel:', err);
  }

  return null;
}

/**
 * Skapar en syntetisk ruttlinje mellan punkter om extern rutt-server inte svarar
 * Använder svensk vägkrökningsfaktor (~1.25x fågelvägen) och interpolerar delpunkter.
 */
function createSyntheticRoute(places: GeocodedPlace[]): RouteResult {
  let totalDistanceKm = 0;
  const legs: RouteLeg[] = [];
  const routeCoordinates: [number, number][] = [];

  for (let i = 0; i < places.length - 1; i++) {
    const from = places[i];
    const to = places[i + 1];
    const directKm = haversineDistanceKm(from.lat, from.lon, to.lat, to.lon);
    // Svensk vägnätsfaktor: verklig vägsträcka är ~1.22 - 1.28x fågelvägen
    const roadKm = Number((directKm * 1.25).toFixed(1));
    totalDistanceKm += roadKm;

    // Genomsnittshastighet ca 85 km/h på svenska landsvägar/motorvägar
    const legDurationSec = Math.round((roadKm / 85) * 3600);

    legs.push({
      distanceMeters: Math.round(roadKm * 1000),
      distanceKm: roadKm,
      distanceMil: Number((roadKm / 10).toFixed(1)),
      durationSeconds: legDurationSec,
      durationText: formatDuration(legDurationSec),
      fromName: from.displayName.split(',')[0],
      toName: to.displayName.split(',')[0],
    });

    // Interpolera punkter längs vägen (var 15:e km) för laddstationskorridoren
    const stepsCount = Math.max(10, Math.min(100, Math.round(roadKm / 15)));
    for (let step = 0; step <= stepsCount; step++) {
      const frac = step / stepsCount;
      const interpLat = from.lat + (to.lat - from.lat) * frac;
      const interpLon = from.lon + (to.lon - from.lon) * frac;
      routeCoordinates.push([interpLat, interpLon]);
    }
  }

  const distanceMil = Number((totalDistanceKm / 10).toFixed(1));
  const totalDurationSec = Math.round((totalDistanceKm / 85) * 3600);

  return {
    distanceMeters: Math.round(totalDistanceKm * 1000),
    distanceKm: Number(totalDistanceKm.toFixed(1)),
    distanceMil,
    durationSeconds: totalDurationSec,
    durationText: `${formatDuration(totalDurationSec)} (uppskattad körtid)`,
    startPlace: places[0].displayName.split(',')[0],
    destPlace: places[places.length - 1].displayName.split(',')[0],
    waypoints: places.slice(1, places.length - 1),
    routeCoordinates,
    legs,
    isFallbackEstimate: true,
  };
}

/**
 * Beräknar körsträcka och rutt med automatisk feltolerans och nätverksresiliens.
 * Kraschar ALDRIG med "Failed to fetch".
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
    throw new Error('Vänligen fyll i både startadress och destination.');
  }

  // 1. Geokoda alla platser med sekventiell säkerhet
  const startPlace = await geocodeAddress(cleanStart);
  if (!startPlace) {
    throw new Error(`Kunde inte hitta startadressen "${cleanStart}". Kontrollera stavningen.`);
  }

  const waypointPlaces: GeocodedPlace[] = [];
  for (let i = 0; i < cleanWaypoints.length; i++) {
    const wp = await geocodeAddress(cleanWaypoints[i]);
    if (!wp) {
      throw new Error(`Kunde inte hitta delresmål ${i + 1} "${cleanWaypoints[i]}".`);
    }
    waypointPlaces.push(wp);
  }

  const destPlace = await geocodeAddress(cleanDest);
  if (!destPlace) {
    throw new Error(`Kunde inte hitta destinationen "${cleanDest}". Kontrollera stavningen.`);
  }

  const allPlaces = [startPlace, ...waypointPlaces, destPlace];

  // 2. Anropa OSRM router med timeout och automatisk fallback
  try {
    const coordsParam = allPlaces.map((p) => `${p.lon},${p.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 sekunders timeout

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        const distanceMeters = primaryRoute.distance;
        const distanceKm = Number((distanceMeters / 1000).toFixed(1));
        const distanceMil = Number((distanceKm / 10).toFixed(1)); // 1 mil = 10 km
        const durationSeconds = primaryRoute.duration;

        let routeCoordinates: [number, number][] = [];
        if (primaryRoute.geometry && Array.isArray(primaryRoute.geometry.coordinates)) {
          routeCoordinates = primaryRoute.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        } else {
          routeCoordinates = allPlaces.map((p) => [p.lat, p.lon]);
        }

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
          isFallbackEstimate: false,
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing misslyckades eller tog för lång tid, använder svenskt vägnätsestimat:', err);
  }

  // 3. Fallback: Om OSRM är nere eller blockerad, skapa garanterad beräkning
  return createSyntheticRoute(allPlaces);
}
