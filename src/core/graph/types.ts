export type NodeKind = 'agent' | 'router' | 'tool' | 'humanInput' | 'join';

export type GraphPosition = {
  x: number;
  y: number;
};

type BaseGraphNode<Kind extends NodeKind, Config> = {
  id: string;
  kind: Kind;
  name: string;
  description: string;
  position: GraphPosition;
  config: Config;
};

export type AgentConfig = {
  instruction: string;
};

export type RouterConfig = {
  condition: string;
};

export type ToolConfig = {
  toolType: string;
};

export type HumanInputConfig = {
  prompt: string;
};

export type JoinConfig = {
  strategy: 'all';
};

export type AgentGraphNode = BaseGraphNode<'agent', AgentConfig>;
export type RouterGraphNode = BaseGraphNode<'router', RouterConfig>;
export type ToolGraphNode = BaseGraphNode<'tool', ToolConfig>;
export type HumanInputGraphNode = BaseGraphNode<'humanInput', HumanInputConfig>;
export type JoinGraphNode = BaseGraphNode<'join', JoinConfig>;

export type GraphNode =
  | AgentGraphNode
  | RouterGraphNode
  | ToolGraphNode
  | HumanInputGraphNode
  | JoinGraphNode;

export type GraphProject = {
  id: string;
  version: 1;
  name: string;
  nodes: GraphNode[];
  edges: [];
};
