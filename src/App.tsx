import React, { useState, useEffect, useCallback } from 'react';
import { HeaderHero } from './components/HeaderHero';
import { VehicleSettings } from './components/VehicleSettings';
import { RouteCalculator } from './components/RouteCalculator';
import { MonthlySettings } from './components/MonthlySettings';
import { ScenarioComparison } from './components/ScenarioComparison';
import { VisualChart } from './components/VisualChart';
import { SummaryTable } from './components/SummaryTable';
import { DatabaseManager } from './components/DatabaseManager';
import { TripHistory } from './components/TripHistory';
import { VehicleProfile, ChargingScenario, SavedTrip } from './types';
import {
  DEFAULT_VEHICLE,
  DEFAULT_SCENARIOS,
  calculateScenarioResults,
  kwhPer100KmToKwhPerMil,
} from './utils/calculations';
import {
  getActiveVehicle,
  saveActiveVehicle,
  getScenarios,
  saveAllScenarios,
  getSetting,
  setSetting,
  getAllTrips,
  saveTrip,
  deleteTrip,
  clearAllTrips,
} from './db/indexedDb';
import { Zap, ExternalLink, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // States som synkas med IndexedDB
  const [vehicle, setVehicleState] = useState<VehicleProfile>(DEFAULT_VEHICLE);
  const [scenarios, setScenariosState] = useState<ChargingScenario[]>(DEFAULT_SCENARIOS);
  const [tripDistanceMil, setTripDistanceMilState] = useState<number>(25);
  const [monthlyDistanceMil, setMonthlyDistanceMilState] = useState<number>(125);
  const [startAddress, setStartAddressState] = useState<string>('Stockholm');
  const [destAddress, setDestAddressState] = useState<string>('Göteborg');
  const [trips, setTripsState] = useState<SavedTrip[]>([]);

  // Ladda data från IndexedDB vid start
  const loadDataFromDb = useCallback(async () => {
    try {
      const [v, sc, tDist, mDist, sAddr, dAddr, trList] = await Promise.all([
        getActiveVehicle(),
        getScenarios(),
        getSetting<number>('tripDistanceMil', 25),
        getSetting<number>('monthlyDistanceMil', 125),
        getSetting<string>('startAddress', 'Stockholm'),
        getSetting<string>('destAddress', 'Göteborg'),
        getAllTrips(),
      ]);

      setVehicleState(v);
      setScenariosState(sc);
      setTripDistanceMilState(tDist);
      setMonthlyDistanceMilState(mDist);
      setStartAddressState(sAddr);
      setDestAddressState(dAddr);
      setTripsState(trList);
    } catch (err) {
      console.warn('Kunde inte läsa från IndexedDB, använder defaults:', err);
    } finally {
      setIsDbLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadDataFromDb();
  }, [loadDataFromDb]);

  // Uppdatera och spara fordon i IndexedDB
  const handleVehicleChange = (updated: VehicleProfile) => {
    setVehicleState(updated);
    saveActiveVehicle(updated);
  };

  // Uppdatera och spara scenarier i IndexedDB
  const handleScenariosChange = (updated: ChargingScenario[]) => {
    setScenariosState(updated);
    saveAllScenarios(updated);
  };

  // Uppdatera resdistans och spara i IndexedDB
  const handleTripDistanceChange = (mil: number) => {
    setTripDistanceMilState(mil);
    setSetting('tripDistanceMil', mil);
  };

  // Uppdatera månadskörsträcka och spara i IndexedDB
  const handleMonthlyDistanceChange = (mil: number) => {
    setMonthlyDistanceMilState(mil);
    setSetting('monthlyDistanceMil', mil);
  };

  // Uppdatera adresser och spara i IndexedDB
  const handleStartAddressChange = (addr: string) => {
    setStartAddressState(addr);
    setSetting('startAddress', addr);
  };

  const handleDestAddressChange = (addr: string) => {
    setDestAddressState(addr);
    setSetting('destAddress', addr);
  };

  // Hantera sparade resor i IndexedDB
  const handleSaveTrip = async (newTrip: SavedTrip) => {
    await saveTrip(newTrip);
    setTripsState((prev) => [newTrip, ...prev]);
  };

  const handleDeleteTrip = async (id: string) => {
    await deleteTrip(id);
    setTripsState((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearAllTrips = async () => {
    await clearAllTrips();
    setTripsState([]);
  };

  const handleLoadTrip = (trip: SavedTrip) => {
    handleStartAddressChange(trip.startAddress);
    handleDestAddressChange(trip.destAddress);
    handleTripDistanceChange(trip.distanceMil);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Beräkna alla resultat
  const { results, cheapestTripId, cheapestMonthlyId } = calculateScenarioResults(
    scenarios,
    vehicle.consumptionKwhPer100Km,
    tripDistanceMil,
    monthlyDistanceMil
  );

  if (!isDbLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Initierar IndexedDB-klientdatabas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white safe-top-p safe-bottom-p">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 space-y-6">
        {/* 1. Header & Hero with car image */}
        <HeaderHero vehicle={vehicle} tripDistanceMil={tripDistanceMil} />

        {/* 2. Database Status & Backup Management */}
        <DatabaseManager
          vehicle={vehicle}
          scenarios={scenarios}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
          startAddress={startAddress}
          destAddress={destAddress}
          savedTripsCount={trips.length}
          onDataReloaded={loadDataFromDb}
        />

        {/* 3. Primary Configuration Grid: Vehicle & Trip */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VehicleSettings vehicle={vehicle} onChange={handleVehicleChange} />
          <RouteCalculator
            distanceMil={tripDistanceMil}
            onDistanceChange={handleTripDistanceChange}
            startAddress={startAddress}
            onStartAddressChange={handleStartAddressChange}
            destAddress={destAddress}
            onDestAddressChange={handleDestAddressChange}
          />
        </div>

        {/* 4. Trip History & Saved Routes */}
        <TripHistory
          trips={trips}
          startAddress={startAddress}
          destAddress={destAddress}
          distanceMil={tripDistanceMil}
          vehicle={vehicle}
          results={results}
          cheapestTripId={cheapestTripId}
          onSaveCurrentTrip={handleSaveTrip}
          onLoadTrip={handleLoadTrip}
          onDeleteTrip={handleDeleteTrip}
          onClearAllTrips={handleClearAllTrips}
        />

        {/* 5. Monthly Distance Estimation */}
        <MonthlySettings
          monthlyDistanceMil={monthlyDistanceMil}
          onMonthlyDistanceChange={handleMonthlyDistanceChange}
        />

        {/* 6. Scenario & Price Comparison */}
        <ScenarioComparison
          scenarios={scenarios}
          results={results}
          cheapestTripId={cheapestTripId}
          cheapestMonthlyId={cheapestMonthlyId}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
          onUpdateScenarios={handleScenariosChange}
        />

        {/* 7. Visual Chart & Savings */}
        <VisualChart
          results={results}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
        />

        {/* 8. Complete Summary Table */}
        <SummaryTable
          results={results}
          cheapestTripId={cheapestTripId}
          cheapestMonthlyId={cheapestMonthlyId}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 border-t border-slate-900 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Sjöö Elbilskalkylator Pro</span>
            <span>• IndexedDB Klientdatabas</span>
            <span>• {kwhPer100KmToKwhPerMil(vehicle.consumptionKwhPer100Km)} kWh/mil</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-[11px]">Mobilanpassad för iOS & moderna webbläsare</span>
            <a
              href="https://github.com/fredrikbeckman69-alt/sjoo-elbil"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
