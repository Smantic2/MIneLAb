# System Architecture — MIneLAb

---

## 1. High-Level Architecture

```
Browser (Client)
├── UI Layer (React + Tailwind)
├── 3D Engine (Three.js + React Three Fiber)
├── AI Layer (Multi-provider)
├── Storage (IndexedDB)
├── Core Engine (Framework-agnostic)
├── Format I/O (Import/Export)
├── Plugin System
└── MCP Layer (Optional)
```

---

## 2. Layer Descriptions

### 2.1 UI Layer (React + TypeScript + Tailwind)

```
src/
├── components/
│   ├── canvas/           # 3D viewport wrapper
│   ├── ui/               # Buttons, modals, panels
│   ├── editor/           # Editor-specific panels
│   ├── ai/               # Chat, prompt input, provider config
│   ├── library/          # Community library browser
│   ├── export/           # Export dialog, format selection
│   └── history/          # Version history tree
├── stores/               # Zustand state stores
├── hooks/                # Custom React hooks
├── utils/                # Pure utility functions
└── types/                # TypeScript type definitions
```

### 2.2 3D Engine (Three.js + React Three Fiber)

```
src/engine/
├── VoxelWorld.ts         # Core voxel data structure
├── ChunkManager.ts       # Manages 16x16x16 chunks
├── MeshGenerator.ts      # Greedy meshing algorithm
├── TextureAtlas.ts       # Minecraft texture atlas management
├── Camera.ts             # Orbit, WASD, isometric cameras
├── Picker.ts             # Raycasting for block selection
├── SelectionRenderer.ts  # Visual selection overlay
├── GridRenderer.ts       # Grid and chunk overlay
├── OutlineRenderer.ts    # Selected block outlines
└── LODManager.ts         # Level of detail system
```

### 2.3 AI Layer

```
src/ai/
├── providers/
│   ├── AIProvider.ts        # Interface all providers implement
│   ├── OpenAIProvider.ts    # OpenAI API
│   ├── AnthropicProvider.ts # Anthropic API
│   ├── GeminiProvider.ts    # Google Gemini
│   ├── OllamaProvider.ts    # Local Ollama
│   ├── OpenRouterProvider.ts
│   └── GenericProvider.ts   # Any OpenAI-compatible API
├── prompts/
│   ├── system.ts            # Base system prompt
│   ├── generation.ts        # First-generation prompts
│   ├── iteration.ts         # Diff-based iteration prompts
│   ├── analysis.ts          # Structure analysis prompts
│   └── templates/           # Prompt templates per structure type
├── tools.ts                 # MCP tool definitions
├── parser.ts                # Parse AI responses to structured data
└── tokenizer.ts             # Token counting for cost estimation
```

### 2.4 Core Engine (Framework-agnostic)

```
src/core/
├── StructureData.ts       # Main data structure
├── BlockRegistry.ts       # Minecraft block definitions
├── PaletteManager.ts      # Palette optimization
├── ChunkData.ts           # Chunk storage
├── DiffEngine.ts          # Apply/diff operations
├── HistoryManager.ts      # Undo/redo stack
├── VersionManager.ts      # Named version management
├── AnalysisEngine.ts      # Structure problem detection
├── MaterialCalculator.ts  # Survival mode calculations
├── StepGenerator.ts       # Step-by-step build instructions
└── FormatConverter.ts     # Convert between formats
```

### 2.5 Storage Layer

```
src/storage/
├── ProjectStore.ts        # Save/load projects (IndexedDB)
├── LibraryStore.ts        # Community library cache
├── SettingsStore.ts       # User preferences
├── KeyStore.ts            # API key storage
└── HistoryStore.ts        # Version history persistence
```

---

## 3. Data Flow

### 3.1 Initial Generation

```
User Prompt
    │
    ▼
AI Provider (with MCP tools + block palette context)
    │
    ▼
Structured Response (blocks[])
    │
    ▼
Parser → StructureData
    │
    ▼
PaletteManager → Optimized Palette
    │
    ▼
ChunkManager → Chunk Data
    │
    ▼
MeshGenerator → GPU Buffers
    │
    ▼
Three.js Scene → Rendered Voxels
```

### 3.2 Iterative Edit

```
User Instruction + Current Structure
    │
    ▼
AI Provider (receives structure summary + instruction)
    │
    ▼
Diff Response { add[], remove[], replace[] }
    │
    ▼
DiffEngine.apply(diff) → Updated StructureData
    │
    ▼
Affected Chunks → Marked Dirty
    │
    ▼
MeshGenerator → Re-mesh dirty chunks only
    │
    ▼
Three.js Scene → Updated render
    │
    ▼
HistoryManager → Push to undo stack
```

### 3.3 Export Flow

```
StructureData
    │
    ▼
FormatConverter (target format)
    │
    ├─→ .schem (Sponge Schematic)
    ├─→ .litematic (Litematica)
    ├─→ .nbt (Structure Block)
    ├─→ .mcfunction (Function)
    ├─→ .zip (Datapack)
    └─→ .glb/.obj (3D Model)
    │
    ▼
Blob → Download
```

---

## 4. State Management (Zustand)

Three primary stores:

**EditorStore** — Structure data, selection, tools, camera settings, undo/redo

**AIStore** — Provider config, chat messages, generation state

**HistoryStore** — Named versions, branches, version comparison

---

## 5. Performance Architecture

### Chunk System
- World divided into 16x16x16 chunks
- Each chunk has its own BufferGeometry mesh
- Only dirty chunks are re-meshed
- Frustum culling skips invisible chunks
- LOD reduces detail for distant chunks

### Greedy Meshing
- Merges adjacent same-type faces into larger quads
- Typical 85-97% triangle reduction vs naive meshing
- Runs on WebWorker for non-blocking computation

### Instanced Rendering
- Same block type shares geometry and material
- Single draw call per block type per chunk
- Color per-instance for texture atlas lookup

---

## 6. Plugin System

Plugins extend functionality via a sandboxed API:

- Register custom tools (brush, terraform, roof generator, etc.)
- Add UI panels and menu items
- Hook into structure change events
- Request AI assistance through the plugin API
- Access selection and structure data

---

## 7. MCP Integration

MIneLAb acts as both:

**MCP Server** — Exposes tools (placeBlock, fillRegion, analyzeStructure) to external AI clients like Claude Desktop or Cursor.

**MCP Client** — Sends tool definitions to AI providers via function calling. AI calls tools, browser executes locally.

---

## 8. Security Model

- API keys stored in localStorage, never sent to MIneLAb servers
- All AI communication is direct browser-to-provider
- Plugin code runs in sandboxed Web Worker
- No eval() or dynamic code execution
- Content Security Policy enforced
