import React, { useState, useEffect, useCallback } from 'react';
import { HeaderHero } from './components/HeaderHero';
import { RoadTripPlanner } from './components/RoadTripPlanner';
import { TripConditionsSelector } from './components/TripConditions';
import { OperatorRoutePlanner } from './components/OperatorRoutePlanner';
import { RouteCalculator } from './components/RouteCalculator';
import { RouteResult, calculateRoute } from './services/routing';
import { RoadTripChecklist } from './components/RoadTripChecklist';
import { fetchCurrentPetrolPrice, FuelPriceData, DEFAULT_FUEL_PRICE } from './services/fuelPriceService';
import { ScenarioComparison } from './components/ScenarioComparison';
import { DatabaseManager } from './components/DatabaseManager';
import { TripHistory } from './components/TripHistory';
import {
  VehicleProfile,
  ChargingScenario,
  SavedTrip,
  TripConditions,
  ChecklistItem,
  UserAccount,
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
import { MonthlySettings } from './components/MonthlySettings';
import { VehicleRegistryTab } from './components/VehicleRegistryTab';
import { ChargingOperatorsTab } from './components/ChargingOperatorsTab';
import { NavigationTabs, AppTab } from './components/NavigationTabs';
import { CalculatedPlanCost } from './types/chargingOperators';
import { Zap, ExternalLink, Loader2, Database, Lock, User } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { UserProfileModal } from './components/UserProfileModal';
import {
  getLastSelectedVehicleId,
  setLastSelectedVehicleId,
} from './services/authService';
import { formatRegnrPlate, cleanVehicleDisplayName } from './services/vehicleRegistryService';
import {
  startAutoSync,
  pushCloudState,
  fetchLatestCloudState,
  subscribeToSyncStatus,
  setActiveSyncUser,
  SyncStatus,
} from './services/cloudSyncService';

const ChargingMap = React.lazy(() => import('./components/ChargingMap'));

export const App: React.FC = () => {
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // States som synkas med IndexedDB och molnet
  const [vehicle, setVehicleState] = useState<VehicleProfile>(DEFAULT_VEHICLE);
  const [scenarios, setScenariosState] = useState<ChargingScenario[]>(DEFAULT_SCENARIOS);
  const [tripDistanceMil, setTripDistanceMilState] = useState<number>(42); // Default Sälen långresa
  const [monthlyDistanceMil, setMonthlyDistanceMilState] = useState<number>(125);
  const [startAddress, setStartAddressState] = useState<string>('Stockholm');
  const [destAddress, setDestAddressState] = useState<string>('Sälen');
  const [trips, setTripsState] = useState<SavedTrip[]>([]);
  const [conditions, setConditionsState] = useState<TripConditions>(DEFAULT_TRIP_CONDITIONS);
  const [checklist, setChecklistState] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [fuelPrice, setFuelPriceState] = useState<FuelPriceData>(DEFAULT_FUEL_PRICE);
  const [activeTab, setActiveTabState] = useState<AppTab>('calculator');
  const [isRoundTrip, setIsRoundTripState] = useState<boolean>(false);
  const [waypoints, setWaypointsState] = useState<string[]>([]);
  const [routeResult, setRouteResultState] = useState<RouteResult | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    cloudDocId: '',
  });

  // Ladda data från IndexedDB vid start eller vid profilbyte
  const loadDataFromDb = useCallback(async (user?: UserAccount | null) => {
    try {
      const activeId = user?.id;
      const loadPromise = Promise.all([
        getActiveVehicle(activeId),
        getScenarios(activeId),
        getSetting<number>('tripDistanceMil', 42, activeId),
        getSetting<number>('monthlyDistanceMil', 125, activeId),
        getSetting<string>('startAddress', 'Stockholm', activeId),
        getSetting<string>('destAddress', 'Sälen', activeId),
        getAllTrips(),
        getSetting<TripConditions>('tripConditions', DEFAULT_TRIP_CONDITIONS, activeId),
        getSetting<ChecklistItem[]>('tripChecklist', DEFAULT_CHECKLIST, activeId),
        getSetting<AppTab>('activeTab', 'calculator', activeId),
        getSetting<FuelPriceData>('petrolPriceData', DEFAULT_FUEL_PRICE),
        getSetting<boolean>('isRoundTrip', false, activeId),
        getSetting<string[]>('waypoints', [], activeId),
      ]);

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const res = await Promise.race([loadPromise, timeoutPromise]);

      if (res) {
        const [v, sc, tDist, mDist, sAddr, dAddr, trList, cond, chk, tab, cachedFuel, roundTrip, savedWaypoints] = res;
        const finalVehicle = user?.vehicleProfile || v;
        setVehicleState(finalVehicle);
        setScenariosState(sc);
        setTripDistanceMilState(tDist);
        setMonthlyDistanceMilState(mDist);
        setStartAddressState(sAddr);
        setDestAddressState(dAddr);
        setTripsState(trList);
        setConditionsState(cond);
        setChecklistState(chk);
        if (tab) setActiveTabState(tab);
        if (cachedFuel) setFuelPriceState(cachedFuel);
        if (typeof roundTrip === 'boolean') setIsRoundTripState(roundTrip);
        if (Array.isArray(savedWaypoints)) setWaypointsState(savedWaypoints);
      } else if (user?.vehicleProfile) {
        setVehicleState(user.vehicleProfile);
      }

      // Hämta färskt bensinpris asynkront och spara
      fetchCurrentPetrolPrice().then((fresh) => {
        setFuelPriceState(fresh);
        setSetting('petrolPriceData', fresh);
      });
    } catch (err) {
      console.warn('Kunde inte läsa från IndexedDB, använder defaults:', err);
    } finally {
      setIsDbLoaded(true);
    }
  }, []);

  useEffect(() => {
    setActiveSyncUser(currentUser);
    if (currentUser) {
      loadDataFromDb(currentUser);
    }
  }, [currentUser, loadDataFromDb]);

  // Timvis automatisk kontroll och uppdatering av bensinpriser
  useEffect(() => {
    const hourlyFuelCheck = () => {
      fetchCurrentPetrolPrice().then((fresh) => {
        setFuelPriceState(fresh);
      });
    };

    const interval = setInterval(hourlyFuelCheck, 3600000); // En gång i timmen (3 600 000 ms)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        hourlyFuelCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Beräkna rutt automatiskt i bakgrunden så att ruttkoordinater och korridorer alltid finns tillgängliga
  useEffect(() => {
    if (!startAddress || !destAddress) return;
    let isCancelled = false;
    calculateRoute(startAddress, destAddress, waypoints)
      .then((res) => {
        if (!isCancelled && res) {
          setRouteResultState(res);
        }
      })
      .catch(() => {
        // Ignorera fel vid automatisk bakgrundsuppslag
      });
    return () => {
      isCancelled = true;
    };
  }, [startAddress, destAddress, waypoints]);

  const handleLoginSuccess = (account: UserAccount) => {
    const cleanedAccount: UserAccount = {
      ...account,
      name: cleanVehicleDisplayName(account.name, account.regnr),
      vehicleProfile: {
        ...account.vehicleProfile,
        name: cleanVehicleDisplayName(account.vehicleProfile.name, account.regnr),
      },
    };
    setLastSelectedVehicleId(account.id);
    setActiveSyncUser(cleanedAccount);
    setCurrentUser(cleanedAccount);
  };

  const handleLogout = () => {
    setActiveSyncUser(null);
    setCurrentUser(null);
    setIsDbLoaded(false);
  };

  const handleAccountUpdated = (updated: UserAccount) => {
    const cleanedAccount: UserAccount = {
      ...updated,
      name: cleanVehicleDisplayName(updated.name, updated.regnr),
      vehicleProfile: {
        ...updated.vehicleProfile,
        name: cleanVehicleDisplayName(updated.vehicleProfile.name, updated.regnr),
      },
    };
    setCurrentUser(cleanedAccount);
    setActiveSyncUser(cleanedAccount);
    handleVehicleChange(cleanedAccount.vehicleProfile);
  };

  // Automatisk låsning vid 15 minuters inaktivitet (säkerställer att ingen kan använda appen utan PIN)
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: number;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setActiveSyncUser(null);
        setCurrentUser(null);
        setIsDbLoaded(false);
      }, 15 * 60 * 1000);
    };

    resetTimer();
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser]);

  // Lyssna på molnsynkronisering för aktiv inloggad användare
  useEffect(() => {
    if (!currentUser) return;

    const unsubStatus = subscribeToSyncStatus(setSyncStatus);

    const unsubAutoSync = startAutoSync((remote) => {
      if (!currentUser) return;
      if (remote.scenarios && remote.scenarios.length > 0) {
        setScenariosState(remote.scenarios);
        saveAllScenarios(remote.scenarios, currentUser.id);
      }
      if (remote.vehicle) {
        setVehicleState(remote.vehicle);
        saveActiveVehicle(remote.vehicle, currentUser.id);
      }
      if (typeof remote.tripDistanceMil === 'number') {
        setTripDistanceMilState(remote.tripDistanceMil);
        setSetting('tripDistanceMil', remote.tripDistanceMil, currentUser.id);
      }
      if (typeof remote.monthlyDistanceMil === 'number') {
        setMonthlyDistanceMilState(remote.monthlyDistanceMil);
        setSetting('monthlyDistanceMil', remote.monthlyDistanceMil, currentUser.id);
      }
      if (remote.startAddress) {
        setStartAddressState(remote.startAddress);
        setSetting('startAddress', remote.startAddress, currentUser.id);
      }
      if (remote.destAddress) {
        setDestAddressState(remote.destAddress);
        setSetting('destAddress', remote.destAddress, currentUser.id);
      }
      if (typeof remote.isRoundTrip === 'boolean') {
        setIsRoundTripState(remote.isRoundTrip);
        setSetting('isRoundTrip', remote.isRoundTrip, currentUser.id);
      }
    });

    return () => {
      unsubStatus();
      unsubAutoSync();
    };
  }, [currentUser]);

  const handleManualSync = useCallback(() => {
    fetchLatestCloudState();
  }, []);

  // Uppdatera och spara fordon i IndexedDB och molnet (privat för aktiv användare)
  const handleVehicleChange = (updated: VehicleProfile) => {
    setVehicleState(updated);
    saveActiveVehicle(updated, currentUser?.id);
    pushCloudState({ vehicle: updated });
  };

  // Uppdatera och spara scenarier i IndexedDB och molnet (privat för aktiv användare)
  const handleScenariosChange = (updated: ChargingScenario[]) => {
    setScenariosState(updated);
    saveAllScenarios(updated, currentUser?.id);
    pushCloudState({ scenarios: updated });
  };

  // Uppdatera resdistans och spara i IndexedDB och molnet
  const handleTripDistanceChange = (mil: number) => {
    setTripDistanceMilState(mil);
    setSetting('tripDistanceMil', mil, currentUser?.id);
    pushCloudState({ tripDistanceMil: mil });
  };

  // Uppdatera månadskörsträcka och spara i IndexedDB och molnet
  const handleMonthlyDistanceChange = (mil: number) => {
    setMonthlyDistanceMilState(mil);
    setSetting('monthlyDistanceMil', mil, currentUser?.id);
    pushCloudState({ monthlyDistanceMil: mil });
  };

  // Uppdatera adresser och spara i IndexedDB och molnet
  const handleStartAddressChange = (addr: string) => {
    setStartAddressState(addr);
    setSetting('startAddress', addr, currentUser?.id);
    pushCloudState({ startAddress: addr });
  };

  const handleDestAddressChange = (addr: string) => {
    setDestAddressState(addr);
    setSetting('destAddress', addr, currentUser?.id);
    pushCloudState({ destAddress: addr });
  };

  // Uppdatera körförhållanden (väder/takbox/motorväg)
  const handleConditionsChange = (updated: TripConditions) => {
    setConditionsState(updated);
    setSetting('tripConditions', updated, currentUser?.id);
  };

  // Toggla checklista
  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklistState(updated);
    setSetting('tripChecklist', updated, currentUser?.id);
  };

  // Växla enkel resa / tur och retur
  const handleRoundTripChange = (roundTrip: boolean) => {
    setIsRoundTripState(roundTrip);
    setSetting('isRoundTrip', roundTrip, currentUser?.id);
    pushCloudState({ isRoundTrip: roundTrip });
  };

  // Uppdatera delresmål
  const handleWaypointsChange = (newWaypoints: string[]) => {
    setWaypointsState(newWaypoints);
    setSetting('waypoints', newWaypoints);
  };

  // Snabbval av svensk långresa
  const handleSelectRoutePreset = (start: string, dest: string, distanceMil: number) => {
    setStartAddressState(start);
    setDestAddressState(dest);
    setWaypointsState([]);
    setRouteResultState(null);
    setSetting('waypoints', []);
    const finalDist = isRoundTrip ? distanceMil * 2 : distanceMil;
    setTripDistanceMilState(finalDist);
    setSetting('startAddress', start);
    setSetting('destAddress', dest);
    setSetting('tripDistanceMil', finalDist);
    pushCloudState({ startAddress: start, destAddress: dest, tripDistanceMil: finalDist });
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

  const handleSelectStationAsDestination = (destNameOrAddress: string) => {
    handleDestAddressChange(destNameOrAddress);
    setRouteResultState(null);
    handleTabChange('calculator');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handlePetrolPriceChange = (newPrice: number) => {
    const updated: FuelPriceData = {
      ...fuelPrice,
      pricePerLiter: newPrice,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setFuelPriceState(updated);
    setSetting('petrolPriceData', updated);
  };

  const handleRefreshPetrolPrice = async () => {
    const fresh = await fetchCurrentPetrolPrice();
    setFuelPriceState(fresh);
    setSetting('petrolPriceData', fresh);
  };

  // Effektiv förbrukning justerad för yttre faktorer
  const { effectiveKwhPer100Km } = calculateEffectiveConsumption(
    vehicle.consumptionKwhPer100Km,
    conditions
  );

  // Beräkna alla scenariokostnader baserat på den effektiva förbrukningen och det aktuella bensinpriset
  const { results, cheapestTripId, cheapestMonthlyId } = calculateScenarioResults(
    scenarios,
    effectiveKwhPer100Km,
    tripDistanceMil,
    monthlyDistanceMil,
    fuelPrice.pricePerLiter
  );

  // Hitta hemmataxa och snabbladdartaxa från aktiva scenarier för att skicka till RoadTripPlanner
  const homeScenario = scenarios.find((s) => s.id.includes('home') || s.name.toLowerCase().includes('hemma')) || scenarios[0];
  const fastScenario = scenarios.find((s) => s.id.includes('fast') || s.id.includes('dc') || s.name.toLowerCase().includes('snabb')) || scenarios[2];
  const homePrice = homeScenario ? homeScenario.pricePerKwh : 1.15;
  const fastPrice = fastScenario ? fastScenario.pricePerKwh : 4.95;

  // Förstasida: Inloggning och fordonsval med siffersats
  // Blockerar 100% av appen tills giltig 4-siffrig pinkod slagits in
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        initialAccountId={getLastSelectedVehicleId() || vehicle.id}
      />
    );
  }

  // Om användaren precis loggat in och data läses in
  if (!isDbLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Laddar din profil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white safe-top-p safe-bottom-p">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl 2xl:max-w-[1440px] h-48 bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container - Expanderad maxbredd för gott om utrymme för kalkylatorer och data */}
      <main className="w-full max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 space-y-6">
        {/* User Session & Vehicle Plate Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2.5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            {currentUser.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt="Bil"
                className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow flex-shrink-0 cursor-pointer hover:opacity-90 transition"
                onClick={() => setIsProfileModalOpen(true)}
                title="Klicka för att hantera profil och bilbild"
              />
            ) : (
              <div className="inline-flex items-center bg-white text-slate-950 font-black font-mono text-xs px-2.5 py-1 rounded shadow border border-slate-300 flex-shrink-0">
                <span className="bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-l -ml-2 mr-1">
                  S
                </span>
                {formatRegnrPlate(currentUser.regnr)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentUser.photoUrl && (
                  <div className="inline-flex items-center bg-white text-slate-950 font-black font-mono text-[10px] px-1.5 py-0.2 rounded shadow border border-slate-300">
                    {formatRegnrPlate(currentUser.regnr)}
                  </div>
                )}
                {currentUser.ownerName && (
                  <span className="text-xs font-bold text-cyan-300">{currentUser.ownerName}</span>
                )}
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-white">{cleanVehicleDisplayName(currentUser.name, currentUser.regnr)}</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {vehicle.batteryCapacityKwh} kWh • {vehicle.consumptionKwhPer100Km} kWh/100km
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
              title="Hantera profil, bilbild och pinkod"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Profil & Pinkod</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
              title="Lås appen eller byt fordon"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lås</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          operatorsCount={15}
          stationsCount={3972}
          activeVehicleName={vehicle.name}
        />

        {activeTab === 'map' && (
          /* Separat flik: Sveriges alla laddstationer på interaktiv karta (Lazy loaded) */
          <React.Suspense
            fallback={
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center text-slate-300 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm font-semibold">Laddar Sveriges laddstationskarta...</p>
              </div>
            }
          >
            <ChargingMap onSelectStationAsDestination={handleSelectStationAsDestination} />
          </React.Suspense>
        )}

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
            <HeaderHero
              vehicle={vehicle}
              tripDistanceMil={tripDistanceMil}
              isRoundTrip={isRoundTrip}
              isSyncing={syncStatus.isSyncing}
              lastSyncedAt={syncStatus.lastSyncedAt}
              onManualSync={handleManualSync}
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />

            {/* 2. Occasional Driver Road Trip Assistant */}
            <RoadTripPlanner
              distanceMil={tripDistanceMil}
              vehicle={vehicle}
              conditions={conditions}
              petrolPricePerLiter={fuelPrice.pricePerLiter}
              homePricePerKwh={homePrice}
              fastPricePerKwh={fastPrice}
              onSelectRoutePreset={handleSelectRoutePreset}
            />

        {/* 3. Driving Conditions (Winter, Roof Box, Highway Speed) */}
        <TripConditionsSelector
          baseConsumption={vehicle.consumptionKwhPer100Km}
          batteryCapacityKwh={vehicle.batteryCapacityKwh}
          conditions={conditions}
          onChange={handleConditionsChange}
        />

        {/* 4. Primary Configuration Grid: Valbara Operatörer (Vänster) & Ruttkalkyl (Höger) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OperatorRoutePlanner
            vehicle={vehicle}
            onVehicleChange={handleVehicleChange}
            conditions={conditions}
            tripDistanceMil={tripDistanceMil}
            startAddress={startAddress}
            destAddress={destAddress}
            waypoints={waypoints}
            routeCoordinates={routeResult?.routeCoordinates}
            homePricePerKwh={homePrice}
            petrolPricePerLiter={fuelPrice.pricePerLiter}
          />
          <RouteCalculator
            distanceMil={tripDistanceMil}
            onDistanceChange={handleTripDistanceChange}
            startAddress={startAddress}
            onStartAddressChange={handleStartAddressChange}
            destAddress={destAddress}
            onDestAddressChange={handleDestAddressChange}
            waypoints={waypoints}
            onWaypointsChange={handleWaypointsChange}
            isRoundTrip={isRoundTrip}
            onIsRoundTripChange={handleRoundTripChange}
            onRouteCalculated={setRouteResultState}
          />
        </div>

        {/* 5. Road Trip Checklist for Occasional Long Drivers */}
        <RoadTripChecklist items={checklist} onToggleItem={handleToggleChecklist} />

        {/* 6. Månadsuppskattning för scenarier och månadskostnad */}
        <MonthlySettings
          monthlyDistanceMil={monthlyDistanceMil}
          onMonthlyDistanceChange={handleMonthlyDistanceChange}
        />

        {/* 7. Komplett Pris- och Kostnadsjämförelse (Kort, Bardiagram mot bensin, Sammanställningstabell) */}
        <ScenarioComparison
          scenarios={scenarios}
          results={results}
          cheapestTripId={cheapestTripId}
          cheapestMonthlyId={cheapestMonthlyId}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
          onUpdateScenarios={handleScenariosChange}
          petrolPricePerLiter={fuelPrice.pricePerLiter}
          petrolSource={fuelPrice.source}
          petrolUpdatedAt={fuelPrice.updatedAt}
          onPetrolPriceChange={handlePetrolPriceChange}
          onRefreshPetrolPrice={handleRefreshPetrolPrice}
        />

        {/* 8. Trip History & Saved Routes */}
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
          isRoundTrip={isRoundTrip}
        />

        {/* 9. Säkerhetskopiering & Databashantering (Kollapsbar för ett renare gränssnitt) */}
        <details className="group bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 transition-all hover:border-slate-700">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">Säkerhetskopiering & Molndatabas</span>
                <p className="text-xs text-slate-400">Exportera/importera JSON-backup, nollställ eller hantera molnsynk</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-lg group-open:hidden transition">
              Öppna hantering ▾
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg hidden group-open:inline transition">
              Dölj ▴
            </span>
          </summary>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <DatabaseManager
              vehicle={vehicle}
              scenarios={scenarios}
              tripDistanceMil={tripDistanceMil}
              monthlyDistanceMil={monthlyDistanceMil}
              startAddress={startAddress}
              destAddress={destAddress}
              savedTripsCount={trips.length}
              onDataReloaded={loadDataFromDb}
              isSyncing={syncStatus.isSyncing}
              lastSyncedAt={syncStatus.lastSyncedAt}
              syncError={syncStatus.error}
              onManualSync={handleManualSync}
              cloudDocId={syncStatus.cloudDocId}
            />
          </div>
        </details>
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

      {/* Profil & Fordonshanteringsmodal (Byt bild, ändra namn, byt pinkod) */}
      {currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onAccountUpdated={handleAccountUpdated}
        />
      )}
    </div>
  );
};

export default App;
