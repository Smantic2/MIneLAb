// ============================================================
// Core Types — MIneLAb
// All TypeScript interfaces and type definitions
// ============================================================

// ── Primitives ───────────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Block {
  id: string;                          // "minecraft:stone_bricks"
  states?: Record<string, string>;     // { facing: "north", half: "bottom" }
}

export interface Palette {
  blocks: string[];  // Index-mapped block IDs; blocks[0] = "minecraft:air"
}

// ── Structure ────────────────────────────────────────────────

export interface ChunkData {
  position: Vec3;       // Chunk coordinates (not world coordinates)
  blocks: Uint8Array;   // 16x16x16 = 4096 entries, palette indices
  dirty: boolean;       // Needs re-mesh
}

export interface StructureMetadata {
  author: string;
  description: string;
  tags: string[];
  createdAt: string;        // ISO 8601
  modifiedAt: string;
  version: string;          // SemVer
  thumbnail?: string;       // Base64 data URL
  minecraftVersion: string;
}

export interface StructureData {
  id: string;
  name: string;
  dimensions: Vec3;
  palette: Palette;
  chunks: Map<string, ChunkData>;  // Key: "cx|cy|cz"
  metadata: StructureMetadata;
}

// ── Selection ────────────────────────────────────────────────

export interface SelectionBounds {
  min: Vec3;
  max: Vec3;
}

export interface Selection {
  type: 'single' | 'box' | 'lasso' | 'sphere' | 'cylinder';
  bounds: SelectionBounds;
  blocks: Vec3[];  // Explicit block positions for lasso
}

// ── Diff ─────────────────────────────────────────────────────

export interface BlockPlacement {
  block: Block;
  position: Vec3;
}

export interface Diff {
  id: string;
  timestamp: string;
  description: string;
  author: 'user' | 'ai';
  add: BlockPlacement[];
  remove: Vec3[];
  replace: Array<{ from: Vec3; to: BlockPlacement }>;
}

// ── Version History ──────────────────────────────────────────

export interface Version {
  id: string;
  name: string;
  timestamp: string;
  parentId: string | null;
  diff: Diff | null;
  structureHash: string;
  branchId: string;
}

export interface Branch {
  id: string;
  name: string;
  headVersionId: string;
  createdAt: string;
}

// ── Project ──────────────────────────────────────────────────

export interface Project {
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

// ── AI / Chat ────────────────────────────────────────────────

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface StructureAction {
  type: 'generate' | 'modify' | 'analyze';
  description: string;
  blockCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: StructureAction[];
  diff?: Diff;
  tokenUsage?: TokenUsage;
  isStreaming?: boolean;
  error?: string;
}

// ── Analysis ─────────────────────────────────────────────────

export interface StructureStats {
  totalBlocks: number;
  airBlocks: number;
  solidBlocks: number;
  transparentBlocks: number;
  uniqueBlockTypes: number;
  dimensions: Vec3;
  boundingVolume: number;
  surfaceArea: number;
  density: number;
  blockBreakdown: Array<{ blockId: string; count: number; percentage: number }>;
}

export interface AnalysisIssue {
  id: string;
  type: 'floating' | 'unsupported' | 'mob_spawn' | 'water_flow' | 'disconnected' | 'dark_area' | 'overlap';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: Vec3;
  region?: SelectionBounds;
  suggestion?: string;
}

export interface AnalysisReport {
  timestamp: string;
  stats: StructureStats;
  issues: AnalysisIssue[];
  suggestions: string[];
}

// ── Material / Survival ──────────────────────────────────────

export interface MaterialEntry {
  blockId: string;
  count: number;
  stacks: number;
  remainder: number;
}

export interface BuildStep {
  order: number;
  description: string;
  blocks: Array<{ blockId: string; count: number }>;
  region?: SelectionBounds;
}

export interface MaterialList {
  blocks: MaterialEntry[];
  totalBlocks: number;
  estimatedStacks: number;
  estimatedTime: string;
  estimatedCost?: number;
  buildOrder: BuildStep[];
}

// ── Plugin ───────────────────────────────────────────────────

export type PluginPermission =
  | 'structure:read'
  | 'structure:write'
  | 'selection:read'
  | 'selection:write'
  | 'ui:panels'
  | 'ui:tools'
  | 'ai:request';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  entryPoint: string;
  permissions: PluginPermission[];
}

// ── AI Provider ──────────────────────────────────────────────

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsToolUse: boolean;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateParams {
  prompt: string;
  blockPalette: string[];
  maxDimensions?: Vec3;
  style?: string;
  constraints?: string[];
}

export interface StructureResponse {
  blocks: Array<{ id: string; x: number; y: number; z: number; states?: Record<string, string> }>;
  palette: string[];
  dimensions: Vec3;
  description: string;
}

export interface DiffParams {
  instruction: string;
  currentStructure: StructureSummary;
  region?: SelectionBounds;
  blockPalette: string[];
}

export interface DiffResponse {
  add: Array<{ id: string; x: number; y: number; z: number; states?: Record<string, string> }>;
  remove: Vec3[];
  replace: Array<{ from: Vec3; to: { id: string; x: number; y: number; z: number; states?: Record<string, string> } }>;
  description: string;
}

export interface StructureSummary {
  name: string;
  dimensions: Vec3;
  totalBlocks: number;
  blockBreakdown: Array<{ blockId: string; count: number }>;
  palette: string[];
}

// ── Editor State ─────────────────────────────────────────────

export type ViewMode = 'solid' | 'wireframe' | 'xray';
export type CameraMode = 'orbit' | 'fly' | 'isometric';
export type ActiveTool = 'select' | 'place' | 'remove' | 'paint' | 'measure';

export interface EditorSettings {
  viewMode: ViewMode;
  cameraMode: CameraMode;
  showGrid: boolean;
  showAxes: boolean;
  showChunkBoundaries: boolean;
  showCoordinates: boolean;
  activeTool: ActiveTool;
  selectedBlockId: string;
}

// ── .mcai File Format ────────────────────────────────────────

export interface MCAIFile {
  version: string;
  structure: {
    dimensions: Vec3;
    palette: string[];
    chunks: Array<{ position: Vec3; data: string }>; // Base64 Uint8Array
  };
  metadata: StructureMetadata;
  versions: Version[];
  branches: Branch[];
}
