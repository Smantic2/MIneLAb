import { describe, it, expect } from 'vitest';
import {
  createEmpty,
  setBlock,
  getBlock,
  removeBlock,
  countBlocks,
  getAllNonAirBlocks,
  worldToChunk,
  structureSummary,
  CHUNK_SIZE,
} from './StructureData';

describe('StructureData', () => {
  it('creates an empty structure with air at palette index 0', () => {
    const s = createEmpty('Test', { x: 4, y: 4, z: 4 });
    expect(s.palette.blocks[0]).toBe('minecraft:air');
    expect(s.chunks.size).toBe(0);
    expect(getAllNonAirBlocks(s)).toHaveLength(0);
  });

  it('sets and gets a block', () => {
    const s = createEmpty('Test', { x: 4, y: 4, z: 4 });
    setBlock(s, 1, 2, 3, 'minecraft:stone');
    expect(getBlock(s, 1, 2, 3)).toBe('minecraft:stone');
    expect(getBlock(s, 0, 0, 0)).toBe('minecraft:air');
  });

  it('supports the Vec3 accessor overload', () => {
    const s = createEmpty('Test', { x: 4, y: 4, z: 4 });
    setBlock(s, 2, 2, 2, 'minecraft:dirt');
    expect(getBlock(s, { x: 2, y: 2, z: 2 })).toBe('minecraft:dirt');
  });

  it('removes a block by setting air', () => {
    const s = createEmpty('Test', { x: 4, y: 4, z: 4 });
    setBlock(s, 1, 1, 1, 'minecraft:stone');
    removeBlock(s, 1, 1, 1);
    expect(getBlock(s, 1, 1, 1)).toBe('minecraft:air');
  });

  it('handles negative coordinates via floor-based chunking', () => {
    const s = createEmpty('Test', { x: 4, y: 4, z: 4 });
    setBlock(s, -1, -1, -1, 'minecraft:stone');
    expect(getBlock(s, -1, -1, -1)).toBe('minecraft:stone');
    const c = worldToChunk(-1, -1, -1);
    expect(c.chunkX).toBe(-1);
    expect(c.localX).toBe(CHUNK_SIZE - 1);
  });

  it('counts blocks by type excluding air', () => {
    const s = createEmpty('Test', { x: 8, y: 8, z: 8 });
    setBlock(s, 0, 0, 0, 'minecraft:stone');
    setBlock(s, 1, 0, 0, 'minecraft:stone');
    setBlock(s, 2, 0, 0, 'minecraft:dirt');
    const counts = countBlocks(s);
    expect(counts['minecraft:stone']).toBe(2);
    expect(counts['minecraft:dirt']).toBe(1);
    expect(counts['minecraft:air']).toBeUndefined();
  });

  it('produces a structure summary sorted by count', () => {
    const s = createEmpty('Castle', { x: 8, y: 8, z: 8 });
    setBlock(s, 0, 0, 0, 'minecraft:dirt');
    setBlock(s, 1, 0, 0, 'minecraft:stone');
    setBlock(s, 2, 0, 0, 'minecraft:stone');
    const summary = structureSummary(s);
    expect(summary.name).toBe('Castle');
    expect(summary.totalBlocks).toBe(3);
    expect(summary.blockBreakdown[0]).toEqual({ blockId: 'minecraft:stone', count: 2 });
  });

  it('overwrites an existing block in place', () => {
    const s = createEmpty('Test', { x: 4, y: 4, z: 4 });
    setBlock(s, 1, 1, 1, 'minecraft:stone');
    setBlock(s, 1, 1, 1, 'minecraft:dirt');
    expect(getBlock(s, 1, 1, 1)).toBe('minecraft:dirt');
    expect(countBlocks(s)['minecraft:dirt']).toBe(1);
  });
});
