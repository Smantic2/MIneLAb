import { describe, it, expect } from 'vitest';
import { calculateMaterials, estimateBuildTime, toCSV, toText } from './MaterialCalculator';
import { createEmpty, setBlock } from './StructureData';

describe('MaterialCalculator', () => {
  it('calculates counts, stacks and remainders', () => {
    const s = createEmpty('T', { x: 16, y: 4, z: 16 });
    // 65 stone -> 1 stack + 1 remainder
    let placed = 0;
    for (let x = 0; x < 16 && placed < 65; x++) {
      for (let z = 0; z < 16 && placed < 65; z++) {
        setBlock(s, x, 0, z, 'minecraft:stone');
        placed++;
      }
    }
    const list = calculateMaterials(s);
    const stone = list.blocks.find((b) => b.blockId === 'minecraft:stone')!;
    expect(stone.count).toBe(65);
    expect(stone.stacks).toBe(1);
    expect(stone.remainder).toBe(1);
    expect(list.totalBlocks).toBe(65);
    expect(list.estimatedStacks).toBe(2);
  });

  it('sorts materials by descending count', () => {
    const s = createEmpty('T', { x: 8, y: 8, z: 8 });
    setBlock(s, 0, 0, 0, 'minecraft:dirt');
    setBlock(s, 1, 0, 0, 'minecraft:stone');
    setBlock(s, 2, 0, 0, 'minecraft:stone');
    setBlock(s, 3, 0, 0, 'minecraft:stone');
    const list = calculateMaterials(s);
    expect(list.blocks[0].blockId).toBe('minecraft:stone');
  });

  it('builds a per-layer build order', () => {
    const s = createEmpty('T', { x: 4, y: 4, z: 4 });
    setBlock(s, 0, 0, 0, 'minecraft:stone');
    setBlock(s, 0, 1, 0, 'minecraft:stone');
    setBlock(s, 0, 2, 0, 'minecraft:stone');
    const list = calculateMaterials(s);
    expect(list.buildOrder).toHaveLength(3);
    expect(list.buildOrder[0].order).toBe(1);
  });

  it('estimates build time in human-readable form', () => {
    expect(estimateBuildTime(0)).toBe('0 seconds');
    expect(estimateBuildTime(1)).toBe('3 seconds');
    expect(estimateBuildTime(20)).toBe('1 minute');
    expect(estimateBuildTime(1200)).toBe('1 hour');
  });

  it('serialises to CSV and text', () => {
    const s = createEmpty('T', { x: 4, y: 4, z: 4 });
    setBlock(s, 0, 0, 0, 'minecraft:stone');
    const list = calculateMaterials(s);
    const csv = toCSV(list);
    expect(csv).toContain('Block ID,Count,Full Stacks,Remainder');
    expect(csv).toContain('minecraft:stone,1,0,1');
    const text = toText(list);
    expect(text).toContain('minecraft:stone');
    expect(text).toContain('Total: 1 block');
  });

  it('reports empty structures gracefully', () => {
    const s = createEmpty('Empty', { x: 4, y: 4, z: 4 });
    const list = calculateMaterials(s);
    expect(list.totalBlocks).toBe(0);
    expect(toText(list)).toContain('No materials required');
  });
});
