// ============================================================
// aiStore.ts — MIneLAb
// Zustand store for AI provider configuration and chat history.
// Provider + API keys are persisted in localStorage.
// ============================================================

import { create } from 'zustand';
import { ChatMessage } from '../types/index';

// ── localStorage keys ─────────────────────────────────────────

const LS_PROVIDER = 'minelab_provider';
const LS_MODEL    = 'minelab_model';

const lsKeyForProvider = (provider: string): string =>
  `minelab_key_${provider}`;

const lsBaseUrl = (provider: string): string =>
  `minelab_baseurl_${provider}`;

// ── State shape ───────────────────────────────────────────────

interface AIState {
  // Provider config
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;

  // Chat
  messages: ChatMessage[];
  isGenerating: boolean;
  error: string | null;

  // ── Actions ──────────────────────────────────────────────

  /**
   * Switch AI provider.
   * Persists choice to localStorage and loads the saved key/baseUrl
   * for the new provider (if any).
   */
  setProvider: (id: string) => void;

  /** Change the active model. Persists to localStorage. */
  setModel: (model: string) => void;

  /**
   * Update the API key for the current provider.
   * Persists under `minelab_key_<provider>`.
   */
  setApiKey: (key: string) => void;

  /** Update the base URL override for the current provider. */
  setBaseUrl: (url: string) => void;

  /** Update the sampling temperature (0–2). */
  setTemperature: (temperature: number) => void;

  /** Update the maximum tokens for completions. */
  setMaxTokens: (maxTokens: number) => void;

  /** Append a message to the chat history. */
  addMessage: (msg: ChatMessage) => void;

  /**
   * Partially update an existing message by ID.
   * Useful for streaming chunks and finalising assistant messages.
   */
  updateMessage: (id: string, partial: Partial<ChatMessage>) => void;

  /** Wipe all chat messages. */
  clearMessages: () => void;

  /** Toggle the "AI is generating" spinner state. */
  setGenerating: (gen: boolean) => void;

  /** Set or clear the error string. */
  setError: (err: string | null) => void;

  /**
   * Reload provider, model, and API key from localStorage.
   * Called automatically during store initialisation.
   */
  loadFromStorage: () => void;
}

// ── Store ─────────────────────────────────────────────────────

export const useAIStore = create<AIState>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────

  provider: 'openai',
  model: 'gpt-4o',
  apiKey: '',
  baseUrl: '',
  temperature: 0.7,
  maxTokens: 8192,

  messages: [],
  isGenerating: false,
  error: null,

  // ── Provider / model / key ────────────────────────────────

  setProvider: (id) => {
    try {
      localStorage.setItem(LS_PROVIDER, id);
      // Load saved credentials for the new provider
      const savedKey     = localStorage.getItem(lsKeyForProvider(id))  ?? '';
      const savedBaseUrl = localStorage.getItem(lsBaseUrl(id))          ?? '';
      const savedModel   = localStorage.getItem(LS_MODEL)               ?? get().model;
      set({ provider: id, apiKey: savedKey, baseUrl: savedBaseUrl, model: savedModel });
    } catch {
      set({ provider: id });
    }
  },

  setModel: (model) => {
    try {
      localStorage.setItem(LS_MODEL, model);
    } catch {
      // localStorage may be unavailable in some environments
    }
    set({ model });
  },

  setApiKey: (key) => {
    const { provider } = get();
    try {
      localStorage.setItem(lsKeyForProvider(provider), key);
    } catch {
      // ignore storage errors
    }
    set({ apiKey: key });
  },

  setBaseUrl: (url) => {
    const { provider } = get();
    try {
      localStorage.setItem(lsBaseUrl(provider), url);
    } catch {
      // ignore
    }
    set({ baseUrl: url });
  },

  setTemperature: (temperature) => set({ temperature }),

  setMaxTokens: (maxTokens) => set({ maxTokens }),

  // ── Chat ──────────────────────────────────────────────────

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  updateMessage: (id, partial) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...partial } : m
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  // ── Status ────────────────────────────────────────────────

  setGenerating: (gen) => set({ isGenerating: gen }),

  setError: (err) => set({ error: err }),

  // ── Storage bootstrap ─────────────────────────────────────

  loadFromStorage: () => {
    try {
      const provider = localStorage.getItem(LS_PROVIDER) ?? 'openai';
      const model    = localStorage.getItem(LS_MODEL)    ?? 'gpt-4o';
      const apiKey   = localStorage.getItem(lsKeyForProvider(provider)) ?? '';
      const baseUrl  = localStorage.getItem(lsBaseUrl(provider))        ?? '';
      set({ provider, model, apiKey, baseUrl });
    } catch {
      // localStorage unavailable; keep defaults
    }
  },
}));

// ── Initialise from storage immediately on module load ────────
// This runs once when the module is first imported, so the UI
// always starts with persisted values rather than defaults.
useAIStore.getState().loadFromStorage();
