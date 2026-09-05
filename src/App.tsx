import { useState } from 'react';
import { Canvas } from './canvas/Canvas';
import { createEmptyProject, createGraphEdge, createGraphNode } from './core/graph/project';
import type { GraphProject, NodeKind } from './core/graph/types';
import { Toolbar } from './ui/Toolbar';
import './styles.css';

export default function App() {
  const [project, setProject] = useState<GraphProject>(createEmptyProject);

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

  return (
    <main className="app-shell">
      <Toolbar onAddNode={addNode} nodeCount={project.nodes.length} />
      <section className="workspace">
        <Canvas
          nodes={project.nodes}
          edges={project.edges}
          onNodesChange={updateNodes}
          onConnectNodes={connectNodes}
        />
      </section>
      <footer className="status-bar">
        STEP 1C — Node右側のOutputから別Node左側のInputへドラッグして接続
      </footer>
    </main>
  );
}
