export type NodeKind = 'agent';

export type GraphPosition = {
  x: number;
  y: number;
};

export type AgentConfig = {
  instruction: string;
};

export type AgentGraphNode = {
  id: string;
  kind: 'agent';
  name: string;
  description: string;
  position: GraphPosition;
  config: AgentConfig;
};

export type GraphNode = AgentGraphNode;

export type GraphProject = {
  id: string;
  version: 1;
  name: string;
  nodes: GraphNode[];
  edges: [];
};
