// ============================================================
// MaterialCalculator — MIneLAb
// Exported utility functions for computing material lists and
// build-time estimates from a StructureData.
// ============================================================

import type { MaterialEntry, MaterialList, BuildStep, StructureData } from '../types/index';
import { countBlocks, getAllNonAirBlocks } from '../core/StructureData';

// ── Constants ─────────────────────────────────────────────────

/** Number of items in one Minecraft stack (most blocks). */
const STACK_SIZE = 64;

/**
 * Approximate seconds to place one block in survival mode,
 * accounting for movement and inventory access overhead.
 */
const SECONDS_PER_BLOCK = 3;

// ── calculateMaterials ────────────────────────────────────────

/**
 * Calculates a full MaterialList for the given structure.
 *
 * Sorted by count descending so the most-used materials appear
 * first (important for build-order planning).
 *
 * Also generates a basic build-order: bottom layer first
 * (Y ascending), then Z, then X, grouping by block type.
 */
export function calculateMaterials(structure: StructureData): MaterialList {
  // ── Count blocks ───────────────────────────────────────────
  const counts = countBlocks(structure);

  const entries: MaterialEntry[] = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([blockId, count]) => ({
      blockId,
      count,
      stacks: Math.floor(count / STACK_SIZE),
      remainder: count % STACK_SIZE,
    }));

  const totalBlocks = entries.reduce((s, e) => s + e.count, 0);
  const estimatedStacks = Math.ceil(totalBlocks / STACK_SIZE);

  // ── Build order ────────────────────────────────────────────
  // Group blocks by Y layer so the user builds from the ground up.
  const layerMap = new Map<number, Map<string, number>>();

  for (const { pos, blockId } of getAllNonAirBlocks(structure)) {
    let yMap = layerMap.get(pos.y);
    if (!yMap) {
      yMap = new Map<string, number>();
      layerMap.set(pos.y, yMap);
    }
    yMap.set(blockId, (yMap.get(blockId) ?? 0) + 1);
  }

  const sortedYLayers = [...layerMap.keys()].sort((a, b) => a - b);

  const buildOrder: BuildStep[] = sortedYLayers.map((y, idx) => {
    const yMap = layerMap.get(y)!;
    const blocks = [...yMap.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([blockId, count]) => ({ blockId, count }));

    return {
      order: idx + 1,
      description: `Layer Y=${y} — ${blocks.reduce((s, b) => s + b.count, 0)} blocks`,
      blocks,
      region: {
        min: { x: 0, y, z: 0 },
        max: {
          x: structure.dimensions.x - 1,
          y,
          z: structure.dimensions.z - 1,
        },
      },
    };
  });

  return {
    blocks: entries,
    totalBlocks,
    estimatedStacks,
    estimatedTime: estimateBuildTime(totalBlocks),
    buildOrder,
  };
}

// ── estimateBuildTime ─────────────────────────────────────────

/**
 * Returns a human-readable build-time estimate string for the
 * given total block count.
 *
 * Examples:
 *  - 60 blocks   -> "3 minutes"
 *  - 1200 blocks -> "1 hour"
 *  - 3600 blocks -> "3 hours"
 */
export function estimateBuildTime(totalBlocks: number): string {
  if (totalBlocks <= 0) return '0 seconds';

  const totalSeconds = Math.round(totalBlocks * SECONDS_PER_BLOCK);

  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''}`;
  }

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

// ── toCSV ─────────────────────────────────────────────────────

/**
 * Serialises a MaterialList to a UTF-8 CSV string.
 *
 * Column layout:
 *   Block ID, Count, Full Stacks, Remainder
 */
export function toCSV(list: MaterialList): string {
  const header = 'Block ID,Count,Full Stacks,Remainder';
  const rows = list.blocks.map(
    e =>
      `${csvEscape(e.blockId)},${e.count},${e.stacks},${e.remainder}`
  );
  const footer = [
    '',
    `Total Blocks,${list.totalBlocks},${list.estimatedStacks},`,
    `Estimated Time,${csvEscape(list.estimatedTime)},,`,
  ];
  return [header, ...rows, ...footer].join('\n');
}

/** Minimal CSV escaping for cell values. */
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ── toText ────────────────────────────────────────────────────

/**
 * Serialises a MaterialList to a human-readable plain-text
 * shopping list suitable for in-game reference or clipboard copy.
 *
 * Example output:
 *
 *   === Material List ===
 *   minecraft:stone_bricks  x  512   (8 stacks)
 *   minecraft:oak_planks    x  128   (2 stacks)
 *   ...
 *   Total: 640 blocks (~10 stacks)
 *   Build time: ~16 minutes
 */
export function toText(list: MaterialList): string {
  if (list.blocks.length === 0) {
    return 'No materials required (empty structure).';
  }

  const maxIdLen = Math.max(...list.blocks.map(e => e.blockId.length));

  const lines: string[] = [
    '=== Material List ===',
    '',
  ];

  for (const entry of list.blocks) {
    const id = entry.blockId.padEnd(maxIdLen, ' ');
    const stackInfo =
      entry.stacks > 0
        ? `(${entry.stacks} stack${entry.stacks !== 1 ? 's' : ''}${entry.remainder > 0 ? ` + ${entry.remainder}` : ''})`
        : `(${entry.remainder} item${entry.remainder !== 1 ? 's' : ''})`;

    lines.push(`  ${id}  x ${String(entry.count).padStart(6, ' ')}   ${stackInfo}`);
  }

  const divider = '\u2500'.repeat(Math.min(60, maxIdLen + 30));
  lines.push(divider);
  lines.push(
    `Total: ${list.totalBlocks} block${list.totalBlocks !== 1 ? 's' : ''} (~${list.estimatedStacks} stack${list.estimatedStacks !== 1 ? 's' : ''})`
  );
  lines.push(`Build time: ~${list.estimatedTime}`);

  if (list.buildOrder.length > 0) {
    lines.push('');
    lines.push('=== Build Order (by layer) ===');
    for (const step of list.buildOrder) {
      lines.push(`  Step ${step.order}: ${step.description}`);
    }
  }

  return lines.join('\n');
}
