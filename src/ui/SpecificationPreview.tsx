import { useState } from 'react';
import './SpecificationPreview.css';

type SpecificationPreviewProps = {
  projectName: string;
  markdown: string;
  errorCount: number;
  warningCount: number;
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

export function SpecificationPreview({
  projectName,
  markdown,
  errorCount,
  warningCount,
  onClose,
}: SpecificationPreviewProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyMarkdown = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else if (!fallbackCopy(markdown)) {
        throw new Error('copy failed');
      }
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('failed');
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFileName(projectName)}-spec.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="spec-preview-backdrop" onClick={onClose}>
      <section
        className="spec-preview"
        role="dialog"
        aria-modal="true"
        aria-label="Graph仕様書プレビュー"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="spec-preview__grabber" aria-hidden="true" />
        <header className="spec-preview__header">
          <div>
            <div className="spec-preview__eyebrow">Specification Generator</div>
            <h2>Graph仕様書</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="仕様書を閉じる">
            ×
          </button>
        </header>

        <div className="spec-preview__status">
          <span className={`spec-status ${errorCount > 0 ? 'spec-status--error' : ''}`}>
            Error {errorCount}
          </span>
          <span className={`spec-status ${warningCount > 0 ? 'spec-status--warning' : ''}`}>
            Warning {warningCount}
          </span>
          <span>仕様書はValidation結果に関係なく生成できます</span>
        </div>

        <pre className="spec-preview__content">{markdown}</pre>

        <footer className="spec-preview__footer">
          <span className="spec-preview__copy-state">
            {copyState === 'copied' ? 'コピーしました' : copyState === 'failed' ? 'コピーできませんでした' : ''}
          </span>
          <div className="spec-preview__actions">
            <button type="button" className="project-action" onClick={downloadMarkdown}>
              .md保存
            </button>
            <button type="button" className="spec-primary-button" onClick={() => void copyMarkdown()}>
              コピー
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
