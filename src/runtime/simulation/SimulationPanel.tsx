import { useMemo, useState } from 'react';
import type { GraphProject } from '../../core/graph/types';
import { simulateGraphProject } from './simulate';
import type { SimulationResult, SimulationRouteChoices } from './types';

type SimulationPanelProps = {
  project: GraphProject;
  onResult: (result: SimulationResult | null) => void;
};

export function SimulationPanel({ project, onResult }: SimulationPanelProps) {
  const routers = useMemo(
    () => project.nodes
      .filter((node) => node.kind === 'router')
      .map((node) => ({
        node,
        edges: project.edges.filter((edge) => edge.sourceNodeId === node.id),
      })),
    [project],
  );
  const [routeChoices, setRouteChoices] = useState<SimulationRouteChoices>({});
  const [result, setResult] = useState<SimulationResult | null>(null);

  const run = () => {
    const next = simulateGraphProject(project, routeChoices);
    setResult(next);
    onResult(next);
  };

  const clear = () => {
    setResult(null);
    onResult(null);
  };

  return (
    <section className="runtime-card runtime-card--note">
      <div className="runtime-card__title">Simulation / Mock Runtime</div>
      <div className="runtime-meta">
        LLM・API key・Local BridgeなしでGraph IRを辿ります。現在の目的は実行結果の正しさではなく、処理順・分岐・到達Nodeのデバッグです。
      </div>

      {routers.map(({ node, edges }) => (
        <label className="inspector-field" key={node.id}>
          <span>{node.name} のMock分岐</span>
          <select
            value={routeChoices[node.id] ?? ''}
            onChange={(event) => setRouteChoices((current) => ({ ...current, [node.id]: event.target.value }))}
          >
            <option value="">自動: 最初の分岐</option>
            {edges.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edge.routeKey?.trim() || '(routeKey未設定)'} → {project.nodes.find((candidate) => candidate.id === edge.targetNodeId)?.name ?? edge.targetNodeId}
              </option>
            ))}
          </select>
        </label>
      ))}

      <div className="runtime-actions">
        <button type="button" className="spec-primary-button" disabled={project.nodes.length === 0} onClick={run}>
          Mock実行
        </button>
        {result && <button type="button" className="project-action" onClick={clear}>Trace解除</button>}
      </div>

      {result && (
        <div className="runtime-trace">
          {result.trace.map((event) => (
            <div className="runtime-trace__event" key={`${event.step}-${event.nodeId}`}>
              <strong>{event.step}. {event.nodeName} <small>({event.nodeKind})</small></strong>
              <small>{event.routeKey ? `route=${event.routeKey}` : 'mock'}</small>
              <div>{event.detail}</div>
            </div>
          ))}
          {result.warnings.length > 0 && (
            <div className="runtime-error">
              {result.warnings.map((warning) => <div key={warning}>{warning}</div>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
