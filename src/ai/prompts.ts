// ============================================================
// AI Prompts — MIneLAb
// System and user prompt builders for structure generation,
// diffing, and analysis.
// ============================================================

import type { Palette, StructureSummary, Vec3 } from '../types/index';

// ── Static template catalogue ────────────────────────────────

export interface PromptTemplate {
  id: string;
  label: string;
  category: 'medieval' | 'fantasy' | 'functional' | 'industrial' | 'natural';
  prompt: string;
  suggestedSize: Vec3;
  tags: string[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'castle',
    label: 'Castle',
    category: 'medieval',
    prompt:
      'Build a medieval castle with thick stone walls, four corner towers with battlements, a central keep, a gatehouse with a portcullis, and an inner courtyard. Use stone bricks, cracked stone bricks, and mossy stone bricks for variety.',
    suggestedSize: { x: 64, y: 48, z: 64 },
    tags: ['medieval', 'fortress', 'walls', 'towers'],
  },
  {
    id: 'temple',
    label: 'Temple',
    category: 'fantasy',
    prompt:
      'Design an ancient stone temple with grand entrance stairs, tall pillars lining the nave, a raised altar platform at the far end, and decorative engravings. Use polished stone bricks, chiseled stone bricks, and quartz for highlights.',
    suggestedSize: { x: 32, y: 24, z: 48 },
    tags: ['religion', 'ancient', 'pillars', 'altar'],
  },
  {
    id: 'village',
    label: 'Village',
    category: 'medieval',
    prompt:
      'Generate a small medieval village with 6–8 houses of varying sizes, a central well, dirt paths connecting the buildings, lanterns for lighting, fences, gardens with crops, and a small church or chapel.',
    suggestedSize: { x: 80, y: 16, z: 80 },
    tags: ['settlement', 'houses', 'paths', 'community'],
  },
  {
    id: 'house',
    label: 'House',
    category: 'medieval',
    prompt:
      'Build a cozy two-storey medieval house with oak log walls, a cobblestone foundation, a steeply pitched spruce plank roof, glass-pane windows, a wooden door, an interior fireplace, and a small garden porch.',
    suggestedSize: { x: 12, y: 12, z: 10 },
    tags: ['dwelling', 'home', 'residential'],
  },
  {
    id: 'tower',
    label: 'Tower',
    category: 'medieval',
    prompt:
      'Create a tall circular stone watchtower with spiraling interior stairs, arrow-slit windows at regular intervals, a crenellated top platform with a flag pole, and a torch-lit entrance at ground level.',
    suggestedSize: { x: 12, y: 40, z: 12 },
    tags: ['defense', 'guard', 'circular', 'height'],
  },
  {
    id: 'bridge',
    label: 'Bridge',
    category: 'functional',
    prompt:
      'Build a stone arch bridge spanning a river gap. Include graceful arching supports below the road deck, guard rails on both sides, lantern posts every few blocks, and small alcoves mid-span for passing travelers.',
    suggestedSize: { x: 8, y: 12, z: 40 },
    tags: ['crossing', 'arch', 'road', 'river'],
  },
  {
    id: 'farm',
    label: 'Farm',
    category: 'functional',
    prompt:
      'Design a working farm with a large barn, irrigated crop fields (wheat, carrots, potatoes, beetroot), a chicken coop, pig pens, a stable for horses, a silo, and a farmhouse with a vegetable garden.',
    suggestedSize: { x: 64, y: 12, z: 64 },
    tags: ['agriculture', 'animals', 'crops', 'rural'],
  },
  {
    id: 'dungeon',
    label: 'Dungeon',
    category: 'fantasy',
    prompt:
      'Generate an underground dungeon with interconnected rooms and corridors, jail cells with iron-bar doors, a torture chamber, a treasure vault, trap mechanisms, spike pits, and a monster spawner room. Use cobblestone, mossy cobblestone, and netherrack.',
    suggestedSize: { x: 48, y: 12, z: 48 },
    tags: ['underground', 'horror', 'traps', 'cells'],
  },
  {
    id: 'library',
    label: 'Library',
    category: 'functional',
    prompt:
      'Create a grand library with towering bookshelves reaching the ceiling, a central reading area with oak tables and chairs, a second-floor balcony gallery, a spiral staircase, enchanting tables, and large arched windows.',
    suggestedSize: { x: 24, y: 20, z: 32 },
    tags: ['books', 'knowledge', 'reading', 'shelves'],
  },
  {
    id: 'lighthouse',
    label: 'Lighthouse',
    category: 'functional',
    prompt:
      'Build a coastal lighthouse with a cylindrical stone tower, interior spiral staircase, a glass lantern room at the top with a beacon light source, a small keeper\'s cottage at the base, and a dock platform.',
    suggestedSize: { x: 16, y: 48, z: 16 },
    tags: ['coastal', 'navigation', 'beacon', 'sea'],
  },
  {
    id: 'windmill',
    label: 'Windmill',
    category: 'functional',
    prompt:
      'Design a traditional Dutch-style windmill with large wooden sail blades, a roundhouse stone base, an octagonal upper section, interior grain-milling machinery represented by spruce planks and logs, and a small miller\'s house beside it.',
    suggestedSize: { x: 20, y: 32, z: 20 },
    tags: ['mill', 'wind', 'grain', 'blades'],
  },
  {
    id: 'market',
    label: 'Market',
    category: 'medieval',
    prompt:
      'Build an outdoor medieval market with 8–10 merchant stalls, each with colorful wool awnings, wooden counters displaying goods, a central fountain, cobblestone paving, lantern strings between stalls, and a guild hall at one end.',
    suggestedSize: { x: 48, y: 12, z: 48 },
    tags: ['trade', 'stalls', 'commerce', 'outdoor'],
  },
  {
    id: 'inn',
    label: 'Inn',
    category: 'medieval',
    prompt:
      'Create a two-storey roadside inn with a ground-floor common room featuring long tables, a bar with barrels, a fireplace, and stairs leading to the upper floor with 4–6 private rooms, each with a bed, chest, and window.',
    suggestedSize: { x: 18, y: 14, z: 14 },
    tags: ['tavern', 'rest', 'beds', 'ale'],
  },
  {
    id: 'blacksmith',
    label: 'Blacksmith',
    category: 'medieval',
    prompt:
      'Build a blacksmith workshop with an open-sided forge area housing furnaces and anvils, a water trough, weapon and armor racks, a storage room with chests, bellows made of leather, and a coal store.',
    suggestedSize: { x: 14, y: 10, z: 12 },
    tags: ['forge', 'crafting', 'weapons', 'metal'],
  },
  {
    id: 'barn',
    label: 'Barn',
    category: 'functional',
    prompt:
      'Generate a large red barn with oak log frame, dark oak plank siding, a gambrel (curved) roof, large sliding doors, a hay loft on the upper level, animal stalls below, a ladder, bales of hay, and lanterns for lighting.',
    suggestedSize: { x: 20, y: 16, z: 30 },
    tags: ['storage', 'animals', 'hay', 'farm'],
  },
  {
    id: 'well',
    label: 'Well',
    category: 'functional',
    prompt:
      'Design a decorative stone well with a circular cobblestone base, a wooden roof structure on oak-log posts, a rope-and-bucket mechanism, flower pots around the edge, and mossy stone detailing.',
    suggestedSize: { x: 7, y: 6, z: 7 },
    tags: ['water', 'village', 'decorative'],
  },
  {
    id: 'fountain',
    label: 'Fountain',
    category: 'natural',
    prompt:
      'Create an ornate town square fountain with a tiered design: a wide lower basin, a raised middle tier, and a top-level spout using water source blocks. Use polished andesite, quartz, and stone brick for the structure with lily pads and sea lanterns.',
    suggestedSize: { x: 12, y: 8, z: 12 },
    tags: ['water', 'decorative', 'plaza', 'ornate'],
  },
  {
    id: 'dock',
    label: 'Dock',
    category: 'functional',
    prompt:
      'Build a wooden harbor dock extending over water, with oak plank walkways, fence-post railings, iron-bar ladders for climbing, mooring posts, crates and barrels, a fisherman\'s shack, a crane made of oak logs, and a small warehouse.',
    suggestedSize: { x: 24, y: 8, z: 48 },
    tags: ['harbor', 'boats', 'water', 'trade'],
  },
  {
    id: 'mineshaft',
    label: 'Mineshaft',
    category: 'industrial',
    prompt:
      'Generate an abandoned mineshaft with a main vertical shaft entrance, horizontal tunnel branches every 8 blocks, oak log support beams with planks as bracing, minecart rails, ore veins in the walls, fallen support beams, cobwebs, and a surface mining camp.',
    suggestedSize: { x: 32, y: 24, z: 32 },
    tags: ['underground', 'mining', 'rails', 'abandoned'],
  },
  {
    id: 'garden',
    label: 'Garden',
    category: 'natural',
    prompt:
      'Design a formal Renaissance garden with symmetric flower beds divided by gravel paths, sculpted topiary bushes, a central sundial, a hedge maze section, a rose trellis pergola, and a koi pond with water lilies. Use diverse flower blocks and leaf types.',
    suggestedSize: { x: 40, y: 6, z: 40 },
    tags: ['flowers', 'nature', 'maze', 'paths'],
  },
];

// ── System prompt ────────────────────────────────────────────

/**
 * Builds the system prompt for the AI assistant.
 * Includes the available block palette and optional dimension constraints.
 */
export function buildSystemPrompt(palette: Palette, maxDimensions?: Vec3): string {
  const blocks = palette.blocks.filter((b) => b !== 'minecraft:air');
  const blockList = blocks.join(', ');
  const dimConstraint = maxDimensions
    ? `\n\nDimension constraint: Keep all coordinates within X: 0–${maxDimensions.x - 1}, Y: 0–${maxDimensions.y - 1}, Z: 0–${maxDimensions.z - 1}.`
    : '';

  return `You are MIneLAb AI, an expert Minecraft structure architect embedded in the MIneLAb 3D editor.

## Your Role
You generate and modify Minecraft structures by calling the provided tools. You MUST use tool calls to make any structural changes — never describe placements in plain text.

## Available Tools
- **place_block(x, y, z, block)** — place a single block
- **fill_region(x1, y1, z1, x2, y2, z2, block)** — fill a box region with one block type
- **remove_blocks(x1, y1, z1, x2, y2, z2)** — clear a region (set to air)
- **replace_blocks(x1, y1, z1, x2, y2, z2, from_block, to_block)** — swap one block type for another
- **get_structure_info()** — inspect current structure metadata
- **measure_area(x1, y1, z1, x2, y2, z2)** — calculate region dimensions

## Block Palette (ONLY use these block IDs)
${blockList}

## Coordinate System
- Y is the vertical axis (Y=0 is ground level)
- X is the east–west axis
- Z is the north–south axis
- All structures should start near origin (0, 0, 0)${dimConstraint}

## Design Principles
1. Build efficiently using fill_region for large areas instead of individual place_block calls
2. Start from the bottom (foundations) and work upward
3. Add architectural details after the main structure
4. Use material variety to avoid monotonous surfaces
5. Ensure structures are solid and well-proportioned
6. Follow real architectural principles when applicable

## Response Format
- Call tools to build the structure
- After all tool calls, provide a brief natural-language summary describing what you built
- If the user asks a question without requesting a build, answer directly without tool calls`;
}

// ── Generation prompt ────────────────────────────────────────

/**
 * Builds the user-turn prompt for generating a new structure from scratch.
 */
export function buildGenerationPrompt(prompt: string, palette: Palette): string {
  const blocks = palette.blocks.filter((b) => b !== 'minecraft:air');
  return `Please build the following Minecraft structure from scratch, starting at coordinates (0, 0, 0):

**Request:** ${prompt}

**Available blocks (${blocks.length}):** ${blocks.join(', ')}

Start by calling get_structure_info() to check current state, then build the structure efficiently using fill_region for large areas. After building, provide a brief description of what you created including dimensions and materials used.`;
}

// ── Diff / Modification prompt ───────────────────────────────

/**
 * Builds the user-turn prompt for modifying an existing structure.
 */
export function buildDiffPrompt(instruction: string, summary: StructureSummary): string {
  const blockBreakdownText = summary.blockBreakdown
    .slice(0, 15)
    .map((b) => `  - ${b.blockId}: ${b.count} blocks`)
    .join('\n');

  return `Please modify the existing structure according to this instruction:

**Instruction:** ${instruction}

**Current Structure — "${summary.name}"**
- Dimensions: ${summary.dimensions.x}W × ${summary.dimensions.y}H × ${summary.dimensions.z}D
- Total solid blocks: ${summary.totalBlocks}
- Block composition:
${blockBreakdownText}${summary.blockBreakdown.length > 15 ? '\n  - (and ' + (summary.blockBreakdown.length - 15) + ' more...)' : ''}

Use the available tools to make targeted, surgical modifications. Prefer replace_blocks for material changes and fill_region for adding/removing sections. After all changes, summarize what you modified and why.`;
}

// ── Analysis prompt ──────────────────────────────────────────

/**
 * Builds the user-turn prompt for analyzing an existing structure.
 */
export function buildAnalysisPrompt(summary: StructureSummary): string {
  const blockBreakdownText = summary.blockBreakdown
    .map((b) => `  - ${b.blockId}: ${b.count} blocks (${((b.count / summary.totalBlocks) * 100).toFixed(1)}%)`)
    .join('\n');

  const volume = summary.dimensions.x * summary.dimensions.y * summary.dimensions.z;
  const density = volume > 0 ? ((summary.totalBlocks / volume) * 100).toFixed(1) : '0.0';

  return `Please analyze the following Minecraft structure and provide detailed feedback:

**Structure: "${summary.name}"**
- Dimensions: ${summary.dimensions.x}W × ${summary.dimensions.y}H × ${summary.dimensions.z}D
- Bounding volume: ${volume.toLocaleString()} blocks
- Solid blocks: ${summary.totalBlocks.toLocaleString()} (density: ${density}%)
- Unique block types: ${summary.blockBreakdown.length}

**Block Breakdown:**
${blockBreakdownText}

Please provide:
1. **Architectural Assessment** — overall design quality, proportions, style
2. **Material Analysis** — block choice, variety, appropriateness for the structure type
3. **Structural Integrity** — any floating blocks, unsupported elements, or gaps
4. **Suggestions** — 3–5 specific improvements with coordinates or regions where applicable
5. **Style Tags** — 3–5 tags that best describe this structure

Do NOT make any tool calls — this is an analysis-only request. Respond in well-structured markdown.`;
}
