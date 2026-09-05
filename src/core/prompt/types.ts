export type PromptTarget = 'generic-coding-llm';

export type PromptDocument = {
  projectId: string;
  projectName: string;
  target: PromptTarget;
  validationErrorCount: number;
  validationWarningCount: number;
  markdown: string;
};
