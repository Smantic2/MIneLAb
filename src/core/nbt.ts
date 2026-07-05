// ============================================================
// nbt.ts — MIneLAb
// Pure-TypeScript NBT (Named Binary Tag) reader & writer.
//
// Implements the full Java-edition NBT spec (all 13 tag types),
// big-endian encoding, and GZIP (de)compression via fflate.
//
// Values are represented as a tagged union (NBTTag) so that the
// exact tag type is preserved through a read → write round-trip.
// Convenience constructors (byte, short, int, …, compound, list)
// make authoring compounds ergonomic.
// ============================================================

import { gzipSync, gunzipSync } from 'fflate';

// ── Tag types ─────────────────────────────────────────────────

export enum TagType {
  End = 0,
  Byte = 1,
  Short = 2,
  Int = 3,
  Long = 4,
  Float = 5,
  Double = 6,
  ByteArray = 7,
  String = 8,
  List = 9,
  Compound = 10,
  IntArray = 11,
  LongArray = 12,
}

export interface NBTCompound {
  [key: string]: NBTTag;
}

export type NBTTag =
  | { type: TagType.Byte; value: number }
  | { type: TagType.Short; value: number }
  | { type: TagType.Int; value: number }
  | { type: TagType.Long; value: bigint }
  | { type: TagType.Float; value: number }
  | { type: TagType.Double; value: number }
  | { type: TagType.ByteArray; value: Int8Array }
  | { type: TagType.String; value: string }
  | { type: TagType.List; listType: TagType; value: NBTTag[] }
  | { type: TagType.Compound; value: NBTCompound }
  | { type: TagType.IntArray; value: Int32Array }
  | { type: TagType.LongArray; value: BigInt64Array };

/** A named root tag as produced by {@link readNBT}. */
export interface NBTRoot {
  name: string;
  tag: Extract<NBTTag, { type: TagType.Compound }>;
}

// ── Convenience constructors ──────────────────────────────────

export const nbt = {
  byte: (value: number): NBTTag => ({ type: TagType.Byte, value: value | 0 }),
  short: (value: number): NBTTag => ({ type: TagType.Short, value: value | 0 }),
  int: (value: number): NBTTag => ({ type: TagType.Int, value: value | 0 }),
  long: (value: bigint): NBTTag => ({ type: TagType.Long, value }),
  float: (value: number): NBTTag => ({ type: TagType.Float, value }),
  double: (value: number): NBTTag => ({ type: TagType.Double, value }),
  byteArray: (value: Int8Array): NBTTag => ({ type: TagType.ByteArray, value }),
  string: (value: string): NBTTag => ({ type: TagType.String, value }),
  intArray: (value: Int32Array): NBTTag => ({ type: TagType.IntArray, value }),
  longArray: (value: BigInt64Array): NBTTag => ({ type: TagType.LongArray, value }),
  list: (listType: TagType, value: NBTTag[]): NBTTag => ({ type: TagType.List, listType, value }),
  compound: (value: NBTCompound): Extract<NBTTag, { type: TagType.Compound }> => ({
    type: TagType.Compound,
    value,
  }),
};

// ── Writer ────────────────────────────────────────────────────

class ByteWriter {
  private buf: Uint8Array;
  private view: DataView;
  private pos = 0;
  private encoder = new TextEncoder();

  constructor(initial = 1024) {
    this.buf = new Uint8Array(initial);
    this.view = new DataView(this.buf.buffer);
  }

  private ensure(extra: number): void {
    if (this.pos + extra <= this.buf.length) return;
    let cap = this.buf.length * 2;
    while (cap < this.pos + extra) cap *= 2;
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.pos));
    this.buf = next;
    this.view = new DataView(this.buf.buffer);
  }

  u8(v: number): void { this.ensure(1); this.view.setUint8(this.pos, v); this.pos += 1; }
  i8(v: number): void { this.ensure(1); this.view.setInt8(this.pos, v); this.pos += 1; }
  i16(v: number): void { this.ensure(2); this.view.setInt16(this.pos, v, false); this.pos += 2; }
  i32(v: number): void { this.ensure(4); this.view.setInt32(this.pos, v, false); this.pos += 4; }
  i64(v: bigint): void { this.ensure(8); this.view.setBigInt64(this.pos, v, false); this.pos += 8; }
  f32(v: number): void { this.ensure(4); this.view.setFloat32(this.pos, v, false); this.pos += 4; }
  f64(v: number): void { this.ensure(8); this.view.setFloat64(this.pos, v, false); this.pos += 8; }

  str(s: string): void {
    const bytes = this.encoder.encode(s);
    this.i16(bytes.length);
    this.ensure(bytes.length);
    this.buf.set(bytes, this.pos);
    this.pos += bytes.length;
  }

  bytes(arr: Uint8Array): void {
    this.ensure(arr.length);
    this.buf.set(arr, this.pos);
    this.pos += arr.length;
  }

  finish(): Uint8Array {
    return this.buf.subarray(0, this.pos);
  }
}

function writePayload(w: ByteWriter, tag: NBTTag): void {
  switch (tag.type) {
    case TagType.Byte: w.i8(tag.value); break;
    case TagType.Short: w.i16(tag.value); break;
    case TagType.Int: w.i32(tag.value); break;
    case TagType.Long: w.i64(tag.value); break;
    case TagType.Float: w.f32(tag.value); break;
    case TagType.Double: w.f64(tag.value); break;
    case TagType.ByteArray:
      w.i32(tag.value.length);
      w.bytes(new Uint8Array(tag.value.buffer, tag.value.byteOffset, tag.value.byteLength));
      break;
    case TagType.String: w.str(tag.value); break;
    case TagType.List: {
      w.u8(tag.value.length === 0 ? TagType.End : tag.listType);
      w.i32(tag.value.length);
      for (const item of tag.value) writePayload(w, item);
      break;
    }
    case TagType.Compound: {
      for (const key of Object.keys(tag.value)) {
        const child = tag.value[key];
        w.u8(child.type);
        w.str(key);
        writePayload(w, child);
      }
      w.u8(TagType.End);
      break;
    }
    case TagType.IntArray: {
      w.i32(tag.value.length);
      for (let i = 0; i < tag.value.length; i++) w.i32(tag.value[i]);
      break;
    }
    case TagType.LongArray: {
      w.i32(tag.value.length);
      for (let i = 0; i < tag.value.length; i++) w.i64(tag.value[i]);
      break;
    }
  }
}

/** Serialises a named root compound to an uncompressed NBT byte array. */
export function writeNBT(rootName: string, root: Extract<NBTTag, { type: TagType.Compound }>): Uint8Array {
  const w = new ByteWriter();
  w.u8(TagType.Compound);
  w.str(rootName);
  writePayload(w, root);
  return w.finish();
}

/** Serialises a named root compound and GZIP-compresses it (typical for .schem/.litematic/.nbt). */
export function writeNBTCompressed(rootName: string, root: Extract<NBTTag, { type: TagType.Compound }>): Uint8Array {
  return gzipSync(writeNBT(rootName, root));
}

// ── Reader ────────────────────────────────────────────────────

class ByteReader {
  private view: DataView;
  private pos = 0;
  private decoder = new TextDecoder();

  constructor(private buf: Uint8Array) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  get remaining(): number { return this.buf.length - this.pos; }

  u8(): number { const v = this.view.getUint8(this.pos); this.pos += 1; return v; }
  i8(): number { const v = this.view.getInt8(this.pos); this.pos += 1; return v; }
  i16(): number { const v = this.view.getInt16(this.pos, false); this.pos += 2; return v; }
  i32(): number { const v = this.view.getInt32(this.pos, false); this.pos += 4; return v; }
  i64(): bigint { const v = this.view.getBigInt64(this.pos, false); this.pos += 8; return v; }
  f32(): number { const v = this.view.getFloat32(this.pos, false); this.pos += 4; return v; }
  f64(): number { const v = this.view.getFloat64(this.pos, false); this.pos += 8; return v; }

  str(): string {
    const len = this.i16();
    const slice = this.buf.subarray(this.pos, this.pos + len);
    this.pos += len;
    return this.decoder.decode(slice);
  }

  raw(len: number): Uint8Array {
    const slice = this.buf.subarray(this.pos, this.pos + len);
    this.pos += len;
    return slice;
  }
}

function readPayload(r: ByteReader, type: TagType): NBTTag {
  switch (type) {
    case TagType.Byte: return { type, value: r.i8() };
    case TagType.Short: return { type, value: r.i16() };
    case TagType.Int: return { type, value: r.i32() };
    case TagType.Long: return { type, value: r.i64() };
    case TagType.Float: return { type, value: r.f32() };
    case TagType.Double: return { type, value: r.f64() };
    case TagType.ByteArray: {
      const len = r.i32();
      const raw = r.raw(len);
      return { type, value: new Int8Array(raw.slice().buffer) };
    }
    case TagType.String: return { type, value: r.str() };
    case TagType.List: {
      const listType = r.u8() as TagType;
      const len = r.i32();
      const items: NBTTag[] = [];
      for (let i = 0; i < len; i++) items.push(readPayload(r, listType));
      return { type, listType, value: items };
    }
    case TagType.Compound: {
      const value: NBTCompound = {};
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const childType = r.u8() as TagType;
        if (childType === TagType.End) break;
        const key = r.str();
        value[key] = readPayload(r, childType);
      }
      return { type, value };
    }
    case TagType.IntArray: {
      const len = r.i32();
      const out = new Int32Array(len);
      for (let i = 0; i < len; i++) out[i] = r.i32();
      return { type, value: out };
    }
    case TagType.LongArray: {
      const len = r.i32();
      const out = new BigInt64Array(len);
      for (let i = 0; i < len; i++) out[i] = r.i64();
      return { type, value: out };
    }
    default:
      throw new Error(`NBT: unknown tag type ${type}`);
  }
}

/** True when the byte array begins with the GZIP magic number (0x1f 0x8b). */
export function isGzip(data: Uint8Array): boolean {
  return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
}

/**
 * Parses an NBT byte array (auto-decompresses GZIP) into a named root.
 * @throws if the root tag is not a Compound.
 */
export function readNBT(input: Uint8Array): NBTRoot {
  const data = isGzip(input) ? gunzipSync(input) : input;
  const r = new ByteReader(data);
  const rootType = r.u8() as TagType;
  if (rootType !== TagType.Compound) {
    throw new Error(`NBT: expected root Compound tag, got type ${rootType}`);
  }
  const name = r.str();
  const tag = readPayload(r, TagType.Compound) as Extract<NBTTag, { type: TagType.Compound }>;
  return { name, tag };
}

// ── Accessor helpers ──────────────────────────────────────────
// Small typed getters to reduce boilerplate when reading a parsed
// compound. They throw on type mismatch so callers fail loudly.

export function getCompound(c: NBTCompound, key: string): NBTCompound {
  const t = c[key];
  if (!t || t.type !== TagType.Compound) throw new Error(`NBT: expected Compound at "${key}"`);
  return t.value;
}

export function getList(c: NBTCompound, key: string): NBTTag[] {
  const t = c[key];
  if (!t || t.type !== TagType.List) throw new Error(`NBT: expected List at "${key}"`);
  return t.value;
}

export function getString(c: NBTCompound, key: string, fallback?: string): string {
  const t = c[key];
  if (!t || t.type !== TagType.String) {
    if (fallback !== undefined) return fallback;
    throw new Error(`NBT: expected String at "${key}"`);
  }
  return t.value;
}

export function getNumber(c: NBTCompound, key: string, fallback?: number): number {
  const t = c[key];
  if (
    t &&
    (t.type === TagType.Byte || t.type === TagType.Short || t.type === TagType.Int ||
      t.type === TagType.Float || t.type === TagType.Double)
  ) {
    return t.value;
  }
  if (t && t.type === TagType.Long) return Number(t.value);
  if (fallback !== undefined) return fallback;
  throw new Error(`NBT: expected numeric tag at "${key}"`);
}

export function getByteArray(c: NBTCompound, key: string): Int8Array {
  const t = c[key];
  if (!t || t.type !== TagType.ByteArray) throw new Error(`NBT: expected ByteArray at "${key}"`);
  return t.value;
}

export function getIntArray(c: NBTCompound, key: string): Int32Array {
  const t = c[key];
  if (!t || t.type !== TagType.IntArray) throw new Error(`NBT: expected IntArray at "${key}"`);
  return t.value;
}

export function getLongArray(c: NBTCompound, key: string): BigInt64Array {
  const t = c[key];
  if (!t || t.type !== TagType.LongArray) throw new Error(`NBT: expected LongArray at "${key}"`);
  return t.value;
}

/** Optional variants that return undefined instead of throwing. */
export function optCompound(c: NBTCompound, key: string): NBTCompound | undefined {
  const t = c[key];
  return t && t.type === TagType.Compound ? t.value : undefined;
}
