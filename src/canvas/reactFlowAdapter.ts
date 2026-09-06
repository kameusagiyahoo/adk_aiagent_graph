import type { Edge, Node } from '@xyflow/react';
import type { GraphEdge, GraphNode } from '../core/graph/types';
import type { ValidationIssue } from '../core/validation/types';
import type { BaseNodeData } from '../nodes/BaseNode';

export type CanvasNode = Node<BaseNodeData>;
export type CanvasEdge = Edge;

export const graphNodeToCanvasNode = (
  node: GraphNode,
  selected = false,
  issues: ValidationIssue[] = [],
): CanvasNode => ({
  id: node.id,
  type: node.kind,
  position: node.position,
  selected,
  data: {
    kind: node.kind,
    name: node.name,
    description: node.description,
    validation: {
      errorCount: issues.filter((issue) => issue.severity === 'error').length,
      warningCount: issues.filter((issue) => issue.severity === 'warning').length,
    },
  },
});

export const graphEdgeToCanvasEdge = (edge: GraphEdge, selected = false): CanvasEdge => ({
  id: edge.id,
  source: edge.sourceNodeId,
  sourceHandle: edge.sourcePortId,
  target: edge.targetNodeId,
  targetHandle: edge.targetPortId,
  type: 'smoothstep',
  selected,
  label: edge.routeKey?.trim() || undefined,
  interactionWidth: 30,
  labelBgPadding: [6, 3],
  labelBgBorderRadius: 6,
});
