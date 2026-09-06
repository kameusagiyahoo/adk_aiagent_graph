import type { NodeKind } from '../../core/graph/types';

export type SimulationState = {
  input: string;
  lastOutput: string;
  lastNode: string | null;
  step: number;
};

export type SimulationTraceEvent = {
  step: number;
  nodeId: string;
  nodeName: string;
  nodeKind: NodeKind;
  detail: string;
  routeKey?: string;
  edgeId?: string;
  input: string;
  output: string;
  stateSnapshot: SimulationState;
};

export type SimulationResult = {
  status: 'completed' | 'warning';
  trace: SimulationTraceEvent[];
  nodeOrder: Record<string, number>;
  edgeIds: string[];
  warnings: string[];
};

export type SimulationRouteChoices = Record<string, string>;

export type SimulationDebugConfig = {
  initialInput: string;
  mockOutputs: Record<string, string>;
};

export type SimulationDebugSession = {
  queue: string[];
  visited: string[];
  trace: SimulationTraceEvent[];
  edgeIds: string[];
  warnings: string[];
  state: SimulationState;
  completed: boolean;
};
