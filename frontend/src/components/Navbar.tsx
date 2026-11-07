import React from 'react';
import { Brain, Sparkles, Database, RotateCcw, Mic } from 'lucide-react';

interface NavbarProps {
  memoryOn: boolean;
  onToggleMemory: () => void;
  onOpenCompare: () => void;
  onReloadSeed: () => void;
  onOpenBandAISync: () => void;
  isSeeding?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  memoryOn,
  onToggleMemory,
  onOpenCompare,
  onReloadSeed,
  onOpenBandAISync,
  isSeeding = false,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand Logo & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-white tracking-tight">DealMemory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
              Hindsight Layer
            </span>
          </div>
          <p className="text-xs text-slate-400">Deal Intelligence Agent with Persistent Memory</p>
        </div>
      </div>

      {/* Action Controls & Persistent Memory Toggle */}
      <div className="flex items-center space-x-4">
        {/* Seed Data Reset */}
        <button
          onClick={onReloadSeed}
          disabled={isSeeding}
          title="Reload Seed Data & Retain to Hindsight"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-purple-400' : ''}`} />
          <span>{isSeeding ? 'Seeding...' : 'Reset Seed'}</span>
        </button>

        {/* Band AI Desktop Sync Button */}
        <button
          onClick={onOpenBandAISync}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          <span>Band AI Sync</span>
        </button>

        {/* Compare Button */}
        <button
          onClick={onOpenCompare}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Compare ON vs OFF</span>
        </button>

        {/* Prominent Memory ON/OFF Toggle */}
        <div className="flex items-center space-x-3 bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl shadow-inner">
          <div className="flex items-center space-x-2">
            <Database className={`w-4 h-4 ${memoryOn ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className="text-xs font-medium text-slate-200">
              Memory: <strong className={memoryOn ? 'text-purple-400 font-bold' : 'text-slate-400 font-normal'}>{memoryOn ? 'ON' : 'OFF'}</strong>
            </span>
          </div>
          <button
            onClick={onToggleMemory}
            type="button"
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              memoryOn ? 'bg-purple-600 shadow-sm shadow-purple-500/50' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={memoryOn}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                memoryOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
