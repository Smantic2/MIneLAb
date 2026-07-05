# MIneLAb — Documentation Index

AI-Powered Minecraft Structure Editor — "Figma for Minecraft Builds"

---

## Documents

| Document | Path | Description |
|----------|------|-------------|
| **PRD** | [PRD.md](./PRD.md) | Product Requirements Document — full feature spec |
| **Architecture** | [architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | System architecture, layers, data flows |
| **User Stories** | [USER_STORIES.md](./USER_STORIES.md) | 40+ user stories across 11 epics |
| **Data Models** | [data-models/DATA_MODELS.md](./data-models/DATA_MODELS.md) | All TypeScript interfaces and data structures |
| **AI Providers** | [api/AI_PROVIDERS.md](./api/AI_PROVIDERS.md) | Provider interface, implementations, MCP tools |
| **Export Formats** | [formats/EXPORT_FORMATS.md](./formats/EXPORT_FORMATS.md) | All supported formats with NBT structure details |
| **Best Practices** | [guides/BEST_PRACTICES.md](./guides/BEST_PRACTICES.md) | Development guidelines and coding standards |
| **Brainstorm** | [brainstorm/IDEAS.md](./brainstorm/IDEAS.md) | Ideas beyond the original spec (50+ ideas) |
| **Tasks** | [tasks.md](./tasks.md) | Phased roadmap with dependency order |

---

## Quick Reference

### Tech Stack
- React + TypeScript + Tailwind CSS
- Three.js + React Three Fiber
- Zustand (state management)
- Vitest + Playwright (testing)
- Vite (build tool)

### Core Concepts
- **StructureData** — central data structure, chunk-based voxel storage
- **Palette** — index-mapped block IDs for efficient storage
- **Diff** — add/remove/replace operations for iterative AI editing
- **.mcai** — native file format (palette + compressed chunks + metadata)
- **MCP Tools** — structured AI function calling for reliable generation

### Supported Formats
- **Import**: .schem, .litematic, .nbt, .mcstructure, .schematic, .bp
- **Export**: .schem, .litematic, .nbt, .mcfunction, .zip, .glb, .obj, .png

### AI Providers
OpenAI, Anthropic, Gemini, Ollama, OpenRouter, LM Studio, any OpenAI-compatible API
