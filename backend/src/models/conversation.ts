import { getDb } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  persona_id: string | null;
  model_provider: string;
  model_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function createConversation(
  userId: string,
  title: string,
  personaId?: string,
  modelProvider: string = 'deepseek',
  modelName?: string
): Conversation {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(
    'INSERT INTO conversations (id, user_id, title, persona_id, model_provider, model_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, userId, title, personaId || null, modelProvider, modelName || null, now, now);

  return getConversationById(id)!;
}

export function getConversationById(id: string): Conversation | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
  const conv = stmt.get(id) as Conversation | undefined;
  return conv || null;
}

export function getConversationsByUser(userId: string, limit: number = 50, offset: number = 0): Conversation[] {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
  );
  return stmt.all(userId, limit, offset) as Conversation[];
}

export function updateConversation(id: string, data: { title?: string; model_provider?: string; model_name?: string }): Conversation | null {
  const db = getDb();
  const conv = getConversationById(id);
  if (!conv) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.model_provider !== undefined) {
    updates.push('model_provider = ?');
    values.push(data.model_provider);
  }
  if (data.model_name !== undefined) {
    updates.push('model_name = ?');
    values.push(data.model_name);
  }

  if (updates.length === 0) return conv;

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getConversationById(id);
}

export function deleteConversation(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM conversations WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function addMessage(
  conversationId: string,
  role: 'system' | 'user' | 'assistant',
  content: string
): Message {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, conversationId, role, content, now);

  const updateStmt = db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?');
  updateStmt.run(now, conversationId);

  return getMessageById(id)!;
}

export function getMessageById(id: string): Message | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
  const msg = stmt.get(id) as Message | undefined;
  return msg || null;
}

export function getMessagesByConversation(conversationId: string, limit: number = 100): Message[] {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?'
  );
  return stmt.all(conversationId, limit) as Message[];
}
