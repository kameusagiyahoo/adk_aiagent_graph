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

export type ToolType = 'custom' | 'http' | 'mcp' | 'search' | 'database' | 'file';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type McpTransport = 'stdio' | 'sse';
export type FileOperation = 'read' | 'write' | 'list';

export type CustomToolConfig = {
  toolType: 'custom';
  functionName: string;
  description: string;
};

export type HttpToolConfig = {
  toolType: 'http';
  method: HttpMethod;
  url: string;
};

export type McpToolConfig = {
  toolType: 'mcp';
  transport: McpTransport;
  command: string;
  args: string;
  url: string;
};

export type SearchToolConfig = {
  toolType: 'search';
  provider: string;
};

export type DatabaseToolConfig = {
  toolType: 'database';
  connectionRef: string;
  operation: string;
};

export type FileToolConfig = {
  toolType: 'file';
  operation: FileOperation;
  path: string;
};

export type ToolConfig =
  | CustomToolConfig
  | HttpToolConfig
  | McpToolConfig
  | SearchToolConfig
  | DatabaseToolConfig
  | FileToolConfig;

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

export type GraphEdge = {
  id: string;
  sourceNodeId: string;
  sourcePortId: 'out';
  targetNodeId: string;
  targetPortId: 'in';
  routeKey?: string;
};

export type GraphProject = {
  id: string;
  version: 1;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};
