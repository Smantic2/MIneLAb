import React, { useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { Search, ExternalLink, GitFork } from 'lucide-react'

const LIBRARY_SAMPLES = [
  { id: '1', name: 'Medieval Castle', author: 'Steve_Builder', blocks: 12400, tags: ['Medieval', 'Castle'], color: '#888877' },
  { id: '2', name: 'Pixel Art Dragon', author: 'ArtLord99', blocks: 3200, tags: ['Pixel Art', 'Fantasy'], color: '#cc4444' },
  { id: '3', name: 'Modern Skyscraper', author: 'UrbanCraft', blocks: 28000, tags: ['Modern', 'City'], color: '#7799cc' },
  { id: '4', name: 'Ancient Temple', author: 'TempleCraft', blocks: 7800, tags: ['Fantasy', 'Temple'], color: '#aa9966' },
  { id: '5', name: 'Space Station', author: 'CosmicMC', blocks: 5600, tags: ['SciFi', 'Space'], color: '#445566' },
  { id: '6', name: 'Japanese Village', author: 'ShogunBuild', blocks: 9200, tags: ['Medieval', 'Village'], color: '#cc6644' },
  { id: '7', name: 'Underground Dungeon', author: 'DungeonMaster', blocks: 4100, tags: ['Dungeon', 'Fantasy'], color: '#554455' },
  { id: '8', name: 'Floating Islands', author: 'SkyArchitect', blocks: 6300, tags: ['Fantasy', 'Sky'], color: '#44aa77' },
]

const ALL_TAGS = ['Medieval', 'Fantasy', 'Modern', 'SciFi', 'Pixel Art', 'Village', 'Castle', 'Dungeon', 'Temple', 'City', 'Sky', 'Space']

export function LibraryPanel() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = LIBRARY_SAMPLES.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.author.toLowerCase().includes(search.toLowerCase())
    const matchTag = !activeTag || s.tags.includes(activeTag)
    return matchSearch && matchTag
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 flex-shrink-0 space-y-2" style={{ borderBottom: '1px solid var(--mine-border)' }}>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--mine-muted)' }} />
          <input
            className="input pl-8 text-sm"
            placeholder="Search structures..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ALL_TAGS.slice(0, 8).map(tag => (
            <button
              key={tag}
              className="badge text-xs cursor-pointer transition-all"
              style={{
                background: activeTag === tag ? 'var(--mine-accent)' : 'var(--mine-surface2)',
                color: activeTag === tag ? 'white' : 'var(--mine-muted)',
                border: `1px solid ${activeTag === tag ? 'var(--mine-accent)' : 'var(--mine-border)'}`,
              }}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {filtered.map(item => (
          <div
            key={item.id}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--mine-border)', background: 'var(--mine-surface2)' }}
          >
            {/* Thumbnail */}
            <div
              className="h-16 flex items-center justify-center"
              style={{ background: `${item.color}33`, borderBottom: '1px solid var(--mine-border)' }}
            >
              <div
                className="w-10 h-10 rounded-lg"
                style={{ background: item.color, opacity: 0.7 }}
              />
            </div>

            {/* Info */}
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--mine-text)' }}>{item.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--mine-muted)' }}>by {item.author} · {item.blocks.toLocaleString()} blocks</p>
                </div>
              </div>

              <div className="flex gap-1 mt-2 flex-wrap">
                {item.tags.map(tag => (
                  <span key={tag} className="badge badge-accent text-xs">{tag}</span>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <button className="btn btn-primary flex-1 justify-center text-xs">
                  <ExternalLink size={13} /> Open
                </button>
                <button className="btn btn-secondary px-3" title="Fork structure">
                  <GitFork size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--mine-muted)' }}>
            <p className="text-sm">No results found</p>
          </div>
        )}

        <p className="text-xs text-center py-3" style={{ color: 'var(--mine-border)' }}>
          Community library — coming soon
        </p>
      </div>
    </div>
  )
}
