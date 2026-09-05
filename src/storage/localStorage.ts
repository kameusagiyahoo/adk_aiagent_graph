import { createEmptyProject } from '../core/graph/project';
import type { GraphProject } from '../core/graph/types';
import { parseGraphProject } from './json';

const STORAGE_KEY = 'agent-graph-designer.project.v1';

export const loadProjectFromLocalStorage = (): GraphProject => {
  if (typeof window === 'undefined') {
    return createEmptyProject();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyProject();
    }

    return parseGraphProject(JSON.parse(raw));
  } catch (error) {
    console.warn('Saved graph could not be loaded.', error);
    return createEmptyProject();
  }
};

export const saveProjectToLocalStorage = (project: GraphProject) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (error) {
    console.warn('Graph could not be saved to localStorage.', error);
  }
};
