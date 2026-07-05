// ============================================================
// projectStore.ts — MIneLAb
// Zustand store for project management.
// Projects (including their StructureData) are persisted to
// localStorage. Because StructureData.chunks is a Map, we
// serialise it as an array of [key, value] entries and restore
// it on load.
// ============================================================

import { create } from 'zustand';
import { Project, StructureData, ChunkData } from '../types/index';
import { createEmpty } from '../core/StructureData';

// ── localStorage key ──────────────────────────────────────────

const LS_PROJECTS = 'minelab_projects';

// ── Map serialisation helpers ─────────────────────────────────

/** Serialisable representation of a single chunk. */
interface SerializedChunk {
  key: string;
  position: ChunkData['position'];
  /** Base64-encoded Uint8Array */
  blocks: string;
  dirty: boolean;
}

/** Serialisable representation of a StructureData. */
interface SerializedStructure
  extends Omit<StructureData, 'chunks'> {
  chunks: SerializedChunk[];
}

/** Serialisable representation of a Project. */
interface SerializedProject extends Omit<Project, 'structure'> {
  structure: SerializedStructure;
}

// ── Uint8Array ↔ Base64 ───────────────────────────────────────

const uint8ToBase64 = (arr: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
};

const base64ToUint8 = (b64: string): Uint8Array => {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
};

// ── Serialise / deserialise StructureData ─────────────────────

const serializeStructure = (structure: StructureData): SerializedStructure => {
  const chunks: SerializedChunk[] = [];
  structure.chunks.forEach((chunk, key) => {
    chunks.push({
      key,
      position: chunk.position,
      blocks: uint8ToBase64(chunk.blocks),
      dirty: chunk.dirty,
    });
  });
  return { ...structure, chunks };
};

const deserializeStructure = (raw: SerializedStructure): StructureData => {
  const chunks = new Map<string, ChunkData>();
  for (const entry of raw.chunks) {
    chunks.set(entry.key, {
      position: entry.position,
      blocks: base64ToUint8(entry.blocks),
      dirty: entry.dirty,
    });
  }
  return { ...raw, chunks };
};

// ── Serialise / deserialise Project list ──────────────────────

const serializeProjects = (projects: Project[]): string => {
  const serialized: SerializedProject[] = projects.map((p) => ({
    ...p,
    structure: serializeStructure(p.structure),
  }));
  return JSON.stringify(serialized);
};

const deserializeProjects = (raw: string): Project[] => {
  const parsed: SerializedProject[] = JSON.parse(raw);
  return parsed.map((p) => ({
    ...p,
    structure: deserializeStructure(p.structure),
  }));
};

// ── Persistence helpers ───────────────────────────────────────

const persistProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(LS_PROJECTS, serializeProjects(projects));
  } catch (err) {
    console.error('[projectStore] Failed to persist projects:', err);
  }
};

// ── ID generator ──────────────────────────────────────────────

const makeId = (): string => Math.random().toString(36).slice(2);

const now = (): string => new Date().toISOString();

// ── State shape ───────────────────────────────────────────────

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;

  // ── Actions ──────────────────────────────────────────────

  /**
   * Create a brand-new project with an empty structure.
   * Immediately saves to localStorage and sets as the current project.
   */
  createProject: (name: string, description?: string) => Project;

  /**
   * Make a project from the list the active project.
   * Does nothing if the ID is not found.
   */
  openProject: (id: string) => void;

  /**
   * Persist the current project back to localStorage.
   * Call this after any structure mutation.
   */
  saveCurrentProject: () => void;

  /**
   * Permanently remove a project from the list and from localStorage.
   * If it was the current project, currentProject is set to null.
   */
  deleteProject: (id: string) => void;

  /**
   * Load the project list from localStorage into state.
   * Should be called once at app startup.
   */
  loadProjects: () => void;

  /**
   * Replace the structure on the current project.
   * Useful when the editor applies a diff or the user imports a file.
   */
  updateCurrentStructure: (structure: StructureData) => void;
}

// ── Store ─────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────

  currentProject: null,
  projects: [],
  isLoading: false,

  // ── Actions ───────────────────────────────────────────────

  createProject: (name, description = '') => {
    const timestamp = now();

    // Default dimensions: 16 × 16 × 16 (one chunk)
    const structure = createEmpty(name, { x: 16, y: 16, z: 16 });

    const project: Project = {
      id: makeId(),
      name,
      description,
      structure,
      versions: [],
      branches: [],
      currentBranchId: '',
      currentVersionId: '',
      createdAt: timestamp,
      modifiedAt: timestamp,
    };

    set((state) => {
      const projects = [...state.projects, project];
      persistProjects(projects);
      return { projects, currentProject: project };
    });

    return project;
  },

  openProject: (id) => {
    const { projects } = get();
    const project = projects.find((p) => p.id === id) ?? null;
    set({ currentProject: project });
  },

  saveCurrentProject: () => {
    const { currentProject, projects } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      modifiedAt: now(),
    };

    const updatedList = projects.map((p) =>
      p.id === updated.id ? updated : p
    );

    persistProjects(updatedList);
    set({ projects: updatedList, currentProject: updated });
  },

  deleteProject: (id) => {
    const { projects, currentProject } = get();
    const updatedList = projects.filter((p) => p.id !== id);
    persistProjects(updatedList);

    set({
      projects: updatedList,
      currentProject:
        currentProject?.id === id ? null : currentProject,
    });
  },

  loadProjects: () => {
    set({ isLoading: true });
    try {
      const raw = localStorage.getItem(LS_PROJECTS);
      if (!raw) {
        set({ projects: [], isLoading: false });
        return;
      }
      const projects = deserializeProjects(raw);
      set({ projects, isLoading: false });
    } catch (err) {
      console.error('[projectStore] Failed to load projects:', err);
      set({ projects: [], isLoading: false });
    }
  },

  updateCurrentStructure: (structure) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated: Project = {
      ...currentProject,
      structure,
      modifiedAt: now(),
    };

    set((state) => {
      const projects = state.projects.map((p) =>
        p.id === updated.id ? updated : p
      );
      persistProjects(projects);
      return { projects, currentProject: updated };
    });
  },
}));
