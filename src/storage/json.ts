import type {
  FileOperation,
  GraphEdge,
  GraphNode,
  GraphProject,
  HttpMethod,
  McpTransport,
  ToolConfig,
} from '../core/graph/types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPosition = (value: unknown): value is { x: number; y: number } =>
  isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';

const stringOrEmpty = (value: unknown) => (typeof value === 'string' ? value : '');

const parseToolConfig = (value: unknown): ToolConfig | null => {
  if (!isRecord(value) || typeof value.toolType !== 'string') {
    return null;
  }

  switch (value.toolType) {
    case 'custom':
      return {
        toolType: 'custom',
        functionName: stringOrEmpty(value.functionName),
        description: stringOrEmpty(value.description),
      };
    case 'http': {
      const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(String(value.method))
        ? (value.method as HttpMethod)
        : 'GET';
      return { toolType: 'http', method, url: stringOrEmpty(value.url) };
    }
    case 'mcp': {
      const transport: McpTransport = value.transport === 'sse' ? 'sse' : 'stdio';
      return {
        toolType: 'mcp',
        transport,
        command: stringOrEmpty(value.command),
        args: stringOrEmpty(value.args),
        url: stringOrEmpty(value.url),
      };
    }
    case 'search':
      return { toolType: 'search', provider: stringOrEmpty(value.provider) };
    case 'database':
      return {
        toolType: 'database',
        connectionRef: stringOrEmpty(value.connectionRef),
        operation: stringOrEmpty(value.operation),
      };
    case 'file': {
      const operation: FileOperation = ['read', 'write', 'list'].includes(String(value.operation))
        ? (value.operation as FileOperation)
        : 'read';
      return { toolType: 'file', operation, path: stringOrEmpty(value.path) };
    }
    default:
      return null;
  }
};

const parseNode = (value: unknown): GraphNode | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string' ||
    !isPosition(value.position) ||
    !isRecord(value.config)
  ) {
    return null;
  }

  const common = {
    id: value.id,
    name: value.name,
    description: value.description,
    position: { x: value.position.x, y: value.position.y },
  };

  switch (value.kind) {
    case 'agent':
      return typeof value.config.instruction === 'string'
        ? { ...common, kind: 'agent', config: { instruction: value.config.instruction } }
        : null;
    case 'router':
      return typeof value.config.condition === 'string'
        ? { ...common, kind: 'router', config: { condition: value.config.condition } }
        : null;
    case 'tool': {
      const config = parseToolConfig(value.config);
      return config ? { ...common, kind: 'tool', config } : null;
    }
    case 'humanInput':
      return typeof value.config.prompt === 'string'
        ? { ...common, kind: 'humanInput', config: { prompt: value.config.prompt } }
        : null;
    case 'join':
      return value.config.strategy === 'all'
        ? { ...common, kind: 'join', config: { strategy: 'all' } }
        : null;
    default:
      return null;
  }
};

const parseEdge = (value: unknown): GraphEdge | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.sourceNodeId !== 'string' ||
    value.sourcePortId !== 'out' ||
    typeof value.targetNodeId !== 'string' ||
    value.targetPortId !== 'in' ||
    (value.routeKey !== undefined && typeof value.routeKey !== 'string')
  ) {
    return null;
  }

  return {
    id: value.id,
    sourceNodeId: value.sourceNodeId,
    sourcePortId: 'out',
    targetNodeId: value.targetNodeId,
    targetPortId: 'in',
    ...(typeof value.routeKey === 'string' ? { routeKey: value.routeKey } : {}),
  };
};

export const parseGraphProject = (value: unknown): GraphProject => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.version !== 1 ||
    typeof value.name !== 'string' ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges)
  ) {
    throw new Error('Graph JSONの形式が正しくありません。');
  }

  const parsedNodes = value.nodes.map(parseNode);
  const parsedEdges = value.edges.map(parseEdge);
  if (parsedNodes.some((node) => node === null) || parsedEdges.some((edge) => edge === null)) {
    throw new Error('Graph JSONのNodeまたはEdge形式が正しくありません。');
  }

  const nodes = parsedNodes as GraphNode[];
  const edges = parsedEdges as GraphEdge[];
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`Node IDが重複しています: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  const edgeIds = new Set<string>();
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      throw new Error(`Edge IDが重複しています: ${edge.id}`);
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      throw new Error(`存在しないNodeを参照するEdgeがあります: ${edge.id}`);
    }
  }

  return {
    id: value.id,
    version: 1,
    name: value.name,
    nodes,
    edges,
  };
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
