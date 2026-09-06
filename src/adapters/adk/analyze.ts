import type { GraphNode, GraphProject } from '../../core/graph/types';
import type { AdkAdapterAnalysis, AdkMappingStatus, AdkNodeMapping } from './types';

const statusLabel: Record<AdkMappingStatus, string> = {
  ready: 'READY',
  partial: 'PARTIAL',
  blocked: 'BLOCKED',
};

const countConnections = (project: GraphProject) => {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const node of project.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, 0);
  }

  for (const edge of project.edges) {
    if (outgoing.has(edge.sourceNodeId)) {
      outgoing.set(edge.sourceNodeId, (outgoing.get(edge.sourceNodeId) ?? 0) + 1);
    }
    if (incoming.has(edge.targetNodeId)) {
      incoming.set(edge.targetNodeId, (incoming.get(edge.targetNodeId) ?? 0) + 1);
    }
  }

  return { incoming, outgoing };
};

const mapNode = (
  node: GraphNode,
  incomingCount: number,
  outgoingCount: number,
): AdkNodeMapping => {
  switch (node.kind) {
    case 'agent':
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: node.kind,
        status: node.config.instruction.trim() ? 'partial' : 'blocked',
        adkPrimitive: 'LlmAgent in Workflow',
        notes: node.config.instruction.trim()
          ? ['Instructionは利用可能。ADK用modelはAdapter設定として別途必要。']
          : ['Instructionが未設定。', 'ADK用modelはAdapter設定として別途必要。'],
      };

    case 'router':
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: node.kind,
        status: 'blocked',
        adkPrimitive: 'Function Node + Event(route=...) + conditional edges',
        notes: [
          node.config.condition.trim() ? 'Conditionは利用可能。' : 'Conditionが未設定。',
          outgoingCount >= 2
            ? '出力先は2本以上ある。'
            : 'ADK Routerとして2本以上の分岐先が必要。',
          '現在のGraphEdgeにはrouteKeyがないため、各条件と接続先をADKのrouteへ確定できない。',
        ],
      };

    case 'tool': {
      const primitive = node.config.toolType === 'mcp'
        ? 'McpToolset / MCP tool node'
        : 'FunctionTool / tool-backed workflow node';
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: node.kind,
        status: 'blocked',
        adkPrimitive: primitive,
        notes: [
          `Tool type=${node.config.toolType}。`,
          '現在はTool種別だけで、関数schema・HTTP設定・MCP接続先などの実行定義がない。',
        ],
      };
    }

    case 'humanInput':
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: node.kind,
        status: node.config.prompt.trim() ? 'ready' : 'blocked',
        adkPrimitive: 'RequestInput human-in-the-loop workflow node',
        notes: node.config.prompt.trim()
          ? ['単純なテキスト入力待ちとして直接Mapping可能。']
          : ['ユーザーへ提示するPromptが未設定。'],
      };

    case 'join':
      return {
        nodeId: node.id,
        nodeName: node.name,
        nodeKind: node.kind,
        status: incomingCount >= 2 ? 'ready' : 'blocked',
        adkPrimitive: 'JoinNode',
        notes: incomingCount >= 2
          ? [
              `入力${incomingCount}本を待ち合わせるfan-in barrierとしてMapping可能。`,
              '前段Nodeがそれぞれoutputを返すことが実行時の前提。',
            ]
          : ['JoinNodeとして利用するには2本以上の入力が必要。'],
      };
  }
};

export const analyzeAdkAdapter = (project: GraphProject): AdkAdapterAnalysis => {
  const { incoming, outgoing } = countConnections(project);
  const nodeMappings = project.nodes.map((node) =>
    mapNode(node, incoming.get(node.id) ?? 0, outgoing.get(node.id) ?? 0),
  );

  const blockers = new Set<string>();
  const warnings = new Set<string>();

  if (project.nodes.some((node) => node.kind === 'router')) {
    blockers.add('Router分岐を生成するため、GraphEdgeへrouteKey / branch labelを追加する必要がある。');
  }
  if (project.nodes.some((node) => node.kind === 'tool')) {
    blockers.add('Toolを実行可能コードへ変換するため、Toolごとの具体設定schemaが必要。');
  }
  if (project.nodes.some((node) => node.kind === 'agent')) {
    warnings.add('LlmAgentのmodelはGraph IRではなくADK Adapter設定として追加する。');
  }

  warnings.add('ADK 2.x Graph Workflowでは通常Edge上をoutputが流れるため、単純なNode間データ受け渡しにsession.stateは必須ではない。');
  warnings.add('永続状態や会話状態が必要になった時点でState Node / state mappingを別機能として追加する。');

  for (const mapping of nodeMappings) {
    if (mapping.status === 'blocked') {
      blockers.add(`${mapping.nodeName}: ${mapping.notes.join(' ')}`);
    }
  }

  const readyCount = nodeMappings.filter((mapping) => mapping.status === 'ready').length;
  const partialCount = nodeMappings.filter((mapping) => mapping.status === 'partial').length;
  const blockedCount = nodeMappings.filter((mapping) => mapping.status === 'blocked').length;

  const lines = [
    '# Google ADK Adapter Readiness',
    '',
    '## Target',
    '- SDK: Google ADK 2.x',
    '- Language target: Python（最初のCode Generator予定）',
    '- Primary runtime model: Graph-based `Workflow(edges=[...])`',
    '- Legacy SequentialAgent / ParallelAgent / LoopAgentを主変換先にはしない',
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
      lines.push(
        '',
        `### ${mapping.nodeName}`,
        `- Status: **${statusLabel[mapping.status]}**`,
        `- Graph kind: \`${mapping.nodeKind}\``,
        `- ADK: ${mapping.adkPrimitive}`,
        ...mapping.notes.map((note) => `- ${note}`),
      );
    }
  }

  lines.push('', '## Blockers');
  if (blockers.size === 0) {
    lines.push('- なし');
  } else {
    for (const blocker of blockers) {
      lines.push(`- ${blocker}`);
    }
  }

  lines.push('', '## Adapter Design Notes');
  for (const warning of warnings) {
    lines.push(`- ${warning}`);
  }

  lines.push(
    '',
    '## Current official mapping basis',
    '- Agent → `LlmAgent`をWorkflow nodeとして利用',
    '- Router → routeを返すFunction Node + conditional edge map',
    '- HumanInput → `RequestInput`系HITL node',
    '- Join → `JoinNode`',
    '- Tool → `FunctionTool` / `McpToolset`等をTool設定に応じてAdapterで生成',
  );

  return {
    target: 'google-adk-python-2.x',
    strategy: 'graph-workflow',
    nodeMappings,
    blockers: [...blockers],
    warnings: [...warnings],
    readyCount,
    partialCount,
    blockedCount,
    markdown: lines.join('\n'),
  };
};
