export interface EvModelPreset {
  id: string;
  make: string;
  model: string;
  fullName: string;
  batteryCapacityKwh: number;
  consumptionKwh100Km: number;
  popular?: boolean;
}

export const POPULAR_EV_MODELS: EvModelPreset[] = [
  {
    id: 'tesla-model-y-lr',
    make: 'Tesla',
    model: 'Model Y Long Range',
    fullName: 'Tesla Model Y Long Range AWD',
    batteryCapacityKwh: 75,
    consumptionKwh100Km: 16.5,
    popular: true,
  },
  {
    id: 'vw-id4-pro',
    make: 'Volkswagen',
    model: 'ID.4 Pro',
    fullName: 'Volkswagen ID.4 Pro Performance',
    batteryCapacityKwh: 77,
    consumptionKwh100Km: 17.2,
    popular: true,
  },
  {
    id: 'volvo-ex30-er',
    make: 'Volvo',
    model: 'EX30 Extended Range',
    fullName: 'Volvo EX30 Single Motor Extended Range',
    batteryCapacityKwh: 64,
    consumptionKwh100Km: 16.7,
    popular: true,
  },
  {
    id: 'polestar-2-lr',
    make: 'Polestar',
    model: '2 Long Range Single Motor',
    fullName: 'Polestar 2 Long Range Single Motor',
    batteryCapacityKwh: 78,
    consumptionKwh100Km: 16.8,
    popular: true,
  },
  {
    id: 'kia-ev6-lr',
    make: 'Kia',
    model: 'EV6 77.4 kWh',
    fullName: 'Kia EV6 Long Range RWD (77.4 kWh)',
    batteryCapacityKwh: 77.4,
    consumptionKwh100Km: 16.5,
    popular: true,
  },
  {
    id: 'cupra-born-58',
    make: 'Cupra',
    model: 'Born 58',
    fullName: 'Cupra Born 58 (150 kW)',
    batteryCapacityKwh: 58,
    consumptionKwh100Km: 15.7,
    popular: true,
  },
  {
    id: 'skoda-enyaq-80',
    make: 'Skoda',
    model: 'Enyaq iV 80',
    fullName: 'Skoda Enyaq iV 80 (77 kWh)',
    batteryCapacityKwh: 77,
    consumptionKwh100Km: 17.1,
    popular: true,
  },
  {
    id: 'volvo-xc40-recharge',
    make: 'Volvo',
    model: 'XC40 / EX40 Recharge',
    fullName: 'Volvo XC40 / EX40 Single Motor',
    batteryCapacityKwh: 78,
    consumptionKwh100Km: 17.5,
    popular: true,
  },
  {
    id: 'tesla-model-3-lr',
    make: 'Tesla',
    model: 'Model 3 Long Range',
    fullName: 'Tesla Model 3 Long Range AWD (Highland)',
    batteryCapacityKwh: 75,
    consumptionKwh100Km: 14.0,
    popular: true,
  },
  {
    id: 'mg4-trophy',
    make: 'MG',
    model: 'MG4 Electric 64 kWh',
    fullName: 'MG MG4 Electric Luxury / Trophy (64 kWh)',
    batteryCapacityKwh: 61.7,
    consumptionKwh100Km: 16.0,
    popular: true,
  },
  {
    id: 'hyundai-ioniq-5-lr',
    make: 'Hyundai',
    model: 'Ioniq 5 77.4 kWh',
    fullName: 'Hyundai Ioniq 5 Long Range 77.4 kWh',
    batteryCapacityKwh: 77.4,
    consumptionKwh100Km: 17.0,
  },
  {
    id: 'bmw-i4-edrive40',
    make: 'BMW',
    model: 'i4 eDrive40',
    fullName: 'BMW i4 eDrive40 (80.7 kWh)',
    batteryCapacityKwh: 80.7,
    consumptionKwh100Km: 16.9,
  },
  {
    id: 'audi-q4-40-etron',
    make: 'Audi',
    model: 'Q4 40 e-tron',
    fullName: 'Audi Q4 40 e-tron (77 kWh)',
    batteryCapacityKwh: 77,
    consumptionKwh100Km: 17.5,
  },
  {
    id: 'vw-id3-pro',
    make: 'Volkswagen',
    model: 'ID.3 Pro',
    fullName: 'Volkswagen ID.3 Pro (58 kWh)',
    batteryCapacityKwh: 58,
    consumptionKwh100Km: 15.5,
  },
  {
    id: 'kia-niro-ev',
    make: 'Kia',
    model: 'Niro EV',
    fullName: 'Kia Niro EV 64.8 kWh',
    batteryCapacityKwh: 64.8,
    consumptionKwh100Km: 16.2,
  },
  {
    id: 'renault-megane-etech',
    make: 'Renault',
    model: 'Megane E-Tech EV60',
    fullName: 'Renault Megane E-Tech EV60 (60 kWh)',
    batteryCapacityKwh: 60,
    consumptionKwh100Km: 15.8,
  },
  {
    id: 'byd-atto3',
    make: 'BYD',
    model: 'Atto 3',
    fullName: 'BYD Atto 3 Comfort/Design (60.5 kWh)',
    batteryCapacityKwh: 60.5,
    consumptionKwh100Km: 16.0,
  },
  {
    id: 'nissan-ariya-87',
    make: 'Nissan',
    model: 'Ariya 87 kWh',
    fullName: 'Nissan Ariya Evolve 87 kWh',
    batteryCapacityKwh: 87,
    consumptionKwh100Km: 17.9,
  },
];

export const KNOWN_SWEDISH_PLATES: Record<string, Partial<EvModelPreset>> = {
  FFM56R: {
    make: 'SEAT / Cupra',
    model: 'Cupra Born 58',
    fullName: 'Cupra Born 58 (150 hk, 2022)',
    batteryCapacityKwh: 58,
    consumptionKwh100Km: 15.7,
  },
  MLE12B: {
    make: 'Tesla',
    model: 'Model Y Long Range',
    fullName: 'Tesla Model Y Long Range AWD',
    batteryCapacityKwh: 75,
    consumptionKwh100Km: 16.5,
  },
  KLO45C: {
    make: 'Volkswagen',
    model: 'ID.4 Pro',
    fullName: 'Volkswagen ID.4 Pro Performance',
    batteryCapacityKwh: 77,
    consumptionKwh100Km: 17.2,
  },
  NRA89D: {
    make: 'Volvo',
    model: 'EX30 Extended Range',
    fullName: 'Volvo EX30 Single Motor Extended Range',
    batteryCapacityKwh: 64,
    consumptionKwh100Km: 16.7,
  },
  JLM23E: {
    make: 'Polestar',
    model: '2 Long Range',
    fullName: 'Polestar 2 Long Range Single Motor',
    batteryCapacityKwh: 78,
    consumptionKwh100Km: 16.8,
  },
  PKL78F: {
    make: 'Kia',
    model: 'EV6 77.4 kWh',
    fullName: 'Kia EV6 Long Range RWD (77.4 kWh)',
    batteryCapacityKwh: 77.4,
    consumptionKwh100Km: 16.5,
  },
};

/**
 * Hitta elbil baserat på fritextsökning i modellkatalogen
 */
export function searchEvModels(query: string): EvModelPreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return POPULAR_EV_MODELS.filter((m) => m.popular);

  return POPULAR_EV_MODELS.filter(
    (m) =>
      m.fullName.toLowerCase().includes(q) ||
      m.make.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
  );
}

/**
 * Hitta elbilspreset utifrån registreringsnummer eller namn
 */
export function findEvPresetByPlateOrName(query: string): EvModelPreset | undefined {
  if (!query) return undefined;
  const clean = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean && KNOWN_SWEDISH_PLATES[clean]) {
    const known = KNOWN_SWEDISH_PLATES[clean];
    return {
      id: clean.toLowerCase(),
      make: known.make || 'Elbil',
      model: known.model || '',
      fullName: known.fullName || clean,
      batteryCapacityKwh: known.batteryCapacityKwh || 60,
      consumptionKwh100Km: known.consumptionKwh100Km || 17.5,
    };
  }

  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return POPULAR_EV_MODELS.find(
    (m) =>
      m.fullName.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.make.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
  );
}
