import { useEffect, useMemo, useState } from 'react';
import type { GraphProject } from '../../core/graph/types';
import {
  advanceSimulationDebugSession,
  createSimulationDebugSession,
  sessionToSimulationResult,
} from './debugger';
import type {
  SimulationDebugConfig,
  SimulationDebugSession,
  SimulationResult,
  SimulationRouteChoices,
} from './types';

type SimulationPanelProps = {
  project: GraphProject;
  onResult: (result: SimulationResult | null) => void;
};

export function SimulationPanel({ project, onResult }: SimulationPanelProps) {
  const routers = useMemo(
    () => project.nodes
      .filter((node) => node.kind === 'router')
      .map((node) => ({ node, edges: project.edges.filter((edge) => edge.sourceNodeId === node.id) })),
    [project],
  );
  const [routeChoices, setRouteChoices] = useState<SimulationRouteChoices>({});
  const [config, setConfig] = useState<SimulationDebugConfig>({ initialInput: 'こんにちは', mockOutputs: {} });
  const [session, setSession] = useState<SimulationDebugSession | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [showMocks, setShowMocks] = useState(false);

  const publish = (next: SimulationDebugSession | null) => {
    setSession(next);
    onResult(next ? sessionToSimulationResult(next) : null);
  };

  const initialize = () => {
    setAutoRun(false);
    publish(createSimulationDebugSession(project, routeChoices, config));
  };

  const step = () => {
    const base = session ?? createSimulationDebugSession(project, routeChoices, config);
    const next = advanceSimulationDebugSession(project, base, routeChoices, config);
    publish(next);
    if (next.completed) setAutoRun(false);
  };

  useEffect(() => {
    if (!autoRun || !session || session.completed) return;
    const timer = window.setTimeout(() => {
      const next = advanceSimulationDebugSession(project, session, routeChoices, config);
      publish(next);
      if (next.completed) setAutoRun(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [autoRun, session, project, routeChoices, config]);

  const clear = () => {
    setAutoRun(false);
    publish(null);
  };

  return (
    <section className="runtime-card runtime-card--note">
      <div className="runtime-card__title">Simulation / Mock Debugger</div>
      <div className="runtime-meta">
        LLM・API key・Local BridgeなしでGraph IRを1 Nodeずつ実行します。処理順、分岐、Mock入出力、State変化を確認できます。
      </div>

      <label className="inspector-field">
        <span>初期入力</span>
        <textarea rows={2} value={config.initialInput} onChange={(event) => setConfig((current) => ({ ...current, initialInput: event.target.value }))} />
      </label>

      {routers.map(({ node, edges }) => (
        <label className="inspector-field" key={node.id}>
          <span>{node.name} の分岐</span>
          <select value={routeChoices[node.id] ?? ''} onChange={(event) => setRouteChoices((current) => ({ ...current, [node.id]: event.target.value }))}>
            <option value="">自動: 最初のrouteKey</option>
            {edges.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edge.routeKey?.trim() || '(routeKey未設定)'} → {project.nodes.find((candidate) => candidate.id === edge.targetNodeId)?.name ?? edge.targetNodeId}
              </option>
            ))}
          </select>
        </label>
      ))}

      <button type="button" className="project-action" onClick={() => setShowMocks((current) => !current)}>
        {showMocks ? 'Mock入出力を閉じる' : 'Node別Mock出力を編集'}
      </button>

      {showMocks && (
        <div className="runtime-checks">
          {project.nodes.map((node) => (
            <label className="inspector-field" key={node.id}>
              <span>{node.name} ({node.kind}) のMock出力</span>
              <textarea
                rows={2}
                value={config.mockOutputs[node.id] ?? ''}
                placeholder="空欄なら自動Mock出力"
                onChange={(event) => setConfig((current) => ({
                  ...current,
                  mockOutputs: { ...current.mockOutputs, [node.id]: event.target.value },
                }))}
              />
            </label>
          ))}
        </div>
      )}

      <div className="runtime-actions">
        <button type="button" className="project-action" disabled={project.nodes.length === 0} onClick={initialize}>初期化</button>
        <button type="button" className="spec-primary-button" disabled={project.nodes.length === 0 || session?.completed} onClick={step}>1 Step</button>
        {!autoRun ? (
          <button type="button" className="project-action" disabled={project.nodes.length === 0 || session?.completed} onClick={() => { if (!session) publish(createSimulationDebugSession(project, routeChoices, config)); setAutoRun(true); }}>自動実行</button>
        ) : (
          <button type="button" className="project-action" onClick={() => setAutoRun(false)}>Pause</button>
        )}
        {session && <button type="button" className="project-action" onClick={clear}>Trace解除</button>}
      </div>

      {session && (
        <>
          <section className="runtime-card">
            <div className="runtime-result-header">
              <div><div className="runtime-card__title">Debugger State</div><div className="runtime-meta">{session.completed ? 'COMPLETED' : autoRun ? 'RUNNING' : 'PAUSED'} / queue={session.queue.length}</div></div>
              <span className={`runtime-result-badge runtime-result-badge--${session.completed ? 'passed' : 'skip'}`}>STEP {session.state.step}</span>
            </div>
            <pre className="runtime-state-json">{JSON.stringify(session.state, null, 2)}</pre>
          </section>

          <div className="runtime-trace">
            {session.trace.map((event) => (
              <div className="runtime-trace__event" key={`${event.step}-${event.nodeId}`}>
                <strong>{event.step}. {event.nodeName} <small>({event.nodeKind})</small></strong>
                <small>{event.routeKey ? `route=${event.routeKey}` : 'mock'}</small>
                <div><b>IN:</b> {event.input || '—'}</div>
                <div><b>OUT:</b> {event.output || '—'}</div>
              </div>
            ))}
            {session.warnings.length > 0 && <div className="runtime-error">{session.warnings.map((warning) => <div key={warning}>{warning}</div>)}</div>}
          </div>
        </>
      )}
    </section>
  );
}
