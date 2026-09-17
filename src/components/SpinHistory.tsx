import React from 'react';
import { SpinResult } from '../types';
import { History, Trash2, Trophy, Clock } from 'lucide-react';

interface SpinHistoryProps {
  history: SpinResult[];
  onClearHistory: () => void;
}

export const SpinHistory: React.FC<SpinHistoryProps> = ({
  history,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div
      id="spin-history-section"
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-800"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">Recent Spin Results</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
            {history.length}
          </span>
        </div>

        <button
          id="clear-history-btn"
          onClick={onClearHistory}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          title="Clear all spin history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {history.map((spin, index) => {
          const timeFormatted = new Date(spin.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div
              key={spin.id || index}
              className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs"
            >
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-xs border border-slate-200"
                style={{ backgroundColor: spin.itemColor }}
              />

              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 max-w-[130px] truncate">
                  {spin.itemName}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{timeFormatted}</span>
                </div>
              </div>

              {index === 0 && (
                <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-1" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
