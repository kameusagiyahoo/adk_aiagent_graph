import { useMemo, useState } from 'react';
import type { AdkCodeGeneration } from '../adapters/adk/codegenTypes';
import type { AdkAdapterSettings } from '../adapters/adk/types';
import type { GraphProject } from '../core/graph/types';
import {
  checkRuntimeBridge,
  checkVllmWithRuntimeBridge,
  executeWithRuntimeBridge,
  validateWithRuntimeBridge,
} from '../runtime/bridge/client';
import type {
  RuntimeBridgeHealth,
  RuntimeBridgeSettings,
  RuntimeExecutionResult,
  RuntimeMode,
  RuntimeValidationResult,
  VllmCheckResult,
} from '../runtime/bridge/types';
import { SimulationPanel } from '../runtime/simulation/SimulationPanel';
import type { SimulationResult } from '../runtime/simulation/types';
import './SpecificationPreview.css';
import './RuntimeValidationPreview.css';

type RuntimeValidationPreviewProps = {
  project: GraphProject;
  generation: AdkCodeGeneration;
  settings: RuntimeBridgeSettings;
  adkSettings: AdkAdapterSettings;
  onSettingsChange: (settings: RuntimeBridgeSettings) => void;
  onAdkSettingsChange: (settings: AdkAdapterSettings) => void;
  onExecutionResult: (result: RuntimeExecutionResult | null) => void;
  onSimulationResult: (result: SimulationResult | null) => void;
  onClose: () => void;
};

const modeLabels: Record<RuntimeMode, string> = {
  mock: 'Mock Debugger',
  openai: 'OpenAI API',
  vllm: 'vLLM Local',
};

export function RuntimeValidationPreview({
  project,
  generation,
  settings,
  adkSettings,
  onSettingsChange,
  onAdkSettingsChange,
  onExecutionResult,
  onSimulationResult,
  onClose,
}: RuntimeValidationPreviewProps) {
  const [health, setHealth] = useState<RuntimeBridgeHealth | null>(null);
  const [result, setResult] = useState<RuntimeValidationResult | null>(null);
  const [execution, setExecution] = useState<RuntimeExecutionResult | null>(null);
  const [vllmCheck, setVllmCheck] = useState<VllmCheckResult | null>(null);
  const [inputText, setInputText] = useState('こんにちは');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'health' | 'validate' | 'execute' | 'vllm' | null>(null);

  const openAiModel = useMemo(
    () => adkSettings.defaultModel.replace(/^openai\//, ''),
    [adkSettings.defaultModel],
  );
  const payload = {
    packageName: generation.packageName,
    files: generation.files.map(({ path, content }) => ({ path, content })),
  };
  const selectedModel = settings.mode === 'vllm' ? settings.vllmModel.trim() : openAiModel.trim();

  const setMode = (mode: RuntimeMode) => {
    onSettingsChange({ ...settings, mode });
    setError('');
    setExecution(null);
    setResult(null);
    onExecutionResult(null);
    onSimulationResult(null);
  };

  const connect = async () => {
    setBusy('health'); setError(''); setHealth(null);
    try { setHealth(await checkRuntimeBridge(settings)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Bridge接続に失敗しました。'); }
    finally { setBusy(null); }
  };

  const validate = async () => {
    setBusy('validate'); setError(''); setResult(null);
    try { setResult(await validateWithRuntimeBridge(settings, payload)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Runtime検証に失敗しました。'); }
    finally { setBusy(null); }
  };

  const checkVllm = async () => {
    setBusy('vllm'); setError(''); setVllmCheck(null);
    try {
      const next = await checkVllmWithRuntimeBridge(settings);
      setVllmCheck(next);
      if (next.ok && !settings.vllmModel.trim() && next.models[0]) {
        onSettingsChange({ ...settings, vllmModel: next.models[0] });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'vLLM接続確認に失敗しました。');
    } finally { setBusy(null); }
  };

  const execute = async () => {
    if (settings.mode === 'mock') return;
    setBusy('execute'); setError(''); setExecution(null); onExecutionResult(null); onSimulationResult(null);
    try {
      const next = await executeWithRuntimeBridge(settings, {
        ...payload,
        inputText: inputText.trim(),
        mode: settings.mode,
        model: selectedModel,
        ...(settings.mode === 'vllm' ? { vllmBaseUrl: settings.vllmBaseUrl.trim() } : {}),
      });
      setExecution(next);
      onExecutionResult(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${modeLabels[settings.mode]}実行に失敗しました。`);
    } finally { setBusy(null); }
  };

  return (
    <div className="spec-preview-backdrop" onClick={onClose}>
      <section className="spec-preview runtime-preview" role="dialog" aria-modal="true" aria-label="ADK Runtime" onClick={(event) => event.stopPropagation()}>
        <div className="spec-preview__grabber" aria-hidden="true" />
        <header className="spec-preview__header">
          <div><div className="spec-preview__eyebrow">Runtime Debug</div><h2>{modeLabels[settings.mode]}</h2></div>
          <button type="button" className="icon-button" onClick={onClose}>×</button>
        </header>
        <div className="runtime-preview__body">
          <section className="runtime-card">
            <div className="runtime-card__title">Runtime mode</div>
            <div className="runtime-mode-switch" role="group" aria-label="Runtime mode">
              {(['mock', 'openai', 'vllm'] as RuntimeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`project-action ${settings.mode === mode ? 'runtime-mode-switch__active' : ''}`}
                  onClick={() => setMode(mode)}
                >
                  {modeLabels[mode]}
                </button>
              ))}
            </div>
            <div className="runtime-meta">
              Mockはブラウザ内だけで動作。OpenAI/vLLMは同じGraphをLocal Bridge経由で実LLM実行します。
            </div>
          </section>

          {settings.mode === 'mock' ? (
            <SimulationPanel project={project} onResult={(next) => { onExecutionResult(null); onSimulationResult(next); }} />
          ) : (
            <>
              <section className="runtime-card">
                <div className="runtime-card__title">Local Bridge</div>
                <label className="inspector-field"><span>Bridge URL</span><input value={settings.baseUrl} onChange={(e) => onSettingsChange({ ...settings, baseUrl: e.target.value })} /></label>
                <label className="inspector-field"><span>Token</span><input type="password" autoComplete="off" value={settings.token} onChange={(e) => onSettingsChange({ ...settings, token: e.target.value })} /></label>
                <div className="runtime-actions">
                  <button type="button" className="project-action" disabled={busy !== null || !settings.token.trim()} onClick={() => void connect()}>{busy === 'health' ? '接続中…' : 'Bridge確認'}</button>
                  <button type="button" className="project-action" disabled={busy !== null || !settings.token.trim()} onClick={() => void validate()}>{busy === 'validate' ? '検証中…' : 'Runtime検証'}</button>
                </div>
              </section>

              {settings.mode === 'openai' && (
                <section className="runtime-card">
                  <div className="runtime-card__title">OpenAI API</div>
                  <label className="inspector-field"><span>Model</span><input value={openAiModel} placeholder="gpt-5.6-terra" onChange={(e) => onAdkSettingsChange({ ...adkSettings, defaultModel: e.target.value.trim().replace(/^openai\//, '') })} /></label>
                  <small>API keyはブラウザへ保存せず、PC側Local Bridgeの `OPENAI_API_KEY` だけを使います。</small>
                  {health && <div className={health.openaiConfigured ? 'runtime-meta' : 'runtime-error'}>OPENAI_API_KEY: {health.openaiConfigured ? '設定済み' : '未設定'}</div>}
                </section>
              )}

              {settings.mode === 'vllm' && (
                <section className="runtime-card">
                  <div className="runtime-card__title">vLLM Local / OpenAI-compatible API</div>
                  <label className="inspector-field"><span>Base URL</span><input value={settings.vllmBaseUrl} placeholder="http://127.0.0.1:8000/v1" onChange={(e) => onSettingsChange({ ...settings, vllmBaseUrl: e.target.value })} /></label>
                  <label className="inspector-field"><span>Model</span><input value={settings.vllmModel} placeholder="vLLMが公開しているmodel id" onChange={(e) => onSettingsChange({ ...settings, vllmModel: e.target.value })} /></label>
                  <div className="runtime-actions">
                    <button type="button" className="project-action" disabled={busy !== null || !settings.token.trim() || !settings.vllmBaseUrl.trim()} onClick={() => void checkVllm()}>{busy === 'vllm' ? '確認中…' : 'vLLM確認'}</button>
                  </div>
                  {vllmCheck && (
                    <div className={vllmCheck.ok ? 'runtime-card runtime-card--success' : 'runtime-error'}>
                      {vllmCheck.ok ? `接続OK / Models: ${vllmCheck.models.join(', ') || '0件'}` : `接続失敗: ${vllmCheck.error || 'unknown error'}`}
                    </div>
                  )}
                  <small>localhost / loopbackだけを許可します。API keyを使う場合はPC側 `AGD_VLLM_API_KEY` に設定します。</small>
                </section>
              )}

              {health && <section className="runtime-card runtime-card--success"><div className="runtime-card__title">Bridge接続OK</div><div className="runtime-meta">Python {health.pythonVersion} / ADK {health.adkVersion} / Bridge {health.version}</div></section>}
              {error && <div className="runtime-error">{error}</div>}
              {result && <section className="runtime-card"><div className="runtime-result-header"><div><div className="runtime-card__title">実行前検証</div></div><span className={`runtime-result-badge runtime-result-badge--${result.status}`}>{result.status.toUpperCase()}</span></div><div className="runtime-checks">{result.checks.map((check) => <div key={check.id} className={`runtime-check runtime-check--${check.status}`}><strong>{check.status.toUpperCase()}</strong><div><div>{check.label}</div><small>{check.detail}</small></div><span>{check.durationMs} ms</span></div>)}</div></section>}

              <section className="runtime-card">
                <div className="runtime-card__title">{modeLabels[settings.mode]} Execution</div>
                <label className="inspector-field"><span>入力</span><textarea rows={3} value={inputText} onChange={(e) => setInputText(e.target.value)} /></label>
                <div className="runtime-meta">実行Model: {selectedModel || '未設定'}</div>
                <div className="runtime-actions"><button type="button" className="spec-primary-button" disabled={busy !== null || !settings.token.trim() || !inputText.trim() || !generation.staticCheck.canExport || !selectedModel} onClick={() => void execute()}>{busy === 'execute' ? '実行中…' : `${modeLabels[settings.mode]}で実行`}</button></div>
              </section>

              {execution && <section className="runtime-card"><div className="runtime-result-header"><div><div className="runtime-card__title">ADK Event Trace</div><div className="runtime-meta">Invocation: {execution.invocationId || '—'}</div></div><span className={`runtime-result-badge runtime-result-badge--${execution.status === 'completed' ? 'passed' : 'failed'}`}>{execution.status.toUpperCase()}</span></div>{execution.error && <div className="runtime-error">{execution.error}</div>}{execution.trace.length > 0 ? <div className="runtime-trace">{execution.trace.map((event, index) => <div className={`runtime-trace__event ${event.isFinal ? 'runtime-trace__event--final' : ''}`} key={event.eventId || index}><strong>{index + 1}. {event.nodeName || event.author || 'event'}</strong><small>{[event.branch && `branch=${event.branch}`, event.route && `route=${event.route}`].filter(Boolean).join(' / ') || 'ADK event'}</small>{event.text && <div>{event.text}</div>}</div>)}</div> : <div className="runtime-meta">Trace eventはありません。</div>}</section>}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
