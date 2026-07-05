import React, { useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { exportMCFunction } from '../../export/mcfunction'
import { exportStructureMCAI } from '../../export/mcai'
import { exportBinary, exceedsStructureBlockLimit } from '../../formats/index'
import { exportGLB } from '../../export/glb'
import { exportLayersPNG } from '../../export/png'
import { downloadText, downloadBinary, downloadBlob, copyToClipboard, estimateMCFunctionSize, estimateNBTSize, formatFileSize } from '../../utils/download'
import { countBlocks } from '../../core/StructureData'
import { Download, Copy, AlertTriangle, Check } from 'lucide-react'

const FORMATS = [
  { id: 'mcai', ext: '.mcai', name: 'MIneLAb Native', label: 'MIneLAb format with history', color: '#6c63ff', comingSoon: false },
  { id: 'mcfunction', ext: '.mcfunction', name: 'MCFunction', label: 'Vanilla /setblock commands', color: '#00d4aa', comingSoon: false },
  { id: 'litematic', ext: '.litematic', name: 'Litematica', label: 'Litematica mod', color: '#ffc107', comingSoon: false },
  { id: 'schem', ext: '.schem', name: 'WorldEdit Schematic', label: 'WorldEdit/FAWE (Sponge v2)', color: '#ff6b35', comingSoon: false },
  { id: 'nbt', ext: '.nbt', name: 'Structure Block NBT', label: 'Vanilla structure blocks (48³ limit)', color: '#4a9eff', comingSoon: false },
  { id: 'glb', ext: '.glb', name: '3D Model (GLB)', label: 'Blender / 3D software', color: '#ff3b30', comingSoon: false },
  { id: 'png', ext: '.png', name: 'Layer Guide (PNG)', label: 'Layer-by-layer build guide', color: '#a78bfa', comingSoon: false },
]

export function ExportPanel() {
  const { structure } = useEditorStore()
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const blockCount = structure ? Object.values(countBlocks(structure)).reduce((a, b) => a + b, 0) : 0
  const fmt = FORMATS.find(f => f.id === selectedFormat)

  const handleExport = async () => {
    if (!structure || !selectedFormat) return

    if (selectedFormat === 'mcai') {
      const json = exportStructureMCAI(structure)
      downloadText(json, `${structure.name || 'structure'}.mcai`, 'application/json')
    } else if (selectedFormat === 'mcfunction') {
      const content = exportMCFunction(structure, { addComments: true })
      downloadText(content, `${structure.name || 'structure'}.mcfunction`, 'text/plain')
    } else if (selectedFormat === 'schem' || selectedFormat === 'litematic' || selectedFormat === 'nbt') {
      const data = exportBinary(selectedFormat, structure)
      const base = (structure.name || 'structure').replace(/[^a-zA-Z0-9_-]/g, '_')
      downloadBinary(data, `${base}.${selectedFormat}`)
    } else if (selectedFormat === 'glb') {
      const base = (structure.name || 'structure').replace(/[^a-zA-Z0-9_-]/g, '_')
      try {
        const data = await exportGLB(structure)
        downloadBinary(data, `${base}.glb`)
      } catch (err: any) {
        alert(`GLB export failed: ${err?.message ?? err}`)
      }
    } else if (selectedFormat === 'png') {
      const base = (structure.name || 'structure').replace(/[^a-zA-Z0-9_-]/g, '_')
      try {
        const blob = await exportLayersPNG(structure)
        downloadBlob(blob, `${base}_layers.png`)
      } catch (err: any) {
        alert(`PNG export failed: ${err?.message ?? err}`)
      }
    } else {
      alert(`${fmt?.name} export coming soon!`)
    }
  }

  const handleCopy = async () => {
    if (!structure) return
    const content = exportMCFunction(structure, { addComments: false })
    const ok = await copyToClipboard(content)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="overflow-y-auto h-full p-4">
      {!structure && (
        <div className="text-center py-8" style={{ color: 'var(--mine-muted)' }}>
          <p className="text-sm">No structure loaded.</p>
          <p className="text-xs mt-1">Generate or import a structure first.</p>
        </div>
      )}

      {structure && (
        <>
          {/* Summary */}
          <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--mine-surface2)', border: '1px solid var(--mine-border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--mine-muted)' }}>STRUCTURE</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--mine-text)' }}>{structure.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mine-muted)' }}>
              {structure.dimensions.x}×{structure.dimensions.y}×{structure.dimensions.z} · {blockCount.toLocaleString()} blocks
            </p>
          </div>

          {/* Format grid */}
          <div className="space-y-2 mb-4">
            {FORMATS.map(f => (
              <button
                key={f.id}
                className="w-full text-left rounded-xl p-3 transition-all"
                style={{
                  background: selectedFormat === f.id ? `${f.color}15` : 'var(--mine-surface2)',
                  border: `1px solid ${selectedFormat === f.id ? f.color : 'var(--mine-border)'}`,
                  opacity: f.comingSoon ? 0.6 : 1,
                }}
                onClick={() => !f.comingSoon && setSelectedFormat(f.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold" style={{ color: selectedFormat === f.id ? f.color : 'var(--mine-text)' }}>
                      {f.name}
                    </span>
                    <span className="ml-2 text-xs mono" style={{ color: 'var(--mine-muted)' }}>{f.ext}</span>
                  </div>
                  {f.comingSoon && (
                    <span className="badge badge-info text-xs">Soon</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--mine-muted)' }}>{f.label}</p>

                {/* Size estimate */}
                {selectedFormat === f.id && (
                  <div className="mt-2 text-xs" style={{ color: 'var(--mine-muted)' }}>
                    ~{formatFileSize(f.id === 'mcfunction' ? estimateMCFunctionSize(blockCount) : estimateNBTSize(blockCount))}
                  </div>
                )}

                {/* Warnings */}
                {f.id === 'nbt' && selectedFormat === 'nbt' && exceedsStructureBlockLimit(structure) && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: '#ffc107' }}>
                    <AlertTriangle size={11} /> Exceeds structure block limit (48×48×48) — may not load in vanilla
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          {selectedFormat && (
            <div className="flex gap-2">
              <button
                className="btn btn-primary flex-1 justify-center"
                onClick={handleExport}
              >
                <Download size={16} /> Export {fmt?.ext}
              </button>
              {selectedFormat === 'mcfunction' && (
                <button className="btn btn-secondary px-3" onClick={handleCopy}>
                  {copied ? <Check size={16} style={{ color: 'var(--mine-accent2)' }} /> : <Copy size={16} />}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
