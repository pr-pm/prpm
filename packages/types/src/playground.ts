/**
 * Playground types for PRPM+ testing environment
 */

export interface PlaygroundMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  tokens?: number;
}

export interface PlaygroundSession {
  id: string;
  user_id: string;
  org_id?: string;
  package_id: string;
  package_version?: string;
  package_name: string;
  conversation: PlaygroundMessage[];
  credits_spent: number;
  estimated_tokens: number;
  model: string;
  total_tokens: number;
  total_duration_ms: number;
  run_count: number;
  is_public: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
  last_run_at: string;
}

export interface PlaygroundRunRequest {
  package_id: string;
  package_version?: string;
  input: string;
  model?: 'sonnet' | 'opus' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
  session_id?: string;
}

export interface PlaygroundRunResponse {
  session_id: string;
  response: string;
  credits_spent: number;
  credits_remaining: number;
  tokens_used: number;
  model: string;
  estimated_cost: number;
  conversation: PlaygroundMessage[];
}

export interface CreditBalance {
  total: number;
  monthly: number;
  rollover: number;
  purchased: number;
  monthly_used: number;
  monthly_limit: number;
  rollover_expires_at?: string;
  monthly_reset_at?: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: 'signup' | 'monthly' | 'purchase' | 'spend' | 'rollover' | 'expire' | 'refund' | 'bonus' | 'admin';
  description: string;
  metadata?: Record<string, any>;
  session_id?: string;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}
