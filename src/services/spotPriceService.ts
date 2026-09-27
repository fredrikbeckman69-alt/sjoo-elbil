/**
 * Tjänst för svenska elområden (SE1–SE4), spotpriser för hemmaladdning och medlemskapsrabatter.
 */

export interface ElectricityAreaInfo {
  code: 'SE1' | 'SE2' | 'SE3' | 'SE4';
  name: string;
  description: string;
  defaultPriceDayKwh: number; // kr/kWh inklusive nätavgift, skatt och moms
  defaultPriceNightKwh: number; // kr/kWh nattetid
}

export const SWEDISH_ELECTRICITY_AREAS: Record<'SE1' | 'SE2' | 'SE3' | 'SE4', ElectricityAreaInfo> = {
  SE1: {
    code: 'SE1',
    name: 'SE1 – Luleå / Norra Sverige',
    description: 'Mycket stor elproduktion från vatten- och vindkraft. Landets lägsta elpriser.',
    defaultPriceDayKwh: 1.10,
    defaultPriceNightKwh: 0.85,
  },
  SE2: {
    code: 'SE2',
    name: 'SE2 – Sundsvall / Norra Mellansverige',
    description: 'Hög elproduktion och låga överföringskostnader.',
    defaultPriceDayKwh: 1.15,
    defaultPriceNightKwh: 0.90,
  },
  SE3: {
    code: 'SE3',
    name: 'SE3 – Stockholm / Västra Götaland / Södra Mellansverige',
    description: 'Störst elförbrukning i landet. Normalpris för hemmaladdning.',
    defaultPriceDayKwh: 1.45,
    defaultPriceNightKwh: 1.15,
  },
  SE4: {
    code: 'SE4',
    name: 'SE4 – Malmö / Södra Sverige',
    description: 'Underskott på lokal produktion och koppling till Kontinentaleuropa. Högre spotpris.',
    defaultPriceDayKwh: 1.65,
    defaultPriceNightKwh: 1.35,
  },
};

export interface MembershipOption {
  id: string;
  operatorId: string;
  name: string;
  badge: string;
  discountDescription: string;
  defaultMemberPriceKwh?: number;
  discountPerKwh?: number;
}

export const POPULAR_MEMBERSHIPS: MembershipOption[] = [
  {
    id: 'tesla-member',
    operatorId: 'tesla-supercharger',
    name: 'Tesla Medlemskap / Tesla-ägare',
    badge: 'Tesla',
    discountDescription: 'Sänker priset från ca 5,10 till 3,65 kr/kWh på Superchargers',
    defaultMemberPriceKwh: 3.65,
  },
  {
    id: 'ionity-passport',
    operatorId: 'ionity',
    name: 'IONITY Passport',
    badge: 'IONITY',
    discountDescription: 'Sänker priset från ca 6,00 till 3,42 kr/kWh (350 kW HPC)',
    defaultMemberPriceKwh: 3.42,
  },
  {
    id: 'circle-k-extra',
    operatorId: 'circle-k',
    name: 'Circle K EXTRA Club',
    badge: 'Circle K',
    discountDescription: '25–40 öre/kWh rabatt på alla Circle K snabbladdare',
    discountPerKwh: 0.30,
  },
  {
    id: 'okq8-member',
    operatorId: 'okq8',
    name: 'OKQ8 Medlem / Återbäring',
    badge: 'OKQ8',
    discountDescription: 'Medlemsrabatt och återbäring på snabbladdning (-25 öre/kWh)',
    discountPerKwh: 0.25,
  },
  {
    id: 'incharge-member',
    operatorId: 'incharge',
    name: 'Vattenfall InCharge Förmån',
    badge: 'InCharge',
    discountDescription: 'Förmånspris för Vattenfall-elkunder på publika InCharge-stolpar',
    discountPerKwh: 0.35,
  },
];

/**
 * Hämtar schablonpris för hemmaladdning baserat på valt elområde
 */
export function getHomePriceForArea(area?: 'SE1' | 'SE2' | 'SE3' | 'SE4', isNight: boolean = true): number {
  const selected = area || 'SE3';
  const info = SWEDISH_ELECTRICITY_AREAS[selected] || SWEDISH_ELECTRICITY_AREAS.SE3;
  return isNight ? info.defaultPriceNightKwh : info.defaultPriceDayKwh;
}

/**
 * Beräknar rabatterat pris för en operatör baserat på användarens aktiva medlemskap
 */
export function getEffectivePriceWithMemberships(
  operatorId: string,
  basePrice: number,
  activeMemberships: string[] = []
): { price: number; isDiscounted: boolean; membershipName?: string } {
  if (!activeMemberships || activeMemberships.length === 0) {
    return { price: basePrice, isDiscounted: false };
  }

  for (const mId of activeMemberships) {
    const mem = POPULAR_MEMBERSHIPS.find((m) => m.id === mId);
    if (!mem) continue;

    if (mem.operatorId === operatorId) {
      if (mem.defaultMemberPriceKwh !== undefined) {
        return {
          price: Math.min(basePrice, mem.defaultMemberPriceKwh),
          isDiscounted: true,
          membershipName: mem.name,
        };
      }
      if (mem.discountPerKwh !== undefined) {
        return {
          price: Math.max(1.0, Number((basePrice - mem.discountPerKwh).toFixed(2))),
          isDiscounted: true,
          membershipName: mem.name,
        };
      }
    }
  }

  return { price: basePrice, isDiscounted: false };
}
