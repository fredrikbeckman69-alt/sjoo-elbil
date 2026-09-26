import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap,
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Building2,
} from 'lucide-react';
import { SWEDISH_CHARGING_OPERATORS } from '../data/chargingOperatorsData';
import { fetchCurrentOperatorPrices } from '../services/operatorPriceService';
import { ChargingOperator } from '../types/chargingOperators';
import {
  OperatorSortOption,
  OperatorFilterType,
  CalculatedPlanCost,
} from '../types/chargingOperators';
import { calculateAllPlanCosts } from '../utils/operatorCalculations';
import { OperatorCostCalculator } from './operators/OperatorCostCalculator';
import { OperatorCard } from './operators/OperatorCard';
import { OperatorComparisonTable } from './operators/OperatorComparisonTable';
import { ChargingGuide } from './operators/ChargingGuide';
import { VehicleProfile } from '../types';

interface ChargingOperatorsTabProps {
  vehicle: VehicleProfile;
  onSelectPlanForScenario?: (cost: CalculatedPlanCost) => void;
}

export const ChargingOperatorsTab: React.FC<ChargingOperatorsTabProps> = ({
  vehicle,
  onSelectPlanForScenario,
}) => {
  // Dynamiska operatörspriser med timvis uppdatering
  const [operators, setOperators] = useState<ChargingOperator[]>(SWEDISH_CHARGING_OPERATORS);

  useEffect(() => {
    fetchCurrentOperatorPrices().then((fresh) => {
      if (fresh && fresh.length > 0) setOperators(fresh);
    });

    const interval = setInterval(() => {
      fetchCurrentOperatorPrices().then((fresh) => {
        if (fresh && fresh.length > 0) setOperators(fresh);
      });
    }, 3600000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchCurrentOperatorPrices().then((fresh) => {
          if (fresh && fresh.length > 0) setOperators(fresh);
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Lokalt state för kalkylator och filter
  const [monthlyKwh, setMonthlyKwh] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<OperatorFilterType>('all');
  const [sortOption, setSortOption] = useState<OperatorSortOption>('cheapest-total');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Beräkna och sortera alla planer
  const calculatedCosts = useMemo(() => {
    return calculateAllPlanCosts(
      operators,
      monthlyKwh,
      sortOption,
      filterType,
      searchQuery
    );
  }, [operators, monthlyKwh, sortOption, filterType, searchQuery]);

  // Filtrera operatörer för kortvyn
  const filteredOperators = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return operators.filter((op) => {
      // Sökning
      if (query) {
        const matchName = op.name.toLowerCase().includes(query);
        const matchSummary = op.summary.toLowerCase().includes(query);
        const matchPlan = op.plans.some((p) => p.name.toLowerCase().includes(query));
        if (!matchName && !matchSummary && !matchPlan) return false;
      }

      // Filter
      if (filterType === 'ultrafast' && op.maxPowerKw < 150) return false;
      if (filterType === 'subscription' && !op.plans.some((p) => p.isSubscription)) return false;
      if (filterType === 'no-subscription' && !op.plans.some((p) => !p.isSubscription)) return false;

      return true;
    });
  }, [searchQuery, filterType]);

  return (
    <div className="space-y-6">
      {/* Hero Banner för Operatörsfliken */}
      <section className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Sveriges Samtliga Laddnätverk & Priser</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Jämför Laddoperatörer & Abonnemang
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Hitta marknadens lägsta elbilsladdning i Sverige. Jämför priser per kWh (AC/DC), fasta månadskostnader för abonnemang och ta reda på exakt när ett abonnemang lönar sig för just dina körvanor.
          </p>
        </div>
      </section>

      {/* 1. Interaktiv Kostnadskalkylator */}
      <OperatorCostCalculator
        monthlyKwh={monthlyKwh}
        onMonthlyKwhChange={setMonthlyKwh}
        calculatedCosts={calculatedCosts}
        vehicle={vehicle}
        onSelectPlanForScenario={onSelectPlanForScenario}
      />

      {/* 2. Sök, Filter & Sorteringspanel */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sökfält */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sök operatör (t.ex. Tesla, Ionity, Circle K, Mer, OKQ8)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Rensa
              </button>
            )}
          </div>

          {/* Sorteringsväljare */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <span className="text-xs text-slate-400 shrink-0">Sortera:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as OperatorSortOption)}
              aria-label="Sortera laddoperatörer"
              className="bg-slate-950/80 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="cheapest-total">Lägst månadskostnad ({monthlyKwh} kWh)</option>
              <option value="lowest-kwh-price">Lägst pris per kWh (DC)</option>
              <option value="lowest-monthly-fee">Lägst månadsavgift (0 kr först)</option>
              <option value="highest-power">Högst laddeffekt (kW)</option>
              <option value="alphabetical">Operatör (A-Ö)</option>
            </select>
          </div>

          {/* Visningsläge (Kort vs Tabell) */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kortvy med detaljer"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kort</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tabellvy"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tabell</span>
            </button>
          </div>
        </div>

        {/* Filterchips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Alla ({SWEDISH_CHARGING_OPERATORS.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('subscription')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterType === 'subscription'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Med abonnemang (rabatt)
          </button>

          <button
            type="button"
            onClick={() => setFilterType('no-subscription')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterType === 'no-subscription'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Utan fast avgift (0 kr/mån)
          </button>

          <button
            type="button"
            onClick={() => setFilterType('ultrafast')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterType === 'ultrafast'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Ultrasnabbladdning (&ge;150 kW)
          </button>
        </div>
      </div>

      {/* 3. Visning: Kortvy eller Tabellvy */}
      {viewMode === 'table' ? (
        <OperatorComparisonTable
          calculatedCosts={calculatedCosts}
          monthlyKwh={monthlyKwh}
          onSelectPlanForScenario={onSelectPlanForScenario}
        />
      ) : (
        <div className="space-y-4">
          {filteredOperators.length === 0 ? (
            <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center text-slate-400">
              <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Inga operatörer matchade din sökning</h3>
              <p className="text-xs text-slate-400 mt-1">
                Prova att ändra dina sökord eller nollställa filtret.
              </p>
            </div>
          ) : (
            filteredOperators.map((operator) => (
              <OperatorCard
                key={operator.id}
                operator={operator}
                monthlyKwh={monthlyKwh}
                onSelectPlanForScenario={onSelectPlanForScenario}
              />
            ))
          )}
        </div>
      )}

      {/* 4. Laddguide & Expertråd */}
      <ChargingGuide />
    </div>
  );
};
