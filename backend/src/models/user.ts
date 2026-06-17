import { getDb } from './database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string | null;
  settings: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

export function createUser(username: string, email: string, password: string): User {
  const db = getDb();
  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  const stmt = db.prepare(
    'INSERT INTO users (id, username, email, password, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, username, email, hashedPassword, null, now, now);

  const settingsStmt = db.prepare(
    'INSERT INTO user_settings (id, user_id, language, theme, default_model) VALUES (?, ?, ?, ?, ?)'
  );
  settingsStmt.run(uuidv4(), id, 'zh', 'light', 'deepseek');

  return getUserById(id)!;
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id) as User | undefined;
  return user || null;
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username) as User | undefined;
  return user || null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email) as User | undefined;
  return user || null;
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password);
}

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    created_at: user.created_at,
  };
}

export function updateUserProfile(userId: string, data: { username?: string; email?: string; avatar?: string }): User | null {
  const db = getDb();
  const user = getUserById(userId);
  if (!user) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (data.username !== undefined) {
    updates.push('username = ?');
    values.push(data.username);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email);
  }
  if (data.avatar !== undefined) {
    updates.push('avatar = ?');
    values.push(data.avatar);
  }

  if (updates.length === 0) return user;

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(userId);

  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getUserById(userId);
}
