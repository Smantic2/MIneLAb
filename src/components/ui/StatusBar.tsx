// ============================================================
// StatusBar.tsx — MIneLAb
// 24px bottom status bar: hovered block coords, structure info,
// FPS counter, memory usage, connection status.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { Cpu, Wifi, WifiOff } from 'lucide-react';

// ── FPS counter hook ──────────────────────────────────────────

function useFps() {
  const [fps, setFps] = useState(60);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    let animId: number;
    const tick = () => {
      frames.current++;
      const now = performance.now();
      if (now - last.current >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return fps;
}

// ── Memory usage hook ─────────────────────────────────────────

function useMemory() {
  const [mem, setMem] = useState<string | null>(null);
  useEffect(() => {
    const update = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const perf = performance as any;
      if (perf.memory) {
        const usedMB = (perf.memory.usedJSHeapSize / 1024 / 1024).toFixed(0);
        setMem(`${usedMB} MB`);
      }
    };
    update();
    const id = setInterval(update, 2000);
    return () => clearInterval(id);
  }, []);
  return mem;
}

// ── Helpers ───────────────────────────────────────────────────

function Sep() {
  return (
    <span
      style={{
        width: 1,
        height: 12,
        background: 'var(--mine-border)',
        flexShrink: 0,
        alignSelf: 'center',
      }}
    />
  );
}

function StatPill({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 6px',
        height: 16,
        borderRadius: 4,
        background: accent ? 'rgba(108,99,255,0.12)' : 'transparent',
        color: accent ? '#a09fff' : 'var(--mine-muted)',
        fontSize: 10.5,
        fontWeight: 500,
        fontFamily: 'JetBrains Mono, monospace',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function fpsColor(fps: number): string {
  if (fps >= 55) return '#00d4aa';
  if (fps >= 30) return '#ffc107';
  return '#ff3b30';
}

// ── Main StatusBar ────────────────────────────────────────────

export function StatusBar() {
  const { hoveredBlock, structure } = useEditorStore();
  const fps = useFps();
  const mem = useMemory();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const dims = structure?.dimensions;
  const paletteCount = structure?.palette.blocks.length ?? 0;

  return (
    <footer
      aria-label="Status bar"
      style={{
        height: 24,
        minHeight: 24,
        background: 'var(--mine-surface)',
        borderTop: '1px solid var(--mine-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 6,
        flexShrink: 0,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── Left: block info ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        {hoveredBlock ? (
          <>
            <StatPill accent>
              X:{hoveredBlock.x}&nbsp;Y:{hoveredBlock.y}&nbsp;Z:{hoveredBlock.z}
            </StatPill>
            <Sep />
          </>
        ) : (
          <span
            style={{
              fontSize: 10.5,
              color: 'var(--mine-muted)',
              fontFamily: 'JetBrains Mono, monospace',
              opacity: 0.7,
            }}
          >
            Hover a block to inspect
          </span>
        )}
        {structure && (
          <span
            style={{
              fontSize: 10.5,
              color: 'var(--mine-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 160,
            }}
          >
            {structure.name}
          </span>
        )}
      </div>

      {/* ── Center: structure dimensions + block types ─ */}
      {dims && (
        <>
          <Sep />
          <StatPill>
            {dims.x}×{dims.y}×{dims.z}
          </StatPill>
          <Sep />
          <StatPill>{paletteCount} block types</StatPill>
        </>
      )}

      {/* ── Right: perf + connection ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
        {/* FPS */}
        <span
          style={{
            fontSize: 10.5,
            fontFamily: 'JetBrains Mono, monospace',
            color: fpsColor(fps),
            fontWeight: 600,
          }}
        >
          {fps} FPS
        </span>

        {/* Memory (Chrome only) */}
        {mem && (
          <>
            <Sep />
            <Cpu size={10} color="var(--mine-muted)" />
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--mine-muted)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {mem}
            </span>
          </>
        )}

        {/* Connection status */}
        <Sep />
        {online ? (
          <Wifi size={11} color="var(--mine-accent2)" />
        ) : (
          <WifiOff size={11} color="#ff3b30" />
        )}
        <span
          style={{
            fontSize: 10.5,
            color: online ? 'var(--mine-accent2)' : '#ff3b30',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {online ? 'Online' : 'Offline'}
        </span>

        {/* App version */}
        <Sep />
        <span
          style={{
            fontSize: 10,
            color: 'var(--mine-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            opacity: 0.5,
          }}
        >
          MIneLAb v0.1.0
        </span>
      </div>
    </footer>
  );
}
