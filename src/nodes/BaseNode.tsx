import { Handle, Position } from '@xyflow/react';
import type { NodeKind } from '../core/graph/types';

export type BaseNodeData = {
  kind: NodeKind;
  name: string;
  description: string;
  validation: {
    errorCount: number;
    warningCount: number;
  };
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
  const { errorCount, warningCount } = data.validation;
  const validationClass = errorCount > 0
    ? 'graph-node--error'
    : warningCount > 0
      ? 'graph-node--warning'
      : '';

  return (
    <article
      className={`graph-node graph-node--${data.kind} ${selected ? 'graph-node--selected' : ''} ${validationClass}`}
    >
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="graph-node__handle graph-node__handle--input"
        aria-label="Input port"
      />

      {(errorCount > 0 || warningCount > 0) && (
        <div className="graph-node__validation" aria-label="Validation issues">
          {errorCount > 0 && <span className="graph-node__validation-error">E {errorCount}</span>}
          {warningCount > 0 && <span className="graph-node__validation-warning">W {warningCount}</span>}
        </div>
      )}

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
