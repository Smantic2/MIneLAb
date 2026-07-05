# Roadmap — MIneLAb

Phases and subphases for building the application. No time estimates — ordered by dependency and priority.

---

## Phase 1: Foundation

### 1.1 Project Setup
- [ ] Initialize monorepo (Vite + TypeScript)
- [ ] Configure ESLint, Prettier, Husky
- [ ] Set up React + TypeScript + Tailwind
- [ ] Set up React Three Fiber + Three.js
- [ ] Set up Zustand for state management
- [ ] Create folder structure per architecture doc
- [ ] Set up Vitest for unit testing
- [ ] Set up Playwright for E2E testing

### 1.2 Core Data Structures
- [ ] Implement Vec3 type
- [ ] Implement Block and Palette types
- [ ] Implement StructureData with chunk-based storage
- [ ] Implement ChunkData with Uint8Array storage
- [ ] Implement palette index mapping (block ID ↔ index)
- [ ] Write unit tests for all data structures

### 1.3 Block Registry
- [ ] Create Minecraft block registry (all Java Edition blocks)
- [ ] Map block IDs to display names
- [ ] Map blocks to texture atlas coordinates
- [ ] Define transparency/opacity per block type
- [ ] Define block categories (solid, transparent, liquid, etc.)

### 1.4 Basic Voxel Renderer
- [ ] Implement single-block mesh rendering (naive)
- [ ] Implement chunk-based rendering
- [ ] Implement frustum culling
- [ ] Add basic orbit camera
- [ ] Add grid overlay
- [ ] Add coordinate axes display

---

## Phase 2: 3D Editor Core

### 2.1 Greedy Meshing
- [ ] Implement face culling (don't render hidden faces)
- [ ] Implement greedy meshing algorithm per chunk
- [ ] Integrate with chunk dirty-flag system
- [ ] Benchmark: measure triangle reduction vs naive
- [ ] Offload meshing to WebWorker (optional optimization)

### 2.2 Texture Atlas
- [ ] Download/extract Minecraft block textures
- [ ] Generate texture atlas (all blocks in one image)
- [ ] Map block faces to atlas UV coordinates
- [ ] Handle animated textures (water, lava, fire) — basic support
- [ ] Cache atlas for fast loading

### 2.3 Camera System
- [ ] Orbit camera (left-click drag + scroll zoom)
- [ ] First-person fly camera (WASD + mouse look)
- [ ] Isometric view mode
- [ ] Smooth transitions between camera modes
- [ ] Focus-on-point (double-click)
- [ ] Keyboard shortcuts for camera reset

### 2.4 Block Selection
- [x] Click-to-select single block (raycasting)
- [ ] Box selection (drag to create rectangular region)
- [x] Visual selection overlay (outline/highlight)
- [ ] Selection info panel (coordinates, block type, count)
- [ ] Multi-select with Shift+click

### 2.5 View Modes
- [x] Solid mode (default)
- [x] Wireframe mode toggle
- [x] X-ray mode (semi-transparent blocks)
- [ ] Chunk boundary overlay toggle
- [ ] Layer visibility toggle (hide Y-levels)
- [x] Coordinate display overlay

### 2.6 Editing Tools
- [x] Place block (click to add)
- [x] Remove block (delete key)
- [x] Replace material (swap block type in selection)
- [x] Undo/Redo system (100-step history stack)
- [x] Undo/Redo buttons in toolbar

---

## Phase 3: AI Integration

### 3.1 Provider Interface
- [ ] Define AIProvider interface
- [ ] Implement OpenAI provider
- [ ] Implement Anthropic provider
- [ ] Implement Ollama provider (local)
- [ ] Implement Generic provider (OpenAI-compatible)
- [ ] Provider selection UI in settings
- [ ] API key input and validation
- [ ] Test connection button

### 3.2 Prompt Engineering
- [ ] Write base system prompt for structure generation
- [ ] Include block palette context in prompts
- [ ] Write generation prompt template
- [ ] Write iteration/diff prompt template
- [ ] Write analysis prompt template
- [ ] Token counting utility

### 3.3 MCP Tool Definitions
- [ ] Define place_block tool schema
- [ ] Define fill_region tool schema
- [ ] Define remove_blocks tool schema
- [ ] Define replace_blocks tool schema
- [ ] Define get_structure_info tool schema
- [ ] Define measure_area tool schema
- [ ] Define analyze_structure tool schema
- [ ] Register tools with AI providers via function calling

### 3.4 AI Chat Interface
- [ ] Chat panel component
- [ ] Message input with send button
- [ ] Display user and AI messages
- [ ] Show tool calls and results
- [ ] Loading indicator during generation
- [ ] Token usage display per message
- [ ] Error handling and retry

### 3.5 Structure Generation
- [ ] Send prompt to AI with tool definitions
- [ ] Parse AI tool call responses
- [ ] Convert tool calls to StructureData
- [ ] Validate generated blocks against palette
- [ ] Render result in 3D editor
- [ ] Handle generation errors gracefully

### 3.6 Iterative Diff Editing
- [ ] Send current structure summary to AI
- [ ] Include user instruction in prompt
- [ ] Parse diff response (add/remove/replace)
- [ ] Apply diff to StructureData
- [ ] Re-mesh only affected chunks
- [ ] Show diff preview before applying (optional)

---

## Phase 4: Export System

### 4.1 Sponge Schematic (.schem) Export
- [x] Build palette mapping
- [x] Serialize blocks in XZY order
- [x] Write NBT compound structure
- [x] GZIP compress
- [x] Generate downloadable .schem file
- [ ] Verify with WorldEdit

### 4.2 Litematica (.litematic) Export
- [x] Write Litematica NBT structure
- [x] Handle palette and block states
- [x] GZIP compress
- [x] Generate downloadable .litematic file
- [ ] Verify with Litematica mod

### 4.3 Structure Block (.nbt) Export
- [x] Write vanilla structure block NBT format
- [x] Handle 64x64x64 size limit (warn user)
- [x] Generate downloadable .nbt file

### 4.4 Command Export
- [x] Generate //fill commands for WorldEdit
- [x] Generate /setblock commands
- [x] Generate .mcfunction file
- [ ] Group commands by region for efficiency

### 4.5 3D Model Export
- [x] Export to GLB/GLTF format
- [ ] Export to OBJ format
- [x] Map block textures to materials
- [ ] Generate UV coordinates from greedy meshing

### 4.6 Image Export
- [x] Generate layer-by-layer PNG images
- [x] Include block legend
- [x] Include dimensions and scale

### 4.7 Export Dialog
- [x] Format selection dropdown
- [x] Preview file size estimate
- [x] Download button
- [x] Copy-to-clipboard for command exports

---

## Phase 5: Import System

### 5.1 NBT Parser
- [x] Implement or integrate NBT parser (pure JS)
- [x] Handle all NBT tag types
- [x] GZIP decompression support
- [x] Error handling for malformed files

### 5.2 Sponge Schematic Import
- [x] Parse .schem NBT structure
- [x] Extract palette and block data
- [x] Convert to StructureData

### 5.3 Litematica Import
- [x] Parse .litematic NBT structure
- [x] Extract palette, block states, and entities
- [x] Convert to StructureData

### 5.4 Structure Block Import
- [x] Parse .nbt structure block format
- [x] Convert to StructureData

### 5.5 Legacy Schematic Import
- [ ] Parse .schematic (MCEdit format)
- [ ] Convert to StructureData

### 5.6 Import UI
- [x] Drag-and-drop file zone
- [x] File picker button
- [x] Format auto-detection
- [ ] Import progress indicator
- [x] Error messages for invalid files
- [ ] Size warning for very large structures

---

## Phase 6: Version History

### 6.1 History Manager
- [ ] Implement undo/redo stack
- [ ] Store diffs per action
- [ ] Maximum 100 undo steps
- [ ] Clear history on new project

### 6.2 Named Versions
- [ ] Auto-save version on AI interaction
- [ ] Manual version naming dialog
- [ ] Version list panel with timestamps
- [ ] Click to restore any version
- [ ] Version metadata (author, description)

### 6.3 Version Comparison
- [ ] Select two versions to compare
- [ ] Diff view (added green, removed red)
- [ ] Statistics comparison (block count, dimensions)
- [ ] Navigate between changes

### 6.4 Branching
- [ ] Create branch from any version
- [ ] Switch between branches
- [ ] Branch list with names
- [ ] Visual branch tree display

---

## Phase 7: Survival Mode

### 7.1 Material Calculator
- [ ] Count blocks by type in structure
- [ ] Calculate stacks (count / 64)
- [ ] Sort by count or type
- [ ] Export as text/CSV

### 7.2 Build Time Estimate
- [ ] Estimate based on block count
- [ ] Account for block type placement difficulty
- [ ] Show in hours:minutes format

### 7.3 Step-by-Step Builder
- [ ] Break structure by Y-level
- [ ] Generate layer-by-layer instructions
- [ ] Navigate layers in 3D view
- [ ] Highlight current layer
- [ ] Optional PDF export

---

## Phase 8: Structure Analysis

### 8.1 Linter Engine
- [ ] Detect floating blocks (no support below)
- [ ] Detect mob-spawnable dark areas
- [ ] Detect water/lava flow issues
- [ ] Detect disconnected stairs/paths
- [ ] Severity levels (error, warning, info)
- [ ] Click issue to navigate to location

### 8.2 Statistics Dashboard
- [ ] Total block count
- [ ] Unique block types
- [ ] Dimensions and bounding box
- [ ] Density calculation
- [ ] Block distribution chart

### 8.3 AI Analysis
- [ ] Send structure to AI for analysis
- [ ] AI identifies structural problems
- [ ] AI suggests improvements
- [ ] Display analysis report in UI

---

## Phase 9: Community Library

### 9.1 Library UI
- [ ] Gallery view with thumbnails
- [ ] Filter by tags
- [ ] Search by name
- [ ] Sort by date/popularity/rating
- [ ] Structure detail page

### 9.2 Publishing
- [ ] Publish dialog with metadata
- [ ] Add name, description, tags
- [ ] Auto-generate thumbnail from 3D view
- [ ] Upload to community database

### 9.3 Forking
- [ ] Fork button on library entry
- [ ] Create copy in user's projects
- [ ] Credit original author
- [ ] Independent version history

### 9.4 Backend (Optional)
- [ ] Database for structure storage
- [ ] User authentication
- [ ] API for CRUD operations
- [ ] CDN for thumbnail delivery

---

## Phase 10: Prompt Templates

### 10.1 Template System
- [ ] Template data format definition
- [ ] Template loading and caching
- [ ] Template selection UI
- [ ] Template preview

### 10.2 Built-in Templates
- [ ] Castle (Medieval, Fantasy, Japanese)
- [ ] Temple (Greek, Buddhist, Egyptian)
- [ ] Village (Medieval, Modern, Sci-Fi)
- [ ] Dungeon (Dungeon, Cave, Mineshaft)
- [ ] Nature (Tree, Bridge, Waterfall)
- [ ] Building (House, Skyscraper, Cabin)
- [ ] Vehicle (Spaceship, Airship, Car)
- [ ] Misc (Monument, Park, Farm)

---

## Phase 11: MCP Integration

### 11.1 MCP Server
- [ ] Implement MCP server in browser (WebSocket)
- [ ] Register all structure manipulation tools
- [ ] Handle tool calls from external AI clients
- [ ] Return execution results

### 11.2 MCP Client Enhancement
- [ ] Dynamic tool registration based on current state
- [ ] Tool call visualization in chat
- [ ] Tool permission management

---

## Phase 12: Plugin System

### 12.1 Plugin SDK
- [ ] Define PluginManifest type
- [ ] Define PluginAPI interface
- [ ] Create plugin loader (sandboxed execution)
- [ ] Plugin permission system

### 12.2 Plugin API
- [ ] Structure read/write access
- [ ] Selection read/write access
- [ ] UI panel registration
- [ ] Tool registration
- [ ] Event system (onStructureChange, etc.)
- [ ] AI request access

### 12.3 Built-in Plugins
- [ ] Brush Tool (paint blocks with brush)
- [ ] Terrain Generator (perlin noise terrain)
- [ ] Roof Generator (various roof styles)
- [ ] Tree Generator (procedural trees)
- [ ] Road Generator (connect points with roads)
- [ ] Wall Generator (circular/rectangular walls)

### 12.4 Plugin Gallery
- [ ] Plugin marketplace UI
- [ ] Install/enable/disable plugins
- [ ] Plugin settings panel

---

## Phase 13: Polish & Optimization

### 13.1 Performance
- [ ] Profile and optimize greedy meshing
- [ ] Implement LOD for large structures
- [ ] Optimize memory usage for 500k+ blocks
- [ ] Benchmark all operations
- [ ] WebWorker for mesh generation

### 13.2 UX Polish
- [ ] Keyboard shortcuts for all tools
- [ ] Tooltips for all buttons
- [ ] Loading states and progress indicators
- [ ] Error boundaries and graceful failures
- [ ] Responsive layout (desktop + tablet)
- [ ] Dark mode / Light mode

### 13.3 Accessibility
- [ ] Screen reader support
- [ ] Keyboard navigation
- [ ] High contrast mode
- [ ] Configurable shortcuts

### 13.4 Documentation
- [ ] User guide / tutorial
- [ ] API reference
- [ ] Plugin development guide
- [ ] Contributing guide
- [ ] Architecture Decision Records

---

## Phase 14: Testing

### 14.1 Unit Tests
- [x] Core data structures (90%+ coverage)
- [x] Format parsers (schem, litematic, nbt)
- [x] Diff engine
- [ ] Analysis engine
- [x] Material calculator
- [x] Palette manager

### 14.2 Integration Tests
- [ ] Generate → render → export pipeline
- [x] Import → edit → export round-trip
- [ ] AI provider mock tests
- [x] Multi-format export verification

### 14.3 E2E Tests
- [ ] User flow: generate structure
- [ ] User flow: import and edit
- [ ] User flow: export to each format
- [ ] User flow: undo/redo
- [ ] User flow: version history

### 14.4 Performance Tests
- [ ] Greedy meshing benchmarks
- [ ] Render time for various sizes
- [ ] Memory leak detection
- [ ] Import/export speed tests

---

## Phase 15: Deployment

### 15.1 Build
- [ ] Vite production build
- [ ] Bundle size optimization
- [ ] Asset optimization (textures, WASM)
- [ ] Source maps for debugging

### 15.2 Hosting
- [ ] Deploy to Vercel/Netlify (static)
- [ ] Custom domain setup
- [ ] SSL certificate
- [ ] CDN for assets

### 15.3 CI/CD
- [ ] GitHub Actions workflow
- [ ] Lint and test on PR
- [ ] Auto-deploy on main merge
- [ ] Preview deployments for PRs

### 15.4 Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (optional, privacy-respecting)
- [ ] Performance monitoring
- [ ] Uptime monitoring

---

## Dependency Order

The phases should be executed roughly in order, but many subphases within phases can be parallelized:

```
Phase 1 (Foundation)
  └── Phase 2 (3D Editor Core)
       ├── Phase 3 (AI Integration) ← depends on 1.3, 1.4
       ├── Phase 4 (Export) ← depends on 1.2
       ├── Phase 5 (Import) ← depends on 1.2, 1.3
       └── Phase 6 (Version History) ← depends on 1.2
            ├── Phase 7 (Survival Mode) ← depends on 1.2
            ├── Phase 8 (Analysis) ← depends on 1.2
            ├── Phase 9 (Library) ← depends on 4.1
            ├── Phase 10 (Templates) ← depends on 3.2
            ├── Phase 11 (MCP) ← depends on 3.3
            └── Phase 12 (Plugins) ← depends on all core phases
                 └── Phase 13 (Polish) ← final
                      └── Phase 14 (Testing) ← parallel with 13
                           └── Phase 15 (Deployment) ← final
```
