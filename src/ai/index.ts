// ============================================================
// AI Provider Registry — MIneLAb
// Central index for all AI providers.
// ============================================================

export { AIProvider } from './providers/AIProvider';
export type { AIProviderResponse } from './providers/AIProvider';

export { OpenAIProvider } from './providers/OpenAIProvider';
export { AnthropicProvider } from './providers/AnthropicProvider';
export { OllamaProvider } from './providers/OllamaProvider';
export { GenericProvider } from './providers/GenericProvider';

export { STRUCTURE_TOOLS, ANTHROPIC_TOOLS, getToolsWithPalette } from './tools';
export type { OpenAITool, AnthropicTool } from './tools';

export {
  buildSystemPrompt,
  buildGenerationPrompt,
  buildDiffPrompt,
  buildAnalysisPrompt,
  PROMPT_TEMPLATES,
} from './prompts';
export type { PromptTemplate } from './prompts';

export { parseToolCalls, toolCallsToDiff } from './parser';
export type { RawToolCall } from './parser';

import type { AIProvider } from './providers/AIProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { GenericProvider } from './providers/GenericProvider';

// ── Provider registry ─────────────────────────────────────────

/**
 * All registered AI providers, keyed by their `id` property.
 * New providers can be added here to make them available throughout the app.
 */
export const PROVIDERS: Record<string, AIProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  ollama: new OllamaProvider(),
  generic: new GenericProvider(),
};

/**
 * Returns the list of all available providers as an ordered array.
 * Order determines how they appear in the Settings UI.
 */
export function getProviderList(): AIProvider[] {
  return [
    PROVIDERS.openai,
    PROVIDERS.anthropic,
    PROVIDERS.ollama,
    PROVIDERS.generic,
  ];
}

/**
 * Returns a specific provider by its ID, or `undefined` if not found.
 *
 * @example
 * const provider = getProvider('openai');
 * provider?.initialize({ apiKey: 'sk-...' });
 */
export function getProvider(id: string): AIProvider | undefined {
  return PROVIDERS[id];
}
