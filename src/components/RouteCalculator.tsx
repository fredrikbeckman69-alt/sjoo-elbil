import React, { useState } from 'react';
import { Navigation, MapPin, Search, Loader2, Clock, CheckCircle2, AlertCircle, ArrowRightLeft, ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import { calculateRoute, RouteResult, formatDuration } from '../services/routing';
import { SWEDISH_ROUTE_PRESETS } from '../utils/calculations';

export interface RouteCalculatorProps {
  distanceMil: number;
  onDistanceChange: (mil: number) => void;
  startAddress: string;
  onStartAddressChange: (val: string) => void;
  destAddress: string;
  onDestAddressChange: (val: string) => void;
  waypoints?: string[];
  onWaypointsChange?: (waypoints: string[]) => void;
  isRoundTrip?: boolean;
  onIsRoundTripChange?: (val: boolean) => void;
  onRouteCalculated?: (res: RouteResult) => void;
}

export const RouteCalculator: React.FC<RouteCalculatorProps> = ({
  distanceMil,
  onDistanceChange,
  startAddress,
  onStartAddressChange,
  destAddress,
  onDestAddressChange,
  waypoints: propWaypoints,
  onWaypointsChange,
  isRoundTrip: propIsRoundTrip,
  onIsRoundTripChange,
  onRouteCalculated,
}) => {
  const [internalRoundTrip, setInternalRoundTrip] = useState<boolean>(false);
  const isRoundTrip = propIsRoundTrip !== undefined ? propIsRoundTrip : internalRoundTrip;

  const [internalWaypoints, setInternalWaypoints] = useState<string[]>([]);
  const waypoints = propWaypoints !== undefined ? propWaypoints : internalWaypoints;

  const handleWaypointsChange = (newWaypoints: string[]) => {
    if (onWaypointsChange) {
      onWaypointsChange(newWaypoints);
    } else {
      setInternalWaypoints(newWaypoints);
    }
  };

  const handleAddWaypoint = () => {
    if (waypoints.length >= 5) return;
    handleWaypointsChange([...waypoints, '']);
  };

  const handleWaypointChange = (index: number, val: string) => {
    const updated = [...waypoints];
    updated[index] = val;
    handleWaypointsChange(updated);
  };

  const handleRemoveWaypoint = (index: number) => {
    const updated = waypoints.filter((_, i) => i !== index);
    handleWaypointsChange(updated);
  };

  const [unitMode, setUnitMode] = useState<'mil' | 'km'>('mil');
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Snabbval för typiska reslängder i mil (enkel resa som bas)
  const quickDistances = [
    { label: 'Dagspendling', mil: 2 },
    { label: 'Dagsutflykt', mil: 12 },
    { label: 'Mellanland', mil: 30 },
    { label: 'Långresa', mil: 55 },
  ];



  const handleToggleRoundTrip = (targetRoundTrip: boolean) => {
    if (targetRoundTrip === isRoundTrip) return;

    if (onIsRoundTripChange) {
      onIsRoundTripChange(targetRoundTrip);
    } else {
      setInternalRoundTrip(targetRoundTrip);
    }

    if (routeResult) {
      const newDist = targetRoundTrip
        ? Number((routeResult.distanceMil * 2).toFixed(2))
        : routeResult.distanceMil;
      onDistanceChange(newDist);
    } else if (distanceMil > 0) {
      const newDist = targetRoundTrip
        ? Number((distanceMil * 2).toFixed(2))
        : Number((distanceMil / 2).toFixed(2));
      onDistanceChange(newDist);
    }
  };

  const handleSearchRoute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!startAddress.trim() || !destAddress.trim()) {
      setError('Vänligen fyll i både startadress och destination.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validWaypoints = waypoints.map((w) => w.trim()).filter((w) => w.length > 0);
      const res = await calculateRoute(startAddress, destAddress, validWaypoints);
      setRouteResult(res);
      if (onRouteCalculated) {
        onRouteCalculated(res);
      }
      // Mata in den faktiska körsträckan i kalkylen (dubblera om tur och retur)
      const targetDist = isRoundTrip ? Number((res.distanceMil * 2).toFixed(2)) : res.distanceMil;
      onDistanceChange(targetDist);
    } catch (err: any) {
      setError(err?.message || 'Ett fel uppstod vid beräkning av rutt. Kontrollera adresserna.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapAddresses = () => {
    const temp = startAddress;
    onStartAddressChange(destAddress);
    onDestAddressChange(temp);
    if (waypoints.length > 1) {
      handleWaypointsChange([...waypoints].reverse());
    }
  };

  const handleSelectPreset = async (preset: (typeof SWEDISH_ROUTE_PRESETS)[0]) => {
    onStartAddressChange(preset.start);
    onDestAddressChange(preset.dest);
    handleWaypointsChange([]);
    const targetDist = isRoundTrip ? preset.distanceMil * 2 : preset.distanceMil;
    onDistanceChange(targetDist);

    // Hämta ruttkoordinater asynkront via OSRM för optimal korridorsökning av laddstationer
    try {
      setLoading(true);
      setError(null);
      const res = await calculateRoute(preset.start, preset.dest, []);
      setRouteResult(res);
      if (onRouteCalculated) {
        onRouteCalculated(res);
      }
    } catch {
      // Fortsätt lugnt med förinställd distans om OSRM misslyckas
    } finally {
      setLoading(false);
    }
  };

  const handleManualDistanceChange = (valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      if (unitMode === 'mil') {
        onDistanceChange(Number(val.toFixed(2)));
      } else {
        // km till mil (1 mil = 10 km)
        onDistanceChange(Number((val / 10).toFixed(2)));
      }
    }
  };

  const displayedDistance = unitMode === 'mil' ? distanceMil : Number((distanceMil * 10).toFixed(1));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Körsträcka & Resekalkyl</h2>
            <p className="text-xs text-slate-400">Beräkna rutt automatiskt eller mata in distans manuellt</p>
          </div>
        </div>

        {/* Mil / Km toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setUnitMode('mil')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              unitMode === 'mil' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mil
          </button>
          <button
            type="button"
            onClick={() => setUnitMode('km')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              unitMode === 'km' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Km
          </button>
        </div>
      </div>

      {/* Ruttberäkning Formulär */}
      <form onSubmit={handleSearchRoute} className="space-y-3 mb-5">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Startadress (Stad, gata eller postnummer)
            </label>
            <input
              type="text"
              value={startAddress}
              onChange={(e) => onStartAddressChange(e.target.value)}
              placeholder="T.ex. Stockholm eller adress"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Delresmål (Waypoints) */}
          {waypoints.map((wp, idx) => (
            <div key={idx} className="relative flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-medium text-amber-400 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  Delresmål {idx + 1}
                </label>
                <input
                  type="text"
                  value={wp}
                  onChange={(e) => handleWaypointChange(idx, e.target.value)}
                  placeholder="T.ex. Linköping eller rastplats"
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveWaypoint(idx)}
                className="mt-5 p-2 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition shrink-0"
                title="Ta bort delresmål"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Knappar: Lägg till delresmål & Växla */}
          <div className="flex items-center justify-between pt-0.5">
            {waypoints.length < 5 ? (
              <button
                type="button"
                onClick={handleAddWaypoint}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 transition active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Lägg till delresmål</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Max 5 delresmål</span>
            )}

            <button
              type="button"
              onClick={handleSwapAddresses}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
              title="Växla start och destination"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
            </button>
          </div>

          <div className="relative">
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-red-400" />
              Destinationsadress (Mål)
            </label>
            <input
              type="text"
              value={destAddress}
              onChange={(e) => onDestAddressChange(e.target.value)}
              placeholder="T.ex. Sälen, Göteborg eller Åre"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Val för Enkel resa eller Tur och retur */}
          <div className="pt-0.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleRoundTrip(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 min-w-0 ${
                  !isRoundTrip
                    ? 'bg-slate-800 border-slate-600 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate">Enkel resa</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleRoundTrip(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 min-w-0 ${
                  isRoundTrip
                    ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-500/60 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Tur och retur (2x)</span>
              </button>
            </div>
          </div>

          {/* Knapp för beräkning via OSRM */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/10 transition active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">Beräknar rutt & köravstånd...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Beräkna rutt via OSRM</span>
                </>
              )}
            </button>
          </div>

          {/* Quick route suggestions */}
          <div className="pt-2 border-t border-slate-800/60">
            <span className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Populära svenska rutter:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SWEDISH_ROUTE_PRESETS.map((preset) => {
                const targetDist = isRoundTrip ? preset.distanceMil * 2 : preset.distanceMil;
                const isSelected =
                  startAddress.trim().toLowerCase() === preset.start.toLowerCase() &&
                  destAddress.trim().toLowerCase() === preset.dest.toLowerCase();

                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-2 rounded-xl text-left border transition flex items-center justify-between gap-1 shadow-sm min-w-0 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-white shadow-cyan-500/10'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                    }`}
                    title={`${preset.start} till ${preset.dest} (${targetDist} mil)`}
                  >
                    <div className="w-full min-w-0 overflow-hidden">
                      <div className="text-[11px] font-bold truncate flex items-center gap-1 min-w-0">
                        <span className="shrink-0">{preset.icon}</span>
                        <span className="truncate">{preset.start} ➔ {preset.dest}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-numbers mt-0.5 flex items-center justify-between gap-1 min-w-0 overflow-hidden">
                        <span className="font-semibold text-cyan-300/90 shrink-0">{targetDist} mil{isRoundTrip ? ' t&r' : ''}</span>
                        {preset.description && (
                          <span className="text-slate-500 truncate text-[9px] text-right min-w-0" title={preset.description}>
                            {preset.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Route Success Banner */}
      {routeResult && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-emerald-300">
                Rutt beräknad{isRoundTrip ? ' (Tur & retur)' : ''}:{' '}
              </span>
              <span>
                {routeResult.startPlace}
                {routeResult.waypoints && routeResult.waypoints.length > 0 && (
                  <>
                    {' '}➔{' '}
                    <span className="text-amber-300 font-medium">
                      {routeResult.waypoints.map((wp) => wp.displayName.split(',')[0]).join(' ➔ ')}
                    </span>
                  </>
                )}
                {' '}{isRoundTrip ? '⇄' : '➔'} {routeResult.destPlace}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300 shrink-0">
            <div className="flex items-center gap-1 font-mono-numbers font-bold text-white">
              <span>{isRoundTrip ? Number((routeResult.distanceMil * 2).toFixed(1)) : routeResult.distanceMil} mil</span>
              <span className="text-slate-400 font-normal">
                ({isRoundTrip ? Math.round(routeResult.distanceKm * 2) : routeResult.distanceKm} km)
              </span>
              {isRoundTrip && (
                <span className="text-[10px] text-cyan-300/90 font-normal ml-1">
                  (Enkel: {routeResult.distanceMil} mil)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-cyan-300">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isRoundTrip
                  ? `${formatDuration(routeResult.durationSeconds * 2)} (t&r)`
                  : routeResult.durationText}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Distance Control */}
      <div className="border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-slate-400">
            Aktiv planerad körsträcka ({unitMode})
          </label>
          {isRoundTrip && (
            <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Tur & retur aktivt (2x)
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center gap-2 min-w-0">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={displayedDistance || ''}
              onChange={(e) => handleManualDistanceChange(e.target.value)}
              className="w-full bg-transparent text-2xl font-black text-white focus:outline-none font-mono-numbers min-w-0"
              placeholder={unitMode === 'mil' ? '25' : '250'}
            />
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20 shrink-0">
              {unitMode}
            </span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between min-w-0 overflow-hidden">
            <span className="text-xs text-slate-400 shrink-0">Motsvarar:</span>
            <div className="text-right min-w-0 overflow-hidden">
              <div className="text-sm font-bold text-white font-mono-numbers truncate">
                {unitMode === 'mil' ? `${Math.round(distanceMil * 10)} km` : `${(distanceMil).toFixed(1)} mil`}
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate">
                {isRoundTrip
                  ? `Enkel: ${(displayedDistance / 2).toFixed(1)} ${unitMode}`
                  : '1 mil = 10 km'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick distance buttons - Jämnstora rutor med grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickDistances.map((item) => {
            const effectiveMil = isRoundTrip ? item.mil * 2 : item.mil;
            const isSelected = Math.abs(distanceMil - effectiveMil) < 0.1;
            return (
              <button
                key={item.mil}
                type="button"
                onClick={() => onDistanceChange(effectiveMil)}
                className={`px-2 py-2 rounded-xl text-xs font-medium border transition text-center flex flex-col items-center justify-center min-w-0 overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span className="truncate font-semibold w-full">{item.label}</span>
                <span className="text-[11px] font-mono-numbers text-slate-400 truncate w-full">
                  {effectiveMil} mil{isRoundTrip ? ' t&r' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
