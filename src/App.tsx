import React, { useState, useEffect } from 'react'
import { Topbar } from './components/ui/Topbar'
import { Sidebar } from './components/ui/Sidebar'
import { RightPanel } from './components/ui/RightPanel'
import { ViewportCanvas } from './components/canvas/ViewportCanvas'
import { WelcomeModal } from './components/ui/WelcomeModal'
import { StatusBar } from './components/ui/StatusBar'
import { ToastContainer } from './components/ui/ToastContainer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export type ActivePanel = 'chat' | 'materials' | 'history' | 'analysis' | 'export' | 'import' | 'library' | 'settings'

export default function App() {
  const [activePanel, setActivePanel] = useState<ActivePanel | null>('chat')
  const [showWelcome, setShowWelcome] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  useKeyboardShortcuts()

  useEffect(() => {
    const visited = localStorage.getItem('minelab_visited')
    if (!visited) {
      setShowWelcome(true)
      localStorage.setItem('minelab_visited', '1')
    }
  }, [])

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: 'var(--mine-darker)' }}>
      <Topbar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        rightPanelCollapsed={rightPanelCollapsed}
        onToggleRightPanel={() => setRightPanelCollapsed(v => !v)}
      />
      <div className="flex flex-1 overflow-hidden">
        {!sidebarCollapsed && (
          <Sidebar
            activePanel={activePanel}
            onPanelChange={(p) => setActivePanel(p as ActivePanel | null)}
          />
        )}
        <div className="flex-1 relative overflow-hidden">
          <ViewportCanvas />
        </div>
        {!rightPanelCollapsed && activePanel && (
          <RightPanel
            activePanel={activePanel}
            onClose={() => setActivePanel(null)}
          />
        )}
      </div>
      <StatusBar />
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      <ToastContainer />
    </div>
  )
}
