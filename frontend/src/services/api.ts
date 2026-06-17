import axios from 'axios';
import type { User, UserSettings, Conversation, Message, Persona, ModelInfo } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getToken(): string | null {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    } catch (e) {
      console.error('Failed to parse auth storage:', e);
    }
  }
  return null;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  register: (username: string, email: string, password: string) =>
    api.post<{ token: string; user: User; message: string }>('/users/register', {
      username,
      email,
      password,
    }),

  login: (username: string, password: string) =>
    api.post<{ token: string; user: User; message: string }>('/users/login', {
      username,
      password,
    }),

  getCurrentUser: () =>
    api.get<{ user: User }>('/users/me'),

  updateProfile: (data: { username?: string; email?: string; avatar?: string }) =>
    api.put<{ user: User; message: string }>('/users/profile', data),
};

export const conversationApi = {
  create: (data: { title?: string; personaId?: string; modelProvider?: string; modelName?: string }) =>
    api.post<{ conversation: Conversation; message: string }>('/conversations', data),

  getAll: () =>
    api.get<{ conversations: Conversation[] }>('/conversations'),

  getById: (id: string) =>
    api.get<{ conversation: Conversation; messages: Message[] }>(`/conversations/${id}`),

  update: (id: string, data: { title?: string; model_provider?: string; model_name?: string }) =>
    api.put<{ conversation: Conversation; message: string }>(`/conversations/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/conversations/${id}`),

  sendMessage: (id: string, content: string) =>
    api.post<{ message: Message; model: string; provider: string }>(
      `/conversations/${id}/messages`,
      { content }
    ),
};

export const settingsApi = {
  get: () =>
    api.get<{ settings: UserSettings }>('/settings'),

  update: (data: { language?: string; theme?: string; default_model?: string }) =>
    api.put<{ settings: UserSettings; message: string }>('/settings', data),
};

export const modelApi = {
  getAll: () =>
    api.get<{ models: ModelInfo[] }>('/models'),

  test: (provider: string, message?: string) =>
    api.post<{ success: boolean; response: string; model: string; provider: string }>(
      '/models/test',
      { provider, message }
    ),
};

export const personaApi = {
  getAll: () =>
    api.get<{ personas: Persona[]; total: number }>('/personas'),

  getById: (id: string) =>
    api.get<{ persona: Persona }>(`/personas/${id}`),

  getCategories: () =>
    api.get<{ categories: string[] }>('/personas/categories'),

  getByCategory: (category: string) =>
    api.get<{ personas: Persona[]; total: number }>(`/personas/category/${category}`),
};

export default api;
