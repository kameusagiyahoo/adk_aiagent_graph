import { useState } from 'react';
import { Canvas } from './canvas/Canvas';
import {
  createEmptyProject,
  createGraphEdge,
  createGraphNode,
  removeGraphNodeFromProject,
  replaceGraphNodeInProject,
} from './core/graph/project';
import type { GraphNode, GraphProject, NodeKind } from './core/graph/types';
import { NodeInspector } from './ui/NodeInspector';
import { Toolbar } from './ui/Toolbar';
import './styles.css';

export default function App() {
  const [project, setProject] = useState<GraphProject>(createEmptyProject);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = project.nodes.find((node) => node.id === selectedNodeId) ?? null;

  const addNode = (kind: NodeKind) => {
    setProject((current) => {
      const kindIndex = current.nodes.filter((node) => node.kind === kind).length;
      const node = createGraphNode(kind, kindIndex, current.nodes.length);

      return {
        ...current,
        nodes: [...current.nodes, node],
      };
    });
  };

  const updateNodes: React.ComponentProps<typeof Canvas>['onNodesChange'] = (nodes) => {
    setProject((current) => ({ ...current, nodes }));
  };

  const connectNodes: React.ComponentProps<typeof Canvas>['onConnectNodes'] = (
    sourceNodeId,
    targetNodeId,
  ) => {
    setProject((current) => {
      const duplicate = current.edges.some(
        (edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId,
      );

      if (duplicate) {
        return current;
      }

      return {
        ...current,
        edges: [...current.edges, createGraphEdge(sourceNodeId, targetNodeId)],
      };
    });
  };

  const updateNode = (node: GraphNode) => {
    setProject((current) => replaceGraphNodeInProject(current, node));
  };

  const deleteNode = (nodeId: string) => {
    setProject((current) => removeGraphNodeFromProject(current, nodeId));
    setSelectedNodeId(null);
  };

  return (
    <main className="app-shell">
      <Toolbar onAddNode={addNode} nodeCount={project.nodes.length} />
      <section className="workspace">
        <Canvas
          nodes={project.nodes}
          edges={project.edges}
          selectedNodeId={selectedNodeId}
          onNodesChange={updateNodes}
          onConnectNodes={connectNodes}
          onSelectNode={setSelectedNodeId}
        />
      </section>
      <footer className="status-bar">
        STEP 1D — Nodeをタップして設定編集 / 削除
      </footer>

      <NodeInspector
        node={selectedNode}
        onChange={updateNode}
        onDelete={deleteNode}
        onClose={() => setSelectedNodeId(null)}
      />
    </main>
  );
}
