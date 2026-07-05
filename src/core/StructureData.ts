// ============================================================
// StructureData — MIneLAb
// Utility functions for reading and mutating StructureData.
// NOT a class — pure functions that operate on the data types
// defined in src/types/index.ts.
// ============================================================

const makeId = () => Math.random().toString(36).slice(2);
import type {
  Vec3,
  Block,
  ChunkData,
  StructureData,
  Palette,
  StructureMetadata,
  StructureSummary,
} from '../types/index';

// ── Constants ─────────────────────────────────────────────────

/** Standard Minecraft chunk edge length (blocks per axis). */
export const CHUNK_SIZE = 16;

/** The namespaced air block ID. */
const AIR_ID = 'minecraft:air';

// ── Coordinate Utilities ──────────────────────────────────────

/**
 * Produces the canonical Map key for a chunk at chunk-space
 * coordinates (cx, cy, cz).
 */
export function chunkKey(cx: number, cy: number, cz: number): string {
  return `${cx}|${cy}|${cz}`;
}

/** Result type for worldToChunk. */
export interface ChunkCoords {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  localX: number;
  localY: number;
  localZ: number;
}

/**
 * Converts absolute world coordinates to chunk + local coordinates.
 * Uses Math.floor so negative coordinates are handled correctly.
 */
export function worldToChunk(x: number, y: number, z: number): ChunkCoords {
  const chunkX = Math.floor(x / CHUNK_SIZE);
  const chunkY = Math.floor(y / CHUNK_SIZE);
  const chunkZ = Math.floor(z / CHUNK_SIZE);
  return {
    chunkX,
    chunkY,
    chunkZ,
    localX: ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    localY: ((y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    localZ: ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
  };
}

/**
 * Maps local block coordinates within a chunk (0-15 each axis)
 * to a flat Uint8Array index.
 *
 * Layout: X-major -> Z-minor -> Y-major
 *   index = lx + lz * 16 + ly * 256
 */
export function localIndex(lx: number, ly: number, lz: number): number {
  return lx + lz * CHUNK_SIZE + ly * CHUNK_SIZE * CHUNK_SIZE;
}

// ── Factory Helpers ───────────────────────────────────────────

/** Returns a fresh default StructureMetadata object. */
function defaultMetadata(): StructureMetadata {
  const now = new Date().toISOString();
  return {
    author: 'user',
    description: '',
    tags: [],
    createdAt: now,
    modifiedAt: now,
    version: '1.0.0',
    minecraftVersion: '1.20',
  };
}

// ── Structure Factory ─────────────────────────────────────────

/**
 * Creates a brand-new, empty StructureData.
 *
 * @param name       - Human-readable name
 * @param dimensions - Maximum extents (not necessarily chunk-aligned)
 * @param palette    - Optional initial palette; defaults to [AIR_ID]
 */
export function createEmpty(
  name: string,
  dimensions: Vec3,
  palette?: string[]
): StructureData {
  const blocks = palette && palette.length > 0 ? [...palette] : [AIR_ID];

  // Guarantee air is always index 0.
  if (blocks[0] !== AIR_ID) {
    blocks.unshift(AIR_ID);
  }

  return {
    id: makeId(),
    name,
    dimensions,
    palette: { blocks },
    chunks: new Map<string, ChunkData>(),
    metadata: defaultMetadata(),
  };
}

// ── Chunk Management ─────────────────────────────────────────

/**
 * Retrieves the ChunkData for chunk coordinates (cx, cy, cz),
 * creating and registering a new, air-filled chunk if absent.
 */
export function getOrCreateChunk(
  structure: StructureData,
  cx: number,
  cy: number,
  cz: number
): ChunkData {
  const key = chunkKey(cx, cy, cz);
  let chunk = structure.chunks.get(key);
  if (!chunk) {
    chunk = {
      position: { x: cx, y: cy, z: cz },
      // 4096 bytes, all zero -> all "air" (palette index 0)
      blocks: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE),
      dirty: false,
    };
    structure.chunks.set(key, chunk);
  }
  return chunk;
}

// ── Palette Management ────────────────────────────────────────

/**
 * Returns the palette index for blockId, adding it if necessary.
 * Palette index 0 is always reserved for air.
 */
function ensurePaletteEntry(palette: Palette, blockId: string): number {
  const idx = palette.blocks.indexOf(blockId);
  if (idx !== -1) return idx;
  palette.blocks.push(blockId);
  return palette.blocks.length - 1;
}

// ── Block Accessors ───────────────────────────────────────────

/**
 * Returns the block ID at world position.
 * Accepts either (structure, x, y, z) or (structure, Vec3).
 */
export function getBlock(structure: StructureData, xOrPos: number | Vec3, y?: number, z?: number): string {
  let wx: number, wy: number, wz: number;
  if (typeof xOrPos === 'object') {
    wx = xOrPos.x; wy = xOrPos.y; wz = xOrPos.z;
  } else {
    wx = xOrPos; wy = y!; wz = z!;
  }
  const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(wx, wy, wz);
  const chunk = structure.chunks.get(chunkKey(chunkX, chunkY, chunkZ));
  if (!chunk) return AIR_ID;
  const paletteIdx = chunk.blocks[localIndex(localX, localY, localZ)];
  return structure.palette.blocks[paletteIdx] ?? AIR_ID;
}

/**
 * Sets the block at world position (x, y, z) to blockId.
 * Mutates the structure and marks the affected chunk as dirty.
 * Automatically extends the palette as needed.
 *
 * @throws RangeError when the palette would exceed 255 entries
 *         (Uint8Array maximum representable index).
 */
export function setBlock(
  structure: StructureData,
  xOrPos: number | Vec3,
  yOrBlock: number | Block,
  zOrUndefined?: number | string,
  blockIdOrUndefined?: string
): void {
  let wx: number, wy: number, wz: number, blockId: string;
  if (typeof xOrPos === 'object') {
    wx = xOrPos.x; wy = xOrPos.y; wz = xOrPos.z;
    blockId = yOrBlock as unknown as string;
  } else {
    wx = xOrPos; wy = yOrBlock as number; wz = zOrUndefined as number;
    blockId = blockIdOrUndefined as string;
  }
  // Use internal setter
  _setBlockInternal(structure, wx, wy, wz, blockId);
}

function _setBlockInternal(
  structure: StructureData,
  x: number,
  y: number,
  z: number,
  blockId: string
): void {
  const { chunkX, chunkY, chunkZ, localX, localY, localZ } = worldToChunk(x, y, z);
  const chunk = getOrCreateChunk(structure, chunkX, chunkY, chunkZ);

  const paletteIdx = ensurePaletteEntry(structure.palette, blockId);

  if (paletteIdx > 255) {
    throw new RangeError(
      `Palette overflow: cannot add "${blockId}". ` +
        `Uint8Array supports a maximum of 256 palette entries.`
    );
  }

  chunk.blocks[localIndex(localX, localY, localZ)] = paletteIdx;
  chunk.dirty = true;

  // Update modifiedAt timestamp
  structure.metadata.modifiedAt = new Date().toISOString();
}

/**
 * Removes the block at position by setting it to air.
 * Accepts (structure, x, y, z) or (structure, Vec3).
 */
export function removeBlock(
  structure: StructureData,
  xOrPos: number | Vec3,
  y?: number,
  z?: number
): void {
  if (typeof xOrPos === 'object') {
    _setBlockInternal(structure, xOrPos.x, xOrPos.y, xOrPos.z, AIR_ID);
  } else {
    _setBlockInternal(structure, xOrPos, y!, z!, AIR_ID);
  }
}

// ── Bulk Queries ──────────────────────────────────────────────

/**
 * Iterates all chunks and collects every non-air block position
 * alongside its block ID.
 */
export function getAllNonAirBlocks(
  structure: StructureData
): Array<{ pos: Vec3; blockId: string }> {
  const results: Array<{ pos: Vec3; blockId: string }> = [];

  for (const [, chunk] of structure.chunks) {
    const { x: cx, y: cy, z: cz } = chunk.position;

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const paletteIdx = chunk.blocks[localIndex(lx, ly, lz)];
          // Index 0 is always air.
          if (paletteIdx === 0) continue;

          const blockId = structure.palette.blocks[paletteIdx];
          if (!blockId || blockId === AIR_ID) continue;

          results.push({
            pos: {
              x: cx * CHUNK_SIZE + lx,
              y: cy * CHUNK_SIZE + ly,
              z: cz * CHUNK_SIZE + lz,
            },
            blockId,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Returns a map from block ID to count of occurrences
 * across the entire structure (air excluded).
 */
export function countBlocks(
  structure: StructureData
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const [, chunk] of structure.chunks) {
    for (const paletteIdx of chunk.blocks) {
      if (paletteIdx === 0) continue;
      const blockId = structure.palette.blocks[paletteIdx];
      if (!blockId || blockId === AIR_ID) continue;
      counts[blockId] = (counts[blockId] ?? 0) + 1;
    }
  }

  return counts;
}

/**
 * Computes a lightweight StructureSummary for use in AI prompts
 * and diff generation.
 */
export function structureSummary(structure: StructureData): StructureSummary {
  const counts = countBlocks(structure);
  const totalBlocks = Object.values(counts).reduce((s, c) => s + c, 0);

  const blockBreakdown = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([blockId, count]) => ({ blockId, count }));

  return {
    name: structure.name,
    dimensions: { ...structure.dimensions },
    totalBlocks,
    blockBreakdown,
    palette: [...structure.palette.blocks],
  };
}
