import { describe, it, expect } from 'vitest';
import {
  nbt,
  TagType,
  writeNBT,
  readNBT,
  writeNBTCompressed,
  isGzip,
  getString,
  getNumber,
  getIntArray,
  getLongArray,
} from './nbt';

describe('NBT reader/writer', () => {
  it('round-trips all primitive tag types', () => {
    const root = nbt.compound({
      b: nbt.byte(-5),
      s: nbt.short(1234),
      i: nbt.int(-70000),
      l: nbt.long(9007199254740993n),
      f: nbt.float(1.5),
      d: nbt.double(3.14159265358979),
      str: nbt.string('minecraft:stone_bricks[facing=north]'),
    });

    const bytes = writeNBT('Root', root);
    const parsed = readNBT(bytes);

    expect(parsed.name).toBe('Root');
    const c = parsed.tag.value;
    expect(c.b).toEqual({ type: TagType.Byte, value: -5 });
    expect(c.s).toEqual({ type: TagType.Short, value: 1234 });
    expect(c.i).toEqual({ type: TagType.Int, value: -70000 });
    expect(c.l).toEqual({ type: TagType.Long, value: 9007199254740993n });
    expect(getNumber(c, 'f')).toBeCloseTo(1.5, 5);
    expect(getNumber(c, 'd')).toBeCloseTo(3.14159265358979, 10);
    expect(getString(c, 'str')).toBe('minecraft:stone_bricks[facing=north]');
  });

  it('round-trips arrays and nested lists/compounds', () => {
    const root = nbt.compound({
      ints: nbt.intArray(new Int32Array([1, -2, 3, 2147483647])),
      longs: nbt.longArray(new BigInt64Array([1n, -2n, 9223372036854775807n])),
      bytes: nbt.byteArray(Int8Array.from([0, 127, -128, 42])),
      list: nbt.list(TagType.Compound, [
        nbt.compound({ Name: nbt.string('a') }),
        nbt.compound({ Name: nbt.string('b') }),
      ]),
      emptyList: nbt.list(TagType.Int, []),
    });

    const parsed = readNBT(writeNBT('', root));
    const c = parsed.tag.value;

    expect(Array.from(getIntArray(c, 'ints'))).toEqual([1, -2, 3, 2147483647]);
    expect(Array.from(getLongArray(c, 'longs'))).toEqual([1n, -2n, 9223372036854775807n]);
    const list = c.list;
    expect(list.type).toBe(TagType.List);
    if (list.type === TagType.List) {
      expect(list.value.length).toBe(2);
    }
  });

  it('gzip round-trips and is detected', () => {
    const root = nbt.compound({ hello: nbt.string('world') });
    const gz = writeNBTCompressed('Root', root);
    expect(isGzip(gz)).toBe(true);
    const parsed = readNBT(gz);
    expect(getString(parsed.tag.value, 'hello')).toBe('world');
  });

  it('rejects a non-compound root', () => {
    // Manually craft: tag type Byte (1) as root
    const bad = new Uint8Array([TagType.Byte, 0, 0, 5]);
    expect(() => readNBT(bad)).toThrow();
  });
});
