import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserSettings } from '../types';
import { userApi, settingsApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateProfile: (data: { username?: string; email?: string; avatar?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await userApi.login(username, password);
          const { token, user } = response.data;
          set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await userApi.register(username, email, password);
          const { token, user } = response.data;
          set({ token, user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await userApi.getCurrentUser();
          set({ user: response.data.user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await userApi.updateProfile(data);
          set({ user: response.data.user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  setLanguage: (lang: string) => void;
  setTheme: (theme: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,

      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const response = await settingsApi.get();
          const settings = response.data.settings;
          set({ settings, isLoading: false });
          
          if (settings.theme) {
            get().setTheme(settings.theme);
          }
          if (settings.language) {
            get().setLanguage(settings.language);
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to fetch settings:', error);
        }
      },

      updateSettings: async (data) => {
        set({ isLoading: true });
        try {
          const response = await settingsApi.update(data);
          set({ settings: response.data.settings, isLoading: false });
          
          if (data.theme) {
            get().setTheme(data.theme);
          }
          if (data.language) {
            get().setLanguage(data.language);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setLanguage: (lang: string) => {
        document.documentElement.lang = lang;
      },

      setTheme: (theme: string) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
