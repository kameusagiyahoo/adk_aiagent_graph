import type { AdkGeneratedFile } from '../../adapters/adk/codegenTypes';

export type RuntimeBridgeSettings = {
  baseUrl: string;
  token: string;
};

export type RuntimeBridgeHealth = {
  service: string;
  version: string;
  pythonVersion: string;
  adkVersion: string;
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
