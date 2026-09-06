import { changeToolType } from '../core/graph/project';
import type {
  FileOperation,
  GraphNode,
  HttpMethod,
  NodeKind,
  ToolConfig,
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

type ToolFieldsProps = {
  node: ToolGraphNode;
  onChange: (node: GraphNode) => void;
};

const ToolFields = ({ node, onChange }: ToolFieldsProps) => {
  const updateConfig = (config: ToolConfig) => {
    onChange({ ...node, config });
  };

  const typeSelector = (
    <label className="inspector-field">
      <span>Tool type</span>
      <select
        value={node.config.toolType}
        onChange={(event) => onChange(changeToolType(node, event.target.value as ToolType))}
      >
        {toolTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </label>
  );

  switch (node.config.toolType) {
    case 'custom': {
      const config = node.config;
      return (
        <>
          {typeSelector}
          <label className="inspector-field">
            <span>Function name</span>
            <input
              value={config.functionName}
              placeholder="get_weather"
              onChange={(event) =>
                updateConfig({
                  toolType: 'custom',
                  functionName: event.target.value,
                  description: config.description,
                })
              }
            />
          </label>
          <label className="inspector-field">
            <span>Function description</span>
            <textarea
              rows={2}
              value={config.description}
              placeholder="この関数が行う処理"
              onChange={(event) =>
                updateConfig({
                  toolType: 'custom',
                  functionName: config.functionName,
                  description: event.target.value,
                })
              }
            />
          </label>
        </>
      );
    }

    case 'http': {
      const config = node.config;
      return (
        <>
          {typeSelector}
          <label className="inspector-field">
            <span>Method</span>
            <select
              value={config.method}
              onChange={(event) =>
                updateConfig({
                  toolType: 'http',
                  method: event.target.value as HttpMethod,
                  url: config.url,
                })
              }
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </label>
          <label className="inspector-field">
            <span>URL</span>
            <input
              value={config.url}
              placeholder="https://api.example.com/..."
              onChange={(event) =>
                updateConfig({
                  toolType: 'http',
                  method: config.method,
                  url: event.target.value,
                })
              }
            />
          </label>
        </>
      );
    }

    case 'mcp': {
      const config = node.config;
      return (
        <>
          {typeSelector}
          <label className="inspector-field">
            <span>Transport</span>
            <select
              value={config.transport}
              onChange={(event) =>
                updateConfig({
                  toolType: 'mcp',
                  transport: event.target.value === 'sse' ? 'sse' : 'stdio',
                  command: config.command,
                  args: config.args,
                  url: config.url,
                })
              }
            >
              <option value="stdio">stdio</option>
              <option value="sse">SSE</option>
            </select>
          </label>

          {config.transport === 'stdio' ? (
            <>
              <label className="inspector-field">
                <span>Command</span>
                <input
                  value={config.command}
                  placeholder="npx / python / executable"
                  onChange={(event) =>
                    updateConfig({
                      toolType: 'mcp',
                      transport: config.transport,
                      command: event.target.value,
                      args: config.args,
                      url: config.url,
                    })
                  }
                />
              </label>
              <label className="inspector-field">
                <span>Args</span>
                <input
                  value={config.args}
                  placeholder="引数をスペース区切りで入力"
                  onChange={(event) =>
                    updateConfig({
                      toolType: 'mcp',
                      transport: config.transport,
                      command: config.command,
                      args: event.target.value,
                      url: config.url,
                    })
                  }
                />
              </label>
            </>
          ) : (
            <label className="inspector-field">
              <span>SSE URL</span>
              <input
                value={config.url}
                placeholder="https://..."
                onChange={(event) =>
                  updateConfig({
                    toolType: 'mcp',
                    transport: config.transport,
                    command: config.command,
                    args: config.args,
                    url: event.target.value,
                  })
                }
              />
            </label>
          )}
        </>
      );
    }

    case 'search': {
      const config = node.config;
      return (
        <>
          {typeSelector}
          <label className="inspector-field">
            <span>Provider</span>
            <input
              value={config.provider}
              placeholder="google / custom ..."
              onChange={(event) =>
                updateConfig({
                  toolType: 'search',
                  provider: event.target.value,
                })
              }
            />
          </label>
        </>
      );
    }

    case 'database': {
      const config = node.config;
      return (
        <>
          {typeSelector}
          <label className="inspector-field">
            <span>Connection ref</span>
            <input
              value={config.connectionRef}
              placeholder="環境変数名や接続設定ID"
              onChange={(event) =>
                updateConfig({
                  toolType: 'database',
                  connectionRef: event.target.value,
                  operation: config.operation,
                })
              }
            />
          </label>
          <label className="inspector-field">
            <span>Operation</span>
            <input
              value={config.operation}
              placeholder="query / lookup ..."
              onChange={(event) =>
                updateConfig({
                  toolType: 'database',
                  connectionRef: config.connectionRef,
                  operation: event.target.value,
                })
              }
            />
          </label>
        </>
      );
    }

    case 'file': {
      const config = node.config;
      return (
        <>
          {typeSelector}
          <label className="inspector-field">
            <span>Operation</span>
            <select
              value={config.operation}
              onChange={(event) =>
                updateConfig({
                  toolType: 'file',
                  operation: event.target.value as FileOperation,
                  path: config.path,
                })
              }
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="list">List</option>
            </select>
          </label>
          <label className="inspector-field">
            <span>Path</span>
            <input
              value={config.path}
              placeholder="./data/..."
              onChange={(event) =>
                updateConfig({
                  toolType: 'file',
                  operation: config.operation,
                  path: event.target.value,
                })
              }
            />
          </label>
        </>
      );
    }
  }
};

export function NodeInspector({ node, issues, onChange, onDelete, onClose }: NodeInspectorProps) {
  if (!node) {
    return null;
  }

  const deleteNode = () => {
    if (window.confirm(`「${node.name}」を削除しますか？\n接続中のEdgeも削除されます。`)) {
      onDelete(node.id);
    }
  };

  const configFields = (() => {
    switch (node.kind) {
      case 'agent':
        return (
          <label className="inspector-field">
            <span>Instruction</span>
            <textarea
              rows={4}
              value={node.config.instruction}
              placeholder="このAgentが何をするか"
              onChange={(event) =>
                onChange({
                  ...node,
                  config: { ...node.config, instruction: event.target.value },
                })
              }
            />
          </label>
        );
      case 'router':
        return (
          <label className="inspector-field">
            <span>Condition</span>
            <textarea
              rows={3}
              value={node.config.condition}
              placeholder="分岐条件を記述"
              onChange={(event) =>
                onChange({
                  ...node,
                  config: { ...node.config, condition: event.target.value },
                })
              }
            />
            <small>各分岐名はCanvasのEdgeをタップしてRoute keyに設定します。</small>
          </label>
        );
      case 'tool':
        return <ToolFields node={node} onChange={onChange} />;
      case 'humanInput':
        return (
          <label className="inspector-field">
            <span>Prompt</span>
            <textarea
              rows={3}
              value={node.config.prompt}
              placeholder="ユーザーに確認する内容"
              onChange={(event) =>
                onChange({
                  ...node,
                  config: { ...node.config, prompt: event.target.value },
                })
              }
            />
          </label>
        );
      case 'join':
        return (
          <label className="inspector-field">
            <span>Strategy</span>
            <input value={node.config.strategy} readOnly />
            <small>現段階では all 固定です。</small>
          </label>
        );
    }
  })();

  return (
    <aside className="node-inspector" aria-label="Node settings">
      <div className="node-inspector__grabber" aria-hidden="true" />
      <header className="node-inspector__header">
        <div>
          <div className={`node-inspector__kind node-inspector__kind--${node.kind}`}>
            {labels[node.kind]}
          </div>
          <h2>Node設定</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="設定を閉じる">
          ×
        </button>
      </header>

      <div className="node-inspector__body">
        {issues.length > 0 && (
          <section className="inspector-validation" aria-label="Validation results">
            <div className="inspector-section-title">Validation</div>
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`inspector-validation__item inspector-validation__item--${issue.severity}`}
              >
                <strong>{issue.severity === 'error' ? 'ERROR' : 'WARNING'}</strong>
                <span>{issue.message}</span>
              </div>
            ))}
          </section>
        )}

        <label className="inspector-field">
          <span>Name</span>
          <input value={node.name} onChange={(event) => onChange({ ...node, name: event.target.value })} />
        </label>

        <label className="inspector-field">
          <span>Description</span>
          <textarea
            rows={2}
            value={node.description}
            onChange={(event) => onChange({ ...node, description: event.target.value })}
          />
        </label>

        <div className="inspector-section-title">固有設定</div>
        {configFields}
      </div>

      <footer className="node-inspector__footer">
        <button type="button" className="danger-button" onClick={deleteNode}>
          Nodeを削除
        </button>
        <span>変更は即時検証</span>
      </footer>
    </aside>
  );
}
