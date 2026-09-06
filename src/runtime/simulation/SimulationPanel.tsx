import { useEffect, useMemo, useState } from 'react';
import type { GraphProject } from '../../core/graph/types';
import {
  advanceSimulationDebugSession,
  createSimulationDebugSession,
  replaceSimulationDebugState,
  restartSimulationDebugSessionAtNode,
  sessionToSimulationResult,
} from './debugger';
import type {
  SimulationDebugConfig,
  SimulationDebugSession,
  SimulationResult,
  SimulationRouteChoices,
  SimulationRunSnapshot,
  SimulationState,
} from './types';

type SimulationPanelProps = {
  project: GraphProject;
  onResult: (result: SimulationResult | null) => void;
};

const normalizeEditedState = (value: unknown, fallback: SimulationState): SimulationState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('StateはJSON objectにしてください。');
  const candidate = value as Record<string, unknown>;
  return {
    ...candidate,
    input: String(candidate.input ?? fallback.input ?? ''),
    lastOutput: String(candidate.lastOutput ?? fallback.lastOutput ?? ''),
    lastNode: candidate.lastNode == null ? null : String(candidate.lastNode),
    step: Number.isFinite(Number(candidate.step)) ? Number(candidate.step) : fallback.step,
  };
};

const runPath = (run: SimulationRunSnapshot) =>
  run.trace.map((event) => `${event.nodeName}${event.routeKey ? ` [${event.routeKey}]` : ''}`).join(' → ') || '—';

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
  const [showBreakpoints, setShowBreakpoints] = useState(false);
  const [breakpoints, setBreakpoints] = useState<string[]>([]);
  const [resumeNodeId, setResumeNodeId] = useState('');
  const [stateDraft, setStateDraft] = useState('');
  const [stateError, setStateError] = useState('');
  const [history, setHistory] = useState<SimulationRunSnapshot[]>([]);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const publish = (next: SimulationDebugSession | null) => {
    setSession(next);
    onResult(next ? sessionToSimulationResult(next) : null);
  };

  useEffect(() => {
    if (session) setStateDraft(JSON.stringify(session.state, null, 2));
  }, [session?.state]);

  const initialize = () => {
    setAutoRun(false);
    setStateError('');
    publish(createSimulationDebugSession(project, routeChoices, config));
  };

  const step = () => {
    const base = session ?? createSimulationDebugSession(project, routeChoices, config);
    const next = advanceSimulationDebugSession(project, base, routeChoices, config, {
      breakpoints,
      bypassBreakpoint: true,
    });
    publish(next);
    if (next.completed) setAutoRun(false);
  };

  useEffect(() => {
    if (!autoRun || !session || session.completed) return;
    const timer = window.setTimeout(() => {
      const next = advanceSimulationDebugSession(project, session, routeChoices, config, { breakpoints });
      publish(next);
      if (next.completed || next.pausedAtBreakpoint) setAutoRun(false);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [autoRun, session, project, routeChoices, config, breakpoints]);

  const clear = () => {
    setAutoRun(false);
    setStateError('');
    publish(null);
  };

  const applyState = () => {
    if (!session) return;
    try {
      const parsed = JSON.parse(stateDraft) as unknown;
      const nextState = normalizeEditedState(parsed, session.state);
      setStateError('');
      publish(replaceSimulationDebugState(session, nextState));
    } catch (error) {
      setStateError(error instanceof Error ? error.message : 'State JSONを解析できません。');
    }
  };

  const restartAtNode = () => {
    if (!resumeNodeId) return;
    const baseState = session?.state ?? {
      input: config.initialInput,
      lastOutput: config.initialInput,
      lastNode: null,
      step: 0,
    };
    setAutoRun(false);
    publish(restartSimulationDebugSessionAtNode(project, resumeNodeId, baseState));
  };

  const toggleBreakpoint = (nodeId: string) => {
    setBreakpoints((current) => current.includes(nodeId)
      ? current.filter((candidate) => candidate !== nodeId)
      : [...current, nodeId]);
  };

  const saveHistory = () => {
    if (!session || session.trace.length === 0) return;
    const snapshot: SimulationRunSnapshot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: `Run ${history.length + 1}`,
      createdAt: new Date().toLocaleTimeString(),
      trace: session.trace.map((event) => ({ ...event, stateSnapshot: { ...event.stateSnapshot } })),
      state: { ...session.state },
      warnings: [...session.warnings],
    };
    setHistory((current) => [...current.slice(-7), snapshot]);
    if (!compareA) setCompareA(snapshot.id);
    else if (!compareB) setCompareB(snapshot.id);
  };

  const runA = history.find((run) => run.id === compareA) ?? null;
  const runB = history.find((run) => run.id === compareB) ?? null;

  return (
    <section className="runtime-card runtime-card--note">
      <div className="runtime-card__title">Simulation / Mock Debugger</div>
      <div className="runtime-meta">
        LLM・API key・Local BridgeなしでGraph IRをデバッグします。Step実行、Breakpoint、State書換え、任意Node再開、実行履歴比較に対応します。
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

      <div className="simulation-config-actions">
        <button type="button" className="project-action" onClick={() => setShowMocks((current) => !current)}>
          {showMocks ? 'Mock出力を閉じる' : 'Mock出力を編集'}
        </button>
        <button type="button" className="project-action" onClick={() => setShowBreakpoints((current) => !current)}>
          {showBreakpoints ? 'Breakpointを閉じる' : `Breakpoint (${breakpoints.length})`}
        </button>
      </div>

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

      {showBreakpoints && (
        <div className="simulation-breakpoints">
          {project.nodes.map((node) => (
            <label key={node.id} className="simulation-breakpoint-item">
              <input type="checkbox" checked={breakpoints.includes(node.id)} onChange={() => toggleBreakpoint(node.id)} />
              <span>{node.name}</span>
              <small>{node.kind}</small>
            </label>
          ))}
        </div>
      )}

      <div className="runtime-actions simulation-main-actions">
        <button type="button" className="project-action" disabled={project.nodes.length === 0} onClick={initialize}>初期化</button>
        <button type="button" className="spec-primary-button" disabled={project.nodes.length === 0 || session?.completed} onClick={step}>1 Step</button>
        {!autoRun ? (
          <button type="button" className="project-action" disabled={project.nodes.length === 0 || session?.completed} onClick={() => { if (!session) publish(createSimulationDebugSession(project, routeChoices, config)); setAutoRun(true); }}>自動実行</button>
        ) : (
          <button type="button" className="project-action" onClick={() => setAutoRun(false)}>Pause</button>
        )}
        {session && <button type="button" className="project-action" onClick={clear}>Trace解除</button>}
      </div>

      {session?.pausedAtBreakpoint && (
        <div className="simulation-breakpoint-hit">
          Breakpoint: {project.nodes.find((node) => node.id === session.pausedAtBreakpoint)?.name ?? session.pausedAtBreakpoint} の実行直前で停止しました。`1 Step`でこのNodeを実行できます。
        </div>
      )}

      {session && (
        <>
          <section className="runtime-card">
            <div className="runtime-result-header">
              <div>
                <div className="runtime-card__title">Debugger State</div>
                <div className="runtime-meta">{session.completed ? 'COMPLETED' : session.pausedAtBreakpoint ? 'BREAKPOINT' : autoRun ? 'RUNNING' : 'PAUSED'} / queue={session.queue.length}</div>
              </div>
              <span className={`runtime-result-badge runtime-result-badge--${session.completed ? 'passed' : 'skip'}`}>STEP {session.state.step}</span>
            </div>
            <label className="inspector-field">
              <span>State JSON（編集可能）</span>
              <textarea className="runtime-state-editor" rows={8} value={stateDraft} onChange={(event) => setStateDraft(event.target.value)} />
            </label>
            <div className="runtime-actions">
              <button type="button" className="project-action" onClick={applyState}>State反映</button>
            </div>
            {stateError && <div className="runtime-error">{stateError}</div>}
          </section>

          <section className="runtime-card">
            <div className="runtime-card__title">任意Nodeから再開</div>
            <div className="runtime-meta">現在のStateを引き継ぎ、選択Nodeを新しい実行開始点にします。Traceは新しく開始します。</div>
            <div className="simulation-resume-row">
              <select value={resumeNodeId} onChange={(event) => setResumeNodeId(event.target.value)}>
                <option value="">Nodeを選択</option>
                {project.nodes.map((node) => <option key={node.id} value={node.id}>{node.name} ({node.kind})</option>)}
              </select>
              <button type="button" className="project-action" disabled={!resumeNodeId} onClick={restartAtNode}>ここから再開</button>
            </div>
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

          <section className="runtime-card">
            <div className="runtime-result-header">
              <div><div className="runtime-card__title">実行履歴</div><div className="runtime-meta">現在のTraceを保存して経路と結果を比較します。最大8件。</div></div>
              <button type="button" className="project-action" disabled={session.trace.length === 0} onClick={saveHistory}>現在を保存</button>
            </div>
            {history.length > 0 && (
              <>
                <div className="simulation-compare-selects">
                  <label><span>A</span><select value={compareA} onChange={(event) => setCompareA(event.target.value)}><option value="">選択</option>{history.map((run) => <option key={run.id} value={run.id}>{run.label} / {run.createdAt}</option>)}</select></label>
                  <label><span>B</span><select value={compareB} onChange={(event) => setCompareB(event.target.value)}><option value="">選択</option>{history.map((run) => <option key={run.id} value={run.id}>{run.label} / {run.createdAt}</option>)}</select></label>
                </div>
                {(runA || runB) && (
                  <div className="simulation-compare-grid">
                    {[['A', runA], ['B', runB]].map(([label, run]) => {
                      const snapshot = run as SimulationRunSnapshot | null;
                      return (
                        <div className="simulation-run-card" key={label as string}>
                          <strong>{label as string}: {snapshot?.label ?? '未選択'}</strong>
                          {snapshot && <>
                            <small>Steps: {snapshot.trace.length} / Warnings: {snapshot.warnings.length}</small>
                            <div><b>Path:</b> {runPath(snapshot)}</div>
                            <div><b>Final:</b> {String(snapshot.state.lastOutput ?? '—')}</div>
                          </>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </section>
  );
}
