import { useState } from 'react';
import type { AdkAdapterAnalysis, AdkAdapterSettings } from '../adapters/adk/types';
import './SpecificationPreview.css';

type AdkAdapterPreviewProps = {
  projectName: string;
  analysis: AdkAdapterAnalysis;
  settings: AdkAdapterSettings;
  onSettingsChange: (settings: AdkAdapterSettings) => void;
  onClose: () => void;
};

const safeFileName = (name: string) => {
  const sanitized = name.trim().replace(/[\\/:*?"<>|]+/g, '-');
  return sanitized || 'agent-graph';
};

const fallbackCopy = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
};

export function AdkAdapterPreview({ projectName, analysis, settings, onSettingsChange, onClose }: AdkAdapterPreviewProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyAnalysis = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(analysis.markdown);
      else if (!fallbackCopy(analysis.markdown)) throw new Error('copy failed');
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('failed');
    }
  };

  const downloadAnalysis = () => {
    const blob = new Blob([analysis.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFileName(projectName)}-adk-readiness.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="spec-preview-backdrop" onClick={onClose}>
      <section className="spec-preview" role="dialog" aria-modal="true" aria-label="Google ADK Adapter readiness" onClick={(event) => event.stopPropagation()}>
        <div className="spec-preview__grabber" aria-hidden="true" />
        <header className="spec-preview__header"><div><div className="spec-preview__eyebrow">Google ADK Adapter</div><h2>ADK変換チェック</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="ADK変換チェックを閉じる">×</button></header>
        <div className="spec-preview__status">
          <span className="spec-status">Ready {analysis.readyCount}</span>
          <span className={`spec-status ${analysis.partialCount > 0 ? 'spec-status--warning' : ''}`}>Partial {analysis.partialCount}</span>
          <span className={`spec-status ${analysis.blockedCount > 0 ? 'spec-status--error' : ''}`}>Blocked {analysis.blockedCount}</span>
          <span>Target: ADK 2.x Graph Workflow</span>
        </div>
        <div className="adk-preview-body">
          <div className="adk-settings">
            <label><span>ADK default model</span><input value={settings.defaultModel} placeholder="gemini-flash-latest" onChange={(event) => onSettingsChange({ ...settings, defaultModel: event.target.value })} /></label>
            <small>この値はADK Adapter設定です。Graph IRには保存しません。</small>
          </div>
          <pre className="spec-preview__content">{analysis.markdown}</pre>
        </div>
        <footer className="spec-preview__footer"><span className="spec-preview__copy-state">{copyState === 'copied' ? 'コピーしました' : copyState === 'failed' ? 'コピーできませんでした' : ''}</span><div className="spec-preview__actions"><button type="button" className="project-action" onClick={downloadAnalysis}>.md保存</button><button type="button" className="spec-primary-button" onClick={() => void copyAnalysis()}>コピー</button></div></footer>
      </section>
    </div>
  );
}
