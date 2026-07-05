import React from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { Undo2, Redo2, GitBranch } from 'lucide-react'

export function HistoryPanel() {
  const { undoStack, redoStack, undo, redo } = useEditorStore()

  return (
    <div className="flex flex-col h-full">
      {/* Undo/Redo buttons */}
      <div className="p-3 flex gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--mine-border)' }}>
        <button
          className="btn btn-secondary flex-1 justify-center text-xs"
          onClick={undo}
          disabled={undoStack.length === 0}
        >
          <Undo2 size={14} /> Undo ({undoStack.length})
        </button>
        <button
          className="btn btn-secondary flex-1 justify-center text-xs"
          onClick={redo}
          disabled={redoStack.length === 0}
        >
          <Redo2 size={14} /> Redo ({redoStack.length})
        </button>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto">
        {undoStack.length === 0 && redoStack.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <GitBranch size={32} className="mb-3 opacity-30" style={{ color: 'var(--mine-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--mine-muted)' }}>No history yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--mine-border)' }}>
              Actions will appear here as you edit
            </p>
          </div>
        ) : (
          <div className="p-2">
            {/* Redo stack (future) */}
            {redoStack.slice().reverse().map((diff, i) => (
              <div
                key={diff.id}
                className="px-3 py-2 rounded-lg mb-1 text-xs opacity-50"
                style={{ background: 'var(--mine-surface2)', border: '1px solid var(--mine-border)' }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--mine-text)' }}>{diff.description}</span>
                  <span className="badge badge-info">redo</span>
                </div>
                <div className="mt-0.5" style={{ color: 'var(--mine-muted)' }}>
                  +{diff.add?.length ?? 0} −{diff.remove?.length ?? 0} ~{diff.replace?.length ?? 0}
                </div>
              </div>
            ))}

            {/* Current state indicator */}
            <div className="flex items-center gap-2 my-2 px-2">
              <div className="flex-1 h-px" style={{ background: 'var(--mine-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--mine-accent)' }}>● Current</span>
              <div className="flex-1 h-px" style={{ background: 'var(--mine-accent)' }} />
            </div>

            {/* Undo stack (past) */}
            {[...undoStack].reverse().map((diff, i) => (
              <div
                key={diff.id}
                className="px-3 py-2 rounded-lg mb-1 text-xs hover:bg-white/5 transition-colors cursor-default"
                style={{ background: 'var(--mine-surface2)', border: '1px solid var(--mine-border)' }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--mine-text)' }}>{diff.description}</span>
                  {diff.author && <span className="badge badge-accent text-xs">{diff.author}</span>}
                </div>
                <div className="mt-0.5" style={{ color: 'var(--mine-muted)' }}>
                  +{diff.add?.length ?? 0} −{diff.remove?.length ?? 0} ~{diff.replace?.length ?? 0}
                  {diff.timestamp && (
                    <span className="ml-2">{new Date(diff.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
