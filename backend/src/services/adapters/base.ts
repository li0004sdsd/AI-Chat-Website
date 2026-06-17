import type { ModelProvider } from '../../config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: ModelProvider;
}

export interface ResolvedModelConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

export interface ModelAdapter {
  readonly provider: ModelProvider;
  sendMessage(
    messages: ChatMessage[],
    config: ResolvedModelConfig
  ): Promise<ChatResponse>;
}
