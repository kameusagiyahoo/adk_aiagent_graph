export type AdkGeneratedFile = {
  path: string;
  language: 'python' | 'text' | 'markdown';
  content: string;
};

export type AdkCodeGeneration = {
  files: AdkGeneratedFile[];
  todoCount: number;
  isRunnable: boolean;
  warnings: string[];
};
