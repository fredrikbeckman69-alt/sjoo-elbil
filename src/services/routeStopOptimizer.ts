import { ChargingStation, VehicleProfile, TripConditions, StationFacility } from '../types';
import { getInitialChargingStations } from './chargingStations';
import {
  calculateEffectiveConsumption,
  kwhPer100KmToKwhPerMil,
} from '../utils/calculations';
import {
  formatPhysicalAddressForStation,
  resolveCorridorPhysicalAddress,
} from './chargingAddressService';
import { getEffectivePriceWithMemberships } from './spotPriceService';

export interface OptimalChargingStop {
  station: ChargingStation;
  milestoneMil: number; // Avstånd från start till stoppet (i mil)
  milestoneKm: number;
  batteryArrivalPercent: number; // Batteriprocent vid ankomst (t.ex. 15%)
  batteryDeparturePercent: number; // Batteriprocent vid avresa (t.ex. 80%)
  kwhToCharge: number; // Energimängd som laddas
  chargingTimeMinutes: number; // Beräknad laddtid i minuter
  costSek: number; // Kostnad för detta laddstopp
  operatorName: string;
  powerKw: number;
  streetAndCity: string;
  address: string; // Verifierad fullständig fysisk adress
  city?: string;
  coordinates?: [number, number];
  facilities?: StationFacility[];
}

export interface RouteOptimizationResult {
  stops: OptimalChargingStop[];
  totalStops: number;
  totalChargingTimeMinutes: number;
  totalFastChargeKwh: number;
  totalFastChargeCostSek: number;
  homeChargeKwh: number;
  homeChargeCostSek: number;
  totalTripCostSek: number;
  costPerMilSek: number;
  isCoveredWithoutStops: boolean;
  operatorAvailableAlongRoute: boolean;
  alternativeOperatorsNearby?: { operatorName: string; count: number; closestMilestoneMil: number }[];
}

/**
 * Beräknar avstånd (i km) mellan två koordinater med Haversine-formeln
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Kontrollerar om en station matchar vald operatör
 */
function matchesOperator(station: ChargingStation, operatorId: string): boolean {
  if (operatorId === 'all' || operatorId === 'best') return true;

  const opLower = (station.operator || '').toLowerCase();
  const nameLower = (station.name || '').toLowerCase();

  switch (operatorId) {
    case 'tesla-supercharger':
      return opLower.includes('tesla') || nameLower.includes('tesla');
    case 'ionity':
      return opLower.includes('ionity') || nameLower.includes('ionity');
    case 'circle-k':
      return opLower.includes('circle k') || nameLower.includes('circle k');
    case 'incharge':
      return opLower.includes('incharge') || opLower.includes('vattenfall');
    case 'recharge':
      return opLower.includes('recharge') || opLower.includes('fortum');
    case 'okq8':
      return opLower.includes('okq8') || opLower === 'ok' || nameLower.includes('okq8');
    case 'mer':
      return opLower.includes('mer') || nameLower.includes('mer ');
    case 'virta':
      return opLower.includes('virta');
    case 'allego':
      return opLower.includes('allego');
    case 'eon':
    case 'e.on-drive':
      return opLower.includes('e.on') || opLower.includes('eon');
    case 'uno-x':
      return opLower.includes('uno-x') || opLower.includes('unox');
    default:
      return opLower.includes(operatorId.toLowerCase()) || nameLower.includes(operatorId.toLowerCase());
  }
}

/**
 * Hämta standard snabbladdareffekt för en operatör om stationen saknar maxPowerKw
 */
function getOperatorDefaultPowerKw(operatorId: string, station: ChargingStation): number {
  if (station.maxPowerKw && station.maxPowerKw > 0) return station.maxPowerKw;
  if (operatorId === 'ionity') return 350;
  if (operatorId === 'tesla-supercharger') return 250;
  if (operatorId === 'circle-k' || operatorId === 'okq8' || operatorId === 'recharge') return 150;
  return 120;
}

/**
 * Huvudfunktion: Hitta optimala laddstopp längs rutten och beräkna realistisk reskostnad
 */
export function findOptimalChargingStopsAlongRoute(params: {
  routeCoordinates?: [number, number][]; // [lat, lon] längs hela rutten
  totalDistanceMil: number;
  startAddress?: string;
  destAddress?: string;
  operatorId: string;
  operatorName: string;
  pricePerKwh: number;
  sessionFee?: number;
  homePricePerKwh?: number;
  vehicle: VehicleProfile;
  conditions: TripConditions;
  startBatteryPercent?: number; // T.ex. 100%
  targetArrivalBufferPercent?: number; // T.ex. 15%
  activeMemberships?: string[];
}): RouteOptimizationResult {
  const {
    routeCoordinates = [],
    totalDistanceMil,
    startAddress = '',
    destAddress = '',
    operatorId,
    operatorName,
    pricePerKwh,
    sessionFee = 0,
    homePricePerKwh = 1.15,
    vehicle,
    conditions,
    startBatteryPercent = 100,
    targetArrivalBufferPercent = 15,
    activeMemberships = [],
  } = params;

  // Beräkna effektivt snabbladdningspris med eventuella medlemskap/laddbrickor
  const effectivePriceInfo = getEffectivePriceWithMemberships(operatorId, pricePerKwh, activeMemberships);
  const fastPricePerKwh = effectivePriceInfo.price;

  // 1. Beräkna effektiv förbrukning
  const { effectiveKwhPer100Km } = calculateEffectiveConsumption(vehicle.consumptionKwhPer100Km, conditions);
  const effectiveKwhPerMil = kwhPer100KmToKwhPerMil(effectiveKwhPer100Km);

  // Total energi som hela resan kräver
  const totalEnergyNeededKwh = Number((totalDistanceMil * effectiveKwhPerMil).toFixed(1));

  // Energi i batteriet vid start
  const batteryCap = vehicle.batteryCapacityKwh;
  const startEnergyKwh = (batteryCap * startBatteryPercent) / 100;
  const bufferEnergyKwh = (batteryCap * targetArrivalBufferPercent) / 100;

  // Användbar energi från hemmet innan första laddning behövs
  const usableStartEnergyKwh = Math.max(0, startEnergyKwh - bufferEnergyKwh);
  const initialRangeMil = usableStartEnergyKwh > 0 ? Number((usableStartEnergyKwh / effectiveKwhPerMil).toFixed(1)) : 0;

  // Om resan klaras helt på startbatteriet utan laddstopp
  if (totalDistanceMil <= initialRangeMil || totalEnergyNeededKwh <= usableStartEnergyKwh) {
    const homeKwh = totalEnergyNeededKwh;
    const homeCost = Number((homeKwh * homePricePerKwh).toFixed(0));
    return {
      stops: [],
      totalStops: 0,
      totalChargingTimeMinutes: 0,
      totalFastChargeKwh: 0,
      totalFastChargeCostSek: 0,
      homeChargeKwh: homeKwh,
      homeChargeCostSek: homeCost,
      totalTripCostSek: homeCost,
      costPerMilSek: totalDistanceMil > 0 ? Number((homeCost / totalDistanceMil).toFixed(2)) : 0,
      isCoveredWithoutStops: true,
      operatorAvailableAlongRoute: true,
    };
  }

  // 2. Identifiera stationer längs rutten
  const allStations = getInitialChargingStations();
  const maxCorridorKm = 10; // Max 10 km från motorvägen / rutten

  // Skapa milstolpar längs ruttkoordinaterna
  const routePointsWithMil: { lat: number; lon: number; cumulativeMil: number }[] = [];
  let cumDistanceKm = 0;
  if (routeCoordinates.length > 0) {
    routePointsWithMil.push({ lat: routeCoordinates[0][0], lon: routeCoordinates[0][1], cumulativeMil: 0 });
    for (let i = 1; i < routeCoordinates.length; i++) {
      const prev = routeCoordinates[i - 1];
      const curr = routeCoordinates[i];
      const segKm = haversineDistanceKm(prev[0], prev[1], curr[0], curr[1]);
      cumDistanceKm += segKm;
      routePointsWithMil.push({ lat: curr[0], lon: curr[1], cumulativeMil: Number((cumDistanceKm / 10).toFixed(2)) });
    }
  }

  // Skalningsfaktor om OSRM-linjen har en viss längd men totalDistanceMil är angiven
  const routeEndMil = routePointsWithMil.length > 0 ? routePointsWithMil[routePointsWithMil.length - 1].cumulativeMil : totalDistanceMil;
  const distanceScale = routeEndMil > 0 ? totalDistanceMil / routeEndMil : 1;

  // Hitta stationer inom korridoren och beräkna deras milstolpe
  interface StationOnRoute {
    station: ChargingStation;
    milestoneMil: number;
    distanceToRouteKm: number;
    matchesOp: boolean;
  }

  const stationsOnRoute: StationOnRoute[] = [];

  // Om vi har ruttkoordinater: projicera mot rutten
  if (routePointsWithMil.length > 1) {
    for (const station of allStations) {
      if (
        station.lat < 55.0 ||
        station.lat > 69.5 ||
        station.lon < 10.5 ||
        station.lon > 24.5
      ) {
        continue;
      }

      let minDistanceKm = Infinity;
      let closestPointMil = 0;

      const step = Math.max(1, Math.floor(routePointsWithMil.length / 100));
      for (let i = 0; i < routePointsWithMil.length; i += step) {
        const pt = routePointsWithMil[i];
        const dist = haversineDistanceKm(station.lat, station.lon, pt.lat, pt.lon);
        if (dist < minDistanceKm) {
          minDistanceKm = dist;
          closestPointMil = pt.cumulativeMil * distanceScale;
        }
      }

      if (minDistanceKm <= maxCorridorKm && closestPointMil > 0.5 && closestPointMil < totalDistanceMil - 0.5) {
        const matchesOp = matchesOperator(station, operatorId);
        stationsOnRoute.push({
          station,
          milestoneMil: Number(closestPointMil.toFixed(1)),
          distanceToRouteKm: minDistanceKm,
          matchesOp,
        });
      }
    }
  }

  // Sortera stationer längs vägen efter körsträcka från start
  stationsOnRoute.sort((a, b) => a.milestoneMil - b.milestoneMil);

  // Filtrera de som matchar vald operatör och är snabbladdare (CCS eller hög effekt)
  const operatorStationsOnRoute = stationsOnRoute.filter(
    (s) => s.matchesOp && (s.station.ccs === true || (s.station.maxPowerKw && s.station.maxPowerKw >= 50) || operatorId === 'tesla-supercharger' || operatorId === 'ionity')
  );

  const operatorAvailableAlongRoute = operatorStationsOnRoute.length > 0;

  // 3. Simulera stopp längs vägen
  const stops: OptimalChargingStop[] = [];
  const rangeOn80Percent = Number(((batteryCap * 0.65) / effectiveKwhPerMil).toFixed(1)); // Från 80% ned till 15% buffer
  let currentMilestone = 0;
  let currentRangeMil = initialRangeMil;
  let remainingMil = totalDistanceMil;
  let currentBatteryPercent = startBatteryPercent;

  const is800V = vehicle.voltageArchitecture === '800V';
  const carMaxChargePowerKw = is800V ? 240 : (batteryCap <= 60 ? 135 : 175);

  // Dynamiskt tak för att skydda mot oändliga loopar utan att begränsa långa resor (t.ex. Malmö–Pajala/Treriksröset)
  const maxAllowedStops = Math.max(30, Math.ceil(totalDistanceMil / 5));
  while (remainingMil > currentRangeMil && stops.length < maxAllowedStops) {
    const idealMilestone = currentMilestone + currentRangeMil * 0.85;

    let chosenStation: StationOnRoute | null = null;
    let minDiff = Infinity;

    if (operatorAvailableAlongRoute) {
      for (const st of operatorStationsOnRoute) {
        if (st.milestoneMil > currentMilestone + 3 && st.milestoneMil <= currentMilestone + currentRangeMil * 0.98) {
          const diff = Math.abs(st.milestoneMil - idealMilestone);
          if (diff < minDiff) {
            minDiff = diff;
            chosenStation = st;
          }
        }
      }
    }

    if (!chosenStation) {
      minDiff = Infinity;
      for (const st of stationsOnRoute) {
        if (
          st.milestoneMil > currentMilestone + 3 &&
          st.milestoneMil <= currentMilestone + currentRangeMil * 0.98 &&
          (st.station.ccs === true || (st.station.maxPowerKw && st.station.maxPowerKw >= 50))
        ) {
          const diff = Math.abs(st.milestoneMil - idealMilestone);
          if (diff < minDiff) {
            minDiff = diff;
            chosenStation = st;
          }
        }
      }
    }

    const stopMilestone = chosenStation
      ? chosenStation.milestoneMil
      : Number(Math.min(idealMilestone, currentMilestone + currentRangeMil * 0.85).toFixed(1));

    // Förhindra oändlig loop eller stopp bakåt/på samma plats
    if (stopMilestone <= currentMilestone + 0.5) {
      break;
    }

    // Körsträcka sedan förra stoppet (eller start)
    const distanceDrivenSinceLast = stopMilestone - currentMilestone;
    const energyUsedKwh = distanceDrivenSinceLast * effectiveKwhPerMil;
    const batteryPercentUsed = (energyUsedKwh / batteryCap) * 100;
    const arrivalPercent = Math.max(5, Math.round(currentBatteryPercent - batteryPercentUsed));

    // Avstånd och energibehov kvar till slutdestinationen
    const distanceToDest = totalDistanceMil - stopMilestone;
    const energyNeededToDestKwh = distanceToDest * effectiveKwhPerMil + bufferEnergyKwh;
    const batteryPercentNeededToDest = Math.ceil((energyNeededToDestKwh / batteryCap) * 100);

    // Om bilen vid ankomst redan har tillräckligt med batteri för att nå målet med marginal behövs inget laddstopp här!
    if (arrivalPercent >= batteryPercentNeededToDest) {
      break;
    }

    // Beräkna målavreseprocent: ladda ALLTID till en nivå högre än ankomstprocenten
    let targetDeparturePercent: number;
    if (distanceToDest <= rangeOn80Percent) {
      // Sista etappen till målet: ladda precis vad som behövs plus marginal (minst +10%)
      targetDeparturePercent = Math.min(85, Math.max(arrivalPercent + 10, batteryPercentNeededToDest + 5));
    } else {
      // Långt kvar: ladda upp mot 80% (minst +15% över ankomstprocenten)
      targetDeparturePercent = Math.min(85, Math.max(80, arrivalPercent + 15));
    }

    // Säkerställ strikt att avreseprocenten alltid är större än ankomstprocenten (minst 5% laddning)
    if (targetDeparturePercent <= arrivalPercent) {
      targetDeparturePercent = Math.min(85, arrivalPercent + 10);
    }

    // Förkonditionering vid kyla förbrukar ca 1.5 kWh för att förvärma batteripaketet
    const precondEnergyKwh = (conditions.isWinter && conditions.preconditioning) ? 1.5 : 0;
    const rawKwhToCharge = (((targetDeparturePercent - arrivalPercent) / 100) * batteryCap);
    const kwhToCharge = Number(Math.max(0, rawKwhToCharge + precondEnergyKwh).toFixed(1));

    // Kostnad: ALDRIG negativ! Använder eventuellt medlemskapspris
    const costSek = kwhToCharge > 0 ? Math.max(0, Number((kwhToCharge * fastPricePerKwh + sessionFee).toFixed(0))) : 0;

    const stationPower = chosenStation
      ? getOperatorDefaultPowerKw(operatorId, chosenStation.station)
      : (operatorId === 'ionity' ? 350 : operatorId === 'tesla-supercharger' ? 250 : 150);

    const effectiveChargeKw = Math.min(carMaxChargePowerKw, stationPower) * (is800V ? 0.88 : 0.78);
    let chargingTimeMinutes = Math.max(8, Math.round((kwhToCharge / effectiveChargeKw) * 60) + (is800V ? 2 : 3));

    // 800V-arkitektur (Ioniq 5/6, EV6/9, Porsche Taycan): Laddar 10-80% på ca 18 min vid 250-350 kW laddare
    if (is800V && stationPower >= 175) {
      chargingTimeMinutes = Math.max(10, Math.round(chargingTimeMinutes * 0.68));
    }

    // Påverkan vid låga temperaturer och förkonditionering
    if (conditions.isWinter) {
      if (conditions.preconditioning) {
        // Värmt batteri tar emot full laddeffekt från start, ingen köldspärr ("cold-gate")
        chargingTimeMinutes = Math.max(10, Math.round(chargingTimeMinutes * 0.75));
      } else {
        // Kalla battericeller begränsar laddeffekten avsevärt under de första 10-15 minuterna
        chargingTimeMinutes = Math.round(chargingTimeMinutes * 1.25);
      }
    }

    // Fastställ station, fysisk adress och plats
    let stationObj: ChargingStation;
    let finalAddress = '';
    let finalStreetAndCity = '';
    let stopCoords: [number, number] | undefined = undefined;

    if (chosenStation?.station) {
      const s = chosenStation.station;
      const enriched = formatPhysicalAddressForStation(s, operatorId);
      finalAddress = enriched.address;
      finalStreetAndCity = enriched.address;
      stopCoords = s.lat && s.lon ? [s.lat, s.lon] : undefined;

      stationObj = {
        ...s,
        street: s.street || enriched.street,
        city: s.city || enriched.city,
        facilities: enriched.facilities || s.facilities || ['wc', 'food'],
      };
    } else {
      // Hitta koordinat längs ruttlinjen om sådan finns
      let approxPt: [number, number] | undefined = undefined;
      if (routePointsWithMil.length > 0) {
        let bestDist = Infinity;
        for (const pt of routePointsWithMil) {
          const d = Math.abs(pt.cumulativeMil * distanceScale - stopMilestone);
          if (d < bestDist) {
            bestDist = d;
            approxPt = [pt.lat, pt.lon];
          }
        }
      }

      const corridor = resolveCorridorPhysicalAddress({
        milestoneMil: stopMilestone,
        totalDistanceMil,
        startAddress,
        destAddress,
        operatorId,
        operatorName,
        coordinates: approxPt,
      });

      finalAddress = corridor.address;
      finalStreetAndCity = corridor.address;
      stopCoords = corridor.coordinates;

      stationObj = {
        id: 999000 + stops.length,
        name: corridor.stationName,
        lat: corridor.coordinates[0],
        lon: corridor.coordinates[1],
        operator: operatorName,
        capacity: 8,
        ccs: true,
        chademo: false,
        type2: false,
        maxPowerKw: stationPower,
        street: corridor.address.split(',')[0],
        city: corridor.city,
        facilities: corridor.facilities || ['wc', 'food', 'coffee'],
      };
    }

    stops.push({
      station: stationObj,
      milestoneMil: stopMilestone,
      milestoneKm: Math.round(stopMilestone * 10),
      batteryArrivalPercent: arrivalPercent,
      batteryDeparturePercent: targetDeparturePercent,
      kwhToCharge,
      chargingTimeMinutes,
      costSek,
      operatorName: chosenStation?.station.operator || operatorName,
      powerKw: stationPower,
      streetAndCity: finalStreetAndCity,
      address: finalAddress,
      city: stationObj.city || undefined,
      coordinates: stopCoords,
      facilities: stationObj.facilities,
    });

    currentBatteryPercent = targetDeparturePercent;
    currentMilestone = stopMilestone;
    const usableBatteryPercentAfterStop = Math.max(0, targetDeparturePercent - targetArrivalBufferPercent);
    currentRangeMil = Number(((usableBatteryPercentAfterStop / 100) * batteryCap / effectiveKwhPerMil).toFixed(1));
    remainingMil = totalDistanceMil - currentMilestone;
  }

  // 4. Sammanställ totala kostnader och tider
  const totalFastChargeKwh = Number(stops.reduce((sum, s) => sum + s.kwhToCharge, 0).toFixed(1));
  const totalFastChargeCostSek = stops.reduce((sum, s) => sum + s.costSek, 0);
  const totalChargingTimeMinutes = stops.reduce((sum, s) => sum + s.chargingTimeMinutes, 0);

  const homeChargeKwh = Number(Math.min(totalEnergyNeededKwh, startEnergyKwh).toFixed(1));
  const homeChargeCostSek = Number((homeChargeKwh * homePricePerKwh).toFixed(0));

  const totalTripCostSek = homeChargeCostSek + totalFastChargeCostSek;
  const costPerMilSek = totalDistanceMil > 0 ? Number((totalTripCostSek / totalDistanceMil).toFixed(2)) : 0;

  let alternativeOperatorsNearby: { operatorName: string; count: number; closestMilestoneMil: number }[] | undefined = undefined;
  if (!operatorAvailableAlongRoute && stationsOnRoute.length > 0) {
    const map: Record<string, { count: number; closestMilestoneMil: number }> = {};
    for (const s of stationsOnRoute) {
      const op = s.station.operator || 'Övrig';
      if (!map[op]) {
        map[op] = { count: 1, closestMilestoneMil: s.milestoneMil };
      } else {
        map[op].count += 1;
        if (s.milestoneMil < map[op].closestMilestoneMil) {
          map[op].closestMilestoneMil = s.milestoneMil;
        }
      }
    }
    alternativeOperatorsNearby = Object.entries(map)
      .map(([name, data]) => ({ operatorName: name, count: data.count, closestMilestoneMil: data.closestMilestoneMil }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  return {
    stops,
    totalStops: stops.length,
    totalChargingTimeMinutes,
    totalFastChargeKwh,
    totalFastChargeCostSek,
    homeChargeKwh,
    homeChargeCostSek,
    totalTripCostSek,
    costPerMilSek,
    isCoveredWithoutStops: false,
    operatorAvailableAlongRoute,
    alternativeOperatorsNearby,
  };
}
