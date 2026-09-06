import type { NodeKind } from '../graph/types';

export type SpecificationNode = {
  id: string;
  kind: NodeKind;
  name: string;
  description: string;
  configLines: string[];
  incomingNodeIds: string[];
  outgoingNodeIds: string[];
};

export type SpecificationConnection = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceName: string;
  targetName: string;
  routeKey?: string;
};

export type SpecificationDocument = {
  projectId: string;
  projectName: string;
  nodes: SpecificationNode[];
  connections: SpecificationConnection[];
  entryNodeIds: string[];
  exitNodeIds: string[];
  notes: string[];
  markdown: string;
};
