import type { AdkGeneratedFile } from '../../adapters/adk/codegenTypes';

export type RuntimeMode = 'mock' | 'openai' | 'vllm';

export type RuntimeBridgeSettings = {
  baseUrl: string;
  token: string;
  mode: RuntimeMode;
  vllmBaseUrl: string;
  vllmModel: string;
};

export type RuntimeBridgeHealth = {
  service: string;
  version: string;
  pythonVersion: string;
  adkVersion: string;
  openaiConfigured: boolean;
  vllmApiKeyConfigured: boolean;
};

export type RuntimeCheckStatus = 'pass' | 'fail' | 'skip';

export type RuntimeCheck = {
  id: string;
  label: string;
  status: RuntimeCheckStatus;
  detail: string;
  durationMs: number;
};

export type RuntimeValidationResult = {
  status: 'passed' | 'failed';
  pythonVersion: string;
  adkVersion: string;
  checks: RuntimeCheck[];
};

export type RuntimeValidationRequest = {
  packageName: string;
  files: Pick<AdkGeneratedFile, 'path' | 'content'>[];
};

export type RuntimeTraceEvent = {
  eventId: string;
  author: string;
  nodeName: string;
  branch: string;
  route: string;
  text: string;
  functionCalls: string[];
  functionResponses: string[];
  isFinal: boolean;
};

export type RuntimeExecutionRequest = RuntimeValidationRequest & {
  inputText: string;
  mode: Exclude<RuntimeMode, 'mock'>;
  model: string;
  vllmBaseUrl?: string;
};

export type RuntimeExecutionResult = {
  status: 'completed' | 'failed';
  invocationId: string;
  finalText: string;
  trace: RuntimeTraceEvent[];
  error?: string | null;
  traceback?: string;
};

export type VllmCheckResult = {
  ok: boolean;
  baseUrl: string;
  models: string[];
  error?: string | null;
};
