// ============================================================
// DiffEngine — MIneLAb
// Exported functions for applying, inverting, and validating
// Diff objects against a StructureData.
// ============================================================

const makeId = () => Math.random().toString(36).slice(2);
import type { Diff, StructureData, Vec3 } from '../types/index';
import {
  getBlock,
  setBlock,
  removeBlock,
} from '../core/StructureData';

// ── applyDiff ─────────────────────────────────────────────────

/**
 * Applies a Diff to a StructureData **in place** (mutates).
 *
 * Execution order:
 *  1. Remove  – clear listed positions (set to air).
 *  2. Replace – swap listed positions from one block to another.
 *  3. Add     – place new blocks at listed positions.
 *
 * This order ensures replaces and adds are not clobbered by
 * remove operations within the same diff.
 */
export function applyDiff(structure: StructureData, diff: Diff): void {
  // 1. Removals
  for (const pos of diff.remove) {
    removeBlock(structure, pos.x, pos.y, pos.z);
  }

  // 2. Replacements
  for (const { to } of diff.replace) {
    setBlock(structure, to.position.x, to.position.y, to.position.z, to.block.id);
  }

  // 3. Additions
  for (const placement of diff.add) {
    setBlock(
      structure,
      placement.position.x,
      placement.position.y,
      placement.position.z,
      placement.block.id
    );
  }
}

// ── invertDiff ────────────────────────────────────────────────

/**
 * Creates the inverse Diff that will undo the effect of `diff`
 * when applied to `structure` **after** the diff has already
 * been applied (i.e. the structure is in its post-diff state).
 *
 * The inverse swaps adds/removes and reverses replacements.
 * It reads the current block at each "remove" position so it
 * can restore them — callers should pass the pre-diff state
 * or a snapshot if they need exact restoration.
 */
export function invertDiff(diff: Diff, structure: StructureData): Diff {
  // Invert additions -> removals (remove the added blocks)
  const invertedRemove: Vec3[] = diff.add.map(p => ({ ...p.position }));

  // Invert removals -> additions (restore the previously existing blocks)
  const invertedAdd = diff.remove.map(pos => {
    const blockId = getBlock(structure, pos.x, pos.y, pos.z);
    return {
      block: { id: blockId },
      position: { ...pos },
    };
  });

  // Invert replacements: swap "from" and "to"
  const invertedReplace = diff.replace.map(({ from, to }) => ({
    from: { ...to.position },
    to: {
      block: { id: getBlock(structure, from.x, from.y, from.z) },
      position: { ...from },
    },
  }));

  return {
    id: makeId(),
    timestamp: new Date().toISOString(),
    description: `Undo: ${diff.description}`,
    author: diff.author,
    add: invertedAdd,
    remove: invertedRemove,
    replace: invertedReplace,
  };
}

// ── validateDiff ─────────────────────────────────────────────

/** Result of validating a Diff. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates the structural integrity of a Diff without mutating
 * any data. Checks for:
 *  - Required fields presence
 *  - Non-empty diff (at least one operation)
 *  - Valid Vec3 coordinates (finite numbers)
 *  - Non-empty block IDs
 *  - No duplicate positions across add / replace.to operations
 *  - Correct author value
 */
export function validateDiff(diff: Diff): ValidationResult {
  const errors: string[] = [];

  // ── Basic field checks ─────────────────────────────────────

  if (!diff.id || typeof diff.id !== 'string' || diff.id.trim() === '') {
    errors.push('diff.id must be a non-empty string.');
  }

  if (!diff.timestamp || typeof diff.timestamp !== 'string') {
    errors.push('diff.timestamp must be a valid ISO 8601 string.');
  } else {
    const ts = Date.parse(diff.timestamp);
    if (isNaN(ts)) {
      errors.push(`diff.timestamp "${diff.timestamp}" is not a valid date.`);
    }
  }

  if (!diff.description || typeof diff.description !== 'string') {
    errors.push('diff.description must be a non-empty string.');
  }

  if (diff.author !== 'user' && diff.author !== 'ai') {
    errors.push(`diff.author must be "user" or "ai", got "${diff.author}".`);
  }

  // ── Array checks ───────────────────────────────────────────

  if (!Array.isArray(diff.add)) {
    errors.push('diff.add must be an array.');
  }
  if (!Array.isArray(diff.remove)) {
    errors.push('diff.remove must be an array.');
  }
  if (!Array.isArray(diff.replace)) {
    errors.push('diff.replace must be an array.');
  }

  // ── Emptiness check ────────────────────────────────────────

  if (
    Array.isArray(diff.add) &&
    Array.isArray(diff.remove) &&
    Array.isArray(diff.replace) &&
    diff.add.length === 0 &&
    diff.remove.length === 0 &&
    diff.replace.length === 0
  ) {
    errors.push('Diff has no operations (add, remove, and replace are all empty).');
  }

  // ── Validate Vec3 helper ───────────────────────────────────

  function isFiniteVec3(v: Vec3, label: string): boolean {
    if (
      typeof v?.x !== 'number' || !isFinite(v.x) ||
      typeof v?.y !== 'number' || !isFinite(v.y) ||
      typeof v?.z !== 'number' || !isFinite(v.z)
    ) {
      errors.push(`${label} has invalid coordinates: ${JSON.stringify(v)}.`);
      return false;
    }
    return true;
  }

  // ── Validate add entries ───────────────────────────────────

  if (Array.isArray(diff.add)) {
    diff.add.forEach((placement, i) => {
      const label = `diff.add[${i}]`;
      if (!placement.block?.id || typeof placement.block.id !== 'string' || placement.block.id.trim() === '') {
        errors.push(`${label}.block.id must be a non-empty string.`);
      }
      if (placement.position) {
        isFiniteVec3(placement.position, `${label}.position`);
      } else {
        errors.push(`${label}.position is missing.`);
      }
    });
  }

  // ── Validate remove entries ────────────────────────────────

  if (Array.isArray(diff.remove)) {
    diff.remove.forEach((pos, i) => {
      isFiniteVec3(pos, `diff.remove[${i}]`);
    });
  }

  // ── Validate replace entries ───────────────────────────────

  if (Array.isArray(diff.replace)) {
    diff.replace.forEach((entry, i) => {
      const label = `diff.replace[${i}]`;
      if (entry.from) {
        isFiniteVec3(entry.from, `${label}.from`);
      } else {
        errors.push(`${label}.from is missing.`);
      }
      if (!entry.to?.block?.id || typeof entry.to.block.id !== 'string' || entry.to.block.id.trim() === '') {
        errors.push(`${label}.to.block.id must be a non-empty string.`);
      }
      if (entry.to?.position) {
        isFiniteVec3(entry.to.position, `${label}.to.position`);
      } else {
        errors.push(`${label}.to.position is missing.`);
      }
    });
  }

  // ── Duplicate destination check ────────────────────────────

  const positionKey = (v: Vec3) => `${Math.round(v.x)},${Math.round(v.y)},${Math.round(v.z)}`;
  const destinationKeys = new Set<string>();
  const duplicates = new Set<string>();

  if (Array.isArray(diff.add)) {
    for (const p of diff.add) {
      if (!p.position) continue;
      const k = positionKey(p.position);
      if (destinationKeys.has(k)) duplicates.add(k);
      destinationKeys.add(k);
    }
  }
  if (Array.isArray(diff.replace)) {
    for (const r of diff.replace) {
      if (!r.to?.position) continue;
      const k = positionKey(r.to.position);
      if (destinationKeys.has(k)) duplicates.add(k);
      destinationKeys.add(k);
    }
  }

  if (duplicates.size > 0) {
    errors.push(
      `Duplicate destination positions found: ${[...duplicates].join(', ')}.`
    );
  }

  return { valid: errors.length === 0, errors };
}
