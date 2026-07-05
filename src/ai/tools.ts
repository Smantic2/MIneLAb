// ============================================================
// AI Tools — MIneLAb
// Tool definitions for OpenAI and Anthropic formats.
// ============================================================

import type { Palette } from '../types/index';

// ── Tool parameter schemas ───────────────────────────────────

const placeBlockParams = {
  type: 'object' as const,
  properties: {
    x: { type: 'integer', description: 'X coordinate of the block' },
    y: { type: 'integer', description: 'Y coordinate of the block (vertical axis)' },
    z: { type: 'integer', description: 'Z coordinate of the block' },
    block: { type: 'string', description: 'Block ID, e.g. "minecraft:stone_bricks"' },
  },
  required: ['x', 'y', 'z', 'block'],
};

const fillRegionParams = {
  type: 'object' as const,
  properties: {
    x1: { type: 'integer', description: 'Start X coordinate' },
    y1: { type: 'integer', description: 'Start Y coordinate' },
    z1: { type: 'integer', description: 'Start Z coordinate' },
    x2: { type: 'integer', description: 'End X coordinate (inclusive)' },
    y2: { type: 'integer', description: 'End Y coordinate (inclusive)' },
    z2: { type: 'integer', description: 'End Z coordinate (inclusive)' },
    block: { type: 'string', description: 'Block ID to fill the region with' },
  },
  required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2', 'block'],
};

const removeBlocksParams = {
  type: 'object' as const,
  properties: {
    x1: { type: 'integer', description: 'Start X coordinate' },
    y1: { type: 'integer', description: 'Start Y coordinate' },
    z1: { type: 'integer', description: 'Start Z coordinate' },
    x2: { type: 'integer', description: 'End X coordinate (inclusive)' },
    y2: { type: 'integer', description: 'End Y coordinate (inclusive)' },
    z2: { type: 'integer', description: 'End Z coordinate (inclusive)' },
  },
  required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2'],
};

const replaceBlocksParams = {
  type: 'object' as const,
  properties: {
    x1: { type: 'integer', description: 'Start X coordinate' },
    y1: { type: 'integer', description: 'Start Y coordinate' },
    z1: { type: 'integer', description: 'Start Z coordinate' },
    x2: { type: 'integer', description: 'End X coordinate (inclusive)' },
    y2: { type: 'integer', description: 'End Y coordinate (inclusive)' },
    z2: { type: 'integer', description: 'End Z coordinate (inclusive)' },
    from_block: { type: 'string', description: 'Block ID to search for and replace' },
    to_block: { type: 'string', description: 'Block ID to replace the found blocks with' },
  },
  required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2', 'from_block', 'to_block'],
};

const getStructureInfoParams = {
  type: 'object' as const,
  properties: {},
  required: [],
};

const measureAreaParams = {
  type: 'object' as const,
  properties: {
    x1: { type: 'integer', description: 'Start X coordinate' },
    y1: { type: 'integer', description: 'Start Y coordinate' },
    z1: { type: 'integer', description: 'Start Z coordinate' },
    x2: { type: 'integer', description: 'End X coordinate' },
    y2: { type: 'integer', description: 'End Y coordinate' },
    z2: { type: 'integer', description: 'End Z coordinate' },
  },
  required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2'],
};

// ── OpenAI format ────────────────────────────────────────────

export type OpenAITool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export const STRUCTURE_TOOLS: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'place_block',
      description: 'Place a single block at the specified (x, y, z) position.',
      parameters: placeBlockParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'fill_region',
      description:
        'Fill a rectangular region defined by two corner points (x1,y1,z1) to (x2,y2,z2) with a block. Use for floors, walls, ceilings, and solid volumes.',
      parameters: fillRegionParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_blocks',
      description:
        'Remove (set to air) all blocks within a rectangular region defined by (x1,y1,z1) to (x2,y2,z2).',
      parameters: removeBlocksParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'replace_blocks',
      description:
        'Replace every occurrence of from_block with to_block inside the region (x1,y1,z1)–(x2,y2,z2). Useful for material swaps.',
      parameters: replaceBlocksParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_structure_info',
      description:
        'Return metadata about the current structure: dimensions, block count, and available palette blocks.',
      parameters: getStructureInfoParams,
    },
  },
  {
    type: 'function',
    function: {
      name: 'measure_area',
      description:
        'Calculate width, height, depth, and volume of the region between (x1,y1,z1) and (x2,y2,z2).',
      parameters: measureAreaParams,
    },
  },
];

// ── Anthropic format ─────────────────────────────────────────

export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export const ANTHROPIC_TOOLS: AnthropicTool[] = [
  {
    name: 'place_block',
    description: 'Place a single block at the specified (x, y, z) position.',
    input_schema: placeBlockParams,
  },
  {
    name: 'fill_region',
    description:
      'Fill a rectangular region defined by two corner points (x1,y1,z1) to (x2,y2,z2) with a block.',
    input_schema: fillRegionParams,
  },
  {
    name: 'remove_blocks',
    description:
      'Remove (set to air) all blocks within a rectangular region defined by (x1,y1,z1) to (x2,y2,z2).',
    input_schema: removeBlocksParams,
  },
  {
    name: 'replace_blocks',
    description:
      'Replace every occurrence of from_block with to_block inside the region (x1,y1,z1)–(x2,y2,z2).',
    input_schema: replaceBlocksParams,
  },
  {
    name: 'get_structure_info',
    description:
      'Return metadata about the current structure: dimensions, block count, and available palette blocks.',
    input_schema: getStructureInfoParams,
  },
  {
    name: 'measure_area',
    description:
      'Calculate width, height, depth, and volume of the region between (x1,y1,z1) and (x2,y2,z2).',
    input_schema: measureAreaParams,
  },
];

// ── Palette-augmented helpers ────────────────────────────────

/**
 * Returns the STRUCTURE_TOOLS array with each tool's block parameter
 * enum restricted to the blocks present in the provided palette.
 * This gives the AI a closed vocabulary of valid block IDs.
 */
export function getToolsWithPalette(palette: Palette): OpenAITool[] {
  const blockEnum = palette.blocks.filter((b) => b !== 'minecraft:air');

  return STRUCTURE_TOOLS.map((tool) => {
    const fn = tool.function;
    const props = fn.parameters.properties as Record<string, unknown>;

    // Inject enum into every property that represents a block ID
    const patchedProps: Record<string, unknown> = { ...props };
    for (const key of Object.keys(patchedProps)) {
      if (key === 'block' || key === 'from_block' || key === 'to_block') {
        patchedProps[key] = {
          ...(patchedProps[key] as Record<string, unknown>),
          enum: blockEnum,
          description: `${(patchedProps[key] as Record<string, unknown>).description}. Available: ${blockEnum.slice(0, 20).join(', ')}${blockEnum.length > 20 ? '...' : ''}`,
        };
      }
    }

    return {
      ...tool,
      function: {
        ...fn,
        parameters: {
          ...fn.parameters,
          properties: patchedProps,
        },
      },
    };
  });
}
