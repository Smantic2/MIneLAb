# Product Requirements Document (PRD)

## MIneLAb — AI-Powered Minecraft Structure Editor

---

## 1. Vision

MIneLAb is the equivalent of **Figma for Minecraft structures**, powered by AI. It allows users to generate, inspect, iterate, and export voxel structures through a web-based 3D editor with multi-provider AI integration.

---

## 2. Problem Statement

Today, generating a Minecraft structure with AI is relatively easy. However:

- **Iterating** on the result is extremely uncomfortable (re-prompting, losing context)
- **Inspecting** the structure in 3D before building it is not available
- **Exporting** to usable formats (Litematica, WorldEdit, Structure Block) is fragmented
- **Building** in Minecraft from the AI output requires manual copy-paste or complex toolchains

The workflow is broken at every step after initial generation.

---

## 3. Target Users

| Persona | Description |
|---------|-------------|
| **Map Maker** | Creates large-scale builds for servers, adventure maps, showcases |
| **Server Owner** | Needs quick structures for spawns, events, terrain decoration |
| **Modder/Developer** | Uses schematics as base for mods, data packs, or testing |
| **Survival Player** | Wants to plan builds and follow step-by-step guides |
| **Content Creator** | Needs epic structures for videos, thumbnails, streams |
| **Casual Builder** | Enjoys building but lacks time for massive projects |

---

## 4. Core Features

### 4.1 AI Provider System

**Requirement:** Support multiple AI providers through a unified interface.

| Provider | Protocol | Notes |
|----------|----------|-------|
| OpenAI | Function Calling | GPT-4o, GPT-4.1 |
| Anthropic | Tool Use | Claude Sonnet 4, Claude Opus |
| Gemini | Function Calling | Gemini 2.5 Pro |
| Ollama | OpenAI-compatible | Local models |
| OpenRouter | OpenAI-compatible | Multi-model gateway |
| LM Studio | OpenAI-compatible | Local models |
| Custom | OpenAI-compatible | Any compatible API |

**Key Behavior:**
- User selects provider and configures API key (stored in localStorage)
- All providers implement the same `AIProvider` interface
- AI never returns raw text — always structured block data or diffs
- System prompts are pre-engineered for optimal Minecraft structure generation

### 4.2 Prompt-to-Structure Generation

**Requirement:** Generate a full voxel structure from a natural language prompt.

**Flow:**
1. User writes a prompt describing the structure
2. System wraps prompt with MCP tool definitions and block palette context
3. AI responds with a structured representation (blocks to place/remove)
4. Voxel engine renders the result immediately in 3D

**Example prompt:** "Build a medieval castle 60x60 with double walls, central courtyard, survival rooms, dark stone style"

### 4.3 3D Voxel Editor (Blender + Minecraft)

**Requirement:** Full-featured 3D editor, not just a viewer.

**Camera Controls:**
- Free orbit (left click drag)
- WASD navigation (first-person fly mode)
- Isometric view toggle
- Wireframe mode
- X-ray mode (see through blocks)
- Layer visibility toggle
- Chunk grid overlay
- Coordinate display
- Distance measurement tool

**Selection Tools:**
- Single block selection
- Box selection (drag to select region)
- Lasso selection (free-form region)
- Sphere selection
- Fill selection (select connected same-type blocks)

**Editing Tools:**
- Block replacement (swap one material for another)
- Zone painting (paint material onto region)
- Delete selected
- Move selected
- Copy/paste selection
- Undo/Redo (full history stack)

### 4.4 Iterative AI Editing (Diff System)

**Requirement:** AI modifies existing structures via diffs, not regeneration.

**Flow:**
1. User selects a region or refers to the whole structure
2. User writes an instruction: "Make the tower taller", "Change roof to Japanese style", "Convert wood to spruce"
3. AI receives the current structure state + the instruction
4. AI returns a diff:
```json
{
  "remove": [{"x": 10, "y": 20, "z": 5}, ...],
  "add": [{"id": "minecraft:spruce_planks", "x": 10, "y": 20, "z": 5}, ...]
}
```
5. Diff is applied, 3D view updates instantly

**Benefits:**
- Drastically reduces token usage
- Preserves user's existing work
- Enables conversational iteration

### 4.5 Version History (Git-like)

**Requirement:** Full undo/redo with named versions.

**Features:**
- Automatic save points on each AI interaction
- Manual version naming ("Add walls", "Change roof")
- Version tree visualization
- Compare any two versions (diff view)
- Branch from any version
- Revert to any version
- Export any version independently

### 4.6 Prompt Templates

**Requirement:** Pre-built prompt templates for common structures.

**Categories:**
```
Castle          Temple          Village         Dungeon
Tree            Bridge          Tower           Spaceship
Modern House    Japanese        Fantasy         Underwater
SciFi           Organic         Interior        Landscape
Redstone        Farm            Park            Monument
```

Each template includes:
- Optimized system prompt
- Default block palette
- Suggested dimensions
- Style modifiers (medieval, modern, fantasy, etc.)

### 4.7 Community Library

**Requirement:** Browse, share, and duplicate community structures.

**Features:**
- Publish structures with metadata (name, description, tags, thumbnail)
- Tag system: Fantasy, Medieval, Japanese, SciFi, Modern, Organic, Survival, Decorative
- Search and filter
- Fork/duplicate any structure
- Rate and review
- Featured/trending structures
- Version history visible per structure

### 4.8 Export System

**Requirement:** Export to all popular Minecraft formats.

| Format | Extension | Tool Compatibility |
|--------|-----------|-------------------|
| Litematica | `.litematic` | Litematica mod, Fabric/Forge |
| Sponge Schematic | `.schem` | WorldEdit, FAWE |
| Structure Block | `.nbt` | Vanilla Structure Blocks |
| WorldEdit Commands | `.txt` | WorldEdit paste commands |
| Datapack | `.zip` | Minecraft Data Packs |
| MCFunction | `.mcfunction` | Function files |
| Blueprint | `.bp` | Axiom mod |
| Bedrock Structure | `.mcstructure` | Bedrock Edition |
| 3D Model | `.glb`, `.obj` | Blender, 3D software |
| Image | `.png` | Layer-by-layer guide |

### 4.9 Import System

**Requirement:** Import existing structures for AI-assisted editing.

**Supported formats:**
- `.schem` (WorldEdit)
- `.litematic` (Litematica)
- `.nbt` (Structure Block)
- `.mcstructure` (Bedrock)
- `.bp` (Axiom)
- `.schematic` (Legacy)

**Flow:**
1. User drags file into the app
2. Format is auto-detected
3. Structure is parsed and loaded into the voxel engine
4. User can now edit with AI or manual tools

### 4.10 Intelligent Tools

**Requirement:** AI-powered analysis and smart editing features.

**Structure Analysis (Linter):**
- Detect floating roofs (no support)
- Identify mob-spawnable openings
- Find disconnected stairs/paths
- Flag water/lava flow issues
- Report missing lighting
- Suggest structural improvements

**Smart Selection:**
- "This room" → AI detects room boundaries
- "The roof" → AI detects roof geometry
- "All torches" → Select all of type
- "The entrance" → AI identifies entrance pattern

### 4.11 Survival Mode

**Requirement:** Calculate materials and build steps for survival mode.

**Material Calculator:**
```
1,250 Stone Bricks
  340 Oak Logs
  560 Glass
   90 Lanterns
   45 Doors
   12 Chests
```

**Build Planner:**
- Approximate real build time
- Number of stacks required
- Recommended build order
- Cost estimation (if applicable)

### 4.12 Step-by-Step Builder

**Requirement:** Generate LEGO-like build instructions.

**Output:**
- Layer-by-layer breakdown
- Each step shows which blocks to place
- Visual markers in the 3D view
- Can generate a PDF/image guide
- Optional integration with Litematica overlay

### 4.13 MCP Integration

**Requirement:** Expose structure manipulation as MCP tools for AI.

**Tools exposed:**
```typescript
placeBlock(x, y, z, blockId, blockStates?)
fillRegion(x1, y1, z1, x2, y2, z2, blockId)
replaceBlocks(blockId, newBlockId, region?)
removeBlocks(region?)
measureArea(region?): { width, height, depth, volume, blockCount }
getPalette(): BlockId[]
analyzeStructure(): AnalysisReport
getStructureState(): StructureData
undo()
redo()
```

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Target |
|--------|--------|
| Structures up to 100k blocks | Smooth 60fps orbit/zoom |
| Structures up to 500k blocks | 30fps with LOD |
| Structures up to 1M+ blocks | 15fps with aggressive LOD + frustum culling |
| AI response latency | < 2s for diff generation |
| Import/export | < 5s for 100k block structures |

### 5.2 Rendering Optimizations

- **Greedy Meshing:** Merge adjacent same-type faces into larger quads (85-97% triangle reduction)
- **Instanced Meshes:** Batch same-type blocks into single draw calls
- **Frustum Culling:** Don't render blocks outside camera view
- **Occlusion Culling:** Don't render hidden interior blocks
- **LOD:** Reduce detail for distant blocks
- **Chunk-based loading:** Process world in 16x16x16 chunks
- **WebWorker offloading:** Mesh generation on background threads

### 5.3 Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+
- WebGL 2.0 required
- WebGPU preferred (for future optimization)

### 5.4 Data Storage

- All data stored locally (localStorage/IndexedDB)
- No server required for core functionality
- API keys stored in localStorage (encrypted optional)
- Structures saved as `.mcai` format (custom efficient format)

### 5.5 Security

- API keys never leave the browser
- No telemetry without consent
- Content Security Policy headers
- No eval() or dynamic code execution

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Time to first structure | < 2 minutes |
| Structures exported per user | 3+ per session |
| AI iteration cycles | 5+ per session |
| User retention (week 1) | > 40% |
| Community library growth | 100+ structures/month |

---

## 7. Competitive Landscape

| Project | Features | Limitations |
|---------|----------|-------------|
| **BuilderGPT** | Text→schem, Python CLI | No 3D editor, no iteration, OpenAI only |
| **BlockGPT** | Text→schem web app | No 3D preview, no import, single provider |
| **Bloxelizer** | Format converter, 2D/3D view | No AI, no editing, view-only |
| **Shulkr** | Format converter | No AI, no 3D editor |
| **Litematica** | In-game hologram overlay | Minecraft-only, no AI, no web |
| **WorldEdit** | In-game world editing | Minecraft-only, command-based, no AI |

**MIneLAb Differentiators:**
- AI-agnostic (multi-provider)
- Full 3D web editor (Blender-like)
- Iterative diff-based editing
- Import AND export in all formats
- Community library
- MCP integration
- Survival mode & step-by-step builder

---

## 8. Constraints

- **Must work entirely in the browser** (no server dependency for core features)
- **Must not require Minecraft to be installed** for editing
- **Must support offline editing** (AI features require internet)
- **Must be open source** (MIT or similar)
- **Must not store user API keys on any server**

---

## 9. Out of Scope (v1.0)

- Real-time multiplayer collaboration
- Direct Minecraft mod/plugin integration
- Terrain generation (outside structure scope)
- Redstone simulation
- Entity/mob placement logic
- Minecraft version migration

---

## 10. Appendices

### A. File Format: `.mcai`

MIneLAb's native format. Optimized for web performance.

```json
{
  "version": "1.0",
  "palette": ["stone_bricks", "oak_planks", "glass", "air"],
  "dimensions": { "x": 60, "y": 40, "z": 60 },
  "chunks": [
    {
      "x": 0, "y": 0, "z": 0,
      "data": "base64-encoded-run-length-compressed-block-data"
    }
  ],
  "metadata": {
    "name": "Medieval Castle",
    "author": "user123",
    "tags": ["medieval", "castle", "fantasy"],
    "createdAt": "2026-06-26T00:00:00Z",
    "versions": [
      {
        "name": "Initial Generation",
        "diff": null
      },
      {
        "name": "Add walls",
        "diff": { "add": [...], "remove": [...] }
      }
    ]
  }
}
```

### B. Block Palette

Minecraft Java Edition 1.21.5 block registry. The palette maps short IDs to full block IDs with optional states.

```json
{
  "palette": {
    "0": "minecraft:air",
    "1": "minecraft:stone_bricks",
    "2": "minecraft:oak_planks[axis=y]",
    "3": "minecraft:glass",
    "4": "minecraft:oak_log[axis=y]",
    "5": "minecraft:cobblestone",
    "6": "minecraft:stone_brick_stairs[facing=north,half=bottom,shape=straight]"
  }
}
```

### C. Diff Format

```json
{
  "version": "1.0",
  "timestamp": "2026-06-26T12:00:00Z",
  "description": "Make tower taller",
  "add": [
    {
      "id": "minecraft:stone_bricks",
      "x": 10, "y": 25, "z": 5,
      "states": {}
    }
  ],
  "remove": [
    { "x": 10, "y": 20, "z": 5 }
  ],
  "replace": [
    {
      "from": { "x": 10, "y": 20, "z": 6 },
      "to": {
        "id": "minecraft:spruce_planks",
        "states": {}
      }
    }
  ]
}
```
