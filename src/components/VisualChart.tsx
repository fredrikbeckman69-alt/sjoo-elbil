import React, { useState } from 'react';
import { BarChart3, Fuel, Zap, Sparkles } from 'lucide-react';
import { ScenarioResult } from '../types';
import { PETROL_BENCHMARK } from '../utils/calculations';

interface VisualChartProps {
  results: ScenarioResult[];
  tripDistanceMil: number;
  monthlyDistanceMil: number;
}

export const VisualChart: React.FC<VisualChartProps> = ({
  results,
  tripDistanceMil,
  monthlyDistanceMil,
}) => {
  const [activeTab, setActiveTab] = useState<'trip' | 'monthly' | 'permil'>('trip');

  const petrolCostTrip = Number((tripDistanceMil * PETROL_BENCHMARK.costPerMil).toFixed(0));
  const petrolCostMonthly = Number((monthlyDistanceMil * PETROL_BENCHMARK.costPerMil).toFixed(0));
  const petrolCostPerMil = Number(PETROL_BENCHMARK.costPerMil.toFixed(2));

  // Beräkna maxvärde för att skala progress bars snyggt
  const maxTrip = Math.max(...results.map((r) => r.tripCost), petrolCostTrip, 10);
  const maxMonthly = Math.max(...results.map((r) => r.monthlyCost), petrolCostMonthly, 100);
  const maxPerMil = Math.max(...results.map((r) => r.costPerMil), petrolCostPerMil, 2);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Visuell Jämförelse & Besparing</h2>
            <p className="text-xs text-slate-400">Se skillnaden i kostnad och besparing mot fossildrift</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('trip')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'trip'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Resa ({tripDistanceMil} mil)
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'monthly'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Månad ({monthlyDistanceMil} mil)
          </button>
          <button
            onClick={() => setActiveTab('permil')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'permil'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Per mil (kr)
          </button>
        </div>
      </div>

      {/* Bars visualization */}
      <div className="space-y-3.5 mb-6">
        {results.map((item) => {
          let value = 0;
          let max = 100;
          let suffix = 'kr';

          if (activeTab === 'trip') {
            value = item.tripCost;
            max = maxTrip;
          } else if (activeTab === 'monthly') {
            value = item.monthlyCost;
            max = maxMonthly;
          } else {
            value = item.costPerMil;
            max = maxPerMil;
            suffix = 'kr/mil';
          }

          const percentage = Math.min(100, Math.max(5, (value / max) * 100));

          return (
            <div key={item.scenario.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  {item.scenario.name}
                </span>
                <span className="font-bold text-white font-mono-numbers">
                  {value.toFixed(activeTab === 'permil' ? 2 : 0)} {suffix}
                </span>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Petrol benchmark bar */}
        <div className="space-y-1 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5" />
              Motsvarande Bensinbil (0,65 l/mil @ 19,20 kr)
            </span>
            <span className="font-bold text-amber-300 font-mono-numbers">
              {activeTab === 'trip' && `${petrolCostTrip} kr`}
              {activeTab === 'monthly' && `${petrolCostMonthly} kr`}
              {activeTab === 'permil' && `${petrolCostPerMil.toFixed(2)} kr/mil`}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-amber-500/20">
            <div
              className="bg-gradient-to-r from-amber-600 to-red-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(
                  100,
                  ((activeTab === 'trip' ? petrolCostTrip : activeTab === 'monthly' ? petrolCostMonthly : petrolCostPerMil) /
                    (activeTab === 'trip' ? maxTrip : activeTab === 'monthly' ? maxMonthly : maxPerMil)) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Savings highlight banner */}
      {results.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Elbilens ekonomiska fördel
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Med hemmaladdning sparar du upp till{' '}
                <strong className="text-white font-mono-numbers">
                  {(petrolCostMonthly - Math.min(...results.map((r) => r.monthlyCost))).toFixed(0)} kr
                </strong>{' '}
                varje månad jämfört med bensin!
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Årlig besparing ca</div>
            <div className="text-lg font-black text-emerald-400 font-mono-numbers">
              {((petrolCostMonthly - Math.min(...results.map((r) => r.monthlyCost))) * 12).toLocaleString('sv-SE')} kr/år
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
