import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit2, Check, X, Award, Sparkles, RotateCcw } from 'lucide-react';
import { ChargingScenario, ScenarioResult } from '../types';
import { DEFAULT_SCENARIOS } from '../utils/calculations';

interface ScenarioComparisonProps {
  scenarios: ChargingScenario[];
  results: ScenarioResult[];
  cheapestTripId: string;
  cheapestMonthlyId: string;
  tripDistanceMil: number;
  monthlyDistanceMil: number;
  onUpdateScenarios: (updated: ChargingScenario[]) => void;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenarios,
  results,
  cheapestTripId,
  cheapestMonthlyId,
  tripDistanceMil,
  monthlyDistanceMil,
  onUpdateScenarios,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Formulärstate för nytt/redigerat scenario
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPricePerKwh, setFormPricePerKwh] = useState('1.50');
  const [formMonthlyFee, setFormMonthlyFee] = useState('0');
  const [formSessionFee, setFormSessionFee] = useState('0');

  const startEdit = (sc: ChargingScenario) => {
    setEditingId(sc.id);
    setFormName(sc.name);
    setFormDesc(sc.description);
    setFormPricePerKwh(sc.pricePerKwh.toString());
    setFormMonthlyFee(sc.monthlyFee.toString());
    setFormSessionFee(sc.sessionFee.toString());
    setIsAddingNew(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSaveEdit = (id: string) => {
    const price = parseFloat(formPricePerKwh.replace(',', '.')) || 0;
    const monthly = parseFloat(formMonthlyFee.replace(',', '.')) || 0;
    const session = parseFloat(formSessionFee.replace(',', '.')) || 0;

    const updated = scenarios.map((s) =>
      s.id === id
        ? {
            ...s,
            name: formName || s.name,
            description: formDesc,
            pricePerKwh: price,
            monthlyFee: monthly,
            sessionFee: session,
          }
        : s
    );
    onUpdateScenarios(updated);
    setEditingId(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(formPricePerKwh.replace(',', '.')) || 1.5;
    const monthly = parseFloat(formMonthlyFee.replace(',', '.')) || 0;
    const session = parseFloat(formSessionFee.replace(',', '.')) || 0;

    const newScenario: ChargingScenario = {
      id: `custom-${Date.now()}`,
      name: formName.trim() || 'Eget laddscenario',
      description: formDesc.trim() || 'Anpassat scenario',
      pricePerKwh: price,
      monthlyFee: monthly,
      sessionFee: session,
      badgeColor: 'cyan',
    };

    onUpdateScenarios([...scenarios, newScenario]);
    setIsAddingNew(false);
    setFormName('');
    setFormDesc('');
    setFormPricePerKwh('1.50');
    setFormMonthlyFee('0');
    setFormSessionFee('0');
  };

  const handleDelete = (id: string) => {
    if (scenarios.length <= 1) {
      alert('Du måste ha minst ett aktivt scenario.');
      return;
    }
    onUpdateScenarios(scenarios.filter((s) => s.id !== id));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Vill du återställa till standardscenarier?')) {
      onUpdateScenarios([...DEFAULT_SCENARIOS]);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Pris- och Kostnadsjämförelse</h2>
            <p className="text-xs text-slate-400">Jämför olika laddscenarier och elavtal sida vid sida</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
            title="Återställ standardscenarier"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Återställ</span>
          </button>

          {!isAddingNew && (
            <button
              onClick={() => {
                setIsAddingNew(true);
                setEditingId(null);
                setFormName('');
                setFormDesc('');
                setFormPricePerKwh('2.00');
                setFormMonthlyFee('0');
                setFormSessionFee('0');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 rounded-lg shadow transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nytt scenario</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal / Inline Add Form */}
      {isAddingNew && (
        <form onSubmit={handleAddNew} className="mb-6 p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Lägg till nytt laddscenario
            </span>
            <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Scenarionamn</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="T.ex. Sommarstugan / Tibber Smart"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Kort beskrivning</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="T.ex. Laddning helger och nätter"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Rörligt elpris (kr/kWh)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                required
                value={formPricePerKwh}
                onChange={(e) => setFormPricePerKwh(e.target.value)}
                placeholder="1.50"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Fast avgift (kr/månad)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={formMonthlyFee}
                onChange={(e) => setFormMonthlyFee(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Sessionsavgift (kr/laddning)</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={formSessionFee}
                onChange={(e) => setFormSessionFee(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono-numbers"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition"
            >
              Spara scenario
            </button>
          </div>
        </form>
      )}

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((item) => {
          const { scenario, costPerMil, tripCost, monthlyCost, savingsVsHighestTrip } = item;
          const isCheapestTrip = scenario.id === cheapestTripId;
          const isCheapestMonthly = scenario.id === cheapestMonthlyId;
          const isEditing = editingId === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`relative rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between ${
                isCheapestTrip
                  ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/60 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Highlight Best Deal Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {isCheapestTrip && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      <Award className="w-3 h-3" />
                      Lägst reskostnad
                    </span>
                  )}
                  {isCheapestMonthly && !isCheapestTrip && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      <Sparkles className="w-3 h-3" />
                      Bäst månadskostnad
                    </span>
                  )}
                  {isCheapestTrip && isCheapestMonthly && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                      Bäst totalt
                    </span>
                  )}
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => startEdit(scenario)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Redigera priser"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(scenario.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Ta bort scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveEdit(scenario.id)}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition"
                        title="Spara ändring"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 transition"
                        title="Avbryt"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Scenario Name & Price Details */}
              {isEditing ? (
                <div className="space-y-2 mb-4 bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <div>
                    <label className="text-[10px] text-slate-400">Namn</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">kr / kWh</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={formPricePerKwh}
                        onChange={(e) => setFormPricePerKwh(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Fast kr / mån</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        value={formMonthlyFee}
                        onChange={(e) => setFormMonthlyFee(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono-numbers"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white tracking-tight">{scenario.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{scenario.description}</p>
                  
                  {/* Parameter Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-white bg-slate-800 px-2 py-0.5 rounded-md font-mono-numbers">
                      {scenario.pricePerKwh.toFixed(2)} kr/kWh
                    </span>
                    {scenario.monthlyFee > 0 && (
                      <span className="text-xs text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded-md font-mono-numbers">
                        +{scenario.monthlyFee} kr/mån fast
                      </span>
                    )}
                    {scenario.sessionFee > 0 && (
                      <span className="text-xs text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded-md font-mono-numbers">
                        +{scenario.sessionFee} kr startavgift
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Cost Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 text-center">
                {/* 1. Kostnad per mil */}
                <div className="border-r border-slate-800 pr-1">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Kostnad / mil</div>
                  <div className="text-sm sm:text-base font-bold text-white font-mono-numbers mt-0.5">
                    {costPerMil.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">kr</span>
                  </div>
                </div>

                {/* 2. Resans kostnad */}
                <div className="border-r border-slate-800 px-1">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Resa ({tripDistanceMil} mil)</div>
                  <div className={`text-sm sm:text-base font-extrabold font-mono-numbers mt-0.5 ${
                    isCheapestTrip ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {tripCost.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">kr</span>
                  </div>
                </div>

                {/* 3. Månadskostnad */}
                <div className="pl-1">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Månad ({monthlyDistanceMil} mil)</div>
                  <div className={`text-sm sm:text-base font-extrabold font-mono-numbers mt-0.5 ${
                    isCheapestMonthly ? 'text-cyan-400' : 'text-white'
                  }`}>
                    {monthlyCost.toFixed(0)} <span className="text-[10px] text-slate-400 font-normal">kr</span>
                  </div>
                </div>
              </div>

              {/* Savings hint */}
              {savingsVsHighestTrip > 0 && (
                <div className="mt-3 text-[11px] text-emerald-400/90 font-medium flex items-center justify-between">
                  <span>Sparar jämfört med snabbladdning:</span>
                  <span className="font-bold font-mono-numbers">+{savingsVsHighestTrip.toFixed(0)} kr</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
