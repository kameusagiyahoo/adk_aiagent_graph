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
import type { ValidationIssue } from '../core/validation/types';
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
  validationIssues: ValidationIssue[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  runtimeNodeOrder: Record<string, number>;
  runtimeEdgeIds: string[];
  onNodesChange: (nodes: GraphNode[]) => void;
  onConnectNodes: (sourceNodeId: string, targetNodeId: string) => void;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
};

export function Canvas({
  nodes,
  edges,
  validationIssues,
  selectedNodeId,
  selectedEdgeId,
  runtimeNodeOrder,
  runtimeEdgeIds,
  onNodesChange,
  onConnectNodes,
  onSelectNode,
  onSelectEdge,
}: CanvasProps) {
  const runtimeEdges = new Set(runtimeEdgeIds);
  const canvasNodes = nodes.map((node) =>
    graphNodeToCanvasNode(
      node,
      node.id === selectedNodeId,
      validationIssues.filter((issue) => issue.nodeId === node.id),
      runtimeNodeOrder[node.id],
    ),
  );
  const canvasEdges = edges.map((edge) =>
    graphEdgeToCanvasEdge(edge, edge.id === selectedEdgeId, runtimeEdges.has(edge.id)),
  );

  const handleNodesChange = (changes: NodeChange[]) => {
    const nextCanvasNodes = applyNodeChanges(changes, canvasNodes);
    const positions = new Map(nextCanvasNodes.map((node) => [node.id, node.position]));
    onNodesChange(nodes.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })));
  };

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
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
        onNodeClick={(_, node) => { onSelectEdge(null); onSelectNode(node.id); }}
        onEdgeClick={(_, edge) => { onSelectNode(null); onSelectEdge(edge.id); }}
        onPaneClick={() => { onSelectNode(null); onSelectEdge(null); }}
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
