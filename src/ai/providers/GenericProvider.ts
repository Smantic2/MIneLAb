// ============================================================
// GenericProvider — MIneLAb
// A generic OpenAI-compatible provider for any service that
// exposes the /v1/chat/completions endpoint, such as:
//
//   - LM Studio (http://localhost:1234)
//   - Jan (http://localhost:1337)
//   - OpenRouter (https://openrouter.ai/api)
//   - Together AI (https://api.together.xyz)
//   - Groq (https://api.groq.com/openai)
//   - Perplexity (https://api.perplexity.ai)
//   - Any locally hosted vLLM or TGI server
// ============================================================

import type { ChatMessage, ModelInfo, Palette } from '../../types/index';
import { toolCallsToDiff, type RawToolCall } from '../parser';
import { getToolsWithPalette } from '../tools';
import { AIProvider, type AIProviderResponse } from './AIProvider';

// ── Default models ────────────────────────────────────────────
// These are placeholders; users can type any model ID.

const GENERIC_DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o (via proxy)',
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B (Groq)',
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    supportsToolUse: true,
    costPer1kInput: 0.00059,
    costPer1kOutput: 0.00079,
  },
  {
    id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    name: 'Mixtral 8x7B (Together AI)',
    contextWindow: 32_768,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0.0006,
    costPer1kOutput: 0.0006,
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B (OpenRouter Free)',
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
];

// ── Reuse the same response types as OpenAI ───────────────────

interface GenericToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface GenericMessage {
  role: string;
  content: string | null;
  tool_calls?: GenericToolCall[];
}

interface GenericChoice {
  index: number;
  message: GenericMessage;
  finish_reason: string;
}

interface GenericUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GenericResponse {
  choices: GenericChoice[];
  usage?: GenericUsage;
}

interface GenericStreamChunk {
  choices: Array<{
    index: number;
    delta: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason: string | null;
  }>;
  usage?: GenericUsage;
}

// ── Provider implementation ──────────────────────────────────

export class GenericProvider extends AIProvider {
  readonly id = 'generic';
  readonly name = 'OpenAI-Compatible';
  readonly icon = '⚡';
  readonly models = GENERIC_DEFAULT_MODELS;
  readonly requiresApiKey = true;
  readonly requiresBaseUrl = true;

  private chatEndpoint(): string {
    const base = this.config.baseUrl?.trim();
    if (!base) {
      throw new Error(
        'Generic provider requires a Base URL pointing to an OpenAI-compatible API endpoint. ' +
        'Example: https://openrouter.ai/api/v1 or http://localhost:1234/v1',
      );
    }
    const normalised = base.replace(/\/$/, '');
    // If user already included /chat/completions, use as-is
    if (normalised.endsWith('/chat/completions')) return normalised;
    return `${normalised}/chat/completions`;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.apiKey?.trim()) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    // OpenRouter requires these headers
    headers['HTTP-Referer'] = 'https://minelab.ai';
    headers['X-Title'] = 'MIneLAb';
    return headers;
  }

  private convertMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  // ── Non-streaming ─────────────────────────────────────────────

  private async sendNonStreaming(
    messages: ChatMessage[],
    palette: Palette,
  ): Promise<AIProviderResponse> {
    this.assertApiKey();
    const tools = getToolsWithPalette(palette);
    const model = this.resolvedModel();

    const body = {
      model,
      messages: this.convertMessages(messages),
      tools,
      tool_choice: 'auto',
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 4096,
    };

    const res = await fetch(this.chatEndpoint(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${this.name} API error ${res.status}: ${errText}`);
    }

    const data: GenericResponse = await res.json();
    const choice = data.choices[0];
    const assistantMsg = choice?.message;

    const rawToolCalls: RawToolCall[] = [];
    if (assistantMsg?.tool_calls) {
      for (const tc of assistantMsg.tool_calls) {
        try {
          rawToolCalls.push({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          });
        } catch {
          console.warn('[GenericProvider] Failed to parse tool arguments:', tc.function.arguments);
        }
      }
    }

    const content = assistantMsg?.content ?? '';
    const usage = data.usage;
    const diff =
      rawToolCalls.length > 0
        ? toolCallsToDiff(rawToolCalls, this.getPlaceholderStructure(), content)
        : null;

    return {
      content,
      diff,
      usage: {
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        estimatedCost: 0,
      },
    };
  }

  // ── Streaming ─────────────────────────────────────────────────

  private async sendStreaming(
    messages: ChatMessage[],
    palette: Palette,
    onChunk: (chunk: string) => void,
  ): Promise<AIProviderResponse> {
    this.assertApiKey();
    const tools = getToolsWithPalette(palette);
    const model = this.resolvedModel();

    const body = {
      model,
      messages: this.convertMessages(messages),
      tools,
      tool_choice: 'auto',
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 4096,
      stream: true,
    };

    const res = await fetch(this.chatEndpoint(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${this.name} API error ${res.status}: ${errText}`);
    }

    if (!res.body) throw new Error(`${this.name}: Response body is null`);

    let fullContent = '';
    const toolCallMap = new Map<number, { id: string; name: string; argumentsBuffer: string }>();
    let usageData: GenericUsage | undefined;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const chunk: GenericStreamChunk = JSON.parse(trimmed.slice(6));
          if (chunk.usage) usageData = chunk.usage;

          const choice = chunk.choices?.[0];
          if (!choice) continue;
          const delta = choice.delta;

          if (delta.content) {
            fullContent += delta.content;
            onChunk(delta.content);
          }

          if (delta.tool_calls) {
            for (const tcDelta of delta.tool_calls) {
              const idx = tcDelta.index;
              if (!toolCallMap.has(idx)) {
                toolCallMap.set(idx, { id: '', name: '', argumentsBuffer: '' });
              }
              const entry = toolCallMap.get(idx)!;
              if (tcDelta.id) entry.id = tcDelta.id;
              if (tcDelta.function?.name) entry.name += tcDelta.function.name;
              if (tcDelta.function?.arguments) entry.argumentsBuffer += tcDelta.function.arguments;
            }
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }

    const rawToolCalls: RawToolCall[] = [];
    for (const [, entry] of toolCallMap) {
      try {
        rawToolCalls.push({
          name: entry.name,
          arguments: JSON.parse(entry.argumentsBuffer),
        });
      } catch {
        console.warn('[GenericProvider] Failed to parse streamed tool arguments:', entry.argumentsBuffer);
      }
    }

    const diff =
      rawToolCalls.length > 0
        ? toolCallsToDiff(rawToolCalls, this.getPlaceholderStructure(), fullContent)
        : null;

    return {
      content: fullContent,
      diff,
      usage: {
        promptTokens: usageData?.prompt_tokens ?? 0,
        completionTokens: usageData?.completion_tokens ?? 0,
        totalTokens: usageData?.total_tokens ?? 0,
        estimatedCost: 0,
      },
    };
  }

  // ── Public sendMessage ──────────────────────────────────────

  async sendMessage(
    messages: ChatMessage[],
    palette: Palette,
    onChunk?: (chunk: string) => void,
  ): Promise<AIProviderResponse> {
    if (onChunk) return this.sendStreaming(messages, palette, onChunk);
    return this.sendNonStreaming(messages, palette);
  }

  // ── Helpers ─────────────────────────────────────────────────

  private getPlaceholderStructure() {
    return {
      id: 'placeholder',
      name: 'Placeholder',
      dimensions: { x: 256, y: 256, z: 256 },
      palette: { blocks: ['minecraft:air'] },
      chunks: new Map(),
      metadata: {
        author: 'AI',
        description: '',
        tags: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        version: '1.0.0',
        minecraftVersion: '1.21',
      },
    };
  }
}
