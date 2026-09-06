import { useMemo, useState } from 'react';
import type { AdkCodeGeneration } from '../adapters/adk/codegenTypes';
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
            <div className="spec-preview__eyebrow">Google ADK Code Generator</div>
            <h2>ADK Python Preview</h2>
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
          <span>{projectName}</span>
        </div>

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
          <span className="spec-preview__copy-state">
            {copyState === 'copied'
              ? 'コピーしました'
              : copyState === 'failed'
                ? 'コピーできませんでした'
                : 'ZIP Exportは次STEP'}
          </span>
          <div className="spec-preview__actions">
            <button type="button" className="project-action" onClick={downloadFile}>
              ファイル保存
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
