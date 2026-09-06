import type { RuntimeBridgeSettings, RuntimeMode } from './types';

const STORAGE_KEY = 'agent-graph-designer.runtime-bridge.v3';

export const defaultRuntimeBridgeSettings: RuntimeBridgeSettings = {
  baseUrl: 'http://127.0.0.1:8765',
  token: '',
  mode: 'mock',
  vllmBaseUrl: 'http://127.0.0.1:8000/v1',
  vllmModel: '',
};

const normalizeMode = (value: unknown): RuntimeMode =>
  value === 'openai' || value === 'vllm' || value === 'mock' ? value : 'mock';

export const loadRuntimeBridgeSettings = (): RuntimeBridgeSettings => {
  if (typeof window === 'undefined') return defaultRuntimeBridgeSettings;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRuntimeBridgeSettings;
    const value = JSON.parse(raw) as Partial<RuntimeBridgeSettings>;
    return {
      baseUrl:
        typeof value.baseUrl === 'string' && value.baseUrl.trim()
          ? value.baseUrl.trim()
          : defaultRuntimeBridgeSettings.baseUrl,
      token: typeof value.token === 'string' ? value.token : '',
      mode: normalizeMode(value.mode),
      vllmBaseUrl:
        typeof value.vllmBaseUrl === 'string' && value.vllmBaseUrl.trim()
          ? value.vllmBaseUrl.trim()
          : defaultRuntimeBridgeSettings.vllmBaseUrl,
      vllmModel: typeof value.vllmModel === 'string' ? value.vllmModel.trim() : '',
    };
  } catch (error) {
    console.warn('Runtime Bridge settings could not be loaded.', error);
    return defaultRuntimeBridgeSettings;
  }
};

export const saveRuntimeBridgeSettings = (settings: RuntimeBridgeSettings) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Runtime Bridge settings could not be saved.', error);
  }
};
