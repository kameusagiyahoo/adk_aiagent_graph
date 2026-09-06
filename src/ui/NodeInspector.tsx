import { changeToolType } from '../core/graph/project';
import type {
  GraphNode,
  HttpMethod,
  NodeKind,
  ToolGraphNode,
  ToolType,
} from '../core/graph/types';
import type { ValidationIssue } from '../core/validation/types';

type NodeInspectorProps = {
  node: GraphNode | null;
  issues: ValidationIssue[];
  onChange: (node: GraphNode) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
};

const labels: Record<NodeKind, string> = {
  agent: 'Agent',
  router: 'Router',
  tool: 'Tool',
  humanInput: 'HumanInput',
  join: 'Join',
};

const toolTypes: Array<{ value: ToolType; label: string }> = [
  { value: 'custom', label: 'Custom Function' },
  { value: 'http', label: 'HTTP API' },
  { value: 'mcp', label: 'MCP' },
  { value: 'search', label: 'Search' },
  { value: 'database', label: 'Database' },
  { value: 'file', label: 'File' },
];

const ToolFields = ({ node, onChange }: { node: ToolGraphNode; onChange: (node: GraphNode) => void }) => {
  const typeSelector = (
    <label className="inspector-field">
      <span>Tool type</span>
      <select
        value={node.config.toolType}
        onChange={(event) => onChange(changeToolType(node, event.target.value as ToolType))}
      >
        {toolTypes.map((type) => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
    </label>
  );

  switch (node.config.toolType) {
    case 'custom':
      return <>{typeSelector}<label className="inspector-field"><span>Function name</span><input value={node.config.functionName} placeholder="get_weather" onChange={(event) => onChange({ ...node, config: { ...node.config, functionName: event.target.value } })} /></label><label className="inspector-field"><span>Function description</span><textarea rows={2} value={node.config.description} placeholder="この関数が行う処理" onChange={(event) => onChange({ ...node, config: { ...node.config, description: event.target.value } })} /></label></>;
    case 'http':
      return <>{typeSelector}<label className="inspector-field"><span>Method</span><select value={node.config.method} onChange={(event) => onChange({ ...node, config: { ...node.config, method: event.target.value as HttpMethod } })}><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></label><label className="inspector-field"><span>URL</span><input value={node.config.url} placeholder="https://api.example.com/..." onChange={(event) => onChange({ ...node, config: { ...node.config, url: event.target.value } })} /></label></>;
    case 'mcp':
      return <>{typeSelector}<label className="inspector-field"><span>Transport</span><select value={node.config.transport} onChange={(event) => onChange({ ...node, config: { ...node.config, transport: event.target.value === 'sse' ? 'sse' : 'stdio' } })}><option value="stdio">stdio</option><option value="sse">SSE</option></select></label>{node.config.transport === 'stdio' ? <><label className="inspector-field"><span>Command</span><input value={node.config.command} placeholder="npx / python / executable" onChange={(event) => onChange({ ...node, config: { ...node.config, command: event.target.value } })} /></label><label className="inspector-field"><span>Args</span><input value={node.config.args} placeholder="引数をスペース区切りで入力" onChange={(event) => onChange({ ...node, config: { ...node.config, args: event.target.value } })} /></label></> : <label className="inspector-field"><span>SSE URL</span><input value={node.config.url} placeholder="https://..." onChange={(event) => onChange({ ...node, config: { ...node.config, url: event.target.value } })} /></label>}</>;
    case 'search':
      return <>{typeSelector}<label className="inspector-field"><span>Provider</span><input value={node.config.provider} placeholder="google / custom ..." onChange={(event) => onChange({ ...node, config: { ...node.config, provider: event.target.value } })} /></label></>;
    case 'database':
      return <>{typeSelector}<label className="inspector-field"><span>Connection ref</span><input value={node.config.connectionRef} placeholder="環境変数名や接続設定ID" onChange={(event) => onChange({ ...node, config: { ...node.config, connectionRef: event.target.value } })} /></label><label className="inspector-field"><span>Operation</span><input value={node.config.operation} placeholder="query / lookup ..." onChange={(event) => onChange({ ...node, config: { ...node.config, operation: event.target.value } })} /></label></>;
    case 'file':
      return <>{typeSelector}<label className="inspector-field"><span>Operation</span><select value={node.config.operation} onChange={(event) => onChange({ ...node, config: { ...node.config, operation: event.target.value === 'write' ? 'write' : event.target.value === 'list' ? 'list' : 'read' } })}><option value="read">Read</option><option value="write">Write</option><option value="list">List</option></select></label><label className="inspector-field"><span>Path</span><input value={node.config.path} placeholder="./data/..." onChange={(event) => onChange({ ...node, config: { ...node.config, path: event.target.value } })} /></label></>;
  }
};

export function NodeInspector({ node, issues, onChange, onDelete, onClose }: NodeInspectorProps) {
  if (!node) return null;

  const deleteNode = () => {
    if (window.confirm(`「${node.name}」を削除しますか？\n接続中のEdgeも削除されます。`)) onDelete(node.id);
  };

  const configFields = (() => {
    switch (node.kind) {
      case 'agent': return <label className="inspector-field"><span>Instruction</span><textarea rows={4} value={node.config.instruction} placeholder="このAgentが何をするか" onChange={(event) => onChange({ ...node, config: { ...node.config, instruction: event.target.value } })} /></label>;
      case 'router': return <label className="inspector-field"><span>Condition</span><textarea rows={3} value={node.config.condition} placeholder="分岐条件を記述" onChange={(event) => onChange({ ...node, config: { ...node.config, condition: event.target.value } })} /><small>各分岐名はCanvasのEdgeをタップしてRoute keyに設定します。</small></label>;
      case 'tool': return <ToolFields node={node} onChange={onChange} />;
      case 'humanInput': return <label className="inspector-field"><span>Prompt</span><textarea rows={3} value={node.config.prompt} placeholder="ユーザーに確認する内容" onChange={(event) => onChange({ ...node, config: { ...node.config, prompt: event.target.value } })} /></label>;
      case 'join': return <label className="inspector-field"><span>Strategy</span><input value={node.config.strategy} readOnly /><small>現段階では all 固定です。</small></label>;
    }
  })();

  return (
    <aside className="node-inspector" aria-label="Node settings">
      <div className="node-inspector__grabber" aria-hidden="true" />
      <header className="node-inspector__header"><div><div className={`node-inspector__kind node-inspector__kind--${node.kind}`}>{labels[node.kind]}</div><h2>Node設定</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="設定を閉じる">×</button></header>
      <div className="node-inspector__body">
        {issues.length > 0 && <section className="inspector-validation" aria-label="Validation results"><div className="inspector-section-title">Validation</div>{issues.map((issue) => <div key={issue.id} className={`inspector-validation__item inspector-validation__item--${issue.severity}`}><strong>{issue.severity === 'error' ? 'ERROR' : 'WARNING'}</strong><span>{issue.message}</span></div>)}</section>}
        <label className="inspector-field"><span>Name</span><input value={node.name} onChange={(event) => onChange({ ...node, name: event.target.value })} /></label>
        <label className="inspector-field"><span>Description</span><textarea rows={2} value={node.description} onChange={(event) => onChange({ ...node, description: event.target.value })} /></label>
        <div className="inspector-section-title">固有設定</div>{configFields}
      </div>
      <footer className="node-inspector__footer"><button type="button" className="danger-button" onClick={deleteNode}>Nodeを削除</button><span>変更は即時検証</span></footer>
    </aside>
  );
}
