import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, useAuthStore, useToastStore } from '../store';
import { modelApi } from '../services/api';
import type { ModelInfo } from '../types';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, isLoading } = useSettingsStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await modelApi.getAll();
      setModels(response.data.models.filter(m => m.available));
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      await updateSettings({ language: lang });
      showSaveSuccess();
    } catch (error) {
      console.error('Failed to update language:', error);
      addToast('error', t('settings.saveFailed'));
    }
  };

  const handleThemeChange = async (theme: string) => {
    try {
      await updateSettings({ theme });
      showSaveSuccess();
    } catch (error) {
      console.error('Failed to update theme:', error);
      addToast('error', t('settings.saveFailed'));
    }
  };

  const handleDefaultModelChange = async (model: string) => {
    try {
      await updateSettings({ default_model: model });
      showSaveSuccess();
    } catch (error) {
      console.error('Failed to update default model:', error);
      addToast('error', t('settings.saveFailed'));
    }
  };

  const showSaveSuccess = () => {
    setSaveMessage(t('settings.saveSuccess'));
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const currentTheme = settings?.theme || 'light';
  const currentLanguage = settings?.language || 'zh';
  const currentDefaultModel = settings?.default_model || 'deepseek';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {t('settings.title')}
        </h1>

        {saveMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm">
            {saveMessage}
          </div>
        )}

        {/* User Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {t('common.profile')}
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-white text-lg">
                {user?.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {t('settings.basicSettings')}
          </h2>

          {/* Language */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.language')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('zh')}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  currentLanguage === 'zh'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <p className="font-medium text-gray-800 dark:text-white">中文</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chinese</p>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  currentLanguage === 'en'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <p className="font-medium text-gray-800 dark:text-white">English</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">英语</p>
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.theme')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  currentTheme === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <p className="text-2xl mb-1">☀️</p>
                <p className="font-medium text-gray-800 dark:text-white">{t('settings.lightMode')}</p>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  currentTheme === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <p className="text-2xl mb-1">🌙</p>
                <p className="font-medium text-gray-800 dark:text-white">{t('settings.darkMode')}</p>
              </button>
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {t('settings.modelSettings')}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.defaultModel')}
            </label>
            <select
              value={currentDefaultModel}
              onChange={(e) => handleDefaultModelChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {models.map(model => (
                <option key={`${model.provider}-${model.name}`} value={model.provider}>
                  {model.displayName}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            新对话将默认使用此模型。你可以在对话中随时切换模型。
          </p>
        </div>
      </div>
    </div>
  );
}
