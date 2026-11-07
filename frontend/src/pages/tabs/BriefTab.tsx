import React, { useState } from 'react';
import { Sparkles, FileText, Clock, RefreshCw } from 'lucide-react';
import { Account, Memory } from '../../types';
import { api } from '../../api/client';

interface BriefTabProps {
  account: Account;
  memoryOn: boolean;
  onMemoriesRecalled: (memories: Memory[]) => void;
}

export const BriefTab: React.FC<BriefTabProps> = ({
  account,
  memoryOn,
  onMemoriesRecalled,
}) => {
  const [brief, setBrief] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateBrief = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBrief(account.id, memoryOn);
      setBrief(res.output);
      setLatency(res.latency_ms);
      onMemoriesRecalled(res.recalled_memories);
    } catch (err) {
      console.error(err);
      alert('Failed to generate pre-call brief');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Pre-Call Deal Intelligence Brief</h3>
            <p className="text-xs text-slate-400">
              Aggregates executive history, open objections, competitor quotes, and next talking points.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateBrief}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Brief...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Brief</span>
            </>
          )}
        </button>
      </div>

      {/* Output Display */}
      {brief ? (
        <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-xl animate-fade-in">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Grounded Pre-Call Brief ({memoryOn ? 'Memory ON' : 'Memory OFF'})
            </span>
            {latency && (
              <span className="flex items-center space-x-1 font-mono text-[11px] text-purple-400">
                <Clock className="w-3 h-3" />
                <span>{latency}ms</span>
              </span>
            )}
          </div>
          <div className="p-6 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {brief}
          </div>
        </div>
      ) : (
        <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <FileText className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-300">No brief generated yet</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            Click &quot;Generate Brief&quot; to recall recent deal interactions from Hindsight and synthesize an actionable meeting dossier.
          </p>
        </div>
      )}
    </div>
  );
};
