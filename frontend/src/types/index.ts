export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

export interface UserSettings {
  id?: string;
  user_id?: string;
  language: string;
  theme: string;
  default_model: string;
  created_at?: string;
  updated_at?: string;
}

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

export interface Persona {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  avatar: string;
  description: string;
  descriptionEn: string;
  systemPrompt: string;
  systemPromptEn: string;
}

export interface ModelInfo {
  provider: string;
  name: string;
  displayName: string;
  available: boolean;
}

export interface ModelConfig {
  id?: string;
  provider: string;
  hasApiKey: boolean;
  apiUrl: string | null;
  modelName: string | null;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}
