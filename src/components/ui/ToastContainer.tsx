import React from 'react'
import { useToastProvider } from '../../hooks/useToast'
import type { Toast } from '../../hooks/useToast'

function ToastItem({ toast }: { toast: Toast }) {
  const colors = {
    success: { bg: 'rgba(0, 212, 170, 0.1)', border: 'rgba(0, 212, 170, 0.3)', dot: '#00d4aa' },
    error: { bg: 'rgba(255, 59, 48, 0.1)', border: 'rgba(255, 59, 48, 0.3)', dot: '#ff3b30' },
    warning: { bg: 'rgba(255, 193, 7, 0.1)', border: 'rgba(255, 193, 7, 0.3)', dot: '#ffc107' },
    info: { bg: 'rgba(108, 99, 255, 0.1)', border: 'rgba(108, 99, 255, 0.3)', dot: '#6c63ff' },
  }
  const c = colors[toast.type]

  return (
    <div
      className="animate-fade-in flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(12px)',
        color: 'var(--mine-text)',
        minWidth: 240,
        maxWidth: 400,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="flex-shrink-0 w-2 h-2 rounded-full"
        style={{ background: c.dot }}
      />
      <span className="flex-1">{toast.message}</span>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastProvider()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-8 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      role="status"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
