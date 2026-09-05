type ToolbarProps = {
  onAddAgent: () => void;
  nodeCount: number;
};

export function Toolbar({ onAddAgent, nodeCount }: ToolbarProps) {
  return (
    <header className="toolbar">
      <div>
        <div className="toolbar__eyebrow">Agent Graph Designer</div>
        <h1>Canvas MVP</h1>
      </div>

      <div className="toolbar__actions">
        <span className="node-count">Nodes: {nodeCount}</span>
        <button type="button" className="primary-button" onClick={onAddAgent}>
          + Agent
        </button>
      </div>
    </header>
  );
}
