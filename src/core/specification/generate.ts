import type { GraphNode, GraphProject, NodeKind } from '../graph/types';
import type {
  SpecificationConnection,
  SpecificationDocument,
  SpecificationNode,
} from './types';

const kindLabels: Record<NodeKind, string> = {
  agent: 'Agent',
  router: 'Router',
  tool: 'Tool',
  humanInput: 'HumanInput',
  join: 'Join',
};

const valueOrUnset = (value: string) => value.trim() || '(未設定)';
const inline = (value: string) => value.replace(/`/g, "'");

const configLinesForNode = (node: GraphNode): string[] => {
  switch (node.kind) {
    case 'agent':
      return [`Instruction: ${valueOrUnset(node.config.instruction)}`];
    case 'router':
      return [`Condition: ${valueOrUnset(node.config.condition)}`];
    case 'tool':
      return [`Tool type: ${valueOrUnset(node.config.toolType)}`];
    case 'humanInput':
      return [`Prompt: ${valueOrUnset(node.config.prompt)}`];
    case 'join':
      return [`Strategy: ${node.config.strategy}`];
  }
};

const connectedNames = (ids: string[], names: Map<string, string>) =>
  ids.length > 0 ? ids.map((id) => names.get(id) ?? id).join(' / ') : 'なし';

const behaviorLine = (node: GraphNode, specNode: SpecificationNode, names: Map<string, string>) => {
  const incoming = connectedNames(specNode.incomingNodeIds, names);
  const outgoing = connectedNames(specNode.outgoingNodeIds, names);

  switch (node.kind) {
    case 'agent':
      return `- **${node.name}**: Instruction「${inline(valueOrUnset(node.config.instruction))}」に従って判断・処理する。入力元: ${incoming}。出力先: ${outgoing}。`;
    case 'router':
      return `- **${node.name}**: Condition「${inline(valueOrUnset(node.config.condition))}」を評価し、接続された候補から次の処理先を選ぶ。入力元: ${incoming}。候補: ${outgoing}。`;
    case 'tool':
      return `- **${node.name}**: ${valueOrUnset(node.config.toolType)} Toolとして外部処理を実行する。入力元: ${incoming}。出力先: ${outgoing}。`;
    case 'humanInput':
      return `- **${node.name}**: ユーザーに「${inline(valueOrUnset(node.config.prompt))}」を提示し、追加情報または承認を受け取る。入力元: ${incoming}。出力先: ${outgoing}。`;
    case 'join':
      return `- **${node.name}**: ${incoming} から来る複数結果を strategy=${node.config.strategy} で統合し、${outgoing} へ渡す。`;
  }
};

export const generateGraphSpecification = (project: GraphProject): SpecificationDocument => {
  const nodeNames = new Map<string, string>();
  const incomingByNode = new Map<string, string[]>();
  const outgoingByNode = new Map<string, string[]>();

  for (const node of project.nodes) {
    if (!nodeNames.has(node.id)) {
      nodeNames.set(node.id, node.name || node.id);
      incomingByNode.set(node.id, []);
      outgoingByNode.set(node.id, []);
    }
  }

  const connections: SpecificationConnection[] = [];

  for (const edge of project.edges) {
    if (!nodeNames.has(edge.sourceNodeId) || !nodeNames.has(edge.targetNodeId)) {
      continue;
    }

    outgoingByNode.get(edge.sourceNodeId)?.push(edge.targetNodeId);
    incomingByNode.get(edge.targetNodeId)?.push(edge.sourceNodeId);
    connections.push({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      sourceName: nodeNames.get(edge.sourceNodeId) ?? edge.sourceNodeId,
      targetName: nodeNames.get(edge.targetNodeId) ?? edge.targetNodeId,
    });
  }

  const nodes: SpecificationNode[] = project.nodes.map((node) => ({
    id: node.id,
    kind: node.kind,
    name: node.name,
    description: node.description,
    configLines: configLinesForNode(node),
    incomingNodeIds: incomingByNode.get(node.id) ?? [],
    outgoingNodeIds: outgoingByNode.get(node.id) ?? [],
  }));

  const entryNodeIds = nodes
    .filter((node) => node.incomingNodeIds.length === 0)
    .map((node) => node.id);
  const exitNodeIds = nodes
    .filter((node) => node.outgoingNodeIds.length === 0)
    .map((node) => node.id);

  const notes = [
    'Routerの各Edgeにはまだ分岐ラベルがないため、仕様書では接続先を分岐候補として表現する。',
    'State / Schema / Runtimeは現段階のGraph IRに含まれていない。',
    'ValidationのError / Warningは仕様書とは別レイヤーで管理する。',
  ];

  const lines: string[] = [
    `# ${project.name}`,
    '',
    '## 概要',
    `- Project ID: \`${project.id}\``,
    `- Nodes: ${project.nodes.length}`,
    `- Edges: ${project.edges.length}`,
    '',
    '## 入口 / 出口',
    `- 入口Node: ${connectedNames(entryNodeIds, nodeNames)}`,
    `- 出口Node: ${connectedNames(exitNodeIds, nodeNames)}`,
    '',
    '## Node定義',
  ];

  if (nodes.length === 0) {
    lines.push('- Nodeはまだありません。');
  } else {
    nodes.forEach((node, index) => {
      lines.push(
        '',
        `### ${index + 1}. ${node.name} (${kindLabels[node.kind]})`,
        `- ID: \`${node.id}\``,
        `- 説明: ${node.description.trim() || '(未設定)'}`,
        ...node.configLines.map((line) => `- ${line}`),
        `- 入力元: ${connectedNames(node.incomingNodeIds, nodeNames)}`,
        `- 出力先: ${connectedNames(node.outgoingNodeIds, nodeNames)}`,
      );
    });
  }

  lines.push('', '## 接続');
  if (connections.length === 0) {
    lines.push('- Edgeはまだありません。');
  } else {
    connections.forEach((connection, index) => {
      lines.push(`${index + 1}. ${connection.sourceName} → ${connection.targetName}`);
    });
  }

  lines.push('', '## 処理仕様');
  if (project.nodes.length === 0) {
    lines.push('- 処理はまだ定義されていません。');
  } else {
    for (const node of project.nodes) {
      const specNode = nodes.find((candidate) => candidate.id === node.id);
      if (specNode) {
        lines.push(behaviorLine(node, specNode, nodeNames));
      }
    }
  }

  lines.push('', '## 現在の制約', ...notes.map((note) => `- ${note}`));

  return {
    projectId: project.id,
    projectName: project.name,
    nodes,
    connections,
    entryNodeIds,
    exitNodeIds,
    notes,
    markdown: lines.join('\n'),
  };
};
