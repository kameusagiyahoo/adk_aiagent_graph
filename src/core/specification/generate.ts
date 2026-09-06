import type { GraphNode, GraphProject, NodeKind, ToolConfig } from '../graph/types';
import type { SpecificationConnection, SpecificationDocument, SpecificationNode } from './types';

const kindLabels: Record<NodeKind, string> = {
  agent: 'Agent',
  router: 'Router',
  tool: 'Tool',
  humanInput: 'HumanInput',
  join: 'Join',
};

const valueOrUnset = (value: string) => value.trim() || '(未設定)';
const inline = (value: string) => value.replace(/`/g, "'");

const toolConfigLines = (config: ToolConfig): string[] => {
  switch (config.toolType) {
    case 'custom': return [`Tool type: custom`, `Function name: ${valueOrUnset(config.functionName)}`, `Function description: ${valueOrUnset(config.description)}`];
    case 'http': return [`Tool type: http`, `Method: ${config.method}`, `URL: ${valueOrUnset(config.url)}`];
    case 'mcp': return config.transport === 'stdio'
      ? [`Tool type: mcp`, `Transport: stdio`, `Command: ${valueOrUnset(config.command)}`, `Args: ${valueOrUnset(config.args)}`]
      : [`Tool type: mcp`, `Transport: sse`, `URL: ${valueOrUnset(config.url)}`];
    case 'search': return [`Tool type: search`, `Provider: ${valueOrUnset(config.provider)}`];
    case 'database': return [`Tool type: database`, `Connection ref: ${valueOrUnset(config.connectionRef)}`, `Operation: ${valueOrUnset(config.operation)}`];
    case 'file': return [`Tool type: file`, `Operation: ${config.operation}`, `Path: ${valueOrUnset(config.path)}`];
  }
};

const configLinesForNode = (node: GraphNode): string[] => {
  switch (node.kind) {
    case 'agent': return [`Instruction: ${valueOrUnset(node.config.instruction)}`];
    case 'router': return [`Condition: ${valueOrUnset(node.config.condition)}`];
    case 'tool': return toolConfigLines(node.config);
    case 'humanInput': return [`Prompt: ${valueOrUnset(node.config.prompt)}`];
    case 'join': return [`Strategy: ${node.config.strategy}`];
  }
};

const connectedNames = (ids: string[], names: Map<string, string>) =>
  ids.length > 0 ? ids.map((id) => names.get(id) ?? id).join(' / ') : 'なし';

const behaviorLine = (node: GraphNode, specNode: SpecificationNode, names: Map<string, string>) => {
  const incoming = connectedNames(specNode.incomingNodeIds, names);
  const outgoing = connectedNames(specNode.outgoingNodeIds, names);
  switch (node.kind) {
    case 'agent': return `- **${node.name}**: Instruction「${inline(valueOrUnset(node.config.instruction))}」に従って判断・処理する。入力元: ${incoming}。出力先: ${outgoing}。`;
    case 'router': return `- **${node.name}**: Condition「${inline(valueOrUnset(node.config.condition))}」を評価し、EdgeのRoute keyに対応する処理先へ分岐する。入力元: ${incoming}。候補: ${outgoing}。`;
    case 'tool': return `- **${node.name}**: ${node.config.toolType} Toolとして外部処理を実行する。入力元: ${incoming}。出力先: ${outgoing}。`;
    case 'humanInput': return `- **${node.name}**: ユーザーに「${inline(valueOrUnset(node.config.prompt))}」を提示し、追加情報または承認を受け取る。入力元: ${incoming}。出力先: ${outgoing}。`;
    case 'join': return `- **${node.name}**: ${incoming} から来る複数結果を strategy=${node.config.strategy} で統合し、${outgoing} へ渡す。`;
  }
};

export const generateGraphSpecification = (project: GraphProject): SpecificationDocument => {
  const nodeNames = new Map<string, string>();
  const incomingByNode = new Map<string, string[]>();
  const outgoingByNode = new Map<string, string[]>();

  project.nodes.forEach((node) => {
    if (!nodeNames.has(node.id)) {
      nodeNames.set(node.id, node.name || node.id);
      incomingByNode.set(node.id, []);
      outgoingByNode.set(node.id, []);
    }
  });

  const connections: SpecificationConnection[] = [];
  for (const edge of project.edges) {
    if (!nodeNames.has(edge.sourceNodeId) || !nodeNames.has(edge.targetNodeId)) continue;
    outgoingByNode.get(edge.sourceNodeId)?.push(edge.targetNodeId);
    incomingByNode.get(edge.targetNodeId)?.push(edge.sourceNodeId);
    connections.push({
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      sourceName: nodeNames.get(edge.sourceNodeId) ?? edge.sourceNodeId,
      targetName: nodeNames.get(edge.targetNodeId) ?? edge.targetNodeId,
      ...(edge.routeKey?.trim() ? { routeKey: edge.routeKey.trim() } : {}),
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

  const entryNodeIds = nodes.filter((node) => node.incomingNodeIds.length === 0).map((node) => node.id);
  const exitNodeIds = nodes.filter((node) => node.outgoingNodeIds.length === 0).map((node) => node.id);
  const notes = [
    'Router分岐は各EdgeのRoute keyで明示する。',
    'State / Schema / Runtimeは現段階のGraph IRに含まれていない。',
    'Secret値はTool設定へ直接保存せず、Connection ref等で外部設定を参照する。',
  ];

  const lines: string[] = [
    `# ${project.name}`, '', '## 概要', `- Project ID: \`${project.id}\``, `- Nodes: ${project.nodes.length}`, `- Edges: ${project.edges.length}`, '',
    '## 入口 / 出口', `- 入口Node: ${connectedNames(entryNodeIds, nodeNames)}`, `- 出口Node: ${connectedNames(exitNodeIds, nodeNames)}`, '', '## Node定義',
  ];

  if (nodes.length === 0) lines.push('- Nodeはまだありません。');
  else nodes.forEach((node, index) => lines.push('', `### ${index + 1}. ${node.name} (${kindLabels[node.kind]})`, `- ID: \`${node.id}\``, `- 説明: ${node.description.trim() || '(未設定)'}`, ...node.configLines.map((line) => `- ${line}`), `- 入力元: ${connectedNames(node.incomingNodeIds, nodeNames)}`, `- 出力先: ${connectedNames(node.outgoingNodeIds, nodeNames)}`));

  lines.push('', '## 接続');
  if (connections.length === 0) lines.push('- Edgeはまだありません。');
  else connections.forEach((connection, index) => lines.push(`${index + 1}. ${connection.sourceName}${connection.routeKey ? ` --[${connection.routeKey}]` : ''} → ${connection.targetName}`));

  lines.push('', '## 処理仕様');
  if (project.nodes.length === 0) lines.push('- 処理はまだ定義されていません。');
  else for (const node of project.nodes) {
    const specNode = nodes.find((candidate) => candidate.id === node.id);
    if (specNode) lines.push(behaviorLine(node, specNode, nodeNames));
  }

  lines.push('', '## 現在の制約', ...notes.map((note) => `- ${note}`));
  return { projectId: project.id, projectName: project.name, nodes, connections, entryNodeIds, exitNodeIds, notes, markdown: lines.join('\n') };
};
