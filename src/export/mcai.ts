/**
 * MCAI Native Format
 * MIneLAb's own file format: palette + compressed chunks + version history
 */

import { MCAIFile, Project, StructureData, Version, Branch } from '../types/index'
import { ChunkData } from '../types/index'

const MCAI_VERSION = '1.0'

/**
 * Serialize chunks Map to array (JSON can't handle Map)
 */
function serializeChunks(chunks: Map<string, ChunkData>): MCAIFile['structure']['chunks'] {
  const result: MCAIFile['structure']['chunks'] = []
  for (const [, chunk] of chunks) {
    result.push({
      position: chunk.position,
      data: uint8ToBase64(chunk.blocks),
    })
  }
  return result
}

/**
 * Deserialize chunks array back to Map
 */
function deserializeChunks(
  chunks: MCAIFile['structure']['chunks']
): Map<string, ChunkData> {
  const map = new Map<string, ChunkData>()
  for (const chunk of chunks) {
    const key = `${chunk.position.x}|${chunk.position.y}|${chunk.position.z}`
    map.set(key, {
      position: chunk.position,
      blocks: base64ToUint8(chunk.data),
      dirty: false,
    })
  }
  return map
}

/**
 * Uint8Array → Base64 string
 */
function uint8ToBase64(arr: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i])
  }
  return btoa(binary)
}

/**
 * Base64 string → Uint8Array
 */
function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i)
  }
  return arr
}

/**
 * Export project to MCAI JSON string
 */
export function exportMCAI(project: Project): string {
  const { structure, versions, branches } = project

  const file: MCAIFile = {
    version: MCAI_VERSION,
    structure: {
      dimensions: structure.dimensions,
      palette: structure.palette.blocks,
      chunks: serializeChunks(structure.chunks),
    },
    metadata: structure.metadata,
    versions,
    branches,
  }

  return JSON.stringify(file, null, 2)
}

/**
 * Import project from MCAI JSON string
 */
export function importMCAI(json: string): Partial<Project> {
  const file: MCAIFile = JSON.parse(json)

  if (file.version !== MCAI_VERSION) {
    console.warn(`MCAI version mismatch: expected ${MCAI_VERSION}, got ${file.version}`)
  }

  const structure: StructureData = {
    id: Math.random().toString(36).slice(2),
    name: file.metadata?.author ?? 'Imported Structure',
    dimensions: file.structure.dimensions,
    palette: { blocks: file.structure.palette },
    chunks: deserializeChunks(file.structure.chunks),
    metadata: file.metadata ?? {
      author: '',
      description: '',
      tags: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      version: '1.0.0',
      minecraftVersion: '1.21.5',
    },
  }

  return {
    structure,
    versions: file.versions ?? [],
    branches: file.branches ?? [],
  }
}

/**
 * Export structure only (without history)
 */
export function exportStructureMCAI(structure: StructureData): string {
  const file: Partial<MCAIFile> = {
    version: MCAI_VERSION,
    structure: {
      dimensions: structure.dimensions,
      palette: structure.palette.blocks,
      chunks: serializeChunks(structure.chunks),
    },
    metadata: structure.metadata,
    versions: [] as Version[],
    branches: [] as Branch[],
  }
  return JSON.stringify(file, null, 2)
}
