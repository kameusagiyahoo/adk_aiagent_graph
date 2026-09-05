import type { NodeProps } from '@xyflow/react';
import { BaseNode, type BaseNodeData } from './BaseNode';

export function RouterNode({ data, selected }: NodeProps) {
  return <BaseNode data={data as BaseNodeData} selected={selected} />;
}
