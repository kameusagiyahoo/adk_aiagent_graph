import type { NodeKind } from '../../core/graph/types';

export type SimulationTraceEvent = {
  step: number;
  nodeId: string;
  nodeName: string;
  nodeKind: NodeKind;
  detail: string;
  routeKey?: string;
  edgeId?: string;
};

export type SimulationResult = {
  status: 'completed' | 'warning';
  trace: SimulationTraceEvent[];
  nodeOrder: Record<string, number>;
  edgeIds: string[];
  warnings: string[];
};

export type SimulationRouteChoices = Record<string, string>;
