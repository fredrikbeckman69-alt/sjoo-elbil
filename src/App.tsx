import React from 'react';
import { HeaderHero } from './components/HeaderHero';
import { VehicleSettings } from './components/VehicleSettings';
import { RouteCalculator } from './components/RouteCalculator';
import { MonthlySettings } from './components/MonthlySettings';
import { ScenarioComparison } from './components/ScenarioComparison';
import { VisualChart } from './components/VisualChart';
import { SummaryTable } from './components/SummaryTable';
import { useLocalStorage } from './hooks/useLocalStorage';
import { VehicleProfile, ChargingScenario } from './types';
import {
  DEFAULT_VEHICLE,
  DEFAULT_SCENARIOS,
  calculateScenarioResults,
  kwhPer100KmToKwhPerMil,
} from './utils/calculations';
import { Zap, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  // Persistenta states
  const [vehicle, setVehicle] = useLocalStorage<VehicleProfile>('sjoo_vehicle_v1', DEFAULT_VEHICLE);
  const [scenarios, setScenarios] = useLocalStorage<ChargingScenario[]>('sjoo_scenarios_v1', DEFAULT_SCENARIOS);
  const [tripDistanceMil, setTripDistanceMil] = useLocalStorage<number>('sjoo_trip_distance_v1', 25);
  const [monthlyDistanceMil, setMonthlyDistanceMil] = useLocalStorage<number>('sjoo_monthly_distance_v1', 125);
  const [startAddress, setStartAddress] = useLocalStorage<string>('sjoo_start_addr_v1', 'Stockholm');
  const [destAddress, setDestAddress] = useLocalStorage<string>('sjoo_dest_addr_v1', 'Göteborg');

  // Beräkna alla resultat
  const { results, cheapestTripId, cheapestMonthlyId } = calculateScenarioResults(
    scenarios,
    vehicle.consumptionKwhPer100Km,
    tripDistanceMil,
    monthlyDistanceMil
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white safe-top-p safe-bottom-p">
      {/* Top ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 space-y-6">
        {/* 1. Header & Hero with car image */}
        <HeaderHero vehicle={vehicle} tripDistanceMil={tripDistanceMil} />

        {/* 2. Primary Configuration Grid: Vehicle & Trip */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VehicleSettings vehicle={vehicle} onChange={setVehicle} />
          <RouteCalculator
            distanceMil={tripDistanceMil}
            onDistanceChange={setTripDistanceMil}
            startAddress={startAddress}
            onStartAddressChange={setStartAddress}
            destAddress={destAddress}
            onDestAddressChange={setDestAddress}
          />
        </div>

        {/* 3. Monthly Distance Estimation */}
        <MonthlySettings
          monthlyDistanceMil={monthlyDistanceMil}
          onMonthlyDistanceChange={setMonthlyDistanceMil}
        />

        {/* 4. Scenario & Price Comparison */}
        <ScenarioComparison
          scenarios={scenarios}
          results={results}
          cheapestTripId={cheapestTripId}
          cheapestMonthlyId={cheapestMonthlyId}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
          onUpdateScenarios={setScenarios}
        />

        {/* 5. Visual Chart & Savings */}
        <VisualChart
          results={results}
          tripDistanceMil={tripDistanceMil}
          monthlyDistanceMil={monthlyDistanceMil}
        />

        {/* 6. Complete Summary Table */}
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
            <span className="font-semibold text-slate-300">Sjöö Elbilskalkylator</span>
            <span>• Svensk standard ({kwhPer100KmToKwhPerMil(vehicle.consumptionKwhPer100Km)} kWh/mil)</span>
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
