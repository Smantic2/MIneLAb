import React, { useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { calculateMaterials, estimateBuildTime, toCSV, toText } from '../../core/MaterialCalculator'
import { downloadText, copyToClipboard } from '../../utils/download'
import { RefreshCw, Download, Copy, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react'
import { BlockRegistry } from '../../core/BlockRegistry'

type SortKey = 'count' | 'name'
type SortDir = 'asc' | 'desc'

export function MaterialsPanel() {
  const { structure } = useEditorStore()
  const [list, setList] = useState<ReturnType<typeof calculateMaterials> | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('count')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleCalculate = () => {
    if (!structure) return
    setList(calculateMaterials(structure))
  }

  const sorted = React.useMemo(() => {
    if (!list) return []
    return [...list.blocks].sort((a, b) => {
      const v = sortKey === 'count'
        ? (sortDir === 'desc' ? b.count - a.count : a.count - b.count)
        : (sortDir === 'desc' ? b.blockId.localeCompare(a.blockId) : a.blockId.localeCompare(b.blockId))
      return v
    })
  }, [list, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />) : <ArrowUpDown size={12} />

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--mine-border)' }}>
        <div className="flex gap-2">
          <button
            className="btn btn-primary flex-1 justify-center text-xs"
            onClick={handleCalculate}
            disabled={!structure}
          >
            <RefreshCw size={14} />
            {list ? 'Recalculate' : 'Calculate Materials'}
          </button>
          {list && (
            <>
              <button className="btn btn-secondary px-2" onClick={() => downloadText(toCSV(list), 'materials.csv', 'text/csv')} title="Export CSV">
                <Download size={14} />
              </button>
              <button className="btn btn-secondary px-2" onClick={() => copyToClipboard(toText(list))} title="Copy as text">
                <Copy size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      {list && sorted.length > 0 ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div
            className="grid gap-2 px-3 py-2 text-xs flex-shrink-0"
            style={{ gridTemplateColumns: '1fr auto auto auto', borderBottom: '1px solid var(--mine-border)', color: 'var(--mine-muted)' }}
          >
            <button className="flex items-center gap-1 text-left hover:text-white transition-colors" onClick={() => toggleSort('name')}>
              Block <SortIcon k="name" />
            </button>
            <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => toggleSort('count')}>
              Count <SortIcon k="count" />
            </button>
            <span>Stacks</span>
            <span>Rem.</span>
          </div>

          {/* Rows */}
          <div className="overflow-y-auto flex-1">
            {sorted.map(item => {
              const block = BlockRegistry.getBlock(item.blockId)
              const stacks = Math.floor(item.count / 64)
              const rem = item.count % 64
              return (
                <div
                  key={item.blockId}
                  className="grid gap-2 px-3 py-1.5 items-center text-xs hover:bg-white/5 transition-colors"
                  style={{ gridTemplateColumns: '1fr auto auto auto', borderBottom: '1px solid rgba(42,42,61,0.5)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ background: block?.color ?? '#888', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <span className="truncate mono" style={{ color: 'var(--mine-text)' }}>
                      {item.blockId.replace('minecraft:', '')}
                    </span>
                  </div>
                  <span style={{ color: 'var(--mine-text)' }}>{item.count.toLocaleString()}</span>
                  <span style={{ color: 'var(--mine-muted)' }}>{stacks}</span>
                  <span style={{ color: 'var(--mine-muted)' }}>{rem}</span>
                </div>
              )
            })}
          </div>

          {/* Footer summary */}
          <div className="px-3 py-2 flex-shrink-0 text-xs" style={{ borderTop: '1px solid var(--mine-border)', background: 'var(--mine-darker)' }}>
            <div className="flex justify-between" style={{ color: 'var(--mine-muted)' }}>
              <span>Total: <strong style={{ color: 'var(--mine-text)' }}>{list.totalBlocks.toLocaleString()}</strong> blocks</span>
              <span>{Math.ceil(list.totalBlocks / 64).toLocaleString()} stacks</span>
            </div>
            <div className="mt-0.5" style={{ color: 'var(--mine-muted)' }}>
              Est. build time: <strong style={{ color: 'var(--mine-accent2)' }}>{estimateBuildTime(list.totalBlocks)}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div style={{ color: 'var(--mine-muted)' }}>
            <RefreshCw size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{!structure ? 'No structure loaded' : 'Click Calculate to see materials'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
