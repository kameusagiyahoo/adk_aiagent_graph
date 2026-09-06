import type {
  RuntimeBridgeHealth,
  RuntimeBridgeSettings,
  RuntimeExecutionRequest,
  RuntimeExecutionResult,
  RuntimeValidationRequest,
  RuntimeValidationResult,
} from './types';

type LocalFetchInit = RequestInit & {
  targetAddressSpace?: 'loopback' | 'local';
};

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

const requestJson = async <T>(
  settings: RuntimeBridgeSettings,
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const localInit: LocalFetchInit = {
    ...init,
    signal: controller.signal,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Graph-Token': settings.token,
      ...(init.headers ?? {}),
    },
  };

  try {
    const hostname = new URL(baseUrl).hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') {
      localInit.targetAddressSpace = 'loopback';
    }

    const response = await fetch(`${baseUrl}${path}`, localInit);
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok) {
      const detail =
        typeof body === 'object' && body && 'detail' in body
          ? String((body as { detail?: unknown }).detail ?? response.statusText)
          : String(body || response.statusText);
      throw new Error(`Bridge ${response.status}: ${detail}`);
    }

    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Local Bridgeへの接続がタイムアウトしました。');
    }
    if (error instanceof TypeError) {
      throw new Error(
        'Local Bridgeへ接続できません。Bridgeの起動、URL、Token、ブラウザのローカルネットワーク許可を確認してください。',
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
};

export const checkRuntimeBridge = (settings: RuntimeBridgeSettings) =>
  requestJson<RuntimeBridgeHealth>(settings, '/v1/health', { method: 'GET' }, 5000);

export const validateWithRuntimeBridge = (
  settings: RuntimeBridgeSettings,
  request: RuntimeValidationRequest,
) =>
  requestJson<RuntimeValidationResult>(
    settings,
    '/v1/validate',
    { method: 'POST', body: JSON.stringify(request) },
    25000,
  );

export const executeWithRuntimeBridge = (
  settings: RuntimeBridgeSettings,
  request: RuntimeExecutionRequest,
) =>
  requestJson<RuntimeExecutionResult>(
    settings,
    '/v1/execute',
    { method: 'POST', body: JSON.stringify(request) },
    55000,
  );
