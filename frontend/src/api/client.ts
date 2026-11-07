import { Account, AccountDetail, AgentResponse, CompareResult, Memory } from '../types';

const API_BASE = '/api';

export const api = {
  async getAccounts(): Promise<Account[]> {
    const res = await fetch(`${API_BASE}/accounts`);
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  async createAccount(payload: {
    name: string;
    industry: string;
    stage: string;
    value: number;
    contact_name?: string;
    contact_role?: string;
  }): Promise<Account> {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create account');
    return res.json();
  },

  async getAccount(id: string): Promise<AccountDetail> {
    const res = await fetch(`${API_BASE}/accounts/${id}`);
    if (!res.ok) throw new Error('Failed to fetch account detail');
    return res.json();
  },

  async getAccountMemories(id: string): Promise<{ memories: Memory[]; total_memories: number }> {
    const res = await fetch(`${API_BASE}/memory/${id}`);
    if (!res.ok) throw new Error('Failed to fetch account memories');
    return res.json();
  },

  async logInteraction(payload: {
    account_id: string;
    type: string;
    raw_text: string;
    date?: string;
  }) {
    const res = await fetch(`${API_BASE}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to log interaction');
    return res.json();
  },

  async getBrief(accountId: string, memoryOn: boolean): Promise<AgentResponse> {
    const res = await fetch(`${API_BASE}/agent/brief`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, memory_on: memoryOn }),
    });
    if (!res.ok) throw new Error('Failed to generate brief');
    return res.json();
  },

  async getFollowUp(accountId: string, context: string, memoryOn: boolean): Promise<AgentResponse> {
    const res = await fetch(`${API_BASE}/agent/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, context, memory_on: memoryOn }),
    });
    if (!res.ok) throw new Error('Failed to draft follow-up');
    return res.json();
  },

  async getCoaching(objectionText: string, accountId?: string, memoryOn: boolean = true): Promise<AgentResponse> {
    const res = await fetch(`${API_BASE}/agent/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objection_text: objectionText, account_id: accountId, memory_on: memoryOn }),
    });
    if (!res.ok) throw new Error('Failed to get coaching');
    return res.json();
  },

  async sendChat(accountId: string, message: string, memoryOn: boolean): Promise<AgentResponse> {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, message, memory_on: memoryOn }),
    });
    if (!res.ok) throw new Error('Failed to send chat message');
    return res.json();
  },

  async compare(accountId: string, kind: string, inputText?: string): Promise<CompareResult> {
    const res = await fetch(`${API_BASE}/agent/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, kind, input_text: inputText }),
    });
    if (!res.ok) throw new Error('Failed to run comparison');
    return res.json();
  },

  async logOutcome(payload: {
    account_id: string;
    result: string;
    reason: string;
    tactics?: string;
  }) {
    const res = await fetch(`${API_BASE}/outcomes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to log outcome');
    return res.json();
  },

  async resetSeed() {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reload seed data');
    return res.json();
  }
};
