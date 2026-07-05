import React, { lazy, Suspense } from 'react'
import { X, MessageSquare, Upload, Download, GitBranch, Package, Zap, Library, Settings2 } from 'lucide-react'

// Lazy-load panels
const ChatPanel = lazy(() => import('../ai/ChatPanel').then(m => ({ default: m.ChatPanel })))
const SettingsPanel = lazy(() => import('../editor/SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const ExportPanel = lazy(() => import('../editor/ExportPanel').then(m => ({ default: m.ExportPanel })))
const ImportPanel = lazy(() => import('../editor/ImportPanel').then(m => ({ default: m.ImportPanel })))
const MaterialsPanel = lazy(() => import('../editor/MaterialsPanel').then(m => ({ default: m.MaterialsPanel })))
const HistoryPanel = lazy(() => import('../editor/HistoryPanel').then(m => ({ default: m.HistoryPanel })))
const AnalysisPanel = lazy(() => import('../editor/AnalysisPanel').then(m => ({ default: m.AnalysisPanel })))
const LibraryPanel = lazy(() => import('../editor/LibraryPanel').then(m => ({ default: m.LibraryPanel })))

const PANEL_META: Record<string, { title: string; icon: React.ElementType }> = {
  chat: { title: 'AI Chat', icon: MessageSquare },
  import: { title: 'Import', icon: Upload },
  export: { title: 'Export', icon: Download },
  history: { title: 'History', icon: GitBranch },
  materials: { title: 'Materials', icon: Package },
  analysis: { title: 'Analysis', icon: Zap },
  library: { title: 'Library', icon: Library },
  settings: { title: 'Settings', icon: Settings2 },
}

interface RightPanelProps {
  activePanel: string
  onClose: () => void
}

function PanelContent({ panel }: { panel: string }) {
  switch (panel) {
    case 'chat': return <ChatPanel />
    case 'settings': return <SettingsPanel />
    case 'export': return <ExportPanel />
    case 'import': return <ImportPanel />
    case 'materials': return <MaterialsPanel />
    case 'history': return <HistoryPanel />
    case 'analysis': return <AnalysisPanel />
    case 'library': return <LibraryPanel />
    default: return null
  }
}

export function RightPanel({ activePanel, onClose }: RightPanelProps) {
  const meta = PANEL_META[activePanel]
  const Icon = meta?.icon ?? MessageSquare

  return (
    <div
      className="flex flex-col glass-panel animate-slide-in-right"
      style={{
        width: 340,
        borderLeft: '1px solid var(--mine-border)',
        background: 'var(--mine-surface)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--mine-border)' }}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: 'var(--mine-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--mine-text)' }}>
            {meta?.title ?? activePanel}
          </span>
        </div>
        <button className="btn btn-ghost p-1" onClick={onClose} title="Close panel">
          <X size={16} />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="spinner" />
            </div>
          }
        >
          <PanelContent panel={activePanel} />
        </Suspense>
      </div>
    </div>
  )
}
