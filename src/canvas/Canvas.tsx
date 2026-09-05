import {
  Background,
  Controls,
  ReactFlow,
  applyNodeChanges,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { GraphNode } from '../core/graph/types';
import { AgentNode } from '../nodes/AgentNode';
import { graphNodeToCanvasNode } from './reactFlowAdapter';

const nodeTypes: NodeTypes = {
  agent: AgentNode,
};

type CanvasProps = {
  nodes: GraphNode[];
  onNodesChange: (nodes: GraphNode[]) => void;
};

export function Canvas({ nodes, onNodesChange }: CanvasProps) {
  const canvasNodes = nodes.map(graphNodeToCanvasNode);

  const handleNodesChange = (changes: NodeChange[]) => {
    const nextCanvasNodes = applyNodeChanges(changes, canvasNodes);
    const positions = new Map(nextCanvasNodes.map((node) => [node.id, node.position]));

    onNodesChange(
      nodes.map((node) => ({
        ...node,
        position: positions.get(node.id) ?? node.position,
      })),
    );
  };

  return (
    <div className="canvas-shell">
      <ReactFlow
        nodes={canvasNodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        fitView
        minZoom={0.25}
        maxZoom={2}
        panOnScroll
        selectionOnDrag={false}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
