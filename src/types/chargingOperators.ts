export type ChargingSpeedCategory = 'ac' | 'fast' | 'ultrafast'; // AC <= 22kW, Fast 50-150kW, Ultrafast > 150kW

export interface OperatorPlan {
  id: string;
  name: string; // t.ex. "Drop-in / Utan abonnemang", "Passport Motion", "Mer Energy"
  description: string;
  monthlyFee: number; // kr/månad (0 om inget abonnemang)
  priceDcKwh: number; // kr/kWh för snabb/supersnabbladdning (DC)
  priceAcKwh?: number | null; // kr/kWh för destinationsladdning (AC <= 22kW)
  priceDcOffPeakKwh?: number | null; // Eventuellt lägre nattpris
  offPeakHours?: string | null; // t.ex. "22:00 - 07:00"
  bindingPeriod: string; // t.ex. "Ingen bindningstid", "Löpande månadsvis", "12 månader"
  breakEvenKwhPerMonth?: number | null; // kWh per månad då abonnemanget blir billigare än drop-in
  discountNote?: string; // t.ex. "20% rabatt på ordinarie pris"
  isSubscription: boolean; // sant om det är en månadsavgift
  isPopular?: boolean;
}

export interface ChargingOperator {
  id: string;
  name: string; // t.ex. "Tesla Supercharger", "IONITY", "Circle K"
  brandColor: string; // Tailwind border/badge color theme (e.g. 'red', 'blue', 'amber', 'emerald', etc.)
  logoText: string;
  badgeTag: string; // t.ex. "Ultrasnabb", "Flest laddhubbar", "Lägst månadspris"
  summary: string;
  networkSize: string; // t.ex. "1 200+ laddpunkter i Sverige"
  maxPowerKw: number; // t.ex. 350
  coverageDescription: string; // t.ex. "Rikstäckande längs E4, E6, E18 och i städer"
  paymentMethods: string[]; // ["App", "Kortterminal (AFIR)", "RFID-bricka", "AutoCharge"]
  websiteUrl: string;
  appName: string;
  pros: string[];
  cons: string[];
  plans: OperatorPlan[];
}

export interface CalculatedPlanCost {
  operatorId: string;
  operatorName: string;
  brandColor: string;
  maxPowerKw: number;
  plan: OperatorPlan;
  monthlyKwh: number;
  energyCost: number; // kWh * priceDcKwh
  monthlyFee: number; // plan.monthlyFee
  totalMonthlyCost: number; // energyCost + monthlyFee
  effectivePricePerKwh: number; // totalMonthlyCost / monthlyKwh
  savingsVsHighest: number;
  rank: number;
}

export type OperatorSortOption = 
  | 'cheapest-total'     // Lägst månadskostnad för vald förbrukning
  | 'lowest-kwh-price'   // Lägst pris per kWh DC
  | 'lowest-monthly-fee' // Lägst månadskostnad (0 kr först)
  | 'highest-power'      // Högst laddeffekt (kW)
  | 'alphabetical';      // A-Ö

export type OperatorFilterType = 'all' | 'subscription' | 'no-subscription' | 'ultrafast';
