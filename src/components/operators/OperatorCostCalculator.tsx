import React from 'react';
import {
  Zap,
  TrendingDown,
  Award,
  Crown,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { CalculatedPlanCost } from '../../types/chargingOperators';
import { VehicleProfile } from '../../types';
import { kwhPer100KmToKwhPerMil } from '../../utils/calculations';

interface OperatorCostCalculatorProps {
  monthlyKwh: number;
  onMonthlyKwhChange: (kwh: number) => void;
  calculatedCosts: CalculatedPlanCost[];
  vehicle: VehicleProfile;
  onSelectPlanForScenario?: (cost: CalculatedPlanCost) => void;
}

export const OperatorCostCalculator: React.FC<OperatorCostCalculatorProps> = ({
  monthlyKwh,
  onMonthlyKwhChange,
  calculatedCosts,
  vehicle,
  onSelectPlanForScenario,
}) => {
  const kwhPerMil = kwhPer100KmToKwhPerMil(vehicle.consumptionKwhPer100Km);
  const estimatedMil = kwhPerMil > 0 ? Math.round(monthlyKwh / kwhPerMil) : 0;

  // Hämta topp 3 billigaste för denna förbrukning
  const topThree = calculatedCosts.slice(0, 3);
  const cheapest = topThree[0];
  const maxSavings = cheapest ? cheapest.savingsVsHighest : 0;

  // Snabbvalsknappar
  const presets = [
    { label: 'Enstaka laddning', kwh: 40, note: '~1 snabbladdning' },
    { label: 'Långhelg / Månad', kwh: 90, note: '~2–3 laddningar' },
    { label: 'Aktiv Resenär', kwh: 180, note: '~4–5 laddningar' },
    { label: 'Ingen hemladdning', kwh: 320, note: 'Laddar alltid publikt' },
  ];

  return (
    <section className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-6">
      {/* Sektionsrubrik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4 fill-cyan-400" />
            <span>Abonnemangskalkylator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Vad är billigast för dina laddvanor?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Dra i reglaget för att ange hur mycket du snabbladdar publikt per månad. Appen räknar omedelbart ut totalkostnad inklusive eventuell månadsavgift.
          </p>
        </div>

        {maxSavings > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold shrink-0">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <span>Spara upp till {maxSavings.toLocaleString('sv-SE')} kr/mån!</span>
          </div>
        )}
      </div>

      {/* Interaktivt reglage & snabbval */}
      <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">
              Månatlig publik snabbladdning:
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-mono-numbers">
              {monthlyKwh} <span className="text-sm font-normal text-slate-400">kWh</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Motsvarar ca <strong className="text-white font-mono-numbers">{estimatedMil} mil</strong> med {vehicle.name}</span>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={monthlyKwh}
            onChange={(e) => onMonthlyKwhChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 transition"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono-numbers px-1">
            <span>0 kWh</span>
            <span>100 kWh</span>
            <span>200 kWh</span>
            <span>300 kWh</span>
            <span>400 kWh</span>
            <span>500 kWh</span>
          </div>
        </div>

        {/* Snabbvalsknappar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onMonthlyKwhChange(preset.kwh)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                monthlyKwh === preset.kwh
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="text-xs font-semibold leading-tight">{preset.label}</div>
              <div className="text-[11px] text-slate-400 font-mono-numbers mt-0.5">
                {preset.kwh} kWh ({preset.note})
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prispall: Topp 3 billigaste alternativen */}
      {topThree.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Marknadens 3 billigaste alternativ vid {monthlyKwh} kWh/mån</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topThree.map((item, index) => {
              const isWinner = index === 0;
              const isRunnerUp = index === 1;

              return (
                <div
                  key={`${item.operatorId}-${item.plan.id}`}
                  className={`relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${
                    isWinner
                      ? 'bg-gradient-to-b from-emerald-950/60 via-slate-900/90 to-slate-950 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/30'
                      : isRunnerUp
                      ? 'bg-slate-900/80 border border-slate-700/80 shadow-md'
                      : 'bg-slate-900/50 border border-slate-800/80'
                  }`}
                >
                  {/* Pallplacering badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {isWinner ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black shadow-md">
                          <Crown className="w-3.5 h-3.5 fill-slate-950" />
                          #1 BILLIGAST
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {item.plan.isSubscription ? (
                      <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/50 border border-purple-800/40 px-2 py-0.5 rounded-full">
                        {item.plan.monthlyFee} kr/mån
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                        0 kr fast avgift
                      </span>
                    )}
                  </div>

                  {/* Operatör & Plannamn */}
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-white leading-tight">
                      {item.operatorName}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">
                      {item.plan.name}
                    </p>
                  </div>

                  {/* Kostnadsuppgifter */}
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 space-y-2 mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Total månadskostnad:</span>
                      <span className="text-lg font-extrabold text-white font-mono-numbers">
                        {item.totalMonthlyCost.toLocaleString('sv-SE')}{' '}
                        <span className="text-xs font-normal text-slate-400">kr/mån</span>
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-800/50">
                      <span className="text-slate-400">Effektivt kWh-pris:</span>
                      <span className="font-bold text-cyan-300 font-mono-numbers">
                        {item.effectivePricePerKwh.toFixed(2)} kr/kWh
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-[11px] text-slate-400">
                      <span>Rörligt pris (DC):</span>
                      <span className="font-mono-numbers text-slate-300">
                        {item.plan.priceDcKwh.toFixed(2)} kr/kWh
                      </span>
                    </div>
                  </div>

                  {/* Handling & Info */}
                  <div className="space-y-2">
                    {item.plan.isSubscription && item.plan.breakEvenKwhPerMonth && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
                        <span>Lönar sig vid &gt;{item.plan.breakEvenKwhPerMonth} kWh/mån</span>
                      </p>
                    )}

                    {onSelectPlanForScenario && (
                      <button
                        type="button"
                        onClick={() => onSelectPlanForScenario(item)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/60"
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>Testa i resekalkylatorn</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
