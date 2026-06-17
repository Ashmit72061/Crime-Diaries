import React, { useState } from 'react';
import { Bookmark, Trash2, Save, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useFilterPresets } from '../../hooks/useFilterPresets.js';

/**
 * FilterPresetsPanel
 *
 * A reusable panel that lets users save and load named filter snapshots.
 *
 * Props:
 *   currentFilters  - the active filter state object (e.g. { recordType, dateFrom, dateTo, psId, ... })
 *   onLoadPreset    - callback(filters) called when user clicks a preset to apply it
 */
export default function FilterPresetsPanel({ currentFilters = {}, onLoadPreset }) {
  const { presets, isLoading, savePreset, deletePreset, isSaving, isDeleting } = useFilterPresets();
  const [expanded, setExpanded] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    savePreset(presetName.trim(), currentFilters);
    setPresetName('');
  };

  const handleLoad = (preset) => {
    onLoadPreset?.(preset.filters ?? {});
  };

  const hasActiveFilter = Object.values(currentFilters).some(Boolean);

  return (
    <div className="border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden text-xs">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 font-semibold">
          <Bookmark size={13} className="text-[#cca43b]" />
          Saved Filter Presets
          {presets.length > 0 && (
            <span className="bg-[#cca43b] text-zinc-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-numbers">
              {presets.length}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
          {/* Save current filters form */}
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name (e.g. This Week Cases)"
              disabled={!hasActiveFilter}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[#cca43b] transition-all disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!presetName.trim() || !hasActiveFilter || isSaving}
              className="flex items-center gap-1.5 bg-[#cca43b] hover:bg-amber-600 text-zinc-950 font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </form>
          {!hasActiveFilter && (
            <p className="text-zinc-600 text-[10px]">Apply at least one filter before saving a preset.</p>
          )}

          {/* Presets list */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-zinc-500 py-2">
              <Loader2 size={12} className="animate-spin" />
              <span>Loading presets…</span>
            </div>
          ) : presets.length === 0 ? (
            <p className="text-zinc-600 text-[10px] py-1">No presets saved yet.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between gap-2 bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-1.5 group hover:border-zinc-700 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleLoad(preset)}
                    className="flex-1 text-left text-zinc-300 hover:text-zinc-100 font-semibold truncate cursor-pointer"
                    title="Click to apply this preset"
                  >
                    {preset.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePreset(preset.id)}
                    disabled={isDeleting}
                    className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    title="Delete preset"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
