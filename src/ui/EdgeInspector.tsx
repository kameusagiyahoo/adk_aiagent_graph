import type { GraphEdge, GraphNode } from '../core/graph/types';
import type { ValidationIssue } from '../core/validation/types';

type EdgeInspectorProps = {
  edge: GraphEdge | null;
  sourceNode: GraphNode | null;
  targetNode: GraphNode | null;
  issues: ValidationIssue[];
  onChange: (edge: GraphEdge) => void;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
};

export function EdgeInspector({
  edge,
  sourceNode,
  targetNode,
  issues,
  onChange,
  onDelete,
  onClose,
}: EdgeInspectorProps) {
  if (!edge) {
    return null;
  }

  const isRouterEdge = sourceNode?.kind === 'router';

  const deleteEdge = () => {
    const label = `${sourceNode?.name ?? edge.sourceNodeId} → ${targetNode?.name ?? edge.targetNodeId}`;
    if (window.confirm(`「${label}」のEdgeを削除しますか？`)) {
      onDelete(edge.id);
    }
  };

  return (
    <aside className="node-inspector" aria-label="Edge settings">
      <div className="node-inspector__grabber" aria-hidden="true" />
      <header className="node-inspector__header">
        <div>
          <div className="node-inspector__kind">Edge</div>
          <h2>接続設定</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Edge設定を閉じる">
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
          <span>From</span>
          <input value={sourceNode?.name ?? edge.sourceNodeId} readOnly />
        </label>

        <label className="inspector-field">
          <span>To</span>
          <input value={targetNode?.name ?? edge.targetNodeId} readOnly />
        </label>

        {isRouterEdge ? (
          <label className="inspector-field">
            <span>Route key / 分岐名</span>
            <input
              value={edge.routeKey ?? ''}
              placeholder="例: APPROVE / REJECT / DEFAULT_ROUTE"
              onChange={(event) => onChange({ ...edge, routeKey: event.target.value })}
            />
            <small>
              Routerが返すroute値と一致させます。同じRouterから出るEdgeでは重複できません。
            </small>
          </label>
        ) : (
          <div className="inspector-field">
            <span>Route key</span>
            <small>通常Edgeでは不要です。Routerから出るEdgeだけに設定します。</small>
          </div>
        )}
      </div>

      <footer className="node-inspector__footer">
        <button type="button" className="danger-button" onClick={deleteEdge}>
          Edgeを削除
        </button>
        <span>{isRouterEdge ? '分岐名は即時検証' : '通常接続'}</span>
      </footer>
    </aside>
  );
}
