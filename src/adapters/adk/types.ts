import type { NodeKind } from '../../core/graph/types';

export type AdkMappingStatus = 'ready' | 'partial' | 'blocked';

export type AdkAdapterSettings = {
  defaultModel: string;
};

export type AdkNodeMapping = {
  nodeId: string;
  nodeName: string;
  nodeKind: NodeKind;
  status: AdkMappingStatus;
  adkPrimitive: string;
  notes: string[];
};

export type AdkAdapterAnalysis = {
  target: string;
  strategy: string;
  settings: AdkAdapterSettings;
  nodeMappings: AdkNodeMapping[];
  blockers: string[];
  warnings: string[];
  readyCount: number;
  partialCount: number;
  blockedCount: number;
  markdown: string;
};
