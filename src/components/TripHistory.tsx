import React, { useState } from 'react';
import { History, BookmarkCheck, Trash2, ArrowRight, Zap, Calendar, ExternalLink } from 'lucide-react';
import { SavedTrip, ScenarioResult, VehicleProfile } from '../types';
import { kwhPer100KmToKwhPerMil } from '../utils/calculations';

interface TripHistoryProps {
  trips: SavedTrip[];
  startAddress: string;
  destAddress: string;
  distanceMil: number;
  vehicle: VehicleProfile;
  results: ScenarioResult[];
  cheapestTripId: string;
  onSaveCurrentTrip: (trip: SavedTrip) => void;
  onLoadTrip: (trip: SavedTrip) => void;
  onDeleteTrip: (id: string) => void;
  onClearAllTrips: () => void;
  isRoundTrip?: boolean;
}

export const TripHistory: React.FC<TripHistoryProps> = ({
  trips,
  startAddress,
  destAddress,
  distanceMil,
  vehicle,
  results,
  cheapestTripId,
  onSaveCurrentTrip,
  onLoadTrip,
  onDeleteTrip,
  onClearAllTrips,
  isRoundTrip,
}) => {
  const [justSaved, setJustSaved] = useState(false);

  const cheapestResult = results.find((r) => r.scenario.id === cheapestTripId) || results[0];
  const highestTripCost = Math.max(...results.map((r) => r.tripCost), 0);
  const kwhPerMil = kwhPer100KmToKwhPerMil(vehicle.consumptionKwhPer100Km);
  const energyUsedKwh = Number((distanceMil * kwhPerMil).toFixed(1));

  const handleSave = () => {
    const title = isRoundTrip
      ? `${startAddress || 'Start'} ⇄ ${destAddress || 'Destination'} (T&R)`
      : `${startAddress || 'Start'} till ${destAddress || 'Destination'}`;

    const newTrip: SavedTrip = {
      id: `trip-${Date.now()}`,
      createdAt: new Date().toISOString(),
      title,
      startAddress: startAddress || 'Startadress',
      destAddress: destAddress || 'Destinationsadress',
      distanceMil,
      distanceKm: Math.round(distanceMil * 10),
      consumptionKwhPer100Km: vehicle.consumptionKwhPer100Km,
      energyUsedKwh,
      cheapestScenarioName: cheapestResult?.scenario.name || 'Hemmaladdning',
      cheapestTripCost: cheapestResult?.tripCost || 0,
      highestTripCost,
    };

    onSaveCurrentTrip(newTrip);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Resehistorik & Sparade Rutter</h2>
            <p className="text-xs text-slate-400">Dina sparade resor lagras i webbläsarens IndexedDB</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save active trip button */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition active:scale-95 shadow ${
              justSaved
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{justSaved ? 'Resa sparad i DB!' : 'Spara aktuell resa i DB'}</span>
          </button>

          {trips.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Vill du rensa all sparad resehistorik i databasen?')) {
                  onClearAllTrips();
                }
              }}
              className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition"
              title="Rensa all resehistorik"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Trips list */}
      {trips.length === 0 ? (
        <div className="bg-slate-950/40 rounded-xl p-8 border border-slate-800/80 text-center">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">Inga sparade resor i databasen än</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Klicka på knappen "Spara aktuell resa i DB" för att spara en rutt med distans och prisjämförelse i IndexedDB.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const dateStr = new Date(trip.createdAt).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={trip.id}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      {trip.startAddress}
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {trip.destAddress}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                      <Calendar className="w-2.5 h-2.5" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono-numbers">
                    <span>
                      Distans: <strong className="text-white">{trip.distanceMil} mil</strong> ({trip.distanceKm} km)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      {trip.energyUsedKwh} kWh
                    </span>
                    <span>•</span>
                    <span>
                      Lägst pris: <strong className="text-emerald-400">{trip.cheapestTripCost} kr</strong> ({trip.cheapestScenarioName})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onLoadTrip(trip)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition"
                    title="Ladda in denna rutt i kalkylatorn"
                  >
                    <span>Ladda rutt</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDeleteTrip(trip.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title="Ta bort från historiken"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
