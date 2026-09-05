import type { GraphEdge, GraphNode, GraphProject } from '../core/graph/types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPosition = (value: unknown) =>
  isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';

const isNode = (value: unknown): value is GraphNode => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    !isPosition(value.position) ||
    !isRecord(value.config)
  ) {
    return false;
  }

  switch (value.kind) {
    case 'agent':
      return typeof value.config.instruction === 'string';
    case 'router':
      return typeof value.config.condition === 'string';
    case 'tool':
      return typeof value.config.toolType === 'string';
    case 'humanInput':
      return typeof value.config.prompt === 'string';
    case 'join':
      return value.config.strategy === 'all';
    default:
      return false;
  }
};

const isEdge = (value: unknown): value is GraphEdge =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.sourceNodeId === 'string' &&
  value.sourcePortId === 'out' &&
  typeof value.targetNodeId === 'string' &&
  value.targetPortId === 'in';

export const parseGraphProject = (value: unknown): GraphProject => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.version !== 1 ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges) ||
    !value.nodes.every(isNode) ||
    !value.edges.every(isEdge)
  ) {
    throw new Error('Graph JSONの形式が正しくありません。');
  }

  const nodeIds = new Set<string>();
  for (const node of value.nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`Node IDが重複しています: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  const edgeIds = new Set<string>();
  for (const edge of value.edges) {
    if (edgeIds.has(edge.id)) {
      throw new Error(`Edge IDが重複しています: ${edge.id}`);
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      throw new Error(`存在しないNodeを参照するEdgeがあります: ${edge.id}`);
    }
  }

  return value as GraphProject;
};

export const parseGraphProjectJson = (text: string): GraphProject => {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('JSONとして読み込めません。');
  }

  return parseGraphProject(value);
};

export const serializeGraphProject = (project: GraphProject) => JSON.stringify(project, null, 2);

const safeFileName = (name: string) => {
  const sanitized = name.trim().replace(/[\\/:*?"<>|]+/g, '-');
  return sanitized || 'agent-graph';
};

export const downloadGraphProjectJson = (project: GraphProject) => {
  const blob = new Blob([serializeGraphProject(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${safeFileName(project.name)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
