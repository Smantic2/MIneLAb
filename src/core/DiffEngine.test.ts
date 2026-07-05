import { describe, it, expect } from 'vitest';
import { applyDiff, invertDiff, validateDiff } from './DiffEngine';
import { createEmpty, setBlock, getBlock } from './StructureData';
import type { Diff } from '../types/index';

function makeDiff(partial: Partial<Diff>): Diff {
  return {
    id: 'test',
    timestamp: new Date().toISOString(),
    description: 'test diff',
    author: 'user',
    add: [],
    remove: [],
    replace: [],
    ...partial,
  };
}

describe('DiffEngine', () => {
  it('applies additions', () => {
    const s = createEmpty('T', { x: 4, y: 4, z: 4 });
    applyDiff(s, makeDiff({ add: [{ block: { id: 'minecraft:stone' }, position: { x: 1, y: 1, z: 1 } }] }));
    expect(getBlock(s, 1, 1, 1)).toBe('minecraft:stone');
  });

  it('applies removals', () => {
    const s = createEmpty('T', { x: 4, y: 4, z: 4 });
    setBlock(s, 1, 1, 1, 'minecraft:stone');
    applyDiff(s, makeDiff({ remove: [{ x: 1, y: 1, z: 1 }] }));
    expect(getBlock(s, 1, 1, 1)).toBe('minecraft:air');
  });

  it('applies replacements', () => {
    const s = createEmpty('T', { x: 4, y: 4, z: 4 });
    setBlock(s, 2, 0, 0, 'minecraft:stone');
    applyDiff(
      s,
      makeDiff({ replace: [{ from: { x: 2, y: 0, z: 0 }, to: { block: { id: 'minecraft:dirt' }, position: { x: 2, y: 0, z: 0 } } }] })
    );
    expect(getBlock(s, 2, 0, 0)).toBe('minecraft:dirt');
  });

  it('inverting an add-diff then applying it undoes the change', () => {
    const s = createEmpty('T', { x: 4, y: 4, z: 4 });
    const diff = makeDiff({ add: [{ block: { id: 'minecraft:stone' }, position: { x: 1, y: 1, z: 1 } }] });
    applyDiff(s, diff);
    const inverse = invertDiff(diff, s);
    applyDiff(s, inverse);
    expect(getBlock(s, 1, 1, 1)).toBe('minecraft:air');
  });

  it('inverting a remove-diff restores the original block', () => {
    const s = createEmpty('T', { x: 4, y: 4, z: 4 });
    setBlock(s, 1, 1, 1, 'minecraft:oak_planks');
    const diff = makeDiff({ remove: [{ x: 1, y: 1, z: 1 }] });
    const inverse = invertDiff(diff, s); // capture pre-diff state
    applyDiff(s, diff);
    expect(getBlock(s, 1, 1, 1)).toBe('minecraft:air');
    applyDiff(s, inverse);
    expect(getBlock(s, 1, 1, 1)).toBe('minecraft:oak_planks');
  });

  it('validates a well-formed diff', () => {
    const diff = makeDiff({ add: [{ block: { id: 'minecraft:stone' }, position: { x: 0, y: 0, z: 0 } }] });
    expect(validateDiff(diff).valid).toBe(true);
  });

  it('rejects an empty diff', () => {
    const result = validateDiff(makeDiff({}));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('no operations'))).toBe(true);
  });

  it('rejects duplicate destination positions', () => {
    const diff = makeDiff({
      add: [
        { block: { id: 'minecraft:stone' }, position: { x: 1, y: 1, z: 1 } },
        { block: { id: 'minecraft:dirt' }, position: { x: 1, y: 1, z: 1 } },
      ],
    });
    const result = validateDiff(diff);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });
});
