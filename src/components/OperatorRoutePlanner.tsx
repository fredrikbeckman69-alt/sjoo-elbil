import React, { useState, useMemo } from 'react';
import {
  Zap,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  BatteryCharging,
  Gauge,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { VehicleProfile, TripConditions } from '../types';
import { SWEDISH_CHARGING_OPERATORS } from '../data/chargingOperatorsData';
import {
  findOptimalChargingStopsAlongRoute,
  RouteOptimizationResult,
  OptimalChargingStop,
} from '../services/routeStopOptimizer';
import {
  calculateEffectiveConsumption,
  kwhPer100KmToKwhPerMil,
} from '../utils/calculations';

export interface OperatorRoutePlannerProps {
  vehicle: VehicleProfile;
  onVehicleChange?: (updated: VehicleProfile) => void;
  conditions: TripConditions;
  tripDistanceMil: number;
  startAddress: string;
  destAddress: string;
  waypoints?: string[];
  routeCoordinates?: [number, number][];
  homePricePerKwh?: number;
  petrolPricePerLiter?: number;
}

export const OperatorRoutePlanner: React.FC<OperatorRoutePlannerProps> = ({
  vehicle,
  onVehicleChange,
  conditions,
  tripDistanceMil,
  startAddress,
  destAddress,
  waypoints = [],
  routeCoordinates = [],
  homePricePerKwh = 1.15,
  petrolPricePerLiter = 17.59,
}) => {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('tesla-supercharger');
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showVehicleSettings, setShowVehicleSettings] = useState<boolean>(false);
  const [startBatteryPercent, setStartBatteryPercent] = useState<number>(100);

  // Hämta vald operatör
  const selectedOperator = useMemo(() => {
    const found = SWEDISH_CHARGING_OPERATORS.find((op) => op.id === selectedOperatorId);
    return found || SWEDISH_CHARGING_OPERATORS[0];
  }, [selectedOperatorId]);

  // Välj plan (abonnemang vs drop-in)
  const activePlan = useMemo(() => {
    if (!selectedOperator.plans || selectedOperator.plans.length === 0) {
      return null;
    }
    if (isSubscription) {
      const sub = selectedOperator.plans.find((p) => p.isSubscription);
      return sub || selectedOperator.plans[0];
    }
    const dropIn = selectedOperator.plans.find((p) => !p.isSubscription);
    return dropIn || selectedOperator.plans[0];
  }, [selectedOperator, isSubscription]);

  // Pris per kWh för aktiv plan
  const priceDcKwh = activePlan?.priceDcKwh ?? 5.25;
  const sessionFee = 0;

  // Filtrera operatörslistan vid sökning
  const filteredOperators = useMemo(() => {
    if (!searchFilter.trim()) return SWEDISH_CHARGING_OPERATORS;
    const q = searchFilter.toLowerCase();
    return SWEDISH_CHARGING_OPERATORS.filter(
      (op) =>
        op.name.toLowerCase().includes(q) ||
        (op.summary && op.summary.toLowerCase().includes(q)) ||
        (op.badgeTag && op.badgeTag.toLowerCase().includes(q))
    );
  }, [searchFilter]);

  // Beräkna optimala laddstopp längs rutten
  const optimizationResult: RouteOptimizationResult = useMemo(() => {
    return findOptimalChargingStopsAlongRoute({
      routeCoordinates,
      totalDistanceMil: tripDistanceMil,
      operatorId: selectedOperator.id,
      operatorName: selectedOperator.name,
      pricePerKwh: priceDcKwh,
      sessionFee,
      homePricePerKwh,
      vehicle,
      conditions,
      startBatteryPercent,
      targetArrivalBufferPercent: 15,
    });
  }, [
    routeCoordinates,
    tripDistanceMil,
    selectedOperator,
    priceDcKwh,
    sessionFee,
    homePricePerKwh,
    vehicle,
    conditions,
    startBatteryPercent,
  ]);

  // Effektiv förbrukning och räckvidd
  const { effectiveKwhPer100Km } = calculateEffectiveConsumption(
    vehicle.consumptionKwhPer100Km,
    conditions
  );
  const effectiveKwhPerMil = kwhPer100KmToKwhPerMil(effectiveKwhPer100Km);

  // Motsvarande bensinbil (ca 0.65 l/mil bensin)
  const petrolTripCost = Number((tripDistanceMil * 0.65 * petrolPricePerLiter).toFixed(0));
  const savingsVsPetrol = Math.max(0, petrolTripCost - optimizationResult.totalTripCostSek);

  const handleSelectOperator = (opId: string) => {
    setSelectedOperatorId(opId);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80 overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Laddoperatör & Reskostnad</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Ruttkalkyl
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Välj operatör för att beräkna realistisk reskostnad och optimala laddstopp
              </p>
              {(startAddress || destAddress) && (
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="text-slate-200 font-medium">{startAddress || 'Start'}</span>
                  {waypoints && waypoints.filter((w) => w.trim()).length > 0 && (
                    <>
                      <span className="text-slate-500">➔</span>
                      <span className="text-amber-300 font-medium">
                        {waypoints.filter((w) => w.trim()).join(' ➔ ')}
                      </span>
                    </>
                  )}
                  <span className="text-slate-500">➔</span>
                  <span className="text-slate-200 font-medium">{destAddress || 'Destination'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Toggle fordonsinställningar */}
          {onVehicleChange && (
            <button
              type="button"
              onClick={() => setShowVehicleSettings(!showVehicleSettings)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 text-xs"
              title="Visa/dölj fordonsinställningar"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fordonsdata</span>
            </button>
          )}
        </div>

        {/* Expanderbara fordonsinställningar vid behov */}
        {showVehicleSettings && onVehicleChange && (
          <div className="mb-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Justera aktiv fordonsdata
              </span>
              <span className="text-[11px] text-slate-400">
                {vehicle.name} ({vehicle.batteryCapacityKwh} kWh)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Batterikapacitet (kWh)</label>
                <input
                  type="number"
                  value={vehicle.batteryCapacityKwh}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      onVehicleChange({ ...vehicle, batteryCapacityKwh: val });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Förbrukning (kWh/100 km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vehicle.consumptionKwhPer100Km}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      onVehicleChange({ ...vehicle, consumptionKwhPer100Km: val });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Startbatteri: <span className="font-mono text-amber-300 font-bold">{startBatteryPercent}%</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={startBatteryPercent}
                  onChange={(e) => setStartBatteryPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Valbara operatörer - Snabbvals-grid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] font-semibold text-slate-300">
              Välj operatör:
            </label>
            {/* Abonnemang vs Drop-in switch */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setIsSubscription(false)}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  !isSubscription
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Drop-in
              </button>
              <button
                type="button"
                onClick={() => setIsSubscription(true)}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  isSubscription
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Medlem / Abonnemang
              </button>
            </div>
          </div>

          {/* Sökfilter för operatörer */}
          <div className="relative mb-2">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Sök bland svenska operatörer..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>

          {/* Grid över svenska operatörer */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredOperators.map((op) => {
              const isSelected = op.id === selectedOperator.id;
              const subPlan = op.plans.find((p) => p.isSubscription);
              const dropPlan = op.plans.find((p) => !p.isSubscription) || op.plans[0];
              const effectivePrice = isSubscription && subPlan ? subPlan.priceDcKwh : dropPlan.priceDcKwh;

              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => handleSelectOperator(op.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between min-h-[62px] min-w-0 ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-500/5 border-amber-500/70 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-amber-300' : 'text-slate-200'
                      }`}
                    >
                      {op.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-mono-numbers">
                    <span className="text-slate-400 font-medium">
                      {effectivePrice.toFixed(2)} kr/kWh
                    </span>
                    {op.badgeTag && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 truncate max-w-[80px]">
                        {op.badgeTag}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Realistisk Reskostnad - Huvudkort */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 mb-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Realistisk Reskostnad ({tripDistanceMil} mil)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-white font-mono-numbers tracking-tight">
                  {optimizationResult.totalTripCostSek} kr
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono-numbers">
                  {optimizationResult.costPerMilSek} kr/mil
                </span>
              </div>
            </div>

            {/* Besparing mot bensin */}
            {savingsVsPetrol > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Jämfört med bensin</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                  <Sparkles className="w-3 h-3" />
                  Spara ca {savingsVsPetrol} kr
                </span>
              </div>
            )}
          </div>

          {/* Detaljerad kostnadsuppdelning: Hemma vid start vs Snabbladdning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">Start från hemmet</div>
                  <div className="text-[10px] text-slate-400 font-mono-numbers">
                    {optimizationResult.homeChargeKwh} kWh à {homePricePerKwh.toFixed(2)} kr
                  </div>
                </div>
              </div>
              <span className="font-bold text-white font-mono-numbers">
                {optimizationResult.homeChargeCostSek} kr
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-200 truncate">
                    {selectedOperator.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-numbers">
                    {optimizationResult.totalFastChargeKwh} kWh à {priceDcKwh.toFixed(2)} kr
                  </div>
                </div>
              </div>
              <span className="font-bold text-amber-300 font-mono-numbers shrink-0 ml-2">
                {optimizationResult.totalFastChargeCostSek} kr
              </span>
            </div>
          </div>
        </div>

        {/* Optimala laddstopp längs rutten */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <BatteryCharging className="w-4 h-4 text-cyan-400" />
              Optimala laddstopp längs vägen
            </h3>
            {optimizationResult.totalStops > 0 && (
              <span className="text-[11px] font-semibold text-cyan-400 font-mono-numbers">
                {optimizationResult.totalStops} {optimizationResult.totalStops === 1 ? 'stopp' : 'stopp'} (~{optimizationResult.totalChargingTimeMinutes} min laddtid)
              </span>
            )}
          </div>

          {/* Scenario 1: Resan klaras helt utan stopp */}
          {optimizationResult.isCoveredWithoutStops && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 block">
                  Inga laddstopp krävs under resan!
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Resan på <span className="font-bold text-white font-mono-numbers">{tripDistanceMil} mil</span> klaras helt på batteriet från start (full laddning hemma ger ca {((vehicle.batteryCapacityKwh * 0.85) / effectiveKwhPerMil).toFixed(0)} mil med 15% marginal).
                </p>
              </div>
            </div>
          )}

          {/* Scenario 2: Laddstopp identifierade och schemalagda */}
          {!optimizationResult.isCoveredWithoutStops && optimizationResult.stops.length > 0 && (
            <div className="space-y-2">
              {optimizationResult.stops.map((stop: OptimalChargingStop, index: number) => (
                <div
                  key={index}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/30 text-xs">
                      {index + 1}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{stop.station.name}</span>
                        {stop.powerKw > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0 font-mono-numbers">
                            {stop.powerKw} kW
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{stop.streetAndCity || stop.station.city || 'Längs rutten'}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-400/90 font-mono-numbers font-medium">
                          Milstolpe: {stop.milestoneMil} mil
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-300 font-medium font-mono-numbers">
                        Ladda {stop.batteryArrivalPercent}% ➔ {stop.batteryDeparturePercent}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-numbers flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        ca {stop.chargingTimeMinutes} min (+{stop.kwhToCharge} kWh)
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-right">
                      <span className="text-xs font-bold text-amber-300 font-mono-numbers block">
                        {stop.costSek} kr
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scenario 3: Vald operatör har inga stationer på korridoren */}
          {!optimizationResult.isCoveredWithoutStops && optimizationResult.stops.length === 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-bold block">
                    Inga {selectedOperator.name}-stationer längs korridoren
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Resan på {tripDistanceMil} mil kräver snabbladdning, men {selectedOperator.name} har inga snabbladdare inom 10 km från denna rutt.
                  </p>
                </div>
              </div>

              {/* Rekommenderade alternativa operatörer längs rutten */}
              {optimizationResult.alternativeOperatorsNearby && optimizationResult.alternativeOperatorsNearby.length > 0 && (
                <div className="pt-2 border-t border-amber-500/20">
                  <span className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Förslag på tillgängliga operatörer längs vägen:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {optimizationResult.alternativeOperatorsNearby.map((alt) => (
                      <button
                        key={alt.operatorName}
                        type="button"
                        onClick={() => {
                          const match = SWEDISH_CHARGING_OPERATORS.find((o) =>
                            o.name.toLowerCase().includes(alt.operatorName.toLowerCase()) ||
                            alt.operatorName.toLowerCase().includes(o.name.toLowerCase())
                          );
                          if (match) {
                            handleSelectOperator(match.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition flex items-center gap-1 active:scale-95"
                      >
                        <span>{alt.operatorName}</span>
                        <span className="text-slate-400 text-[10px]">({alt.count} st)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
