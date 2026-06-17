import type { ModelAdapter, ChatMessage, ChatResponse, ResolvedModelConfig } from './base';

class ClaudeAdapter implements ModelAdapter {
  readonly provider = 'claude' as const;

  async sendMessage(
    messages: ChatMessage[],
    config: ResolvedModelConfig
  ): Promise<ChatResponse> {
    const { apiKey, apiUrl, model } = config;

    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const body: any = {
      model,
      messages: conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 4096,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    
    return {
      content: data.content?.[0]?.text || '',
      model: data.model || model,
      provider: 'claude',
    };
  }
}

export const claudeAdapter = new ClaudeAdapter();
