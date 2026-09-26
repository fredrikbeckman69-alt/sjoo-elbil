import { VehicleProfile, ChargingScenario, ScenarioResult, TripConditions, RoadTripAnalysis, ChecklistItem } from '../types';

export const DEFAULT_VEHICLE: VehicleProfile = {
  name: 'Min Elbil',
  consumptionKwhPer100Km: 18.04, // Motsvarar 1.804 kWh/mil
  batteryCapacityKwh: 77.0,
};

export const DEFAULT_TRIP_CONDITIONS: TripConditions = {
  isWinter: false,
  hasRoofBox: false,
  isHighwaySpeed: true, // På långresor kör man normalt motorväg
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'charge-100',
    text: 'Ladda till 100% hemma kvällen före avresa',
    description: 'Börja med fullt batteri till lägsta möjliga hemmataxa.',
    completed: false,
  },
  {
    id: 'preheat',
    text: 'Förvärm kupén och batteriet via bilens app',
    description: 'Görs 20–30 min innan avfärd medan laddkabeln fortfarande är ansluten, så sparas räckvidd!',
    completed: false,
  },
  {
    id: 'tire-pressure',
    text: 'Kontrollera däcktrycket (öka gärna +0,2 bar vid full last)',
    description: 'Rätt däcktryck sänker rullmotståndet och kan spara 5–10% energi på motorväg.',
    completed: false,
  },
  {
    id: 'apps-ready',
    text: 'Se till att relevanta laddappar är installerade',
    description: 'Circle K, Tesla (öppen för alla), Ionity och EasyPark/Incharge underlättar enormt.',
    completed: false,
  },
  {
    id: 'charge-window',
    text: 'Ladda smart: 10% till 80% längs vägen',
    description: 'Elbilar laddar mycket långsammare över 80%. Det går snabbare att ta två korta stopp än ett långt.',
    completed: false,
  },
];

export const DEFAULT_SCENARIOS: ChargingScenario[] = [
  {
    id: 'home-night',
    name: 'Hemmaladdning Natt',
    description: 'Timpris eller nattaxa vid egen laddbox (inkl. elöverföring och skatt)',
    pricePerKwh: 1.15,
    monthlyFee: 0,
    sessionFee: 0,
    badgeColor: 'emerald',
    isDefault: true,
  },
  {
    id: 'home-day',
    name: 'Hemmaladdning Dag',
    description: 'Rörligt elpris dagtid / normalpris hemma',
    pricePerKwh: 1.95,
    monthlyFee: 0,
    sessionFee: 0,
    badgeColor: 'blue',
    isDefault: true,
  },
  {
    id: 'fast-dc',
    name: 'Snabbladdare / DC',
    description: 'Publik snabbladdning längs motorväg (Ionity, Tesla öppen, m.fl.)',
    pricePerKwh: 4.95,
    monthlyFee: 0,
    sessionFee: 0,
    badgeColor: 'amber',
    isDefault: true,
  },
  {
    id: 'subscription-charge',
    name: 'Laddabonnemang (Laddbox/Publik)',
    description: 'Fast månadskostnad med rabatterat kWh-pris',
    pricePerKwh: 1.35,
    monthlyFee: 149,
    sessionFee: 0,
    badgeColor: 'purple',
    isDefault: true,
  },
];

// Benchmark för referens mot bensinbil (uppdateras dynamiskt i appen)
export const PETROL_BENCHMARK = {
  litersPerMil: 0.65,
  pricePerLiter: 17.69, // Aktuellt svenskt genomsnittligt bensinpris
  get costPerMil() {
    return Number((this.litersPerMil * this.pricePerLiter).toFixed(2)); // ~11.50 kr/mil vid 17,69 kr
  }
};

/**
 * Omvandlar förbrukning från kWh/100 km till svensk standard kWh/mil.
 * 1 mil = 10 km, alltså: (kWh / 100 km) * (10 km / mil) = kWh/100 * 10 = kWh / 10
 */
export function kwhPer100KmToKwhPerMil(kwhPer100Km: number): number {
  return Number((kwhPer100Km / 10).toFixed(3));
}

/**
 * Omvandlar kWh/mil till kWh/100 km
 */
export function kwhPerMilToKwhPer100Km(kwhPerMil: number): number {
  return Number((kwhPerMil * 10).toFixed(2));
}

/**
 * Beräknar effektiv förbrukning baserat på yttre faktorer (kyla, takbox, motorväg)
 */
export function calculateEffectiveConsumption(
  baseKwhPer100Km: number,
  conditions: TripConditions
): { effectiveKwhPer100Km: number; increasePercent: number } {
  let multiplier = 1.0;

  if (conditions.isWinter) multiplier += 0.20; // +20% i kyla
  if (conditions.hasRoofBox) multiplier += 0.15; // +15% med takbox
  if (conditions.isHighwaySpeed) multiplier += 0.15; // +15% i 110-120 km/h

  const effectiveKwhPer100Km = Number((baseKwhPer100Km * multiplier).toFixed(2));
  const increasePercent = Math.round((multiplier - 1.0) * 100);

  return { effectiveKwhPer100Km, increasePercent };
}

/**
 * Beräknar uppskattad räckvidd i mil och km baserat på batterikapacitet och förbrukning
 */
export function calculateRange(batteryKwh: number, kwhPer100Km: number): { rangeKm: number; rangeMil: number } {
  if (kwhPer100Km <= 0) return { rangeKm: 0, rangeMil: 0 };
  const rangeKm = Math.round((batteryKwh / kwhPer100Km) * 100);
  const rangeMil = Number((rangeKm / 10).toFixed(1));
  return { rangeKm, rangeMil };
}

/**
 * Simulerar och analyserar en långresa specifikt anpassad för sällananvändare
 */
export function calculateRoadTripAnalysis(
  distanceMil: number,
  baseConsumptionKwhPer100Km: number,
  batteryCapacityKwh: number,
  conditions: TripConditions,
  startBatteryPercent: number = 100,
  arrivalBufferPercent: number = 15,
  homePricePerKwh: number = 1.15,
  fastPricePerKwh: number = 4.95,
  petrolPricePerLiter: number = PETROL_BENCHMARK.pricePerLiter
): RoadTripAnalysis {
  const { effectiveKwhPer100Km } = calculateEffectiveConsumption(baseConsumptionKwhPer100Km, conditions);
  const effectiveKwhPerMil = kwhPer100KmToKwhPerMil(effectiveKwhPer100Km);
  const { rangeKm: effectiveRangeKm, rangeMil: effectiveRangeMil } = calculateRange(batteryCapacityKwh, effectiveKwhPer100Km);

  // Total energi som hela resan kräver
  const energyNeededKwh = Number((distanceMil * effectiveKwhPerMil).toFixed(1));

  // Energi i batteriet vid start (från hemmaladdning)
  const startEnergyKwh = (batteryCapacityKwh * startBatteryPercent) / 100;
  // Säkerhetsmarginal som ska finnas kvar vid ankomst
  const bufferEnergyKwh = (batteryCapacityKwh * arrivalBufferPercent) / 100;

  // Hur mycket energi från batteriet vid start kan vi förbruka?
  const usableStartEnergyKwh = Math.max(0, startEnergyKwh - bufferEnergyKwh);

  // Behövs laddning längs vägen?
  let highwayKwh = 0;
  let stopsCount = 0;
  let chargingTimeMinutes = 0;

  if (energyNeededKwh > usableStartEnergyKwh) {
    // Energi som måste tillföras via snabbladdare längs vägen
    highwayKwh = Number((energyNeededKwh - usableStartEnergyKwh).toFixed(1));

    // På en snabbladdare laddar man normalt optimalt i fönstret 10% -> 80% (dvs 70% av batterikapaciteten)
    const optimalFastSessionKwh = Math.max(15, batteryCapacityKwh * 0.70);
    stopsCount = Math.ceil(highwayKwh / optimalFastSessionKwh);

    // Genomsnittlig laddeffekt på moderna snabbladdare (150-300 kW laddare ger ca 90-110 kW i snitteffekt över sessionen)
    const avgChargePowerKw = 95;
    // Beräkna ren laddtid i minuter
    const rawChargeMinutes = Math.round((highwayKwh / avgChargePowerKw) * 60);
    // Lägg till 5 min per stopp för parkering, kabel och igångsättning
    chargingTimeMinutes = rawChargeMinutes + stopsCount * 5;
  }

  // Energi från hemmet är max vad batteriet rymmer eller vad resan kräver
  const homeKwh = Number(Math.min(energyNeededKwh, startEnergyKwh).toFixed(1));

  // Realistisk kombinerad kostnad:
  // (Hemmaladdad energi vid start * hemmataxa) + (Snabbladdad energi längs vägen * snabbladdartaxa)
  const realisticCost = Number(((homeKwh * homePricePerKwh) + (highwayKwh * fastPricePerKwh)).toFixed(0));

  // Jämförelse: Om man mot förmodan skulle snabbladda 100%
  const cost100PercentFast = Number((energyNeededKwh * fastPricePerKwh).toFixed(0));

  // Bensinreferens baserad på aktuellt genomsnittligt bensinpris
  const petrolCostPerMil = Number((PETROL_BENCHMARK.litersPerMil * petrolPricePerLiter).toFixed(2));
  const petrolCost = Number((distanceMil * petrolCostPerMil).toFixed(0));
  const savingsVsPetrol = Number(Math.max(0, petrolCost - realisticCost).toFixed(0));

  return {
    effectiveConsumptionKwhPer100Km: effectiveKwhPer100Km,
    effectiveKwhPerMil,
    effectiveRangeMil,
    effectiveRangeKm,
    energyNeededKwh,
    stopsCount,
    chargingTimeMinutes,
    homeKwh,
    highwayKwh,
    realisticCost,
    cost100PercentFast,
    petrolCost,
    savingsVsPetrol,
    startBatteryPercent,
    arrivalBufferPercent,
  };
}

/**
 * Beräknar nyckeltal för alla scenarier givet distans och månadskörsträcka
 */
export function calculateScenarioResults(
  scenarios: ChargingScenario[],
  consumptionKwhPer100Km: number,
  tripDistanceMil: number,
  monthlyDistanceMil: number,
  petrolPricePerLiter: number = PETROL_BENCHMARK.pricePerLiter
): {
  results: ScenarioResult[];
  cheapestTripId: string;
  cheapestMonthlyId: string;
  energyNeededTripKwh: number;
} {
  const kwhPerMil = kwhPer100KmToKwhPerMil(consumptionKwhPer100Km);
  const energyNeededTripKwh = Number((tripDistanceMil * kwhPerMil).toFixed(2));
  const monthlyEnergyKwh = monthlyDistanceMil * kwhPerMil;

  const petrolCostPerMil = Number((PETROL_BENCHMARK.litersPerMil * petrolPricePerLiter).toFixed(2));
  const petrolTripCost = tripDistanceMil * petrolCostPerMil;
  const petrolMonthlyCost = monthlyDistanceMil * petrolCostPerMil;

  const results: ScenarioResult[] = scenarios.map((scenario) => {
    // Kostnad enbart för körning per mil
    const costPerMil = Number((kwhPerMil * scenario.pricePerKwh).toFixed(2));
    
    // Resans totalkostnad
    const tripCost = Number(((energyNeededTripKwh * scenario.pricePerKwh) + scenario.sessionFee).toFixed(2));

    // Månadskostnad
    const monthlyEnergyCost = monthlyEnergyKwh * scenario.pricePerKwh;
    const monthlyCost = Number((monthlyEnergyCost + scenario.monthlyFee).toFixed(2));

    // Effektiv kostnad per mil per månad (inkl fast avgift)
    const effectiveCostPerMilMonthly = monthlyDistanceMil > 0
      ? Number((monthlyCost / monthlyDistanceMil).toFixed(2))
      : costPerMil;

    const savingsVsPetrolTrip = Number(Math.max(0, petrolTripCost - tripCost).toFixed(2));
    const savingsVsPetrolMonthly = Number(Math.max(0, petrolMonthlyCost - monthlyCost).toFixed(2));

    return {
      scenario,
      costPerMil,
      tripCost,
      monthlyCost,
      effectiveCostPerMilMonthly,
      savingsVsHighestTrip: 0,
      savingsVsPetrolTrip,
      savingsVsPetrolMonthly,
    };
  });

  // Hitta dyraste resan för att räkna differens/besparing
  const highestTripCost = Math.max(...results.map(r => r.tripCost), 0);
  results.forEach(r => {
    r.savingsVsHighestTrip = Number(Math.max(0, highestTripCost - r.tripCost).toFixed(2));
  });

  // Hitta billigaste för resa och för månad
  let cheapestTripId = results[0]?.scenario.id || '';
  let minTripCost = Infinity;

  let cheapestMonthlyId = results[0]?.scenario.id || '';
  let minMonthlyCost = Infinity;

  results.forEach(r => {
    if (r.tripCost < minTripCost) {
      minTripCost = r.tripCost;
      cheapestTripId = r.scenario.id;
    }
    if (r.monthlyCost < minMonthlyCost) {
      minMonthlyCost = r.monthlyCost;
      cheapestMonthlyId = r.scenario.id;
    }
  });

  return {
    results,
    cheapestTripId,
    cheapestMonthlyId,
    energyNeededTripKwh,
  };
}
