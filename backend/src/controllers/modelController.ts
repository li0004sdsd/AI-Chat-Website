import { Request, Response } from 'express';
import { getAvailableModels, chatWithModel, ChatMessage } from '../services/aiService';
import { ModelProvider } from '../config';
import { AuthRequest } from '../middleware/auth';
import {
  getModelConfigsByUser,
  getModelConfigByProvider,
  upsertModelConfig,
  deleteModelConfig,
} from '../models/modelConfig';

export async function getModels(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const models = await getAvailableModels(userId);
    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function testModel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { provider, message } = req.body;
    const userId = req.userId;

    if (!provider) {
      res.status(400).json({ error: 'Model provider is required' });
      return;
    }

    const testMessage: ChatMessage[] = [
      { role: 'user', content: message || 'Hello! Please respond with a short greeting.' },
    ];

    const response = await chatWithModel(provider as ModelProvider, testMessage, undefined, userId);

    res.json({
      success: true,
      response: response.content,
      model: response.model,
      provider: response.provider,
    });
  } catch (error) {
    console.error('Test model error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to test model',
    });
  }
}

export function getModelConfigs(req: AuthRequest, res: Response): void {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const configs = getModelConfigsByUser(userId);
    const maskedConfigs = configs.map(c => ({
      id: c.id,
      provider: c.provider,
      hasApiKey: !!c.api_key,
      apiUrl: c.api_url,
      modelName: c.model_name,
      updatedAt: c.updated_at,
    }));

    res.json({ configs: maskedConfigs });
  } catch (error) {
    console.error('Get model configs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getModelConfig(req: AuthRequest, res: Response): void {
  try {
    const userId = req.userId;
    const { provider } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const config = getModelConfigByProvider(userId, provider);
    if (!config) {
      res.json({ config: null });
      return;
    }

    res.json({
      config: {
        id: config.id,
        provider: config.provider,
        hasApiKey: !!config.api_key,
        apiUrl: config.api_url,
        modelName: config.model_name,
      },
    });
  } catch (error) {
    console.error('Get model config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function saveModelConfig(req: AuthRequest, res: Response): void {
  try {
    const userId = req.userId;
    const { provider } = req.params;
    const { apiKey, apiUrl, modelName } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!apiKey || !apiKey.trim()) {
      res.status(400).json({ error: 'API key is required' });
      return;
    }

    const validProviders: ModelProvider[] = ['deepseek', 'openai', 'claude'];
    if (!validProviders.includes(provider as ModelProvider)) {
      res.status(400).json({ error: 'Invalid model provider' });
      return;
    }

    const saved = upsertModelConfig(userId, provider, apiKey.trim(), apiUrl, modelName);

    res.json({
      message: 'Model configuration saved successfully',
      config: {
        id: saved.id,
        provider: saved.provider,
        hasApiKey: !!saved.api_key,
        apiUrl: saved.api_url,
        modelName: saved.model_name,
      },
    });
  } catch (error) {
    console.error('Save model config error:', error);
    res.status(500).json({ error: 'Failed to save model configuration' });
  }
}

export function removeModelConfig(req: AuthRequest, res: Response): void {
  try {
    const userId = req.userId;
    const { provider } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const deleted = deleteModelConfig(userId, provider);
    if (!deleted) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }

    res.json({ message: 'Model configuration deleted successfully' });
  } catch (error) {
    console.error('Delete model config error:', error);
    res.status(500).json({ error: 'Failed to delete model configuration' });
  }
}
