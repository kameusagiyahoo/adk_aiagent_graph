import type { ValidationResult } from '../../core/validation/types';
import type { AdkAdapterAnalysis } from './types';
import type {
  AdkGeneratedFile,
  AdkStaticCheckIssue,
  AdkStaticCheckResult,
} from './codegenTypes';

type StaticCheckInput = {
  files: AdkGeneratedFile[];
  validation: ValidationResult;
  analysis: AdkAdapterAnalysis;
  todoCount: number;
  nodeCount: number;
};

const REQUIRED_FILES = ['__init__.py', 'agent.py', 'requirements.txt', 'README.md', 'mapping.md'];

const addIssue = (
  issues: AdkStaticCheckIssue[],
  issue: Omit<AdkStaticCheckIssue, 'id'>,
) => {
  issues.push({ ...issue, id: `${issue.code}-${issues.length + 1}` });
};

export const runAdkStaticCheck = ({
  files,
  validation,
  analysis,
  todoCount,
  nodeCount,
}: StaticCheckInput): AdkStaticCheckResult => {
  const issues: AdkStaticCheckIssue[] = [];
  const fileMap = new Map<string, AdkGeneratedFile>();
  const duplicatePaths = new Set<string>();

  for (const file of files) {
    if (fileMap.has(file.path)) {
      duplicatePaths.add(file.path);
    } else {
      fileMap.set(file.path, file);
    }
  }

  for (const path of duplicatePaths) {
    addIssue(issues, {
      code: 'duplicate-generated-path',
      severity: 'error',
      filePath: path,
      message: `生成ファイルのパス「${path}」が重複しています。`,
    });
  }

  for (const path of REQUIRED_FILES) {
    if (!fileMap.has(path)) {
      addIssue(issues, {
        code: 'missing-required-file',
        severity: 'error',
        filePath: path,
        message: `ADKプロジェクトに必須の「${path}」がありません。`,
      });
    }
  }

  if (nodeCount === 0) {
    addIssue(issues, {
      code: 'empty-graph',
      severity: 'error',
      message: 'CanvasにNodeがありません。少なくとも1つNodeを追加してください。',
    });
  }

  if (validation.errors.length > 0) {
    addIssue(issues, {
      code: 'graph-validation-errors',
      severity: 'error',
      message: `Graph Validation Errorが${validation.errors.length}件残っています。`,
    });
  }

  if (analysis.blockedCount > 0) {
    addIssue(issues, {
      code: 'adk-adapter-blocked',
      severity: 'error',
      message: `ADK AdapterでBLOCKEDのNodeが${analysis.blockedCount}件あります。`,
    });
  }

  const initPy = fileMap.get('__init__.py')?.content ?? '';
  if (initPy && !/from\s+\.\s+import\s+agent/.test(initPy)) {
    addIssue(issues, {
      code: 'init-does-not-expose-agent',
      severity: 'error',
      filePath: '__init__.py',
      message: '__init__.pyがagentモジュールを公開していません。',
    });
  }

  const agentPy = fileMap.get('agent.py')?.content ?? '';
  if (agentPy && !/\broot_agent\s*=/.test(agentPy)) {
    addIssue(issues, {
      code: 'missing-root-agent',
      severity: 'error',
      filePath: 'agent.py',
      message: 'agent.pyにroot_agentが定義されていません。',
    });
  }

  const requirements = fileMap.get('requirements.txt')?.content ?? '';
  if (requirements && !/^google-adk(?:\[.*?\])?[<>=~!]/m.test(requirements)) {
    addIssue(issues, {
      code: 'missing-google-adk-requirement',
      severity: 'error',
      filePath: 'requirements.txt',
      message: 'requirements.txtにgoogle-adkの依存関係がありません。',
    });
  }

  const possibleSecretPattern = /(AIza[0-9A-Za-z_-]{30,}|sk-[0-9A-Za-z_-]{20,})/;
  for (const file of files) {
    if (possibleSecretPattern.test(file.content)) {
      addIssue(issues, {
        code: 'possible-secret-literal',
        severity: 'error',
        filePath: file.path,
        message: `「${file.path}」にAPIキーらしき文字列があります。SecretはZIPへ含めないでください。`,
      });
    }
  }

  if (todoCount > 0) {
    addIssue(issues, {
      code: 'generator-todos',
      severity: 'warning',
      message: `生成コードにTODOが${todoCount}件あります。ZIP化できますが、そのままの実行は保証されません。`,
    });
  }

  if (validation.warnings.length > 0) {
    addIssue(issues, {
      code: 'graph-validation-warnings',
      severity: 'warning',
      message: `Graph Validation Warningが${validation.warnings.length}件あります。`,
    });
  }

  if (analysis.partialCount > 0) {
    addIssue(issues, {
      code: 'adk-adapter-partial',
      severity: 'warning',
      message: `ADK AdapterでPARTIALのNodeが${analysis.partialCount}件あります。`,
    });
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');

  return {
    issues,
    errors,
    warnings,
    canExport: errors.length === 0,
  };
};
