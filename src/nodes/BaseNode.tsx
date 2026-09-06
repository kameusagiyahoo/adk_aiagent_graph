import { Handle, Position } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { NodeKind } from '../core/graph/types';

export type BaseNodeData = {
  kind: NodeKind;
  name: string;
  description: string;
  validation: {
    errorCount: number;
    warningCount: number;
  };
  runtimeOrder?: number;
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

const runtimeNodeStyle: CSSProperties = {
  boxShadow: '0 0 0 4px rgba(36, 113, 77, 0.22), 0 8px 22px rgba(31, 41, 55, 0.1)',
};

const runtimeBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: -13,
  left: 10,
  zIndex: 2,
  padding: '3px 7px',
  borderRadius: 999,
  background: '#24714d',
  color: '#fff',
  fontSize: 10,
  fontWeight: 900,
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
      style={data.runtimeOrder ? runtimeNodeStyle : undefined}
    >
      <Handle id="in" type="target" position={Position.Left} className="graph-node__handle graph-node__handle--input" aria-label="Input port" />

      {data.runtimeOrder && <div style={runtimeBadgeStyle} aria-label={`Runtime trace order ${data.runtimeOrder}`}>✓ {data.runtimeOrder}</div>}

      {(errorCount > 0 || warningCount > 0) && (
        <div className="graph-node__validation" aria-label="Validation issues">
          {errorCount > 0 && <span className="graph-node__validation-error">E {errorCount}</span>}
          {warningCount > 0 && <span className="graph-node__validation-warning">W {warningCount}</span>}
        </div>
      )}

      <div className="graph-node__badge">{labels[data.kind]}</div>
      <strong className="graph-node__title">{data.name}</strong>
      <span className="graph-node__description">{data.description}</span>
      <Handle id="out" type="source" position={Position.Right} className="graph-node__handle graph-node__handle--output" aria-label="Output port" />
    </article>
  );
}
