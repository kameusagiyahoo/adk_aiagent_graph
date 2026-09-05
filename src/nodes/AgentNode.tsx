import type { NodeProps } from '@xyflow/react';

export type AgentNodeData = {
  name: string;
  description: string;
};

export function AgentNode({ data, selected }: NodeProps) {
  const agent = data as AgentNodeData;

  return (
    <article className={`agent-node ${selected ? 'agent-node--selected' : ''}`}>
      <div className="agent-node__badge">Agent</div>
      <strong className="agent-node__title">{agent.name}</strong>
      <span className="agent-node__description">{agent.description}</span>
    </article>
  );
}
