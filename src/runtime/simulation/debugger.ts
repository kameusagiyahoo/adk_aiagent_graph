import type { GraphProject } from '../../core/graph/types';
import type {
  SimulationAdvanceOptions,
  SimulationDebugConfig,
  SimulationDebugSession,
  SimulationResult,
  SimulationRouteChoices,
  SimulationState,
  SimulationTraceEvent,
} from './types';

const defaultOutput = (nodeName: string, kind: string, input: string) => {
  switch (kind) {
    case 'agent': return `[Mock LLM] ${nodeName} が「${input || '入力なし'}」を処理した想定の応答`;
    case 'tool': return `[Mock Tool] ${nodeName} のStub結果`;
    case 'humanInput': return `[Mock Human] ${nodeName} への模擬ユーザー入力`;
    case 'router': return input;
    case 'join': return `[Mock Join] ${nodeName} で結果を統合`;
    default: return `[Mock] ${nodeName}`;
  }
};

const outgoingFor = (project: GraphProject, nodeId: string, choices: SimulationRouteChoices) => {
  const node = project.nodes.find((candidate) => candidate.id === nodeId);
  const outgoing = project.edges.filter((edge) => edge.sourceNodeId === nodeId);
  if (node?.kind !== 'router') return { edges: outgoing, routeKey: undefined as string | undefined };
  const preferredId = choices[nodeId];
  const chosen = outgoing.find((edge) => edge.id === preferredId)
    ?? outgoing.find((edge) => edge.routeKey?.trim())
    ?? outgoing[0];
  return { edges: chosen ? [chosen] : [], routeKey: chosen?.routeKey?.trim() || '(routeKey未設定)' };
};

export const createSimulationDebugSession = (
  project: GraphProject,
  routeChoices: SimulationRouteChoices,
  config: SimulationDebugConfig,
): SimulationDebugSession => {
  const incomingCount = new Map(project.nodes.map((node) => [node.id, 0]));
  project.edges.forEach((edge) => incomingCount.set(edge.targetNodeId, (incomingCount.get(edge.targetNodeId) ?? 0) + 1));
  const queue = project.nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0).map((node) => node.id);
  const warnings: string[] = [];
  if (project.nodes.length > 0 && queue.length === 0) warnings.push('入口Nodeがありません。Cycleまたは接続を確認してください。');
  return {
    queue,
    visited: [],
    trace: [],
    edgeIds: [],
    warnings,
    state: { input: config.initialInput, lastOutput: config.initialInput, lastNode: null, step: 0 },
    completed: queue.length === 0,
    pausedAtBreakpoint: null,
  };
};

export const restartSimulationDebugSessionAtNode = (
  project: GraphProject,
  nodeId: string,
  state: SimulationState,
): SimulationDebugSession => {
  const node = project.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) {
    return {
      queue: [], visited: [], trace: [], edgeIds: [], warnings: ['再開対象Nodeが見つかりません。'],
      state, completed: true, pausedAtBreakpoint: null,
    };
  }
  return {
    queue: [nodeId],
    visited: [],
    trace: [],
    edgeIds: [],
    warnings: [`${node.name} からStateを引き継いで再開しました。`],
    state,
    completed: false,
    pausedAtBreakpoint: null,
  };
};

export const replaceSimulationDebugState = (
  session: SimulationDebugSession,
  state: SimulationState,
): SimulationDebugSession => ({ ...session, state });

export const advanceSimulationDebugSession = (
  project: GraphProject,
  session: SimulationDebugSession,
  routeChoices: SimulationRouteChoices,
  config: SimulationDebugConfig,
  options: SimulationAdvanceOptions = {},
): SimulationDebugSession => {
  if (session.completed) return session;
  const queue = [...session.queue];
  const visited = [...session.visited];
  const trace = [...session.trace];
  const edgeIds = [...session.edgeIds];
  const warnings = [...session.warnings];
  const nodeId = queue[0];
  if (!nodeId) return { ...session, completed: true, pausedAtBreakpoint: null };

  if (
    !options.bypassBreakpoint
    && options.breakpoints?.includes(nodeId)
    && session.pausedAtBreakpoint !== nodeId
  ) {
    return { ...session, pausedAtBreakpoint: nodeId };
  }

  queue.shift();
  if (visited.includes(nodeId)) {
    return { ...session, queue, completed: queue.length === 0, pausedAtBreakpoint: null };
  }

  const node = project.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return { ...session, queue, completed: queue.length === 0, pausedAtBreakpoint: null };
  const input = String(session.state.lastOutput ?? '');
  const output = config.mockOutputs[nodeId]?.trim() || defaultOutput(node.name, node.kind, input);
  const selected = outgoingFor(project, nodeId, routeChoices);
  const step = trace.length + 1;
  const stateSnapshot: SimulationState = {
    ...session.state,
    input: String(session.state.input ?? config.initialInput),
    lastOutput: output,
    lastNode: node.name,
    step,
  };
  const event: SimulationTraceEvent = {
    step,
    nodeId,
    nodeName: node.name,
    nodeKind: node.kind,
    detail: node.kind === 'router' ? '選択したrouteKeyへ分岐します。' : `${node.kind}をMock実行しました。`,
    routeKey: selected.routeKey,
    edgeId: selected.edges[0]?.id,
    input,
    output,
    stateSnapshot,
  };
  trace.push(event);
  visited.push(nodeId);

  for (const edge of selected.edges) {
    if (!edgeIds.includes(edge.id)) edgeIds.push(edge.id);
    if (visited.includes(edge.targetNodeId)) {
      warnings.push(`${node.name}: 実行済みNodeへ戻るEdgeはMock Debuggerでは再実行しません。`);
    } else if (!queue.includes(edge.targetNodeId)) {
      queue.push(edge.targetNodeId);
    }
  }

  const completed = queue.length === 0;
  if (completed) {
    project.nodes.filter((candidate) => !visited.includes(candidate.id)).forEach((candidate) => {
      warnings.push(`${candidate.name}: この実行経路では到達しませんでした。`);
    });
  }

  return {
    queue,
    visited,
    trace,
    edgeIds,
    warnings: [...new Set(warnings)],
    state: stateSnapshot,
    completed,
    pausedAtBreakpoint: null,
  };
};

export const sessionToSimulationResult = (session: SimulationDebugSession): SimulationResult => ({
  status: session.warnings.length > 0 ? 'warning' : 'completed',
  trace: session.trace,
  nodeOrder: Object.fromEntries(session.trace.map((event) => [event.nodeId, event.step])),
  edgeIds: session.edgeIds,
  warnings: session.warnings,
});

export const runSimulationDebugToCompletion = (
  project: GraphProject,
  routeChoices: SimulationRouteChoices,
  config: SimulationDebugConfig,
): SimulationResult => {
  let session = createSimulationDebugSession(project, routeChoices, config);
  const maxSteps = Math.max(1, project.nodes.length + project.edges.length + 10);
  let guard = 0;
  while (!session.completed && guard < maxSteps) {
    session = advanceSimulationDebugSession(project, session, routeChoices, config, { bypassBreakpoint: true });
    guard += 1;
  }
  if (!session.completed) {
    session = {
      ...session,
      completed: true,
      warnings: [...new Set([...session.warnings, `Mock比較を安全上限 ${maxSteps} stepで停止しました。`])],
    };
  }
  return sessionToSimulationResult(session);
};
