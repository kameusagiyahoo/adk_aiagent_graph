import type { ToolConfig, ToolType } from './types';

export const createToolConfig = (toolType: ToolType): ToolConfig => {
  switch (toolType) {
    case 'custom':
      return { toolType, functionName: '', description: '' };
    case 'http':
      return { toolType, method: 'GET', url: '' };
    case 'mcp':
      return { toolType, transport: 'stdio', command: '', args: '', url: '' };
    case 'search':
      return { toolType, provider: '' };
    case 'database':
      return { toolType, connectionRef: '', operation: '' };
    case 'file':
      return { toolType, operation: 'read', path: '' };
  }
};
