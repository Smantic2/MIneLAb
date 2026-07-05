/**
 * Keyboard shortcut definitions and handler hooks
 */

import { useEffect } from 'react'
import { useEditorStore } from '../stores/editorStore'

export interface KeyBinding {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: string
}

export const KEY_BINDINGS: KeyBinding[] = [
  { key: 'z', ctrl: true, description: 'Undo', action: 'undo' },
  { key: 'z', ctrl: true, shift: true, description: 'Redo', action: 'redo' },
  { key: 'y', ctrl: true, description: 'Redo', action: 'redo' },
  { key: 'Delete', description: 'Remove selected block', action: 'remove' },
  { key: 'Backspace', description: 'Remove selected block', action: 'remove' },
  { key: '1', description: 'Select tool', action: 'tool_select' },
  { key: '2', description: 'Place tool', action: 'tool_place' },
  { key: '3', description: 'Remove tool', action: 'tool_remove' },
  { key: '4', description: 'Paint tool', action: 'tool_paint' },
  { key: 'g', description: 'Toggle grid', action: 'toggle_grid' },
  { key: 'f', description: 'Focus camera on selection', action: 'focus' },
  { key: 'F', description: 'Toggle fly mode', action: 'toggle_fly' },
  { key: 'Escape', description: 'Clear selection', action: 'clear_selection' },
  { key: 's', ctrl: true, description: 'Save project', action: 'save' },
  { key: 'e', ctrl: true, description: 'Export', action: 'export' },
]

/**
 * Hook to handle global keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const { undo, redo, settings, updateSettings, setSelection, selection, removeBlock, hoveredBlock } = useEditorStore()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey

      // Undo
      if (ctrl && !shift && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      // Redo
      if ((ctrl && shift && e.key === 'z') || (ctrl && e.key === 'y')) {
        e.preventDefault()
        redo()
        return
      }

      // Remove hovered block
      if (!ctrl && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (hoveredBlock) {
          e.preventDefault()
          removeBlock(hoveredBlock)
        }
        return
      }

      // Tool shortcuts
      if (!ctrl && !shift) {
        switch (e.key) {
          case '1':
            updateSettings({ activeTool: 'select' })
            break
          case '2':
            updateSettings({ activeTool: 'place' })
            break
          case '3':
            updateSettings({ activeTool: 'remove' })
            break
          case '4':
            updateSettings({ activeTool: 'paint' })
            break
          case 'g':
            updateSettings({ showGrid: !settings.showGrid })
            break
          case 'Escape':
            if (selection) setSelection(null)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, settings, updateSettings, setSelection, selection, removeBlock, hoveredBlock])
}

/**
 * Format a key binding for display
 */
export function formatKeyBinding(binding: KeyBinding): string {
  const parts: string[] = []
  if (binding.ctrl) parts.push('Ctrl')
  if (binding.shift) parts.push('Shift')
  if (binding.alt) parts.push('Alt')
  parts.push(binding.key === ' ' ? 'Space' : binding.key)
  return parts.join('+')
}
