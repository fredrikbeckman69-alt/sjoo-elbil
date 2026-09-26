import {
  ChargingOperator,
  OperatorPlan,
  CalculatedPlanCost,
  OperatorSortOption,
  OperatorFilterType,
} from '../types/chargingOperators';

/**
 * Beräknar månadskostnad och effektivt kWh-pris för en specifik prisplan
 */
export const calculatePlanCost = (
  operator: ChargingOperator,
  plan: OperatorPlan,
  monthlyKwh: number
): CalculatedPlanCost => {
  const energyCost = monthlyKwh * plan.priceDcKwh;
  const totalMonthlyCost = energyCost + plan.monthlyFee;
  const effectivePricePerKwh =
    monthlyKwh > 0 ? totalMonthlyCost / monthlyKwh : plan.priceDcKwh;

  return {
    operatorId: operator.id,
    operatorName: operator.name,
    brandColor: operator.brandColor,
    maxPowerKw: operator.maxPowerKw,
    plan,
    monthlyKwh,
    energyCost: Math.round(energyCost * 100) / 100,
    monthlyFee: plan.monthlyFee,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    effectivePricePerKwh: Math.round(effectivePricePerKwh * 100) / 100,
    savingsVsHighest: 0,
    rank: 0,
  };
};

/**
 * Beräknar och rankar alla planer för samtliga operatörer utifrån förbrukning och valda filter
 */
export const calculateAllPlanCosts = (
  operators: ChargingOperator[],
  monthlyKwh: number,
  sortOption: OperatorSortOption = 'cheapest-total',
  filterType: OperatorFilterType = 'all',
  searchQuery: string = ''
): CalculatedPlanCost[] => {
  const results: CalculatedPlanCost[] = [];
  const query = searchQuery.trim().toLowerCase();

  for (const op of operators) {
    // Sökfiltrering
    if (query) {
      const matchOpName = op.name.toLowerCase().includes(query);
      const matchSummary = op.summary.toLowerCase().includes(query);
      const matchPlan = op.plans.some((p) => p.name.toLowerCase().includes(query));
      if (!matchOpName && !matchSummary && !matchPlan) {
        continue;
      }
    }

    // Filtrering på laddeffekt
    if (filterType === 'ultrafast' && op.maxPowerKw < 150) {
      continue;
    }

    for (const plan of op.plans) {
      // Filtrering på abonnemang
      if (filterType === 'subscription' && !plan.isSubscription) {
        continue;
      }
      if (filterType === 'no-subscription' && plan.isSubscription) {
        continue;
      }

      results.push(calculatePlanCost(op, plan, monthlyKwh));
    }
  }

  // Sortering
  results.sort((a, b) => {
    switch (sortOption) {
      case 'cheapest-total':
        return a.totalMonthlyCost - b.totalMonthlyCost;
      case 'lowest-kwh-price':
        return a.plan.priceDcKwh - b.plan.priceDcKwh;
      case 'lowest-monthly-fee':
        return a.monthlyFee - b.monthlyFee || a.totalMonthlyCost - b.totalMonthlyCost;
      case 'highest-power':
        return b.maxPowerKw - a.maxPowerKw || a.totalMonthlyCost - b.totalMonthlyCost;
      case 'alphabetical':
        return a.operatorName.localeCompare(b.operatorName, 'sv');
      default:
        return a.totalMonthlyCost - b.totalMonthlyCost;
    }
  });

  // Hitta högsta totalkostnad för besparingsjämförelse
  const highestTotalCost = results.length > 0 ? Math.max(...results.map((r) => r.totalMonthlyCost)) : 0;

  // Tilldela ranking och besparing
  return results.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    savingsVsHighest: Math.max(0, Math.round(highestTotalCost - item.totalMonthlyCost)),
  }));
};

/**
 * Beräknar break-even kWh/månad mellan en basplan (drop-in) och ett abonnemang
 */
export const calculateBreakEvenPoint = (
  baseKwhPrice: number,
  subscriptionKwhPrice: number,
  monthlyFee: number
): number | null => {
  const diffPerKwh = baseKwhPrice - subscriptionKwhPrice;
  if (diffPerKwh <= 0 || monthlyFee <= 0) return null;
  return Math.ceil(monthlyFee / diffPerKwh);
};
