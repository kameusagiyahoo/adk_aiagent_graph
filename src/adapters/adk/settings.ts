import type { AdkAdapterSettings } from './types';

const STORAGE_KEY = 'agent-graph-designer.adk-settings.v1';

export const defaultAdkAdapterSettings: AdkAdapterSettings = {
  defaultModel: 'gemini-flash-latest',
};

export const loadAdkAdapterSettings = (): AdkAdapterSettings => {
  if (typeof window === 'undefined') {
    return defaultAdkAdapterSettings;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultAdkAdapterSettings;
    }

    const value = JSON.parse(raw) as Partial<AdkAdapterSettings>;
    return {
      defaultModel:
        typeof value.defaultModel === 'string' && value.defaultModel.trim()
          ? value.defaultModel
          : defaultAdkAdapterSettings.defaultModel,
    };
  } catch (error) {
    console.warn('ADK adapter settings could not be loaded.', error);
    return defaultAdkAdapterSettings;
  }
};

export const saveAdkAdapterSettings = (settings: AdkAdapterSettings) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('ADK adapter settings could not be saved.', error);
  }
};
