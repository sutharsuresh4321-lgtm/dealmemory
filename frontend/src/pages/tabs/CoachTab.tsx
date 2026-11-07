import React, { useState } from 'react';
import { Target, Sparkles, ShieldCheck, Clock, Quote } from 'lucide-react';
import { Account, Memory } from '../../types';
import { api } from '../../api/client';

interface CoachTabProps {
  account?: Account;
  memoryOn: boolean;
  onMemoriesRecalled: (memories: Memory[]) => void;
}

export const CoachTab: React.FC<CoachTabProps> = ({
  account,
  memoryOn,
  onMemoriesRecalled,
}) => {
  const [objectionText, setObjectionText] = useState(
    'CFO Marcus Vance claims our $140k ARR quote is 18% over their Q3 budget cap and will veto without 3x ROI proof.'
  );
  const [coachingResult, setCoachingResult] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetCoaching = async () => {
    if (!objectionText.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.getCoaching(objectionText, account?.id, memoryOn);
      setCoachingResult(res.output);
      setLatency(res.latency_ms);
      onMemoriesRecalled(res.recalled_memories);
    } catch (err) {
      console.error(err);
      alert('Failed to get objection coaching');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center space-x-2.5">
          <Target className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Cross-Deal Objection Coach</h3>
        </div>
        <p className="text-xs text-slate-400">
          Synthesizes insights across all past won/lost deals to recommend battle-tested talk tracks with cited evidence.
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Prospect Objection or Pushback:
          </label>
          <textarea
            value={objectionText}
            onChange={(e) => setObjectionText(e.target.value)}
            rows={3}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Quick Objection Presets */}
        <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-400">
          <span className="text-slate-500">Presets:</span>
          <button
            onClick={() =>
              setObjectionText('CFO says $140,000 ARR exceeds budget by 18%; demands 3x ROI payback.')
            }
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            CFO Budget Cap
          </button>
          <button
            onClick={() =>
              setObjectionText('Competitor FleetTrack Pro is offering a 15% discount if we sign this week.')
            }
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Competitor Discount
          </button>
          <button
            onClick={() =>
              setObjectionText('CISO David Chen demands 140-point security questionnaire and SOC2 report before MSA.')
            }
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            CISO Security Audit
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleGetCoaching}
            disabled={isLoading || !objectionText.trim()}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Past Evidence...</span>
              </>
            ) : (
              <>
                <Quote className="w-3.5 h-3.5" />
                <span>Coach Me on This Objection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Display */}
      {coachingResult ? (
        <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-xl animate-fade-in">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Evidence-Based Coaching Recommendation ({memoryOn ? 'Memory ON' : 'Memory OFF'})</span>
            </span>
            {latency && (
              <span className="flex items-center space-x-1 font-mono text-[11px] text-amber-400">
                <Clock className="w-3 h-3" />
                <span>{latency}ms</span>
              </span>
            )}
          </div>
          <div className="p-6 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {coachingResult}
          </div>
        </div>
      ) : (
        <div className="h-56 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <Target className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-300">Ready to coach on any objection</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            DealMemory searches across closed won and lost deals to identify which handling techniques correlated with wins.
          </p>
        </div>
      )}
    </div>
  );
};
