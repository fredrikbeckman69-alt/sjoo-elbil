import React from 'react';
import { Route, Zap, Car, Sparkles } from 'lucide-react';

export type AppTab = 'calculator' | 'operators' | 'registry';

interface NavigationTabsProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  operatorsCount?: number;
  activeVehicleName?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  operatorsCount = 15,
  activeVehicleName: _activeVehicleName,
}) => {
  return (
    <nav
      aria-label="Applikationsflikar"
      className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl flex flex-wrap sm:flex-nowrap items-center gap-1 sm:gap-2 mb-6"
    >
      {/* Flik 1: Kalkylator & Rutt */}
      <button
        type="button"
        onClick={() => onTabChange('calculator')}
        className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
          activeTab === 'calculator'
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <Route className={`w-4 h-4 ${activeTab === 'calculator' ? 'text-white' : 'text-emerald-400'}`} />
        <span>Kalkylator & Rutt</span>
      </button>

      {/* Flik 2: Laddoperatörer i Sverige (Ny!) */}
      <button
        type="button"
        onClick={() => onTabChange('operators')}
        className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
          activeTab === 'operators'
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/40 border border-cyan-400/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <Zap className={`w-4 h-4 ${activeTab === 'operators' ? 'text-yellow-300 fill-yellow-300' : 'text-cyan-400'}`} />
        <span>Laddoperatörer & Priser</span>
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            activeTab === 'operators'
              ? 'bg-white/20 text-white'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          }`}
        >
          <Sparkles className="w-2.5 h-2.5" />
          {operatorsCount} bolag
        </span>
      </button>

      {/* Flik 3: Fordonsregister */}
      <button
        type="button"
        onClick={() => onTabChange('registry')}
        className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
          activeTab === 'registry'
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/40 border border-indigo-400/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <Car className={`w-4 h-4 ${activeTab === 'registry' ? 'text-white' : 'text-indigo-400'}`} />
        <span>Fordonsregister</span>
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white/15 text-slate-300 rounded">
          FFM56R
        </span>
      </button>
    </nav>
  );
};
