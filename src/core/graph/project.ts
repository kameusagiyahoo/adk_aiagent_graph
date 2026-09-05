import type { AgentGraphNode, GraphProject } from './types';

export const createEmptyProject = (): GraphProject => ({
  id: 'project-local',
  version: 1,
  name: 'Untitled Project',
  nodes: [],
  edges: [],
});

export const createAgentNode = (
  index: number,
  position = { x: 80 + index * 24, y: 80 + index * 24 },
): AgentGraphNode => ({
  id: `agent-${crypto.randomUUID()}`,
  kind: 'agent',
  name: `Agent ${index + 1}`,
  description: 'LLMなどで判断・処理する主体',
  position,
  config: {
    instruction: '',
  },
});
