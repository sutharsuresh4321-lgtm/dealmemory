import React from 'react';
import { X, Sparkles, Database, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { CompareResult } from '../types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  compareData: CompareResult | null;
  isLoading: boolean;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  compareData,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Side-by-Side Memory Comparison</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  {compareData?.kind.toUpperCase() || 'MODE'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Account: <strong className="text-slate-200">{compareData?.account_name}</strong> • Demonstrates stateless LLM vs. Hindsight persistent memory grounding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
              <Sparkles className="w-10 h-10 animate-spin text-purple-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">Executing Dual Generation Pipeline...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Querying stateless baseline LLM and Hindsight memory-augmented copilot concurrently.
                </p>
              </div>
            </div>
          ) : compareData ? (
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Left Column: Memory OFF */}
              <div className="flex flex-col border border-slate-800 rounded-xl bg-slate-950/60 p-5 shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <h4 className="text-sm font-bold text-white">Memory OFF (Stateless LLM)</h4>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{compareData.memory_off.latency_ms}ms</span>
                  </div>
                </div>

                <div className="mb-3 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>
                    No historical context. Generates generic, impersonal advice with zero knowledge of past calls, pricing, or objections.
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 text-xs leading-relaxed text-slate-300 font-mono whitespace-pre-wrap bg-slate-900/60 p-4 rounded-lg border border-slate-800/80">
                  {compareData.memory_off.output}
                </div>
              </div>

              {/* Right Column: Memory ON */}
              <div className="flex flex-col border border-purple-500/50 rounded-xl bg-purple-950/20 p-5 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-purple-800/40">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Memory ON (Hindsight Augmented)</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">
                        {compareData.memory_on.recalled_memories.length} facts recalled
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-purple-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{compareData.memory_on.latency_ms}ms</span>
                  </div>
                </div>

                <div className="mb-3 px-3 py-2 rounded-lg bg-purple-900/30 border border-purple-700/40 text-xs text-purple-200 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Grounded in persistent memory. Mentions exact stakeholders (CFO Marcus, CISO David), past objections, competitor terms, and specific promises.
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 text-xs leading-relaxed text-slate-100 font-mono whitespace-pre-wrap bg-slate-900/90 p-4 rounded-lg border border-purple-900/50">
                  {compareData.memory_on.output}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Powered by Vectorize Hindsight persistent agent memory layer.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
