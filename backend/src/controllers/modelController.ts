import { Request, Response } from 'express';
import { getAvailableModels, chatWithModel, ChatMessage } from '../services/aiService';
import { ModelProvider } from '../config';

export function getModels(req: Request, res: Response): void {
  try {
    const models = getAvailableModels();
    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function testModel(req: Request, res: Response): Promise<void> {
  try {
    const { provider, message } = req.body;

    if (!provider) {
      res.status(400).json({ error: 'Model provider is required' });
      return;
    }

    const testMessage: ChatMessage[] = [
      { role: 'user', content: message || 'Hello! Please respond with a short greeting.' },
    ];

    const response = await chatWithModel(provider as ModelProvider, testMessage);

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
