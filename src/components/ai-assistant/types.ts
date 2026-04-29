export interface Message {
  sender: 'user' | 'assistant';
  message: string;
  created_at?: string;
  canContinue?: boolean;
}
