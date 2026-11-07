import React from 'react';
import { Building2, DollarSign, ChevronRight, PlusCircle } from 'lucide-react';
import { Account } from '../types';

interface AccountSidebarProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  onOpenLogModal: () => void;
  onOpenCreateAccount: () => void;
}

export const AccountSidebar: React.FC<AccountSidebarProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onOpenLogModal,
  onOpenCreateAccount,
}) => {
  const getStageBadgeColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'closed won':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'closed lost':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'negotiation':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'proposal':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col h-[calc(100vh-4rem)]">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Active Deals</h2>
          <p className="text-xs text-slate-400">{accounts.length} enterprise accounts</p>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onOpenCreateAccount}
            title="Create New Account"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <button
            onClick={onOpenLogModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-600/25 transition-all"
          >
            <span>Log Note</span>
          </button>
        </div>
      </div>

      {/* Account List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {accounts.map((acc) => {
          const isSelected = acc.id === selectedAccountId;
          const isFlagship = acc.id === 'acc-apex-logistics';

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-900/20 ring-1 ring-purple-500/40'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className="font-semibold text-sm text-slate-100 line-clamp-1">{acc.name}</span>
                </div>
                {isFlagship && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Flagship
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs text-slate-400 line-clamp-1">{acc.industry}</div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getStageBadgeColor(acc.stage)}`}>
                  {acc.stage}
                </span>
                <span className="flex items-center text-slate-300 font-semibold">
                  <DollarSign className="w-3 h-3 text-slate-400 -mr-0.5" />
                  {acc.value.toLocaleString()}
                </span>
              </div>

              {/* Primary Contact Preview */}
              {acc.contacts && acc.contacts.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">{acc.contacts[0].name} ({acc.contacts[0].role})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
