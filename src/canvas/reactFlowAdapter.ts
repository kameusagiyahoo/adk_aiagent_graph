import type { Node } from '@xyflow/react';
import type { GraphNode } from '../core/graph/types';
import type { BaseNodeData } from '../nodes/BaseNode';

export type CanvasNode = Node<BaseNodeData>;

export const graphNodeToCanvasNode = (node: GraphNode): CanvasNode => ({
  id: node.id,
  type: node.kind,
  position: node.position,
  data: {
    kind: node.kind,
    name: node.name,
    description: node.description,
  },
});
