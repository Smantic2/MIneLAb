import { describe, it, expect } from 'vitest';
import { parseBlockId, buildBlockId, withNamespace, writeVarInt, readVarInt } from './blockState';

describe('blockState parsing', () => {
  it('parses a bare block id', () => {
    expect(parseBlockId('minecraft:stone')).toEqual({ name: 'minecraft:stone', properties: {} });
  });

  it('parses block id with properties', () => {
    expect(parseBlockId('minecraft:oak_stairs[facing=north,half=bottom,shape=straight]')).toEqual({
      name: 'minecraft:oak_stairs',
      properties: { facing: 'north', half: 'bottom', shape: 'straight' },
    });
  });

  it('rebuilds a canonical (sorted) id', () => {
    expect(buildBlockId('minecraft:oak_stairs', { half: 'bottom', facing: 'north' })).toBe(
      'minecraft:oak_stairs[facing=north,half=bottom]'
    );
    expect(buildBlockId('minecraft:stone')).toBe('minecraft:stone');
  });

  it('parse → build is stable', () => {
    const id = 'minecraft:redstone_wire[east=side,north=none,power=15]';
    const { name, properties } = parseBlockId(id);
    expect(buildBlockId(name, properties)).toBe(id);
  });

  it('adds namespace when missing', () => {
    expect(withNamespace('stone')).toBe('minecraft:stone');
    expect(withNamespace('minecraft:stone')).toBe('minecraft:stone');
  });
});

describe('varint codec', () => {
  it('round-trips single-byte and multi-byte values', () => {
    for (const v of [0, 1, 127, 128, 255, 300, 16384, 2097151, 268435455]) {
      const out: number[] = [];
      writeVarInt(out, v);
      const { value, next } = readVarInt(Int8Array.from(out.map((b) => (b << 24) >> 24)), 0);
      expect(value).toBe(v);
      expect(next).toBe(out.length);
    }
  });

  it('reads a sequence of varints with correct offsets', () => {
    const out: number[] = [];
    const seq = [5, 200, 3, 400];
    for (const v of seq) writeVarInt(out, v);
    const bytes = Int8Array.from(out.map((b) => (b << 24) >> 24));
    let pos = 0;
    const read: number[] = [];
    for (let i = 0; i < seq.length; i++) {
      const { value, next } = readVarInt(bytes, pos);
      read.push(value);
      pos = next;
    }
    expect(read).toEqual(seq);
    expect(pos).toBe(bytes.length);
  });
});
