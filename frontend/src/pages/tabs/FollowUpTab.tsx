import React, { useState } from 'react';
import { Mail, Sparkles, Send, Clock, Copy, Check } from 'lucide-react';
import { Account, Memory } from '../../types';
import { api } from '../../api/client';

interface FollowUpTabProps {
  account: Account;
  memoryOn: boolean;
  onMemoriesRecalled: (memories: Memory[]) => void;
}

export const FollowUpTab: React.FC<FollowUpTabProps> = ({
  account,
  memoryOn,
  onMemoriesRecalled,
}) => {
  const [context, setContext] = useState('');
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateFollowUp = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFollowUp(account.id, context, memoryOn);
      setEmailDraft(res.output);
      setLatency(res.latency_ms);
      onMemoriesRecalled(res.recalled_memories);
    } catch (err) {
      console.error(err);
      alert('Failed to generate follow-up email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (emailDraft) {
      navigator.clipboard.writeText(emailDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Context Input */}
      <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center space-x-2.5">
          <Mail className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Follow-up Email Drafter</h3>
        </div>
        <p className="text-xs text-slate-400">
          Drafts highly personalized follow-ups referencing specific promises, attachments, CFO budget thresholds, or competitor contrasts.
        </p>

        <div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional context: e.g. 'Emphasize our 48hr onboarding compared to FleetTrack and attach the promised pricing sheet for CFO Marcus'..."
            rows={2}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerateFollowUp}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Drafting Email...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Draft Follow-up Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Email Output */}
      {emailDraft ? (
        <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden shadow-xl animate-fade-in">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Personalized Draft ({memoryOn ? 'Memory ON' : 'Memory OFF'})
            </span>
            <div className="flex items-center space-x-3">
              {latency && (
                <span className="flex items-center space-x-1 font-mono text-[11px] text-purple-400">
                  <Clock className="w-3 h-3" />
                  <span>{latency}ms</span>
                </span>
              )}
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
          <div className="p-6 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
            {emailDraft}
          </div>
        </div>
      ) : (
        <div className="h-56 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <Mail className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-300">No follow-up drafted yet</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Click &quot;Draft Follow-up Email&quot; to synthesize an email incorporating recalled deal memories.
          </p>
        </div>
      )}
    </div>
  );
};
