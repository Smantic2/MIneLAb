import React, { useRef, useMemo, useLayoutEffect, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useEditorStore } from '../../stores/editorStore'
import { BlockRegistry } from '../../core/BlockRegistry'
import { getAllNonAirBlocks } from '../../core/StructureData'
import type { Vec3 } from '../../types/index'

const CUBE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1)

interface BlockTypeGroup {
  blockId: string
  color: string
  positions: Vec3[]
}

/**
 * Renders one InstancedMesh per block type and wires pointer
 * interaction so the active editor tool (place / remove / paint /
 * select) operates on the block under the cursor.
 */
export function VoxelWorld() {
  const structure = useEditorStore((s) => s.structure)
  const settings = useEditorStore((s) => s.settings)
  const hoveredBlock = useEditorStore((s) => s.hoveredBlock)
  const setHoveredBlock = useEditorStore((s) => s.setHoveredBlock)
  const placeBlock = useEditorStore((s) => s.placeBlock)
  const removeBlock = useEditorStore((s) => s.removeBlock)
  const setSelection = useEditorStore((s) => s.setSelection)
  const newProject = useEditorStore((s) => s.newProject)

  // Group non-air blocks by type for instanced rendering.
  const groups = useMemo<BlockTypeGroup[]>(() => {
    if (!structure) return []
    const byType = new Map<string, Vec3[]>()
    for (const { pos, blockId } of getAllNonAirBlocks(structure)) {
      let list = byType.get(blockId)
      if (!list) { list = []; byType.set(blockId, list) }
      list.push(pos)
    }
    const result: BlockTypeGroup[] = []
    byType.forEach((positions, blockId) => {
      result.push({
        blockId,
        color: BlockRegistry.getBlock(blockId)?.color ?? '#888888',
        positions,
      })
    })
    return result
  }, [structure])

  // ── Pointer handlers ────────────────────────────────────────

  const applyTool = useCallback(
    (blockPos: Vec3, normal: THREE.Vector3 | undefined) => {
      const tool = settings.activeTool
      switch (tool) {
        case 'remove':
          removeBlock(blockPos)
          break
        case 'paint':
          placeBlock(blockPos, settings.selectedBlockId)
          break
        case 'select':
          setSelection({ type: 'single', bounds: { min: blockPos, max: blockPos }, blocks: [blockPos] })
          break
        case 'place':
        default: {
          const n = normal ?? new THREE.Vector3(0, 1, 0)
          const target: Vec3 = {
            x: blockPos.x + Math.round(n.x),
            y: blockPos.y + Math.round(n.y),
            z: blockPos.z + Math.round(n.z),
          }
          placeBlock(target, settings.selectedBlockId)
          break
        }
      }
    },
    [settings.activeTool, settings.selectedBlockId, placeBlock, removeBlock, setSelection]
  )

  const handleBlockMove = useCallback(
    (positions: Vec3[]) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      if (e.instanceId === undefined) return
      const pos = positions[e.instanceId]
      if (!pos) return
      if (settings.activeTool === 'place' && e.face) {
        const n = e.face.normal
        setHoveredBlock({ x: pos.x + Math.round(n.x), y: pos.y + Math.round(n.y), z: pos.z + Math.round(n.z) })
      } else {
        setHoveredBlock(pos)
      }
    },
    [settings.activeTool, setHoveredBlock]
  )

  const handleBlockClick = useCallback(
    (positions: Vec3[]) => (e: ThreeEvent<MouseEvent>) => {
      // Ignore camera drags (only act on genuine clicks).
      if (e.delta > 4) return
      e.stopPropagation()
      if (e.instanceId === undefined) return
      const pos = positions[e.instanceId]
      if (!pos) return
      applyTool(pos, e.face?.normal)
    },
    [applyTool]
  )

  // Ground plane: lets the user place the first block / build on Y=0.
  const handleGroundClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (e.delta > 4) return
      if (settings.activeTool !== 'place') return
      const cell: Vec3 = { x: Math.floor(e.point.x), y: 0, z: Math.floor(e.point.z) }
      // Start a fresh project if the user is building from an empty scene.
      if (!structure) newProject('Untitled', { x: 64, y: 64, z: 64 })
      placeBlock(cell, settings.selectedBlockId)
    },
    [structure, settings.activeTool, settings.selectedBlockId, placeBlock, newProject]
  )

  const handleGroundMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (settings.activeTool !== 'place') return
      setHoveredBlock({ x: Math.floor(e.point.x), y: 0, z: Math.floor(e.point.z) })
    },
    [settings.activeTool, setHoveredBlock]
  )

  return (
    <group>
      {groups.map((g) => (
        <InstancedBlocks
          key={g.blockId}
          group={g}
          viewMode={settings.viewMode}
          onMove={handleBlockMove(g.positions)}
          onClick={handleBlockClick(g.positions)}
          onLeave={() => setHoveredBlock(null)}
        />
      ))}

      {/* Invisible ground plane for placement (only interactive in place mode). */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        onClick={handleGroundClick}
        onPointerMove={handleGroundMove}
      >
        <planeGeometry args={[512, 512]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Hover highlight */}
      {hoveredBlock && (
        <mesh position={[hoveredBlock.x, hoveredBlock.y, hoveredBlock.z]}>
          <boxGeometry args={[1.02, 1.02, 1.02]} />
          <meshBasicMaterial
            color={settings.activeTool === 'remove' ? '#ff4444' : '#6c63ff'}
            transparent
            opacity={0.35}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  )
}

interface InstancedBlocksProps {
  group: BlockTypeGroup
  viewMode: 'solid' | 'wireframe' | 'xray'
  onMove: (e: ThreeEvent<PointerEvent>) => void
  onClick: (e: ThreeEvent<MouseEvent>) => void
  onLeave: () => void
}

function InstancedBlocks({ group, viewMode, onMove, onClick, onLeave }: InstancedBlocksProps) {
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    group.positions.forEach((pos, i) => {
      dummy.position.set(pos.x, pos.y, pos.z)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [group.positions])

  return (
    <instancedMesh
      ref={ref}
      args={[CUBE_GEOMETRY, undefined, group.positions.length]}
      castShadow
      receiveShadow
      onPointerMove={onMove}
      onPointerOut={onLeave}
      onClick={onClick}
    >
      <meshLambertMaterial
        color={group.color}
        wireframe={viewMode === 'wireframe'}
        transparent={viewMode === 'xray'}
        opacity={viewMode === 'xray' ? 0.3 : 1}
      />
    </instancedMesh>
  )
}
