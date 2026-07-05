import React from 'react'
import { Canvas } from '@react-three/fiber'
import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei'
import { VoxelWorld } from './VoxelWorld'
import { ViewportToolbar } from './ViewportToolbar'
import { BlockPicker } from './BlockPicker'
import { useEditorStore } from '../../stores/editorStore'

export function ViewportCanvas() {
  const { settings, setHoveredBlock, hoveredBlock, structure } = useEditorStore()

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ fov: 60, position: [30, 30, 30], near: 0.1, far: 2000 }}
        gl={{ antialias: true }}
        shadows
        style={{ background: '#0a0a0f' }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[100, 150, 50]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-50, 80, -50]} intensity={0.3} />

        {settings.showGrid && (
          <gridHelper
            args={[200, 200, '#2a2a3d', '#1a1a25']}
            position={[0, -0.01, 0]}
          />
        )}

        {settings.showAxes && <axesHelper args={[10]} />}

        <VoxelWorld />

        <OrbitControls
          makeDefault
          enablePan
          enableRotate
          enableZoom
          zoomSpeed={1.2}
          panSpeed={0.8}
          minDistance={2}
          maxDistance={500}
        />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ff6b6b', '#00d4aa', '#6c63ff']} labelColor="white" />
        </GizmoHelper>
      </Canvas>

      {/* Overlay UI */}
      <ViewportToolbar />
      <BlockPicker />

      {/* Coordinates display */}
      {settings.showCoordinates && hoveredBlock && (
        <div
          className="absolute bottom-10 left-3 glass-panel rounded px-3 py-1 text-xs mono pointer-events-none"
          style={{ color: 'var(--mine-muted)' }}
        >
          X: {hoveredBlock.x} &nbsp; Y: {hoveredBlock.y} &nbsp; Z: {hoveredBlock.z}
        </div>
      )}

      {/* Empty state */}
      {!structure && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div
              className="text-6xl mb-4"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(108,99,255,0.5))',
              }}
            >
              ⬛
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--mine-muted)' }}>
              No structure loaded
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--mine-border)' }}>
              Open the Chat panel and describe what you want to build
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
