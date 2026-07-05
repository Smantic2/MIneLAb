// ============================================================
// HistoryManager — MIneLAb
// Bounded undo/redo stack for Diff-based edit history.
// ============================================================

import type { Diff } from '../types/index';

// ── Constants ─────────────────────────────────────────────────

/** Maximum number of undoable operations kept in memory. */
const MAX_HISTORY = 100;

// ── HistoryManager ────────────────────────────────────────────

/**
 * Manages undo/redo history for a single structure session.
 *
 * Usage:
 * ```ts
 * const history = new HistoryManager();
 *
 * // After applying a diff to the structure:
 * history.push(diff);
 *
 * // To undo:
 * const undoDiff = history.getUndoDiff();
 * if (undoDiff) {
 *   const inverse = invertDiff(undoDiff, structure);
 *   applyDiff(structure, inverse);
 * }
 *
 * // To redo:
 * const redoDiff = history.getRedoDiff();
 * if (redoDiff) applyDiff(structure, redoDiff);
 * ```
 *
 * Thread safety: not guaranteed (single-threaded browser usage assumed).
 */
export class HistoryManager {
  /** Maximum capacity of the undo stack. */
  static readonly MAX_HISTORY = MAX_HISTORY;

  /**
   * Undo stack — most recent diff at the end (top of stack).
   * Capped at MAX_HISTORY entries (oldest are evicted first).
   */
  private undoStack: Diff[] = [];

  /**
   * Redo stack — next diff to redo at the end (top of stack).
   * Cleared whenever a new diff is pushed (new edit invalidates
   * the redo branch).
   */
  private redoStack: Diff[] = [];

  // ── Mutations ───────────────────────────────────────────────

  /**
   * Records a newly applied Diff onto the undo stack and clears
   * the redo stack (non-linear history is not supported).
   *
   * If the undo stack would exceed MAX_HISTORY, the oldest entry
   * is evicted from the front.
   */
  push(diff: Diff): void {
    this.undoStack.push(diff);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift(); // evict oldest
    }
    // A new edit invalidates the redo branch.
    this.redoStack = [];
  }

  /**
   * Pops and returns the most recent Diff for undoing, or `null`
   * if there is nothing to undo.
   *
   * The popped diff is moved to the redo stack so it can be
   * re-applied if the user chooses to redo.
   *
   * Note: the caller is responsible for computing and applying the
   * **inverse** of the returned diff (via `invertDiff`).
   */
  getUndoDiff(): Diff | null {
    const diff = this.undoStack.pop();
    if (!diff) return null;
    this.redoStack.push(diff);
    return diff;
  }

  /**
   * Pops and returns the most recent Diff for redoing, or `null`
   * if there is nothing to redo.
   *
   * The popped diff is moved back to the undo stack.
   *
   * Note: the caller is responsible for applying the returned diff
   * directly (via `applyDiff`) since it represents the forward
   * direction of the edit.
   */
  getRedoDiff(): Diff | null {
    const diff = this.redoStack.pop();
    if (!diff) return null;
    this.undoStack.push(diff);
    return diff;
  }

  // ── Queries ─────────────────────────────────────────────────

  /** Returns `true` when there is at least one diff to undo. */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Returns `true` when there is at least one diff to redo. */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Number of diffs currently on the undo stack. */
  get undoCount(): number {
    return this.undoStack.length;
  }

  /** Number of diffs currently on the redo stack. */
  get redoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Peeks at the most recent undo diff without removing it.
   * Returns `null` if the stack is empty.
   */
  peekUndo(): Diff | null {
    return this.undoStack[this.undoStack.length - 1] ?? null;
  }

  /**
   * Peeks at the most recent redo diff without removing it.
   * Returns `null` if the stack is empty.
   */
  peekRedo(): Diff | null {
    return this.redoStack[this.redoStack.length - 1] ?? null;
  }

  // ── Lifecycle ───────────────────────────────────────────────

  /**
   * Clears both the undo and redo stacks, resetting history.
   * Useful when loading a new project or discarding all changes.
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
