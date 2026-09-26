import { ChargingStation } from '../types';

let cachedStations: ChargingStation[] | null = null;

/**
 * Hämtar Sveriges alla laddstationer från den lokala optimerade datamängden.
 */
export async function getChargingStations(): Promise<ChargingStation[]> {
  if (cachedStations) {
    return cachedStations;
  }

  try {
    const res = await fetch('/data/sweden_chargers.json');
    if (!res.ok) {
      throw new Error(`Kunde inte läsa laddstationsdata (HTTP ${res.status})`);
    }
    const data: ChargingStation[] = await res.json();
    cachedStations = data;
    return data;
  } catch (err) {
    console.error('Fel vid inläsning av laddstationer:', err);
    throw err;
  }
}

export interface OperatorCount {
  name: string;
  count: number;
}

/**
 * Beräknar antal stationer per operatör och sorterar efter flest stationer.
 */
export function getOperatorStats(stations: ChargingStation[]): OperatorCount[] {
  const map: Record<string, number> = {};

  for (const s of stations) {
    const op = s.operator || 'Övriga / Oberoende';
    map[op] = (map[op] || 0) + 1;
  }

  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      // "Övriga / Oberoende" placeras sist bland de stora
      if (a.name.startsWith('Övriga')) return 1;
      if (b.name.startsWith('Övriga')) return -1;
      return b.count - a.count;
    });
}

/**
 * Populära svenska laddoperatörer för snabbval
 */
export const POPULAR_OPERATORS = [
  'Mer',
  'Vattenfall InCharge',
  'Recharge',
  'E.ON Drive',
  'Tesla Supercharger',
  'Circle K',
  'OKQ8',
  'Ionity',
  'Virta',
  'Allego',
];

/**
 * Färgkodning för olika kända laddoperatörer på kartan
 */
export function getOperatorColor(operator: string): string {
  const op = operator.toLowerCase();
  if (op.includes('tesla')) return '#ef4444'; // Red
  if (op.includes('ionity')) return '#06b6d4'; // Cyan
  if (op.includes('incharge') || op.includes('vattenfall')) return '#3b82f6'; // Blue
  if (op.includes('circle k')) return '#f97316'; // Orange
  if (op.includes('recharge')) return '#10b981'; // Emerald
  if (op.includes('mer')) return '#22c55e'; // Green
  if (op.includes('okq8') || op === 'ok') return '#2563eb'; // Royal blue
  if (op.includes('e.on') || op.includes('eon')) return '#e11d48'; // Rose
  if (op.includes('virta')) return '#8b5cf6'; // Violet
  if (op.includes('allego')) return '#14b8a6'; // Teal
  if (op.includes('kople')) return '#a855f7'; // Purple
  if (op.includes('clever')) return '#0284c7'; // Sky
  return '#10b981'; // Default emerald
}
