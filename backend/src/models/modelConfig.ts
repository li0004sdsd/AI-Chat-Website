import { getDb } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface ModelConfig {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  api_url: string | null;
  model_name: string | null;
  created_at: string;
  updated_at: string;
}

export function getModelConfigsByUser(userId: string): ModelConfig[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM model_configs WHERE user_id = ?');
  return stmt.all(userId) as ModelConfig[];
}

export function getModelConfigByProvider(userId: string, provider: string): ModelConfig | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM model_configs WHERE user_id = ? AND provider = ?');
  const config = stmt.get(userId, provider) as ModelConfig | undefined;
  return config || null;
}

export function upsertModelConfig(
  userId: string,
  provider: string,
  apiKey: string,
  apiUrl?: string,
  modelName?: string
): ModelConfig {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = getModelConfigByProvider(userId, provider);

  if (existing) {
    const stmt = db.prepare(
      'UPDATE model_configs SET api_key = ?, api_url = ?, model_name = ?, updated_at = ? WHERE id = ?'
    );
    stmt.run(apiKey, apiUrl || null, modelName || null, now, existing.id);
    return getModelConfigByProvider(userId, provider)!;
  } else {
    const id = uuidv4();
    const stmt = db.prepare(
      'INSERT INTO model_configs (id, user_id, provider, api_key, api_url, model_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, userId, provider, apiKey, apiUrl || null, modelName || null, now, now);
    return getModelConfigByProvider(userId, provider)!;
  }
}

export function deleteModelConfig(userId: string, provider: string): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM model_configs WHERE user_id = ? AND provider = ?');
  const result = stmt.run(userId, provider);
  return result.changes > 0;
}
