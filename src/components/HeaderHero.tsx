import React from 'react';
import { Zap, ShieldCheck, BatteryCharging, Gauge } from 'lucide-react';
import { VehicleProfile } from '../types';
import { kwhPer100KmToKwhPerMil, calculateRange } from '../utils/calculations';
import carImage from '../assets/bil.jpg';

interface HeaderHeroProps {
  vehicle: VehicleProfile;
  tripDistanceMil: number;
}

export const HeaderHero: React.FC<HeaderHeroProps> = ({ vehicle, tripDistanceMil }) => {
  const kwhPerMil = kwhPer100KmToKwhPerMil(vehicle.consumptionKwhPer100Km);
  const { rangeKm, rangeMil } = calculateRange(vehicle.batteryCapacityKwh, vehicle.consumptionKwhPer100Km);

  return (
    <header className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8">
      {/* Background Image with Gradient Overlay */}
      <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden">
        <img
          src={carImage}
          alt="Elbil"
          className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05] transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Elbilskalkylator Pro
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            iOS Safe Area & Svensk Standard
          </div>
        </div>

        {/* Hero Title & Info inside Image */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                Förbruknings- & Kostnadskalkyl
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {vehicle.name}
              </h1>
            </div>
            
            {/* Quick Stats Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 shadow-lg">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-medium leading-none">Snittförbrukning</div>
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight font-mono-numbers">
                    {kwhPerMil} <span className="text-[10px] text-emerald-400 font-normal">kWh/mil</span>
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 shadow-lg">
                <BatteryCharging className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 uppercase font-medium leading-none">Räckvidd ({vehicle.batteryCapacityKwh} kWh)</div>
                  <div className="text-xs sm:text-sm font-bold text-white leading-tight font-mono-numbers">
                    {rangeMil} mil <span className="text-[10px] text-slate-400">({rangeKm} km)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-bar with Live Trip Distance Indicator */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-medium">Aktiv resekalkyl:</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 font-mono-numbers">
            {tripDistanceMil} mil ({Math.round(tripDistanceMil * 10)} km)
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-3">
          <span>Energiåtgång resa: <strong className="text-white font-mono-numbers">{(tripDistanceMil * kwhPerMil).toFixed(1)} kWh</strong></span>
        </div>
      </div>
    </header>
  );
};
