import React, { useState } from 'react';
import {
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ChargingOperator, CalculatedPlanCost } from '../../types/chargingOperators';
import { calculatePlanCost } from '../../utils/operatorCalculations';

interface OperatorCardProps {
  operator: ChargingOperator;
  monthlyKwh: number;
  onSelectPlanForScenario?: (cost: CalculatedPlanCost) => void;
}

export const OperatorCard: React.FC<OperatorCardProps> = ({
  operator,
  monthlyKwh,
  onSelectPlanForScenario,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Färghjälpare för operatörens märke
  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'cyan':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case 'amber':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'yellow':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'blue':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'emerald':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'indigo':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      case 'teal':
        return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
      case 'purple':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <article className="bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-200 hover:border-slate-700">
      {/* Operatörshuvud */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logo pill */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm tracking-tight border shadow-inner ${getBadgeStyle(
                operator.brandColor
              )}`}
            >
              {operator.logoText.slice(0, 4)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-white">{operator.name}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeStyle(
                    operator.brandColor
                  )}`}
                >
                  {operator.badgeTag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{operator.summary}</p>
            </div>
          </div>

          {/* Snabba Nyckeldata */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-left sm:text-right bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Maxeffekt</div>
              <div className="text-sm font-extrabold text-cyan-400 font-mono-numbers">
                {operator.maxPowerKw} <span className="text-[10px] text-slate-400 font-normal">kW</span>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Laddpunkter</div>
              <div className="text-sm font-bold text-white font-mono-numbers truncate max-w-[130px]">
                {operator.networkSize.split(' ')[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Nätverksdetaljer & Betalsätt */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{operator.coverageDescription}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{operator.paymentMethods.join(' • ')}</span>
          </div>
        </div>
      </div>

      {/* Planer & Priser (Grid) */}
      <div className="p-5 sm:p-6 bg-slate-950/40 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Aktuella prisplaner & Abonnemang ({operator.plans.length} st)
          </span>
          <span className="text-[11px] text-slate-400">
            Beräknat för <strong className="text-cyan-400 font-mono-numbers">{monthlyKwh} kWh/mån</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operator.plans.map((plan) => {
            const calculated = calculatePlanCost(operator, plan, monthlyKwh);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Plan Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                      {plan.name}
                      {plan.isPopular && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold uppercase">
                          Populär
                        </span>
                      )}
                    </h4>

                    {/* Månadsavgift tag */}
                    {plan.isSubscription ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono-numbers text-xs font-bold shrink-0">
                        {plan.monthlyFee} kr/mån
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0">
                        0 kr/mån
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {plan.description}
                  </p>
                </div>

                {/* Prisdetaljer */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        DC Snabbladdning
                      </span>
                      <span className="text-base font-extrabold text-white font-mono-numbers">
                        {plan.priceDcKwh.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-400">kr/kWh</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        AC Långsamladdning
                      </span>
                      <span className="text-sm font-bold text-slate-300 font-mono-numbers">
                        {plan.priceAcKwh ? `${plan.priceAcKwh.toFixed(2)} kr/kWh` : '—'}
                      </span>
                    </div>
                  </div>

                  {plan.priceDcOffPeakKwh && (
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60 text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Nattaxa ({plan.offPeakHours}):</span>
                      </span>
                      <strong className="font-mono-numbers">{plan.priceDcOffPeakKwh.toFixed(2)} kr/kWh</strong>
                    </div>
                  )}

                  {/* Beräknad totalkostnad */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Totalkostnad ({monthlyKwh} kWh):
                      </span>
                      <span className="text-sm font-extrabold text-cyan-300 font-mono-numbers">
                        {calculated.totalMonthlyCost.toLocaleString('sv-SE')} kr/mån
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Effektivt pris:
                      </span>
                      <span className="text-xs font-bold text-slate-200 font-mono-numbers">
                        {calculated.effectivePricePerKwh.toFixed(2)} kr/kWh
                      </span>
                    </div>
                  </div>
                </div>

                {/* Villkor & Break-even */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
                    <span>Bindningstid: <strong className="text-slate-300">{plan.bindingPeriod}</strong></span>
                    {plan.breakEvenKwhPerMonth && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Break-even: &gt;{plan.breakEvenKwhPerMonth} kWh/mån
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {onSelectPlanForScenario && (
                    <button
                      type="button"
                      onClick={() => onSelectPlanForScenario(calculated)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 border border-slate-700/60 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Räkna på din resa med detta pris</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operatörsanalys & Fördelar/Nackdelar accordion */}
      <div className="px-5 sm:px-6 py-3 bg-slate-900/60 border-t border-slate-800/60 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <span>För- och nackdelar & detaljer</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <a
          href={operator.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
        >
          <span>Webbplats & App</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {showDetails && (
        <div className="p-5 sm:p-6 bg-slate-950/80 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Fördelar */}
          <div className="space-y-2">
            <h5 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Fördelar</span>
            </h5>
            <ul className="space-y-1.5 text-slate-300">
              {operator.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Nackdelar */}
          <div className="space-y-2">
            <h5 className="font-bold text-amber-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              <span>Att tänka på</span>
            </h5>
            <ul className="space-y-1.5 text-slate-300">
              {operator.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
};
