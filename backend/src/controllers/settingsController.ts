import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getUserSettings, updateUserSettings } from '../models/userSettings';

export async function getSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const settings = getUserSettings(userId);

    if (!settings) {
      const defaultSettings = {
        language: 'zh',
        theme: 'light',
        default_model: 'deepseek',
      };
      res.json({ settings: defaultSettings });
      return;
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    const { language, theme, default_model } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const settings = updateUserSettings(userId, {
      language,
      theme,
      default_model,
    });

    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
