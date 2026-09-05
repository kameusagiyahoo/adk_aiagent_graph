import type { ChangeEvent } from 'react';
import type { NodeKind } from '../core/graph/types';
import './Toolbar.css';

type ToolbarProps = {
  onAddNode: (kind: NodeKind) => void;
  nodeCount: number;
  edgeCount: number;
  onExport: () => void;
  onImport: (file: File) => void | Promise<void>;
  onOpenSpecification: () => void;
};

const nodeButtons: Array<{ kind: NodeKind; label: string }> = [
  { kind: 'agent', label: 'Agent' },
  { kind: 'router', label: 'Router' },
  { kind: 'tool', label: 'Tool' },
  { kind: 'humanInput', label: 'HumanInput' },
  { kind: 'join', label: 'Join' },
];

export function Toolbar({
  onAddNode,
  nodeCount,
  edgeCount,
  onExport,
  onImport,
  onOpenSpecification,
}: ToolbarProps) {
  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void onImport(file);
    }
    event.target.value = '';
  };

  return (
    <header className="toolbar">
      <div className="toolbar__top">
        <div>
          <div className="toolbar__eyebrow">Agent Graph Designer</div>
          <h1>Canvas MVP</h1>
        </div>

        <div className="toolbar__meta">
          <span className="save-state">自動保存</span>
          <span className="node-count">
            Nodes: {nodeCount} / Edges: {edgeCount}
          </span>
          <div className="project-actions" aria-label="Project actions">
            <button type="button" className="project-action" onClick={onOpenSpecification}>
              仕様
            </button>
            <button type="button" className="project-action" onClick={onExport}>
              書出
            </button>
            <label className="project-action project-action--file">
              読込
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleImport}
                aria-label="Graph JSONを読み込む"
              />
            </label>
          </div>
        </div>
      </div>

      <nav className="node-palette" aria-label="Nodeを追加">
        {nodeButtons.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            className={`node-button node-button--${kind}`}
            onClick={() => onAddNode(kind)}
          >
            + {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
