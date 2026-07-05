import React, { useState } from 'react'
import { useAIStore } from '../../stores/aiStore'
import { useEditorStore } from '../../stores/editorStore'
import { getProvider } from '../../ai/index'
import { ChevronDown, TestTube, CheckCircle, XCircle } from 'lucide-react'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', requiresKey: true, requiresUrl: false },
  { id: 'anthropic', name: 'Anthropic Claude', requiresKey: true, requiresUrl: true, urlLabel: 'CORS Proxy URL' },
  { id: 'ollama', name: 'Ollama (Local)', requiresKey: false, requiresUrl: true, urlDefault: 'http://localhost:11434' },
  { id: 'generic', name: 'Custom API (OpenAI-compatible)', requiresKey: true, requiresUrl: true },
]

const MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }, { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }],
  anthropic: [{ id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' }, { id: 'claude-opus-4-5', name: 'Claude Opus 4.5' }, { id: 'claude-haiku-3-5', name: 'Claude Haiku 3.5' }],
  ollama: [{ id: 'llama3.2', name: 'Llama 3.2' }, { id: 'mistral', name: 'Mistral' }, { id: 'codellama', name: 'Code Llama' }, { id: 'qwen2.5', name: 'Qwen 2.5' }],
  generic: [],
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--mine-muted)' }}>
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: 'var(--mine-muted)' }}>{label}</label>
      {children}
    </div>
  )
}

export function SettingsPanel() {
  const { provider, model, apiKey, baseUrl, temperature, maxTokens, setProvider, setModel, setApiKey, setBaseUrl, setTemperature, setMaxTokens } = useAIStore()
  const { settings, updateSettings } = useEditorStore()
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [showKey, setShowKey] = useState(false)

  const currentProvider = PROVIDERS.find(p => p.id === provider)
  const availableModels = MODELS[provider] ?? []

  const handleTestConnection = async () => {
    setTestStatus('testing')
    try {
      const p = getProvider(provider)
      if (!p) throw new Error('Unknown provider')
      p.initialize({ apiKey, baseUrl, model })
      // Simple test: list models or send tiny request
      const url = provider === 'ollama' ? `${baseUrl || 'http://localhost:11434'}/api/tags` : ''
      if (url) {
        await fetch(url, { signal: AbortSignal.timeout(5000) })
      }
      setTestStatus('ok')
    } catch {
      setTestStatus('fail')
    }
    setTimeout(() => setTestStatus('idle'), 3000)
  }

  return (
    <div className="overflow-y-auto h-full p-4">
      <Section title="AI Provider">
        <Field label="Provider">
          <select
            className="input"
            value={provider}
            onChange={e => setProvider(e.target.value)}
          >
            {PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>

        {currentProvider?.requiresKey && (
          <Field label="API Key">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button className="btn btn-ghost px-2" onClick={() => setShowKey(v => !v)}>
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
          </Field>
        )}

        {currentProvider?.requiresUrl && (
          <Field label={currentProvider.urlLabel ?? 'Base URL'}>
            <input
              className="input"
              placeholder={currentProvider.urlDefault ?? 'https://...'}
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
            />
            {provider === 'anthropic' && (
              <p className="text-xs mt-1" style={{ color: 'var(--mine-muted)' }}>
                ⚠️ Anthropic requires a CORS proxy. Set your proxy URL above.
              </p>
            )}
          </Field>
        )}

        <Field label="Model">
          {availableModels.length > 0 ? (
            <select className="input" value={model} onChange={e => setModel(e.target.value)}>
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              placeholder="Model name (e.g. llama3)"
              value={model}
              onChange={e => setModel(e.target.value)}
            />
          )}
        </Field>

        <button
          className="btn btn-secondary w-full justify-center text-xs"
          onClick={handleTestConnection}
          disabled={testStatus === 'testing'}
        >
          {testStatus === 'testing' && <span className="spinner" />}
          {testStatus === 'ok' && <CheckCircle size={14} style={{ color: 'var(--mine-accent2)' }} />}
          {testStatus === 'fail' && <XCircle size={14} style={{ color: '#ff3b30' }} />}
          {testStatus === 'idle' && <TestTube size={14} />}
          {testStatus === 'idle' ? 'Test Connection' : testStatus === 'testing' ? 'Testing...' : testStatus === 'ok' ? 'Connected!' : 'Failed'}
        </button>
      </Section>

      <Section title="Generation">
        <Field label={`Temperature: ${temperature.toFixed(2)}`}>
          <input
            type="range" min="0" max="1" step="0.05"
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-purple-500"
          />
        </Field>
        <Field label="Max Tokens">
          <input
            type="number" className="input"
            value={maxTokens}
            onChange={e => setMaxTokens(parseInt(e.target.value))}
            min={512} max={128000} step={512}
          />
        </Field>
      </Section>

      <Section title="Editor">
        {[
          { key: 'showGrid', label: 'Show Grid' },
          { key: 'showAxes', label: 'Show Axes' },
          { key: 'showCoordinates', label: 'Show Coordinates' },
          { key: 'showChunkBoundaries', label: 'Show Chunk Boundaries' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--mine-text)' }}>{label}</span>
            <button
              className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
              style={{
                background: (settings as any)[key] ? 'var(--mine-accent)' : 'var(--mine-border)',
              }}
              onClick={() => updateSettings({ [key]: !(settings as any)[key] } as any)}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: (settings as any)[key] ? 22 : 2 }}
              />
            </button>
          </div>
        ))}
      </Section>

      <Section title="About">
        <div className="text-xs space-y-1" style={{ color: 'var(--mine-muted)' }}>
          <p>MIneLAb v0.1.0</p>
          <p>AI-Powered Minecraft Structure Editor</p>
          <p className="mt-2">Open source — MIT License</p>
        </div>
      </Section>
    </div>
  )
}
