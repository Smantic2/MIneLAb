// ============================================================
// Ollama Provider — MIneLAb
// Uses the Ollama local AI server (OpenAI-compatible API).
//
// Install Ollama: https://ollama.ai
// Pull a model:  ollama pull llama3.1
// Start server:  ollama serve
//
// Default base URL: http://localhost:11434
// ============================================================

import type { ChatMessage, ModelInfo, Palette } from '../../types/index';
import { toolCallsToDiff, type RawToolCall } from '../parser';
import { getToolsWithPalette } from '../tools';
import { AIProvider, type AIProviderResponse } from './AIProvider';

// ── Well-known models with tool use support ───────────────────
// These are defaults; Ollama will populate actual models from
// the local server via the /api/tags endpoint.

const OLLAMA_DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'llama3.1:latest',
    name: 'Llama 3.1 (latest)',
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 8B',
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
  {
    id: 'llama3.1:70b',
    name: 'Llama 3.1 70B',
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
  {
    id: 'mistral:latest',
    name: 'Mistral (latest)',
    contextWindow: 32_768,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
  {
    id: 'qwen2.5:latest',
    name: 'Qwen 2.5 (latest)',
    contextWindow: 131_072,
    maxOutputTokens: 8_192,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
  {
    id: 'deepseek-r1:latest',
    name: 'DeepSeek R1 (latest)',
    contextWindow: 65_536,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0,
    costPer1kOutput: 0,
  },
];

// ── OpenAI-compatible response types ─────────────────────────

interface OllamaToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

interface OllamaMessage {
  role: string;
  content: string | null;
  tool_calls?: OllamaToolCall[];
}

interface OllamaChoice {
  index: number;
  message: OllamaMessage;
  finish_reason: string;
}

interface OllamaUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OllamaResponse {
  id: string;
  choices: OllamaChoice[];
  usage?: OllamaUsage;
}

// ── Streaming delta ───────────────────────────────────────────

interface OllamaDelta {
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: 'function';
    function?: { name?: string; arguments?: string };
  }>;
}

interface OllamaStreamChunk {
  choices: Array<{
    index: number;
    delta: OllamaDelta;
    finish_reason: string | null;
  }>;
  usage?: OllamaUsage;
}

// ── Provider implementation ──────────────────────────────────

export class OllamaProvider extends AIProvider {
  readonly id = 'ollama';
  readonly name = 'Ollama (Local)';
  readonly icon = '🦙';
  readonly models = OLLAMA_DEFAULT_MODELS;
  readonly requiresApiKey = false;
  readonly requiresBaseUrl = true;

  private readonly DEFAULT_BASE_URL = 'http://localhost:11434';

  private chatEndpoint(): string {
    const base = this.resolvedBaseUrl(this.DEFAULT_BASE_URL);
    return `${base.replace(/\/$/, '')}/v1/chat/completions`;
  }

  // ── Message conversion ──────────────────────────────────────

  private convertMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  // ── Tool argument normaliser ──────────────────────────────────
  // Some Ollama versions return tool arguments as an object rather than a JSON string.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseToolArgs(args: string | Record<string, unknown>): Record<string, any> {
    if (typeof args === 'object') return args as Record<string, unknown>;
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }

  // ── Non-streaming ─────────────────────────────────────────────

  private async sendNonStreaming(
    messages: ChatMessage[],
    palette: Palette,
  ): Promise<AIProviderResponse> {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Ollama error ${res.status}: ${errText}\n\n` +
        `Make sure Ollama is running at ${this.resolvedBaseUrl(this.DEFAULT_BASE_URL)} ` +
        `and the model "${model}" is pulled.`,
      );
    }

    const data: OllamaResponse = await res.json();
    const choice = data.choices[0];
    const assistantMsg = choice?.message;

    const rawToolCalls: RawToolCall[] = [];
    if (assistantMsg?.tool_calls) {
      for (const tc of assistantMsg.tool_calls) {
        rawToolCalls.push({
          name: tc.function.name,
          arguments: this.parseToolArgs(tc.function.arguments),
        });
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
        estimatedCost: 0, // Local model — no cost
      },
    };
  }

  // ── Streaming ─────────────────────────────────────────────────

  private async sendStreaming(
    messages: ChatMessage[],
    palette: Palette,
    onChunk: (chunk: string) => void,
  ): Promise<AIProviderResponse> {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama error ${res.status}: ${errText}`);
    }

    if (!res.body) throw new Error('Ollama: Response body is null');

    let fullContent = '';
    const toolCallMap = new Map<number, { id: string; name: string; argumentsBuffer: string }>();
    let usageData: OllamaUsage | undefined;

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
          const chunk: OllamaStreamChunk = JSON.parse(trimmed.slice(6));
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
          // Ignore malformed SSE
        }
      }
    }

    const rawToolCalls: RawToolCall[] = [];
    for (const [, entry] of toolCallMap) {
      rawToolCalls.push({
        name: entry.name,
        arguments: this.parseToolArgs(entry.argumentsBuffer),
      });
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
