// ============================================================
// AI Parser — MIneLAb
// Converts AI tool calls into Diff objects that can be applied
// to a StructureData.
// ============================================================

// ID generation handled by generateId() below
import type { Block, BlockPlacement, Diff, StructureData, Vec3 } from '../types/index';
import { getBlock } from '../core/StructureData';

// ── Minimal UUID helper (no external dep) ───────────────────
function generateId(): string {
  // crypto.randomUUID is available in modern browsers and Node 14.17+
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: pseudo-random hex string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Tool call types ──────────────────────────────────────────

export interface RawToolCall {
  /** Tool name, e.g. "place_block" */
  name: string;
  /** Parsed arguments object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arguments: Record<string, any>;
}

// ── Internal helpers ─────────────────────────────────────────

function makeBlock(blockId: string): Block {
  return { id: blockId };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Normalises a region so min <= max on every axis. */
function normaliseRegion(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
): [number, number, number, number, number, number] {
  return [
    Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2),
    Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2),
  ];
}

// ── Tool handlers ────────────────────────────────────────────

function handlePlaceBlock(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>,
  add: BlockPlacement[],
): void {
  const { x, y, z, block } = args as { x: number; y: number; z: number; block: string };
  add.push({ position: { x, y, z }, block: makeBlock(block) });
}

function handleFillRegion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>,
  add: BlockPlacement[],
): void {
  const { x1, y1, z1, x2, y2, z2, block } = args as {
    x1: number; y1: number; z1: number;
    x2: number; y2: number; z2: number;
    block: string;
  };
  const [minX, minY, minZ, maxX, maxY, maxZ] = normaliseRegion(x1, y1, z1, x2, y2, z2);
  const blockObj = makeBlock(block);

  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        add.push({ position: { x, y, z }, block: blockObj });
      }
    }
  }
}

function handleRemoveBlocks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>,
  remove: Vec3[],
): void {
  const { x1, y1, z1, x2, y2, z2 } = args as {
    x1: number; y1: number; z1: number;
    x2: number; y2: number; z2: number;
  };
  const [minX, minY, minZ, maxX, maxY, maxZ] = normaliseRegion(x1, y1, z1, x2, y2, z2);

  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        remove.push({ x, y, z });
      }
    }
  }
}

function handleReplaceBlocks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>,
  structure: StructureData,
  replace: Diff['replace'],
): void {
  const { x1, y1, z1, x2, y2, z2, from_block, to_block } = args as {
    x1: number; y1: number; z1: number;
    x2: number; y2: number; z2: number;
    from_block: string;
    to_block: string;
  };
  const [minX, minY, minZ, maxX, maxY, maxZ] = normaliseRegion(x1, y1, z1, x2, y2, z2);
  const toBlock = makeBlock(to_block);

  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const existing = getBlock(structure, x, y, z);
        if (existing && existing !== 'minecraft:air' && existing === from_block) {
          replace.push({
            from: { x, y, z },
            to: { position: { x, y, z }, block: toBlock },
          });
        }
      }
    }
  }
}

// ── Public API ───────────────────────────────────────────────

/**
 * Converts an array of AI tool calls into typed add/remove/replace arrays.
 * Skips non-structural tools (get_structure_info, measure_area).
 */
export function parseToolCalls(
  toolCalls: RawToolCall[],
  structure: StructureData,
): { add: BlockPlacement[]; remove: Vec3[]; replace: Diff['replace'] } {
  const add: BlockPlacement[] = [];
  const remove: Vec3[] = [];
  const replace: Diff['replace'] = [];

  for (const call of toolCalls) {
    try {
      switch (call.name) {
        case 'place_block':
          handlePlaceBlock(call.arguments, add);
          break;
        case 'fill_region':
          handleFillRegion(call.arguments, add);
          break;
        case 'remove_blocks':
          handleRemoveBlocks(call.arguments, remove);
          break;
        case 'replace_blocks':
          handleReplaceBlocks(call.arguments, structure, replace);
          break;
        case 'get_structure_info':
        case 'measure_area':
          // Informational tools — no structural change
          break;
        default:
          console.warn(`[MIneLAb] Unknown tool call: "${call.name}"`);
      }
    } catch (err) {
      console.error(`[MIneLAb] Error parsing tool call "${call.name}":`, err, call.arguments);
    }
  }

  return { add, remove, replace };
}

/**
 * Converts an array of AI tool calls into a full Diff object,
 * ready to be applied to the structure or pushed to history.
 *
 * @param toolCalls - Raw tool call objects from the AI response
 * @param structure - The current StructureData (needed for replace_blocks lookups)
 * @param description - Human-readable description of the change (from AI message)
 */
export function toolCallsToDiff(
  toolCalls: RawToolCall[],
  structure: StructureData,
  description = 'AI-generated changes',
): Diff {
  const { add, remove, replace } = parseToolCalls(toolCalls, structure);

  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    description,
    author: 'ai',
    add,
    remove,
    replace,
  };
}
