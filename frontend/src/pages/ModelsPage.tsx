import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { modelApi } from '../services/api';
import type { ModelInfo } from '../types';

export default function ModelsPage() {
  const { t } = useTranslation();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testModel, setTestModel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [testMessage, setTestMessage] = useState('Hello!');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await modelApi.getAll();
      setModels(response.data.models);
    } catch (error) {
      console.error('Failed to load models:', error);
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
    } catch (error: any) {
      setTestResult(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setTestModel(null);
    }
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {t('settings.modelManagement')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          管理和配置可用的AI模型
        </p>

        {providers.map(provider => {
          const providerModels = models.filter(m => m.provider === provider);
          
          return (
            <div key={provider} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
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
