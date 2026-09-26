import React, { useState } from 'react';
import { Gauge, Battery, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { VehicleProfile } from '../types';
import { kwhPer100KmToKwhPerMil, calculateRange, DEFAULT_VEHICLE } from '../utils/calculations';

interface VehicleSettingsProps {
  vehicle: VehicleProfile;
  onChange: (updated: VehicleProfile) => void;
}

export const VehicleSettings: React.FC<VehicleSettingsProps> = ({ vehicle, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const kwhPerMil = kwhPer100KmToKwhPerMil(vehicle.consumptionKwhPer100Km);
  const { rangeKm, rangeMil } = calculateRange(vehicle.batteryCapacityKwh, vehicle.consumptionKwhPer100Km);

  const presets = [
    { label: 'Kompakt / Stad (14.5)', value: 14.5, desc: 'T.ex. Renault Zoe, Fiat 500e' },
    { label: 'Familjesuv / Normal (18.5)', value: 18.5, desc: 'T.ex. Tesla Model Y, VW ID.4' },
    { label: 'Vinter / Motorväg (22.5)', value: 22.5, desc: 'Kallt väder, takbox, hög fart' },
  ];

  const handleConsumptionChange = (valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      onChange({ ...vehicle, consumptionKwhPer100Km: val });
    }
  };

  const handleKwhPerMilChange = (valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      // 1 kWh/mil = 10 kWh/100 km
      onChange({ ...vehicle, consumptionKwhPer100Km: Number((val * 10).toFixed(2)) });
    }
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_VEHICLE });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Förbrukningsprofil</h2>
            <p className="text-xs text-slate-400">Ange din elbils förbrukning per 100 km eller per mil</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
          title="Återställ till standardvärden"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Återställ</span>
        </button>
      </div>

      {/* Main Dual Inputs: kWh/100 km and kWh/mil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Input 1: kWh/100 km */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 focus-within:border-emerald-500/50 transition">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Förbrukning (kWh / 100 km)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={vehicle.consumptionKwhPer100Km || ''}
              onChange={(e) => handleConsumptionChange(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-white focus:outline-none font-mono-numbers"
              placeholder="18.5"
            />
            <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
              kWh/100km
            </span>
          </div>
        </div>

        {/* Input 2: kWh/mil (Svensk standard) */}
        <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3.5 focus-within:border-emerald-500/80 transition relative overflow-hidden">
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            <Sparkles className="w-3 h-3" />
            Svensk standard
          </div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Motsvarar i mil (kWh / mil)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={kwhPerMil || ''}
              onChange={(e) => handleKwhPerMilChange(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-emerald-400 focus:outline-none font-mono-numbers"
              placeholder="1.85"
            />
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-md">
              kWh/mil
            </span>
          </div>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="mb-4">
        <span className="text-[11px] font-medium text-slate-400 block mb-2">Snabbval för vanliga elbilar:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isSelected = Math.abs(vehicle.consumptionKwhPer100Km - preset.value) < 0.1;
            return (
              <button
                key={preset.value}
                onClick={() => onChange({ ...vehicle, consumptionKwhPer100Km: preset.value })}
                className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold">{preset.label}</span>
                  <span className="text-[11px] font-mono-numbers text-emerald-400 font-bold">
                    {(preset.value / 10).toFixed(2)} kWh/mil
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion for Battery & Car Name */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 py-1 transition"
        >
          <span className="flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
            Batterikapacitet & fordonets namn
          </span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fordonets namn</label>
              <input
                type="text"
                value={vehicle.name}
                onChange={(e) => onChange({ ...vehicle, name: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="T.ex. Min Tesla / Kia EV6"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Batterikapacitet (kWh netto)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={vehicle.batteryCapacityKwh || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value.replace(',', '.'));
                    if (!isNaN(val) && val >= 0) {
                      onChange({ ...vehicle, batteryCapacityKwh: val });
                    }
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono-numbers"
                  placeholder="77"
                />
                <span className="text-xs text-slate-400 font-medium">kWh</span>
              </div>
            </div>

            <div className="sm:col-span-2 bg-slate-950/40 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Uppskattad maxräckvidd vid 100% laddning:</span>
              <span className="font-bold text-cyan-300 font-mono-numbers">
                {rangeMil} mil ({rangeKm} km)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
