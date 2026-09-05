import type { Node } from '@xyflow/react';
import type { GraphNode } from '../core/graph/types';
import type { AgentNodeData } from '../nodes/AgentNode';

export type CanvasNode = Node<AgentNodeData>;

export const graphNodeToCanvasNode = (node: GraphNode): CanvasNode => ({
  id: node.id,
  type: node.kind,
  position: node.position,
  data: {
    name: node.name,
    description: node.description,
  },
});
