import React, { useState, useEffect, useCallback } from 'react';
import { HeaderHero } from './components/HeaderHero';
import { RoadTripPlanner } from './components/RoadTripPlanner';
import { TripConditionsSelector } from './components/TripConditions';
import { VehicleSettings } from './components/VehicleSettings';
import { RouteCalculator } from './components/RouteCalculator';
import { RoadTripChecklist } from './components/RoadTripChecklist';
import { MonthlySettings } from './components/MonthlySettings';
import { ScenarioComparison } from './components/ScenarioComparison';
import { VisualChart } from './components/VisualChart';
import { SummaryTable } from './components/SummaryTable';
import { DatabaseManager } from './components/DatabaseManager';
import { TripHistory } from './components/TripHistory';
import {
  VehicleProfile,
  ChargingScenario,
  SavedTrip,
  TripConditions,
  ChecklistItem,
} from './types';
import {
  DEFAULT_VEHICLE,
  DEFAULT_SCENARIOS,
  DEFAULT_TRIP_CONDITIONS,
  DEFAULT_CHECKLIST,
  calculateScenarioResults,
  calculateEffectiveConsumption,
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
import { VehicleRegistryTab } from './components/VehicleRegistryTab';
import { ChargingOperatorsTab } from './components/ChargingOperatorsTab';
import { NavigationTabs, AppTab } from './components/NavigationTabs';
import { CalculatedPlanCost } from './types/chargingOperators';
import { Zap, ExternalLink, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // States som synkas med IndexedDB
  const [vehicle, setVehicleState] = useState<VehicleProfile>(DEFAULT_VEHICLE);
  const [scenarios, setScenariosState] = useState<ChargingScenario[]>(DEFAULT_SCENARIOS);
  const [tripDistanceMil, setTripDistanceMilState] = useState<number>(42); // Default Sälen långresa
  const [monthlyDistanceMil, setMonthlyDistanceMilState] = useState<number>(125);
  const [startAddress, setStartAddressState] = useState<string>('Stockholm');
  const [destAddress, setDestAddressState] = useState<string>('Sälen');
  const [trips, setTripsState] = useState<SavedTrip[]>([]);
  const [conditions, setConditionsState] = useState<TripConditions>(DEFAULT_TRIP_CONDITIONS);
  const [checklist, setChecklistState] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [activeTab, setActiveTabState] = useState<AppTab>('calculator');

  // Ladda data från IndexedDB vid start
  const loadDataFromDb = useCallback(async () => {
    try {
      const [v, sc, tDist, mDist, sAddr, dAddr, trList, cond, chk, tab] = await Promise.all([
        getActiveVehicle(),
        getScenarios(),
        getSetting<number>('tripDistanceMil', 42),
        getSetting<number>('monthlyDistanceMil', 125),
        getSetting<string>('startAddress', 'Stockholm'),
        getSetting<string>('destAddress', 'Sälen'),
        getAllTrips(),
        getSetting<TripConditions>('tripConditions', DEFAULT_TRIP_CONDITIONS),
        getSetting<ChecklistItem[]>('tripChecklist', DEFAULT_CHECKLIST),
        getSetting<AppTab>('activeTab', 'calculator'),
      ]);

      setVehicleState(v);
      setScenariosState(sc);
      setTripDistanceMilState(tDist);
      setMonthlyDistanceMilState(mDist);
      setStartAddressState(sAddr);
      setDestAddressState(dAddr);
      setTripsState(trList);
      setConditionsState(cond);
      setChecklistState(chk);
      if (tab) setActiveTabState(tab);
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

  // Uppdatera körförhållanden (väder/takbox/motorväg)
  const handleConditionsChange = (updated: TripConditions) => {
    setConditionsState(updated);
    setSetting('tripConditions', updated);
  };

  // Toggla checklista
  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklistState(updated);
    setSetting('tripChecklist', updated);
  };

  // Snabbval av svensk långresa
  const handleSelectRoutePreset = (start: string, dest: string, distanceMil: number) => {
    setStartAddressState(start);
    setDestAddressState(dest);
    setTripDistanceMilState(distanceMil);
    setSetting('startAddress', start);
    setSetting('destAddress', dest);
    setSetting('tripDistanceMil', distanceMil);
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

  // Byt flik och spara val i IndexedDB
  const handleTabChange = (tab: AppTab) => {
    setActiveTabState(tab);
    setSetting('activeTab', tab);
  };

  // Koppla vald bil från fordonsregistret till kalkylatorn
  const handleApplyVehicleFromRegistry = (profile: VehicleProfile) => {
    handleVehicleChange(profile);
    handleTabChange('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Använd en laddoperatörs prisplan som scenario i kalkylatorn
  const handleApplyOperatorPlanToScenario = (cost: CalculatedPlanCost) => {
    const scenarioId = `op-${cost.operatorId}-${cost.plan.id}`;
    const existingIndex = scenarios.findIndex((s) => s.id === scenarioId);
    const newScenario: ChargingScenario = {
      id: scenarioId,
      name: `${cost.operatorName} (${cost.plan.name})`,
      description: `${cost.plan.description}${cost.plan.discountNote ? ` • ${cost.plan.discountNote}` : ''}`,
      pricePerKwh: cost.plan.priceDcKwh,
      monthlyFee: cost.plan.monthlyFee,
      sessionFee: 0,
      badgeColor: cost.brandColor || 'cyan',
      isDefault: false,
    };

    let updatedScenarios: ChargingScenario[];
    if (existingIndex >= 0) {
      updatedScenarios = [...scenarios];
      updatedScenarios[existingIndex] = newScenario;
    } else {
      updatedScenarios = [newScenario, ...scenarios];
    }

    handleScenariosChange(updatedScenarios);
    handleTabChange('calculator');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Effektiv förbrukning justerad för yttre faktorer
  const { effectiveKwhPer100Km } = calculateEffectiveConsumption(
    vehicle.consumptionKwhPer100Km,
    conditions
  );

  // Beräkna alla scenariokostnader baserat på den effektiva förbrukningen
  const { results, cheapestTripId, cheapestMonthlyId } = calculateScenarioResults(
    scenarios,
    effectiveKwhPer100Km,
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
        {/* Navigation Tabs */}
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          operatorsCount={15}
          activeVehicleName={vehicle.name}
        />

        {activeTab === 'registry' && (
          /* Separat flik: Offentliga fordonsregister */
          <VehicleRegistryTab onApplyVehicleToCalculator={handleApplyVehicleFromRegistry} />
        )}

        {activeTab === 'operators' && (
          /* Separat flik: Samtliga svenska laddoperatörer & priser */
          <ChargingOperatorsTab
            vehicle={vehicle}
            onSelectPlanForScenario={handleApplyOperatorPlanToScenario}
          />
        )}

        {activeTab === 'calculator' && (
          /* Flik: Elbilskalkylator Pro */
          <>
            {/* 1. Header & Hero with car image */}
            <HeaderHero vehicle={vehicle} tripDistanceMil={tripDistanceMil} />


        {/* 2. Occasional Driver Road Trip Assistant */}
        <RoadTripPlanner
          distanceMil={tripDistanceMil}
          vehicle={vehicle}
          conditions={conditions}
          onSelectRoutePreset={handleSelectRoutePreset}
        />

        {/* 3. Driving Conditions (Winter, Roof Box, Highway Speed) */}
        <TripConditionsSelector
          baseConsumption={vehicle.consumptionKwhPer100Km}
          batteryCapacityKwh={vehicle.batteryCapacityKwh}
          conditions={conditions}
          onChange={handleConditionsChange}
        />

        {/* 4. Primary Configuration Grid: Vehicle & Trip */}
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

        {/* 5. Road Trip Checklist for Occasional Long Drivers */}
        <RoadTripChecklist items={checklist} onToggleItem={handleToggleChecklist} />

        {/* 6. Database Status & Backup Management */}
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

        {/* 7. Trip History & Saved Routes */}
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

        {/* 8. Monthly Distance Estimation */}
        <MonthlySettings
          monthlyDistanceMil={monthlyDistanceMil}
          onMonthlyDistanceChange={handleMonthlyDistanceChange}
        />

        {/* 9. Scenario & Price Comparison */}
        <ScenarioComparison
          scenarios={scenarios}
          results={results}
          cheapestTripId={cheapestTripId}
          cheapestMonthlyId={cheapestMonthlyId}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
          onUpdateScenarios={handleScenariosChange}
        />

        {/* 10. Visual Chart & Savings */}
        <VisualChart
          results={results}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
        />

        {/* 11. Complete Summary Table */}
          <SummaryTable
            results={results}
            cheapestTripId={cheapestTripId}
            cheapestMonthlyId={cheapestMonthlyId}
            tripDistanceMil={tripDistanceMil}
            monthlyDistanceMil={monthlyDistanceMil}
          />
        </>
      )}
    </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-500 border-t border-slate-900 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">Sjöö Elbilskalkylator Pro</span>
            <span>• Optimerad för Långresor & Sällanförare</span>
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
