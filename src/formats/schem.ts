// ============================================================
// formats/schem.ts — MIneLAb
// Sponge Schematic v2 (.schem) reader & writer.
// Used by WorldEdit / FAWE. NBT-based, GZIP-compressed.
// Block data is a flat varint-encoded palette-index array in
// YZX order: index = (y * Length + z) * Width + x.
// ============================================================

import type { StructureData } from '../types/index';
import {
  nbt,
  TagType,
  writeNBTCompressed,
  readNBT,
  getCompound,
  getNumber,
  getByteArray,
  getIntArray,
} from '../core/nbt';
import { writeVarInt, readVarInt } from '../core/blockState';
import { toDenseGrid, structureFromBlocks } from './common';
import type { NBTCompound } from '../core/nbt';

/** Java 1.20.1 data version (safe default for modern WorldEdit). */
const DEFAULT_DATA_VERSION = 3465;

const AIR = 'minecraft:air';

/**
 * Serialises a StructureData to a GZIP-compressed Sponge v2 .schem byte array.
 */
export function exportSchem(structure: StructureData): Uint8Array {
  const { bounds, get } = toDenseGrid(structure);
  const { size } = bounds;
  const width = Math.max(1, size.x);
  const height = Math.max(1, size.y);
  const length = Math.max(1, size.z);

  // Build palette: block ID -> index. Air is always present at index 0.
  const palette: Record<string, number> = { [AIR]: 0 };
  let next = 1;
  const paletteCompound: NBTCompound = { [AIR]: nbt.int(0) };

  const blockData: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        const id = size.x === 0 ? AIR : get(x, y, z);
        let idx = palette[id];
        if (idx === undefined) {
          idx = next++;
          palette[id] = idx;
          paletteCompound[id] = nbt.int(idx);
        }
        writeVarInt(blockData, idx);
      }
    }
  }

  const root = nbt.compound({
    Version: nbt.int(2),
    DataVersion: nbt.int(DEFAULT_DATA_VERSION),
    Width: nbt.short(width),
    Height: nbt.short(height),
    Length: nbt.short(length),
    Offset: nbt.intArray(new Int32Array([bounds.min.x, bounds.min.y, bounds.min.z])),
    PaletteMax: nbt.int(next),
    Palette: nbt.compound(paletteCompound),
    BlockData: nbt.byteArray(Int8Array.from(blockData.map((b) => (b << 24) >> 24))),
    Metadata: nbt.compound({
      Name: nbt.string(structure.name),
      Author: nbt.string(structure.metadata.author || 'MIneLAb'),
    }),
  });

  return writeNBTCompressed('Schematic', root);
}

/**
 * Parses a Sponge v2 .schem byte array into a StructureData.
 * Handles files that wrap the payload in a "Schematic" sub-compound
 * (Sponge v3 / some FAWE builds) as well as the flat v2 layout.
 */
export function importSchem(bytes: Uint8Array, name = 'Imported Schematic'): StructureData {
  const root = readNBT(bytes);
  // Some writers nest everything under a "Schematic" compound.
  const c: NBTCompound =
    root.tag.value.Schematic && root.tag.value.Schematic.type === TagType.Compound
      ? root.tag.value.Schematic.value
      : root.tag.value;

  const width = getNumber(c, 'Width');
  const height = getNumber(c, 'Height');
  const length = getNumber(c, 'Length');

  // Palette compound: { "minecraft:stone": Int(index), ... } -> index->id
  const paletteCompound = getCompound(c, 'Palette');
  const indexToId: Record<number, string> = {};
  for (const key of Object.keys(paletteCompound)) {
    indexToId[getNumber(paletteCompound, key)] = key;
  }

  const blockData = getByteArray(c, 'BlockData');

  let offX = 0, offY = 0, offZ = 0;
  if (c.Offset && c.Offset.type === TagType.IntArray) {
    const off = getIntArray(c, 'Offset');
    offX = off[0] ?? 0; offY = off[1] ?? 0; offZ = off[2] ?? 0;
  }

  const blocks: Array<{ pos: { x: number; y: number; z: number }; blockId: string }> = [];
  let pos = 0;
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        const { value: idx, next } = readVarInt(blockData, pos);
        pos = next;
        const id = indexToId[idx] ?? AIR;
        if (id !== AIR) {
          blocks.push({ pos: { x: x + offX, y: y + offY, z: z + offZ }, blockId: id });
        }
      }
    }
  }

  return structureFromBlocks(name, { x: width, y: height, z: length }, blocks);
}
