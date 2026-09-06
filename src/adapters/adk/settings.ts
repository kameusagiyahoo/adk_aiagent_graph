import type { AdkAdapterSettings } from './types';

const STORAGE_KEY = 'agent-graph-designer.adk-settings.v2';

export const defaultAdkAdapterSettings: AdkAdapterSettings = {
  defaultModel: 'gpt-5.6-terra',
};

const normalizeModel = (value: unknown) => {
  if (typeof value !== 'string') return defaultAdkAdapterSettings.defaultModel;
  const model = value.trim().replace(/^openai\//, '');
  if (!model || model.startsWith('ollama_chat/') || model.startsWith('gemini')) {
    return defaultAdkAdapterSettings.defaultModel;
  }
  return model;
};

export const loadAdkAdapterSettings = (): AdkAdapterSettings => {
  if (typeof window === 'undefined') return defaultAdkAdapterSettings;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAdkAdapterSettings;
    const value = JSON.parse(raw) as Partial<AdkAdapterSettings>;
    return { defaultModel: normalizeModel(value.defaultModel) };
  } catch (error) {
    console.warn('ADK adapter settings could not be loaded.', error);
    return defaultAdkAdapterSettings;
  }
};

export const saveAdkAdapterSettings = (settings: AdkAdapterSettings) => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...settings, defaultModel: normalizeModel(settings.defaultModel) }),
    );
  } catch (error) {
    console.warn('ADK adapter settings could not be saved.', error);
  }
};
