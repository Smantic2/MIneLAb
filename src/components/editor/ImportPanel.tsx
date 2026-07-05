import React, { useRef, useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { importMCAI } from '../../export/mcai'
import { detectFormat, importBinary } from '../../formats/index'
import { readFileAsText, readFileAsArrayBuffer } from '../../utils/download'
import { Upload, AlertCircle, Check } from 'lucide-react'

const SUPPORTED = ['.mcai', '.schem', '.litematic', '.nbt']

export function ImportPanel() {
  const { setStructure } = useEditorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null)

  const handleFile = async (file: File) => {
    setStatus({ type: 'loading', message: `Loading ${file.name}...` })
    try {
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
      const baseName = file.name.replace(/\.[^.]+$/, '')

      if (ext === '.mcai') {
        const text = await readFileAsText(file)
        const partial = importMCAI(text)
        if (partial.structure) {
          setStructure(partial.structure)
          setStatus({ type: 'success', message: `✓ Loaded "${partial.structure.name}"` })
        }
        return
      }

      // Binary NBT-based formats (.schem / .litematic / .nbt)
      const buffer = await readFileAsArrayBuffer(file)
      const bytes = new Uint8Array(buffer)
      const format = detectFormat(file.name, bytes)
      if (!format) {
        setStatus({ type: 'error', message: `Unrecognized format: ${ext}. Supported: ${SUPPORTED.join(', ')}` })
        return
      }
      const structure = importBinary(format, bytes, baseName)
      const blockCount = structure.chunks.size > 0
        ? Array.from(structure.chunks.values()).reduce((sum, c) => sum + c.blocks.reduce((a, b) => a + (b !== 0 ? 1 : 0), 0), 0)
        : 0
      setStructure(structure)
      setStatus({ type: 'success', message: `✓ Imported "${baseName}" (${format}, ${blockCount.toLocaleString()} blocks)` })
    } catch (err: any) {
      setStatus({ type: 'error', message: `Error: ${err?.message ?? 'Failed to parse file'}` })
    }
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Drop zone */}
      <div
        className="rounded-xl p-8 text-center mb-4 transition-all cursor-pointer"
        style={{
          border: `2px dashed ${dragging ? 'var(--mine-accent)' : 'var(--mine-border)'}`,
          background: dragging ? 'rgba(108,99,255,0.05)' : 'var(--mine-surface2)',
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={32} className="mx-auto mb-3" style={{ color: dragging ? 'var(--mine-accent)' : 'var(--mine-muted)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--mine-text)' }}>
          Drop file here or click to browse
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--mine-muted)' }}>
          {SUPPORTED.join(', ')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED.join(',')}
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Status */}
      {status && (
        <div
          className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
          style={{
            background: status.type === 'success' ? 'rgba(0,212,170,0.1)' : status.type === 'error' ? 'rgba(255,59,48,0.1)' : 'var(--mine-surface2)',
            border: `1px solid ${status.type === 'success' ? 'rgba(0,212,170,0.3)' : status.type === 'error' ? 'rgba(255,59,48,0.3)' : 'var(--mine-border)'}`,
            color: status.type === 'success' ? 'var(--mine-accent2)' : status.type === 'error' ? '#ff3b30' : 'var(--mine-muted)',
          }}
        >
          {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Supported formats list */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--mine-muted)' }}>SUPPORTED FORMATS</p>
        <div className="space-y-1.5">
          {[
            { ext: '.mcai', desc: 'MIneLAb native format (full support)', status: 'supported' },
            { ext: '.schem', desc: 'WorldEdit / FAWE (Sponge v2)', status: 'supported' },
            { ext: '.litematic', desc: 'Litematica mod files', status: 'supported' },
            { ext: '.nbt', desc: 'Vanilla structure block files', status: 'supported' },
          ].map(f => (
            <div key={f.ext} className="flex items-center justify-between text-xs">
              <div>
                <span className="mono font-semibold" style={{ color: 'var(--mine-text)' }}>{f.ext}</span>
                <span className="ml-2" style={{ color: 'var(--mine-muted)' }}>{f.desc}</span>
              </div>
              <span className={`badge ${f.status === 'supported' ? 'badge-success' : 'badge-info'}`}>
                {f.status === 'supported' ? 'Ready' : 'Soon'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
