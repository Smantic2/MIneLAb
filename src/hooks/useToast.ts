/**
 * useToast — lightweight toast notification system
 */

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

// Global toast state — singleton approach
let globalToasts: Toast[] = []
let setGlobalToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null

export function useToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])
  setGlobalToasts = setToasts
  globalToasts = toasts
  return toasts
}

export function toast(message: string, type: Toast['type'] = 'info', duration = 3000) {
  if (!setGlobalToasts) return

  const id = Math.random().toString(36).slice(2)
  const newToast: Toast = { id, type, message, duration }

  setGlobalToasts(prev => [...prev, newToast])

  if (duration > 0) {
    setTimeout(() => {
      setGlobalToasts?.(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  return id
}

export const showToast = {
  success: (msg: string) => toast(msg, 'success'),
  error: (msg: string) => toast(msg, 'error', 5000),
  info: (msg: string) => toast(msg, 'info'),
  warning: (msg: string) => toast(msg, 'warning'),
}

/**
 * Hook for components that need to show toasts
 */
export function useToast() {
  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    toast(message, type)
  }, [])

  return { show, toast: showToast }
}
