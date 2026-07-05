// ============================================================
// Anthropic Provider — MIneLAb
//
// NOTE: Anthropic's API does NOT include CORS headers, so this
// provider CANNOT call api.anthropic.com directly from a browser.
// You MUST configure a CORS proxy in Settings → Base URL.
//
// Example proxies:
//   - A Cloudflare Worker that forwards requests and adds CORS headers
//   - A local proxy server: https://github.com/Exafunction/anthropic-proxy
//   - A self-hosted backend endpoint that relays the request
//
// The Base URL should point to an endpoint that accepts the same
// request body as the Anthropic Messages API and forwards it.
// ============================================================

import type { ChatMessage, ModelInfo, Palette } from '../../types/index';
import { toolCallsToDiff, type RawToolCall } from '../parser';
import { ANTHROPIC_TOOLS } from '../tools';
import { AIProvider, type AIProviderResponse } from './AIProvider';

// ── Supported models ─────────────────────────────────────────

const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-4-5',
    name: 'Claude Opus 4.5',
    contextWindow: 200_000,
    maxOutputTokens: 32_000,
    supportsToolUse: true,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    contextWindow: 200_000,
    maxOutputTokens: 16_000,
    supportsToolUse: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  {
    id: 'claude-haiku-3-5',
    name: 'Claude Haiku 3.5',
    contextWindow: 200_000,
    maxOutputTokens: 8_096,
    supportsToolUse: true,
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextWindow: 200_000,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextWindow: 200_000,
    maxOutputTokens: 8_096,
    supportsToolUse: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
];

// ── Anthropic API types ───────────────────────────────────────

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
}

type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock;

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContentBlock[];
  stop_reason: string;
  usage: AnthropicUsage;
}

// ── Streaming event types ────────────────────────────────────

interface AnthropicStreamEvent {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// ── Provider implementation ──────────────────────────────────

export class AnthropicProvider extends AIProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic (Claude)';
  readonly icon = '🔮';
  readonly models = ANTHROPIC_MODELS;
  readonly requiresApiKey = true;
  readonly requiresBaseUrl = true; // CORS proxy required

  private readonly ANTHROPIC_VERSION = '2023-06-01';

  private getEndpoint(): string {
    const base = this.config.baseUrl?.trim();
    if (!base) {
      throw new Error(
        'Anthropic requires a CORS proxy URL. Please configure Base URL in Settings.\n' +
        'See the provider info for proxy setup instructions.',
      );
    }
    return base.endsWith('/') ? `${base}messages` : `${base}/messages`;
  }

  // ── Message conversion ──────────────────────────────────────

  private convertMessages(messages: ChatMessage[]): {
    system: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const system = systemMessages.map((m) => m.content).join('\n\n');
    const converted = conversationMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    return { system, messages: converted };
  }

  // ── Non-streaming send ──────────────────────────────────────

  private async sendNonStreaming(
    messages: ChatMessage[],
    _palette: Palette,
  ): Promise<AIProviderResponse> {
    this.assertApiKey();
    const endpoint = this.getEndpoint();
    const { system, messages: converted } = this.convertMessages(messages);
    const model = this.resolvedModel();

    const body = {
      model,
      max_tokens: this.config.maxTokens ?? 4096,
      temperature: this.config.temperature ?? 0.7,
      system,
      messages: converted,
      tools: ANTHROPIC_TOOLS,
      tool_choice: { type: 'auto' },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey ?? '',
        'anthropic-version': this.ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errText}`);
    }

    const data: AnthropicResponse = await res.json();

    // Extract text and tool calls from content blocks
    let fullContent = '';
    const rawToolCalls: RawToolCall[] = [];

    for (const block of data.content) {
      if (block.type === 'text') {
        fullContent += block.text;
      } else if (block.type === 'tool_use') {
        rawToolCalls.push({ name: block.name, arguments: block.input });
      }
    }

    const usage = data.usage;
    const diff =
      rawToolCalls.length > 0
        ? toolCallsToDiff(rawToolCalls, this.getPlaceholderStructure(), fullContent)
        : null;

    return {
      content: fullContent,
      diff,
      usage: {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
        estimatedCost: this.estimateCost(model, usage.input_tokens, usage.output_tokens),
      },
    };
  }

  // ── Streaming send ──────────────────────────────────────────

  private async sendStreaming(
    messages: ChatMessage[],
    _palette: Palette,
    onChunk: (chunk: string) => void,
  ): Promise<AIProviderResponse> {
    this.assertApiKey();
    const endpoint = this.getEndpoint();
    const { system, messages: converted } = this.convertMessages(messages);
    const model = this.resolvedModel();

    const body = {
      model,
      max_tokens: this.config.maxTokens ?? 4096,
      temperature: this.config.temperature ?? 0.7,
      system,
      messages: converted,
      tools: ANTHROPIC_TOOLS,
      tool_choice: { type: 'auto' },
      stream: true,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey ?? '',
        'anthropic-version': this.ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errText}`);
    }

    if (!res.body) throw new Error('Anthropic: Response body is null');

    let fullContent = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCallMap = new Map<number, { id: string; name: string; input: Record<string, any> }>();
    let inputTokens = 0;
    let outputTokens = 0;

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
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const event: AnthropicStreamEvent = JSON.parse(payload);

          switch (event.type) {
            case 'content_block_start':
              if (event.content_block?.type === 'tool_use') {
                toolCallMap.set(event.index, {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: {},
                });
              }
              break;

            case 'content_block_delta':
              if (event.delta?.type === 'text_delta') {
                const text = event.delta.text ?? '';
                fullContent += text;
                onChunk(text);
              } else if (event.delta?.type === 'input_json_delta') {
                // Anthropic streams tool input as a JSON string
                const entry = toolCallMap.get(event.index);
                if (entry) {
                  // We'll parse the full JSON after 'content_block_stop'
                  (entry as unknown as { _rawInput: string })['_rawInput'] =
                    ((entry as unknown as { _rawInput: string })['_rawInput'] ?? '') +
                    (event.delta.partial_json ?? '');
                }
              }
              break;

            case 'content_block_stop': {
              const entry = toolCallMap.get(event.index);
              if (entry) {
                const raw = (entry as unknown as { _rawInput?: string })['_rawInput'];
                if (raw) {
                  try {
                    entry.input = JSON.parse(raw);
                  } catch {
                    console.warn('[AnthropicProvider] Failed to parse tool input JSON:', raw);
                  }
                }
              }
              break;
            }

            case 'message_delta':
              if (event.usage) {
                outputTokens = event.usage.output_tokens ?? outputTokens;
              }
              break;

            case 'message_start':
              if (event.message?.usage) {
                inputTokens = event.message.usage.input_tokens ?? 0;
              }
              break;
          }
        } catch {
          // Ignore malformed lines
        }
      }
    }

    const rawToolCalls: RawToolCall[] = [];
    for (const [, entry] of toolCallMap) {
      rawToolCalls.push({ name: entry.name, arguments: entry.input });
    }

    const diff =
      rawToolCalls.length > 0
        ? toolCallsToDiff(rawToolCalls, this.getPlaceholderStructure(), fullContent)
        : null;

    return {
      content: fullContent,
      diff,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost: this.estimateCost(model, inputTokens, outputTokens),
      },
    };
  }

  // ── Public sendMessage ──────────────────────────────────────

  async sendMessage(
    messages: ChatMessage[],
    palette: Palette,
    onChunk?: (chunk: string) => void,
  ): Promise<AIProviderResponse> {
    if (onChunk) {
      return this.sendStreaming(messages, palette, onChunk);
    }
    return this.sendNonStreaming(messages, palette);
  }

  // ── Helpers ─────────────────────────────────────────────────

  private estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const modelInfo = this.models.find((m) => m.id === model);
    if (!modelInfo) return 0;
    return (
      (inputTokens / 1000) * modelInfo.costPer1kInput +
      (outputTokens / 1000) * modelInfo.costPer1kOutput
    );
  }

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
