# Data Models — MIneLAb

---

## 1. Core Types

### Vec3

```typescript
interface Vec3 {
  x: number;
  y: number;
  z: number;
}
```

### Block

```typescript
interface Block {
  id: string;                    // "minecraft:stone_bricks"
  states?: Record<string, string>; // { facing: "north", half: "bottom" }
}
```

### Palette

```typescript
interface Palette {
  blocks: string[];  // Index-mapped block IDs
  // blocks[0] = "minecraft:air"
  // blocks[1] = "minecraft:stone_bricks"
  // blocks[2] = "minecraft:oak_planks"
}
```

---

## 2. StructureData

The central data structure. Everything revolves around this.

```typescript
interface StructureData {
  id: string;
  name: string;
  dimensions: Vec3;           // Width, height, depth
  palette: Palette;

  // Chunk-based storage
  chunks: Map<string, ChunkData>;  // Key: "cx|cy|cz"

  // Metadata
  metadata: StructureMetadata;
}

interface StructureMetadata {
  author: string;
  description: string;
  tags: string[];
  createdAt: string;    // ISO 8601
  modifiedAt: string;
  version: string;      // SemVer
  thumbnail?: string;   // Base64 data URL
  minecraftVersion: string;
}

interface ChunkData {
  position: Vec3;       // Chunk coordinates (not world coordinates)
  blocks: Uint8Array;   // 16x16x16 = 4096 entries, palette indices
  dirty: boolean;       // Needs re-mesh
}
```

---

## 3. Selection

```typescript
interface Selection {
  type: 'single' | 'box' | 'lasso' | 'sphere' | 'cylinder';
  bounds: SelectionBounds;
  blocks: Vec3[];       // Explicit block positions for lasso
}

interface SelectionBounds {
  min: Vec3;
  max: Vec3;
}
```

---

## 4. Diff

```typescript
interface Diff {
  id: string;
  timestamp: string;
  description: string;
  author: string;       // "user" or "ai"

  add: BlockPlacement[];
  remove: Vec3[];
  replace: Array<{
    from: Vec3;
    to: BlockPlacement;
  }>;
}

interface BlockPlacement {
  block: Block;
  position: Vec3;
}
```

---

## 5. Version History

```typescript
interface Version {
  id: string;
  name: string;
  timestamp: string;
  parentId: string | null;   // Previous version ID
  diff: Diff | null;         // null for initial version
  structureHash: string;     // SHA-256 of structure state
  branchId: string;
}

interface Branch {
  id: string;
  name: string;
  headVersionId: string;
  createdAt: string;
}
```

---

## 6. Project

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  structure: StructureData;
  versions: Version[];
  branches: Branch[];
  currentBranchId: string;
  currentVersionId: string;
  createdAt: string;
  modifiedAt: string;
  thumbnail?: string;
}
```

---

## 7. Chat Message

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;

  // For AI responses that include actions
  actions?: StructureAction[];
  diff?: Diff;
  tokenUsage?: TokenUsage;
}

interface StructureAction {
  type: 'generate' | 'modify' | 'analyze';
  description: string;
  blockCount?: number;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}
```

---

## 8. Analysis Report

```typescript
interface AnalysisReport {
  timestamp: string;
  stats: StructureStats;
  issues: AnalysisIssue[];
  suggestions: string[];
}

interface StructureStats {
  totalBlocks: number;
  airBlocks: number;
  solidBlocks: number;
  transparentBlocks: number;
  uniqueBlockTypes: number;
  dimensions: Vec3;
  boundingVolume: number;
  surfaceArea: number;
  density: number;         // solidBlocks / boundingVolume
  blockBreakdown: Array<{
    blockId: string;
    count: number;
    percentage: number;
  }>;
}

interface AnalysisIssue {
  id: string;
  type: 'floating' | 'unsupported' | 'mob_spawn' | 'water_flow' | 'disconnected' | 'dark_area' | 'overlap';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: Vec3;
  region?: SelectionBounds;
  suggestion?: string;
}
```

---

## 9. Material List (Survival Mode)

```typescript
interface MaterialList {
  blocks: MaterialEntry[];
  totalBlocks: number;
  estimatedStacks: number;     // Total / 64
  estimatedTime: string;       // Human-readable build time
  estimatedCost?: number;      // Optional server economy
  buildOrder: BuildStep[];
}

interface MaterialEntry {
  blockId: string;
  count: number;
  stacks: number;              // count / 64
  remainder: number;           // count % 64
}

interface BuildStep {
  order: number;
  description: string;
  blocks: Array<{
    blockId: string;
    count: number;
  }>;
  region?: SelectionBounds;
}
```

---

## 10. Plugin

```typescript
interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  entryPoint: string;
  permissions: PluginPermission[];
}

type PluginPermission =
  | 'structure:read'
  | 'structure:write'
  | 'selection:read'
  | 'selection:write'
  | 'ui:panels'
  | 'ui:tools'
  | 'ai:request';
```

---

## 11. .mcai File Format

```typescript
interface MCAIFile {
  version: string;           // Format version
  structure: {
    dimensions: Vec3;
    palette: string[];       // Block ID array
    chunks: Array<{
      position: Vec3;        // Chunk coordinates
      data: string;          // Base64-encoded Uint8Array
    }>;
  };
  metadata: StructureMetadata;
  versions: Version[];       // Full version history
  branches: Branch[];
}
```
