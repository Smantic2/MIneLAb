// ============================================================
// AIProvider — MIneLAb Abstract Base Class
// All AI providers extend this class.
// ============================================================

import type {
  ChatMessage,
  Diff,
  ModelInfo,
  Palette,
  ProviderConfig,
  TokenUsage,
} from '../../types/index';

// ── Response type ────────────────────────────────────────────

export interface AIProviderResponse {
  /** The final text content from the assistant (may be empty if only tool calls were made). */
  content: string;
  /** Structured diff derived from tool calls, or null if no structural changes were requested. */
  diff: Diff | null;
  /** Token usage statistics for billing and tracking. */
  usage: TokenUsage;
}

// ── Abstract provider ────────────────────────────────────────

export abstract class AIProvider {
  // ── Identity ───────────────────────────────────────────────

  /** Unique provider identifier, e.g. "openai", "anthropic", "ollama" */
  abstract readonly id: string;

  /** Human-readable provider name shown in the UI */
  abstract readonly name: string;

  /** Emoji or short icon string for the UI */
  abstract readonly icon: string;

  /** List of supported models for this provider */
  abstract readonly models: ModelInfo[];

  /** Whether this provider requires an API key from the user */
  abstract readonly requiresApiKey: boolean;

  /** Whether this provider requires a configurable base URL (e.g. local/proxy) */
  readonly requiresBaseUrl: boolean = false;

  // ── Config ─────────────────────────────────────────────────

  protected config: ProviderConfig = {};

  /**
   * Initialise the provider with the given configuration.
   * Call this before sendMessage.
   */
  initialize(config: ProviderConfig): void {
    this.config = { ...config };
  }

  // ── Validation helpers ──────────────────────────────────────

  /** Returns the resolved base URL, falling back to the provider default. */
  protected resolvedBaseUrl(defaultUrl: string): string {
    return this.config.baseUrl?.trim() || defaultUrl;
  }

  /** Throws if an API key is required but not provided. */
  protected assertApiKey(): void {
    if (this.requiresApiKey && !this.config.apiKey?.trim()) {
      throw new Error(`${this.name} requires an API key. Please add one in Settings.`);
    }
  }

  /** Returns the configured model or falls back to the first available model. */
  protected resolvedModel(): string {
    return this.config.model ?? this.models[0]?.id ?? '';
  }

  // ── Abstract interface ──────────────────────────────────────

  /**
   * Send a conversation to the AI provider and return a structured response.
   *
   * @param messages - The full conversation history (system + user + assistant turns)
   * @param palette  - The current block palette, used to inject tool enums
   * @param onChunk  - Optional streaming callback; called with each text chunk as it arrives
   */
  abstract sendMessage(
    messages: ChatMessage[],
    palette: Palette,
    onChunk?: (chunk: string) => void,
  ): Promise<AIProviderResponse>;
}
