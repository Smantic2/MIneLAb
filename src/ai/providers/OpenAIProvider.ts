// ============================================================
// OpenAI Provider — MIneLAb
// Uses the OpenAI Chat Completions API with function/tool calling.
// ============================================================

import type { ChatMessage, ModelInfo, Palette } from '../../types/index';
import { toolCallsToDiff, type RawToolCall } from '../parser';
import { getToolsWithPalette } from '../tools';
import { AIProvider, type AIProviderResponse } from './AIProvider';

// ── Supported models ─────────────────────────────────────────

const OPENAI_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    supportsToolUse: true,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    supportsToolUse: true,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextWindow: 128_000,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    contextWindow: 16_385,
    maxOutputTokens: 4_096,
    supportsToolUse: true,
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
  },
];

// ── Types for the OpenAI API response ────────────────────────

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

interface OpenAIMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: OpenAIToolCall[];
}

interface OpenAIChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: string;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  id: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

// ── Streaming delta types ────────────────────────────────────

interface OpenAIDelta {
  role?: string;
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: 'function';
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
}

interface OpenAIStreamChunk {
  choices: Array<{
    index: number;
    delta: OpenAIDelta;
    finish_reason: string | null;
  }>;
  usage?: OpenAIUsage;
}

// ── Provider implementation ──────────────────────────────────

export class OpenAIProvider extends AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly icon = '🤖';
  readonly models = OPENAI_MODELS;
  readonly requiresApiKey = true;

  private readonly BASE_URL = 'https://api.openai.com/v1/chat/completions';

  // ── Message conversion ──────────────────────────────────────

  private convertMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  // ── Non-streaming send ──────────────────────────────────────

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

    const res = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${errText}`);
    }

    const data: OpenAIResponse = await res.json();
    const choice = data.choices[0];
    const assistantMsg = choice?.message;

    // Parse tool calls
    const rawToolCalls: RawToolCall[] = [];
    if (assistantMsg?.tool_calls) {
      for (const tc of assistantMsg.tool_calls) {
        try {
          rawToolCalls.push({
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          });
        } catch {
          console.warn('[OpenAIProvider] Failed to parse tool call arguments:', tc.function.arguments);
        }
      }
    }

    const content = assistantMsg?.content ?? '';
    const usage = data.usage;

    // Find the last user message's structure reference for toolCallsToDiff
    // We pass a minimal empty structure if none available
    const diff =
      rawToolCalls.length > 0
        ? toolCallsToDiff(rawToolCalls, this.getPlaceholderStructure(), content)
        : null;

    return {
      content,
      diff,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: this.estimateCost(model, usage.prompt_tokens, usage.completion_tokens),
      },
    };
  }

  // ── Streaming send ──────────────────────────────────────────

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
      stream_options: { include_usage: true },
    };

    const res = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${errText}`);
    }

    if (!res.body) throw new Error('OpenAI: Response body is null');

    // Accumulate content and tool call deltas
    let fullContent = '';
    // Map: toolCallIndex -> { id, name, argumentsBuffer }
    const toolCallMap = new Map<number, { id: string; name: string; argumentsBuffer: string }>();
    let usageData: OpenAIUsage | undefined;

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
          const chunk: OpenAIStreamChunk = JSON.parse(trimmed.slice(6));

          if (chunk.usage) {
            usageData = chunk.usage;
          }

          const choice = chunk.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta;

          // Accumulate text
          if (delta.content) {
            fullContent += delta.content;
            onChunk(delta.content);
          }

          // Accumulate tool call deltas
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
          // Ignore malformed SSE lines
        }
      }
    }

    // Build final tool calls
    const rawToolCalls: RawToolCall[] = [];
    for (const [, entry] of toolCallMap) {
      try {
        rawToolCalls.push({
          name: entry.name,
          arguments: JSON.parse(entry.argumentsBuffer),
        });
      } catch {
        console.warn('[OpenAIProvider] Failed to parse streamed tool arguments:', entry.argumentsBuffer);
      }
    }

    const promptTokens = usageData?.prompt_tokens ?? 0;
    const completionTokens = usageData?.completion_tokens ?? 0;

    const diff =
      rawToolCalls.length > 0
        ? toolCallsToDiff(rawToolCalls, this.getPlaceholderStructure(), fullContent)
        : null;

    return {
      content: fullContent,
      diff,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: usageData?.total_tokens ?? promptTokens + completionTokens,
        estimatedCost: this.estimateCost(model, promptTokens, completionTokens),
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

  private estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const modelInfo = this.models.find((m) => m.id === model);
    if (!modelInfo) return 0;
    return (
      (promptTokens / 1000) * modelInfo.costPer1kInput +
      (completionTokens / 1000) * modelInfo.costPer1kOutput
    );
  }

  /**
   * Returns a minimal placeholder StructureData for use when building Diffs
   * without access to the actual structure. The caller should pass real structure
   * data via the store after obtaining the Diff.
   */
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
