// ============================================================
// Topbar.tsx — MIneLAb
// Sleek 44px dark top bar: logo, project name, undo/redo,
// view-mode toggles, panel toggles, settings.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Settings,
  PanelRight,
  Box,
  Grid,
  Eye,
  Cpu,
  Menu,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useProjectStore } from '../../stores/projectStore';
import type { ViewMode } from '../../types/index';

// ── Types ────────────────────────────────────────────────────

interface TopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  rightPanelCollapsed: boolean;
  onToggleRightPanel: () => void;
}

// ── Tooltip ──────────────────────────────────────────────────

interface TooltipProps {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'top';
}

function Tooltip({ label, shortcut, children, position = 'bottom' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            [position === 'bottom' ? 'top' : 'bottom']: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--mine-surface2)',
            border: '1px solid var(--mine-border)',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 11,
            color: 'var(--mine-text)',
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.1s ease-out',
          }}
        >
          <span>{label}</span>
          {shortcut && (
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
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}

// ── Icon Button ───────────────────────────────────────────────

interface IconBtnProps {
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  shortcut?: string;
}

function IconBtn({ icon, onClick, active, disabled, tooltip, shortcut }: IconBtnProps) {
  const [hovered, setHovered] = useState(false);

  const bg = active
    ? 'rgba(108,99,255,0.25)'
    : hovered && !disabled
    ? 'rgba(255,255,255,0.07)'
    : 'transparent';

  const color = disabled
    ? 'var(--mine-muted)'
    : active
    ? 'var(--mine-accent)'
    : hovered
    ? 'var(--mine-text)'
    : 'var(--mine-muted)';

  const btn = (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 30,
        height: 30,
        borderRadius: 6,
        border: active ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent',
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s ease',
        outline: 'none',
        flexShrink: 0,
      }}
      aria-disabled={disabled}
      aria-label={tooltip}
    >
      {icon}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip label={tooltip} shortcut={shortcut} position="bottom">
        {btn}
      </Tooltip>
    );
  }
  return btn;
}

// ── View Mode Button ──────────────────────────────────────────

interface ViewModeBtnProps {
  mode: ViewMode;
  current: ViewMode;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  position: 'first' | 'mid' | 'last';
  onSelect: (m: ViewMode) => void;
}

function ViewModeBtn({ mode, current, icon, label, shortcut, position, onSelect }: ViewModeBtnProps) {
  const active = mode === current;
  const [hovered, setHovered] = useState(false);

  const radius =
    position === 'first'
      ? '4px 0 0 4px'
      : position === 'last'
      ? '0 4px 4px 0'
      : '0';

  return (
    <Tooltip label={label} shortcut={shortcut} position="bottom">
      <button
        onClick={() => onSelect(mode)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: 28,
          padding: '0 9px',
          borderRadius: radius,
          border: active ? '1px solid rgba(108,99,255,0.5)' : '1px solid var(--mine-border)',
          background: active
            ? 'rgba(108,99,255,0.2)'
            : hovered
            ? 'rgba(255,255,255,0.05)'
            : 'var(--mine-surface)',
          color: active ? 'var(--mine-accent)' : hovered ? 'var(--mine-text)' : 'var(--mine-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          transition: 'all 0.15s ease',
          marginLeft: position !== 'first' ? -1 : 0,
          outline: 'none',
          whiteSpace: 'nowrap',
        }}
        aria-label={label}
        aria-pressed={active}
      >
        {icon}
        <span style={{ fontSize: 11 }}>{label}</span>
      </button>
    </Tooltip>
  );
}

// ── Editable Project Name ─────────────────────────────────────

function ProjectNameEditor() {
  const { currentProject, saveCurrentProject } = useProjectStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);

  const name = currentProject?.name ?? 'Untitled Project';

  const startEdit = () => {
    setValue(name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    if (currentProject && value.trim()) {
      useProjectStore.setState((s) => ({
        currentProject: s.currentProject
          ? { ...s.currentProject, name: value.trim() }
          : null,
      }));
      saveCurrentProject();
    }
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        autoFocus
        style={{
          background: 'var(--mine-dark)',
          border: '1px solid var(--mine-accent)',
          borderRadius: 5,
          padding: '2px 8px',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--mine-text)',
          outline: 'none',
          width: 200,
          fontFamily: 'inherit',
          boxShadow: '0 0 0 2px rgba(108,99,255,0.2)',
        }}
      />
    );
  }

  return (
    <Tooltip label="Click to rename" position="bottom">
      <button
        onClick={startEdit}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'transparent',
          border: hovered ? '1px solid var(--mine-border)' : '1px solid transparent',
          borderRadius: 5,
          padding: '2px 8px',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--mine-text)',
          cursor: 'text',
          outline: 'none',
          transition: 'all 0.15s ease',
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </button>
    </Tooltip>
  );
}

// ── Divider ───────────────────────────────────────────────────

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: 'var(--mine-border)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  );
}

// ── Main Topbar ───────────────────────────────────────────────

export function Topbar({
  sidebarCollapsed,
  onToggleSidebar,
  rightPanelCollapsed,
  onToggleRightPanel,
}: TopbarProps) {
  const { settings, updateSettings, undoStack, redoStack, undo, redo } = useEditorStore();

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const [menuHovered, setMenuHovered] = useState(false);
  const [rightBtnHovered, setRightBtnHovered] = useState(false);
  const [settingsHovered, setSettingsHovered] = useState(false);

  return (
    <header
      style={{
        height: 44,
        minHeight: 44,
        background: 'var(--mine-surface)',
        borderBottom: '1px solid var(--mine-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 4,
        userSelect: 'none',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* ── Left: Logo + sidebar toggle ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Sidebar toggle */}
        <Tooltip label={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'} shortcut="[">
          <button
            id="topbar-toggle-sidebar"
            onClick={onToggleSidebar}
            onMouseEnter={() => setMenuHovered(true)}
            onMouseLeave={() => setMenuHovered(false)}
            aria-label="Toggle sidebar"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: '1px solid transparent',
              background: menuHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: menuHovered ? 'var(--mine-text)' : 'var(--mine-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            <Menu size={15} />
          </button>
        </Tooltip>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'linear-gradient(135deg, var(--mine-accent) 0%, var(--mine-accent2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(108,99,255,0.45)',
            }}
          >
            <Cpu size={14} color="white" strokeWidth={2.5} />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '-0.4px',
              background: 'linear-gradient(135deg, var(--mine-accent), var(--mine-accent2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            MIneLAb
          </span>
        </div>
      </div>

      <Divider />

      {/* ── Center: undo/redo + project name ─────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        }}
      >
        <IconBtn
          icon={<Undo2 size={14} />}
          onClick={undo}
          disabled={!canUndo}
          tooltip="Undo"
          shortcut="Ctrl+Z"
        />
        <IconBtn
          icon={<Redo2 size={14} />}
          onClick={redo}
          disabled={!canRedo}
          tooltip="Redo"
          shortcut="Ctrl+Y"
        />

        <Divider />

        <ProjectNameEditor />
      </div>

      {/* ── Right: view modes + settings + panel toggle ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* View mode button group */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ViewModeBtn
            mode="solid"
            current={settings.viewMode}
            icon={<Box size={12} />}
            label="Solid"
            shortcut="1"
            position="first"
            onSelect={(m) => updateSettings({ viewMode: m })}
          />
          <ViewModeBtn
            mode="wireframe"
            current={settings.viewMode}
            icon={<Grid size={12} />}
            label="Wire"
            shortcut="2"
            position="mid"
            onSelect={(m) => updateSettings({ viewMode: m })}
          />
          <ViewModeBtn
            mode="xray"
            current={settings.viewMode}
            icon={<Eye size={12} />}
            label="X-Ray"
            shortcut="3"
            position="last"
            onSelect={(m) => updateSettings({ viewMode: m })}
          />
        </div>

        <Divider />

        {/* Settings button */}
        <Tooltip label="Settings" shortcut=",">
          <button
            id="topbar-settings"
            onMouseEnter={() => setSettingsHovered(true)}
            onMouseLeave={() => setSettingsHovered(false)}
            aria-label="Settings"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: '1px solid transparent',
              background: settingsHovered ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: settingsHovered ? 'var(--mine-text)' : 'var(--mine-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: `all 0.15s ease`,
              outline: 'none',
            }}
          >
            <Settings
              size={14}
              style={{
                transition: 'transform 0.4s ease',
                transform: settingsHovered ? 'rotate(60deg)' : 'rotate(0deg)',
              }}
            />
          </button>
        </Tooltip>

        {/* Right panel toggle */}
        <Tooltip label={rightPanelCollapsed ? 'Show Panel' : 'Hide Panel'} shortcut="]">
          <button
            id="topbar-toggle-right-panel"
            onClick={onToggleRightPanel}
            onMouseEnter={() => setRightBtnHovered(true)}
            onMouseLeave={() => setRightBtnHovered(false)}
            aria-label="Toggle right panel"
            aria-pressed={!rightPanelCollapsed}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: rightPanelCollapsed
                ? '1px solid transparent'
                : '1px solid rgba(108,99,255,0.35)',
              background: rightPanelCollapsed
                ? rightBtnHovered
                  ? 'rgba(255,255,255,0.07)'
                  : 'transparent'
                : 'rgba(108,99,255,0.15)',
              color: rightPanelCollapsed
                ? rightBtnHovered
                  ? 'var(--mine-text)'
                  : 'var(--mine-muted)'
                : 'var(--mine-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            <PanelRight size={15} />
          </button>
        </Tooltip>

        {/* Version badge */}
        <div
          style={{
            padding: '2px 7px',
            borderRadius: 4,
            background: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.2)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--mine-accent2)',
            letterSpacing: '0.3px',
            fontFamily: 'JetBrains Mono, monospace',
            flexShrink: 0,
          }}
        >
          v0.1
        </div>
      </div>
    </header>
  );
}
