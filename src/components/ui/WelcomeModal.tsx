import React from 'react'
import { Wand2, Box, Download, ArrowRight, X } from 'lucide-react'

interface WelcomeModalProps {
  onClose: () => void
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative glass-panel rounded-2xl p-8 max-w-xl w-full animate-fade-in"
        style={{ border: '1px solid rgba(108,99,255,0.3)', boxShadow: '0 0 60px rgba(108,99,255,0.2)' }}
      >
        <button
          className="absolute top-4 right-4 btn btn-ghost p-1"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #00d4aa)' }}>
            <Box size={32} color="white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">MIneLAb</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--mine-muted)' }}>
            The AI-Powered Minecraft Structure Editor
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Wand2, title: 'AI Generation', desc: 'Describe in natural language', color: '#6c63ff' },
            { icon: Box, title: '3D Voxel Editor', desc: 'Orbit, inspect, and edit', color: '#00d4aa' },
            { icon: Download, title: 'Multi-Format Export', desc: 'Litematica, WorldEdit, NBT', color: '#ff6b35' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-xl p-3 text-center"
              style={{ background: 'var(--mine-surface)', border: '1px solid var(--mine-border)' }}
            >
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2"
                style={{ background: `${color}22` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--mine-text)' }}>{title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--mine-muted)' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Quick start */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: 'var(--mine-surface)', border: '1px solid var(--mine-border)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--mine-muted)' }}>QUICK START</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="badge badge-accent">1</span>
            <span style={{ color: 'var(--mine-text)' }}>Configure your AI provider in Settings</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1.5">
            <span className="badge badge-accent">2</span>
            <span style={{ color: 'var(--mine-text)' }}>Type a prompt in the Chat panel</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1.5">
            <span className="badge badge-success">3</span>
            <span style={{ color: 'var(--mine-text)' }}>Your structure renders in 3D instantly!</span>
          </div>
        </div>

        <button
          className="btn btn-primary w-full justify-center py-3 text-sm font-semibold"
          onClick={onClose}
        >
          Get Started <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
