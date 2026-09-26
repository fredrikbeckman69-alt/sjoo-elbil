import React, { useState } from 'react';
import { BarChart3, Fuel, Zap, Sparkles, RefreshCw, Edit3, Check } from 'lucide-react';
import { ScenarioResult } from '../types';
import { PETROL_BENCHMARK } from '../utils/calculations';

interface VisualChartProps {
  results: ScenarioResult[];
  tripDistanceMil: number;
  monthlyDistanceMil: number;
  petrolPricePerLiter?: number;
  petrolSource?: string;
  petrolUpdatedAt?: string;
  onPetrolPriceChange?: (newPrice: number) => void;
  onRefreshPetrolPrice?: () => Promise<void>;
  embedded?: boolean;
}

export const VisualChart: React.FC<VisualChartProps> = ({
  results,
  tripDistanceMil,
  monthlyDistanceMil,
  petrolPricePerLiter = PETROL_BENCHMARK.pricePerLiter,
  petrolSource = 'Rikssnitt Sverige',
  petrolUpdatedAt,
  onPetrolPriceChange,
  onRefreshPetrolPrice,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'trip' | 'monthly' | 'permil'>('trip');
  const [isEditingPetrol, setIsEditingPetrol] = useState(false);
  const [editPriceStr, setEditPriceStr] = useState(petrolPricePerLiter.toString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const costPerMil = Number((PETROL_BENCHMARK.litersPerMil * petrolPricePerLiter).toFixed(2));
  const petrolCostTrip = Number((tripDistanceMil * costPerMil).toFixed(0));
  const petrolCostMonthly = Number((monthlyDistanceMil * costPerMil).toFixed(0));
  const petrolCostPerMil = costPerMil;

  // Beräkna maxvärde för att skala progress bars snyggt
  const maxTrip = Math.max(...results.map((r) => r.tripCost), petrolCostTrip, 10);
  const maxMonthly = Math.max(...results.map((r) => r.monthlyCost), petrolCostMonthly, 100);
  const maxPerMil = Math.max(...results.map((r) => r.costPerMil), petrolCostPerMil, 2);

  const handleSavePetrolEdit = () => {
    const val = parseFloat(editPriceStr.replace(',', '.'));
    if (!isNaN(val) && val > 0 && onPetrolPriceChange) {
      onPetrolPriceChange(Number(val.toFixed(2)));
    }
    setIsEditingPetrol(false);
  };

  const handleRefresh = async () => {
    if (onRefreshPetrolPrice) {
      setIsRefreshing(true);
      try {
        await onRefreshPetrolPrice();
      } finally {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }
  };

  const tabsHeader = (
    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
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
  );

  const mainVisuals = (
    <>
      {embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <span className="text-xs text-slate-400">Jämför elbilsalternativen direkt mot bensinbil:</span>
          {tabsHeader}
        </div>
      )}

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

        {/* Petrol benchmark bar with live fetched price */}
        <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Fuel className="w-4 h-4" />
                <span>Motsvarande Bensinbil ({PETROL_BENCHMARK.litersPerMil} l/mil @ {petrolPricePerLiter.toFixed(2).replace('.', ',')} kr/l)</span>
              </span>

              {/* Dynamic Price Badge with Refresh & Edit */}
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Hämtat dagspris
                </span>

                {onRefreshPetrolPrice && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="p-1 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                    title="Hämta senaste bensinpris automatiskt"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                  </button>
                )}

                {onPetrolPriceChange && !isEditingPetrol && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditPriceStr(petrolPricePerLiter.toString());
                      setIsEditingPetrol(true);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                    title="Justera bensinpris manuellt"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <span className="font-bold text-amber-300 font-mono-numbers">
              {activeTab === 'trip' && `${petrolCostTrip} kr`}
              {activeTab === 'monthly' && `${petrolCostMonthly} kr`}
              {activeTab === 'permil' && `${petrolCostPerMil.toFixed(2)} kr/mil`}
            </span>
          </div>

          {/* Inline Edit for Petrol Price */}
          {isEditingPetrol && (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300">Justera bensinpris (kr/liter):</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={editPriceStr}
                  onChange={(e) => setEditPriceStr(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono-numbers text-xs"
                />
                <button
                  type="button"
                  onClick={handleSavePetrolEdit}
                  className="p-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  title="Spara"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPetrol(false)}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

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

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
            <span>Källa: {petrolSource}</span>
            {petrolUpdatedAt && <span>Uppdaterat: {petrolUpdatedAt}</span>}
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
                varje månad jämfört med bensin vid {petrolPricePerLiter.toFixed(2).replace('.', ',')} kr/l!
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Uppskattad årsbesparing</div>
            <div className="text-sm font-bold text-emerald-400 font-mono-numbers">
              +{Math.max(0, (petrolCostMonthly - Math.min(...results.map((r) => r.monthlyCost))) * 12).toLocaleString('sv-SE')} kr/år
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return mainVisuals;
  }

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
        {tabsHeader}
      </div>
      {mainVisuals}
    </div>
  );
};
