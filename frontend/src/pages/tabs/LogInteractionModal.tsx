import React, { useState } from 'react';
import { X, Send, Sparkles, Database, CheckCircle2 } from 'lucide-react';
import { Account, ExtractedFacts } from '../../types';
import { api } from '../../api/client';

interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  selectedAccountId?: string;
  onLoggedSuccess: (newFacts: ExtractedFacts) => void;
}

export const LogInteractionModal: React.FC<LogInteractionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  selectedAccountId,
  onLoggedSuccess,
}) => {
  const [accountId, setAccountId] = useState(selectedAccountId || accounts[0]?.id || '');
  const [type, setType] = useState('call');
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedFacts | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.logInteraction({
        account_id: accountId || accounts[0]?.id,
        type,
        raw_text: rawText,
      });

      setExtractedResult(response.extracted_facts);
      onLoggedSuccess(response.extracted_facts);
    } catch (err) {
      console.error(err);
      alert('Failed to log interaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setExtractedResult(null);
    setRawText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Deal Interaction & Retain Memory</h3>
              <p className="text-xs text-slate-400">LLM structured fact extraction + Hindsight memory retention</p>
            </div>
          </div>
          <button
            onClick={handleDone}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form / Extraction Result */}
        <div className="p-6 overflow-y-auto">
          {!extractedResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (${acc.value.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Interaction Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="call">Sales Call / Zoom</option>
                    <option value="email">Email Correspondence</option>
                    <option value="note">Internal Account Note</option>
                    <option value="meeting">Onsite Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Raw Call Notes, Transcript, or Email Thread
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste meeting transcript, notes, competitor mentions, pricing pushback, or stakeholder quotes..."
                  rows={6}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !rawText.trim()}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Extracting Facts & Retaining...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Log & Retain Memory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Successfully extracted structured facts and retained into Hindsight memory bank!</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Extracted Deal Intelligence:
                </h4>

                {extractedResult.objections.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-rose-400">Objections Detected:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 mt-0.5">
                      {extractedResult.objections.map((o, idx) => (
                        <li key={idx}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {extractedResult.competitors.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-amber-400">Competitors Mentioned:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 mt-0.5">
                      {extractedResult.competitors.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {extractedResult.commitments.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400">Commitments Made:</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 mt-0.5">
                      {extractedResult.commitments.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {extractedResult.pricing.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-blue-400">Pricing / Budget Figures:</span>
                    <p className="text-xs text-slate-300">{extractedResult.pricing.join(', ')}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDone}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
