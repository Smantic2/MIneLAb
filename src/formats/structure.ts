// ============================================================
// formats/structure.ts — MIneLAb
// Vanilla Structure Block (.nbt) reader & writer.
//
// Layout (GZIP-compressed NBT, empty root name):
//   DataVersion : Int
//   size        : List<Int>[3]
//   palette     : List<Compound{ Name:String, Properties?:Compound }>
//   blocks      : List<Compound{ state:Int, pos:List<Int>[3], nbt? }>
//   entities    : List (omitted on export)
//
// Structure blocks are limited to 48×48×48 in-game (we warn at 48,
// hard-cap validation is left to the UI). No hard cap here.
// ============================================================

import type { StructureData, Vec3 } from '../types/index';
import {
  nbt,
  TagType,
  writeNBTCompressed,
  readNBT,
  getList,
  getNumber,
  getString,
  optCompound,
} from '../core/nbt';
import type { NBTCompound, NBTTag } from '../core/nbt';
import { parseBlockId, buildBlockId } from '../core/blockState';
import { toDenseGrid, structureFromBlocks } from './common';

const DEFAULT_DATA_VERSION = 3465;
const AIR = 'minecraft:air';

/** Recommended max edge length for a vanilla structure block. */
export const STRUCTURE_BLOCK_LIMIT = 48;

function intList3(a: number, b: number, c: number): NBTTag {
  return nbt.list(TagType.Int, [nbt.int(a), nbt.int(b), nbt.int(c)]);
}

/** Serialises a StructureData to a GZIP-compressed vanilla structure .nbt. */
export function exportStructureNbt(structure: StructureData): Uint8Array {
  const { bounds, get } = toDenseGrid(structure);
  const { size } = bounds;
  const width = Math.max(1, size.x);
  const height = Math.max(1, size.y);
  const length = Math.max(1, size.z);

  // Build palette of unique block IDs (excluding air — vanilla stores
  // only placed blocks; air positions are simply absent).
  const paletteIndex: Record<string, number> = {};
  const paletteEntries: NBTTag[] = [];
  const blockEntries: NBTTag[] = [];

  const ensurePalette = (id: string): number => {
    let idx = paletteIndex[id];
    if (idx !== undefined) return idx;
    idx = paletteEntries.length;
    paletteIndex[id] = idx;
    const { name, properties } = parseBlockId(id);
    const entry: NBTCompound = { Name: nbt.string(name) };
    if (Object.keys(properties).length > 0) {
      const props: NBTCompound = {};
      for (const k of Object.keys(properties)) props[k] = nbt.string(properties[k]);
      entry.Properties = nbt.compound(props);
    }
    paletteEntries.push(nbt.compound(entry));
    return idx;
  };

  if (size.x > 0) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < length; z++) {
          const id = get(x, y, z);
          if (id === AIR) continue;
          const stateIdx = ensurePalette(id);
          blockEntries.push(
            nbt.compound({
              state: nbt.int(stateIdx),
              pos: intList3(x, y, z),
            })
          );
        }
      }
    }
  }

  // A structure with no palette entries would be invalid; add air.
  if (paletteEntries.length === 0) {
    paletteEntries.push(nbt.compound({ Name: nbt.string(AIR) }));
  }

  const root = nbt.compound({
    DataVersion: nbt.int(DEFAULT_DATA_VERSION),
    size: intList3(width, height, length),
    palette: nbt.list(TagType.Compound, paletteEntries),
    blocks: nbt.list(TagType.Compound, blockEntries),
    entities: nbt.list(TagType.Compound, []),
  });

  return writeNBTCompressed('', root);
}

/** Parses a vanilla structure .nbt byte array into a StructureData. */
export function importStructureNbt(bytes: Uint8Array, name = 'Imported Structure'): StructureData {
  const root = readNBT(bytes);
  const c = root.tag.value;

  // size: List<Int>[3]
  const sizeList = getList(c, 'size');
  const size: Vec3 = {
    x: numberFrom(sizeList[0]),
    y: numberFrom(sizeList[1]),
    z: numberFrom(sizeList[2]),
  };

  // palette: index -> full block ID
  const paletteList = getList(c, 'palette');
  const palette: string[] = paletteList.map((entry) => {
    if (entry.type !== TagType.Compound) return AIR;
    const pc = entry.value;
    const blockName = getString(pc, 'Name', AIR);
    const propsCompound = optCompound(pc, 'Properties');
    const properties: Record<string, string> = {};
    if (propsCompound) {
      for (const k of Object.keys(propsCompound)) {
        const t = propsCompound[k];
        if (t.type === TagType.String) properties[k] = t.value;
      }
    }
    return buildBlockId(blockName, properties);
  });

  const blocksList = getList(c, 'blocks');
  const blocks: Array<{ pos: Vec3; blockId: string }> = [];
  for (const entry of blocksList) {
    if (entry.type !== TagType.Compound) continue;
    const bc = entry.value;
    const stateIdx = getNumber(bc, 'state', 0);
    const posList = getList(bc, 'pos');
    const pos: Vec3 = {
      x: numberFrom(posList[0]),
      y: numberFrom(posList[1]),
      z: numberFrom(posList[2]),
    };
    const blockId = palette[stateIdx] ?? AIR;
    blocks.push({ pos, blockId });
  }

  return structureFromBlocks(name, size, blocks);
}

function numberFrom(tag: NBTTag | undefined): number {
  if (!tag) return 0;
  switch (tag.type) {
    case TagType.Byte:
    case TagType.Short:
    case TagType.Int:
    case TagType.Float:
    case TagType.Double:
      return tag.value;
    case TagType.Long:
      return Number(tag.value);
    default:
      return 0;
  }
}
