// ============================================================
// export/png.ts — MIneLAb
// Renders a layer-by-layer build guide as a single PNG sprite
// sheet: each Y-level is drawn as a top-down grid of coloured
// cells with a block legend. Useful for survival builders.
// ============================================================

import type { StructureData } from '../types/index'
import { getAllNonAirBlocks } from '../core/StructureData'
import { BlockRegistry } from '../core/BlockRegistry'
import { computeBounds } from '../formats/common'

export interface PngExportOptions {
  cellSize?: number   // pixels per block
  padding?: number    // gap between layer tiles
  columns?: number    // layer tiles per row (0 = auto)
  background?: string
}

/**
 * Produces a PNG Blob containing every Y-layer of the structure.
 * @throws if the structure is empty.
 */
export async function exportLayersPNG(
  structure: StructureData,
  options: PngExportOptions = {}
): Promise<Blob> {
  const { cellSize = 12, padding = 24, background = '#0a0a0f' } = options

  const bounds = computeBounds(structure)
  const { min, size } = bounds
  if (size.x === 0) throw new Error('Cannot export an empty structure to PNG')

  // grid[y][z][x] = blockId | null
  const layers: Array<Array<Array<string | null>>> = []
  for (let y = 0; y < size.y; y++) {
    const layer: Array<Array<string | null>> = []
    for (let z = 0; z < size.z; z++) layer.push(new Array<string | null>(size.x).fill(null))
    layers.push(layer)
  }
  for (const { pos, blockId } of getAllNonAirBlocks(structure)) {
    layers[pos.y - min.y][pos.z - min.z][pos.x - min.x] = blockId
  }

  const tileW = size.x * cellSize
  const tileH = size.z * cellSize
  const labelH = 20
  const cols = options.columns && options.columns > 0
    ? options.columns
    : Math.max(1, Math.floor(Math.sqrt(size.y)))
  const rows = Math.ceil(size.y / cols)

  const width = cols * tileW + (cols + 1) * padding
  const height = rows * (tileH + labelH) + (rows + 1) * padding

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not obtain 2D canvas context')

  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.textBaseline = 'middle'
  ctx.font = '12px monospace'

  for (let y = 0; y < size.y; y++) {
    const col = y % cols
    const row = Math.floor(y / cols)
    const ox = padding + col * (tileW + padding)
    const oy = padding + row * (tileH + labelH + padding)

    // Layer label
    ctx.fillStyle = '#aaaabb'
    ctx.fillText(`Layer Y=${min.y + y}`, ox, oy + labelH / 2)

    const gy = oy + labelH
    // Cells
    const layer = layers[y]
    for (let z = 0; z < size.z; z++) {
      for (let x = 0; x < size.x; x++) {
        const id = layer[z][x]
        if (!id) continue
        ctx.fillStyle = BlockRegistry.getBlock(id)?.color ?? '#888888'
        ctx.fillRect(ox + x * cellSize, gy + z * cellSize, cellSize - 1, cellSize - 1)
      }
    }
    // Tile border
    ctx.strokeStyle = '#2a2a3d'
    ctx.strokeRect(ox - 0.5, gy - 0.5, tileW, tileH)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to encode PNG'))
    }, 'image/png')
  })
}
