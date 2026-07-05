// ============================================================
// export/glb.ts — MIneLAb
// Exports a StructureData to a binary glTF (.glb) 3D model for
// Blender and other 3D software. Blocks of the same type are
// merged into a single mesh with a shared coloured material.
// ============================================================

import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { StructureData } from '../types/index'
import { getAllNonAirBlocks } from '../core/StructureData'
import { BlockRegistry } from '../core/BlockRegistry'
import { computeBounds } from '../formats/common'

/**
 * Builds a THREE.Group representing the structure, normalised so its
 * minimum corner sits at the origin. One merged mesh per block type.
 */
export function buildStructureGroup(structure: StructureData): THREE.Group {
  const group = new THREE.Group()
  group.name = structure.name || 'MIneLAb Structure'

  const bounds = computeBounds(structure)
  const { min } = bounds

  const byType = new Map<string, THREE.Vector3[]>()
  for (const { pos, blockId } of getAllNonAirBlocks(structure)) {
    let list = byType.get(blockId)
    if (!list) { list = []; byType.set(blockId, list) }
    list.push(new THREE.Vector3(pos.x - min.x, pos.y - min.y, pos.z - min.z))
  }

  byType.forEach((positions, blockId) => {
    const geometries: THREE.BufferGeometry[] = []
    for (const p of positions) {
      const g = new THREE.BoxGeometry(1, 1, 1)
      g.translate(p.x, p.y, p.z)
      geometries.push(g)
    }
    if (geometries.length === 0) return
    const merged = mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())
    if (!merged) return

    const color = BlockRegistry.getBlock(blockId)?.color ?? '#888888'
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0,
      roughness: 1,
    })
    const mesh = new THREE.Mesh(merged, material)
    mesh.name = blockId.replace('minecraft:', '')
    group.add(mesh)
  })

  return group
}

/**
 * Serialises the structure to a binary .glb byte array.
 * Runs in the browser (GLTFExporter needs the DOM/Blob APIs).
 */
export async function exportGLB(structure: StructureData): Promise<Uint8Array> {
  const group = buildStructureGroup(structure)
  const exporter = new GLTFExporter()
  const result = await exporter.parseAsync(group, { binary: true })

  // Release geometry/material references.
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      const m = mesh.material
      Array.isArray(m) ? m.forEach((x) => x.dispose()) : m.dispose()
    }
  })

  if (result instanceof ArrayBuffer) {
    return new Uint8Array(result)
  }
  // Non-binary fallback (shouldn't happen with binary: true).
  return new TextEncoder().encode(JSON.stringify(result))
}
