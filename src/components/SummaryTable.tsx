import React from 'react';
import { Table, Award } from 'lucide-react';
import { ScenarioResult } from '../types';

interface SummaryTableProps {
  results: ScenarioResult[];
  cheapestTripId: string;
  cheapestMonthlyId: string;
  tripDistanceMil: number;
  monthlyDistanceMil: number;
  embedded?: boolean;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  results,
  cheapestTripId,
  cheapestMonthlyId,
  tripDistanceMil,
  monthlyDistanceMil,
  embedded = false,
}) => {
  const tableContent = (
    <div className="overflow-x-auto -mx-5 sm:mx-0">
      <div className="inline-block min-w-full align-middle px-5 sm:px-0">
        <table className="min-w-full text-left text-xs divide-y divide-slate-800">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-800">
                <th className="py-3 pr-4">Scenario</th>
                <th className="py-3 px-3">Pris (kr/kWh)</th>
                <th className="py-3 px-3">Fast avgift</th>
                <th className="py-3 px-3 text-right">Kostnad / mil</th>
                <th className="py-3 px-3 text-right">Resa ({tripDistanceMil} mil)</th>
                <th className="py-3 pl-3 text-right">Månad ({monthlyDistanceMil} mil)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {results.map((r) => {
                const isCheapestTrip = r.scenario.id === cheapestTripId;
                const isCheapestMonthly = r.scenario.id === cheapestMonthlyId;

                return (
                  <tr
                    key={r.scenario.id}
                    className={`transition hover:bg-slate-800/40 ${
                      isCheapestTrip ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-4 font-sans font-medium text-white flex items-center gap-1.5">
                      <span>{r.scenario.name}</span>
                      {isCheapestTrip && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider">
                          <Award className="w-2.5 h-2.5" /> Resa
                        </span>
                      )}
                      {isCheapestMonthly && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold uppercase tracking-wider">
                          <Award className="w-2.5 h-2.5" /> Månad
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {r.scenario.pricePerKwh.toFixed(2)} kr
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {r.scenario.monthlyFee > 0 ? `${r.scenario.monthlyFee} kr/mån` : '0 kr'}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-200 font-bold">
                      {r.costPerMil.toFixed(2)} kr
                    </td>
                    <td
                      className={`py-3.5 px-3 text-right font-extrabold ${
                        isCheapestTrip ? 'text-emerald-400 text-sm' : 'text-slate-200'
                      }`}
                    >
                      {r.tripCost.toFixed(0)} kr
                    </td>
                    <td
                      className={`py-3.5 pl-3 text-right font-extrabold ${
                        isCheapestMonthly ? 'text-cyan-400 text-sm' : 'text-slate-200'
                      }`}
                    >
                      {r.monthlyCost.toFixed(0)} kr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Table className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Jämförelsetabell</h2>
          <p className="text-xs text-slate-400">Total överblick över alla beräknade nyckeltal</p>
        </div>
      </div>
      {tableContent}
    </div>
  );
};
