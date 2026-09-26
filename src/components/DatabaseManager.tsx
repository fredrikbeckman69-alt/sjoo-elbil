import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, CheckCircle2, AlertCircle, HardDrive, Cloud, RefreshCw } from 'lucide-react';
import { VehicleProfile, ChargingScenario } from '../types';
import {
  exportDatabaseBackup,
  importDatabaseBackup,
  resetDatabaseToDefaults,
} from '../db/indexedDb';

interface DatabaseManagerProps {
  vehicle: VehicleProfile;
  scenarios: ChargingScenario[];
  tripDistanceMil: number;
  monthlyDistanceMil: number;
  startAddress: string;
  destAddress: string;
  savedTripsCount: number;
  onDataReloaded: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: Date | null;
  syncError?: string | null;
  onManualSync?: () => void;
  cloudDocId?: string;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({
  vehicle,
  scenarios,
  tripDistanceMil,
  monthlyDistanceMil,
  startAddress,
  destAddress,
  savedTripsCount,
  onDataReloaded,
  isSyncing,
  lastSyncedAt,
  syncError,
  onManualSync,
  cloudDocId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleExport = async () => {
    try {
      const backup = await exportDatabaseBackup(vehicle, scenarios, {
        tripDistanceMil,
        monthlyDistanceMil,
        startAddress,
        destAddress,
      });

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sjoo-elbil-databas-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('success', 'Databasen har exporterats som en JSON-säkerhetskopia!');
    } catch (err: any) {
      showNotification('error', `Kunde inte exportera databasen: ${err?.message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await importDatabaseBackup(backup);
      showNotification('success', 'Databasen har återställts från säkerhetskopian!');
      onDataReloaded();
    } catch (err: any) {
      showNotification('error', `Fel vid import av backup: ${err?.message || 'Ogiltig JSON'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    if (window.confirm('Är du säker på att du vill nollställa hela frontend-databasen till standardvärden?')) {
      try {
        await resetDatabaseToDefaults();
        showNotification('success', 'Databasen har återställts till fabriksinställningar.');
        onDataReloaded();
      } catch (err: any) {
        showNotification('error', `Kunde inte nollställa databasen: ${err?.message}`);
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Delad Molndatabas</h2>
              {isSyncing ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  Synkar...
                </span>
              ) : syncError ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold" title={syncError}>
                  <AlertCircle className="w-2.5 h-2.5" />
                  Offline-läge (Lokal cache)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Realtidssynkad för alla
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Ändringar du eller andra användare gör slår igenom automatiskt för alla enheter.
            </p>
          </div>
        </div>

        {/* Database Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 rounded-lg border border-cyan-800/80 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Hämta senaste ändringarna från molnet manuellt"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
              <span>{isSyncing ? 'Synkar...' : 'Synka nu'}</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition active:scale-95"
            title="Ladda ner databasbackup som JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportera JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition active:scale-95"
            title="Ladda upp sparad JSON-backup"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importera JSON</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
            title="Nollställ databasen till standard"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Database Storage Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Fordon</div>
            <div className="font-bold text-white truncate max-w-[130px]">{vehicle.name || 'Min Elbil'}</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 uppercase">Scenarier / Resor</div>
          <div className="font-bold text-white font-mono-numbers">
            {scenarios.length} st <span className="text-[11px] text-emerald-400 font-normal">({savedTripsCount} loggade)</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 uppercase">Molnstatus</div>
          <div className="font-bold text-emerald-400 font-mono-numbers flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Aktiv & Delad
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 uppercase">Senast synkad</div>
          <div
            className="font-bold text-slate-300 font-mono text-[11px] truncate cursor-help"
            title={cloudDocId ? `Molndokument-ID: ${cloudDocId}` : undefined}
          >
            {lastSyncedAt
              ? lastSyncedAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Vid start'}
          </div>
        </div>
      </div>
    </div>
  );
};
