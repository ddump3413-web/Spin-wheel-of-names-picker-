import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WheelItem, SpinResult, WheelConfig, SpinDurationPreset } from './types';
import { DEFAULT_ITEMS, calculateSlices, SliceSlice } from './utils/wheelMath';
import { WheelCanvas } from './components/WheelCanvas';
import { EntriesManager } from './components/EntriesManager';
import { BlablaMenu } from './components/BlablaMenu';
import { WinnerModal } from './components/WinnerModal';
import { SpinHistory } from './components/SpinHistory';
import {
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Clock,
  Maximize,
  Minimize,
  HelpCircle,
  Percent,
  Scale,
  SlidersHorizontal,
  Sliders,
  List,
  X,
  Settings2,
} from 'lucide-react';

const STORAGE_KEY_ITEMS = 'wheel_picker_items_v1';
const STORAGE_KEY_CONFIG = 'wheel_picker_config_v1';
const STORAGE_KEY_HISTORY = 'wheel_picker_history_v1';

export default function App() {
  // 1. Initialize items from localStorage or defaults
  const [items, setItems] = useState<WheelItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse error
    }
    return DEFAULT_ITEMS;
  });

  // 2. Wheel configuration
  const [config, setConfig] = useState<WheelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          spinDuration: parsed.spinDuration ?? 5,
          soundEnabled: parsed.soundEnabled ?? true,
          confettiEnabled: parsed.confettiEnabled ?? true,
          removeWinnerOnWin: parsed.removeWinnerOnWin ?? false,
          showPercentageOnWheel: parsed.showPercentageOnWheel ?? false,
          equalSliceVisuals: parsed.equalSliceVisuals ?? true,
        };
      }
    } catch {
      // Ignore parse error
    }
    return {
      spinDuration: 5,
      soundEnabled: true,
      confettiEnabled: true,
      removeWinnerOnWin: false,
      showPercentageOnWheel: false,
      equalSliceVisuals: true,
    };
  });

  // 3. Spin History
  const [history, setHistory] = useState<SpinResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse error
    }
    return [];
  });

  // 4. Runtime state
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<SliceSlice | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'entries' | 'blabla' | null>(null);

  // Close slide-over menu or help on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer(null);
        setShowHelp(false);
        setShowMobileSettings(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize items with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch {
      // localStorage quota
    }
  }, [items]);

  // Synchronize config with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch {
      // localStorage quota
    }
  }, [config]);

  // Synchronize history with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // localStorage quota
    }
  }, [history]);

  // Calculate slices based on items and their customized weights
  const slices = useMemo(() => {
    return calculateSlices(items, config.equalSliceVisuals);
  }, [items, config.equalSliceVisuals]);

  // Spin callbacks
  const handleSpinStart = useCallback(() => {
    setIsSpinning(true);
    setIsWinnerModalOpen(false);
    setCurrentWinner(null);
  }, []);

  const handleSpinEnd = useCallback(
    (winner: SliceSlice) => {
      setIsSpinning(false);
      setCurrentWinner(winner);
      setIsWinnerModalOpen(true);

      // Record in history
      const newResult: SpinResult = {
        id: Date.now().toString(),
        itemId: winner.item.id,
        itemName: winner.item.name,
        itemColor: winner.item.color,
        percentage: winner.percentage,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newResult, ...prev.slice(0, 49)]);

      // Auto-remove if configured
      if (config.removeWinnerOnWin) {
        setItems((prev) => prev.filter((it) => it.id !== winner.item.id));
      }
    },
    [config.removeWinnerOnWin]
  );

  const handleRemoveWinner = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleDisableWinner = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, enabled: false } : it))
    );
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset the wheel back to original default names and colors?')) {
      setItems(DEFAULT_ITEMS);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo / App Name */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap">
                Wheel of Names
              </h1>
              <span className="hidden sm:inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Classic
              </span>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Open Entries Menu Button */}
            <button
              id="open-entries-menu-btn"
              onClick={() => setActiveDrawer('entries')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs border border-blue-700 transition-all cursor-pointer whitespace-nowrap"
              title="Open Entries Menu (Names)"
              aria-label="Open Entries Menu"
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-100" />
              <span>Entries</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-800 text-[10px] sm:text-[11px] font-bold text-white">
                {items.filter((i) => i.enabled).length}
              </span>
            </button>

            {/* Open blabla Menu Button */}
            <button
              id="open-blabla-menu-btn"
              onClick={() => setActiveDrawer('blabla')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold border border-slate-300 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              title="Open blabla Menu (Weights & Slice Settings)"
              aria-label="Open blabla Menu"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>blabla</span>
            </button>

            {/* Desktop Quick Settings Cluster */}
            <div className="hidden md:flex items-center gap-2">
              {/* Spin Duration Selector */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-300 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
                {([3, 5, 8] as SpinDurationPreset[]).map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setConfig((prev) => ({ ...prev, spinDuration: dur }))}
                    disabled={isSpinning}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      config.spinDuration === dur
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={`${dur} seconds spin duration`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>

              {/* Slice Visuals Mode */}
              <button
                id="toggle-equal-slices-header-btn"
                onClick={() => setConfig((prev) => ({ ...prev, equalSliceVisuals: !prev.equalSliceVisuals }))}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  config.equalSliceVisuals
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={
                  config.equalSliceVisuals
                    ? 'Slice colors are equal size (uniform segments)'
                    : 'Slice colors expand with weights'
                }
                aria-label="Toggle equal slice visual sizes"
              >
                <Scale className="w-4 h-4" />
              </button>

              {/* Percentage on Wheel Toggle */}
              <button
                id="toggle-wheel-percentage-btn"
                onClick={() => setConfig((prev) => ({ ...prev, showPercentageOnWheel: !prev.showPercentageOnWheel }))}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  config.showPercentageOnWheel
                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={config.showPercentageOnWheel ? 'Hide percentage on wheel' : 'Show percentage on wheel'}
                aria-label={config.showPercentageOnWheel ? 'Hide percentage on wheel' : 'Show percentage on wheel'}
              >
                <Percent className="w-4 h-4" />
              </button>

              {/* Sound Toggle Button */}
              <button
                id="toggle-sound-btn"
                onClick={() => setConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  config.soundEnabled
                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                    : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={config.soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                aria-label={config.soundEnabled ? 'Mute sound' : 'Unmute sound'}
              >
                {config.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              {/* Reset Wheel Button */}
              <button
                id="reset-wheel-btn"
                onClick={handleResetToDefaults}
                disabled={isSpinning}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                title="Reset wheel to original presets"
                aria-label="Reset to default items"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                id="fullscreen-toggle-btn"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                aria-label="Toggle fullscreen"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Mobile Settings Toggle */}
            <button
              id="mobile-settings-toggle-btn"
              onClick={() => setShowMobileSettings((prev) => !prev)}
              className={`md:hidden p-2 rounded-xl border transition-all cursor-pointer ${
                showMobileSettings
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Toggle settings"
              aria-label="Toggle settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Help Button */}
            <button
              id="help-toggle-btn"
              onClick={() => setShowHelp((prev) => !prev)}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
              title="How to use this wheel"
              aria-label="How to use"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Settings Sub-Bar */}
        {showMobileSettings && (
          <div className="md:hidden pt-3 mt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            {/* Duration */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-300 text-xs">
              <Clock className="w-3 h-3 text-slate-500 ml-1 mr-1" />
              {([3, 5, 8] as SpinDurationPreset[]).map((dur) => (
                <button
                  key={dur}
                  onClick={() => setConfig((prev) => ({ ...prev, spinDuration: dur }))}
                  disabled={isSpinning}
                  className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    config.spinDuration === dur
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Slices mode */}
              <button
                onClick={() => setConfig((prev) => ({ ...prev, equalSliceVisuals: !prev.equalSliceVisuals }))}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  config.equalSliceVisuals
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-300'
                }`}
                title="Toggle uniform slice sizes"
              >
                <Scale className="w-4 h-4" />
              </button>

              {/* Percent on wheel */}
              <button
                onClick={() => setConfig((prev) => ({ ...prev, showPercentageOnWheel: !prev.showPercentageOnWheel }))}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  config.showPercentageOnWheel
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-500 border-slate-300'
                }`}
                title="Toggle percentage labels"
              >
                <Percent className="w-4 h-4" />
              </button>

              {/* Sound */}
              <button
                onClick={() => setConfig((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  config.soundEnabled
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-500 border-slate-300'
                }`}
                title="Sound toggle"
              >
                {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Reset */}
              <button
                onClick={handleResetToDefaults}
                disabled={isSpinning}
                className="p-2 rounded-xl bg-white text-slate-600 border border-slate-300 cursor-pointer"
                title="Reset defaults"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white text-slate-600 border border-slate-300 cursor-pointer"
                title="Toggle fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Optional Help Drawer */}
      {showHelp && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-blue-900">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-950">Tips:</span>
              <span>• Click the center or press <kbd className="px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-900 font-mono font-bold">Space</kbd> to spin.</span>
              <span>• Open <strong>Entries</strong> to add or edit names.</span>
              <span>• Open <strong>blabla</strong> to adjust weights and slice sizes.</span>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout - Clean & Focused Wheel Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-6 flex flex-col items-center justify-start gap-4 sm:gap-6 min-h-0">
        {/* Centered Wheel Canvas */}
        <div className="w-full flex items-center justify-center py-1 sm:py-2">
          <WheelCanvas
            slices={slices}
            isSpinning={isSpinning}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
            spinDuration={config.spinDuration}
            soundEnabled={config.soundEnabled}
            showPercentageOnWheel={config.showPercentageOnWheel}
          />
        </div>

        {/* Clean Status & Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-600 bg-white px-4 py-2 rounded-xl sm:rounded-full border border-slate-200 shadow-2xs text-center">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {slices.length} participant{slices.length !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-300 hidden xs:inline">•</span>
          <span className="hidden sm:inline">Click Center or press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 font-mono text-[11px] font-bold">Spacebar</kbd> to spin</span>
          <span className="text-slate-300">•</span>
          <button
            id="quick-open-entries-btn"
            onClick={() => setActiveDrawer('entries')}
            className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            Entries
          </button>
          <span className="text-slate-300">•</span>
          <button
            id="quick-open-blabla-btn"
            onClick={() => setActiveDrawer('blabla')}
            className="text-amber-600 hover:text-amber-700 font-bold underline underline-offset-2 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            blabla
          </button>
        </div>

        {/* Spin History Drawer / Feed */}
        <div className="w-full max-w-2xl pt-1">
          <SpinHistory
            history={history}
            onClearHistory={() => setHistory([])}
          />
        </div>
      </main>

      {/* Unified Slide-over Drawer for Entries & blabla */}
      {activeDrawer !== null && (
        <div
          id="drawer-backdrop"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end"
          onClick={() => setActiveDrawer(null)}
        >
          <div
            id="drawer-panel"
            className="w-full max-w-full sm:max-w-md md:max-w-lg h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header with Interactive Tabs */}
            <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10 gap-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  id="drawer-tab-entries"
                  onClick={() => setActiveDrawer('entries')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeDrawer === 'entries'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Entries</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-800 text-[10px] text-white">
                    {items.filter((i) => i.enabled).length}
                  </span>
                </button>

                <button
                  id="drawer-tab-blabla"
                  onClick={() => setActiveDrawer('blabla')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeDrawer === 'blabla'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-200" />
                  <span>blabla</span>
                </button>
              </div>

              <button
                id="close-drawer-btn"
                onClick={() => setActiveDrawer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="Close Menu (Esc)"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0 bg-white">
              {activeDrawer === 'entries' ? (
                <EntriesManager
                  items={items}
                  onUpdateItems={setItems}
                  disabled={isSpinning}
                />
              ) : (
                <BlablaMenu
                  items={items}
                  onUpdateItems={setItems}
                  equalSliceVisuals={config.equalSliceVisuals}
                  onToggleEqualSliceVisuals={() =>
                    setConfig((prev) => ({ ...prev, equalSliceVisuals: !prev.equalSliceVisuals }))
                  }
                  disabled={isSpinning}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Winner Celebration Modal */}
      <WinnerModal
        winner={currentWinner}
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        onSpinAgain={() => {
          setIsWinnerModalOpen(false);
          // Allow modal close transition then trigger spin
          setTimeout(() => {
            const spinBtn = document.getElementById('wheel-center-spin-btn');
            spinBtn?.click();
          }, 150);
        }}
        onRemoveWinner={handleRemoveWinner}
        onDisableWinner={handleDisableWinner}
        confettiEnabled={config.confettiEnabled}
      />
    </div>
  );
}
