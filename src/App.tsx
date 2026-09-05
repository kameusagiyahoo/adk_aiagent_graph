import { useEffect, useState } from 'react';
import { Canvas } from './canvas/Canvas';
import {
  createGraphEdge,
  createGraphNode,
  removeGraphNodeFromProject,
  replaceGraphNodeInProject,
} from './core/graph/project';
import type { GraphNode, GraphProject, NodeKind } from './core/graph/types';
import { downloadGraphProjectJson, parseGraphProjectJson } from './storage/json';
import {
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
} from './storage/localStorage';
import { NodeInspector } from './ui/NodeInspector';
import { Toolbar } from './ui/Toolbar';
import './styles.css';

export default function App() {
  const [project, setProject] = useState<GraphProject>(loadProjectFromLocalStorage);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = project.nodes.find((node) => node.id === selectedNodeId) ?? null;

  useEffect(() => {
    saveProjectToLocalStorage(project);
  }, [project]);

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

  const importProject = async (file: File) => {
    try {
      const text = await file.text();
      const importedProject = parseGraphProjectJson(text);
      setProject(importedProject);
      setSelectedNodeId(null);
      window.alert('Graph JSONを読み込みました。');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSONの読み込みに失敗しました。';
      window.alert(message);
    }
  };

  return (
    <main className="app-shell">
      <Toolbar
        onAddNode={addNode}
        nodeCount={project.nodes.length}
        edgeCount={project.edges.length}
        onExport={() => downloadGraphProjectJson(project)}
        onImport={importProject}
      />
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
        STEP 1E — 自動保存 / JSON書き出し・読み込み
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
