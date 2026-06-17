import type { ModelProvider } from '../../config';
import type { ModelAdapter } from './base';
import { deepseekAdapter } from './deepseekAdapter';
import { openaiAdapter } from './openaiAdapter';
import { claudeAdapter } from './claudeAdapter';

export * from './base';

const adapters = new Map<ModelProvider, ModelAdapter>();

adapters.set('deepseek', deepseekAdapter);
adapters.set('openai', openaiAdapter);
adapters.set('claude', claudeAdapter);

export function getAdapter(provider: ModelProvider): ModelAdapter | undefined {
  return adapters.get(provider);
}

export function registerAdapter(provider: ModelProvider, adapter: ModelAdapter): void {
  adapters.set(provider, adapter);
}

export function getAllAdapters(): IterableIterator<ModelAdapter> {
  return adapters.values();
}
