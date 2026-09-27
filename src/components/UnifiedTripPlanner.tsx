import React, { useState, useEffect, useMemo } from 'react';
import {
  Navigation,
  MapPin,
  BatteryCharging,
  Zap,
  Clock,
  ArrowRightLeft,
  ArrowLeftRight,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Snowflake,
  Box,
  Sliders,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Plus,
  Compass,
  Map,
  CheckCircle,
  Share2,
  Copy,
  Check,
  Printer,
  Star,
  X,
} from 'lucide-react';
import { VehicleProfile, TripConditions, StationFacility } from '../types';
import { ChargingOperator } from '../types/chargingOperators';
import { SWEDISH_CHARGING_OPERATORS } from '../data/chargingOperatorsData';
import { fetchCurrentOperatorPrices } from '../services/operatorPriceService';
import {
  findOptimalChargingStopsAlongRoute,
  RouteOptimizationResult,
  OptimalChargingStop,
} from '../services/routeStopOptimizer';
import { calculateRoute, RouteResult, formatDuration } from '../services/routing';
import {
  calculateEffectiveConsumption,
  calculateRange,
  kwhPer100KmToKwhPerMil,
} from '../utils/calculations';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { POPULAR_MEMBERSHIPS } from '../services/spotPriceService';

export interface UnifiedTripPlannerProps {
  vehicle: VehicleProfile;
  onVehicleChange?: (updated: VehicleProfile) => void;
  conditions: TripConditions;
  onConditionsChange: (updated: TripConditions) => void;
  startAddress: string;
  onStartAddressChange: (val: string) => void;
  destAddress: string;
  onDestAddressChange: (val: string) => void;
  waypoints?: string[];
  onWaypointsChange?: (waypoints: string[]) => void;
  distanceMil: number;
  onDistanceChange: (mil: number) => void;
  isRoundTrip: boolean;
  onIsRoundTripChange: (val: boolean) => void;
  routeResult: RouteResult | null;
  onRouteCalculated: (res: RouteResult) => void;
  homePricePerKwh?: number;
  petrolPricePerLiter?: number;
  onSwitchToMapTab?: () => void;
  activeMemberships?: string[];
  electricityArea?: 'SE1' | 'SE2' | 'SE3' | 'SE4';
}

const ALL_OPERATORS_CHOICE: ChargingOperator = {
  id: 'all',
  name: 'Bästa längs vägen (Alla operatörer)',
  brandColor: 'cyan',
  logoText: 'ALLA',
  badgeTag: 'Mest flexibelt',
  summary: 'Väljer automatiskt optimala snabbladdare oavsett nätverk (Tesla, Ionity, Circle K m.fl.)',
  networkSize: '3 900+ laddpunkter',
  maxPowerKw: 350,
  coverageDescription: 'Hela Sverige',
  paymentMethods: ['App', 'Kortterminal', 'RFID'],
  websiteUrl: '',
  appName: 'Flera appar',
  pros: ['Maximal flexibilitet', 'Kortaste omvägar'],
  cons: ['Varierande kWh-priser beroende på nätverk'],
  plans: [
    {
      id: 'all-dropin',
      name: 'Alla nätverk',
      description: 'Laddar på närmaste och snabbaste station längs rutten',
      monthlyFee: 0,
      priceDcKwh: 4.95,
      bindingPeriod: 'Ingen',
      isSubscription: false,
    },
  ],
};

export const UnifiedTripPlanner: React.FC<UnifiedTripPlannerProps> = ({
  vehicle,
  onVehicleChange,
  conditions,
  onConditionsChange,
  startAddress,
  onStartAddressChange,
  destAddress,
  onDestAddressChange,
  waypoints = [],
  onWaypointsChange,
  distanceMil,
  onDistanceChange,
  isRoundTrip,
  onIsRoundTripChange,
  routeResult,
  onRouteCalculated,
  homePricePerKwh = 1.15,
  petrolPricePerLiter = 17.59,
  onSwitchToMapTab,
  activeMemberships = [],
  electricityArea = 'SE3',
}) => {
  // Lokala tillstånd för batterireglage
  const [startBatteryPercent, setStartBatteryPercent] = useState<number>(100);
  const [arrivalBufferPercent, setArrivalBufferPercent] = useState<number>(15);
  const [showVehicleSettings, setShowVehicleSettings] = useState<boolean>(false);

  // Delnings- och favoritresorstillstånd
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [favoriteDests, setFavoriteDests] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('elbil_favorite_destinations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavoriteDest = (place: string) => {
    const trimmed = place.trim();
    if (!trimmed) return;
    setFavoriteDests((prev) => {
      const exists = prev.some((p) => p.toLowerCase() === trimmed.toLowerCase());
      const next = exists
        ? prev.filter((p) => p.toLowerCase() !== trimmed.toLowerCase())
        : [trimmed, ...prev].slice(0, 10);
      try {
        localStorage.setItem('elbil_favorite_destinations', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Operatörstillstånd
  const [operators, setOperators] = useState<ChargingOperator[]>([
    ALL_OPERATORS_CHOICE,
    ...SWEDISH_CHARGING_OPERATORS,
  ]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('all');
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Ruttberäkningstillstånd
  const [unitMode, setUnitMode] = useState<'mil' | 'km'>('mil');
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Hämta färska operatörspriser
  useEffect(() => {
    fetchCurrentOperatorPrices().then((fresh) => {
      if (fresh && fresh.length > 0) {
        setOperators([ALL_OPERATORS_CHOICE, ...fresh]);
      }
    });

    const interval = setInterval(() => {
      fetchCurrentOperatorPrices().then((fresh) => {
        if (fresh && fresh.length > 0) {
          setOperators([ALL_OPERATORS_CHOICE, ...fresh]);
        }
      });
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  // Hitta vald operatör
  const selectedOperator = useMemo(() => {
    const found = operators.find((op) => op.id === selectedOperatorId);
    return found || operators[0] || ALL_OPERATORS_CHOICE;
  }, [operators, selectedOperatorId]);

  // Hitta aktiv prisplan
  const activePlan = useMemo(() => {
    if (!selectedOperator.plans || selectedOperator.plans.length === 0) return null;
    if (isSubscription) {
      const sub = selectedOperator.plans.find((p) => p.isSubscription);
      return sub || selectedOperator.plans[0];
    }
    const dropIn = selectedOperator.plans.find((p) => !p.isSubscription);
    return dropIn || selectedOperator.plans[0];
  }, [selectedOperator, isSubscription]);

  const priceDcKwh = activePlan?.priceDcKwh ?? 4.95;

  // Filtrera operatörslistan
  const filteredOperators = useMemo(() => {
    if (!searchFilter.trim()) return operators;
    const q = searchFilter.toLowerCase();
    return operators.filter(
      (op) =>
        op.name.toLowerCase().includes(q) ||
        (op.summary && op.summary.toLowerCase().includes(q)) ||
        (op.badgeTag && op.badgeTag.toLowerCase().includes(q))
    );
  }, [operators, searchFilter]);

  // Beräkna effektiv förbrukning & räckvidder
  const { effectiveKwhPer100Km, increasePercent } = calculateEffectiveConsumption(
    vehicle.consumptionKwhPer100Km,
    conditions
  );
  const effectiveKwhPerMil = kwhPer100KmToKwhPerMil(effectiveKwhPer100Km);
  const { rangeMil: effectiveRangeMil } = calculateRange(
    vehicle.batteryCapacityKwh,
    effectiveKwhPer100Km
  );

  // Räckvidd på startbatteriet ned till vald säkerhetsbuffert
  const startUsableBatteryKwh =
    vehicle.batteryCapacityKwh * Math.max(0, (startBatteryPercent - arrivalBufferPercent) / 100);
  const rangeOnStartChargeMil =
    effectiveKwhPerMil > 0 ? Number((startUsableBatteryKwh / effectiveKwhPerMil).toFixed(1)) : 0;

  // Beräkna optimala laddstopp längs rutten
  const optimizationResult: RouteOptimizationResult = useMemo(() => {
    return findOptimalChargingStopsAlongRoute({
      routeCoordinates: routeResult?.routeCoordinates || [],
      totalDistanceMil: distanceMil,
      startAddress,
      destAddress,
      operatorId: selectedOperator.id,
      operatorName: selectedOperator.name,
      pricePerKwh: priceDcKwh,
      sessionFee: 0,
      homePricePerKwh,
      vehicle,
      conditions,
      startBatteryPercent,
      targetArrivalBufferPercent: arrivalBufferPercent,
      activeMemberships,
    });
  }, [
    routeResult,
    distanceMil,
    startAddress,
    destAddress,
    selectedOperator,
    priceDcKwh,
    homePricePerKwh,
    vehicle,
    conditions,
    startBatteryPercent,
    arrivalBufferPercent,
    activeMemberships,
  ]);

  const generateShareSummaryText = () => {
    const lines: string[] = [];
    lines.push(`⚡ RESPLAN ELBIL (${vehicle.name})`);
    lines.push(`📍 Rutt: ${startAddress} ➔ ${destAddress}`);
    lines.push(`📏 Körsträcka: ${distanceMil} mil${isRoundTrip ? ' (Tur & Retur)' : ''}`);
    if (routeResult?.durationText) {
      lines.push(`⏱️ Körtid: ${isRoundTrip ? `${formatDuration(routeResult.durationSeconds * 2)} (t&r)` : routeResult.durationText}`);
    }
    lines.push(`🔋 Startladdning: ${startBatteryPercent}%`);
    lines.push(`💰 Beräknad reskostnad: ${optimizationResult.totalTripCostSek} kr (${optimizationResult.costPerMilSek} kr/mil)`);

    if (optimizationResult.stops.length === 0) {
      lines.push(`✅ Hela resan klaras utan laddstopp!`);
    } else {
      lines.push(`\n🔌 LADDSTOPP (${optimizationResult.stops.length} st, total laddtid ~${optimizationResult.totalChargingTimeMinutes} min):`);
      optimizationResult.stops.forEach((s, idx) => {
        lines.push(`${idx + 1}. ${s.station.name}`);
        lines.push(`   Plats: ${s.address || s.streetAndCity}`);
        lines.push(`   Laddning: ${s.batteryArrivalPercent}% ➔ ${s.batteryDeparturePercent}% (+${s.kwhToCharge} kWh)`);
        lines.push(`   Laddtid: ~${s.chargingTimeMinutes} min | Kostnad: ${s.costSek} kr`);
        lines.push(`   Google Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((s.address || s.streetAndCity) + ' ' + s.station.name)}`);
        lines.push(`   Apple Maps: https://maps.apple.com/?q=${encodeURIComponent((s.address || s.streetAndCity) + ' ' + s.station.name)}`);
        lines.push(`   Waze: https://waze.com/ul?q=${encodeURIComponent((s.address || s.streetAndCity) + ' ' + s.station.name)}`);
      });
    }

    lines.push(`\nBeräknad med Elbilskalkylator`);
    return lines.join('\n');
  };

  const handleShareTrip = async () => {
    const text = generateShareSummaryText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Resplan: ${startAddress} till ${destAddress}`,
          text,
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setIsShareModalOpen(true);
        }
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleCopyShareText = async () => {
    const text = generateShareSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch (e) {
      console.warn('Kunde inte kopiera till urklipp', e);
    }
  };

  // Kostnad för motsvarande bensinbil (0.65 l/mil)
  const petrolTripCost = Number((distanceMil * 0.65 * petrolPricePerLiter).toFixed(0));
  const savingsVsPetrol = Math.max(0, petrolTripCost - optimizationResult.totalTripCostSek);

  // Hantera ruttberäkning via OSRM
  const handleSearchRoute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!startAddress.trim() || !destAddress.trim()) {
      setRouteError('Vänligen fyll i både startadress och destination.');
      return;
    }

    setLoadingRoute(true);
    setRouteError(null);

    try {
      const validWaypoints = waypoints.map((w) => w.trim()).filter((w) => w.length > 0);
      const res = await calculateRoute(startAddress, destAddress, validWaypoints);
      onRouteCalculated(res);
      const targetDist = isRoundTrip ? Number((res.distanceMil * 2).toFixed(2)) : res.distanceMil;
      onDistanceChange(targetDist);
    } catch (err: any) {
      const raw = String(err?.message || '');
      let friendly = 'Ett fel uppstod vid beräkning av rutt. Kontrollera adresserna.';
      if (raw.toLowerCase().includes('failed to fetch') || raw.toLowerCase().includes('networkerror') || raw.toLowerCase().includes('load failed')) {
        friendly = 'Nätverksanslutningen kunde inte nå den externa karttjänsten. Kontrollera stavning eller internetuppkoppling.';
      } else if (raw) {
        friendly = raw;
      }
      setRouteError(friendly);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSwapAddresses = () => {
    const temp = startAddress;
    onStartAddressChange(destAddress);
    onDestAddressChange(temp);
    if (waypoints.length > 1 && onWaypointsChange) {
      onWaypointsChange([...waypoints].reverse());
    }
  };

  const handleAddWaypoint = () => {
    if (waypoints.length >= 5 || !onWaypointsChange) return;
    onWaypointsChange([...waypoints, '']);
  };

  const handleWaypointChange = (index: number, val: string) => {
    if (!onWaypointsChange) return;
    const updated = [...waypoints];
    updated[index] = val;
    onWaypointsChange(updated);
  };

  const handleRemoveWaypoint = (index: number) => {
    if (!onWaypointsChange) return;
    onWaypointsChange(waypoints.filter((_, i) => i !== index));
  };

  const handleToggleRoundTrip = (targetRoundTrip: boolean) => {
    if (targetRoundTrip === isRoundTrip) return;
    onIsRoundTripChange(targetRoundTrip);

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

  const handleManualDistanceChange = (valStr: string) => {
    const val = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(val) && val >= 0) {
      if (unitMode === 'mil') {
        onDistanceChange(Number(val.toFixed(2)));
      } else {
        onDistanceChange(Number((val / 10).toFixed(2)));
      }
    }
  };

  const toggleCondition = (key: keyof TripConditions) => {
    onConditionsChange({
      ...conditions,
      [key]: !conditions[key],
    });
  };

  const displayedDistance =
    unitMode === 'mil' ? distanceMil : Number((distanceMil * 10).toFixed(1));

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden space-y-6">
      {/* Dekorativ topplinje */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500" />

      {/* Huvudrubrik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Rese- & Laddningsplanerare
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider">
                Steg-för-steg
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Planera din rutt, justera förhållanden, välj operatör och se exakta laddstopp utan räckviddsångest
            </p>
          </div>
        </div>

        {/* Livefordonsindikator & Fordonsdata-knapp */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-slate-800 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400">Effektiv räckvidd: </span>
              <span className="font-bold text-emerald-400 font-mono-numbers">{effectiveRangeMil} mil</span>
              <span className="text-slate-500 text-[11px] ml-1">({vehicle.batteryCapacityKwh} kWh)</span>
            </div>
          </div>

          {onVehicleChange && (
            <button
              type="button"
              onClick={() => setShowVehicleSettings(!showVehicleSettings)}
              className="p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
              title="Justera fordonets batteri och förbrukning"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Fordonsdata</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanderbar fordonsdata */}
      {showVehicleSettings && onVehicleChange && (
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Batterikapacitet (kWh)</label>
            <input
              type="number"
              value={vehicle.batteryCapacityKwh}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) onVehicleChange({ ...vehicle, batteryCapacityKwh: val });
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Basförbrukning (kWh/100 km)</label>
            <input
              type="number"
              step="0.1"
              value={vehicle.consumptionKwhPer100Km}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) onVehicleChange({ ...vehicle, consumptionKwhPer100Km: val });
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEG 1: RUTT & STRÄCKA */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center border border-cyan-500/30">
              1
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">Rutt & Körsträcka</h2>
          </div>

          {/* Mil / Km Enhetsväljare */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
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

        {/* Adressinmatning & Formulär */}
        <form onSubmit={handleSearchRoute} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Startadress med autokomplettering */}
            <div>
              <PlaceAutocomplete
                value={startAddress}
                onChange={(val) => {
                  onStartAddressChange(val);
                  if (routeError) setRouteError(null);
                }}
                label="Startadress (Stad eller gata)"
                placeholder="T.ex. Skövde, Sverige eller hemadress"
                icon={<MapPin className="w-3.5 h-3.5 text-emerald-400" />}
              />
            </div>

            {/* Destinationsadress med autokomplettering */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  Destination (Mål)
                </span>
                <div className="flex items-center gap-2">
                  {destAddress.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleFavoriteDest(destAddress)}
                      className={`text-[10px] flex items-center gap-1 cursor-pointer transition ${
                        favoriteDests.some((f) => f.toLowerCase() === destAddress.trim().toLowerCase())
                          ? 'text-amber-400 font-bold'
                          : 'text-slate-400 hover:text-amber-300'
                      }`}
                      title={
                        favoriteDests.some((f) => f.toLowerCase() === destAddress.trim().toLowerCase())
                          ? 'Ta bort från favoriter'
                          : 'Spara som favoritresmål'
                      }
                    >
                      <Star
                        className={`w-3 h-3 ${
                          favoriteDests.some((f) => f.toLowerCase() === destAddress.trim().toLowerCase())
                            ? 'fill-amber-400 text-amber-400'
                            : ''
                        }`}
                      />
                      <span>
                        {favoriteDests.some((f) => f.toLowerCase() === destAddress.trim().toLowerCase())
                          ? 'Sparad'
                          : 'Favorit'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSwapAddresses}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Växla start och destination"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Växla</span>
                  </button>
                </div>
              </div>
              <PlaceAutocomplete
                value={destAddress}
                onChange={(val) => {
                  onDestAddressChange(val);
                  if (routeError) setRouteError(null);
                }}
                placeholder="T.ex. Pajala, Göteborg eller Malmö"
                icon={<MapPin className="w-3.5 h-3.5 text-rose-400" />}
              />
            </div>
          </div>

          {/* Snabbval / Favoritresor */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" />
              Snabbval:
            </span>
            {/* Egna sparade favoriter först */}
            {favoriteDests.map((fav) => (
              <button
                key={`fav-${fav}`}
                type="button"
                onClick={() => {
                  onDestAddressChange(fav);
                  if (routeError) setRouteError(null);
                }}
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  destAddress.toLowerCase().includes(fav.toLowerCase())
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                    : 'bg-slate-900 border-slate-700/80 text-amber-200 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{fav}</span>
              </button>
            ))}
            {/* Populära standardorter */}
            {['Göteborg', 'Stockholm', 'Malmö', 'Jönköping', 'Sälen', 'Åre', 'Pajala']
              .filter((d) => !favoriteDests.some((f) => f.toLowerCase() === d.toLowerCase()))
              .map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => {
                    onDestAddressChange(place);
                    if (routeError) setRouteError(null);
                  }}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                    destAddress.toLowerCase().includes(place.toLowerCase())
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {place}
                </button>
              ))}
          </div>

          {/* Delresmål (Waypoints) */}
          {waypoints.length > 0 && (
            <div className="space-y-2 pt-1">
              {waypoints.map((wp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-amber-400 mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      Delresmål / Via {idx + 1}
                    </label>
                    <input
                      type="text"
                      value={wp}
                      onChange={(e) => handleWaypointChange(idx, e.target.value)}
                      placeholder="T.ex. Jönköping eller rastplats"
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWaypoint(idx)}
                    className="mt-4 p-2 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 transition shrink-0"
                    title="Ta bort delresmål"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Enkel resa vs Tur & Retur + Ruttval + Lägg till delmål + Beräkna-knapp */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {waypoints.length < 5 && onWaypointsChange && (
                <button
                  type="button"
                  onClick={handleAddWaypoint}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-2 rounded-xl border border-cyan-500/20 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Lägg till via-stopp</span>
                </button>
              )}

              {/* Enkel vs Tur/Retur */}
              <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleRoundTrip(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    !isRoundTrip
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Enkel resa
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleRoundTrip(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    isRoundTrip
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                  <span>Tur & Retur (2x)</span>
                </button>
              </div>

              {/* Ruttval: Snabbast vs Energisnål */}
              <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onConditionsChange({ ...conditions, routePreference: 'fastest' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    conditions.routePreference !== 'eco'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Snabbaste vägen via motorväg i 110-120 km/h"
                >
                  Snabbast (Motorväg)
                </button>
                <button
                  type="button"
                  onClick={() => onConditionsChange({ ...conditions, routePreference: 'eco' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    conditions.routePreference === 'eco'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Energisnål rutt (landsväg / eco-fart, sparar ca 10% förbrukning)"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Energisnål (-10%)</span>
                </button>
              </div>
            </div>

            {/* Sök rutt knapp */}
            <button
              type="submit"
              disabled={loadingRoute}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/10 transition active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm"
            >
              {loadingRoute ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Beräknar rutt & väg...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Beräkna rutt via OSRM</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Felmeddelande vid ruttberäkning */}
        {routeError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{routeError}</span>
          </div>
        )}

        {/* Beräknat ruttresultat & Manuell finjustering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
          {/* Vänster: Ruttstatus från kartmotor */}
          {routeResult && (destAddress.trim().length === 0 || routeResult.destPlace.toLowerCase().includes(destAddress.trim().toLowerCase().split(',')[0]) || destAddress.trim().toLowerCase().includes(routeResult.destPlace.toLowerCase().split(',')[0])) ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-slate-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-white">
                    {routeResult.startPlace.split(',')[0]} {isRoundTrip ? '⇄' : '➔'}{' '}
                    {routeResult.destPlace.split(',')[0]}
                  </span>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>
                      {isRoundTrip
                        ? `${(routeResult.distanceMil * 2).toFixed(1)} mil (t&r)`
                        : `${routeResult.distanceMil} mil`}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Clock className="w-3 h-3" />
                      {isRoundTrip
                        ? `${formatDuration(routeResult.durationSeconds * 2)} (t&r)`
                        : routeResult.durationText}
                    </span>
                    {routeResult.isFallbackEstimate && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                          Resilient vägnätsberäkning
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                {destAddress.trim().length > 0
                  ? `Klicka på "Beräkna rutt via OSRM" för att beräkna sträckan till ${destAddress}.`
                  : 'Ange destination ovan och klicka på "Beräkna rutt via OSRM".'}
              </span>
            </div>
          )}

          {/* Höger: Manuell justering av sträcka */}
          <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300">
                Planerad körsträcka:
              </label>
              <span className="text-[10px] text-slate-500">
                {isRoundTrip ? 'Inkluderar tur & retur' : 'Enkel körsträcka'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="1"
                max="5000"
                value={displayedDistance || ''}
                onChange={(e) => handleManualDistanceChange(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-right font-mono-numbers font-bold text-white text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs font-bold text-slate-400 uppercase">{unitMode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEG 2: BIL & FÖRUTSÄTTNINGAR (BATTERI & YTTRE FAKTORER) */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/30">
              2
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Batteri & Körförhållanden
              </h2>
              <p className="text-xs text-slate-400">
                Ställ in startladdning och yttre faktorer som påverkar bilens verkliga räckvidd
              </p>
            </div>
          </div>

          {/* Beräknad förbruknings-badge */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400">Justerad förbrukning:</span>
            <span className="font-bold text-white font-mono-numbers">
              {effectiveKwhPerMil.toFixed(2)} kWh/mil
            </span>
            {increasePercent > 0 && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-mono-numbers">
                +{increasePercent}%
              </span>
            )}
          </div>
        </div>

        {/* Sliders för Startbatteri (%) & Buffert vid ankomst (%) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 rounded-xl p-4 border border-slate-800">
          {/* Startbatteri */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                Batteriladdning vid start
              </span>
              <span className="font-bold text-emerald-400 font-mono-numbers text-sm">
                {startBatteryPercent}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={startBatteryPercent}
              onChange={(e) => setStartBatteryPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10% (nästan tomt)</span>
              <span>80% (standard)</span>
              <span>100% (fullt hemma)</span>
            </div>
          </div>

          {/* Ankomstbuffert */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Säkerhetsmarginal vid ankomst / stopp
              </span>
              <span className="font-bold text-cyan-400 font-mono-numbers text-sm">
                {arrivalBufferPercent}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="25"
              step="1"
              value={arrivalBufferPercent}
              onChange={(e) => setArrivalBufferPercent(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10% (tajt)</span>
              <span>15% (rekommenderat)</span>
              <span>25% (extra trygg)</span>
            </div>
          </div>
        </div>

        {/* 3 Interaktiva påverkansfaktorer (Väder, Takbox, Hastighet) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Toggle 1: Vinter */}
          <button
            type="button"
            onClick={() => toggleCondition('isWinter')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              conditions.isWinter
                ? 'bg-cyan-950/40 border-cyan-500/80 text-white shadow-md shadow-cyan-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`p-2 rounded-lg ${
                  conditions.isWinter ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Snowflake className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-bold font-mono-numbers ${
                  conditions.isWinter ? 'text-cyan-400' : 'text-slate-500'
                }`}
              >
                +20%
              </span>
            </div>
            <div className="font-bold text-xs text-white">Vinter & Kyla (≤ 0°C)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Kupévärme och kallt batteri</div>
          </button>

          {/* Toggle 2: Takbox */}
          <button
            type="button"
            onClick={() => toggleCondition('hasRoofBox')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              conditions.hasRoofBox
                ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-md shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`p-2 rounded-lg ${
                  conditions.hasRoofBox ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Box className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-bold font-mono-numbers ${
                  conditions.hasRoofBox ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                +15%
              </span>
            </div>
            <div className="font-bold text-xs text-white">Takbox / Skidbox</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Ökat luftmotstånd i fart</div>
          </button>

          {/* Toggle 3: Motorvägshastighet */}
          <button
            type="button"
            onClick={() => toggleCondition('isHighwaySpeed')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              conditions.isHighwaySpeed
                ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md shadow-emerald-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`p-2 rounded-lg ${
                  conditions.isHighwaySpeed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-bold font-mono-numbers ${
                  conditions.isHighwaySpeed ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                +15%
              </span>
            </div>
            <div className="font-bold text-xs text-white">Motorväg (110–120 km/h)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Hög marschfart på E4/E6</div>
          </button>
        </div>

        {/* Direkt insikt: Hur långt räcker startbatteriet */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-300">
              Med <strong className="text-emerald-300 font-mono-numbers">{startBatteryPercent}%</strong> startladdning och{' '}
              <strong className="text-cyan-300 font-mono-numbers">{arrivalBufferPercent}%</strong> buffert tar du dig{' '}
              <strong className="text-white font-mono-numbers text-sm underline decoration-cyan-400/50 underline-offset-4">
                {rangeOnStartChargeMil} mil
              </strong>{' '}
              innan första laddstopp krävs.
            </span>
          </div>

          {distanceMil > rangeOnStartChargeMil && (
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Laddstopp krävs under resan ({distanceMil} mil totalt)
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEG 3: VAL AV LADDOPERATÖR & OPTIMALA LADDSTOPP */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-500/30">
              3
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Laddoperatör & Laddstopp längs vägen
              </h2>
              <p className="text-xs text-slate-400">
                Välj nätverk för att se exakta stationer, laddtider och pris
              </p>
            </div>
          </div>

          {/* Abonnemang vs Drop-in */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setIsSubscription(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !isSubscription ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Drop-in taxa
            </button>
            <button
              type="button"
              onClick={() => setIsSubscription(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                isSubscription ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Medlem / Abonnemang
            </button>
          </div>
        </div>

        {/* Aktiva medlemskap från profilen */}
        {activeMemberships && activeMemberships.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Mina laddförmåner:</span>
            {activeMemberships.map((mId) => {
              const mem = POPULAR_MEMBERSHIPS.find((m) => m.id === mId);
              if (!mem) return null;
              return (
                <span key={mId} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                  {mem.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Sök och välj bland operatörer */}
        <div className="space-y-2.5">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Sök operatör (Tesla, Circle K, Ionity, InCharge, Recharge, OKQ8 m.fl.)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredOperators.map((op) => {
              const isSelected = op.id === selectedOperator.id;
              const subPlan = op.plans.find((p) => p.isSubscription);
              const dropPlan = op.plans.find((p) => !p.isSubscription) || op.plans[0];
              const effectivePrice = isSubscription && subPlan ? subPlan.priceDcKwh : dropPlan.priceDcKwh;

              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setSelectedOperatorId(op.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between min-h-[66px] min-w-0 ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-500/5 border-amber-500/70 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300'
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
                    {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-mono-numbers">
                    <span className="text-slate-400 font-medium">
                      {effectivePrice.toFixed(2)} kr/kWh
                    </span>
                    {op.badgeTag && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 truncate max-w-[85px]">
                        {op.badgeTag}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visning av Laddstopp */}
        <div className="pt-2">
          {distanceMil <= 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
              <Navigation className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">Fyll i din resrutt ovan</span>
                <p className="text-slate-400 mt-0.5">
                  Ange start och destination eller mata in en körsträcka i Steg 1 för att beräkna laddstopp och kostnader längs vägen.
                </p>
              </div>
            </div>
          ) : optimizationResult.isCoveredWithoutStops ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-slate-200">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 text-sm block">
                  Inga laddstopp behövs under resan!
                </span>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Hela resan på <strong className="text-white font-mono-numbers">{distanceMil} mil</strong> klaras på batteriet du har vid start ({startBatteryPercent}% ger ca {rangeOnStartChargeMil} mil räckvidd med din {arrivalBufferPercent}% säkerhetsmarginal).
                </p>
              </div>
            </div>
          ) : optimizationResult.stops.length > 0 ? (
            /* Scenario B: Optimerade laddstopp längs vägen */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <BatteryCharging className="w-4 h-4 text-cyan-400" />
                  Rekommenderade laddstopp ({optimizationResult.totalStops} st)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-mono-numbers">
                    Total laddtid: ~{optimizationResult.totalChargingTimeMinutes} min
                  </span>
                  <button
                    type="button"
                    onClick={handleShareTrip}
                    className="text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                    title="Dela resplan via SMS/iMessage, WhatsApp, kopiera eller skriv ut"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Dela</span>
                  </button>
                  {onSwitchToMapTab && (
                    <button
                      type="button"
                      onClick={onSwitchToMapTab}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>Karta</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Lista över laddstopp */}
              <div className="space-y-2.5">
                {optimizationResult.stops.map((stop: OptimalChargingStop, index: number) => {
                  const mapQuery = `${stop.address || stop.streetAndCity} ${stop.station.name}`;
                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
                  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(mapQuery)}`;
                  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(mapQuery)}`;
                  const facs = stop.facilities && stop.facilities.length > 0 ? stop.facilities : (['wc', 'food'] as StationFacility[]);

                  return (
                    <div
                      key={index}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/30 text-xs mt-0.5">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 font-bold text-white text-sm">
                              <span>{stop.station.name}</span>
                              {stop.powerKw > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono-numbers">
                                  {stop.powerKw} kW
                                </span>
                              )}
                            </div>

                            {/* Adress & Milstolpe */}
                            <div className="mt-1 space-y-1 text-xs">
                              <div className="flex items-start gap-1.5 text-slate-200">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-white">
                                    {stop.address || stop.streetAndCity}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-400 pl-5">
                                <span className="text-amber-400 font-mono-numbers font-medium">
                                  Stopp efter {stop.milestoneMil} mil ({Math.round(stop.milestoneMil * 10)} km)
                                </span>
                                {stop.city && (
                                  <>
                                    <span className="mx-1 text-slate-600">•</span>
                                    <span className="text-slate-300">{stop.city}</span>
                                  </>
                                )}
                              </div>

                              {/* 3 Kartalternativ per laddstopp */}
                              <div className="flex flex-wrap items-center gap-1.5 pl-5 pt-0.5">
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-slate-950 border border-slate-700/80 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer"
                                  title="Öppna i Google Maps"
                                >
                                  <span>Google Maps</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <a
                                  href={appleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-slate-300 hover:text-white bg-slate-950 border border-slate-700/80 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer"
                                  title="Öppna i Apple Kartor (iOS / Mac)"
                                >
                                  <span>Apple Kartor</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <a
                                  href={wazeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-cyan-300 hover:text-cyan-200 bg-slate-950 border border-slate-700/80 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer"
                                  title="Öppna i Waze"
                                >
                                  <span>Waze</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Kostnad för stoppet */}
                        <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right shrink-0">
                          <span className="text-xs text-slate-400 block">Laddkostnad</span>
                          <span className="text-sm font-bold text-amber-300 font-mono-numbers">
                            {stop.costSek} kr
                          </span>
                        </div>
                      </div>

                      {/* Faciliteter vid laddstoppet */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-8 pt-1 text-[10px]">
                        <span className="text-slate-500 font-medium">Faciliteter:</span>
                        {facs.includes('wc') && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                            <span>🚻</span>
                            <span>Toalett</span>
                          </span>
                        )}
                        {facs.includes('food') && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-amber-300">
                            <span>🍔</span>
                            <span>Mat & Rast</span>
                          </span>
                        )}
                        {facs.includes('coffee') && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-amber-200">
                            <span>☕</span>
                            <span>Kaffe</span>
                          </span>
                        )}
                        {facs.includes('playground') && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-emerald-300">
                            <span>🛝</span>
                            <span>Lekplats</span>
                          </span>
                        )}
                        {facs.includes('shop') && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                            <span>🛒</span>
                            <span>Butik</span>
                          </span>
                        )}
                      </div>

                      {/* Batteri- och tidsdetaljer */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono-numbers bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Ladda {stop.batteryArrivalPercent}% ➔ {stop.batteryDeparturePercent}%</span>
                          <span className="text-slate-500">|</span>
                          <span className="text-emerald-400 font-semibold">+{stop.kwhToCharge} kWh</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-300 font-mono-numbers bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Laddtid: ~{stop.chargingTimeMinutes} min</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Scenario C: Vald operatör saknar stationer i ruttkorridoren */
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Inga stationer från {selectedOperator.name} hittades direkt längs denna rutt</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Välj gärna <strong>"Bästa längs vägen (Alla operatörer)"</strong> eller testa en annan operatör (t.ex. Tesla, Ionity eller Circle K) för att hitta optimala laddstationer.
              </p>
              {optimizationResult.alternativeOperatorsNearby &&
                optimizationResult.alternativeOperatorsNearby.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-slate-400">Tillgängliga operatörer i närheten:</span>
                    {optimizationResult.alternativeOperatorsNearby.map((alt, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-white font-medium"
                      >
                        {alt.operatorName} ({alt.count} st)
                      </span>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEG 4: RESULTAT & RESKOSTNADSSAMMANSTÄLLNING */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-500/30">
              4
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Resans Kostnad & Sammanställning
              </h2>
              <p className="text-xs text-slate-400">
                Total energikostnad för resan ({distanceMil} mil) jämfört med bensinbil
              </p>
            </div>
          </div>

          {/* Huvudsumma & Dela */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleShareTrip}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-cyan-500/10 cursor-pointer"
              title="Dela resplan via SMS/iMessage, WhatsApp, kopiera text eller skriv ut"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Dela resplan</span>
            </button>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-3xl font-black text-white font-mono-numbers tracking-tight">
                  {optimizationResult.totalTripCostSek} kr
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono-numbers">
                  {optimizationResult.costPerMilSek} kr/mil
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detaljerad kostnadsuppdelning (Hemma vs Operatör) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Startladdning hemma */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">
                  Start från hemmet ({electricityArea})
                </div>
                <div className="text-[11px] text-slate-400 font-mono-numbers">
                  {optimizationResult.homeChargeKwh} kWh à {homePricePerKwh.toFixed(2)} kr/kWh
                </div>
              </div>
            </div>
            <span className="font-bold text-white font-mono-numbers text-sm">
              {optimizationResult.homeChargeCostSek} kr
            </span>
          </div>

          {/* Snabbladdning hos vald operatör */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-200">
                  Snabbladdning ({selectedOperator.name.split('(')[0].trim()})
                </div>
                <div className="text-[11px] text-slate-400 font-mono-numbers">
                  {optimizationResult.totalFastChargeKwh} kWh à {priceDcKwh.toFixed(2)} kr/kWh
                </div>
              </div>
            </div>
            <span className="font-bold text-amber-300 font-mono-numbers text-sm">
              {optimizationResult.totalFastChargeCostSek} kr
            </span>
          </div>
        </div>

        {/* Jämförelse mot bensinbil */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-300 block font-medium">
                Motsvarande bensinbil (0,65 l/mil à {petrolPricePerLiter.toFixed(2)} kr/l):{' '}
                <strong className="text-white font-mono-numbers">{petrolTripCost} kr</strong>
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                Du sparar ca {savingsVsPetrol} kr på att köra elbil denna resa!
              </span>
            </div>
          </div>

          {routeResult && (
            <div className="text-right text-[11px] text-slate-400">
              <span>Total restid: </span>
              <strong className="text-white font-mono-numbers">
                {formatDuration(
                  (isRoundTrip ? routeResult.durationSeconds * 2 : routeResult.durationSeconds) +
                    optimizationResult.totalChargingTimeMinutes * 60
                )}
              </strong>
              <div className="text-[10px] text-slate-500">
                (Körtid + {optimizationResult.totalChargingTimeMinutes} min laddning)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Dela resplan */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dela resplan</h3>
                  <p className="text-xs text-slate-400">Kopiera eller skriv ut resplanen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Förhandsgranskning av text */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Sammanställning för SMS / Meddelande / Mail:
              </label>
              <textarea
                readOnly
                value={generateShareSummaryText()}
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none select-all"
              />
            </div>

            {/* Handlingsknappar */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyShareText}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
              >
                {copyFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Kopierad till urklipp!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Kopiera text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Skriv ut / PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
