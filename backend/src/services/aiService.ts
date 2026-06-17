import { config, ModelProvider } from '../config';
import { getModelConfigByProvider } from '../models/modelConfig';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: ModelProvider;
}

export interface ModelInfo {
  provider: ModelProvider;
  name: string;
  displayName: string;
  available: boolean;
}

interface ResolvedModelConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

async function resolveModelConfig(
  provider: ModelProvider,
  userId?: string,
  overrideModel?: string
): Promise<ResolvedModelConfig> {
  const defaultConfig = config.models[provider];
  let apiKey = defaultConfig.apiKey;
  let apiUrl = defaultConfig.apiUrl;
  let model = overrideModel || defaultConfig.model;

  if (userId) {
    const userConfig = getModelConfigByProvider(userId, provider);
    if (userConfig) {
      if (userConfig.api_key) apiKey = userConfig.api_key;
      if (userConfig.api_url) apiUrl = userConfig.api_url;
      if (userConfig.model_name) model = userConfig.model_name;
    }
  }

  if (overrideModel) {
    model = overrideModel;
  }

  return { apiKey, apiUrl, model };
}

export async function chatWithModel(
  provider: ModelProvider,
  messages: ChatMessage[],
  modelName?: string,
  userId?: string
): Promise<ChatResponse> {
  const resolved = await resolveModelConfig(provider, userId, modelName);

  if (!resolved.apiKey) {
    throw new Error(`API key for ${provider} is not configured`);
  }

  switch (provider) {
    case 'deepseek':
      return chatWithDeepSeek(messages, resolved);
    case 'openai':
      return chatWithOpenAI(messages, resolved);
    case 'claude':
      return chatWithClaude(messages, resolved);
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}

async function chatWithDeepSeek(
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
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as any;
  
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model || model,
    provider: 'deepseek',
  };
}

async function chatWithOpenAI(
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

async function chatWithClaude(
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

export async function getAvailableModels(userId?: string): Promise<ModelInfo[]> {
  const providers: ModelProvider[] = ['deepseek', 'openai', 'claude'];
  const availability: Record<ModelProvider, boolean> = {
    deepseek: !!config.models.deepseek.apiKey,
    openai: !!config.models.openai.apiKey,
    claude: !!config.models.claude.apiKey,
  };

  if (userId) {
    for (const provider of providers) {
      const userConfig = getModelConfigByProvider(userId, provider);
      if (userConfig && userConfig.api_key) {
        availability[provider] = true;
      }
    }
  }

  const models: ModelInfo[] = [
    {
      provider: 'deepseek',
      name: 'deepseek-chat',
      displayName: 'DeepSeek Chat',
      available: availability.deepseek,
    },
    {
      provider: 'openai',
      name: 'gpt-3.5-turbo',
      displayName: 'GPT-3.5 Turbo',
      available: availability.openai,
    },
    {
      provider: 'openai',
      name: 'gpt-4',
      displayName: 'GPT-4',
      available: availability.openai,
    },
    {
      provider: 'claude',
      name: 'claude-3-sonnet-20240229',
      displayName: 'Claude 3 Sonnet',
      available: availability.claude,
    },
    {
      provider: 'claude',
      name: 'claude-3-opus-20240229',
      displayName: 'Claude 3 Opus',
      available: availability.claude,
    },
  ];

  return models;
}
