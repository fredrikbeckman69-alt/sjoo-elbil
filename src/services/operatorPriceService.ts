import { ChargingOperator } from '../types/chargingOperators';
import { SWEDISH_CHARGING_OPERATORS } from '../data/chargingOperatorsData';

export interface DynamicOperatorPriceData {
  updatedAt: string;
  source: string;
  operators: {
    id: string;
    name: string;
    plans: {
      id: string;
      priceDcKwh?: number;
      priceAcKwh?: number | null;
      priceDcOffPeakKwh?: number | null;
      monthlyFee?: number;
    }[];
  }[];
}

const STORAGE_KEY = 'sjoo_operator_prices_cache';

/**
 * Hämtar och uppdaterar operatörspriser från den centrala prisfilen.
 * Vid nätverksfel eller offline används sparad cache eller inbyggda standardvärden.
 */
export async function fetchCurrentOperatorPrices(): Promise<ChargingOperator[]> {
  try {
    const baseUrl = import.meta.env.BASE_URL || './';
    const jsonUrl = `${baseUrl.replace(/\/$/, '')}/data/operator_prices.json`;

    const response = await fetch(jsonUrl, { cache: 'no-cache' });
    if (response.ok) {
      const data: DynamicOperatorPriceData = await response.json();
      if (data && Array.isArray(data.operators)) {
        const merged = mergePricesWithOperators(SWEDISH_CHARGING_OPERATORS, data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            updatedAt: data.updatedAt,
            data,
          }));
        } catch {
          // Ignorera kvotfel i privat läge
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Kunde inte läsa operator_prices.json, kollar cache:', err);
  }

  // Försök läsa från lokal cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.data?.operators) {
        return mergePricesWithOperators(SWEDISH_CHARGING_OPERATORS, parsed.data);
      }
    }
  } catch {
    // Ignorera parse-fel
  }

  return [...SWEDISH_CHARGING_OPERATORS];
}

/**
 * Slår ihop dynamiska priser från JSON med befintliga operatörsdefinitioner
 */
function mergePricesWithOperators(
  baseOperators: ChargingOperator[],
  dynamicData: DynamicOperatorPriceData
): ChargingOperator[] {
  const dynamicMap = new Map(dynamicData.operators.map((op) => [op.id, op]));

  return baseOperators.map((operator) => {
    const freshOp = dynamicMap.get(operator.id);
    if (!freshOp) return operator;

    const freshPlanMap = new Map(freshOp.plans.map((p) => [p.id, p]));

    const updatedPlans = operator.plans.map((plan) => {
      const freshPlan = freshPlanMap.get(plan.id);
      if (!freshPlan) return plan;

      return {
        ...plan,
        priceDcKwh: freshPlan.priceDcKwh !== undefined ? freshPlan.priceDcKwh : plan.priceDcKwh,
        priceAcKwh: freshPlan.priceAcKwh !== undefined ? freshPlan.priceAcKwh : plan.priceAcKwh,
        priceDcOffPeakKwh: freshPlan.priceDcOffPeakKwh !== undefined ? freshPlan.priceDcOffPeakKwh : plan.priceDcOffPeakKwh,
        monthlyFee: freshPlan.monthlyFee !== undefined ? freshPlan.monthlyFee : plan.monthlyFee,
      };
    });

    return {
      ...operator,
      plans: updatedPlans,
    };
  });
}
