import type { Edge, Node } from '@xyflow/react';
import type { GraphEdge, GraphNode } from '../core/graph/types';
import type { BaseNodeData } from '../nodes/BaseNode';

export type CanvasNode = Node<BaseNodeData>;
export type CanvasEdge = Edge;

export const graphNodeToCanvasNode = (node: GraphNode, selected = false): CanvasNode => ({
  id: node.id,
  type: node.kind,
  position: node.position,
  selected,
  data: {
    kind: node.kind,
    name: node.name,
    description: node.description,
  },
});

export const graphEdgeToCanvasEdge = (edge: GraphEdge): CanvasEdge => ({
  id: edge.id,
  source: edge.sourceNodeId,
  sourceHandle: edge.sourcePortId,
  target: edge.targetNodeId,
  targetHandle: edge.targetPortId,
  type: 'smoothstep',
});
