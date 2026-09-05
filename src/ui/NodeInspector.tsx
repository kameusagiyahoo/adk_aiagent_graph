import type { GraphNode, NodeKind } from '../core/graph/types';
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
          </label>
        );
      case 'tool':
        return (
          <label className="inspector-field">
            <span>Tool type</span>
            <select
              value={node.config.toolType}
              onChange={(event) =>
                onChange({
                  ...node,
                  config: { ...node.config, toolType: event.target.value },
                })
              }
            >
              <option value="custom">Custom</option>
              <option value="http">HTTP API</option>
              <option value="mcp">MCP</option>
              <option value="search">Search</option>
              <option value="database">Database</option>
              <option value="file">File</option>
            </select>
          </label>
        );
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
          <input
            value={node.name}
            onChange={(event) => onChange({ ...node, name: event.target.value })}
          />
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
