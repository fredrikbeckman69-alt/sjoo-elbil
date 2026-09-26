import React from 'react';
import { CalculatedPlanCost } from '../../types/chargingOperators';
import { Crown, Zap } from 'lucide-react';

interface OperatorComparisonTableProps {
  calculatedCosts: CalculatedPlanCost[];
  monthlyKwh: number;
  onSelectPlanForScenario?: (cost: CalculatedPlanCost) => void;
}

export const OperatorComparisonTable: React.FC<OperatorComparisonTableProps> = ({
  calculatedCosts,
  monthlyKwh,
  onSelectPlanForScenario,
}) => {
  return (
    <div className="bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white">Fullständig Prisjämförelse</h3>
          <p className="text-xs text-slate-400">
            Samtliga laddoperatörer och abonnemang rangordnade efter lägst månadskostnad vid{' '}
            <strong className="text-cyan-400 font-mono-numbers">{monthlyKwh} kWh/mån</strong>.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold">
            <tr>
              <th className="py-3 px-4">Placering & Operatör</th>
              <th className="py-3 px-4">Prisplan / Abonnemang</th>
              <th className="py-3 px-4 text-right">Månadsavgift</th>
              <th className="py-3 px-4 text-right">DC Snabbladdning</th>
              <th className="py-3 px-4 text-right">Total Kostnad ({monthlyKwh} kWh)</th>
              <th className="py-3 px-4 text-right">Effektivt Pris</th>
              <th className="py-3 px-4 text-center">Maxeffekt</th>
              <th className="py-3 px-4 text-center">Åtgärd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
            {calculatedCosts.map((item, idx) => {
              const isCheapest = idx === 0;

              return (
                <tr
                  key={`${item.operatorId}-${item.plan.id}`}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isCheapest ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  {/* Operatör */}
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-center gap-2">
                      {isCheapest ? (
                        <span className="p-1 rounded-md bg-emerald-500 text-slate-950">
                          <Crown className="w-3.5 h-3.5 fill-slate-950" />
                        </span>
                      ) : (
                        <span className="w-5 text-center text-[11px] font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                      )}
                      <span className="font-bold text-white text-sm">
                        {item.operatorName}
                      </span>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-slate-200">{item.plan.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {item.plan.discountNote || item.plan.bindingPeriod}
                    </div>
                  </td>

                  {/* Månadsavgift */}
                  <td className="py-3.5 px-4 text-right">
                    {item.plan.isSubscription ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[11px] font-bold">
                        {item.plan.monthlyFee} kr/mån
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">0 kr</span>
                    )}
                  </td>

                  {/* DC Pris per kWh */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-white">
                      {item.plan.priceDcKwh.toFixed(2)} kr
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans block">/kWh</span>
                  </td>

                  {/* Total månadskostnad */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`text-sm font-extrabold ${
                        isCheapest ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {item.totalMonthlyCost.toLocaleString('sv-SE')} kr
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans block">/mån</span>
                  </td>

                  {/* Effektivt kWh pris */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-cyan-300">
                      {item.effectivePricePerKwh.toFixed(2)} kr
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans block">/kWh</span>
                  </td>

                  {/* Maxeffekt */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300">
                      {item.maxPowerKw} kW
                    </span>
                  </td>

                  {/* Knapp */}
                  <td className="py-3.5 px-4 text-center font-sans">
                    {onSelectPlanForScenario && (
                      <button
                        type="button"
                        onClick={() => onSelectPlanForScenario(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition cursor-pointer"
                        title="Räkna på resan med detta pris"
                      >
                        <Zap className="w-4 h-4 text-cyan-400 hover:text-white" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
