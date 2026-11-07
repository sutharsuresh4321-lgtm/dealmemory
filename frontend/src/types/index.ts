export interface Contact {
  id: string;
  name: string;
  role: string;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  stage: string;
  value: number;
  created_at?: string;
  contacts: Contact[];
  interaction_count?: number;
}

export interface Interaction {
  id: string;
  account_id: string;
  type: 'call' | 'email' | 'note' | 'meeting';
  date: string;
  raw_text: string;
  extracted_json?: string;
  retained: boolean;
  created_at?: string;
}

export interface Outcome {
  id: string;
  account_id: string;
  result: 'won' | 'lost';
  reason: string;
  tactics?: string;
  date: string;
}

export interface AccountDetail extends Account {
  interactions: Interaction[];
  outcomes: Outcome[];
}

export interface Memory {
  id: string;
  text: string;
  source: string;
  type?: string;
  account_id?: string;
  date?: string;
  relevance: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  output: string;
  recalled_memories: Memory[];
  memory_on: boolean;
  latency_ms: number;
  account_id?: string;
  kind: string;
}

export interface CompareResult {
  account_id: string;
  account_name: string;
  kind: string;
  memory_off: {
    output: string;
    recalled_memories: Memory[];
    latency_ms: number;
  };
  memory_on: {
    output: string;
    recalled_memories: Memory[];
    latency_ms: number;
  };
}

export interface ExtractedFacts {
  objections: string[];
  competitors: string[];
  stakeholders: string[];
  commitments: string[];
  pricing: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}
