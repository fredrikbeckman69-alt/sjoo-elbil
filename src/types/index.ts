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

export interface VehicleHistoryEvent {
  date: string;
  event: string;
  description: string;
}

export interface VehicleDimensions {
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  curbWeightKg?: number;
  totalWeightKg?: number;
  maxPayloadKg?: number;
  wheelbaseMm?: number;
  bodyType?: string;
  tiresFront?: string;
  tiresRear?: string;
  rims?: string;
  passengers?: string;
  towbar?: boolean;
  noiseDrivingDb?: number;
}

export interface VehicleRegistryData {
  regnr: string;
  make: string;
  model: string;
  variant?: string;
  fullName: string;
  officialNameTS?: string;
  year?: number;
  modelYear?: number;
  status: string;
  svensksald: boolean;
  color?: string;
  fuel: string;
  gearbox: string;
  driveWheel: string;
  powerHp?: number;
  powerKw?: number;
  topSpeedKmH?: number;
  batteryCapacityKwh?: number;
  batteryGrossKwh?: number;
  consumptionWhKm?: number;
  consumptionKwh100Km?: number;
  consumptionKwhMil?: number;
  rangeWltpKm?: number;
  rangeWltpMil?: number;
  rangeCityKm?: number;
  mileageMil?: number;
  mileageKm?: number;
  estimatedMileageMil?: number;
  ownersCount?: number;
  usersCount?: number;
  firstRegistered?: string;
  inTrafficSweden?: string;
  lastOwnershipChange?: string;
  lastInspectionDate?: string;
  lastInspectionMileageMil?: number;
  lastInspectionResult?: string;
  nextInspectionBefore?: string;
  annualTaxSek?: number;
  taxMonth?: string;
  creditPurchase?: boolean;
  leased?: boolean;
  co2Emissions?: number;
  environmentalClass?: string;
  dimensions?: VehicleDimensions;
  history?: VehicleHistoryEvent[];
  source?: string;
  fetchedAt?: string;
}

export type AppTab = 'calculator' | 'charging-map';

export interface ChargingStation {
  id: number;
  name: string;
  lat: number;
  lon: number;
  operator: string;
  capacity: number | null;
  ccs: boolean;
  chademo: boolean;
  type2: boolean;
  maxPowerKw: number | null;
  street: string | null;
  city: string | null;
}
