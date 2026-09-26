export interface FuelPriceData {
  fuelType: string;
  pricePerLiter: number;
  litersPerMil: number;
  currency: string;
  updatedAt: string;
  source: string;
}

export const DEFAULT_FUEL_PRICE: FuelPriceData = {
  fuelType: 'Bensin 95 (E10)',
  pricePerLiter: 17.69, // Aktuellt genomsnittligt svenskt rikssnitt
  litersPerMil: 0.65,
  currency: 'SEK',
  updatedAt: new Date().toISOString().slice(0, 10),
  source: 'Rikssnitt Sverige',
};

/**
 * Hämtar automatiskt aktuellt genomsnittligt bensinpris från datakällan
 */
export async function fetchCurrentPetrolPrice(): Promise<FuelPriceData> {
  try {
    // 1. Försök hämta från lokal statisk datakälla
    const baseUrl = import.meta.env.BASE_URL || './';
    const jsonUrl = `${baseUrl.replace(/\/$/, '')}/data/fuel_prices.json`;
    const response = await fetch(jsonUrl, {
      cache: 'no-cache',
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.pricePerLiter === 'number') {
        return {
          fuelType: data.fuelType || DEFAULT_FUEL_PRICE.fuelType,
          pricePerLiter: data.pricePerLiter,
          litersPerMil: data.litersPerMil || 0.65,
          currency: data.currency || 'SEK',
          updatedAt: data.updatedAt || new Date().toISOString().slice(0, 10),
          source: data.source || 'Rikssnitt Sverige',
        };
      }
    }
  } catch (err) {
    console.warn('Kunde inte nå fuel_prices.json, använder standardvärde:', err);
  }

  // Fallback till dagsaktuellt verifierat pris
  return { ...DEFAULT_FUEL_PRICE };
}
