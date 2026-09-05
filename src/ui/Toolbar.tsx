import type { NodeKind } from '../core/graph/types';

type ToolbarProps = {
  onAddNode: (kind: NodeKind) => void;
  nodeCount: number;
};

const nodeButtons: Array<{ kind: NodeKind; label: string }> = [
  { kind: 'agent', label: 'Agent' },
  { kind: 'router', label: 'Router' },
  { kind: 'tool', label: 'Tool' },
  { kind: 'humanInput', label: 'HumanInput' },
  { kind: 'join', label: 'Join' },
];

export function Toolbar({ onAddNode, nodeCount }: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar__top">
        <div>
          <div className="toolbar__eyebrow">Agent Graph Designer</div>
          <h1>Canvas MVP</h1>
        </div>
        <span className="node-count">Nodes: {nodeCount}</span>
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
