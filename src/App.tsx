import { useState } from 'react';
import { Canvas } from './canvas/Canvas';
import { createEmptyProject, createGraphNode } from './core/graph/project';
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

  return (
    <main className="app-shell">
      <Toolbar onAddNode={addNode} nodeCount={project.nodes.length} />
      <section className="workspace">
        <Canvas nodes={project.nodes} onNodesChange={updateNodes} />
      </section>
      <footer className="status-bar">
        STEP 1B — 5 Node種別 / 追加 / ドラッグ移動
      </footer>
    </main>
  );
}
