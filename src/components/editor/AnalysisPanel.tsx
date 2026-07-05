import React, { useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { countBlocks, structureSummary } from '../../core/StructureData'
import { BlockRegistry } from '../../core/BlockRegistry'
import { Zap, AlertCircle, Info } from 'lucide-react'

export function AnalysisPanel() {
  const { structure } = useEditorStore()
  const [analysis, setAnalysis] = useState<ReturnType<typeof structureSummary> | null>(null)

  const handleAnalyze = () => {
    if (!structure) return
    setAnalysis(structureSummary(structure))
  }

  const maxCount = analysis ? Math.max(...analysis.blockBreakdown.map(b => b.count)) : 1

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--mine-border)' }}>
        <button
          className="btn btn-primary w-full justify-center text-xs"
          onClick={handleAnalyze}
          disabled={!structure}
        >
          <Zap size={14} />
          {analysis ? 'Re-Analyze' : 'Analyze Structure'}
        </button>
      </div>

      {!analysis ? (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div style={{ color: 'var(--mine-muted)' }}>
            <Zap size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{!structure ? 'No structure loaded' : 'Click Analyze to inspect'}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-5">
          {/* Stats */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--mine-muted)' }}>Statistics</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Total Blocks', value: analysis.totalBlocks.toLocaleString() },
                { label: 'Unique Types', value: analysis.blockBreakdown.length },
                { label: 'Dimensions', value: `${analysis.dimensions.x}×${analysis.dimensions.y}×${analysis.dimensions.z}` },
                { label: 'Volume', value: (analysis.dimensions.x * analysis.dimensions.y * analysis.dimensions.z).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'var(--mine-surface2)', border: '1px solid var(--mine-border)' }}>
                  <div className="text-xs" style={{ color: 'var(--mine-muted)' }}>{label}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--mine-text)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Block distribution */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--mine-muted)' }}>Block Distribution</p>
            <div className="space-y-1.5">
              {analysis.blockBreakdown.slice(0, 15).map(({ blockId, count }) => {
                const block = BlockRegistry.getBlock(blockId)
                const pct = Math.round((count / analysis.totalBlocks) * 100)
                const barWidth = (count / maxCount) * 100

                return (
                  <div key={blockId}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: block?.color ?? '#888' }} />
                        <span className="text-xs mono truncate" style={{ color: 'var(--mine-text)' }}>
                          {blockId.replace('minecraft:', '')}
                        </span>
                      </div>
                      <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--mine-muted)' }}>
                        {count.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1 rounded-full w-full" style={{ background: 'var(--mine-border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barWidth}%`, background: block?.color ?? 'var(--mine-accent)' }}
                      />
                    </div>
                  </div>
                )
              })}
              {analysis.blockBreakdown.length > 15 && (
                <p className="text-xs" style={{ color: 'var(--mine-muted)' }}>
                  +{analysis.blockBreakdown.length - 15} more types
                </p>
              )}
            </div>
          </div>

          {/* Issues */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--mine-muted)' }}>Issues</p>
            {analysis.totalBlocks === 0 ? (
              <div className="flex items-center gap-2 text-xs p-2 rounded" style={{ background: 'var(--mine-surface2)', color: 'var(--mine-muted)' }}>
                <Info size={13} /> Structure is empty
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs p-2 rounded" style={{ background: 'rgba(0,212,170,0.08)', color: 'var(--mine-accent2)' }}>
                ✓ No issues found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
