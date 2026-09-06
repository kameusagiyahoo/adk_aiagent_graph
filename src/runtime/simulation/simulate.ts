import type { GraphProject } from '../../core/graph/types';
import { advanceSimulationDebugSession, createSimulationDebugSession, sessionToSimulationResult } from './debugger';
import type { SimulationDebugConfig, SimulationResult, SimulationRouteChoices } from './types';

export const simulateGraphProject = (
  project: GraphProject,
  routeChoices: SimulationRouteChoices,
  config: SimulationDebugConfig = { initialInput: 'Mock user input', mockOutputs: {} },
): SimulationResult => {
  let session = createSimulationDebugSession(project, routeChoices, config);
  let guard = 0;
  while (!session.completed && guard < Math.max(project.nodes.length * 2, 20)) {
    session = advanceSimulationDebugSession(project, session, routeChoices, config);
    guard += 1;
  }
  if (!session.completed) {
    session = { ...session, completed: true, warnings: [...session.warnings, 'Mock実行の安全上限に達しました。'] };
  }
  return sessionToSimulationResult(session);
};
