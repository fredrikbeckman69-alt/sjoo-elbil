import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Car,
  BatteryCharging,
  Zap,
  ShieldCheck,
  Gauge,
  Scale,
  Clock,
  ArrowRight,
  Info,
  Sparkles,
  FileText,
} from 'lucide-react';
import { VehicleRegistryData, VehicleProfile } from '../types';
import {
  FFM56R_DATA,
  fetchVehicleFromRegistry,
  formatRegnrPlate,
  getOfficialRegistryLinks,
} from '../services/vehicleRegistryService';

interface VehicleRegistryTabProps {
  onApplyVehicleToCalculator: (profile: VehicleProfile) => void;
}

export const VehicleRegistryTab: React.FC<VehicleRegistryTabProps> = ({
  onApplyVehicleToCalculator,
}) => {
  const [searchInput, setSearchInput] = useState<string>('FFM56R');
  const [vehicleData, setVehicleData] = useState<VehicleRegistryData>(FFM56R_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Länkar till offentliga register
  const officialLinks = getOfficialRegistryLinks(vehicleData.regnr);

  // Hantera sökning på nytt registreringsnummer
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAppliedSuccess(false);

    try {
      const data = await fetchVehicleFromRegistry(clean);
      setVehicleData(data);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          `Kunde inte hämta uppgifter för ${clean}. Kontrollera registreringsnumret eller öppna direktlänkarna nedan.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Återställ till standard FFM56R
  const handleResetToDefault = () => {
    setSearchInput('FFM56R');
    setVehicleData(FFM56R_DATA);
    setErrorMessage(null);
    setAppliedSuccess(false);
  };

  // Koppla vald bil till kalkylatorn
  const handleApplyToCalculator = () => {
    const consumption = vehicleData.consumptionKwh100Km || 15.7;
    const capacity = vehicleData.batteryCapacityKwh || 58;
    const name = vehicleData.fullName || `${vehicleData.make} ${vehicleData.model}`.trim();

    onApplyVehicleToCalculator({
      name,
      consumptionKwhPer100Km: consumption,
      batteryCapacityKwh: capacity,
    });

    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Registry Search Box */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Offentliga Svenska Fordonsregister
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Fordonsuppgifter & Historik
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Hämta komplett teknisk information, WLTP-förbrukning, batteridata, mätarställning och
                besiktningsstatus direkt från offentliga register.
              </p>
            </div>

            <button
              onClick={handleResetToDefault}
              className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
              title="Återställ till referensbilen FFM56R"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Återställ till FFM56R</span>
            </button>
          </div>

          {/* Svensk Nummerskylts-inmatning */}
          <form onSubmit={handleSearch} className="max-w-xl">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Sök svenskt registreringsnummer:
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Svensk Registreringsskylt UI Input */}
              <div className="relative flex items-center bg-white rounded-xl overflow-hidden border-2 border-slate-300 shadow-inner focus-within:ring-2 focus-within:ring-cyan-400 focus-within:border-transparent transition">
                {/* Blå EU-märke med "S" */}
                <div className="bg-blue-700 text-yellow-300 px-2.5 py-2.5 flex flex-col items-center justify-center select-none w-10">
                  <span className="text-[10px] leading-none mb-0.5">★</span>
                  <span className="text-xs font-black text-white tracking-widest leading-none">S</span>
                </div>

                {/* Input-fält */}
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  placeholder="FFM 56R"
                  maxLength={8}
                  className="w-44 sm:w-48 px-3 py-2 text-xl sm:text-2xl font-black text-slate-900 tracking-widest bg-transparent focus:outline-none uppercase font-mono"
                />
              </div>

              {/* Sökknapp */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Hämtar registerdata...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Sök i register</span>
                  </>
                )}
              </button>
            </div>

            {/* Snabblänkar & tips */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
              <span className="text-slate-500">Förvalt fordon:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('FFM56R');
                  setVehicleData(FFM56R_DATA);
                  setErrorMessage(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono font-bold transition"
              >
                FFM56R (Cupra Born 58)
              </button>
              <span className="text-slate-500">• Byt till valfritt regnr för att söka i offentliga register</span>
            </div>
          </form>

          {/* Felmeddelande vid sökning */}
          {errorMessage && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Sökningen gav ingen direktträff</strong>
                <p>{errorMessage}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={officialLinks.transportstyrelsen}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:underline font-semibold"
                  >
                    Transportstyrelsen <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-500">•</span>
                  <a
                    href={officialLinks.biluppgifter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-300 hover:underline font-semibold"
                  >
                    Biluppgifter.se <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Koppla fordon till Kalkylatorn Banner */}
      <section className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Använd fordonets data i kalkylatorn</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WLTP Verifierad
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Koppla <strong className="text-emerald-400">{vehicleData.fullName}</strong> med{' '}
              <strong className="text-white font-mono-numbers">
                {vehicleData.consumptionKwh100Km || 15.7} kWh/100 km
              </strong>{' '}
              och <strong className="text-white font-mono-numbers">{vehicleData.batteryCapacityKwh || 58} kWh</strong>{' '}
              direkt till res- och månadskalkylen.
            </p>
          </div>
        </div>

        <button
          onClick={handleApplyToCalculator}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition shrink-0 ${
            appliedSuccess
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/50'
          }`}
        >
          {appliedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Överförd till kalkylatorn!</span>
            </>
          ) : (
            <>
              <span>Koppla till kalkylatorn</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </section>

      {/* 3. Snabbstatus och Nyckelindikatorer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Status</span>
            <Car className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {vehicleData.status}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {vehicleData.svensksald ? 'Svensksåld' : 'Import'}
            </span>
          </div>
        </div>

        {/* Besiktning */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Senaste besiktning</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white font-mono-numbers">
              {vehicleData.lastInspectionDate || 'Okänt'}
            </span>
            <span className="text-[11px] text-cyan-400 block mt-0.5">
              Nästa senast: {vehicleData.nextInspectionBefore || '2026-10-31'}
            </span>
          </div>
        </div>

        {/* Fordonsskatt */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Årlig fordonsskatt</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white font-mono-numbers">
              {vehicleData.annualTaxSek ? `${vehicleData.annualTaxSek} kr` : '360 kr'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Skattemånad: {vehicleData.taxMonth || 'November'}
            </span>
          </div>
        </div>

        {/* Miljö & Utsläpp */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Drivmedel & Miljö</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-white">
              {vehicleData.fuel}
            </span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">
              {vehicleData.co2Emissions === 0 ? '0 g CO2/km (Utsläppsfri)' : 'Miljöklass El'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Detaljerade specifikationskort */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kort A: Allmän fordonsinformation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Fordonsidentitet & Basdata</h2>
              <p className="text-xs text-slate-400">Officiell data från Vägtrafikregistret</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Registreringsnummer</span>
              <span className="font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {formatRegnrPlate(vehicleData.regnr)}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Fabrikat & Modell</span>
              <span className="font-bold text-white">{vehicleData.fullName}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Originalnamn (Transportstyrelsen)</span>
              <span className="font-medium text-slate-300 text-right">{vehicleData.officialNameTS || '-'}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Modellår / Fordonsår</span>
              <span className="font-bold text-white font-mono-numbers">{vehicleData.year || 2022}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Färg</span>
              <span className="font-medium text-white flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-600 inline-block" />
                {vehicleData.color || 'Ljusgrå'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Karosstyp</span>
              <span className="font-medium text-slate-300">
                {vehicleData.dimensions?.bodyType || 'Stationsvagn Kombivagn'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Först registrerad</span>
              <span className="font-mono-numbers text-slate-300">{vehicleData.firstRegistered || '2022-07-12'}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Tagen i trafik i Sverige</span>
              <span className="font-mono-numbers text-slate-300">{vehicleData.inTrafficSweden || '2022-08-01'}</span>
            </div>
          </div>
        </div>

        {/* Kort B: Batteri, Förbrukning & Räckvidd (WLTP) */}
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batteri, Förbrukning & WLTP</h2>
              <p className="text-xs text-slate-400">Officiella testdata enligt WLTP-körcykeln</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Batterikapacitet (netto / brutto)</span>
              <span className="font-bold text-emerald-400 font-mono-numbers text-sm">
                {vehicleData.batteryCapacityKwh || 58} kWh{' '}
                <span className="text-slate-500 font-normal">
                  ({vehicleData.batteryGrossKwh || 62} kWh brutto)
                </span>
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Officiell elförbrukning (Blandad)</span>
              <div className="text-right">
                <span className="font-bold text-white font-mono-numbers">
                  {vehicleData.consumptionWhKm || 157} Wh/km
                </span>
                <span className="text-[11px] text-emerald-400 block font-mono-numbers">
                  = {vehicleData.consumptionKwh100Km || 15.7} kWh/100 km ({vehicleData.consumptionKwhMil || 1.57} kWh/mil)
                </span>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">WLTP Räckvidd (Blandad körning)</span>
              <span className="font-bold text-cyan-300 font-mono-numbers text-sm">
                {vehicleData.rangeWltpKm || 413} km{' '}
                <span className="text-slate-400 font-normal">({vehicleData.rangeWltpMil || 41.3} mil)</span>
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">WLTP Räckvidd (Stadskörning)</span>
              <span className="font-bold text-emerald-400 font-mono-numbers">
                {vehicleData.rangeCityKm || 588} km{' '}
                <span className="text-slate-400 font-normal">({((vehicleData.rangeCityKm || 588) / 10).toFixed(1)} mil)</span>
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Drivlina / Drivhjul</span>
              <span className="font-bold text-white">{vehicleData.driveWheel || '2WD (Bakhjulsdrift)'}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Växellåda</span>
              <span className="font-medium text-slate-300">{vehicleData.gearbox || 'Automat'}</span>
            </div>
          </div>
        </div>

        {/* Kort C: Motor, Prestanda & Besiktning */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Prestanda, Besiktning & Mätare</h2>
              <p className="text-xs text-slate-400">Mätarställning och tekniska specifikationer</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Motoreffekt</span>
              <span className="font-bold text-white font-mono-numbers">
                {vehicleData.powerHp || 150} HK ({vehicleData.powerKw || 110} kW)
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Topphastighet</span>
              <span className="font-mono-numbers text-slate-300">{vehicleData.topSpeedKmH || 160} km/h</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Ljudnivå vid körning</span>
              <span className="font-mono-numbers text-slate-300">
                {vehicleData.dimensions?.noiseDrivingDb ? `${vehicleData.dimensions.noiseDrivingDb} dB` : '64 dB'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Senaste besiktning (mätarställning)</span>
              <span className="font-bold text-emerald-400 font-mono-numbers">
                {vehicleData.mileageMil ? `${vehicleData.mileageMil.toLocaleString('sv-SE')} mil` : '6 666 mil'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Besiktningsresultat</span>
              <span className="font-medium text-emerald-400 text-right">
                {vehicleData.lastInspectionResult || 'Godkänd kontrollbesiktning'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Nästa besiktningsperiod senast</span>
              <span className="font-bold text-amber-300 font-mono-numbers">
                {vehicleData.nextInspectionBefore || '2026-10-31'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Uppskattad körsträcka</span>
              <span className="text-slate-400 font-mono-numbers">ca 2 701 mil/år</span>
            </div>
          </div>
        </div>

        {/* Kort D: Ägande, Mått, Vikter & Skatt */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Dimensioner, Vikter & Ägande</h2>
              <p className="text-xs text-slate-400">Chassi, lastkapacitet och registrering</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Tjänstevikt / Totalvikt</span>
              <span className="font-bold text-white font-mono-numbers">
                {vehicleData.dimensions?.curbWeightKg || 1843} kg / {vehicleData.dimensions?.totalWeightKg || 2260} kg
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Max lastvikt</span>
              <span className="font-mono-numbers text-slate-300">
                {vehicleData.dimensions?.maxPayloadKg || 417} kg
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Mått (Längd × Bredd × Höjd)</span>
              <span className="font-mono-numbers text-slate-300">
                {vehicleData.dimensions?.lengthMm || 4322} × {vehicleData.dimensions?.widthMm || 1809} ×{' '}
                {vehicleData.dimensions?.heightMm || 1540} mm
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Däckdimension fram & bak</span>
              <span className="font-mono text-slate-300">
                {vehicleData.dimensions?.tiresFront || '215/50 R19 93T'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Antal ägare totalt</span>
              <span className="font-bold text-white font-mono-numbers">
                {vehicleData.ownersCount || 5} st{' '}
                <span className="text-slate-500 font-normal">({vehicleData.usersCount || 3} brukare)</span>
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Senaste ägarbyte</span>
              <span className="font-mono-numbers text-slate-300">{vehicleData.lastOwnershipChange || '2026-04-16'}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-400">Kreditköp / Leasing</span>
              <span className="text-slate-300">
                Kredit: {vehicleData.creditPurchase ? 'Ja' : 'Nej'} • Leasad:{' '}
                {vehicleData.leased ? 'Ja' : 'Nej'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tidslinje & Händelsehistorik */}
      {vehicleData.history && vehicleData.history.length > 0 && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Händelselogg & Historik</h2>
              <p className="text-xs text-slate-400">Registrerade händelser i vägtrafikregistret</p>
            </div>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {vehicleData.history.map((item, idx) => (
              <div key={idx} className="relative flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-xs">
                {/* Punkt på linjen */}
                <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-sm" />

                <div>
                  <span className="font-bold text-slate-200 mr-2">{item.event}</span>
                  <span className="text-slate-400">{item.description}</span>
                </div>

                <span className="font-mono text-[11px] text-slate-500 shrink-0">{item.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Officiella Källor & Verifieringslänkar */}
      <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Data inhämtad via offentliga register och <strong>Biluppgifter.se</strong> för registreringsnummer{' '}
            <strong className="text-white font-mono">{formatRegnrPlate(vehicleData.regnr)}</strong>.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={officialLinks.transportstyrelsen}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <span>Transportstyrelsen</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={officialLinks.biluppgifter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <span>Biluppgifter.se</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={officialLinks.carInfo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <span>Car.info</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>
    </div>
  );
};
