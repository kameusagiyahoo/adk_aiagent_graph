import type { GraphProject } from '../graph/types';
import type { SpecificationDocument } from '../specification/types';
import type { ValidationIssue, ValidationResult } from '../validation/types';
import type { PromptDocument } from './types';

const formatIssue = (issue: ValidationIssue) => {
  const refs = [
    issue.nodeId ? `node=${issue.nodeId}` : '',
    issue.edgeId ? `edge=${issue.edgeId}` : '',
  ].filter(Boolean);
  const refText = refs.length > 0 ? ` (${refs.join(', ')})` : '';
  return `- [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}${refText}`;
};

export const generateCodingPrompt = (
  project: GraphProject,
  specification: SpecificationDocument,
  validation: ValidationResult,
): PromptDocument => {
  const hasErrors = validation.errors.length > 0;
  const validationLines = validation.issues.length > 0
    ? validation.issues.map(formatIssue)
    : ['- Error / Warningなし'];

  const lines = [
    `# 実装依頼: ${project.name}`,
    '',
    '## あなたの役割',
    'あなたはAIエージェント/ワークフローを実装するソフトウェアエンジニアです。以下のGraph仕様を唯一の機能要件として扱い、保守可能な実装へ変換してください。',
    '',
    '## 目的',
    `Graph Project「${project.name}」を、Nodeの役割・接続関係・設定値を維持したまま実装してください。`,
    '',
    '## 実装ルール',
    '- Graph仕様に存在しないNode、Edge、分岐条件、業務ルールを勝手に追加しないでください。',
    '- 未設定値や曖昧な項目を推測で埋めないでください。必要な箇所はTODOとして明示し、実装不能なら不足情報として報告してください。',
    '- 既存リポジトリがある場合は、その技術スタック、ディレクトリ構成、命名規約、テスト方針を優先してください。',
    '- 新規実装の場合は、目的を満たす最小で保守しやすい構成を選び、選定理由を短く説明してください。',
    '- Graphのドメインモデルと、UIや特定Runtime/Frameworkのコードを分離してください。',
    '- Framework固有処理が必要な場合はAdapter層に閉じ込め、Graphの意味そのものをFramework依存にしないでください。',
    '- APIキー、Token、PasswordなどのSecretをソースコードへ埋め込まないでください。',
    '- Node/Edge IDと接続方向を保持し、Graph仕様と実装の対応関係が追跡できるようにしてください。',
    '- RouterのEdgeには現時点で分岐ラベルがないため、条件ごとの行き先を勝手に決めないでください。',
    '',
    '## Validation状態',
    `- Error: ${validation.errors.length}`,
    `- Warning: ${validation.warnings.length}`,
    hasErrors
      ? '- **重要:** Validation Errorが残っています。未設定内容を推測して完成扱いにせず、実装可能な骨格まで作成し、残件をTODOとして明示してください。'
      : '- Validation Errorはありません。Warningは設計上の注意事項として確認してください。',
    '',
    ...validationLines,
    '',
    '## Graph仕様',
    '',
    specification.markdown,
    '',
    '## 期待する成果物',
    '1. Graph仕様に対応した実装コード',
    '2. Node/Edgeと実装箇所の対応が分かる構成',
    '3. 主要なGraph処理を検証するテスト',
    '4. 起動方法・実行方法を示すREADMEまたは同等の説明',
    '5. 推測せず残したTODO / 未解決事項の一覧',
    '',
    '## 完了条件',
    '- Graph仕様のNodeが実装上すべて追跡できる。',
    '- Edgeの接続方向と処理の流れがGraph仕様と一致する。',
    '- Agent / Router / Tool / HumanInput / Joinの意味が実装で失われていない。',
    '- Validation Errorを無断で補完して隠していない。',
    '- Graph IR相当のドメイン情報がUI/Runtime固有型だけに閉じ込められていない。',
    '- Secretがハードコードされていない。',
    '- 実装後に、変更内容・テスト結果・残TODOを簡潔に報告する。',
  ];

  return {
    projectId: project.id,
    projectName: project.name,
    target: 'generic-coding-llm',
    validationErrorCount: validation.errors.length,
    validationWarningCount: validation.warnings.length,
    markdown: lines.join('\n'),
  };
};
