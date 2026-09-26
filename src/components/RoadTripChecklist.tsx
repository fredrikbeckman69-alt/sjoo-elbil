import React from 'react';
import { CheckSquare, Square, ListChecks } from 'lucide-react';
import { ChecklistItem } from '../types';

interface RoadTripChecklistProps {
  items: ChecklistItem[];
  onToggleItem: (id: string) => void;
}

export const RoadTripChecklist: React.FC<RoadTripChecklistProps> = ({ items, onToggleItem }) => {
  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Checklista inför Långresan</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                För en bekymmersfri resa
              </span>
            </div>
            <p className="text-xs text-slate-400">Gå igenom dessa 5 enkla steg innan du rullar iväg</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-white font-mono-numbers">
              {completedCount} av {items.length} klara
            </div>
            <div className="text-[10px] text-slate-400">{progressPercent}% redo</div>
          </div>
          <div className="w-16 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5">
        {items.map((item) => {
          return (
            <div
              key={item.id}
              onClick={() => onToggleItem(item.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                item.completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-emerald-400">
                {item.completed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500" />
                )}
              </div>

              <div className="flex-1">
                <div className={`text-xs sm:text-sm font-bold leading-tight ${item.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                  {item.text}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-normal">
                  {item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
