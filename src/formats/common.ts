// ============================================================
// formats/common.ts — MIneLAb
// Shared helpers used by all binary format import/export modules.
// ============================================================

import type { StructureData, Vec3 } from '../types/index';
import { getAllNonAirBlocks, setBlock, createEmpty } from '../core/StructureData';

const AIR = 'minecraft:air';

export interface Bounds {
  min: Vec3;
  max: Vec3;
  size: Vec3; // max - min + 1 (0,0,0 when empty)
}

/**
 * Computes the tight bounding box over all non-air blocks.
 * Returns a zero-size box anchored at the origin for empty structures.
 */
export function computeBounds(structure: StructureData): Bounds {
  const blocks = getAllNonAirBlocks(structure);
  if (blocks.length === 0) {
    return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 }, size: { x: 0, y: 0, z: 0 } };
  }
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const { pos } of blocks) {
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.z < minZ) minZ = pos.z;
    if (pos.x > maxX) maxX = pos.x;
    if (pos.y > maxY) maxY = pos.y;
    if (pos.z > maxZ) maxZ = pos.z;
  }
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    size: { x: maxX - minX + 1, y: maxY - minY + 1, z: maxZ - minZ + 1 },
  };
}

/**
 * Builds a dense [x][y][z] grid of block IDs (air where empty),
 * normalised so the minimum corner sits at (0,0,0).
 */
export function toDenseGrid(structure: StructureData): {
  bounds: Bounds;
  /** get(x,y,z) with 0-based, min-corner-relative coordinates */
  get: (x: number, y: number, z: number) => string;
} {
  const bounds = computeBounds(structure);
  const { size, min } = bounds;
  const total = Math.max(0, size.x * size.y * size.z);
  const grid = new Array<string>(total).fill(AIR);
  const idx = (x: number, y: number, z: number) => (y * size.z + z) * size.x + x;

  for (const { pos, blockId } of getAllNonAirBlocks(structure)) {
    grid[idx(pos.x - min.x, pos.y - min.y, pos.z - min.z)] = blockId;
  }

  return {
    bounds,
    get: (x, y, z) => grid[idx(x, y, z)] ?? AIR,
  };
}

/**
 * Reconstructs a StructureData from a flat list of placed blocks.
 * Air entries are skipped. Coordinates are used verbatim.
 */
export function structureFromBlocks(
  name: string,
  size: Vec3,
  blocks: Array<{ pos: Vec3; blockId: string }>
): StructureData {
  const structure = createEmpty(name, size);
  for (const { pos, blockId } of blocks) {
    if (!blockId || blockId === AIR) continue;
    setBlock(structure, pos.x, pos.y, pos.z, blockId);
  }
  return structure;
}
