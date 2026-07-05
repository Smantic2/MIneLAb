import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { Box, Grid3x3, Eye, Navigation, Layers, MousePointer2, Plus, Eraser, Paintbrush, Undo2, Redo2 } from 'lucide-react'
import type { ActiveTool } from '../../types/index'

const TOOLS: Array<{ id: ActiveTool; icon: React.ReactNode; title: string }> = [
  { id: 'select', icon: <MousePointer2 size={14} />, title: 'Select (1)' },
  { id: 'place', icon: <Plus size={14} />, title: 'Place block (2)' },
  { id: 'remove', icon: <Eraser size={14} />, title: 'Remove block (3)' },
  { id: 'paint', icon: <Paintbrush size={14} />, title: 'Paint / replace (4)' },
]

export function ViewportToolbar() {
  const { settings, updateSettings, undo, redo, undoStack, redoStack } = useEditorStore()

  return (
    <div
      className="absolute top-3 left-3 flex flex-col gap-1 animate-fade-in"
      style={{ zIndex: 10 }}
    >
      {/* Tools group */}
      <div className="glass-panel rounded-lg p-1 flex flex-col gap-1">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded"
            style={settings.activeTool === t.id ? { background: 'var(--mine-accent)', color: 'white' } : {}}
            onClick={() => updateSettings({ activeTool: t.id })}
            title={t.title}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Undo / Redo group */}
      <div className="glass-panel rounded-lg p-1 flex flex-col gap-1">
        <button
          className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded disabled:opacity-30"
          onClick={() => undo()}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded disabled:opacity-30"
          onClick={() => redo()}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
        </button>
      </div>

      {/* View mode group */}
      <div className="glass-panel rounded-lg p-1 flex flex-col gap-1">
        <button
          className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded"
          style={settings.viewMode === 'solid' ? { background: 'var(--mine-accent)', color: 'white' } : {}}
          onClick={() => updateSettings({ viewMode: 'solid' })}
          title="Solid view"
        >
          <Box size={14} />
        </button>
        <button
          className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded"
          style={settings.viewMode === 'wireframe' ? { background: 'var(--mine-accent)', color: 'white' } : {}}
          onClick={() => updateSettings({ viewMode: 'wireframe' })}
          title="Wireframe view"
        >
          <Grid3x3 size={14} />
        </button>
        <button
          className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded"
          style={settings.viewMode === 'xray' ? { background: 'var(--mine-accent)', color: 'white' } : {}}
          onClick={() => updateSettings({ viewMode: 'xray' })}
          title="X-Ray view"
        >
          <Eye size={14} />
        </button>
      </div>

      {/* Grid toggle */}
      <div className="glass-panel rounded-lg p-1 flex flex-col gap-1">
        <button
          className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded"
          style={settings.showGrid ? { background: 'rgba(108,99,255,0.2)', color: 'var(--mine-accent)' } : {}}
          onClick={() => updateSettings({ showGrid: !settings.showGrid })}
          title="Toggle grid (G)"
        >
          <Layers size={14} />
        </button>
        <button
          className="btn btn-ghost w-8 h-8 p-0 flex items-center justify-center rounded"
          style={settings.cameraMode === 'fly' ? { background: 'rgba(0,212,170,0.2)', color: 'var(--mine-accent2)' } : {}}
          onClick={() => updateSettings({ cameraMode: settings.cameraMode === 'orbit' ? 'fly' : 'orbit' })}
          title={`Camera: ${settings.cameraMode} (click to switch)`}
        >
          <Navigation size={14} />
        </button>
      </div>
    </div>
  )
}
