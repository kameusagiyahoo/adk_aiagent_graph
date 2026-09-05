import type { GraphEdge, GraphNode, GraphProject, NodeKind } from './types';

const createId = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const nodePosition = (sequenceIndex: number) => ({
  x: 72 + (sequenceIndex % 3) * 240,
  y: 72 + Math.floor(sequenceIndex / 3) * 150,
});

export const createEmptyProject = (): GraphProject => ({
  id: 'project-local',
  version: 1,
  name: 'Untitled Project',
  nodes: [],
  edges: [],
});

export const createGraphNode = (
  kind: NodeKind,
  kindIndex: number,
  sequenceIndex: number,
): GraphNode => {
  const common = {
    id: `${kind}-${createId()}`,
    position: nodePosition(sequenceIndex),
  };

  switch (kind) {
    case 'agent':
      return {
        ...common,
        kind,
        name: `Agent ${kindIndex + 1}`,
        description: 'LLMなどで判断・処理する主体',
        config: { instruction: '' },
      };
    case 'router':
      return {
        ...common,
        kind,
        name: `Router ${kindIndex + 1}`,
        description: '条件に応じて次の処理先を選ぶ',
        config: { condition: '' },
      };
    case 'tool':
      return {
        ...common,
        kind,
        name: `Tool ${kindIndex + 1}`,
        description: 'API・検索・計算など外部処理を実行する',
        config: { toolType: 'custom' },
      };
    case 'humanInput':
      return {
        ...common,
        kind,
        name: `HumanInput ${kindIndex + 1}`,
        description: '人から追加情報や承認を受け取る',
        config: { prompt: '' },
      };
    case 'join':
      return {
        ...common,
        kind,
        name: `Join ${kindIndex + 1}`,
        description: '複数の処理結果をまとめる',
        config: { strategy: 'all' },
      };
  }
};

export const createGraphEdge = (sourceNodeId: string, targetNodeId: string): GraphEdge => ({
  id: `edge-${createId()}`,
  sourceNodeId,
  sourcePortId: 'out',
  targetNodeId,
  targetPortId: 'in',
});
