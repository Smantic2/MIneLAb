// ============================================================
// formats/index.ts — MIneLAb
// Public entry point for binary Minecraft structure formats.
// Provides format auto-detection and a unified import dispatcher.
// ============================================================

import type { StructureData } from '../types/index';
import { isGzip, readNBT } from '../core/nbt';
import { exportSchem, importSchem } from './schem';
import { exportStructureNbt, importStructureNbt, STRUCTURE_BLOCK_LIMIT } from './structure';
import { exportLitematic, importLitematic } from './litematic';
import { computeBounds } from './common';

export { exportSchem, importSchem } from './schem';
export { exportStructureNbt, importStructureNbt, STRUCTURE_BLOCK_LIMIT } from './structure';
export { exportLitematic, importLitematic } from './litematic';
export { computeBounds } from './common';

export type BinaryFormat = 'schem' | 'litematic' | 'nbt';

/**
 * Detects the structure format from the file name and, when the
 * extension is ambiguous, by inspecting the decoded NBT root keys.
 */
export function detectFormat(fileName: string, bytes: Uint8Array): BinaryFormat | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'schem') return 'schem';
  if (ext === 'litematic') return 'litematic';
  if (ext === 'nbt') return 'nbt';

  // Fall back to NBT content inspection.
  try {
    if (!isGzip(bytes) && !(bytes.length > 0 && bytes[0] === 0x0a)) return null;
    const root = readNBT(bytes);
    const keys = root.tag.value;
    if (keys.Regions) return 'litematic';
    if (keys.BlockData && keys.Palette) return 'schem';
    if (keys.blocks && keys.palette) return 'nbt';
  } catch {
    return null;
  }
  return null;
}

/** Serialises a structure to the requested binary format. */
export function exportBinary(format: BinaryFormat, structure: StructureData): Uint8Array {
  switch (format) {
    case 'schem': return exportSchem(structure);
    case 'litematic': return exportLitematic(structure);
    case 'nbt': return exportStructureNbt(structure);
  }
}

/** Parses a byte array into a StructureData using the detected/explicit format. */
export function importBinary(format: BinaryFormat, bytes: Uint8Array, name?: string): StructureData {
  switch (format) {
    case 'schem': return importSchem(bytes, name);
    case 'litematic': return importLitematic(bytes, name);
    case 'nbt': return importStructureNbt(bytes, name);
  }
}

/** Warns when a structure exceeds the vanilla structure-block size limit. */
export function exceedsStructureBlockLimit(structure: StructureData): boolean {
  const b = computeBounds(structure);
  return b.size.x > STRUCTURE_BLOCK_LIMIT || b.size.y > STRUCTURE_BLOCK_LIMIT || b.size.z > STRUCTURE_BLOCK_LIMIT;
}
