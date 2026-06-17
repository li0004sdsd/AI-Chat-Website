import type { ModelAdapter, ChatMessage, ChatResponse, ResolvedModelConfig } from './base';

class OpenAIAdapter implements ModelAdapter {
  readonly provider = 'openai' as const;

  async sendMessage(
    messages: ChatMessage[],
    config: ResolvedModelConfig
  ): Promise<ChatResponse> {
    const { apiKey, apiUrl, model } = config;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model || model,
      provider: 'openai',
    };
  }
}

export const openaiAdapter = new OpenAIAdapter();
