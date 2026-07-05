import React, { useState } from 'react'
import { useEditorStore } from '../../stores/editorStore'
import { useAIStore } from '../../stores/aiStore'
import { getProvider } from '../../ai/index'
import { PROMPT_TEMPLATES } from '../../ai/prompts'
import { Send, Square, Sparkles, ChevronDown, Bot, AlertCircle, Search } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'var(--mine-accent)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function TemplatesPicker({ onSelect }: { onSelect: (prompt: string) => void }) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? PROMPT_TEMPLATES.filter(t => t.label.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    : PROMPT_TEMPLATES

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 glass-panel rounded-xl p-3 animate-fade-in"
      style={{ zIndex: 50, maxHeight: 320, display: 'flex', flexDirection: 'column' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Search size={12} style={{ color: 'var(--mine-muted)' }} />
        <input
          className="input flex-1 text-xs"
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="overflow-y-auto flex-1 grid grid-cols-2 gap-1.5">
        {filtered.map(t => (
          <button
            key={t.id}
            className="text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ border: '1px solid var(--mine-border)' }}
            onClick={() => onSelect(t.prompt)}
          >
            <div className="text-xs font-semibold" style={{ color: 'var(--mine-text)' }}>{t.label}</div>
            <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--mine-muted)' }}>{t.category}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChatPanel() {
  const [input, setInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const { messages, isGenerating, error, provider, apiKey, baseUrl, model, addMessage, updateMessage, setGenerating, setError } = useAIStore()
  const { structure, applyDiff } = useEditorStore()

  const isConfigured = provider === 'ollama' || Boolean(apiKey)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isGenerating) return
    if (!isConfigured) {
      setError('Please configure your AI provider in Settings first.')
      return
    }

    setInput('')
    setError(null)

    // Add user message
    const userMsgId = Math.random().toString(36).slice(2)
    addMessage({ id: userMsgId, role: 'user', content: text, timestamp: new Date().toISOString() })

    // Add placeholder AI message
    const aiMsgId = Math.random().toString(36).slice(2)
    addMessage({ id: aiMsgId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isStreaming: true })

    setGenerating(true)
    try {
      const p = getProvider(provider)
      if (!p) throw new Error(`Unknown provider: ${provider}`)
      p.initialize({ apiKey, baseUrl, model })

      const palette: import('../../types/index').Palette = { blocks: structure?.palette.blocks ?? ['minecraft:stone_bricks', 'minecraft:oak_planks', 'minecraft:glass'] }
      const result = await p.sendMessage(
        messages.concat({ id: userMsgId, role: 'user', content: text, timestamp: new Date().toISOString() }),
        palette
      )

      updateMessage(aiMsgId, {
        content: result.content || '✅ Structure updated.',
        isStreaming: false,
        diff: result.diff ?? undefined,
        tokenUsage: result.usage,
        actions: result.diff ? [{
          type: 'modify',
          description: `Applied ${(result.diff.add?.length ?? 0) + (result.diff.replace?.length ?? 0)} block changes`,
          blockCount: (result.diff.add?.length ?? 0) + (result.diff.replace?.length ?? 0),
        }] : undefined,
      })

      if (result.diff) {
        applyDiff(result.diff)
      }
    } catch (err: any) {
      updateMessage(aiMsgId, {
        content: '',
        isStreaming: false,
        error: err?.message ?? 'An error occurred.',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Provider status bar */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--mine-border)', background: 'var(--mine-darker)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: isConfigured ? 'var(--mine-accent2)' : '#ff3b30' }}
          />
          <span className="text-xs" style={{ color: 'var(--mine-muted)' }}>
            {provider.toUpperCase()} · {model || 'No model'}
          </span>
        </div>
        <Bot size={14} style={{ color: 'var(--mine-muted)' }} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg flex items-start gap-2 badge-error text-xs">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles size={24} className="mx-auto mb-2" style={{ color: 'var(--mine-accent)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--mine-text)' }}>
              Start building with AI
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--mine-muted)' }}>
              Describe a structure or use a template
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
              style={
                msg.role === 'user'
                  ? { background: 'var(--mine-accent)', color: 'white' }
                  : { background: 'var(--mine-surface2)', color: 'var(--mine-text)', border: '1px solid var(--mine-border)' }
              }
            >
              {msg.isStreaming ? (
                <TypingIndicator />
              ) : msg.error ? (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={12} />
                  <span>{msg.error}</span>
                </div>
              ) : (
                <>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  {msg.actions?.map((a, i) => (
                    <div key={i} className="mt-1.5 px-2 py-1 rounded text-xs" style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--mine-accent2)' }}>
                      ⚡ {a.description}
                    </div>
                  ))}
                  {msg.tokenUsage && (
                    <div className="mt-1 text-xs opacity-50">
                      {msg.tokenUsage.totalTokens} tokens · ~${msg.tokenUsage.estimatedCost.toFixed(4)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid var(--mine-border)' }}>
        <div className="relative">
          {showTemplates && (
            <TemplatesPicker
              onSelect={p => {
                setInput(p)
                setShowTemplates(false)
              }}
            />
          )}
          <div className="flex gap-2 items-end">
            <button
              className="btn btn-ghost p-2 flex-shrink-0"
              onClick={() => setShowTemplates(v => !v)}
              title="Browse templates"
            >
              <Sparkles size={16} />
              <ChevronDown size={10} />
            </button>
            <textarea
              className="input flex-1 resize-none text-sm"
              style={{ minHeight: 40, maxHeight: 120 }}
              placeholder={isConfigured ? 'Describe what to build...' : 'Configure AI provider in Settings first'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
            />
            {isGenerating ? (
              <button className="btn btn-secondary p-2 flex-shrink-0" onClick={() => setGenerating(false)}>
                <Square size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary p-2 flex-shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || !isConfigured}
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
