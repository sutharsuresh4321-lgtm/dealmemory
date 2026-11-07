import React from 'react';
import { Database, Calendar, Tag, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { Memory } from '../types';

interface MemoryPanelProps {
  memories: Memory[];
  isLoading?: boolean;
  accountName?: string;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  memories,
  isLoading = false,
  accountName,
}) => {
  return (
    <aside className="w-96 border-l border-slate-800 bg-slate-900/80 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Memory Panel</h2>
            <p className="text-[11px] text-slate-400">
              {accountName ? `Recalled for ${accountName}` : 'Hindsight Persistent Store'}
            </p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 font-mono font-medium">
          {memories.length} facts
        </span>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Sparkles className="w-6 h-6 animate-spin text-purple-400" />
            <p className="text-xs">Recalling memories via TEMPR multi-vector search...</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <Database className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">No memories recalled for this view</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Enable Memory ON or run an agent prompt to retrieve grounded context.
            </p>
          </div>
        ) : (
          memories.map((mem, index) => {
            const isFact = mem.type === 'objection' || mem.type === 'competitor' || mem.type === 'commitment';
            return (
              <div
                key={mem.id || index}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 hover:border-purple-500/40 transition-all duration-200 animate-slide-in-right group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Meta Bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        mem.type === 'objection'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : mem.type === 'competitor'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : mem.type === 'commitment'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {mem.type || 'memory'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center text-slate-400">
                      <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                      {mem.date || 'Historical'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-purple-400 font-mono text-[10px]">
                    <span>Score:</span>
                    <strong>{Math.round((mem.relevance || 0.9) * 100)}%</strong>
                  </div>
                </div>

                {/* Memory Text */}
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {mem.text}
                </p>

                {/* Footer with Source & Tags */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center space-x-1 truncate max-w-[190px]">
                    <ShieldCheck className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{mem.source || 'Hindsight Bank'}</span>
                  </div>
                  <span className="font-mono text-slate-600 group-hover:text-purple-400 transition-colors">
                    #{mem.id.slice(0, 10)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Vectorize TEMPR Fusion Active</span>
        </span>
        <span className="text-[10px] text-slate-500">dealmemory-demo</span>
      </div>
    </aside>
  );
};
