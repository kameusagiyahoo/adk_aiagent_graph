import { useMemo, useState } from 'react';
import type { AdkCodeGeneration } from '../../adapters/adk/codegenTypes';
import type { GraphProject } from '../../core/graph/types';
import { executeWithRuntimeBridge } from '../bridge/client';
import type {
  RuntimeBridgeSettings,
  RuntimeExecutionResult,
  RuntimeMode,
} from '../bridge/types';
import { runSimulationDebugToCompletion } from '../simulation/debugger';
import type {
  SimulationResult,
  SimulationRouteChoices,
} from '../simulation/types';

type RuntimeComparisonProps = {
  project: GraphProject;
  generation: AdkCodeGeneration;
  settings: RuntimeBridgeSettings;
  openAiModel: string;
  onExecutionResult: (result: RuntimeExecutionResult | null) => void;
  onSimulationResult: (result: SimulationResult | null) => void;
};

type ComparisonResult = {
  mode: RuntimeMode;
  status: 'completed' | 'warning' | 'failed';
  durationMs: number;
  path: string[];
  finalText: string;
  toolCalls: string[];
  warnings: string[];
  error?: string;
  execution?: RuntimeExecutionResult;
  simulation?: SimulationResult;
};

const labels: Record<RuntimeMode, string> = {
  mock: 'Mock',
  openai: 'OpenAI',
  vllm: 'vLLM',
};

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export function RuntimeComparison({
  project,
  generation,
  settings,
  openAiModel,
  onExecutionResult,
  onSimulationResult,
}: RuntimeComparisonProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('こんにちは');
  const [selectedModes, setSelectedModes] = useState<RuntimeMode[]>(['mock']);
  const [routeChoices, setRouteChoices] = useState<SimulationRouteChoices>({});
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [busy, setBusy] = useState(false);

  const routers = useMemo(
    () => project.nodes
      .filter((node) => node.kind === 'router')
      .map((node) => ({ node, edges: project.edges.filter((edge) => edge.sourceNodeId === node.id) })),
    [project],
  );

  const payload = {
    packageName: generation.packageName,
    files: generation.files.map(({ path, content }) => ({ path, content })),
  };

  const toggleMode = (mode: RuntimeMode) => {
    setSelectedModes((current) => current.includes(mode)
      ? current.filter((candidate) => candidate !== mode)
      : [...current, mode]);
  };

  const runMock = (): ComparisonResult => {
    const started = performance.now();
    const simulation = runSimulationDebugToCompletion(
      project,
      routeChoices,
      { initialInput: inputText.trim(), mockOutputs: {} },
    );
    return {
      mode: 'mock',
      status: simulation.status,
      durationMs: performance.now() - started,
      path: simulation.trace.map((event) => event.nodeName),
      finalText: simulation.trace.at(-1)?.output ?? inputText.trim(),
      toolCalls: simulation.trace.filter((event) => event.nodeKind === 'tool').map((event) => event.nodeName),
      warnings: simulation.warnings,
      simulation,
    };
  };

  const runRemote = async (mode: 'openai' | 'vllm'): Promise<ComparisonResult> => {
    const started = performance.now();
    const model = mode === 'openai' ? openAiModel.trim() : settings.vllmModel.trim();
    if (!settings.token.trim()) {
      return { mode, status: 'failed', durationMs: 0, path: [], finalText: '', toolCalls: [], warnings: [], error: 'Bridge Tokenが未設定です。' };
    }
    if (!model) {
      return { mode, status: 'failed', durationMs: 0, path: [], finalText: '', toolCalls: [], warnings: [], error: `${labels[mode]} modelが未設定です。` };
    }
    if (mode === 'vllm' && !settings.vllmBaseUrl.trim()) {
      return { mode, status: 'failed', durationMs: 0, path: [], finalText: '', toolCalls: [], warnings: [], error: 'vLLM Base URLが未設定です。' };
    }

    try {
      const execution = await executeWithRuntimeBridge(settings, {
        ...payload,
        inputText: inputText.trim(),
        mode,
        model,
        ...(mode === 'vllm' ? { vllmBaseUrl: settings.vllmBaseUrl.trim() } : {}),
      });
      return {
        mode,
        status: execution.status,
        durationMs: performance.now() - started,
        path: execution.trace.map((event) => event.nodeName || event.author || 'event'),
        finalText: execution.finalText,
        toolCalls: unique(execution.trace.flatMap((event) => event.functionCalls)),
        warnings: [],
        error: execution.error ?? undefined,
        execution,
      };
    } catch (error) {
      return {
        mode,
        status: 'failed',
        durationMs: performance.now() - started,
        path: [],
        finalText: '',
        toolCalls: [],
        warnings: [],
        error: error instanceof Error ? error.message : `${labels[mode]}比較実行に失敗しました。`,
      };
    }
  };

  const runComparison = async () => {
    if (!inputText.trim() || selectedModes.length === 0) return;
    setBusy(true);
    setResults([]);
    const next: ComparisonResult[] = [];
    try {
      for (const mode of selectedModes) {
        if (mode === 'mock') next.push(runMock());
        else next.push(await runRemote(mode));
        setResults([...next]);
      }
    } finally {
      setBusy(false);
    }
  };

  const showOnCanvas = (result: ComparisonResult) => {
    if (result.simulation) {
      onExecutionResult(null);
      onSimulationResult(result.simulation);
      return;
    }
    if (result.execution) {
      onSimulationResult(null);
      onExecutionResult(result.execution);
    }
  };

  return (
    <section className="runtime-card runtime-comparison">
      <div className="runtime-result-header">
        <div>
          <div className="runtime-card__title">Runtime Comparison</div>
          <div className="runtime-meta">同じ入力を複数Runtimeへ流して経路・出力・時間を比較します。</div>
        </div>
        <button type="button" className="project-action" onClick={() => setOpen((value) => !value)}>
          {open ? '閉じる' : '比較する'}
        </button>
      </div>

      {open && (
        <>
          <label className="inspector-field">
            <span>共通入力</span>
            <textarea rows={3} value={inputText} onChange={(event) => setInputText(event.target.value)} />
          </label>

          <div className="runtime-comparison__modes">
            {(['mock', 'openai', 'vllm'] as RuntimeMode[]).map((mode) => (
              <label key={mode} className="runtime-comparison__mode">
                <input type="checkbox" checked={selectedModes.includes(mode)} onChange={() => toggleMode(mode)} />
                <span>{labels[mode]}</span>
              </label>
            ))}
          </div>
          {(selectedModes.includes('openai') || selectedModes.includes('vllm')) && (
            <div className="simulation-breakpoint-hit">実LLMを選択するとAPI/ローカル推論を実行します。OpenAI APIは利用料金が発生する場合があります。</div>
          )}

          {selectedModes.includes('mock') && routers.length > 0 && (
            <div className="runtime-checks">
              {routers.map(({ node, edges }) => (
                <label className="inspector-field" key={node.id}>
                  <span>Mock: {node.name} の分岐</span>
                  <select value={routeChoices[node.id] ?? ''} onChange={(event) => setRouteChoices((current) => ({ ...current, [node.id]: event.target.value }))}>
                    <option value="">自動: 最初のrouteKey</option>
                    {edges.map((edge) => (
                      <option key={edge.id} value={edge.id}>{edge.routeKey?.trim() || '(routeKey未設定)'}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          <div className="runtime-meta">OpenAI: {openAiModel || '未設定'} / vLLM: {settings.vllmModel || '未設定'}</div>
          <div className="runtime-actions">
            <button type="button" className="spec-primary-button" disabled={busy || !inputText.trim() || selectedModes.length === 0} onClick={() => void runComparison()}>
              {busy ? '比較実行中…' : '選択Runtimeを比較実行'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="runtime-comparison__grid">
              {results.map((result) => (
                <article className="runtime-comparison__result" key={result.mode}>
                  <div className="runtime-result-header">
                    <strong>{labels[result.mode]}</strong>
                    <span className={`runtime-result-badge runtime-result-badge--${result.status === 'failed' ? 'failed' : result.status === 'completed' ? 'passed' : 'skip'}`}>{result.status.toUpperCase()}</span>
                  </div>
                  <small>{result.durationMs.toFixed(0)} ms</small>
                  <div><b>Path</b><span>{result.path.join(' → ') || '—'}</span></div>
                  <div><b>Final</b><span>{result.finalText || '—'}</span></div>
                  <div><b>Tool calls</b><span>{result.toolCalls.join(', ') || '—'}</span></div>
                  <div><b>Warnings</b><span>{result.warnings.length ? result.warnings.join(' / ') : '—'}</span></div>
                  {result.error && <div className="runtime-error">{result.error}</div>}
                  {(result.execution || result.simulation) && (
                    <button type="button" className="project-action" onClick={() => showOnCanvas(result)}>Canvasに表示</button>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
