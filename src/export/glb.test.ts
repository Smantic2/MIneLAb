import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { buildStructureGroup } from './glb'
import { createEmpty, setBlock } from '../core/StructureData'

describe('GLB export — geometry builder', () => {
  it('creates one merged mesh per unique block type', () => {
    const s = createEmpty('T', { x: 8, y: 8, z: 8 })
    setBlock(s, 0, 0, 0, 'minecraft:stone')
    setBlock(s, 1, 0, 0, 'minecraft:stone')
    setBlock(s, 2, 0, 0, 'minecraft:dirt')
    const group = buildStructureGroup(s)
    const meshes = group.children.filter((c) => (c as THREE.Mesh).isMesh)
    expect(meshes.length).toBe(2) // stone + dirt
    for (const m of meshes as THREE.Mesh[]) {
      const pos = m.geometry.getAttribute('position')
      expect(pos.count).toBeGreaterThan(0)
    }
  })

  it('normalises the structure so its min corner is at the origin', () => {
    const s = createEmpty('T', { x: 8, y: 8, z: 8 })
    setBlock(s, 5, 3, 4, 'minecraft:stone')
    const group = buildStructureGroup(s)
    const mesh = group.children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh
    mesh.geometry.computeBoundingBox()
    const box = mesh.geometry.boundingBox!
    // A single block normalised to origin occupies [-0.5, 0.5] on each axis.
    expect(box.min.x).toBeCloseTo(-0.5, 5)
    expect(box.min.y).toBeCloseTo(-0.5, 5)
    expect(box.min.z).toBeCloseTo(-0.5, 5)
  })

  it('produces an empty group for an empty structure', () => {
    const s = createEmpty('Empty', { x: 4, y: 4, z: 4 })
    const group = buildStructureGroup(s)
    const meshes = group.children.filter((c) => (c as THREE.Mesh).isMesh)
    expect(meshes.length).toBe(0)
  })
})
