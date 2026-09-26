import React, { useState } from 'react';
import { Compass, BatteryCharging, Clock, ShieldCheck, Sparkles, Coffee, CheckCircle2 } from 'lucide-react';
import { VehicleProfile, TripConditions } from '../types';
import { calculateRoadTripAnalysis } from '../utils/calculations';

interface RoadTripPlannerProps {
  distanceMil: number;
  vehicle: VehicleProfile;
  conditions: TripConditions;
  petrolPricePerLiter?: number;
  homePricePerKwh?: number;
  fastPricePerKwh?: number;
  onSelectRoutePreset?: (start: string, dest: string, distanceMil: number) => void;
}

export const RoadTripPlanner: React.FC<RoadTripPlannerProps> = ({
  distanceMil,
  vehicle,
  conditions,
  petrolPricePerLiter = 17.69,
  homePricePerKwh = 1.15,
  fastPricePerKwh = 4.95,
}) => {
  const [startBatteryPercent, setStartBatteryPercent] = useState<number>(100);
  const [arrivalBufferPercent, setArrivalBufferPercent] = useState<number>(15);

  const analysis = calculateRoadTripAnalysis(
    distanceMil,
    vehicle.consumptionKwhPer100Km,
    vehicle.batteryCapacityKwh,
    conditions,
    startBatteryPercent,
    arrivalBufferPercent,
    homePricePerKwh,
    fastPricePerKwh,
    petrolPricePerLiter
  );

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Långrese-Assistent för Sällanförare</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase">
                Trygghetskalkyl
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Planerar laddstopp, pauser och realistisk kostnad när du ger dig ut på längre turer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ingen räckviddsångest: {arrivalBufferPercent}% säkerhetsmarginal</span>
        </div>
      </div>

      {/* Sliders for Start Battery & Arrival Buffer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              Laddning vid start (hemifrån)
            </span>
            <span className="font-bold text-emerald-400 font-mono-numbers text-sm">{startBatteryPercent}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={startBatteryPercent}
            onChange={(e) => setStartBatteryPercent(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="text-[10px] text-slate-400 mt-1">
            Rekommenderat för sällanresor: 100% fulladdat från laddboxen hemma.
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Önskad säkerhetsmarginal vid ankomst
            </span>
            <span className="font-bold text-cyan-400 font-mono-numbers text-sm">{arrivalBufferPercent}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={arrivalBufferPercent}
            onChange={(e) => setArrivalBufferPercent(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="text-[10px] text-slate-400 mt-1">
            15% kvar i mål ger gott om marginal till hotellet eller stugan.
          </div>
        </div>
      </div>

      {/* 3 Large Reassuring Output Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Antal stopp */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-semibold tracking-wider">Behövs laddning?</span>
              {analysis.stopsCount === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Coffee className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
              {analysis.stopsCount === 0 ? '0 laddstopp' : `${analysis.stopsCount} laddstopp`}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {analysis.stopsCount === 0
              ? 'Ditt batteri räcker hela vägen fram till målet utan att du behöver stanna och ladda!'
              : `Bara ${analysis.stopsCount} snabbt stopp längs vägen räcker för att nå fram med ${arrivalBufferPercent}% i marginal.`}
          </p>
        </div>

        {/* Card 2: Laddtid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-semibold tracking-wider">Beräknad laddpaus</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono-numbers">
              {analysis.stopsCount === 0 ? '0 min' : `~${analysis.chargingTimeMinutes} minuter`}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {analysis.stopsCount === 0
              ? 'Ingen extra restid. Kör raka spåret fram.'
              : 'Passar perfekt för toalettbesök och en kaffe eller lätt lunch medan bilen laddar 10-80%.'}
          </p>
        </div>

        {/* Card 3: Realistisk kostnad */}
        <div className="bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-emerald-500/5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-semibold tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Realistisk Reskostnad
              </span>
              <span className="text-[10px] text-slate-400">Hemma + På väg</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
              {analysis.realisticCost} <span className="text-sm font-normal text-slate-400">kr</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-1.5 text-emerald-400 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400">Bensin motsv:</span>
              <span className="line-through text-slate-500 font-mono-numbers shrink-0">{analysis.petrolCost} kr</span>
            </div>
            <strong className="font-mono-numbers font-bold text-emerald-400 shrink-0">
              -{analysis.savingsVsPetrol} kr billigare
            </strong>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown for the Occasional Driver */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
        <h4 className="font-bold text-white mb-2 flex items-center gap-2">
          <span>Hur räknas den realistiska kostnaden ut för din resa?</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <div>
              <strong className="text-white">Startel hemifrån ({analysis.homeKwh} kWh):</strong>
              <div className="text-slate-400">
                Laddas till din hemmataxa (~{homePricePerKwh.toFixed(2).replace('.', ',')} kr/kWh) = ca <strong>{(analysis.homeKwh * homePricePerKwh).toFixed(0)} kr</strong>.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <div>
              <strong className="text-white">Snabbladdning på vägen ({analysis.highwayKwh} kWh):</strong>
              <div className="text-slate-400">
                Endast överskottet laddas på snabbladdare (~{fastPricePerKwh.toFixed(2).replace('.', ',')} kr/kWh) = ca <strong>{(analysis.highwayKwh * fastPricePerKwh).toFixed(0)} kr</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
