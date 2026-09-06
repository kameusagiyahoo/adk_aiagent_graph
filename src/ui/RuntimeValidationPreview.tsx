import { useState } from 'react';
import type { AdkCodeGeneration } from '../adapters/adk/codegenTypes';
import { checkRuntimeBridge, validateWithRuntimeBridge } from '../runtime/bridge/client';
import type {
  RuntimeBridgeHealth,
  RuntimeBridgeSettings,
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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'health' | 'validate' | null>(null);

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
      const next = await validateWithRuntimeBridge(settings, {
        packageName: generation.packageName,
        files: generation.files.map(({ path, content }) => ({ path, content })),
      });
      setResult(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Runtime検証に失敗しました。');
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
            <div className="spec-preview__eyebrow">STEP 4A — Local Bridge</div>
            <h2>Python / ADK実行前検証</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Runtime検証を閉じる">×</button>
        </header>

        <div className="runtime-preview__body">
          <section className="runtime-card">
            <div className="runtime-card__title">Bridge設定</div>
            <label className="inspector-field">
              <span>Bridge URL</span>
              <input
                value={settings.baseUrl}
                placeholder="http://127.0.0.1:8765"
                onChange={(event) => onSettingsChange({ ...settings, baseUrl: event.target.value })}
              />
            </label>
            <label className="inspector-field">
              <span>起動時Token</span>
              <input
                type="password"
                autoComplete="off"
                value={settings.token}
                placeholder="Bridgeのコンソールに表示されたToken"
                onChange={(event) => onSettingsChange({ ...settings, token: event.target.value })}
              />
            </label>
            <div className="runtime-actions">
              <button type="button" className="project-action" disabled={busy !== null || !settings.token.trim()} onClick={() => void connect()}>
                {busy === 'health' ? '接続中…' : '接続確認'}
              </button>
              <button type="button" className="spec-primary-button" disabled={busy !== null || !settings.token.trim()} onClick={() => void validate()}>
                {busy === 'validate' ? '検証中…' : 'Runtime検証'}
              </button>
            </div>
            <small>
              同一PCでは127.0.0.1を使用します。iPhoneの127.0.0.1はiPhone自身なので、PC上Bridgeへのスマホ接続はSTEP 4Bで対応します。
            </small>
          </section>

          {health && (
            <section className="runtime-card runtime-card--success">
              <div className="runtime-card__title">Bridge接続OK</div>
              <div className="runtime-meta">Python {health.pythonVersion} / google-adk {health.adkVersion} / Bridge {health.version}</div>
            </section>
          )}

          {error && <div className="runtime-error">{error}</div>}

          {result && (
            <section className="runtime-card">
              <div className="runtime-result-header">
                <div>
                  <div className="runtime-card__title">検証結果</div>
                  <div className="runtime-meta">Python {result.pythonVersion} / google-adk {result.adkVersion}</div>
                </div>
                <span className={`runtime-result-badge runtime-result-badge--${result.status}`}>
                  {result.status === 'passed' ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="runtime-checks">
                {result.checks.map((check) => (
                  <div key={check.id} className={`runtime-check runtime-check--${check.status}`}>
                    <strong>{check.status.toUpperCase()}</strong>
                    <div>
                      <div>{check.label}</div>
                      <small>{check.detail}</small>
                    </div>
                    <span>{check.durationMs} ms</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="runtime-card runtime-card--note">
            <div className="runtime-card__title">検証範囲</div>
            <div className="runtime-meta">
              package構造 → Python構文 → google-adk import → 生成package import → root_agent存在 → Workflow型を確認します。AgentのLLM呼び出しやTool実行はまだ行いません。
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
