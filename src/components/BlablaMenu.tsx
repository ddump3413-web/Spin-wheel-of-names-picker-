import React from 'react';
import { WheelItem } from '../types';
import { Sliders, Scale, PieChart, Equal, Percent, Info } from 'lucide-react';

interface BlablaMenuProps {
  items: WheelItem[];
  onUpdateItems: (items: WheelItem[]) => void;
  equalSliceVisuals: boolean;
  onToggleEqualSliceVisuals: () => void;
  disabled?: boolean;
}

export const BlablaMenu: React.FC<BlablaMenuProps> = ({
  items,
  onUpdateItems,
  equalSliceVisuals,
  onToggleEqualSliceVisuals,
  disabled = false,
}) => {
  const activeItems = items.filter((item) => item.enabled);
  const totalWeight = activeItems.reduce((acc, curr) => acc + curr.weight, 0);

  // Equalize all weights so everyone has equal weight
  const handleEqualizeAll = () => {
    onUpdateItems(
      items.map((item) => ({
        ...item,
        weight: 20,
      }))
    );
  };

  const handleUpdateItemWeight = (id: string, weight: number) => {
    onUpdateItems(
      items.map((item) =>
        item.id === id ? { ...item, weight: Math.max(1, Math.min(100, weight)) } : item
      )
    );
  };

  // Convert target percentage into proportional weight
  const handleSetTargetPercentage = (itemId: string, targetPercent: number) => {
    if (activeItems.length <= 1) return;
    const clampedPercent = Math.max(1, Math.min(99, targetPercent));

    const otherItems = activeItems.filter((i) => i.id !== itemId);
    const sumOtherWeights = otherItems.reduce((sum, i) => sum + i.weight, 0);

    if (sumOtherWeights === 0) return;

    // targetPercent / 100 = newWeight / (newWeight + sumOtherWeights)
    // newWeight = (targetPercent * sumOtherWeights) / (100 - targetPercent)
    const newWeight = Math.round((clampedPercent * sumOtherWeights) / (100 - clampedPercent));
    const finalWeight = Math.max(1, Math.min(500, newWeight));

    onUpdateItems(
      items.map((item) => (item.id === itemId ? { ...item, weight: finalWeight } : item))
    );
  };

  return (
    <div id="blabla-settings-card" className="flex flex-col h-full space-y-4 text-slate-800">
      {/* Visual Segment Mode Card */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`inline-flex items-center justify-center p-2 rounded-xl ${
                equalSliceVisuals
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {equalSliceVisuals ? <Scale className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
            </span>
            <div className="leading-tight truncate">
              <h3 className="font-bold text-slate-900 text-sm">
                {equalSliceVisuals ? 'Equal Slice Sizes' : 'Proportional Slices'}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {equalSliceVisuals
                  ? 'Wheel colors stay equal while weights adjust chances'
                  : 'Wheel slice sizes grow or shrink with weights'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="blabla-toggle-visuals-btn"
            onClick={onToggleEqualSliceVisuals}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex-shrink-0 cursor-pointer ${
              equalSliceVisuals
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100'
            }`}
          >
            {equalSliceVisuals ? 'Colors Fixed' : 'Colors Expand'}
          </button>
        </div>

        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 shadow-2xs">
          <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            {equalSliceVisuals
              ? 'With Equal Slice Sizes active, changing weights will silently affect the landing outcome without changing the visual arc of any color.'
              : 'With Proportional Slices active, higher weights will visually widen that slice on the wheel.'}
          </span>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>Adjust weights for active entries</span>
        </div>

        <button
          type="button"
          id="blabla-equalize-all-btn"
          onClick={handleEqualizeAll}
          disabled={disabled || activeItems.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
          title="Reset all entries to equal weight (20)"
        >
          <Equal className="w-3.5 h-3.5 text-emerald-600" />
          <span>Equalize All</span>
        </button>
      </div>

      {/* List of Entries with Weight Sliders & % Inputs */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-0 pr-1">
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            No entries found. Add names in the Entries menu first.
          </div>
        ) : (
          items.map((item) => {
            const percentage =
              totalWeight > 0 && item.enabled
                ? (item.weight / totalWeight) * 100
                : 0;

            return (
              <div
                key={item.id}
                id={`blabla-item-${item.id}`}
                className={`p-3 rounded-xl border transition-all ${
                  item.enabled
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Item Summary Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.enabled ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {percentage.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Disabled</span>
                    )}
                  </div>
                </div>

                {/* Weight Slider and Direct % Input */}
                {item.enabled && (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 pt-2 border-t border-slate-100 text-xs">
                    <span className="w-16 flex-shrink-0 text-[11px] text-slate-500 font-medium">
                      Weight: <strong className="text-slate-900">{item.weight}</strong>
                    </span>

                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={item.weight}
                      onChange={(e) =>
                        handleUpdateItemWeight(item.id, parseInt(e.target.value, 10) || 1)
                      }
                      disabled={disabled}
                      className="flex-1 min-w-[90px] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      title="Adjust weight"
                    />

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[11px] text-slate-500">Set %:</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        defaultValue={Math.round(percentage)}
                        key={`${item.id}-${Math.round(percentage)}`}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            handleSetTargetPercentage(item.id, val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(val)) {
                              handleSetTargetPercentage(item.id, val);
                            }
                          }
                        }}
                        disabled={disabled}
                        className="w-12 bg-white border border-slate-300 rounded px-1 py-0.5 text-[11px] text-center text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                        title="Set exact percentage and press Enter"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
