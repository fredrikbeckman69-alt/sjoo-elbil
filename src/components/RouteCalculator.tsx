import React, { useState } from 'react';
import { Navigation, MapPin, Search, Loader2, Clock, CheckCircle2, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { calculateRoute, RouteResult } from '../services/routing';

interface RouteCalculatorProps {
  distanceMil: number;
  onDistanceChange: (mil: number) => void;
  startAddress: string;
  onStartAddressChange: (val: string) => void;
  destAddress: string;
  onDestAddressChange: (val: string) => void;
}

export const RouteCalculator: React.FC<RouteCalculatorProps> = ({
  distanceMil,
  onDistanceChange,
  startAddress,
  onStartAddressChange,
  destAddress,
  onDestAddressChange,
}) => {
  const [unitMode, setUnitMode] = useState<'mil' | 'km'>('mil');
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Snabbval för typiska reslängder i mil
  const quickDistances = [
    { label: 'Dagspendling', mil: 2 },
    { label: 'Dagsutflykt', mil: 12 },
    { label: 'Mellanland', mil: 30 },
    { label: 'Långresa', mil: 55 },
  ];

  // Populära svenska exempelrutter
  const exampleRoutes = [
    { start: 'Stockholm', dest: 'Göteborg' },
    { start: 'Malmö', dest: 'Helsingborg' },
    { start: 'Uppsala', dest: 'Stockholm' },
  ];

  const handleSearchRoute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!startAddress.trim() || !destAddress.trim()) {
      setError('Vänligen fyll i både startadress och destination.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await calculateRoute(startAddress, destAddress);
      setRouteResult(res);
      // Mata in den faktiska körsträckan i kalkylen
      onDistanceChange(res.distanceMil);
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
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
              placeholder="T.ex. Stockholm Central eller Kungsgatan 1, Stockholm"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-center -my-1">
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
              placeholder="T.ex. Göteborg, Liseberg eller Åre"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/10 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Beräknar rutt & köravstånd...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Beräkna rutt via OSRM</span>
                </>
              )}
            </button>

            {/* Quick route suggestions */}
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">Förslag:</span>
              {exampleRoutes.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onStartAddressChange(ex.start);
                    onDestAddressChange(ex.dest);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
                >
                  {ex.start} ➔ {ex.dest}
                </button>
              ))}
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
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-emerald-300">Rutt beräknad: </span>
              <span>{routeResult.startPlace} ➔ {routeResult.destPlace}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1 font-mono-numbers font-bold text-white">
              <span>{routeResult.distanceMil} mil</span>
              <span className="text-slate-400 font-normal">({routeResult.distanceKm} km)</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{routeResult.durationText}</span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Distance Control */}
      <div className="border-t border-slate-800/80 pt-4">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Aktiv planerad körsträcka ({unitMode})
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={displayedDistance || ''}
              onChange={(e) => handleManualDistanceChange(e.target.value)}
              className="w-full bg-transparent text-2xl font-black text-white focus:outline-none font-mono-numbers"
              placeholder={unitMode === 'mil' ? '25' : '250'}
            />
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
              {unitMode}
            </span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">Motsvarar:</span>
            <div className="text-right">
              <div className="text-sm font-bold text-white font-mono-numbers">
                {unitMode === 'mil' ? `${Math.round(distanceMil * 10)} km` : `${(distanceMil).toFixed(1)} mil`}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">1 mil = 10 km</div>
            </div>
          </div>
        </div>

        {/* Quick distance buttons */}
        <div className="flex flex-wrap gap-2">
          {quickDistances.map((item) => (
            <button
              key={item.mil}
              type="button"
              onClick={() => onDistanceChange(item.mil)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                Math.abs(distanceMil - item.mil) < 0.1
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {item.label} ({item.mil} mil)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
