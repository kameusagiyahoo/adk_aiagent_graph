export type ValidationSeverity = 'error' | 'warning';

export type ValidationIssueCode =
  | 'duplicate-node-id'
  | 'duplicate-edge-id'
  | 'dangling-edge'
  | 'missing-name'
  | 'missing-agent-instruction'
  | 'missing-router-condition'
  | 'missing-human-prompt'
  | 'isolated-node'
  | 'router-branch-shortage'
  | 'join-input-shortage'
  | 'cycle';

export type ValidationIssue = {
  id: string;
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export type ValidationPolicy = {
  cycleSeverity: ValidationSeverity | 'off';
};

export type ValidationResult = {
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export const defaultValidationPolicy: ValidationPolicy = {
  cycleSeverity: 'warning',
};
