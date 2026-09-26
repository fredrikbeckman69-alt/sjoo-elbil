import { VehicleProfile, ChargingScenario, ScenarioResult } from '../types';

export const DEFAULT_VEHICLE: VehicleProfile = {
  name: 'Min Elbil',
  consumptionKwhPer100Km: 18.5, // Standard för modern elbil (motsvarar 1.85 kWh/mil)
  batteryCapacityKwh: 77.0,
};

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

// Benchmark för referens mot bensinbil
export const PETROL_BENCHMARK = {
  litersPerMil: 0.65,
  pricePerLiter: 19.20,
  get costPerMil() {
    return this.litersPerMil * this.pricePerLiter; // ~12.48 kr/mil
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
 * Beräknar uppskattad räckvidd i mil och km baserat på batterikapacitet och förbrukning
 */
export function calculateRange(batteryKwh: number, kwhPer100Km: number): { rangeKm: number; rangeMil: number } {
  if (kwhPer100Km <= 0) return { rangeKm: 0, rangeMil: 0 };
  const rangeKm = Math.round((batteryKwh / kwhPer100Km) * 100);
  const rangeMil = Number((rangeKm / 10).toFixed(1));
  return { rangeKm, rangeMil };
}

/**
 * Beräknar nyckeltal för alla scenarier givet distans och månadskörsträcka
 */
export function calculateScenarioResults(
  scenarios: ChargingScenario[],
  consumptionKwhPer100Km: number,
  tripDistanceMil: number,
  monthlyDistanceMil: number
): {
  results: ScenarioResult[];
  cheapestTripId: string;
  cheapestMonthlyId: string;
  energyNeededTripKwh: number;
} {
  const kwhPerMil = kwhPer100KmToKwhPerMil(consumptionKwhPer100Km);
  const energyNeededTripKwh = Number((tripDistanceMil * kwhPerMil).toFixed(2));
  const monthlyEnergyKwh = monthlyDistanceMil * kwhPerMil;

  const petrolTripCost = tripDistanceMil * PETROL_BENCHMARK.costPerMil;
  const petrolMonthlyCost = monthlyDistanceMil * PETROL_BENCHMARK.costPerMil;

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
