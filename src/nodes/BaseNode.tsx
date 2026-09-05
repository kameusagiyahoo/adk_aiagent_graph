import { Handle, Position } from '@xyflow/react';
import type { NodeKind } from '../core/graph/types';

export type BaseNodeData = {
  kind: NodeKind;
  name: string;
  description: string;
};

type BaseNodeProps = {
  data: BaseNodeData;
  selected: boolean;
};

const labels: Record<NodeKind, string> = {
  agent: 'Agent',
  router: 'Router',
  tool: 'Tool',
  humanInput: 'HumanInput',
  join: 'Join',
};

export function BaseNode({ data, selected }: BaseNodeProps) {
  return (
    <article
      className={`graph-node graph-node--${data.kind} ${selected ? 'graph-node--selected' : ''}`}
    >
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="graph-node__handle graph-node__handle--input"
        aria-label="Input port"
      />
      <div className="graph-node__badge">{labels[data.kind]}</div>
      <strong className="graph-node__title">{data.name}</strong>
      <span className="graph-node__description">{data.description}</span>
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        className="graph-node__handle graph-node__handle--output"
        aria-label="Output port"
      />
    </article>
  );
}
