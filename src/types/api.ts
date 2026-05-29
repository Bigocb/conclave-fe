/**
 * Conclave API Shared Types
 * Mirrored from backend src/schemas/index.ts
 */

export interface ResponseMeta {
  request_id: string;
  timestamp: string;
  rate_limit_remaining?: number;
}

export interface ConclaveResponse<T> {
  status: 'success' | 'error';
  data: T;
  meta: ResponseMeta;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export type AgentType = 'llm' | 'slim' | 'code' | 'pipeline';
export type AgentProvider = 'openai' | 'openrouter' | 'ollama' | 'ollama_cloud' | 'anthropic' | 'together' | 'fireworks' | 'groq' | 'vllm' | 'litellm' | 'custom' | 'opencode';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  model?: string;
  provider?: AgentProvider;
  llm_url?: string;
  instructions?: string;
  skills?: string[];
  principal_id: string;
  org_id: string;
  status: 'active' | 'decommissioned';
  token?: string;
  created_at: string;
}

export interface Principal {
  id: string;
  name: string;
  org_id: string;
  roles: string[];
  capabilities?: string[];
  budget: number;
  reputation: number;
}

export interface Task {
  id: string;
  task_description: string;
  output: string;
  dimensions: string[];
  channel: string;
  status: 'open' | 'in_review' | 'completed' | 'cancelled' | 'expired' | 'archived' | 'dismissed';
  priority: 'normal' | 'priority';
  agent_id: string;
  metadata: {
    concern?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface Review {
  id: string;
  task_id: string;
  agent_id: string;
  scores: Record<string, number>;
  weighted_overall: number;
  comment: string;
  suggestions?: string[];
  approved: boolean;
  created_at: string;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
  description?: string;
  policies: {
    min_reviews_required: number;
    channels?: string[];
    allowed_models?: string[];
  };
}
