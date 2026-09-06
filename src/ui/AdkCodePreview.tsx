import { useMemo, useState } from 'react';
import type { AdkCodeGeneration } from '../adapters/adk/codegenTypes';
import { downloadAdkProjectZip } from '../adapters/adk/exportZip';
import './SpecificationPreview.css';
import './AdkCodePreview.css';

type AdkCodePreviewProps = {
  projectName: string;
  generation: AdkCodeGeneration;
  onClose: () => void;
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

export function AdkCodePreview({ projectName, generation, onClose }: AdkCodePreviewProps) {
  const firstPath = generation.files[0]?.path ?? '';
  const [selectedPath, setSelectedPath] = useState(firstPath);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [zipState, setZipState] = useState<'idle' | 'saved' | 'failed'>('idle');

  const selectedFile = useMemo(
    () => generation.files.find((file) => file.path === selectedPath) ?? generation.files[0],
    [generation.files, selectedPath],
  );

  const copyFile = async () => {
    if (!selectedFile) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(selectedFile.content);
      } else if (!fallbackCopy(selectedFile.content)) {
        throw new Error('copy failed');
      }
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      setCopyState('failed');
    }
  };

  const downloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = selectedFile.path;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const downloadZip = () => {
    try {
      downloadAdkProjectZip(generation);
      setZipState('saved');
      window.setTimeout(() => setZipState('idle'), 1800);
    } catch {
      setZipState('failed');
    }
  };

  const footerMessage = (() => {
    if (copyState === 'copied') return 'コピーしました';
    if (copyState === 'failed') return 'コピーできませんでした';
    if (zipState === 'saved') return 'ZIPを保存しました';
    if (zipState === 'failed') return 'ZIPを作成できませんでした';
    if (!generation.staticCheck.canExport) {
      return `ZIP停止: Static Error ${generation.staticCheck.errors.length}`;
    }
    return `ZIP Export可能: ${generation.packageName}/`;
  })();

  return (
    <div className="spec-preview-backdrop" onClick={onClose}>
      <section
        className="spec-preview adk-code-preview"
        role="dialog"
        aria-modal="true"
        aria-label="Google ADK Python code preview"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="spec-preview__grabber" aria-hidden="true" />
        <header className="spec-preview__header">
          <div>
            <div className="spec-preview__eyebrow">Google ADK Project Generator</div>
            <h2>ADK Python Project</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="コードを閉じる">
            ×
          </button>
        </header>

        <div className="spec-preview__status">
          <span className={`spec-status ${generation.isRunnable ? '' : 'spec-status--warning'}`}>
            {generation.isRunnable ? 'Runnable' : 'Needs TODO'}
          </span>
          <span className={`spec-status ${generation.todoCount > 0 ? 'spec-status--warning' : ''}`}>
            TODO {generation.todoCount}
          </span>
          <span className={`spec-status ${generation.staticCheck.errors.length > 0 ? 'spec-status--error' : ''}`}>
            Static E{generation.staticCheck.errors.length}
          </span>
          <span className={`spec-status ${generation.staticCheck.warnings.length > 0 ? 'spec-status--warning' : ''}`}>
            W{generation.staticCheck.warnings.length}
          </span>
          <span>{projectName}</span>
        </div>

        <details className="code-static-check" open={generation.staticCheck.errors.length > 0}>
          <summary>
            Static check: {generation.staticCheck.canExport ? 'PASS' : 'BLOCKED'}
          </summary>
          <div className="code-static-check__issues">
            {generation.staticCheck.issues.length === 0 ? (
              <div className="code-static-check__empty">構造上の問題は検出されませんでした。</div>
            ) : (
              generation.staticCheck.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`code-static-check__issue code-static-check__issue--${issue.severity}`}
                >
                  <strong>{issue.severity.toUpperCase()}</strong>
                  <span>
                    {issue.filePath ? `${issue.filePath}: ` : ''}
                    {issue.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </details>

        <nav className="code-file-tabs" aria-label="Generated files">
          {generation.files.map((file) => (
            <button
              type="button"
              key={file.path}
              className={`code-file-tab ${file.path === selectedFile?.path ? 'code-file-tab--active' : ''}`}
              onClick={() => setSelectedPath(file.path)}
            >
              {file.path}
            </button>
          ))}
        </nav>

        <pre className="spec-preview__content adk-code-preview__content">
          {selectedFile?.content ?? '生成ファイルがありません。'}
        </pre>

        <footer className="spec-preview__footer">
          <span className="spec-preview__copy-state">{footerMessage}</span>
          <div className="spec-preview__actions">
            <button type="button" className="project-action" onClick={downloadFile}>
              ファイル保存
            </button>
            <button
              type="button"
              className="project-action"
              onClick={downloadZip}
              disabled={!generation.staticCheck.canExport}
            >
              ZIP保存
            </button>
            <button type="button" className="spec-primary-button" onClick={() => void copyFile()}>
              コピー
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
