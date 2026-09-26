export interface VehicleProfile {
  name: string;
  consumptionKwhPer100Km: number; // e.g. 18.5
  batteryCapacityKwh: number; // e.g. 77
}

export interface ChargingScenario {
  id: string;
  name: string;
  description: string;
  pricePerKwh: number; // kr/kWh
  monthlyFee: number; // kr/månad
  sessionFee: number; // kr/laddsession
  badgeColor?: string;
  isDefault?: boolean;
}

export interface RouteInfo {
  startAddress: string;
  destAddress: string;
  distanceKm: number;
  distanceMil: number;
  durationMinutes: number | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

export interface TripCalculation {
  distanceMil: number;
  kwhPerMil: number;
  energyNeededKwh: number;
  scenarioResults: ScenarioResult[];
  cheapestTripId: string;
  cheapestMonthlyId: string;
}

export interface ScenarioResult {
  scenario: ChargingScenario;
  costPerMil: number; // kr/mil (enbart rörligt)
  tripCost: number; // kr för resan
  monthlyCost: number; // kr per månad inkl fast avgift
  effectiveCostPerMilMonthly: number; // kr/mil inklusive månadens fasta avgift
  savingsVsHighestTrip: number;
  savingsVsPetrolTrip: number;
  savingsVsPetrolMonthly: number;
}
