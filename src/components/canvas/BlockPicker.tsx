import React, { useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { BlockRegistry } from '../../core/BlockRegistry'
import { ChevronUp, Search, X } from 'lucide-react'

export function BlockPicker() {
  const { settings, setSelectedBlockId } = useEditorStore()
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')

  const selectedBlock = BlockRegistry.getBlock(settings.selectedBlockId)
  const allBlocks = BlockRegistry.getAllBlocks()
  const filtered = search
    ? allBlocks.filter(b =>
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.displayName.toLowerCase().includes(search.toLowerCase())
      )
    : allBlocks

  return (
    <div className="absolute bottom-10 right-3" style={{ zIndex: 20 }}>
      {/* Block selector dialog */}
      {showPicker && (
        <div className="glass-panel rounded-xl mb-2 p-3 animate-fade-in" style={{ width: 280 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--mine-text)' }}>Select Block</span>
            <button className="btn btn-ghost p-1" onClick={() => setShowPicker(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--mine-muted)' }} />
            <input
              className="input pl-7"
              placeholder="Search blocks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {filtered.slice(0, 50).map(block => (
              <button
                key={block.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-white/5 transition-colors"
                style={block.id === settings.selectedBlockId ? { background: 'rgba(108,99,255,0.15)' } : {}}
                onClick={() => {
                  setSelectedBlockId(block.id)
                  setShowPicker(false)
                  setSearch('')
                }}
              >
                <div
                  className="w-5 h-5 rounded flex-shrink-0 border"
                  style={{ background: block.color, borderColor: 'rgba(255,255,255,0.1)' }}
                />
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--mine-text)' }}>
                    {block.displayName}
                  </div>
                  <div className="text-xs mono" style={{ color: 'var(--mine-muted)' }}>
                    {block.id.replace('minecraft:', '')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current block pill */}
      <button
        className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2 hover:border-accent transition-all"
        style={{ borderColor: 'var(--mine-border)' }}
        onClick={() => setShowPicker(v => !v)}
        title="Change selected block"
      >
        <div
          className="w-5 h-5 rounded flex-shrink-0 border"
          style={{ background: selectedBlock?.color ?? '#888', borderColor: 'rgba(255,255,255,0.15)' }}
        />
        <span className="text-xs mono" style={{ color: 'var(--mine-text)' }}>
          {settings.selectedBlockId.replace('minecraft:', '')}
        </span>
        <ChevronUp size={12} style={{ color: 'var(--mine-muted)' }} />
      </button>
    </div>
  )
}
