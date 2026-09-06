import type { GraphProject } from '../../core/graph/types';
import type { SimulationResult, SimulationRouteChoices } from './types';

const nodeDetail = (kind: string) => {
  switch (kind) {
    case 'agent': return 'LLM応答をMockで生成した想定で次へ進みます。';
    case 'tool': return 'Tool実行結果をStubで返した想定で次へ進みます。';
    case 'humanInput': return 'HumanInputをMock入力済みとして次へ進みます。';
    case 'router': return '指定したrouteKeyの分岐を選択します。';
    case 'join': return 'Joinで入力が合流した想定で次へ進みます。';
    default: return 'NodeをMock実行しました。';
  }
};

export const simulateGraphProject = (
  project: GraphProject,
  routeChoices: SimulationRouteChoices,
): SimulationResult => {
  const nodeById = new Map(project.nodes.map((node) => [node.id, node]));
  const incomingCount = new Map(project.nodes.map((node) => [node.id, 0]));
  project.edges.forEach((edge) => incomingCount.set(edge.targetNodeId, (incomingCount.get(edge.targetNodeId) ?? 0) + 1));

  const entries = project.nodes.filter((node) => (incomingCount.get(node.id) ?? 0) === 0);
  const queue = [...entries.map((node) => node.id)];
  const queued = new Set(queue);
  const visited = new Set<string>();
  const edgeIds = new Set<string>();
  const nodeOrder: Record<string, number> = {};
  const trace: SimulationResult['trace'] = [];
  const warnings: string[] = [];

  if (project.nodes.length === 0) warnings.push('Nodeがありません。');
  if (project.nodes.length > 0 && entries.length === 0) warnings.push('入口Nodeが見つかりません。Cycleまたは接続を確認してください。');

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    queued.delete(nodeId);
    if (visited.has(nodeId)) continue;
    const node = nodeById.get(nodeId);
    if (!node) continue;

    visited.add(nodeId);
    const step = trace.length + 1;
    nodeOrder[nodeId] = step;

    const outgoing = project.edges.filter((edge) => edge.sourceNodeId === nodeId);
    let selected = outgoing;
    let routeKey: string | undefined;
    let selectedEdgeId: string | undefined;

    if (node.kind === 'router') {
      if (outgoing.length === 0) {
        warnings.push(`${node.name}: Routerの接続先がありません。`);
        selected = [];
      } else {
        const preferredId = routeChoices[node.id];
        const chosen = outgoing.find((edge) => edge.id === preferredId)
          ?? outgoing.find((edge) => edge.routeKey?.trim())
          ?? outgoing[0];
        selected = chosen ? [chosen] : [];
        routeKey = chosen?.routeKey?.trim() || '(routeKey未設定)';
        selectedEdgeId = chosen?.id;
        if (!chosen?.routeKey?.trim()) warnings.push(`${node.name}: 選択分岐のrouteKeyが未設定です。`);
      }
    }

    trace.push({
      step,
      nodeId,
      nodeName: node.name,
      nodeKind: node.kind,
      detail: nodeDetail(node.kind),
      routeKey,
      edgeId: selectedEdgeId,
    });

    selected.forEach((edge) => {
      edgeIds.add(edge.id);
      if (visited.has(edge.targetNodeId)) {
        warnings.push(`${node.name}: 既に実行済みNodeへ戻るEdgeを検出しました。Mockでは再実行しません。`);
        return;
      }
      if (!queued.has(edge.targetNodeId)) {
        queue.push(edge.targetNodeId);
        queued.add(edge.targetNodeId);
      }
    });
  }

  const unreachable = project.nodes.filter((node) => !visited.has(node.id));
  unreachable.forEach((node) => warnings.push(`${node.name}: このMock実行経路では到達しませんでした。`));

  return {
    status: warnings.length > 0 ? 'warning' : 'completed',
    trace,
    nodeOrder,
    edgeIds: [...edgeIds],
    warnings,
  };
};
