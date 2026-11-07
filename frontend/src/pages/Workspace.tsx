import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { AccountSidebar } from '../components/AccountSidebar';
import { MemoryPanel } from '../components/MemoryPanel';
import { CompareModal } from '../components/CompareModal';
import { BriefTab } from './tabs/BriefTab';
import { FollowUpTab } from './tabs/FollowUpTab';
import { CoachTab } from './tabs/CoachTab';
import { ChatTab } from './tabs/ChatTab';
import { TimelineTab } from './tabs/TimelineTab';
import { LogInteractionModal } from './tabs/LogInteractionModal';
import { CreateAccountModal } from './tabs/CreateAccountModal';
import { BandAISyncModal } from './tabs/BandAISyncModal';
import { Account, AccountDetail, CompareResult, ExtractedFacts, Memory } from '../types';
import { api } from '../api/client';
import { FileText, Mail, Target, MessageSquare, History, Users, Building, DollarSign } from 'lucide-react';

export const Workspace: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [currentAccount, setCurrentAccount] = useState<AccountDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'followup' | 'coach' | 'chat' | 'timeline'>('brief');

  // Memory & comparison states
  const [memoryOn, setMemoryOn] = useState<boolean>(true);
  const [panelMemories, setPanelMemories] = useState<Memory[]>([]);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [compareData, setCompareData] = useState<CompareResult | null>(null);
  const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState<boolean>(false);
  const [isBandAISyncOpen, setIsBandAISyncOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Fetch accounts on load
  const loadAccounts = async () => {
    try {
      const data = await api.getAccounts();
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Fetch account detail & memory when selected account changes
  const loadAccountDetail = async (id: string) => {
    if (!id) return;
    try {
      const detail = await api.getAccount(id);
      setCurrentAccount(detail);
      loadMemories(id);
    } catch (err) {
      console.error('Error fetching account detail:', err);
    }
  };

  const loadMemories = async (id: string) => {
    setIsMemoriesLoading(true);
    try {
      const memRes = await api.getAccountMemories(id);
      setPanelMemories(memRes.memories);
    } catch (err) {
      console.error('Error loading account memories:', err);
    } finally {
      setIsMemoriesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      loadAccountDetail(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Handle open comparison modal
  const handleOpenCompare = async () => {
    if (!selectedAccountId) return;
    setIsCompareOpen(true);
    setIsCompareLoading(true);
    try {
      const res = await api.compare(selectedAccountId, activeTab);
      setCompareData(res);
    } catch (err) {
      console.error('Compare failed:', err);
    } finally {
      setIsCompareLoading(false);
    }
  };

  // Handle reset seed
  const handleReloadSeed = async () => {
    setIsSeeding(true);
    try {
      await api.resetSeed();
      await loadAccounts();
      if (selectedAccountId) {
        await loadAccountDetail(selectedAccountId);
      }
    } catch (err) {
      console.error('Seed reset error:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleMemoriesRecalled = (memories: Memory[]) => {
    if (memories && memories.length > 0) {
      setPanelMemories(memories);
    }
  };

  const handleLoggedSuccess = (_newFacts: ExtractedFacts) => {
    if (selectedAccountId) {
      loadAccountDetail(selectedAccountId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        memoryOn={memoryOn}
        onToggleMemory={() => setMemoryOn(!memoryOn)}
        onOpenCompare={handleOpenCompare}
        onReloadSeed={handleReloadSeed}
        onOpenBandAISync={() => setIsBandAISyncOpen(true)}
        isSeeding={isSeeding}
      />

      {/* Main Workspace 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Accounts Sidebar */}
        <AccountSidebar
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(id) => setSelectedAccountId(id)}
          onOpenLogModal={() => setIsLogModalOpen(true)}
          onOpenCreateAccount={() => setIsCreateAccountOpen(true)}
        />

        {/* Center: Main Tab Workspace */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col bg-slate-900/40">
          {currentAccount ? (
            <div className="max-w-4xl w-full mx-auto space-y-6">
              {/* Account Header Card */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-xl font-bold text-white tracking-tight">{currentAccount.name}</h1>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                      {currentAccount.stage}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center space-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{currentAccount.industry}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                      <strong className="text-slate-200">${currentAccount.value.toLocaleString()} ARR</strong>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{currentAccount.contacts?.length || 0} Key Stakeholders</span>
                    </span>
                  </div>
                </div>

                {/* Quick Contacts avatars / pills */}
                <div className="flex flex-col items-end space-y-1">
                  {currentAccount.contacts?.slice(0, 2).map((c) => (
                    <span key={c.id} className="text-[11px] text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60">
                      <strong>{c.name}</strong> • {c.role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-slate-800 flex space-x-1">
                <button
                  onClick={() => setActiveTab('brief')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'brief'
                      ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pre-Call Brief</span>
                </button>

                <button
                  onClick={() => setActiveTab('followup')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'followup'
                      ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Follow-up Drafter</span>
                </button>

                <button
                  onClick={() => setActiveTab('coach')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'coach'
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Objection Coach</span>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'chat'
                      ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Account Copilot</span>
                </button>

                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'timeline'
                      ? 'border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Interaction Timeline</span>
                </button>
              </div>

              {/* Active Tab Component */}
              <div className="pt-2">
                {activeTab === 'brief' && (
                  <BriefTab
                    account={currentAccount}
                    memoryOn={memoryOn}
                    onMemoriesRecalled={handleMemoriesRecalled}
                  />
                )}
                {activeTab === 'followup' && (
                  <FollowUpTab
                    account={currentAccount}
                    memoryOn={memoryOn}
                    onMemoriesRecalled={handleMemoriesRecalled}
                  />
                )}
                {activeTab === 'coach' && (
                  <CoachTab
                    account={currentAccount}
                    memoryOn={memoryOn}
                    onMemoriesRecalled={handleMemoriesRecalled}
                  />
                )}
                {activeTab === 'chat' && (
                  <ChatTab
                    account={currentAccount}
                    memoryOn={memoryOn}
                    onMemoriesRecalled={handleMemoriesRecalled}
                  />
                )}
                {activeTab === 'timeline' && (
                  <TimelineTab
                    account={currentAccount}
                    onRefresh={() => loadAccountDetail(selectedAccountId)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Select an account from the sidebar to inspect deal memory.
            </div>
          )}
        </main>

        {/* Right: Hindsight Memory Panel */}
        <MemoryPanel
          memories={panelMemories}
          isLoading={isMemoriesLoading}
          accountName={currentAccount?.name}
        />
      </div>

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareData={compareData}
        isLoading={isCompareLoading}
      />

      {/* Log Interaction Modal */}
      <LogInteractionModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onLoggedSuccess={handleLoggedSuccess}
      />

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onAccountCreated={(newAcc) => {
          setAccounts((prev) => [newAcc, ...prev]);
          setSelectedAccountId(newAcc.id);
        }}
      />

      {/* Band AI Sync Modal */}
      <BandAISyncModal
        isOpen={isBandAISyncOpen}
        onClose={() => setIsBandAISyncOpen(false)}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSyncSuccess={handleLoggedSuccess}
      />
    </div>
  );
};
