// ============================================================
// BlockRegistry — MIneLAb
// Comprehensive registry of ~100 most common Minecraft Java
// Edition blocks with metadata and query utilities.
// ============================================================

// ── Block Definition ─────────────────────────────────────────

export type BlockCategory =
  | 'stone'
  | 'wood'
  | 'ore'
  | 'dirt'
  | 'sand'
  | 'glass'
  | 'wool'
  | 'concrete'
  | 'terracotta'
  | 'metal'
  | 'light'
  | 'plant'
  | 'utility'
  | 'decoration'
  | 'special'
  | 'air';

export interface BlockDefinition {
  id: string;           // Namespaced ID e.g. "minecraft:stone"
  displayName: string;  // Human readable name
  category: BlockCategory;
  color: string;        // Hex color representative of the block
  isOpaque: boolean;    // Does the block block light?
  isSolid: boolean;     // Can players stand on / collide with it?
}

// ── Block Database ────────────────────────────────────────────

const BLOCKS: BlockDefinition[] = [
  // ── Air / Special ────────────────────────────────────────────
  { id: 'minecraft:air',               displayName: 'Air',                  category: 'air',         color: '#00000000', isOpaque: false, isSolid: false },
  { id: 'minecraft:cave_air',          displayName: 'Cave Air',             category: 'air',         color: '#00000000', isOpaque: false, isSolid: false },
  { id: 'minecraft:void_air',          displayName: 'Void Air',             category: 'air',         color: '#00000000', isOpaque: false, isSolid: false },
  { id: 'minecraft:barrier',           displayName: 'Barrier',              category: 'special',     color: '#FF0000',   isOpaque: false, isSolid: true  },
  { id: 'minecraft:structure_void',    displayName: 'Structure Void',       category: 'special',     color: '#8B008B',   isOpaque: false, isSolid: false },

  // ── Stone Family ─────────────────────────────────────────────
  { id: 'minecraft:stone',             displayName: 'Stone',                category: 'stone',       color: '#7F7F7F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:granite',           displayName: 'Granite',              category: 'stone',       color: '#9D6B5E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:polished_granite',  displayName: 'Polished Granite',     category: 'stone',       color: '#9D6B5E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:diorite',           displayName: 'Diorite',              category: 'stone',       color: '#BEBEBE',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:polished_diorite',  displayName: 'Polished Diorite',     category: 'stone',       color: '#BEBEBE',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:andesite',          displayName: 'Andesite',             category: 'stone',       color: '#7C7C7C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:polished_andesite', displayName: 'Polished Andesite',    category: 'stone',       color: '#7C7C7C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:cobblestone',       displayName: 'Cobblestone',          category: 'stone',       color: '#696969',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:mossy_cobblestone', displayName: 'Mossy Cobblestone',    category: 'stone',       color: '#5C6B44',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:stone_bricks',      displayName: 'Stone Bricks',         category: 'stone',       color: '#707070',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:mossy_stone_bricks',displayName: 'Mossy Stone Bricks',   category: 'stone',       color: '#5A6B47',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:cracked_stone_bricks', displayName: 'Cracked Stone Bricks', category: 'stone',   color: '#6B6B6B',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:chiseled_stone_bricks', displayName: 'Chiseled Stone Bricks', category: 'stone', color: '#717171',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:deepslate',         displayName: 'Deepslate',            category: 'stone',       color: '#4A4A52',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:cobbled_deepslate', displayName: 'Cobbled Deepslate',    category: 'stone',       color: '#4C4C54',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:deepslate_bricks',  displayName: 'Deepslate Bricks',     category: 'stone',       color: '#4B4B53',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:deepslate_tiles',   displayName: 'Deepslate Tiles',      category: 'stone',       color: '#393940',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:blackstone',        displayName: 'Blackstone',           category: 'stone',       color: '#2A2630',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:polished_blackstone', displayName: 'Polished Blackstone', category: 'stone',      color: '#2E2A36',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:polished_blackstone_bricks', displayName: 'Polished Blackstone Bricks', category: 'stone', color: '#2C2833', isOpaque: true, isSolid: true },
  { id: 'minecraft:basalt',            displayName: 'Basalt',               category: 'stone',       color: '#515159',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:smooth_basalt',     displayName: 'Smooth Basalt',        category: 'stone',       color: '#4E4E56',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:tuff',              displayName: 'Tuff',                 category: 'stone',       color: '#6B6B5E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:calcite',           displayName: 'Calcite',              category: 'stone',       color: '#DCDCCC',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:obsidian',          displayName: 'Obsidian',             category: 'stone',       color: '#100D17',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:crying_obsidian',   displayName: 'Crying Obsidian',      category: 'stone',       color: '#230A4E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:bedrock',           displayName: 'Bedrock',              category: 'stone',       color: '#555555',   isOpaque: true,  isSolid: true  },

  // ── Dirt / Soil Family ───────────────────────────────────────
  { id: 'minecraft:dirt',              displayName: 'Dirt',                 category: 'dirt',        color: '#8B5E3C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:coarse_dirt',       displayName: 'Coarse Dirt',          category: 'dirt',        color: '#7E5534',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:rooted_dirt',       displayName: 'Rooted Dirt',          category: 'dirt',        color: '#8B5D3A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:grass_block',       displayName: 'Grass Block',          category: 'dirt',        color: '#6AA63F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:podzol',            displayName: 'Podzol',               category: 'dirt',        color: '#6C4B2A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:mycelium',          displayName: 'Mycelium',             category: 'dirt',        color: '#6F6373',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:gravel',            displayName: 'Gravel',               category: 'dirt',        color: '#878787',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:clay',              displayName: 'Clay',                 category: 'dirt',        color: '#9BA3B1',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:mud',               displayName: 'Mud',                  category: 'dirt',        color: '#5A4E45',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:packed_mud',        displayName: 'Packed Mud',           category: 'dirt',        color: '#7A5D46',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:mud_bricks',        displayName: 'Mud Bricks',           category: 'dirt',        color: '#8B6B53',   isOpaque: true,  isSolid: true  },

  // ── Sand Family ───────────────────────────────────────────────
  { id: 'minecraft:sand',              displayName: 'Sand',                 category: 'sand',        color: '#DDD49F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:red_sand',          displayName: 'Red Sand',             category: 'sand',        color: '#C47035',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:sandstone',         displayName: 'Sandstone',            category: 'sand',        color: '#D4C980',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:smooth_sandstone',  displayName: 'Smooth Sandstone',     category: 'sand',        color: '#D6CB82',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:chiseled_sandstone',displayName: 'Chiseled Sandstone',   category: 'sand',        color: '#D4C77A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:red_sandstone',     displayName: 'Red Sandstone',        category: 'sand',        color: '#B5622A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:smooth_red_sandstone', displayName: 'Smooth Red Sandstone', category: 'sand',     color: '#B7652D',   isOpaque: true,  isSolid: true  },

  // ── Wood Family ───────────────────────────────────────────────
  { id: 'minecraft:oak_log',           displayName: 'Oak Log',              category: 'wood',        color: '#8C6B3C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:oak_wood',          displayName: 'Oak Wood',             category: 'wood',        color: '#8C6B3C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:oak_planks',        displayName: 'Oak Planks',           category: 'wood',        color: '#C8A464',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:spruce_log',        displayName: 'Spruce Log',           category: 'wood',        color: '#6B4C2A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:spruce_planks',     displayName: 'Spruce Planks',        category: 'wood',        color: '#7D5A34',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:birch_log',         displayName: 'Birch Log',            category: 'wood',        color: '#CFCFB5',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:birch_planks',      displayName: 'Birch Planks',         category: 'wood',        color: '#D7C185',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:jungle_log',        displayName: 'Jungle Log',           category: 'wood',        color: '#5D4A28',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:jungle_planks',     displayName: 'Jungle Planks',        category: 'wood',        color: '#A87444',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:acacia_log',        displayName: 'Acacia Log',           category: 'wood',        color: '#6F5030',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:acacia_planks',     displayName: 'Acacia Planks',        category: 'wood',        color: '#B36939',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:dark_oak_log',      displayName: 'Dark Oak Log',         category: 'wood',        color: '#3C2B14',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:dark_oak_planks',   displayName: 'Dark Oak Planks',      category: 'wood',        color: '#4A3418',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:mangrove_log',      displayName: 'Mangrove Log',         category: 'wood',        color: '#7C3D2E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:mangrove_planks',   displayName: 'Mangrove Planks',      category: 'wood',        color: '#7E3D2D',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:cherry_log',        displayName: 'Cherry Log',           category: 'wood',        color: '#B97B9A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:cherry_planks',     displayName: 'Cherry Planks',        category: 'wood',        color: '#E3A49A',   isOpaque: true,  isSolid: true  },

  // ── Ores ─────────────────────────────────────────────────────
  { id: 'minecraft:coal_ore',          displayName: 'Coal Ore',             category: 'ore',         color: '#3C3C3C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:deepslate_coal_ore',displayName: 'Deepslate Coal Ore',   category: 'ore',         color: '#363638',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:iron_ore',          displayName: 'Iron Ore',             category: 'ore',         color: '#93786B',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:deepslate_iron_ore',displayName: 'Deepslate Iron Ore',   category: 'ore',         color: '#7E6A60',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:gold_ore',          displayName: 'Gold Ore',             category: 'ore',         color: '#FCEE4B',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:deepslate_gold_ore',displayName: 'Deepslate Gold Ore',   category: 'ore',         color: '#D9CA42',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:diamond_ore',       displayName: 'Diamond Ore',          category: 'ore',         color: '#4DD9D3',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:deepslate_diamond_ore', displayName: 'Deepslate Diamond Ore', category: 'ore',    color: '#40C0BA',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:emerald_ore',       displayName: 'Emerald Ore',          category: 'ore',         color: '#3FB650',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:lapis_ore',         displayName: 'Lapis Ore',            category: 'ore',         color: '#1B55AC',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:redstone_ore',      displayName: 'Redstone Ore',         category: 'ore',         color: '#8B0000',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:copper_ore',        displayName: 'Copper Ore',           category: 'ore',         color: '#B06040',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:nether_quartz_ore', displayName: 'Nether Quartz Ore',    category: 'ore',         color: '#DDD5C9',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:nether_gold_ore',   displayName: 'Nether Gold Ore',      category: 'ore',         color: '#EE9A1C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:ancient_debris',    displayName: 'Ancient Debris',       category: 'ore',         color: '#5E3A2A',   isOpaque: true,  isSolid: true  },

  // ── Metal Blocks ─────────────────────────────────────────────
  { id: 'minecraft:iron_block',        displayName: 'Iron Block',           category: 'metal',       color: '#D8D8D8',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:gold_block',        displayName: 'Gold Block',           category: 'metal',       color: '#F5E23C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:diamond_block',     displayName: 'Diamond Block',        category: 'metal',       color: '#57EDDB',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:emerald_block',     displayName: 'Emerald Block',        category: 'metal',       color: '#2FB54A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:netherite_block',   displayName: 'Netherite Block',      category: 'metal',       color: '#42393D',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:lapis_block',       displayName: 'Lapis Block',          category: 'metal',       color: '#1B55AC',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:redstone_block',    displayName: 'Redstone Block',       category: 'metal',       color: '#C21B0A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:copper_block',      displayName: 'Copper Block',         category: 'metal',       color: '#CF7E52',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:exposed_copper',    displayName: 'Exposed Copper',       category: 'metal',       color: '#A9806A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:weathered_copper',  displayName: 'Weathered Copper',     category: 'metal',       color: '#6A9E7F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:oxidized_copper',   displayName: 'Oxidized Copper',      category: 'metal',       color: '#5BAA86',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:quartz_block',      displayName: 'Quartz Block',         category: 'metal',       color: '#E8E1D5',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:smooth_quartz',     displayName: 'Smooth Quartz',        category: 'metal',       color: '#E8E1D5',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:quartz_bricks',     displayName: 'Quartz Bricks',        category: 'metal',       color: '#E5DDCE',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:chiseled_quartz_block', displayName: 'Chiseled Quartz Block', category: 'metal',  color: '#E6DDD0',   isOpaque: true,  isSolid: true  },

  // ── Glass ─────────────────────────────────────────────────────
  { id: 'minecraft:glass',             displayName: 'Glass',                category: 'glass',       color: '#C0ECEC',   isOpaque: false, isSolid: true  },
  { id: 'minecraft:white_stained_glass',    displayName: 'White Stained Glass',    category: 'glass', color: '#F9FEFF', isOpaque: false, isSolid: true },
  { id: 'minecraft:orange_stained_glass',   displayName: 'Orange Stained Glass',   category: 'glass', color: '#F17D20', isOpaque: false, isSolid: true },
  { id: 'minecraft:magenta_stained_glass',  displayName: 'Magenta Stained Glass',  category: 'glass', color: '#BF49BF', isOpaque: false, isSolid: true },
  { id: 'minecraft:light_blue_stained_glass', displayName: 'Light Blue Stained Glass', category: 'glass', color: '#6699D8', isOpaque: false, isSolid: true },
  { id: 'minecraft:yellow_stained_glass',   displayName: 'Yellow Stained Glass',   category: 'glass', color: '#F2B418', isOpaque: false, isSolid: true },
  { id: 'minecraft:lime_stained_glass',     displayName: 'Lime Stained Glass',     category: 'glass', color: '#7EC41F', isOpaque: false, isSolid: true },
  { id: 'minecraft:pink_stained_glass',     displayName: 'Pink Stained Glass',     category: 'glass', color: '#ED7EA3', isOpaque: false, isSolid: true },
  { id: 'minecraft:gray_stained_glass',     displayName: 'Gray Stained Glass',     category: 'glass', color: '#4B4F52', isOpaque: false, isSolid: true },
  { id: 'minecraft:light_gray_stained_glass', displayName: 'Light Gray Stained Glass', category: 'glass', color: '#9B9B9B', isOpaque: false, isSolid: true },
  { id: 'minecraft:cyan_stained_glass',     displayName: 'Cyan Stained Glass',     category: 'glass', color: '#167A8A', isOpaque: false, isSolid: true },
  { id: 'minecraft:purple_stained_glass',   displayName: 'Purple Stained Glass',   category: 'glass', color: '#7D2D9C', isOpaque: false, isSolid: true },
  { id: 'minecraft:blue_stained_glass',     displayName: 'Blue Stained Glass',     category: 'glass', color: '#2E399A', isOpaque: false, isSolid: true },
  { id: 'minecraft:brown_stained_glass',    displayName: 'Brown Stained Glass',    category: 'glass', color: '#724728', isOpaque: false, isSolid: true },
  { id: 'minecraft:green_stained_glass',    displayName: 'Green Stained Glass',    category: 'glass', color: '#546B1E', isOpaque: false, isSolid: true },
  { id: 'minecraft:red_stained_glass',      displayName: 'Red Stained Glass',      category: 'glass', color: '#993333', isOpaque: false, isSolid: true },
  { id: 'minecraft:black_stained_glass',    displayName: 'Black Stained Glass',    category: 'glass', color: '#141519', isOpaque: false, isSolid: true },
  { id: 'minecraft:tinted_glass',           displayName: 'Tinted Glass',           category: 'glass', color: '#31282F', isOpaque: true,  isSolid: true },

  // ── Wool ─────────────────────────────────────────────────────
  { id: 'minecraft:white_wool',        displayName: 'White Wool',           category: 'wool',        color: '#F0F0F0',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:orange_wool',       displayName: 'Orange Wool',          category: 'wool',        color: '#F2801F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:magenta_wool',      displayName: 'Magenta Wool',         category: 'wool',        color: '#BE49BF',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:light_blue_wool',   displayName: 'Light Blue Wool',      category: 'wool',        color: '#3AB3DA',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:yellow_wool',       displayName: 'Yellow Wool',          category: 'wool',        color: '#F9C629',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:lime_wool',         displayName: 'Lime Wool',            category: 'wool',        color: '#79C120',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:pink_wool',         displayName: 'Pink Wool',            category: 'wool',        color: '#F2809A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:gray_wool',         displayName: 'Gray Wool',            category: 'wool',        color: '#474F52',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:light_gray_wool',   displayName: 'Light Gray Wool',      category: 'wool',        color: '#9D9D97',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:cyan_wool',         displayName: 'Cyan Wool',            category: 'wool',        color: '#168C94',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:purple_wool',       displayName: 'Purple Wool',          category: 'wool',        color: '#832391',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:blue_wool',         displayName: 'Blue Wool',            category: 'wool',        color: '#3C44A9',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:brown_wool',        displayName: 'Brown Wool',           category: 'wool',        color: '#815631',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:green_wool',        displayName: 'Green Wool',           category: 'wool',        color: '#5D7C15',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:red_wool',          displayName: 'Red Wool',             category: 'wool',        color: '#A2292A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:black_wool',        displayName: 'Black Wool',           category: 'wool',        color: '#1D1D21',   isOpaque: true,  isSolid: true  },

  // ── Concrete ─────────────────────────────────────────────────
  { id: 'minecraft:white_concrete',    displayName: 'White Concrete',       category: 'concrete',    color: '#CFD4D6',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:orange_concrete',   displayName: 'Orange Concrete',      category: 'concrete',    color: '#E06100',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:magenta_concrete',  displayName: 'Magenta Concrete',     category: 'concrete',    color: '#AB2997',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:light_blue_concrete', displayName: 'Light Blue Concrete', category: 'concrete',   color: '#2489C7',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:yellow_concrete',   displayName: 'Yellow Concrete',      category: 'concrete',    color: '#F2B401',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:lime_concrete',     displayName: 'Lime Concrete',        category: 'concrete',    color: '#5EA819',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:pink_concrete',     displayName: 'Pink Concrete',        category: 'concrete',    color: '#D5658B',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:gray_concrete',     displayName: 'Gray Concrete',        category: 'concrete',    color: '#373E42',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:light_gray_concrete', displayName: 'Light Gray Concrete', category: 'concrete',   color: '#8E8E86',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:cyan_concrete',     displayName: 'Cyan Concrete',        category: 'concrete',    color: '#158891',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:purple_concrete',   displayName: 'Purple Concrete',      category: 'concrete',    color: '#641F9C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:blue_concrete',     displayName: 'Blue Concrete',        category: 'concrete',    color: '#2D2F8F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:brown_concrete',    displayName: 'Brown Concrete',       category: 'concrete',    color: '#603A1D',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:green_concrete',    displayName: 'Green Concrete',       category: 'concrete',    color: '#495B23',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:red_concrete',      displayName: 'Red Concrete',         category: 'concrete',    color: '#8E2020',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:black_concrete',    displayName: 'Black Concrete',       category: 'concrete',    color: '#080A0F',   isOpaque: true,  isSolid: true  },

  // ── Terracotta ────────────────────────────────────────────────
  { id: 'minecraft:terracotta',         displayName: 'Terracotta',           category: 'terracotta',  color: '#9A5C3B',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:white_terracotta',   displayName: 'White Terracotta',     category: 'terracotta',  color: '#D1B1A1',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:orange_terracotta',  displayName: 'Orange Terracotta',    category: 'terracotta',  color: '#A0542B',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:yellow_terracotta',  displayName: 'Yellow Terracotta',    category: 'terracotta',  color: '#C6892E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:red_terracotta',     displayName: 'Red Terracotta',       category: 'terracotta',  color: '#8E3B2E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:brown_terracotta',   displayName: 'Brown Terracotta',     category: 'terracotta',  color: '#4D3224',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:green_terracotta',   displayName: 'Green Terracotta',     category: 'terracotta',  color: '#4D5724',   isOpaque: true,  isSolid: true  },

  // ── Light / Glowing ───────────────────────────────────────────
  { id: 'minecraft:glowstone',          displayName: 'Glowstone',            category: 'light',       color: '#F5C96E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:sea_lantern',        displayName: 'Sea Lantern',          category: 'light',       color: '#AFE2E4',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:shroomlight',        displayName: 'Shroomlight',          category: 'light',       color: '#F4A147',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:lantern',            displayName: 'Lantern',              category: 'light',       color: '#E3A430',   isOpaque: false, isSolid: false },
  { id: 'minecraft:soul_lantern',       displayName: 'Soul Lantern',         category: 'light',       color: '#44BBCC',   isOpaque: false, isSolid: false },
  { id: 'minecraft:torch',              displayName: 'Torch',                category: 'light',       color: '#FFDD55',   isOpaque: false, isSolid: false },
  { id: 'minecraft:soul_torch',         displayName: 'Soul Torch',           category: 'light',       color: '#44BBCC',   isOpaque: false, isSolid: false },
  { id: 'minecraft:redstone_lamp',      displayName: 'Redstone Lamp',        category: 'light',       color: '#C56B1E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:amethyst_block',     displayName: 'Amethyst Block',       category: 'light',       color: '#8A5DC8',   isOpaque: true,  isSolid: true  },

  // ── Plants ────────────────────────────────────────────────────
  { id: 'minecraft:oak_leaves',         displayName: 'Oak Leaves',           category: 'plant',       color: '#4C8230',   isOpaque: false, isSolid: false },
  { id: 'minecraft:spruce_leaves',      displayName: 'Spruce Leaves',        category: 'plant',       color: '#3E6A30',   isOpaque: false, isSolid: false },
  { id: 'minecraft:birch_leaves',       displayName: 'Birch Leaves',         category: 'plant',       color: '#6A9F3C',   isOpaque: false, isSolid: false },
  { id: 'minecraft:jungle_leaves',      displayName: 'Jungle Leaves',        category: 'plant',       color: '#327A1F',   isOpaque: false, isSolid: false },
  { id: 'minecraft:acacia_leaves',      displayName: 'Acacia Leaves',        category: 'plant',       color: '#6FA83E',   isOpaque: false, isSolid: false },
  { id: 'minecraft:dark_oak_leaves',    displayName: 'Dark Oak Leaves',      category: 'plant',       color: '#305020',   isOpaque: false, isSolid: false },
  { id: 'minecraft:grass',              displayName: 'Grass',                category: 'plant',       color: '#7EC850',   isOpaque: false, isSolid: false },
  { id: 'minecraft:fern',               displayName: 'Fern',                 category: 'plant',       color: '#3A8A2C',   isOpaque: false, isSolid: false },
  { id: 'minecraft:vine',               displayName: 'Vine',                 category: 'plant',       color: '#4A8C30',   isOpaque: false, isSolid: false },

  // ── Utility ───────────────────────────────────────────────────
  { id: 'minecraft:crafting_table',     displayName: 'Crafting Table',       category: 'utility',     color: '#8B5E3C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:furnace',            displayName: 'Furnace',              category: 'utility',     color: '#777070',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:blast_furnace',      displayName: 'Blast Furnace',        category: 'utility',     color: '#6B6868',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:smoker',             displayName: 'Smoker',               category: 'utility',     color: '#78644C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:chest',              displayName: 'Chest',                category: 'utility',     color: '#8C6130',   isOpaque: false, isSolid: true  },
  { id: 'minecraft:barrel',             displayName: 'Barrel',               category: 'utility',     color: '#6B4F28',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:bookshelf',          displayName: 'Bookshelf',            category: 'utility',     color: '#85622E',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:enchanting_table',   displayName: 'Enchanting Table',     category: 'utility',     color: '#620808',   isOpaque: false, isSolid: true  },
  { id: 'minecraft:anvil',              displayName: 'Anvil',                category: 'utility',     color: '#3A3A3A',   isOpaque: false, isSolid: true  },
  { id: 'minecraft:beacon',             displayName: 'Beacon',               category: 'utility',     color: '#8DFFFF',   isOpaque: false, isSolid: true  },
  { id: 'minecraft:brewing_stand',      displayName: 'Brewing Stand',        category: 'utility',     color: '#5A4030',   isOpaque: false, isSolid: false },
  { id: 'minecraft:cauldron',           displayName: 'Cauldron',             category: 'utility',     color: '#434343',   isOpaque: false, isSolid: true  },

  // ── Decoration ────────────────────────────────────────────────
  { id: 'minecraft:bricks',            displayName: 'Bricks',               category: 'decoration',  color: '#9E4E3C',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:nether_bricks',     displayName: 'Nether Bricks',        category: 'decoration',  color: '#2C1518',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:red_nether_bricks', displayName: 'Red Nether Bricks',    category: 'decoration',  color: '#570D0D',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:end_stone',         displayName: 'End Stone',            category: 'decoration',  color: '#DADB8F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:end_stone_bricks',  displayName: 'End Stone Bricks',     category: 'decoration',  color: '#D9DA8B',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:purpur_block',      displayName: 'Purpur Block',         category: 'decoration',  color: '#9F6BA0',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:purpur_pillar',     displayName: 'Purpur Pillar',        category: 'decoration',  color: '#AC7EAD',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:prismarine',        displayName: 'Prismarine',           category: 'decoration',  color: '#6BAD9D',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:prismarine_bricks', displayName: 'Prismarine Bricks',    category: 'decoration',  color: '#64C2AB',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:dark_prismarine',   displayName: 'Dark Prismarine',      category: 'decoration',  color: '#356354',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:bone_block',        displayName: 'Bone Block',           category: 'decoration',  color: '#E0DCC3',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:snow_block',        displayName: 'Snow Block',           category: 'decoration',  color: '#F0F4F7',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:ice',               displayName: 'Ice',                  category: 'decoration',  color: '#A6CCFF',   isOpaque: false, isSolid: true  },
  { id: 'minecraft:packed_ice',        displayName: 'Packed Ice',           category: 'decoration',  color: '#7AAFFF',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:blue_ice',          displayName: 'Blue Ice',             category: 'decoration',  color: '#77A9FF',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:honeycomb_block',   displayName: 'Honeycomb Block',      category: 'decoration',  color: '#E7901D',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:magma_block',       displayName: 'Magma Block',          category: 'decoration',  color: '#8C2D0A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:soul_sand',         displayName: 'Soul Sand',            category: 'decoration',  color: '#4A3830',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:soul_soil',         displayName: 'Soul Soil',            category: 'decoration',  color: '#4A3830',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:netherrack',        displayName: 'Netherrack',           category: 'decoration',  color: '#6E2828',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:crimson_stem',      displayName: 'Crimson Stem',         category: 'decoration',  color: '#6E2040',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:warped_stem',       displayName: 'Warped Stem',          category: 'decoration',  color: '#16736F',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:crimson_planks',    displayName: 'Crimson Planks',       category: 'decoration',  color: '#6C2040',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:warped_planks',     displayName: 'Warped Planks',        category: 'decoration',  color: '#2C8578',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:nether_wart_block', displayName: 'Nether Wart Block',    category: 'decoration',  color: '#6D0D0D',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:warped_wart_block', displayName: 'Warped Wart Block',    category: 'decoration',  color: '#156964',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:sponge',            displayName: 'Sponge',               category: 'decoration',  color: '#C5C04A',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:wet_sponge',        displayName: 'Wet Sponge',           category: 'decoration',  color: '#A0A033',   isOpaque: true,  isSolid: true  },
  { id: 'minecraft:hay_block',         displayName: 'Hay Block',            category: 'decoration',  color: '#B79D1C',   isOpaque: true,  isSolid: true  },
];

// Build index maps for O(1) lookup
const _byId   = new Map<string, BlockDefinition>(BLOCKS.map(b => [b.id, b]));
const _byCat  = new Map<BlockCategory, BlockDefinition[]>();

for (const block of BLOCKS) {
  const list = _byCat.get(block.category) ?? [];
  list.push(block);
  _byCat.set(block.category, list);
}

// ── Public API ────────────────────────────────────────────────

export class BlockRegistry {
  /**
   * Retrieve a single block definition by its namespaced ID.
   * Returns `undefined` when the ID is not in the registry.
   */
  static getBlock(id: string): BlockDefinition | undefined {
    return _byId.get(id);
  }

  /** Returns a shallow copy of all block definitions. */
  static getAllBlocks(): BlockDefinition[] {
    return [...BLOCKS];
  }

  /** Returns all blocks belonging to a given category. */
  static getByCategory(category: BlockCategory): BlockDefinition[] {
    return [...(_byCat.get(category) ?? [])];
  }

  /**
   * Case-insensitive substring search across block ID and displayName.
   * @param query - Search term
   * @returns Matched block definitions
   */
  static search(query: string): BlockDefinition[] {
    const q = query.toLowerCase().trim();
    if (!q) return BlockRegistry.getAllBlocks();
    return BLOCKS.filter(
      b =>
        b.id.toLowerCase().includes(q) ||
        b.displayName.toLowerCase().includes(q)
    );
  }

  /**
   * Checks if a given namespaced block ID exists in the registry.
   */
  static isValidBlock(id: string): boolean {
    return _byId.has(id);
  }
}

// ── Default Palette ───────────────────────────────────────────

/**
 * The 80 most commonly used building blocks, suitable as a
 * default block palette for new structures and AI prompts.
 */
export const BLOCK_PALETTE_DEFAULT: string[] = [
  'minecraft:stone',
  'minecraft:granite',
  'minecraft:polished_granite',
  'minecraft:diorite',
  'minecraft:polished_diorite',
  'minecraft:andesite',
  'minecraft:polished_andesite',
  'minecraft:cobblestone',
  'minecraft:mossy_cobblestone',
  'minecraft:stone_bricks',
  'minecraft:mossy_stone_bricks',
  'minecraft:cracked_stone_bricks',
  'minecraft:chiseled_stone_bricks',
  'minecraft:deepslate',
  'minecraft:cobbled_deepslate',
  'minecraft:deepslate_bricks',
  'minecraft:deepslate_tiles',
  'minecraft:blackstone',
  'minecraft:polished_blackstone_bricks',
  'minecraft:obsidian',
  'minecraft:bedrock',
  'minecraft:dirt',
  'minecraft:grass_block',
  'minecraft:gravel',
  'minecraft:sand',
  'minecraft:sandstone',
  'minecraft:smooth_sandstone',
  'minecraft:red_sandstone',
  'minecraft:oak_log',
  'minecraft:oak_planks',
  'minecraft:spruce_log',
  'minecraft:spruce_planks',
  'minecraft:birch_log',
  'minecraft:birch_planks',
  'minecraft:jungle_planks',
  'minecraft:acacia_planks',
  'minecraft:dark_oak_planks',
  'minecraft:mangrove_planks',
  'minecraft:cherry_planks',
  'minecraft:iron_block',
  'minecraft:gold_block',
  'minecraft:diamond_block',
  'minecraft:netherite_block',
  'minecraft:quartz_block',
  'minecraft:smooth_quartz',
  'minecraft:copper_block',
  'minecraft:oxidized_copper',
  'minecraft:glass',
  'minecraft:tinted_glass',
  'minecraft:white_wool',
  'minecraft:orange_wool',
  'minecraft:yellow_wool',
  'minecraft:lime_wool',
  'minecraft:cyan_wool',
  'minecraft:blue_wool',
  'minecraft:red_wool',
  'minecraft:black_wool',
  'minecraft:white_concrete',
  'minecraft:orange_concrete',
  'minecraft:yellow_concrete',
  'minecraft:lime_concrete',
  'minecraft:cyan_concrete',
  'minecraft:blue_concrete',
  'minecraft:red_concrete',
  'minecraft:black_concrete',
  'minecraft:gray_concrete',
  'minecraft:light_gray_concrete',
  'minecraft:terracotta',
  'minecraft:white_terracotta',
  'minecraft:orange_terracotta',
  'minecraft:red_terracotta',
  'minecraft:bricks',
  'minecraft:nether_bricks',
  'minecraft:end_stone_bricks',
  'minecraft:purpur_block',
  'minecraft:prismarine',
  'minecraft:glowstone',
  'minecraft:sea_lantern',
  'minecraft:redstone_lamp',
];
