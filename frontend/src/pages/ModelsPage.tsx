import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { modelApi } from '../services/api';
import type { ModelInfo, ModelConfig } from '../types';

interface ProviderConfigForm {
  apiKey: string;
  apiUrl: string;
  modelName: string;
}

export default function ModelsPage() {
  const { t } = useTranslation();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [configs, setConfigs] = useState<Record<string, ModelConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testModel, setTestModel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [testMessage, setTestMessage] = useState('Hello!');
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [providerForms, setProviderForms] = useState<Record<string, ProviderConfigForm>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const providerConfig: Record<string, { defaultApiUrl: string; defaultModel: string }> = {
    deepseek: {
      defaultApiUrl: 'https://api.deepseek.com/v1/chat/completions',
      defaultModel: 'deepseek-chat',
    },
    openai: {
      defaultApiUrl: 'https://api.openai.com/v1/chat/completions',
      defaultModel: 'gpt-3.5-turbo',
    },
    claude: {
      defaultApiUrl: 'https://api.anthropic.com/v1/messages',
      defaultModel: 'claude-3-sonnet-20240229',
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [modelsResp, configsResp] = await Promise.all([
        modelApi.getAll(),
        modelApi.getConfigs(),
      ]);
      setModels(modelsResp.data.models);
      const configsMap: Record<string, ModelConfig> = {};
      configsResp.data.configs.forEach((c) => {
        configsMap[c.provider] = c;
      });
      setConfigs(configsMap);

      const formsMap: Record<string, ProviderConfigForm> = {};
      configsResp.data.configs.forEach((c) => {
        formsMap[c.provider] = {
          apiKey: '',
          apiUrl: c.apiUrl || providerConfig[c.provider]?.defaultApiUrl || '',
          modelName: c.modelName || providerConfig[c.provider]?.defaultModel || '',
        };
      });
      setProviderForms(formsMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestModel = async (provider: string) => {
    setTestModel(provider);
    setTestResult('');
    
    try {
      const response = await modelApi.test(provider, testMessage);
      setTestResult(response.data.response);
      setNotification({ type: 'success', message: 'Model test successful!' });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Test failed';
      setTestResult(`Error: ${errorMsg}`);
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setTestModel(null);
    }
  };

  const handleStartEdit = (provider: string) => {
    setEditingProvider(provider);
    if (!providerForms[provider]) {
      setProviderForms({
        ...providerForms,
        [provider]: {
          apiKey: '',
          apiUrl: providerConfig[provider]?.defaultApiUrl || '',
          modelName: providerConfig[provider]?.defaultModel || '',
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingProvider(null);
  };

  const handleSaveConfig = async (provider: string) => {
    const form = providerForms[provider];
    if (!form?.apiKey.trim()) {
      setNotification({ type: 'error', message: 'API Key is required' });
      return;
    }

    setSavingProvider(provider);
    try {
      const response = await modelApi.saveConfig(provider, {
        apiKey: form.apiKey.trim(),
        apiUrl: form.apiUrl.trim() || undefined,
        modelName: form.modelName.trim() || undefined,
      });
      setConfigs({
        ...configs,
        [provider]: response.data.config,
      });
      setEditingProvider(null);
      setNotification({ type: 'success', message: 'Configuration saved successfully!' });
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save configuration';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setSavingProvider(null);
    }
  };

  const handleDeleteConfig = async (provider: string) => {
    if (!confirm('Are you sure you want to delete this model configuration?')) {
      return;
    }

    try {
      await modelApi.deleteConfig(provider);
      const newConfigs = { ...configs };
      delete newConfigs[provider];
      setConfigs(newConfigs);
      setNotification({ type: 'success', message: 'Configuration deleted successfully!' });
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete configuration';
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const handleFormChange = (provider: string, field: keyof ProviderConfigForm, value: string) => {
    setProviderForms({
      ...providerForms,
      [provider]: {
        ...providerForms[provider],
        [field]: value,
      },
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'deepseek':
        return '🔍';
      case 'openai':
        return '🟢';
      case 'claude':
        return '🟠';
      default:
        return '🤖';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  const providers = Array.from(new Set(models.map(m => m.provider)));

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {notification && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            <span>{notification.type === 'success' ? '✓' : '✗'}</span>
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {t('settings.modelManagement')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          管理和配置可用的AI模型
        </p>

        {providers.map(provider => {
          const providerModels = models.filter(m => m.provider === provider);
          const hasConfig = !!configs[provider];
          const isEditing = editingProvider === provider;

          return (
            <div key={provider} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getProviderIcon(provider)}</span>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white capitalize">
                    {t(`models.${provider}`) || provider}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    providerModels.some(m => m.available)
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {providerModels.some(m => m.available) ? t('settings.available') : t('settings.unavailable')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && hasConfig && (
                    <>
                      <button
                        onClick={() => handleStartEdit(provider)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(provider)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                      >
                        删除
                      </button>
                    </>
                  )}
                  {!isEditing && !hasConfig && (
                    <button
                      onClick={() => handleStartEdit(provider)}
                      className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      + 配置
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-3">
                    配置 {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API Key *
                      </label>
                      <input
                        type="password"
                        value={providerForms[provider]?.apiKey || ''}
                        onChange={(e) => handleFormChange(provider, 'apiKey', e.target.value)}
                        placeholder={hasConfig ? '留空以保持现有Key' : '输入API Key...'}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        API URL (可选)
                      </label>
                      <input
                        type="text"
                        value={providerForms[provider]?.apiUrl || ''}
                        onChange={(e) => handleFormChange(provider, 'apiUrl', e.target.value)}
                        placeholder={providerConfig[provider]?.defaultApiUrl}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        默认模型名称 (可选)
                      </label>
                      <input
                        type="text"
                        value={providerForms[provider]?.modelName || ''}
                        onChange={(e) => handleFormChange(provider, 'modelName', e.target.value)}
                        placeholder={providerConfig[provider]?.defaultModel}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSaveConfig(provider)}
                        disabled={savingProvider === provider}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                      >
                        {savingProvider === provider ? t('common.loading') : '保存配置'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingProvider === provider}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {providerModels.map(model => (
                  <div
                    key={model.name}
                    className={`p-4 bg-white dark:bg-gray-800 border rounded-xl transition ${
                      model.available
                        ? 'border-gray-200 dark:border-gray-700'
                        : 'border-gray-100 dark:border-gray-700/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          model.available ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">
                            {model.displayName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {model.name}
                          </p>
                        </div>
                      </div>

                      {model.available && (
                        <button
                          onClick={() => handleTestModel(model.provider)}
                          disabled={testModel === model.provider}
                          className="px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition disabled:opacity-50"
                        >
                          {testModel === model.provider ? t('common.loading') : '测试'}
                        </button>
                      )}
                    </div>

                    {testResult && testModel === null && model.available && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">测试结果: </span>
                          {testResult}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 测试输入 */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="font-medium text-gray-800 dark:text-white mb-3">
            模型测试
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="输入测试消息..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            点击上方模型的"测试"按钮，使用此消息测试该模型
          </p>
        </div>
      </div>
    </div>
  );
}
