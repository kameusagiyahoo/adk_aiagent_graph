import {
  Background,
  Controls,
  ReactFlow,
  applyNodeChanges,
  type Connection,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { GraphEdge, GraphNode } from '../core/graph/types';
import { AgentNode } from '../nodes/AgentNode';
import { HumanInputNode } from '../nodes/HumanInputNode';
import { JoinNode } from '../nodes/JoinNode';
import { RouterNode } from '../nodes/RouterNode';
import { ToolNode } from '../nodes/ToolNode';
import { graphEdgeToCanvasEdge, graphNodeToCanvasNode } from './reactFlowAdapter';

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  router: RouterNode,
  tool: ToolNode,
  humanInput: HumanInputNode,
  join: JoinNode,
};

type CanvasProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodesChange: (nodes: GraphNode[]) => void;
  onConnectNodes: (sourceNodeId: string, targetNodeId: string) => void;
};

export function Canvas({ nodes, edges, onNodesChange, onConnectNodes }: CanvasProps) {
  const canvasNodes = nodes.map(graphNodeToCanvasNode);
  const canvasEdges = edges.map(graphEdgeToCanvasEdge);

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

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) {
      return;
    }

    onConnectNodes(connection.source, connection.target);
  };

  return (
    <div className="canvas-shell">
      <ReactFlow
        nodes={canvasNodes}
        edges={canvasEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onConnect={handleConnect}
        fitView
        minZoom={0.25}
        maxZoom={2}
        panOnScroll
        selectionOnDrag={false}
        connectionRadius={30}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
