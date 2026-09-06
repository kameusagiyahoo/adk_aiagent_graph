import { useMemo, useState } from 'react';
import type { AdkCodeGeneration } from '../adapters/adk/codegenTypes';
import type { AdkAdapterSettings } from '../adapters/adk/types';
import {
  checkOllamaWithRuntimeBridge,
  checkRuntimeBridge,
  executeWithRuntimeBridge,
  validateWithRuntimeBridge,
} from '../runtime/bridge/client';
import type {
  OllamaHealth,
  RuntimeBridgeHealth,
  RuntimeBridgeSettings,
  RuntimeExecutionResult,
  RuntimeValidationResult,
} from '../runtime/bridge/types';
import './SpecificationPreview.css';
import './RuntimeValidationPreview.css';

type RuntimeValidationPreviewProps = {
  generation: AdkCodeGeneration;
  settings: RuntimeBridgeSettings;
  adkSettings: AdkAdapterSettings;
  onSettingsChange: (settings: RuntimeBridgeSettings) => void;
  onAdkSettingsChange: (settings: AdkAdapterSettings) => void;
  onExecutionResult: (result: RuntimeExecutionResult | null) => void;
  onClose: () => void;
};

export function RuntimeValidationPreview({
  generation,
  settings,
  adkSettings,
  onSettingsChange,
  onAdkSettingsChange,
  onExecutionResult,
  onClose,
}: RuntimeValidationPreviewProps) {
  const [health, setHealth] = useState<RuntimeBridgeHealth | null>(null);
  const [ollamaHealth, setOllamaHealth] = useState<OllamaHealth | null>(null);
  const [result, setResult] = useState<RuntimeValidationResult | null>(null);
  const [execution, setExecution] = useState<RuntimeExecutionResult | null>(null);
  const [inputText, setInputText] = useState('こんにちは');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'health' | 'ollama' | 'validate' | 'execute' | null>(null);

  const ollamaModel = useMemo(
    () => adkSettings.defaultModel.replace(/^ollama_chat\//, ''),
    [adkSettings.defaultModel],
  );
  const payload = {
    packageName: generation.packageName,
    files: generation.files.map(({ path, content }) => ({ path, content })),
  };

  const connect = async () => {
    setBusy('health'); setError(''); setHealth(null);
    try { setHealth(await checkRuntimeBridge(settings)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Bridge接続に失敗しました。'); }
    finally { setBusy(null); }
  };

  const checkOllama = async () => {
    setBusy('ollama'); setError(''); setOllamaHealth(null);
    try { setOllamaHealth(await checkOllamaWithRuntimeBridge(settings)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Ollama確認に失敗しました。'); }
    finally { setBusy(null); }
  };

  const validate = async () => {
    setBusy('validate'); setError(''); setResult(null);
    try { setResult(await validateWithRuntimeBridge(settings, payload)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Runtime検証に失敗しました。'); }
    finally { setBusy(null); }
  };

  const execute = async () => {
    setBusy('execute'); setError(''); setExecution(null); onExecutionResult(null);
    try {
      const next = await executeWithRuntimeBridge(settings, {
        ...payload,
        inputText: inputText.trim(),
        ollamaBaseUrl: settings.ollamaBaseUrl,
      });
      setExecution(next);
      onExecutionResult(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Local Executionに失敗しました。');
    } finally { setBusy(null); }
  };

  return (
    <div className="spec-preview-backdrop" onClick={onClose}>
      <section className="spec-preview runtime-preview" role="dialog" aria-modal="true" aria-label="ADK Runtime" onClick={(event) => event.stopPropagation()}>
        <div className="spec-preview__grabber" aria-hidden="true" />
        <header className="spec-preview__header">
          <div><div className="spec-preview__eyebrow">STEP 4C — Ollama + Canvas Trace</div><h2>ローカルADK実行</h2></div>
          <button type="button" className="icon-button" onClick={onClose}>×</button>
        </header>
        <div className="runtime-preview__body">
          <section className="runtime-card">
            <div className="runtime-card__title">Bridge</div>
            <label className="inspector-field"><span>Bridge URL</span><input value={settings.baseUrl} onChange={(e) => onSettingsChange({ ...settings, baseUrl: e.target.value })} /></label>
            <label className="inspector-field"><span>Token</span><input type="password" value={settings.token} onChange={(e) => onSettingsChange({ ...settings, token: e.target.value })} /></label>
            <div className="runtime-actions">
              <button type="button" className="project-action" disabled={busy !== null || !settings.token.trim()} onClick={() => void connect()}>{busy === 'health' ? '接続中…' : '接続確認'}</button>
              <button type="button" className="project-action" disabled={busy !== null || !settings.token.trim()} onClick={() => void validate()}>{busy === 'validate' ? '検証中…' : 'Runtime検証'}</button>
            </div>
          </section>

          <section className="runtime-card">
            <div className="runtime-card__title">Ollama</div>
            <label className="inspector-field"><span>Ollama URL</span><input value={settings.ollamaBaseUrl} onChange={(e) => onSettingsChange({ ...settings, ollamaBaseUrl: e.target.value })} /></label>
            <label className="inspector-field"><span>Model</span><input value={ollamaModel} placeholder="qwen3:8b" onChange={(e) => onAdkSettingsChange({ ...adkSettings, defaultModel: `ollama_chat/${e.target.value.trim()}` })} /></label>
            <small>ADK生成時は LiteLlm(model="ollama_chat/...") に変換します。</small>
            <div className="runtime-actions"><button type="button" className="project-action" disabled={busy !== null || !settings.token.trim()} onClick={() => void checkOllama()}>{busy === 'ollama' ? '確認中…' : 'Ollama確認'}</button></div>
            {ollamaHealth && <div className={ollamaHealth.ok ? 'runtime-meta' : 'runtime-error'}>{ollamaHealth.ok ? `接続OK / Models: ${ollamaHealth.models.join(', ') || 'なし'}` : ollamaHealth.error}</div>}
          </section>

          {health && <section className="runtime-card runtime-card--success"><div className="runtime-card__title">Bridge接続OK</div><div className="runtime-meta">Python {health.pythonVersion} / ADK {health.adkVersion} / Bridge {health.version}</div></section>}
          {error && <div className="runtime-error">{error}</div>}

          {result && <section className="runtime-card"><div className="runtime-result-header"><div><div className="runtime-card__title">実行前検証</div></div><span className={`runtime-result-badge runtime-result-badge--${result.status}`}>{result.status.toUpperCase()}</span></div><div className="runtime-checks">{result.checks.map((check) => <div key={check.id} className={`runtime-check runtime-check--${check.status}`}><strong>{check.status.toUpperCase()}</strong><div><div>{check.label}</div><small>{check.detail}</small></div><span>{check.durationMs} ms</span></div>)}</div></section>}

          <section className="runtime-card">
            <div className="runtime-card__title">Local Execution</div>
            <label className="inspector-field"><span>入力</span><textarea rows={3} value={inputText} onChange={(e) => setInputText(e.target.value)} /></label>
            <div className="runtime-actions"><button type="button" className="spec-primary-button" disabled={busy !== null || !settings.token.trim() || !inputText.trim() || !generation.staticCheck.canExport || !ollamaModel.trim()} onClick={() => void execute()}>{busy === 'execute' ? '実行中…' : 'ローカル実行'}</button></div>
          </section>

          {execution && <section className="runtime-card"><div className="runtime-result-header"><div><div className="runtime-card__title">ADK Event Trace</div><div className="runtime-meta">Invocation: {execution.invocationId || '—'}</div></div><span className={`runtime-result-badge runtime-result-badge--${execution.status === 'completed' ? 'passed' : 'failed'}`}>{execution.status.toUpperCase()}</span></div>{execution.error && <div className="runtime-error">{execution.error}</div>}{execution.trace.length > 0 ? <div className="runtime-trace">{execution.trace.map((event, index) => <div className={`runtime-trace__event ${event.isFinal ? 'runtime-trace__event--final' : ''}`} key={event.eventId || index}><strong>{index + 1}. {event.nodeName || event.author || 'event'}</strong><small>{[event.branch && `branch=${event.branch}`, event.route && `route=${event.route}`].filter(Boolean).join(' / ') || 'ADK event'}</small>{event.text && <div>{event.text}</div>}</div>)}</div> : <div className="runtime-meta">Trace eventはありません。</div>}{execution.finalText && <div className="runtime-final"><strong>Final response</strong><div>{execution.finalText}</div></div>}</section>}

          <section className="runtime-card runtime-card--note"><div className="runtime-card__title">ローカル完結</div><div className="runtime-meta">Local Executionはloopback通信のみ許可します。外部LLM APIには接続しません。実行後、Traceに対応したNode/EdgeをCanvas上で強調表示します。</div></section>
        </div>
      </section>
    </div>
  );
}
