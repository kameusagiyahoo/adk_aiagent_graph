import { useEffect, useState } from 'react';
import { analyzeAdkAdapter } from './adapters/adk/analyze';
import { Canvas } from './canvas/Canvas';
import {
  createGraphEdge,
  createGraphNode,
  removeGraphNodeFromProject,
  replaceGraphNodeInProject,
} from './core/graph/project';
import type { GraphNode, GraphProject, NodeKind } from './core/graph/types';
import { generateCodingPrompt } from './core/prompt/generate';
import { generateGraphSpecification } from './core/specification/generate';
import { validateGraphProject } from './core/validation/validate';
import { downloadGraphProjectJson, parseGraphProjectJson } from './storage/json';
import {
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
} from './storage/localStorage';
import { AdkAdapterPreview } from './ui/AdkAdapterPreview';
import { NodeInspector } from './ui/NodeInspector';
import { PromptPreview } from './ui/PromptPreview';
import { SpecificationPreview } from './ui/SpecificationPreview';
import { Toolbar } from './ui/Toolbar';
import { ValidationSummary } from './ui/ValidationSummary';
import './styles.css';

export default function App() {
  const [project, setProject] = useState<GraphProject>(loadProjectFromLocalStorage);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSpecificationOpen, setSpecificationOpen] = useState(false);
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [isAdkOpen, setAdkOpen] = useState(false);

  const selectedNode = project.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const validation = validateGraphProject(project);
  const specification = generateGraphSpecification(project);
  const codingPrompt = generateCodingPrompt(project, specification, validation);
  const adkAnalysis = analyzeAdkAdapter(project);
  const selectedNodeIssues = selectedNodeId
    ? validation.issues.filter((issue) => issue.nodeId === selectedNodeId)
    : [];

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
      setSpecificationOpen(false);
      setPromptOpen(false);
      setAdkOpen(false);
      window.alert('Graph JSONを読み込みました。');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSONの読み込みに失敗しました。';
      window.alert(message);
    }
  };

  const closeOverlays = () => {
    setSelectedNodeId(null);
    setSpecificationOpen(false);
    setPromptOpen(false);
    setAdkOpen(false);
  };

  const openSpecification = () => {
    closeOverlays();
    setSpecificationOpen(true);
  };

  const openPrompt = () => {
    closeOverlays();
    setPromptOpen(true);
  };

  const openAdk = () => {
    closeOverlays();
    setAdkOpen(true);
  };

  return (
    <main className="app-shell">
      <Toolbar
        onAddNode={addNode}
        nodeCount={project.nodes.length}
        edgeCount={project.edges.length}
        onExport={() => downloadGraphProjectJson(project)}
        onImport={importProject}
        onOpenSpecification={openSpecification}
        onOpenPrompt={openPrompt}
        onOpenAdk={openAdk}
      />
      <section className="workspace">
        <ValidationSummary result={validation} />
        <Canvas
          nodes={project.nodes}
          edges={project.edges}
          validationIssues={validation.issues}
          selectedNodeId={selectedNodeId}
          onNodesChange={updateNodes}
          onConnectNodes={connectNodes}
          onSelectNode={setSelectedNodeId}
        />
      </section>
      <footer className="status-bar">
        STEP 3A — Google ADK 2.x Graph WorkflowへのMapping readinessを確認
      </footer>

      <NodeInspector
        node={selectedNode}
        issues={selectedNodeIssues}
        onChange={updateNode}
        onDelete={deleteNode}
        onClose={() => setSelectedNodeId(null)}
      />

      {isSpecificationOpen && (
        <SpecificationPreview
          projectName={project.name}
          markdown={specification.markdown}
          errorCount={validation.errors.length}
          warningCount={validation.warnings.length}
          onClose={() => setSpecificationOpen(false)}
        />
      )}

      {isPromptOpen && (
        <PromptPreview
          projectName={project.name}
          markdown={codingPrompt.markdown}
          errorCount={codingPrompt.validationErrorCount}
          warningCount={codingPrompt.validationWarningCount}
          onClose={() => setPromptOpen(false)}
        />
      )}

      {isAdkOpen && (
        <AdkAdapterPreview
          projectName={project.name}
          analysis={adkAnalysis}
          onClose={() => setAdkOpen(false)}
        />
      )}
    </main>
  );
}
