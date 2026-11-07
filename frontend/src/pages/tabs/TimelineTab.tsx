import React, { useState } from 'react';
import { Calendar, PhoneCall, Mail, FileText, CheckCircle, Trophy, XCircle, Plus } from 'lucide-react';
import { AccountDetail } from '../../types';
import { api } from '../../api/client';

interface TimelineTabProps {
  account: AccountDetail;
  onRefresh: () => void;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ account, onRefresh }) => {
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcomeResult, setOutcomeResult] = useState<'won' | 'lost'>('won');
  const [reason, setReason] = useState('');
  const [tactics, setTactics] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reflectionAlert, setReflectionAlert] = useState<string | null>(null);

  const handleLogOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await api.logOutcome({
        account_id: account.id,
        result: outcomeResult,
        reason,
        tactics,
      });

      if (res.reflection_insight) {
        setReflectionAlert(res.reflection_insight);
      }
      setShowOutcomeModal(false);
      setReason('');
      setTactics('');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to log outcome');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call':
        return <PhoneCall className="w-4 h-4 text-purple-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-white">Deal Chronology & Interaction Memory</h3>
          <p className="text-xs text-slate-400">
            {account.interactions?.length || 0} interactions retained into Hindsight memory bank.
          </p>
        </div>

        <button
          onClick={() => setShowOutcomeModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Log Win / Loss Outcome</span>
        </button>
      </div>

      {/* Reflection Alert if recently triggered */}
      {reflectionAlert && (
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/50 text-xs text-purple-200 animate-fade-in space-y-1">
          <div className="font-bold text-purple-300 flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Hindsight Reflection Synthesized Cross-Deal Learnings:</span>
          </div>
          <p className="leading-relaxed font-mono whitespace-pre-wrap">{reflectionAlert}</p>
        </div>
      )}

      {/* Outcomes Display */}
      {account.outcomes && account.outcomes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Closed Deal Outcomes</h4>
          {account.outcomes.map((out) => (
            <div
              key={out.id}
              className={`p-4 rounded-xl border ${
                out.result === 'won'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center space-x-2 uppercase tracking-wider">
                  {out.result === 'won' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Deal Closed {out.result.toUpperCase()}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">{out.date.slice(0, 10)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-200"><strong>Reason:</strong> {out.reason}</p>
              {out.tactics && (
                <p className="mt-1 text-xs text-slate-300"><strong>Tactics:</strong> {out.tactics}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Timeline List */}
      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {account.interactions && account.interactions.length > 0 ? (
          account.interactions.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                {getIcon(item.type)}
              </div>

              {/* Card */}
              <div className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-200 uppercase text-[11px]">
                      {item.type}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                      {item.date ? item.date.slice(0, 10) : ''}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                    Retained in Memory
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {item.raw_text}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            No interactions recorded yet. Click &quot;Log Note&quot; in the sidebar to add a call or email.
          </div>
        )}
      </div>

      {/* Log Outcome Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">Log Deal Outcome & Trigger Hindsight Reflect</h3>
            <p className="text-xs text-slate-400 mb-4">
              Recording whether this deal was won or lost updates Hindsight&apos;s cross-deal reflection memory to coach future deals.
            </p>

            <form onSubmit={handleLogOutcome} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Result</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOutcomeResult('won')}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                      outcomeResult === 'won'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Closed Won
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcomeResult('lost')}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                      outcomeResult === 'lost'
                        ? 'bg-rose-600/30 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Closed Lost
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Customer loved our rapid 48h onboarding and phased ROI pricing sheet..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tactics Used</label>
                <textarea
                  value={tactics}
                  onChange={(e) => setTactics(e.target.value)}
                  placeholder="e.g. Offered Phase 1 introductory tier, provided SOC2 audit in under 24 hours..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30"
                >
                  {isSubmitting ? 'Retaining & Reflecting...' : 'Save & Trigger Reflect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
