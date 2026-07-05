// ============================================================
// Sidebar.tsx — MIneLAb
// Narrow (52px) left sidebar with icon navigation buttons.
// Panels grouped: Chat/Import/Export | History/Materials/Analysis
// | Library/Settings (pushed to bottom)
// ============================================================

import React, { useState } from 'react';
import {
  Bot,
  Upload,
  Download,
  GitBranch,
  Package,
  Zap,
  Library,
  Settings2,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

export interface SidebarProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
}

interface PanelDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

// ── Panel Groups ─────────────────────────────────────────────

const TOP_PANELS: PanelDef[] = [
  { id: 'chat',   label: 'AI Chat', icon: <Bot size={18} />,     shortcut: 'C' },
  { id: 'import', label: 'Import',  icon: <Upload size={18} />,   shortcut: 'I' },
  { id: 'export', label: 'Export',  icon: <Download size={18} />, shortcut: 'E' },
];

const MID_PANELS: PanelDef[] = [
  { id: 'history',   label: 'History',   icon: <GitBranch size={18} />, shortcut: 'H' },
  { id: 'materials', label: 'Materials', icon: <Package size={18} />,   shortcut: 'M' },
  { id: 'analysis',  label: 'Analysis',  icon: <Zap size={18} />,       shortcut: 'A' },
];

const BOT_PANELS: PanelDef[] = [
  { id: 'library',  label: 'Library',  icon: <Library size={18} />,   shortcut: 'L' },
  { id: 'settings', label: 'Settings', icon: <Settings2 size={18} />, shortcut: ',' },
];

// ── Sidebar Button ────────────────────────────────────────────

interface SidebarBtnProps {
  panel: PanelDef;
  active: boolean;
  onClick: () => void;
}

function SidebarBtn({ panel, active, onClick }: SidebarBtnProps) {
  const [hovered, setHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const bg = active
    ? 'rgba(108,99,255,0.2)'
    : hovered
    ? 'rgba(255,255,255,0.06)'
    : 'transparent';

  const color = active
    ? 'var(--mine-accent)'
    : hovered
    ? 'var(--mine-text)'
    : 'var(--mine-muted)';

  const border = active
    ? '1px solid rgba(108,99,255,0.35)'
    : '1px solid transparent';

  return (
    <div
      style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}
      onMouseEnter={() => { setHovered(true); setTooltipVisible(true); }}
      onMouseLeave={() => { setHovered(false); setTooltipVisible(false); }}
    >
      <button
        id={`sidebar-btn-${panel.id}`}
        aria-label={panel.label}
        aria-pressed={active}
        onClick={onClick}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border,
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {panel.icon}

        {/* Active indicator bar on the left */}
        {active && (
          <span
            style={{
              position: 'absolute',
              left: -6,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 3,
              height: 20,
              borderRadius: '0 3px 3px 0',
              background: 'var(--mine-accent)',
              boxShadow: '0 0 8px rgba(108,99,255,0.6)',
            }}
          />
        )}
      </button>

      {/* Tooltip (appears to the right) */}
      {tooltipVisible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: 'calc(100% + 10px)',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--mine-surface2)',
            border: '1px solid var(--mine-border)',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--mine-text)',
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            animation: 'slideInLeft 0.12s ease-out',
          }}
        >
          {/* Arrow */}
          <span
            style={{
              position: 'absolute',
              left: -4,
              top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: 7,
              height: 7,
              background: 'var(--mine-surface2)',
              borderLeft: '1px solid var(--mine-border)',
              borderBottom: '1px solid var(--mine-border)',
            }}
          />
          {panel.label}
          {panel.shortcut && (
            <kbd
              style={{
                background: 'var(--mine-dark)',
                border: '1px solid var(--mine-border)',
                borderRadius: 3,
                padding: '1px 5px',
                fontSize: 10,
                color: 'var(--mine-muted)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {panel.shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}

// ── Group Divider ─────────────────────────────────────────────

function SidebarDivider() {
  return (
    <div
      style={{
        width: 28,
        height: 1,
        background: 'var(--mine-border)',
        margin: '4px auto',
        flexShrink: 0,
        opacity: 0.7,
      }}
    />
  );
}

// ── Main Sidebar ──────────────────────────────────────────────

export function Sidebar({ activePanel, onPanelChange }: SidebarProps) {
  const toggle = (id: string) => onPanelChange(activePanel === id ? null : id);

  return (
    <nav
      aria-label="Panel navigation"
      style={{
        width: 52,
        minWidth: 52,
        height: '100%',
        background: 'var(--mine-surface)',
        borderRight: '1px solid var(--mine-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0',
        gap: 2,
        flexShrink: 0,
        overflow: 'visible',
        userSelect: 'none',
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Top group */}
      {TOP_PANELS.map((p) => (
        <SidebarBtn
          key={p.id}
          panel={p}
          active={activePanel === p.id}
          onClick={() => toggle(p.id)}
        />
      ))}

      <SidebarDivider />

      {/* Middle group */}
      {MID_PANELS.map((p) => (
        <SidebarBtn
          key={p.id}
          panel={p}
          active={activePanel === p.id}
          onClick={() => toggle(p.id)}
        />
      ))}

      {/* Spacer pushes bottom group down */}
      <div style={{ flex: 1 }} />

      <SidebarDivider />

      {/* Bottom group */}
      {BOT_PANELS.map((p) => (
        <SidebarBtn
          key={p.id}
          panel={p}
          active={activePanel === p.id}
          onClick={() => toggle(p.id)}
        />
      ))}
    </nav>
  );
}
