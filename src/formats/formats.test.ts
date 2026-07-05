import { describe, it, expect } from 'vitest';
import type { StructureData, Vec3 } from '../types/index';
import { createEmpty, setBlock, getAllNonAirBlocks } from '../core/StructureData';
import {
  exportSchem,
  importSchem,
  exportStructureNbt,
  importStructureNbt,
  exportLitematic,
  importLitematic,
  detectFormat,
  exportBinary,
  importBinary,
  exceedsStructureBlockLimit,
} from './index';

/** Builds a small sample structure anchored at the origin. */
function sampleStructure(): StructureData {
  const s = createEmpty('Sample', { x: 8, y: 8, z: 8 });
  // A floor of stone bricks
  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 8; z++) {
      setBlock(s, x, 0, z, 'minecraft:stone_bricks');
    }
  }
  // A couple of stairs with states and some logs
  setBlock(s, 0, 1, 0, 'minecraft:oak_stairs[facing=north,half=bottom,shape=straight]');
  setBlock(s, 7, 1, 7, 'minecraft:oak_stairs[facing=south,half=top,shape=straight]');
  setBlock(s, 3, 2, 3, 'minecraft:oak_log[axis=y]');
  setBlock(s, 4, 5, 4, 'minecraft:glass');
  setBlock(s, 1, 7, 6, 'minecraft:glowstone');
  return s;
}

/** Canonical, order-independent representation of a structure's blocks. */
function blockSet(s: StructureData): string[] {
  return getAllNonAirBlocks(s)
    .map(({ pos, blockId }) => `${pos.x},${pos.y},${pos.z}=${blockId}`)
    .sort();
}

describe('format round-trips', () => {
  it('Sponge .schem preserves all blocks and states', () => {
    const original = sampleStructure();
    const bytes = exportSchem(original);
    const restored = importSchem(bytes);
    expect(blockSet(restored)).toEqual(blockSet(original));
  });

  it('vanilla structure .nbt preserves all blocks and states', () => {
    const original = sampleStructure();
    const bytes = exportStructureNbt(original);
    const restored = importStructureNbt(bytes);
    expect(blockSet(restored)).toEqual(blockSet(original));
  });

  it('Litematica .litematic preserves all blocks and states', () => {
    const original = sampleStructure();
    const bytes = exportLitematic(original);
    const restored = importLitematic(bytes);
    expect(blockSet(restored)).toEqual(blockSet(original));
  });

  it('handles a larger palette that forces multi-byte varints / >2 bits', () => {
    const s = createEmpty('Palette', { x: 20, y: 1, z: 1 });
    // 20 distinct block types along a line -> palette needs >4 bits
    for (let x = 0; x < 20; x++) {
      setBlock(s, x, 0, 0, `minecraft:test_block_${x}`);
    }
    for (const fmt of ['schem', 'litematic', 'nbt'] as const) {
      const restored = importBinary(fmt, exportBinary(fmt, s));
      expect(blockSet(restored)).toEqual(blockSet(s));
    }
  });

  it('produces GZIP-compressed output for all binary formats', () => {
    const s = sampleStructure();
    for (const fmt of ['schem', 'litematic', 'nbt'] as const) {
      const bytes = exportBinary(fmt, s);
      expect(bytes[0]).toBe(0x1f);
      expect(bytes[1]).toBe(0x8b);
    }
  });
});

describe('format detection', () => {
  it('detects by extension', () => {
    const s = sampleStructure();
    expect(detectFormat('build.schem', exportSchem(s))).toBe('schem');
    expect(detectFormat('build.litematic', exportLitematic(s))).toBe('litematic');
    expect(detectFormat('build.nbt', exportStructureNbt(s))).toBe('nbt');
  });

  it('detects by NBT content when extension is unknown', () => {
    const s = sampleStructure();
    expect(detectFormat('build.bin', exportLitematic(s))).toBe('litematic');
    expect(detectFormat('build.bin', exportSchem(s))).toBe('schem');
    expect(detectFormat('build.bin', exportStructureNbt(s))).toBe('nbt');
  });

  it('returns null for non-structure data', () => {
    expect(detectFormat('random.txt', new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});

describe('structure block size limit', () => {
  it('flags structures larger than 48 on any axis', () => {
    const small = createEmpty('S', { x: 4, y: 4, z: 4 });
    setBlock(small, 0, 0, 0, 'minecraft:stone');
    setBlock(small, 3, 3, 3, 'minecraft:stone');
    expect(exceedsStructureBlockLimit(small)).toBe(false);

    const big = createEmpty('B', { x: 60, y: 4, z: 4 });
    setBlock(big, 0, 0, 0, 'minecraft:stone');
    setBlock(big, 59, 0, 0, 'minecraft:stone');
    expect(exceedsStructureBlockLimit(big)).toBe(true);
  });
});
