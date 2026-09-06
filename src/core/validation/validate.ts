import type { GraphProject, ToolConfig } from '../graph/types';
import {
  defaultValidationPolicy,
  type ValidationIssue,
  type ValidationPolicy,
  type ValidationResult,
  type ValidationSeverity,
} from './types';

type IssueInput = Omit<ValidationIssue, 'id'>;

const pushIssue = (issues: ValidationIssue[], issue: IssueInput) => {
  issues.push({ ...issue, id: `${issue.code}-${issues.length + 1}` });
};

const missingToolMessage = (config: ToolConfig): string | null => {
  switch (config.toolType) {
    case 'custom':
      return config.functionName.trim() ? null : 'Custom ToolのFunction nameを入力してください。';
    case 'http':
      return config.url.trim() ? null : 'HTTP ToolのURLを入力してください。';
    case 'mcp':
      if (config.transport === 'stdio') {
        return config.command.trim() ? null : 'MCP stdioのCommandを入力してください。';
      }
      return config.url.trim() ? null : 'MCP SSEのURLを入力してください。';
    case 'search':
      return config.provider.trim() ? null : 'Search ToolのProviderを入力してください。';
    case 'database':
      return config.connectionRef.trim() ? null : 'Database ToolのConnection refを入力してください。';
    case 'file':
      return config.path.trim() ? null : 'File ToolのPathを入力してください。';
  }
};

const findCycleNodeIds = (project: GraphProject) => {
  const adjacency = new Map<string, string[]>();
  const nodeIds = new Set(project.nodes.map((node) => node.id));
  project.nodes.forEach((node) => adjacency.set(node.id, []));

  for (const edge of project.edges) {
    if (nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId)) {
      adjacency.get(edge.sourceNodeId)?.push(edge.targetNodeId);
    }
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const path: string[] = [];
  const cycleNodeIds = new Set<string>();

  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    path.push(nodeId);

    for (const nextId of adjacency.get(nodeId) ?? []) {
      if (visiting.has(nextId)) {
        const startIndex = path.lastIndexOf(nextId);
        path.slice(startIndex).forEach((id) => cycleNodeIds.add(id));
      } else {
        visit(nextId);
      }
    }

    path.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  project.nodes.forEach((node) => visit(node.id));
  return cycleNodeIds;
};

export const validateGraphProject = (
  project: GraphProject,
  policy: ValidationPolicy = defaultValidationPolicy,
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const nodeIdCounts = new Map<string, number>();
  const edgeIdCounts = new Map<string, number>();
  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();
  const nodeById = new Map(project.nodes.map((node) => [node.id, node]));
  const routerRouteEdges = new Map<string, Map<string, string[]>>();

  for (const node of project.nodes) {
    nodeIdCounts.set(node.id, (nodeIdCounts.get(node.id) ?? 0) + 1);
    incomingCounts.set(node.id, 0);
    outgoingCounts.set(node.id, 0);
  }

  for (const [nodeId, count] of nodeIdCounts) {
    if (count > 1) {
      pushIssue(issues, {
        code: 'duplicate-node-id',
        severity: 'error',
        message: `Node ID「${nodeId}」が重複しています。`,
        nodeId,
      });
    }
  }

  const nodeIds = new Set(nodeIdCounts.keys());

  for (const edge of project.edges) {
    edgeIdCounts.set(edge.id, (edgeIdCounts.get(edge.id) ?? 0) + 1);
    const sourceExists = nodeIds.has(edge.sourceNodeId);
    const targetExists = nodeIds.has(edge.targetNodeId);

    if (!sourceExists || !targetExists) {
      pushIssue(issues, {
        code: 'dangling-edge',
        severity: 'error',
        message: `Edge「${edge.id}」が存在しないNodeを参照しています。`,
        edgeId: edge.id,
      });
      continue;
    }

    outgoingCounts.set(edge.sourceNodeId, (outgoingCounts.get(edge.sourceNodeId) ?? 0) + 1);
    incomingCounts.set(edge.targetNodeId, (incomingCounts.get(edge.targetNodeId) ?? 0) + 1);

    const sourceNode = nodeById.get(edge.sourceNodeId);
    if (sourceNode?.kind === 'router') {
      const routeKey = edge.routeKey?.trim();
      if (!routeKey) {
        pushIssue(issues, {
          code: 'missing-router-route-key',
          severity: 'error',
          message: 'Routerから出るEdgeにはRoute keyを設定してください。',
          nodeId: sourceNode.id,
          edgeId: edge.id,
        });
      } else {
        const keys = routerRouteEdges.get(sourceNode.id) ?? new Map<string, string[]>();
        const edgeIds = keys.get(routeKey) ?? [];
        edgeIds.push(edge.id);
        keys.set(routeKey, edgeIds);
        routerRouteEdges.set(sourceNode.id, keys);
      }
    }
  }

  for (const [edgeId, count] of edgeIdCounts) {
    if (count > 1) {
      pushIssue(issues, {
        code: 'duplicate-edge-id',
        severity: 'error',
        message: `Edge ID「${edgeId}」が重複しています。`,
        edgeId,
      });
    }
  }

  for (const [routerId, keys] of routerRouteEdges) {
    for (const [routeKey, edgeIds] of keys) {
      if (edgeIds.length > 1) {
        edgeIds.forEach((edgeId) =>
          pushIssue(issues, {
            code: 'duplicate-router-route-key',
            severity: 'error',
            message: `Route key「${routeKey}」が同じRouter内で重複しています。`,
            nodeId: routerId,
            edgeId,
          }),
        );
      }
    }
  }

  for (const node of project.nodes) {
    const incoming = incomingCounts.get(node.id) ?? 0;
    const outgoing = outgoingCounts.get(node.id) ?? 0;

    if (!node.name.trim()) {
      pushIssue(issues, {
        code: 'missing-name',
        severity: 'error',
        message: 'Node名を入力してください。',
        nodeId: node.id,
      });
    }

    switch (node.kind) {
      case 'agent':
        if (!node.config.instruction.trim()) {
          pushIssue(issues, {
            code: 'missing-agent-instruction',
            severity: 'error',
            message: 'AgentのInstructionを入力してください。',
            nodeId: node.id,
          });
        }
        break;
      case 'router':
        if (!node.config.condition.trim()) {
          pushIssue(issues, {
            code: 'missing-router-condition',
            severity: 'error',
            message: 'RouterのConditionを入力してください。',
            nodeId: node.id,
          });
        }
        if (outgoing < 2) {
          pushIssue(issues, {
            code: 'router-branch-shortage',
            severity: 'warning',
            message: 'Routerには2本以上の出力先を接続してください。',
            nodeId: node.id,
          });
        }
        break;
      case 'tool': {
        const message = missingToolMessage(node.config);
        if (message) {
          pushIssue(issues, {
            code: 'missing-tool-config',
            severity: 'error',
            message,
            nodeId: node.id,
          });
        }
        break;
      }
      case 'humanInput':
        if (!node.config.prompt.trim()) {
          pushIssue(issues, {
            code: 'missing-human-prompt',
            severity: 'error',
            message: 'HumanInputのPromptを入力してください。',
            nodeId: node.id,
          });
        }
        break;
      case 'join':
        if (incoming < 2) {
          pushIssue(issues, {
            code: 'join-input-shortage',
            severity: 'warning',
            message: 'Joinには2本以上の入力を接続してください。',
            nodeId: node.id,
          });
        }
        break;
    }

    if (incoming === 0 && outgoing === 0) {
      pushIssue(issues, {
        code: 'isolated-node',
        severity: 'warning',
        message: 'このNodeは他のNodeと接続されていません。',
        nodeId: node.id,
      });
    }
  }

  if (policy.cycleSeverity !== 'off') {
    for (const nodeId of findCycleNodeIds(project)) {
      pushIssue(issues, {
        code: 'cycle',
        severity: policy.cycleSeverity as ValidationSeverity,
        message: 'このNodeは循環経路に含まれています。',
        nodeId,
      });
    }
  }

  return {
    issues,
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
  };
};
