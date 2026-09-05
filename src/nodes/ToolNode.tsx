import type { NodeProps } from '@xyflow/react';
import { BaseNode, type BaseNodeData } from './BaseNode';

export function ToolNode({ data, selected }: NodeProps) {
  return <BaseNode data={data as BaseNodeData} selected={selected} />;
}
