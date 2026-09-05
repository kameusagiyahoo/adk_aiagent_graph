import { useState } from 'react';
import { Canvas } from './canvas/Canvas';
import { createAgentNode, createEmptyProject } from './core/graph/project';
import type { GraphProject } from './core/graph/types';
import { Toolbar } from './ui/Toolbar';
import './styles.css';

export default function App() {
  const [project, setProject] = useState<GraphProject>(createEmptyProject);

  const addAgent = () => {
    setProject((current) => ({
      ...current,
      nodes: [...current.nodes, createAgentNode(current.nodes.length)],
    }));
  };

  const updateNodes: React.ComponentProps<typeof Canvas>['onNodesChange'] = (nodes) => {
    setProject((current) => ({ ...current, nodes }));
  };

  return (
    <main className="app-shell">
      <Toolbar onAddAgent={addAgent} nodeCount={project.nodes.length} />
      <section className="workspace">
        <Canvas nodes={project.nodes} onNodesChange={updateNodes} />
      </section>
      <footer className="status-bar">
        STEP 1 — Canvas / Agent追加 / ドラッグ移動のみ
      </footer>
    </main>
  );
}
