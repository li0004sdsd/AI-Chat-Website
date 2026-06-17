import { getDb } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface UserSettings {
  id: string;
  user_id: string;
  language: string;
  theme: string;
  default_model: string;
  created_at: string;
  updated_at: string;
}

export function getUserSettings(userId: string): UserSettings | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM user_settings WHERE user_id = ?');
  const settings = stmt.get(userId) as UserSettings | undefined;
  return settings || null;
}

export function updateUserSettings(
  userId: string,
  data: { language?: string; theme?: string; default_model?: string }
): UserSettings {
  const db = getDb();
  let settings = getUserSettings(userId);

  if (!settings) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(
      'INSERT INTO user_settings (id, user_id, language, theme, default_model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      id,
      userId,
      data.language || 'zh',
      data.theme || 'light',
      data.default_model || 'deepseek',
      now,
      now
    );
    return getUserSettings(userId)!;
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (data.language !== undefined) {
    updates.push('language = ?');
    values.push(data.language);
  }
  if (data.theme !== undefined) {
    updates.push('theme = ?');
    values.push(data.theme);
  }
  if (data.default_model !== undefined) {
    updates.push('default_model = ?');
    values.push(data.default_model);
  }

  if (updates.length === 0) return settings;

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(userId);

  const stmt = db.prepare(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`);
  stmt.run(...values);

  return getUserSettings(userId)!;
}
