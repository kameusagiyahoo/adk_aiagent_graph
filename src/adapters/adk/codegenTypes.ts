export type AdkGeneratedFile = {
  path: string;
  language: 'python' | 'text' | 'markdown';
  content: string;
};

export type AdkStaticCheckSeverity = 'error' | 'warning';

export type AdkStaticCheckIssue = {
  id: string;
  code: string;
  severity: AdkStaticCheckSeverity;
  message: string;
  filePath?: string;
};

export type AdkStaticCheckResult = {
  issues: AdkStaticCheckIssue[];
  errors: AdkStaticCheckIssue[];
  warnings: AdkStaticCheckIssue[];
  canExport: boolean;
};

export type AdkCodeGeneration = {
  packageName: string;
  files: AdkGeneratedFile[];
  todoCount: number;
  isRunnable: boolean;
  warnings: string[];
  staticCheck: AdkStaticCheckResult;
};
