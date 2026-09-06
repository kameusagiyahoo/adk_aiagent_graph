import { useEffect, useState } from 'react';
import { analyzeAdkAdapter } from './adapters/adk/analyze';
import { generateAdkProject } from './adapters/adk/codegen';
import {
  loadAdkAdapterSettings,
  saveAdkAdapterSettings,
} from './adapters/adk/settings';
import { Canvas } from './canvas/Canvas';
import {
  createGraphEdge,
  createGraphNode,
  removeGraphEdgeFromProject,
  removeGraphNodeFromProject,
  replaceGraphEdgeInProject,
  replaceGraphNodeInProject,
} from './core/graph/project';
import type { GraphEdge, GraphNode, GraphProject, NodeKind } from './core/graph/types';
import { generateCodingPrompt } from './core/prompt/generate';
import { generateGraphSpecification } from './core/specification/generate';
import { validateGraphProject } from './core/validation/validate';
import {
  loadRuntimeBridgeSettings,
  saveRuntimeBridgeSettings,
} from './runtime/bridge/settings';
import { downloadGraphProjectJson, parseGraphProjectJson } from './storage/json';
import {
  loadProjectFromLocalStorage,
  saveProjectToLocalStorage,
} from './storage/localStorage';
import { AdkAdapterPreview } from './ui/AdkAdapterPreview';
import { AdkCodePreview } from './ui/AdkCodePreview';
import { EdgeInspector } from './ui/EdgeInspector';
import { NodeInspector } from './ui/NodeInspector';
import { PromptPreview } from './ui/PromptPreview';
import { RuntimeValidationPreview } from './ui/RuntimeValidationPreview';
import { SpecificationPreview } from './ui/SpecificationPreview';
import { Toolbar } from './ui/Toolbar';
import { ValidationSummary } from './ui/ValidationSummary';
import './styles.css';

export default function App() {
  const [project, setProject] = useState<GraphProject>(loadProjectFromLocalStorage);
  const [adkSettings, setAdkSettings] = useState(loadAdkAdapterSettings);
  const [runtimeSettings, setRuntimeSettings] = useState(loadRuntimeBridgeSettings);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isSpecificationOpen, setSpecificationOpen] = useState(false);
  const [isPromptOpen, setPromptOpen] = useState(false);
  const [isAdkOpen, setAdkOpen] = useState(false);
  const [isAdkCodeOpen, setAdkCodeOpen] = useState(false);
  const [isRuntimeOpen, setRuntimeOpen] = useState(false);

  const selectedNode = project.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = project.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedEdgeSource = selectedEdge
    ? project.nodes.find((node) => node.id === selectedEdge.sourceNodeId) ?? null
    : null;
  const selectedEdgeTarget = selectedEdge
    ? project.nodes.find((node) => node.id === selectedEdge.targetNodeId) ?? null
    : null;

  const validation = validateGraphProject(project);
  const specification = generateGraphSpecification(project);
  const codingPrompt = generateCodingPrompt(project, specification, validation);
  const adkAnalysis = analyzeAdkAdapter(project, adkSettings);
  const adkGeneration = generateAdkProject(project, adkSettings, validation, adkAnalysis);
  const selectedNodeIssues = selectedNodeId
    ? validation.issues.filter((issue) => issue.nodeId === selectedNodeId)
    : [];
  const selectedEdgeIssues = selectedEdgeId
    ? validation.issues.filter((issue) => issue.edgeId === selectedEdgeId)
    : [];

  useEffect(() => {
    saveProjectToLocalStorage(project);
  }, [project]);

  useEffect(() => {
    saveAdkAdapterSettings(adkSettings);
  }, [adkSettings]);

  useEffect(() => {
    saveRuntimeBridgeSettings(runtimeSettings);
  }, [runtimeSettings]);

  const addNode = (kind: NodeKind) => {
    setProject((current) => {
      const kindIndex = current.nodes.filter((node) => node.kind === kind).length;
      return {
        ...current,
        nodes: [...current.nodes, createGraphNode(kind, kindIndex, current.nodes.length)],
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
      if (duplicate) return current;
      return { ...current, edges: [...current.edges, createGraphEdge(sourceNodeId, targetNodeId)] };
    });
  };

  const updateNode = (node: GraphNode) => {
    setProject((current) => replaceGraphNodeInProject(current, node));
  };

  const updateEdge = (edge: GraphEdge) => {
    setProject((current) => replaceGraphEdgeInProject(current, edge));
  };

  const deleteNode = (nodeId: string) => {
    setProject((current) => removeGraphNodeFromProject(current, nodeId));
    setSelectedNodeId(null);
  };

  const deleteEdge = (edgeId: string) => {
    setProject((current) => removeGraphEdgeFromProject(current, edgeId));
    setSelectedEdgeId(null);
  };

  const importProject = async (file: File) => {
    try {
      const importedProject = parseGraphProjectJson(await file.text());
      setProject(importedProject);
      closeOverlays();
      window.alert('Graph JSONを読み込みました。');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSONの読み込みに失敗しました。';
      window.alert(message);
    }
  };

  const closeOverlays = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSpecificationOpen(false);
    setPromptOpen(false);
    setAdkOpen(false);
    setAdkCodeOpen(false);
    setRuntimeOpen(false);
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

  const openAdkCode = () => {
    closeOverlays();
    setAdkCodeOpen(true);
  };

  const openRuntime = () => {
    closeOverlays();
    setRuntimeOpen(true);
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
        onOpenAdkCode={openAdkCode}
        onOpenRuntime={openRuntime}
      />
      <section className="workspace">
        <ValidationSummary result={validation} />
        <Canvas
          nodes={project.nodes}
          edges={project.edges}
          validationIssues={validation.issues}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onNodesChange={updateNodes}
          onConnectNodes={connectNodes}
          onSelectNode={setSelectedNodeId}
          onSelectEdge={setSelectedEdgeId}
        />
      </section>
      <footer className="status-bar">
        STEP 4A — Local Bridge / Python構文・ADK import・Workflow構築検証
      </footer>

      <NodeInspector
        node={selectedNode}
        issues={selectedNodeIssues}
        onChange={updateNode}
        onDelete={deleteNode}
        onClose={() => setSelectedNodeId(null)}
      />

      <EdgeInspector
        edge={selectedEdge}
        sourceNode={selectedEdgeSource}
        targetNode={selectedEdgeTarget}
        issues={selectedEdgeIssues}
        onChange={updateEdge}
        onDelete={deleteEdge}
        onClose={() => setSelectedEdgeId(null)}
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
          settings={adkSettings}
          onSettingsChange={setAdkSettings}
          onClose={() => setAdkOpen(false)}
        />
      )}

      {isAdkCodeOpen && (
        <AdkCodePreview
          projectName={project.name}
          generation={adkGeneration}
          onClose={() => setAdkCodeOpen(false)}
        />
      )}

      {isRuntimeOpen && (
        <RuntimeValidationPreview
          generation={adkGeneration}
          settings={runtimeSettings}
          onSettingsChange={setRuntimeSettings}
          onClose={() => setRuntimeOpen(false)}
        />
      )}
    </main>
  );
}
