# AI Provider Interface — API Design

---

## 1. Provider Interface

All AI providers implement the same TypeScript interface. This allows swapping providers without changing any application logic.

```typescript
interface AIProvider {
  id: string;
  name: string;
  icon: string; // URL or icon component
  description: string;
  models: ModelInfo[];
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  supportsStreaming: boolean;
  supportsToolUse: boolean;

  // Core methods
  initialize(config: ProviderConfig): Promise<void>;
  generateStructure(params: GenerateParams): Promise<StructureResponse>;
  generateDiff(params: DiffParams): Promise<DiffResponse>;
  analyzeStructure(params: AnalysisParams): Promise<AnalysisReport>;

  // Streaming
  streamGenerate?(params: GenerateParams): AsyncGenerator<StreamChunk>;
}

interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsToolUse: boolean;
  costPer1kInput: number;  // USD
  costPer1kOutput: number; // USD
}

interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
```

---

## 2. Request/Response Types

### GenerateParams

```typescript
interface GenerateParams {
  prompt: string;
  blockPalette: BlockPalette;
  maxDimensions?: { x: number; y: number; z: number };
  style?: string;
  constraints?: string[];
}
```

### StructureResponse

```typescript
interface StructureResponse {
  blocks: BlockPlacement[];
  palette: string[];
  dimensions: { x: number; y: number; z: number };
  description: string;
  metadata?: Record<string, any>;
}

interface BlockPlacement {
  id: string;      // Block ID (e.g., "minecraft:stone_bricks")
  x: number;
  y: number;
  z: number;
  states?: Record<string, string>; // Block states (facing, axis, etc.)
}
```

### DiffParams

```typescript
interface DiffParams {
  instruction: string;
  currentStructure: StructureSummary;
  region?: SelectionBounds;
  blockPalette: BlockPalette;
}
```

### DiffResponse

```typescript
interface DiffResponse {
  add: BlockPlacement[];
  remove: Vec3[];
  replace: Array<{
    from: Vec3;
    to: BlockPlacement;
  }>;
  description: string;
}
```

### AnalysisParams

```typescript
interface AnalysisParams {
  structure: StructureSummary;
  checks?: AnalysisCheckType[];
}
```

### AnalysisReport

```typescript
interface AnalysisReport {
  issues: AnalysisIssue[];
  stats: StructureStats;
  suggestions: string[];
}

interface AnalysisIssue {
  type: 'floating' | 'unsupported' | 'mob_spawn' | 'water_flow' | 'disconnected' | 'dark_area';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: Vec3;
  region?: SelectionBounds;
}

interface StructureStats {
  totalBlocks: number;
  uniqueBlockTypes: number;
  dimensions: { x: number; y: number; z: number };
  boundingVolume: number;
  surfaceArea: number;
}
```

---

## 3. Provider Implementations

### OpenAI

```typescript
class OpenAIProvider implements AIProvider {
  id = 'openai';
  name = 'OpenAI';
  models = [
    { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, ... },
    { id: 'gpt-4.1', name: 'GPT-4.1', contextWindow: 1000000, ... },
  ];

  async generateStructure(params: GenerateParams): Promise<StructureResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        messages: this.buildMessages(params),
        tools: this.getToolDefinitions(),
        tool_choice: 'required',
        temperature: this.config.temperature ?? 0.7,
      }),
    });
    return this.parseResponse(response);
  }
}
```

### Anthropic

```typescript
class AnthropicProvider implements AIProvider {
  id = 'anthropic';
  name = 'Anthropic';
  models = [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', ... },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', ... },
  ];

  async generateStructure(params: GenerateParams): Promise<StructureResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-sonnet-4-20250514',
        max_tokens: this.config.maxTokens || 8192,
        system: this.buildSystemPrompt(params),
        messages: [{ role: 'user', content: params.prompt }],
        tools: this.getToolDefinitions(),
      }),
    });
    return this.parseResponse(response);
  }
}
```

### Ollama (Local)

```typescript
class OllamaProvider implements AIProvider {
  id = 'ollama';
  name = 'Ollama (Local)';
  requiresApiKey = false;
  requiresBaseUrl = true;

  async generateStructure(params: GenerateParams): Promise<StructureResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'llama3',
        messages: this.buildMessages(params),
        tools: this.getToolDefinitions(),
        stream: false,
      }),
    });
    return this.parseResponse(response);
  }
}
```

### Generic (OpenAI-compatible)

```typescript
class GenericProvider implements AIProvider {
  id = 'generic';
  name = 'Custom API';
  requiresApiKey = true;
  requiresBaseUrl = true;

  // Works with any OpenAI-compatible endpoint
  // LM Studio, vLLM, text-generation-webui, etc.
}
```

---

## 4. Tool Definitions (MCP)

These tool schemas are sent to AI providers via function calling. The AI calls them, and the browser executes locally.

```typescript
const STRUCTURE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'place_block',
      description: 'Place a single block at specific coordinates',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'integer', description: 'X coordinate' },
          y: { type: 'integer', description: 'Y coordinate (height)' },
          z: { type: 'integer', description: 'Z coordinate' },
          block: {
            type: 'string',
            description: 'Minecraft block ID',
            enum: BLOCK_PALETTE // Dynamic list of available blocks
          }
        },
        required: ['x', 'y', 'z', 'block']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fill_region',
      description: 'Fill a rectangular region with a block type',
      parameters: {
        type: 'object',
        properties: {
          x1: { type: 'integer' }, y1: { type: 'integer' }, z1: { type: 'integer' },
          x2: { type: 'integer' }, y2: { type: 'integer' }, z2: { type: 'integer' },
          block: { type: 'string', enum: BLOCK_PALETTE }
        },
        required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2', 'block']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_blocks',
      description: 'Remove all blocks in a region (set to air)',
      parameters: {
        type: 'object',
        properties: {
          x1: { type: 'integer' }, y1: { type: 'integer' }, z1: { type: 'integer' },
          x2: { type: 'integer' }, y2: { type: 'integer' }, z2: { type: 'integer' }
        },
        required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'replace_blocks',
      description: 'Replace all blocks of one type with another in a region',
      parameters: {
        type: 'object',
        properties: {
          x1: { type: 'integer' }, y1: { type: 'integer' }, z1: { type: 'integer' },
          x2: { type: 'integer' }, y2: { type: 'integer' }, z2: { type: 'integer' },
          from_block: { type: 'string', enum: BLOCK_PALETTE },
          to_block: { type: 'string', enum: BLOCK_PALETTE }
        },
        required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2', 'from_block', 'to_block']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_structure_info',
      description: 'Get information about the current structure (dimensions, block counts, palette)',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'measure_area',
      description: 'Measure the volume and dimensions of a region',
      parameters: {
        type: 'object',
        properties: {
          x1: { type: 'integer' }, y1: { type: 'integer' }, z1: { type: 'integer' },
          x2: { type: 'integer' }, y2: { type: 'integer' }, z2: { type: 'integer' }
        },
        required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analyze_structure',
      description: 'Analyze the structure for problems (floating blocks, mob spawns, etc.)',
      parameters: { type: 'object', properties: {} }
    }
  }
];
```

---

## 5. System Prompt Design

```
You are a Minecraft structure generator. You create structures by placing blocks in a 3D grid.

BLOCK PALETTE:
{block_palette_with_descriptions}

RULES:
- Only use blocks from the palette above
- Coordinates are integers (whole numbers)
- Y=0 is the ground level
- Structures should be structurally sound (no floating roofs without support)
- Use appropriate blocks for each purpose (stone for walls, wood for floors, etc.)
- Keep dimensions within the specified limits

TOOL USAGE:
- Use place_block to add individual blocks
- Use fill_region for large uniform areas (walls, floors, ceilings)
- Use remove_blocks to clear areas
- Plan your structure before placing blocks
- Start with the foundation, then walls, then interior, then roof

When generating, think about:
1. Foundation and base
2. Structural supports
3. Walls and openings (doors, windows)
4. Interior layout
5. Roof structure
6. Details and decoration
```

---

## 6. Cost Estimation

Before sending a request, estimate token usage:

```typescript
function estimateCost(
  provider: AIProvider,
  model: string,
  promptTokens: number,
  estimatedOutputTokens: number
): number {
  const modelInfo = provider.models.find(m => m.id === model);
  if (!modelInfo) return 0;
  return (
    (promptTokens / 1000) * modelInfo.costPer1kInput +
    (estimatedOutputTokens / 1000) * modelInfo.costPer1kOutput
  );
}
```
