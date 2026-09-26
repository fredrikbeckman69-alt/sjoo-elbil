import React from 'react';
import { Snowflake, Box, Zap, Wind, AlertCircle } from 'lucide-react';
import { TripConditions } from '../types';
import { calculateEffectiveConsumption, calculateRange } from '../utils/calculations';

interface TripConditionsProps {
  baseConsumption: number;
  batteryCapacityKwh: number;
  conditions: TripConditions;
  onChange: (updated: TripConditions) => void;
}

export const TripConditionsSelector: React.FC<TripConditionsProps> = ({
  baseConsumption,
  batteryCapacityKwh,
  conditions,
  onChange,
}) => {
  const { effectiveKwhPer100Km, increasePercent } = calculateEffectiveConsumption(baseConsumption, conditions);
  const { rangeMil: baseRangeMil } = calculateRange(batteryCapacityKwh, baseConsumption);
  const { rangeMil: effectiveRangeMil } = calculateRange(batteryCapacityKwh, effectiveKwhPer100Km);

  const toggleCondition = (key: keyof TripConditions) => {
    onChange({
      ...conditions,
      [key]: !conditions[key],
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Körförhållanden & Väder</h2>
              {increasePercent > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono-numbers">
                  +{increasePercent}% energi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Viktigt för sällanresenären: Takbox, kyla och fart påverkar räckvidden</p>
          </div>
        </div>

        {/* Live Range Impact Badge */}
        <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
          <div className="text-[10px] text-slate-400 uppercase">Justerad räckvidd</div>
          <div className="text-xs sm:text-sm font-bold text-white font-mono-numbers">
            <span className={increasePercent > 0 ? 'text-amber-400 font-extrabold' : 'text-emerald-400'}>
              {effectiveRangeMil} mil
            </span>{' '}
            <span className="text-[10px] text-slate-500 line-through">({baseRangeMil} mil)</span>
          </div>
        </div>
      </div>

      {/* 3 Interactive Factor Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Toggle 1: Vinter */}
        <button
          type="button"
          onClick={() => toggleCondition('isWinter')}
          className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
            conditions.isWinter
              ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-md shadow-cyan-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <div className={`p-2 rounded-lg ${conditions.isWinter ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Snowflake className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-bold ${conditions.isWinter ? 'text-cyan-400' : 'text-slate-500'}`}>
              +20%
            </span>
          </div>
          <div className="font-bold text-xs text-white">Vinter & Kyla (&le; 0°C)</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kupévärme och kallt batteri</div>
        </button>

        {/* Toggle 2: Takbox */}
        <button
          type="button"
          onClick={() => toggleCondition('hasRoofBox')}
          className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
            conditions.hasRoofBox
              ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-md shadow-amber-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <div className={`p-2 rounded-lg ${conditions.hasRoofBox ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Box className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-bold ${conditions.hasRoofBox ? 'text-amber-400' : 'text-slate-500'}`}>
              +15%
            </span>
          </div>
          <div className="font-bold text-xs text-white">Takbox / Skidbox</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ökat luftmotstånd i fart</div>
        </button>

        {/* Toggle 3: Motorväg */}
        <button
          type="button"
          onClick={() => toggleCondition('isHighwaySpeed')}
          className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
            conditions.isHighwaySpeed
              ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md shadow-emerald-500/10'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <div className={`p-2 rounded-lg ${conditions.isHighwaySpeed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <span className={`text-[11px] font-bold ${conditions.isHighwaySpeed ? 'text-emerald-400' : 'text-slate-500'}`}>
              +15%
            </span>
          </div>
          <div className="font-bold text-xs text-white">Motorväg (110–120 km/h)</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hög marschfart på E4/E6</div>
        </button>
      </div>

      {/* Helpful Hint for Occasional Drivers */}
      {increasePercent > 0 && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-300">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Tips för långresan:</strong> Med dessa inställningar beräknas din förbrukning till{' '}
            <strong className="text-white font-mono-numbers">{effectiveKwhPer100Km} kWh/100km</strong> ({(effectiveKwhPer100Km / 10).toFixed(2)} kWh/mil).
            Kalkylatorn planerar automatiskt in eventuella extra laddstopp nedan!
          </span>
        </div>
      )}
    </div>
  );
};
