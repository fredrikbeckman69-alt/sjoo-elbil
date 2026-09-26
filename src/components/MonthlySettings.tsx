import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

interface MonthlySettingsProps {
  monthlyDistanceMil: number;
  onMonthlyDistanceChange: (mil: number) => void;
}

export const MonthlySettings: React.FC<MonthlySettingsProps> = ({
  monthlyDistanceMil,
  onMonthlyDistanceChange,
}) => {
  const presets = [
    { label: 'Låg (80 mil/mån)', value: 80, kmYear: '9 600 km/år' },
    { label: 'Svensk Snitt (125 mil/mån)', value: 125, kmYear: '15 000 km/år' },
    { label: 'Pendlare (200 mil/mån)', value: 200, kmYear: '24 000 km/år' },
    { label: 'Hög (300 mil/mån)', value: 300, kmYear: '36 000 km/år' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Månadsuppskattning</h2>
            <p className="text-xs text-slate-400">För beräkning av månadskostnad inkl. eventuella fasta avgifter</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 font-mono-numbers">
            {Math.round(monthlyDistanceMil * 12 * 10)} km/år
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Uppskattad körsträcka per månad</span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono-numbers flex items-baseline gap-1.5">
              <span>{monthlyDistanceMil}</span>
              <span className="text-xs font-normal text-slate-400">mil/månad</span>
              <span className="text-xs text-slate-500 font-mono-numbers">({monthlyDistanceMil * 10} km)</span>
            </div>
          </div>

          <div className="w-32 sm:w-48">
            <input
              type="range"
              min="20"
              max="500"
              step="5"
              value={monthlyDistanceMil}
              onChange={(e) => onMonthlyDistanceChange(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Quick preset buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.map((preset) => {
            const isSelected = monthlyDistanceMil === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => onMonthlyDistanceChange(preset.value)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500/60 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold font-mono-numbers">{preset.value} mil/mån</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-purple-400" />
                  {preset.kmYear}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
