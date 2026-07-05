// ============================================================
// editorStore.ts — MIneLAb
// Zustand store for editor state: structure, selection,
// settings, undo/redo stack, and block-manipulation actions.
// ============================================================

import { create } from 'zustand';
import {
  StructureData,
  Diff,
  Vec3,
  Selection,
  EditorSettings,
  BlockPlacement,
} from '../types/index';
import {
  setBlock as setBlockUtil,
  removeBlock as removeBlockUtil,
  createEmpty,
  getBlock,
} from '../core/StructureData';
import { applyDiff as applyDiffUtil, invertDiff } from '../core/DiffEngine';

// ── Helpers ──────────────────────────────────────────────────

const makeId = (): string => Math.random().toString(36).slice(2);

const now = (): string => new Date().toISOString();

// ── State shape ───────────────────────────────────────────────

interface EditorState {
  // Data
  structure: StructureData | null;
  selection: Selection | null;
  settings: EditorSettings;
  undoStack: Diff[];
  redoStack: Diff[];

  // UI
  isLoading: boolean;
  loadingProgress: number;
  hoveredBlock: Vec3 | null;
  layerRange: { min: number; max: number } | null;

  // ── Actions ──────────────────────────────────────────────

  /** Replace the active structure entirely. */
  setStructure: (structure: StructureData | null) => void;

  /** Replace the current selection. */
  setSelection: (selection: Selection | null) => void;

  /** Partial-update editor settings. */
  updateSettings: (partial: Partial<EditorSettings>) => void;

  /** Shortcut to change the selected block type. */
  setSelectedBlockId: (blockId: string) => void;

  /**
   * Place a block at the given position.
   * Builds a Diff, applies it, pushes to undoStack and clears redoStack.
   */
  placeBlock: (pos: Vec3, blockId: string, states?: Record<string, string>) => void;

  /**
   * Remove the block at the given position.
   * Builds a Diff and applies it.
   */
  removeBlock: (pos: Vec3) => void;

  /**
   * Apply an externally constructed Diff (e.g. from AI).
   * Pushes the inverse to undoStack.
   */
  applyDiff: (diff: Diff) => void;

  /** Undo the last action. */
  undo: () => void;

  /** Redo the last undone action. */
  redo: () => void;

  /** Update loading state and optional progress (0–1). */
  setLoading: (loading: boolean, progress?: number) => void;

  setHoveredBlock: (pos: Vec3 | null) => void;

  setLayerRange: (range: { min: number; max: number } | null) => void;

  /**
   * Create a new, empty project structure and set it as active.
   * @param name        Human-readable name for the structure.
   * @param dimensions  Width × height × depth in blocks.
   */
  newProject: (name: string, dimensions: Vec3) => void;

  /** Wipe the current structure from state. */
  clearStructure: () => void;
}

// ── Default values ────────────────────────────────────────────

const DEFAULT_SETTINGS: EditorSettings = {
  viewMode: 'solid',
  cameraMode: 'orbit',
  showGrid: true,
  showAxes: true,
  showChunkBoundaries: false,
  showCoordinates: true,
  activeTool: 'select',
  selectedBlockId: 'minecraft:stone_bricks',
};

// ── Store ─────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────

  structure: null,
  selection: null,
  settings: { ...DEFAULT_SETTINGS },
  undoStack: [],
  redoStack: [],
  isLoading: false,
  loadingProgress: 0,
  hoveredBlock: null,
  layerRange: null,

  // ── Setters ───────────────────────────────────────────────

  setStructure: (structure) => set({ structure }),

  setSelection: (selection) => set({ selection }),

  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),

  setSelectedBlockId: (blockId) =>
    set((state) => ({
      settings: { ...state.settings, selectedBlockId: blockId },
    })),

  setLoading: (loading, progress = 0) =>
    set({ isLoading: loading, loadingProgress: progress }),

  setHoveredBlock: (pos) => set({ hoveredBlock: pos }),

  setLayerRange: (range) => set({ layerRange: range }),

  // ── Block operations ──────────────────────────────────────

  placeBlock: (pos, blockId, states) => {
    const { structure } = get();
    if (!structure) return;

    const existing = getBlock(structure, pos);
    const isAir = existing === 'minecraft:air';

    const placement: BlockPlacement = {
      block: { id: blockId, ...(states ? { states } : {}) },
      position: pos,
    };

    const diff: Diff = {
      id: makeId(),
      timestamp: now(),
      description: `Place ${blockId} at (${pos.x},${pos.y},${pos.z})`,
      author: 'user',
      add: isAir ? [placement] : [],
      remove: [],
      replace: !isAir ? [{ from: pos, to: placement }] : [],
    };

    // Mutate structure in-place
    setBlockUtil(structure, pos.x, pos.y, pos.z, blockId);

    set((state) => ({
      structure: state.structure ? { ...state.structure } : null,
      undoStack: [...state.undoStack.slice(-99), diff],
      redoStack: [],
    }));
  },

  removeBlock: (pos) => {
    const { structure } = get();
    if (!structure) return;

    const existing = getBlock(structure, pos);
    if (!existing || existing === 'minecraft:air') return;

    const diff: Diff = {
      id: makeId(),
      timestamp: now(),
      description: `Remove block at (${pos.x},${pos.y},${pos.z})`,
      author: 'user',
      add: [],
      remove: [pos],
      replace: [],
    };

    removeBlockUtil(structure, pos.x, pos.y, pos.z);

    set((state) => ({
      structure: state.structure ? { ...state.structure } : null,
      undoStack: [...state.undoStack.slice(-99), diff],
      redoStack: [],
    }));
  },

  applyDiff: (diff) => {
    const { structure } = get();
    if (!structure) return;

    const inverse = invertDiff(diff, structure);
    applyDiffUtil(structure, diff);

    set((state) => ({
      structure: state.structure ? { ...state.structure } : null,
      undoStack: [...state.undoStack.slice(-99), inverse],
      redoStack: [],
    }));
  },

  // ── Undo / Redo ───────────────────────────────────────────

  undo: () => {
    const { structure, undoStack, redoStack } = get();
    if (!structure || undoStack.length === 0) return;

    const inverseDiff = undoStack[undoStack.length - 1];
    const forwardDiff = invertDiff(inverseDiff, structure);
    applyDiffUtil(structure, inverseDiff);

    set({
      structure: { ...structure },
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, forwardDiff],
    });
  },

  redo: () => {
    const { structure, undoStack, redoStack } = get();
    if (!structure || redoStack.length === 0) return;

    const diff = redoStack[redoStack.length - 1];
    const inverse = invertDiff(diff, structure);
    applyDiffUtil(structure, diff);

    set({
      structure: { ...structure },
      undoStack: [...undoStack, inverse],
      redoStack: redoStack.slice(0, -1),
    });
  },

  // ── Project lifecycle ─────────────────────────────────────

  newProject: (name, dimensions) => {
    const structure = createEmpty(name, dimensions);
    set({
      structure,
      selection: null,
      undoStack: [],
      redoStack: [],
    });
  },

  clearStructure: () =>
    set({
      structure: null,
      selection: null,
      undoStack: [],
      redoStack: [],
    }),
}));
