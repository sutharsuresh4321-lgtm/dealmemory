import React, { useState } from 'react';
import { X, Mic, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Account, ExtractedFacts } from '../../types';
import { api } from '../../api/client';

interface BandAISyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  selectedAccountId?: string;
  onSyncSuccess: (facts: ExtractedFacts) => void;
}

export const BandAISyncModal: React.FC<BandAISyncModalProps> = ({
  isOpen,
  onClose,
  accounts,
  selectedAccountId,
  onSyncSuccess,
}) => {
  const [accountId, setAccountId] = useState(selectedAccountId || accounts[0]?.id || '');
  const [transcript, setTranscript] = useState(
    "[Band AI Desktop Audio Transcript - 14:32]\n" +
    "Speaker 1 (AE): 'Thanks for meeting again Marcus. How is the budget discussion with finance going?'\n" +
    "Speaker 2 (Marcus Vance - CFO): 'We reviewed your initial quote. $140,000 ARR is still 18% above our cap. But if you can waive the implementation fee and deliver Phase 1 at $95k, I will sign the pilot MSA by Thursday.'"
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  if (!isOpen) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.logInteraction({
        account_id: accountId,
        type: 'meeting',
        raw_text: `[Imported from Band AI Desktop]\n${transcript}`,
      });
      setSynced(true);
      onSyncSuccess(res.extracted_facts);
      setTimeout(() => {
        setSynced(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to sync from Band AI');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Band AI Desktop Sync</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  LIVE CHANNEL
                </span>
              </h3>
              <p className="text-xs text-slate-400">Import call recordings & meeting audio from Band AI Desktop</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {synced ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-2 text-center animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-sm font-bold text-white">Band AI Audio Transcript Synced!</p>
            <p className="text-xs text-slate-400">
              Structured facts extracted and retained into Hindsight memory bank.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Deal Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.value.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Audio Transcript from Band AI Desktop
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={6}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <span>Listening on Band AI agent hook</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-emerald-400 font-mono">127.0.0.1:8000</span>
              </span>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSync}
                  disabled={isSyncing || !transcript.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing to Hindsight...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Sync Band AI Audio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
