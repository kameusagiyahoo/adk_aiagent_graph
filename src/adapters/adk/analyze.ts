import type { GraphEdge, GraphNode, GraphProject, ToolConfig } from '../../core/graph/types';
import type {
  AdkAdapterAnalysis,
  AdkAdapterSettings,
  AdkMappingStatus,
  AdkNodeMapping,
} from './types';

const statusLabel: Record<AdkMappingStatus, string> = {
  ready: 'READY',
  partial: 'PARTIAL',
  blocked: 'BLOCKED',
};

const toolMapping = (config: ToolConfig): Pick<AdkNodeMapping, 'status' | 'adkPrimitive' | 'notes'> => {
  switch (config.toolType) {
    case 'custom':
      return config.functionName.trim()
        ? {
            status: 'partial',
            adkPrimitive: 'FunctionTool / tool-backed FunctionNode',
            notes: [
              `Function name=${config.functionName}。`,
              '関数本体・引数schemaはCode Generator側でTODOまたは実装入力が必要。',
            ],
          }
        : {
            status: 'blocked',
            adkPrimitive: 'FunctionTool / tool-backed FunctionNode',
            notes: ['Function nameが未設定。'],
          };
    case 'http':
      return config.url.trim()
        ? {
            status: 'partial',
            adkPrimitive: 'HTTP wrapper FunctionNode / FunctionTool',
            notes: [`${config.method} ${config.url}`, '認証・headers・request schemaは今後の拡張対象。'],
          }
        : {
            status: 'blocked',
            adkPrimitive: 'HTTP wrapper FunctionNode / FunctionTool',
            notes: ['HTTP URLが未設定。'],
          };
    case 'mcp': {
      const configured = config.transport === 'stdio' ? config.command.trim() : config.url.trim();
      return configured
        ? {
            status: 'ready',
            adkPrimitive: 'McpToolset',
            notes: [
              config.transport === 'stdio'
                ? `stdio command=${config.command} ${config.args}`.trim()
                : `SSE URL=${config.url}`,
              'McpToolsetを利用するADKコードを生成可能。',
            ],
          }
        : {
            status: 'blocked',
            adkPrimitive: 'McpToolset',
            notes: [`MCP ${config.transport}の接続先が未設定。`],
          };
    }
    case 'search':
      return config.provider.trim()
        ? {
            status: 'partial',
            adkPrimitive: 'Search integration / FunctionTool',
            notes: [`Provider=${config.provider}。`, 'Provider固有Adapterは今後追加。'],
          }
        : { status: 'blocked', adkPrimitive: 'Search integration / FunctionTool', notes: ['Providerが未設定。'] };
    case 'database':
      return config.connectionRef.trim()
        ? {
            status: 'partial',
            adkPrimitive: 'Database wrapper FunctionTool',
            notes: [`Connection ref=${config.connectionRef}。`, 'Secret本体はGraphへ保存しない。'],
          }
        : { status: 'blocked', adkPrimitive: 'Database wrapper FunctionTool', notes: ['Connection refが未設定。'] };
    case 'file':
      return config.path.trim()
        ? {
            status: 'partial',
            adkPrimitive: 'File wrapper FunctionTool',
            notes: [`${config.operation} ${config.path}`, '実行環境のfilesystem権限が必要。'],
          }
        : { status: 'blocked', adkPrimitive: 'File wrapper FunctionTool', notes: ['Pathが未設定。'] };
  }
};

const routerMapping = (node: GraphNode, outgoingEdges: GraphEdge[]): Pick<AdkNodeMapping, 'status' | 'adkPrimitive' | 'notes'> => {
  const keys = outgoingEdges.map((edge) => edge.routeKey?.trim() ?? '').filter(Boolean);
  const uniqueKeys = new Set(keys);
  const ready =
    node.kind === 'router' &&
    node.config.condition.trim().length > 0 &&
    outgoingEdges.length >= 2 &&
    keys.length === outgoingEdges.length &&
    uniqueKeys.size === keys.length;

  return {
    status: ready ? 'ready' : 'blocked',
    adkPrimitive: 'Function Node + Event(route=...) + conditional edge map',
    notes: [
      node.kind === 'router' && node.config.condition.trim() ? 'Conditionは設定済み。' : 'Conditionが未設定。',
      outgoingEdges.length >= 2 ? `分岐先=${outgoingEdges.length}本。` : '2本以上の分岐先が必要。',
      keys.length === outgoingEdges.length ? `Route keys: ${keys.join(' / ') || 'なし'}` : 'Route key未設定のEdgeがある。',
      uniqueKeys.size === keys.length ? 'Route key重複なし。' : 'Route keyが重複している。',
    ],
  };
};

export const analyzeAdkAdapter = (
  project: GraphProject,
  settings: AdkAdapterSettings,
): AdkAdapterAnalysis => {
  const incoming = new Map<string, number>();
  const outgoingEdges = new Map<string, GraphEdge[]>();
  project.nodes.forEach((node) => {
    incoming.set(node.id, 0);
    outgoingEdges.set(node.id, []);
  });
  project.edges.forEach((edge) => {
    incoming.set(edge.targetNodeId, (incoming.get(edge.targetNodeId) ?? 0) + 1);
    outgoingEdges.get(edge.sourceNodeId)?.push(edge);
  });

  const nodeMappings: AdkNodeMapping[] = project.nodes.map((node) => {
    if (node.kind === 'agent') {
      const configured = node.config.instruction.trim() && settings.defaultModel.trim();
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: node.kind,
        status: configured ? 'ready' : 'blocked',
        adkPrimitive: 'LlmAgent in Workflow',
        notes: [
          node.config.instruction.trim() ? 'Instruction設定済み。' : 'Instructionが未設定。',
          settings.defaultModel.trim()
            ? `Adapter default model=${settings.defaultModel}`
            : 'ADK default modelが未設定。',
        ],
      };
    }

    if (node.kind === 'router') {
      const mapped = routerMapping(node, outgoingEdges.get(node.id) ?? []);
      return { nodeId: node.id, nodeName: node.name, nodeKind: node.kind, ...mapped };
    }

    if (node.kind === 'tool') {
      const mapped = toolMapping(node.config);
      return { nodeId: node.id, nodeName: node.name, nodeKind: node.kind, ...mapped };
    }

    if (node.kind === 'humanInput') {
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: node.kind,
        status: node.config.prompt.trim() ? 'ready' : 'blocked',
        adkPrimitive: 'Function Node yielding RequestInput',
        notes: node.config.prompt.trim()
          ? ['RequestInput(message=...)としてMapping可能。']
          : ['Promptが未設定。'],
      };
    }

    const inputCount = incoming.get(node.id) ?? 0;
    return {
      nodeId: node.id,
      nodeName: node.name,
      nodeKind: node.kind,
      status: inputCount >= 2 ? 'ready' : 'blocked',
      adkPrimitive: 'JoinNode',
      notes: inputCount >= 2
        ? [`入力${inputCount}本のfan-in barrierとしてMapping可能。`]
        : ['JoinNodeには2本以上の入力が必要。'],
    };
  });

  const blockers = nodeMappings
    .filter((mapping) => mapping.status === 'blocked')
    .map((mapping) => `${mapping.nodeName}: ${mapping.notes.join(' ')}`);
  const warnings = nodeMappings
    .filter((mapping) => mapping.status === 'partial')
    .map((mapping) => `${mapping.nodeName}: ${mapping.notes.join(' ')}`);

  const readyCount = nodeMappings.filter((mapping) => mapping.status === 'ready').length;
  const partialCount = nodeMappings.filter((mapping) => mapping.status === 'partial').length;
  const blockedCount = nodeMappings.filter((mapping) => mapping.status === 'blocked').length;

  const lines = [
    '# Google ADK Adapter Readiness',
    '',
    '## Target',
    '- SDK: Google ADK 2.x',
    '- Language target: Python',
    '- Primary runtime model: Graph-based `Workflow(edges=[...])`',
    `- Adapter default model: ${settings.defaultModel || '(未設定)'}`,
    '',
    '## Summary',
    `- READY: ${readyCount}`,
    `- PARTIAL: ${partialCount}`,
    `- BLOCKED: ${blockedCount}`,
    '',
    '## Node Mapping',
  ];

  if (nodeMappings.length === 0) {
    lines.push('- Nodeはまだありません。');
  } else {
    for (const mapping of nodeMappings) {
      lines.push('', `### ${mapping.nodeName}`, `- Status: **${statusLabel[mapping.status]}**`, `- Graph kind: \`${mapping.nodeKind}\``, `- ADK: ${mapping.adkPrimitive}`, ...mapping.notes.map((note) => `- ${note}`));
    }
  }

  lines.push('', '## Blockers', ...(blockers.length ? blockers.map((item) => `- ${item}`) : ['- なし']));
  lines.push('', '## Partial / follow-up', ...(warnings.length ? warnings.map((item) => `- ${item}`) : ['- なし']));
  lines.push(
    '',
    '## Mapping basis',
    '- Agent → `LlmAgent`をWorkflow nodeとして利用',
    '- Router → `Event(route=...)`を返すFunction Node + route key辞書',
    '- HumanInput → `RequestInput`をyieldするFunction Node',
    '- Join → `JoinNode`',
    '- MCP → `McpToolset`',
    '- Custom/HTTP/Database/File等 → FunctionToolまたはFunction Node wrapper',
  );

  return {
    target: 'google-adk-python-2.x',
    strategy: 'graph-workflow',
    settings,
    nodeMappings,
    blockers,
    warnings,
    readyCount,
    partialCount,
    blockedCount,
    markdown: lines.join('\n'),
  };
};
