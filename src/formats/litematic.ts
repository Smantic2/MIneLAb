// ============================================================
// formats/litematic.ts — MIneLAb
// Litematica (.litematic) reader & writer.
//
// GZIP-compressed NBT. Blocks are stored per-region as a packed
// bit array (LitematicaBitArray) inside a LongArray, where entries
// may span two longs. Palette index 0 is reserved for air.
//
// Block index ordering within a region (positive sizes):
//   index = (y * sizeX * sizeZ) + z * sizeX + x
// ============================================================

import type { StructureData, Vec3 } from '../types/index';
import {
  nbt,
  TagType,
  writeNBTCompressed,
  readNBT,
  getCompound,
  getList,
  getNumber,
  getString,
  getLongArray,
  optCompound,
} from '../core/nbt';
import type { NBTCompound, NBTTag } from '../core/nbt';
import { parseBlockId, buildBlockId } from '../core/blockState';
import { toDenseGrid, structureFromBlocks } from './common';

const MC_DATA_VERSION = 3465;
const SCHEMATIC_VERSION = 6;
const AIR = 'minecraft:air';
const MASK64 = (1n << 64n) - 1n;

/** Minimum bits needed to index `paletteSize` entries (Litematica rules, min 2). */
function bitsForPalette(paletteSize: number): number {
  if (paletteSize <= 1) return 2;
  let n = paletteSize - 1;
  let bits = 0;
  while (n > 0) { bits++; n >>= 1; }
  return Math.max(2, bits);
}

/**
 * Packed bit array matching Litematica's LitematicaBitArray semantics.
 * Longs are kept as unsigned 64-bit BigInts internally.
 */
class LitematicaBitArray {
  readonly longs: bigint[];
  private readonly maxEntry: bigint;

  constructor(private readonly bits: number, private readonly size: number, existing?: bigint[]) {
    const nLongs = Math.ceil((size * bits) / 64);
    this.maxEntry = (1n << BigInt(bits)) - 1n;
    this.longs = existing ? existing.map((v) => BigInt.asUintN(64, v)) : new Array<bigint>(nLongs).fill(0n);
  }

  setAt(index: number, value: number): void {
    const bits = BigInt(this.bits);
    const val = BigInt(value) & this.maxEntry;
    const startOffset = BigInt(index) * bits;
    const startArr = Number(startOffset >> 6n);
    const endArr = Number((BigInt(index + 1) * bits - 1n) >> 6n);
    const startBit = startOffset & 63n;

    const clearMask = MASK64 ^ (this.maxEntry << startBit);
    this.longs[startArr] = ((this.longs[startArr] & clearMask) | ((val << startBit) & MASK64)) & MASK64;

    if (startArr !== endArr) {
      const endOffset = 64n - startBit;
      const j1 = bits - endOffset;
      this.longs[endArr] = (((this.longs[endArr] >> j1) << j1) | (val >> endOffset)) & MASK64;
    }
  }

  getAt(index: number): number {
    const bits = BigInt(this.bits);
    const startOffset = BigInt(index) * bits;
    const startArr = Number(startOffset >> 6n);
    const endArr = Number((BigInt(index + 1) * bits - 1n) >> 6n);
    const startBit = startOffset & 63n;

    if (startArr === endArr) {
      return Number((this.longs[startArr] >> startBit) & this.maxEntry);
    }
    const endOffset = 64n - startBit;
    return Number(((this.longs[startArr] >> startBit) | ((this.longs[endArr] << endOffset) & MASK64)) & this.maxEntry);
  }
}

function blockPosCompound(v: Vec3): NBTTag {
  return nbt.compound({ x: nbt.int(v.x), y: nbt.int(v.y), z: nbt.int(v.z) });
}

function paletteEntry(id: string): NBTTag {
  const { name, properties } = parseBlockId(id);
  const entry: NBTCompound = { Name: nbt.string(name) };
  if (Object.keys(properties).length > 0) {
    const props: NBTCompound = {};
    for (const k of Object.keys(properties)) props[k] = nbt.string(properties[k]);
    entry.Properties = nbt.compound(props);
  }
  return nbt.compound(entry);
}

/** Serialises a StructureData to a GZIP-compressed .litematic byte array. */
export function exportLitematic(structure: StructureData): Uint8Array {
  const { bounds, get } = toDenseGrid(structure);
  const { size } = bounds;
  const sx = Math.max(1, size.x);
  const sy = Math.max(1, size.y);
  const sz = Math.max(1, size.z);
  const volume = sx * sy * sz;

  // Palette with air reserved at index 0.
  const paletteIndex: Record<string, number> = { [AIR]: 0 };
  const paletteIds: string[] = [AIR];

  // First pass: collect palette.
  let totalBlocks = 0;
  if (size.x > 0) {
    for (let y = 0; y < sy; y++) {
      for (let z = 0; z < sz; z++) {
        for (let x = 0; x < sx; x++) {
          const id = get(x, y, z);
          if (id === AIR) continue;
          totalBlocks++;
          if (paletteIndex[id] === undefined) {
            paletteIndex[id] = paletteIds.length;
            paletteIds.push(id);
          }
        }
      }
    }
  }

  const bits = bitsForPalette(paletteIds.length);
  const bitArray = new LitematicaBitArray(bits, volume);
  const idx = (x: number, y: number, z: number) => y * sx * sz + z * sx + x;

  if (size.x > 0) {
    for (let y = 0; y < sy; y++) {
      for (let z = 0; z < sz; z++) {
        for (let x = 0; x < sx; x++) {
          const id = get(x, y, z);
          bitArray.setAt(idx(x, y, z), paletteIndex[id] ?? 0);
        }
      }
    }
  }

  const now = BigInt(Date.now());
  const regionName = structure.name || 'Region';

  const region = nbt.compound({
    Position: blockPosCompound({ x: 0, y: 0, z: 0 }),
    Size: blockPosCompound({ x: sx, y: sy, z: sz }),
    BlockStatePalette: nbt.list(TagType.Compound, paletteIds.map(paletteEntry)),
    BlockStates: nbt.longArray(BigInt64Array.from(bitArray.longs.map((v) => BigInt.asIntN(64, v)))),
    TileEntities: nbt.list(TagType.Compound, []),
    Entities: nbt.list(TagType.Compound, []),
    PendingBlockTicks: nbt.list(TagType.Compound, []),
    PendingFluidTicks: nbt.list(TagType.Compound, []),
  });

  const root = nbt.compound({
    MinecraftDataVersion: nbt.int(MC_DATA_VERSION),
    Version: nbt.int(SCHEMATIC_VERSION),
    Metadata: nbt.compound({
      Name: nbt.string(structure.name || 'Untitled'),
      Author: nbt.string(structure.metadata.author || 'MIneLAb'),
      Description: nbt.string(structure.metadata.description || ''),
      TimeCreated: nbt.long(now),
      TimeModified: nbt.long(now),
      EnclosingSize: blockPosCompound({ x: sx, y: sy, z: sz }),
      RegionCount: nbt.int(1),
      TotalVolume: nbt.int(volume),
      TotalBlocks: nbt.int(totalBlocks),
    }),
    Regions: nbt.compound({ [regionName]: region }),
  });

  return writeNBTCompressed('', root);
}

/** Parses a .litematic byte array into a StructureData (first region). */
export function importLitematic(bytes: Uint8Array, name = 'Imported Litematic'): StructureData {
  const root = readNBT(bytes);
  const c = root.tag.value;
  const regions = getCompound(c, 'Regions');
  const regionNames = Object.keys(regions);
  if (regionNames.length === 0) throw new Error('Litematic: no regions found');

  const blocks: Array<{ pos: Vec3; blockId: string }> = [];
  let boundX = 0, boundY = 0, boundZ = 0;

  for (const rName of regionNames) {
    const regionTag = regions[rName];
    if (regionTag.type !== TagType.Compound) continue;
    const region = regionTag.value;

    const sizeC = optCompound(region, 'Size');
    const posC = optCompound(region, 'Position');
    const sx = Math.abs(sizeC ? getNumber(sizeC, 'x') : 0);
    const sy = Math.abs(sizeC ? getNumber(sizeC, 'y') : 0);
    const sz = Math.abs(sizeC ? getNumber(sizeC, 'z') : 0);
    const px = posC ? getNumber(posC, 'x', 0) : 0;
    const py = posC ? getNumber(posC, 'y', 0) : 0;
    const pz = posC ? getNumber(posC, 'z', 0) : 0;

    boundX = Math.max(boundX, px + sx);
    boundY = Math.max(boundY, py + sy);
    boundZ = Math.max(boundZ, pz + sz);

    // Palette
    const paletteList = getList(region, 'BlockStatePalette');
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

    const volume = sx * sy * sz;
    if (volume === 0) continue;

    const longsTag = getLongArray(region, 'BlockStates');
    const longs: bigint[] = Array.from(longsTag);
    const bits = bitsForPalette(palette.length);
    const bitArray = new LitematicaBitArray(bits, volume, longs);

    for (let y = 0; y < sy; y++) {
      for (let z = 0; z < sz; z++) {
        for (let x = 0; x < sx; x++) {
          const index = y * sx * sz + z * sx + x;
          const paletteIdx = bitArray.getAt(index);
          const id = palette[paletteIdx] ?? AIR;
          if (id !== AIR) {
            blocks.push({ pos: { x: px + x, y: py + y, z: pz + z }, blockId: id });
          }
        }
      }
    }
  }

  return structureFromBlocks(name, { x: boundX, y: boundY, z: boundZ }, blocks);
}
