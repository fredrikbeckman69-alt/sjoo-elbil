export interface VehicleProfile {
  id?: string;
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

export interface TripConditions {
  isWinter: boolean; // +20%
  hasRoofBox: boolean; // +15%
  isHighwaySpeed: boolean; // +15%
}

export interface RoadTripAnalysis {
  effectiveConsumptionKwhPer100Km: number;
  effectiveKwhPerMil: number;
  effectiveRangeMil: number;
  effectiveRangeKm: number;
  energyNeededKwh: number;
  stopsCount: number;
  chargingTimeMinutes: number;
  homeKwh: number;
  highwayKwh: number;
  realisticCost: number;
  cost100PercentFast: number;
  petrolCost: number;
  savingsVsPetrol: number;
  startBatteryPercent: number;
  arrivalBufferPercent: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  description: string;
  completed: boolean;
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

export interface SavedTrip {
  id: string;
  createdAt: string; // ISO date
  title: string;
  startAddress: string;
  destAddress: string;
  distanceMil: number;
  distanceKm: number;
  durationText?: string;
  consumptionKwhPer100Km: number;
  energyUsedKwh: number;
  cheapestScenarioName: string;
  cheapestTripCost: number;
  highestTripCost: number;
}

export interface DatabaseBackup {
  version: number;
  databaseName: string;
  exportedAt: string;
  settings: Record<string, any>;
  vehicle: VehicleProfile;
  scenarios: ChargingScenario[];
  trips: SavedTrip[];
  checklist?: ChecklistItem[];
}
