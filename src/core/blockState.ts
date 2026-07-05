// ============================================================
// blockState.ts — MIneLAb
// Helpers for parsing/serialising Minecraft block IDs with
// state properties, plus Sponge-style varint (LEB128) codecs.
// ============================================================

export interface ParsedBlock {
  name: string;                       // "minecraft:oak_stairs"
  properties: Record<string, string>; // { facing: "north", half: "bottom" }
}

/**
 * Parses a namespaced block ID with optional bracketed states.
 *
 *   "minecraft:oak_stairs[facing=north,half=bottom]"
 *     → { name: "minecraft:oak_stairs",
 *         properties: { facing: "north", half: "bottom" } }
 *
 * A bare name (no brackets) yields empty properties. A name without
 * a namespace is left as-is (callers may prepend "minecraft:").
 */
export function parseBlockId(id: string): ParsedBlock {
  const open = id.indexOf('[');
  if (open === -1) {
    return { name: id, properties: {} };
  }
  const name = id.slice(0, open);
  const inner = id.slice(open + 1, id.lastIndexOf(']'));
  const properties: Record<string, string> = {};
  if (inner.trim().length > 0) {
    for (const pair of inner.split(',')) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const key = pair.slice(0, eq).trim();
      const val = pair.slice(eq + 1).trim();
      if (key) properties[key] = val;
    }
  }
  return { name, properties };
}

/**
 * Rebuilds a block ID string from a name and its properties.
 * Properties are sorted by key for deterministic output (important
 * for palette de-duplication and round-trip stability).
 */
export function buildBlockId(name: string, properties?: Record<string, string>): string {
  if (!properties || Object.keys(properties).length === 0) return name;
  const parts = Object.keys(properties)
    .sort()
    .map((k) => `${k}=${properties[k]}`);
  return `${name}[${parts.join(',')}]`;
}

/** Ensures a block name carries the "minecraft:" namespace. */
export function withNamespace(name: string): string {
  return name.includes(':') ? name : `minecraft:${name}`;
}

// ── Sponge varint (unsigned LEB128) ───────────────────────────

/** Appends an unsigned LEB128 varint to `out`. */
export function writeVarInt(out: number[], value: number): void {
  let v = value >>> 0;
  do {
    let byte = v & 0x7f;
    v >>>= 7;
    if (v !== 0) byte |= 0x80;
    out.push(byte);
  } while (v !== 0);
}

/** Reads an unsigned LEB128 varint. Returns the value and next offset. */
export function readVarInt(bytes: Int8Array | Uint8Array, offset: number): { value: number; next: number } {
  let value = 0;
  let shift = 0;
  let pos = offset;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const byte = bytes[pos] & 0xff;
    pos += 1;
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
    if (shift > 35) throw new Error('VarInt too long');
  }
  return { value: value >>> 0, next: pos };
}
