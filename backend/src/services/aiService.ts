import { config, ModelProvider } from '../config';
import { getModelConfigByProvider } from '../models/modelConfig';
import {
  getAdapter,
  ChatMessage,
  ChatResponse,
  ResolvedModelConfig,
} from './adapters';

export interface ModelInfo {
  provider: ModelProvider;
  name: string;
  displayName: string;
  available: boolean;
}

export type { ChatMessage, ChatResponse };

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
  const adapter = getAdapter(provider);
  if (!adapter) {
    throw new Error(`Unsupported model provider: ${provider}`);
  }

  const resolved = await resolveModelConfig(provider, userId, modelName);

  if (!resolved.apiKey) {
    throw new Error(`API key for ${provider} is not configured`);
  }

  return adapter.sendMessage(messages, resolved);
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
