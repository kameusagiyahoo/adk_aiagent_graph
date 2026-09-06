import { useState } from 'react';
import type { AdkCodeGeneration } from '../adapters/adk/codegenTypes';
import {
  checkRuntimeBridge,
  executeWithRuntimeBridge,
  validateWithRuntimeBridge,
} from '../runtime/bridge/client';
import type {
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
  onSettingsChange: (settings: RuntimeBridgeSettings) => void;
  onClose: () => void;
};

export function RuntimeValidationPreview({
  generation,
  settings,
  onSettingsChange,
  onClose,
}: RuntimeValidationPreviewProps) {
  const [health, setHealth] = useState<RuntimeBridgeHealth | null>(null);
  const [result, setResult] = useState<RuntimeValidationResult | null>(null);
  const [execution, setExecution] = useState<RuntimeExecutionResult | null>(null);
  const [inputText, setInputText] = useState('こんにちは');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'health' | 'validate' | 'execute' | null>(null);

  const payload = {
    packageName: generation.packageName,
    files: generation.files.map(({ path, content }) => ({ path, content })),
  };

  const connect = async () => {
    setBusy('health');
    setError('');
    setHealth(null);
    try {
      setHealth(await checkRuntimeBridge(settings));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bridge接続に失敗しました。');
    } finally {
      setBusy(null);
    }
  };

  const validate = async () => {
    setBusy('validate');
    setError('');
    setResult(null);
    try {
      setResult(await validateWithRuntimeBridge(settings, payload));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Runtime検証に失敗しました。');
    } finally {
      setBusy(null);
    }
  };

  const execute = async () => {
    setBusy('execute');
    setError('');
    setExecution(null);
    try {
      setExecution(
        await executeWithRuntimeBridge(settings, {
          ...payload,
          inputText: inputText.trim(),
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Local Executionに失敗しました。');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="spec-preview-backdrop" onClick={onClose}>
      <section
        className="spec-preview runtime-preview"
        role="dialog"
        aria-modal="true"
        aria-label="ADK Runtime validation"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="spec-preview__grabber" aria-hidden="true" />
        <header className="spec-preview__header">
          <div>
            <div className="spec-preview__eyebrow">STEP 4B — Local Execution</div>
            <h2>Python / ADKローカル実行</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Runtimeを閉じる">×</button>
        </header>

        <div className="runtime-preview__body">
          <section className="runtime-card">
            <div className="runtime-card__title">Bridge設定</div>
            <label className="inspector-field">
              <span>Bridge URL</span>
              <input value={settings.baseUrl} placeholder="http://127.0.0.1:8765" onChange={(event) => onSettingsChange({ ...settings, baseUrl: event.target.value })} />
            </label>
            <label className="inspector-field">
              <span>起動時Token</span>
              <input type="password" autoComplete="off" value={settings.token} placeholder="Bridgeのコンソールに表示されたToken" onChange={(event) => onSettingsChange({ ...settings, token: event.target.value })} />
            </label>
            <div className="runtime-actions">
              <button type="button" className="project-action" disabled={busy !== null || !settings.token.trim()} onClick={() => void connect()}>
                {busy === 'health' ? '接続中…' : '接続確認'}
              </button>
              <button type="button" className="spec-primary-button" disabled={busy !== null || !settings.token.trim()} onClick={() => void validate()}>
                {busy === 'validate' ? '検証中…' : 'Runtime検証'}
              </button>
            </div>
          </section>

          {health && <section className="runtime-card runtime-card--success"><div className="runtime-card__title">Bridge接続OK</div><div className="runtime-meta">Python {health.pythonVersion} / google-adk {health.adkVersion} / Bridge {health.version}</div></section>}
          {error && <div className="runtime-error">{error}</div>}

          {result && (
            <section className="runtime-card">
              <div className="runtime-result-header"><div><div className="runtime-card__title">実行前検証</div><div className="runtime-meta">Python {result.pythonVersion} / google-adk {result.adkVersion}</div></div><span className={`runtime-result-badge runtime-result-badge--${result.status}`}>{result.status === 'passed' ? 'PASSED' : 'FAILED'}</span></div>
              <div className="runtime-checks">{result.checks.map((check) => <div key={check.id} className={`runtime-check runtime-check--${check.status}`}><strong>{check.status.toUpperCase()}</strong><div><div>{check.label}</div><small>{check.detail}</small></div><span>{check.durationMs} ms</span></div>)}</div>
            </section>
          )}

          <section className="runtime-card">
            <div className="runtime-card__title">Local Execution</div>
            <label className="inspector-field">
              <span>入力</span>
              <textarea rows={3} value={inputText} onChange={(event) => setInputText(event.target.value)} placeholder="Workflowへ渡すユーザー入力" />
            </label>
            <div className="runtime-meta">実行プロセスはlocalhost以外への通信を遮断します。Gemini等の外部APIモデルは失敗します。Ollama等のローカルモデル対応を前提とした安全設定です。</div>
            <div className="runtime-actions">
              <button type="button" className="spec-primary-button" disabled={busy !== null || !settings.token.trim() || !inputText.trim() || !generation.staticCheck.canExport} onClick={() => void execute()}>
                {busy === 'execute' ? '実行中…' : 'ローカル実行'}
              </button>
            </div>
          </section>

          {execution && (
            <section className="runtime-card">
              <div className="runtime-result-header"><div><div className="runtime-card__title">ADK Event Trace</div><div className="runtime-meta">Invocation: {execution.invocationId || '—'}</div></div><span className={`runtime-result-badge runtime-result-badge--${execution.status === 'completed' ? 'passed' : 'failed'}`}>{execution.status === 'completed' ? 'COMPLETED' : 'FAILED'}</span></div>
              {execution.error && <div className="runtime-error">{execution.error}</div>}
              {execution.trace.length > 0 ? (
                <div className="runtime-trace">
                  {execution.trace.map((event, index) => (
                    <div className={`runtime-trace__event ${event.isFinal ? 'runtime-trace__event--final' : ''}`} key={event.eventId || `${index}-${event.author}`}>
                      <strong>{index + 1}. {event.nodeName || event.author || 'event'}</strong>
                      <small>{[event.branch && `branch=${event.branch}`, event.route && `route=${event.route}`, event.functionCalls.length > 0 && `call=${event.functionCalls.join(',')}`, event.functionResponses.length > 0 && `result=${event.functionResponses.join(',')}`].filter(Boolean).join(' / ') || 'ADK event'}</small>
                      {event.text && <div>{event.text}</div>}
                    </div>
                  ))}
                </div>
              ) : <div className="runtime-meta">Trace eventはありません。</div>}
              {execution.finalText && <div className="runtime-final"><strong>Final response</strong><div>{execution.finalText}</div></div>}
            </section>
          )}

          <section className="runtime-card runtime-card--note">
            <div className="runtime-card__title">ローカル完結ポリシー</div>
            <div className="runtime-meta">Bridgeは127.0.0.1のみで待受し、Local Executionはloopback通信だけ許可します。外部Runtime / Cloudflare Tunnel / Cloud Runは使用しません。</div>
          </section>
        </div>
      </section>
    </div>
  );
}
