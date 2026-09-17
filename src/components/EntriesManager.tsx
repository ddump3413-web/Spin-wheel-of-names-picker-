import React, { useState } from 'react';
import { WheelItem } from '../types';
import { PRESET_PALETTES, PRESET_TEMPLATES } from '../utils/wheelMath';
import {
  Plus,
  Trash2,
  Palette,
  Shuffle,
  FileText,
  Sparkles,
  List,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';

interface EntriesManagerProps {
  items: WheelItem[];
  onUpdateItems: (items: WheelItem[]) => void;
  disabled?: boolean;
}

export const EntriesManager: React.FC<EntriesManagerProps> = ({
  items,
  onUpdateItems,
  disabled = false,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366F1');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);

  const activeItems = items.filter((it) => it.enabled);

  // Add a single item
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Pick next color from current palette
    const currentPalette = PRESET_PALETTES[activePaletteIndex].colors;
    const nextColor = currentPalette[items.length % currentPalette.length];

    const newItem: WheelItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      name: trimmed,
      color: newColor || nextColor,
      weight: 20,
      enabled: true,
    };

    onUpdateItems([...items, newItem]);
    setNewName('');

    // Pre-select next color for the next item
    const followingColor = currentPalette[(items.length + 1) % currentPalette.length];
    setNewColor(followingColor);
  };

  // Update item field
  const handleUpdateItem = (id: string, updates: Partial<WheelItem>) => {
    onUpdateItems(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
  };

  // Shuffle or apply a curated color theme across all entries
  const handleApplyPalette = (paletteIndex: number) => {
    setActivePaletteIndex(paletteIndex);
    const palette = PRESET_PALETTES[paletteIndex].colors;
    onUpdateItems(
      items.map((item, idx) => ({
        ...item,
        color: palette[idx % palette.length],
      }))
    );
  };

  // Randomize colors from the active palette
  const handleRandomizeColors = () => {
    const palette = PRESET_PALETTES[activePaletteIndex].colors;
    onUpdateItems(
      items.map((item) => ({
        ...item,
        color: palette[Math.floor(Math.random() * palette.length)],
      }))
    );
  };

  // Load preset template
  const handleLoadPreset = (template: (typeof PRESET_TEMPLATES)[0]) => {
    const newItems: WheelItem[] = template.items.map((item, idx) => ({
      ...item,
      id: Date.now().toString() + idx,
    }));
    onUpdateItems(newItems);
  };

  // Bulk import
  const handleBulkImport = (mode: 'replace' | 'append') => {
    const lines = bulkText
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const palette = PRESET_PALETTES[activePaletteIndex].colors;
    const startIndex = mode === 'append' ? items.length : 0;

    const importedItems: WheelItem[] = lines.map((name, i) => ({
      id: (Date.now() + i).toString(),
      name,
      color: palette[(startIndex + i) % palette.length],
      weight: 20,
      enabled: true,
    }));

    if (mode === 'replace') {
      onUpdateItems(importedItems);
    } else {
      onUpdateItems([...items, ...importedItems]);
    }

    setBulkText('');
    setIsBulkOpen(false);
  };

  return (
    <div id="entries-manager-card" className="flex flex-col h-full overflow-hidden bg-white text-slate-800">
      {/* Quick Toolbar with Bulk Import and Color Themes */}
      <div className="pb-3 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-900">Entries</span>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {activeItems.length} active
            </span>
          </div>

          {/* Quick Toolbar Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="open-bulk-import-btn"
              onClick={() => setIsBulkOpen(true)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
              title="Bulk import or paste a list of names"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Bulk Paste</span>
            </button>
          </div>
        </div>

        {/* Color Palette Selector Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 flex-shrink-0">
              <Palette className="w-3.5 h-3.5 text-amber-500" /> Themes:
            </span>
            {PRESET_PALETTES.map((pal, idx) => (
              <button
                key={pal.name}
                id={`palette-theme-${idx}`}
                onClick={() => handleApplyPalette(idx)}
                disabled={disabled}
                className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  activePaletteIndex === idx
                    ? 'bg-blue-50 text-blue-800 border border-blue-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={`Apply ${pal.name} theme`}
              >
                <div className="flex -space-x-1">
                  {pal.colors.slice(0, 4).map((c, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span>{pal.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <button
            id="shuffle-colors-btn"
            onClick={handleRandomizeColors}
            disabled={disabled || items.length === 0}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors flex-shrink-0 cursor-pointer"
            title="Randomize colors from palette"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add Entry Form */}
      <form
        onSubmit={handleAddItem}
        className="py-3 border-b border-slate-200 flex items-center gap-2"
      >
        {/* Color picker circle */}
        <label
          className="relative w-8 h-8 rounded-full border-2 border-slate-200 shadow-sm cursor-pointer flex-shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: newColor }}
          title="Pick color for new entry"
        >
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            disabled={disabled}
          />
        </label>

        {/* Input field */}
        <input
          id="new-entry-input"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Type a name to add..."
          disabled={disabled}
          className="flex-1 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 min-w-0 shadow-2xs"
        />

        {/* Add button */}
        <button
          id="add-entry-btn"
          type="submit"
          disabled={disabled || !newName.trim()}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Entries List - Names Only */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-0">
        {items.length === 0 ? (
          <div className="text-center py-8 px-4 text-slate-500">
            <p className="text-sm mb-2 font-medium">No entries yet.</p>
            <div className="text-xs text-slate-400">
              Type names above or click a quick preset below!
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              id={`wheel-entry-${item.id}`}
              className={`group relative flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                item.enabled
                  ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              {/* Color Swatch Picker */}
              <label
                className="relative w-6 h-6 rounded-md border border-slate-200 shadow-2xs cursor-pointer flex-shrink-0 flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: item.color }}
                title="Change segment color"
              >
                <input
                  type="color"
                  value={item.color}
                  onChange={(e) => handleUpdateItem(item.id, { color: e.target.value })}
                  disabled={disabled}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>

              {/* Editable Name */}
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                disabled={disabled}
                placeholder="Entry name"
                className="flex-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-slate-50 rounded px-1.5 py-0.5 text-sm font-semibold text-slate-900 focus:outline-none transition-colors"
              />

              {/* Action Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Enable / Disable Toggle */}
                <button
                  type="button"
                  onClick={() => handleUpdateItem(item.id, { enabled: !item.enabled })}
                  disabled={disabled}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    item.enabled
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title={item.enabled ? 'Hide from wheel' : 'Show on wheel'}
                >
                  {item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Delete Entry */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={disabled}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preset Templates Drawer / Bar */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="uppercase tracking-wider text-[11px]">
            Quick Presets:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              id={`preset-btn-${tmpl.name.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleLoadPreset(tmpl)}
              disabled={disabled}
              className="px-2.5 py-1 rounded-lg text-xs bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>{tmpl.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Import Modal */}
      {isBulkOpen && (
        <div
          id="bulk-import-modal"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsBulkOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Bulk Paste Names</h3>
              </div>
              <button
                onClick={() => setIsBulkOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paste names separated by new lines or commas:
            </p>

            <textarea
              id="bulk-import-textarea"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Alice&#10;Bob&#10;Charlie&#10;Diana"
              rows={6}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono shadow-inner"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleBulkImport('append')}
                disabled={!bulkText.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Append to List
              </button>
              <button
                type="button"
                onClick={() => handleBulkImport('replace')}
                disabled={!bulkText.trim()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-40 cursor-pointer"
              >
                Replace List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
