# User Stories — MIneLAb

---

## Epic 1: AI Generation

### US-1.1: Generate Structure from Prompt
**As a** map maker,
**I want to** describe a structure in natural language and have AI generate it,
**So that** I can quickly create complex builds without manual block placement.

**Acceptance Criteria:**
- User can type a prompt describing a structure
- AI generates a valid block representation
- Structure renders in 3D within 5 seconds
- At least 3 AI providers are supported (OpenAI, Anthropic, Ollama)

### US-1.2: Select AI Provider
**As a** user,
**I want to** choose which AI provider to use,
**So that** I can use my preferred service or a free local model.

**Acceptance Criteria:**
- Provider selection dropdown in settings
- Each provider shows supported models
- API key input with validation
- Test connection button
- Connection status indicator

### US-1.3: Use Prompt Templates
**As a** beginner user,
**I want to** use pre-built prompt templates for common structures,
**So that** I can get good results without crafting complex prompts.

**Acceptance Criteria:**
- Template library with categories (Castle, Temple, Village, etc.)
- Each template has a preview and description
- Click to insert template prompt
- User can customize template before generating
- User can save custom templates

### US-1.4: Configure Generation Parameters
**As a** power user,
**I want to** set dimensions, block palette, and style constraints,
**So that** the AI generates structures that fit my specific needs.

**Acceptance Criteria:**
- Dimension inputs (width, height, depth)
- Block palette selector (which blocks to use)
- Style dropdown (Medieval, Modern, Fantasy, etc.)
- Constraints text field (e.g., "no obsidian", "use only stone variants")

---

## Epic 2: 3D Editor

### US-2.1: Orbit Camera
**As a** user,
**I want to** freely orbit around the structure,
**So that** I can inspect it from all angles.

**Acceptance Criteria:**
- Left-click drag rotates view
- Scroll wheel zooms
- Right-click drag pans
- Smooth animation on view changes
- Double-click to focus on a point

### US-2.2: WASD Navigation
**As a** user,
**I want to** fly through the structure in first-person,
**So that** I can experience it from a builder's perspective.

**Acceptance Criteria:**
- WASD moves camera
- Mouse looks around
- Shift加速, Ctrl减速
- Space moves up, C moves down
- Toggle between orbit and fly modes

### US-2.3: Select Blocks
**As a** user,
**I want to** select individual blocks or regions,
**So that** I can modify specific parts of the structure.

**Acceptance Criteria:**
- Click to select single block (highlighted with outline)
- Box select (drag to create selection rectangle)
- Shift+click to add to selection
- Selected blocks show coordinate info
- Selection count displayed

### US-2.4: Replace Materials
**As a** user,
**I want to** swap one block type for another across the structure,
**So that** I can quickly restyle the build.

**Acceptance Criteria:**
- Right-click block to pick its type
- Open replace dialog
- Select target block type
- Preview affected blocks
- Apply replaces all instances (or within selection)
- Undo support

### US-2.5: Toggle View Modes
**As a** user,
**I want to** switch between wireframe, X-ray, and solid views,
**So that** I can inspect the internal structure.

**Acceptance Criteria:**
- Wireframe mode toggle
- X-ray mode (see through blocks, only render edges)
- Solid mode (default)
- Grid overlay toggle
- Chunk boundary overlay
- Coordinate axes display

### US-2.6: Measure Distances
**As a** user,
**I want to** measure distances between points,
**So that** I can verify dimensions.

**Acceptance Criteria:**
- Click two points to measure distance
- Display Manhattan and Euclidean distances
- Measure tool persists until cleared
- Shows X, Y, Z deltas

### US-2.7: Undo/Redo
**As a** user,
**I want to** undo and redo any action,
**So that** I can experiment without fear.

**Acceptance Criteria:**
- Ctrl+Z undoes last action
- Ctrl+Shift+Z redoes
- Supports up to 100 undo steps
- Undo/redo buttons in toolbar
- History panel shows action list

---

## Epic 3: Iterative AI Editing

### US-3.1: Modify Structure with AI
**As a** user,
**I want to** tell the AI to make specific changes to the existing structure,
**So that** I can iterate without regenerating from scratch.

**Acceptance Criteria:**
- Chat input for modification instructions
- AI receives current structure state
- AI returns a diff (add/remove/replace)
- Diff is applied visually with animation
- Only affected chunks are re-rendered
- Token usage displayed

### US-3.2: Select Region for AI Edit
**As a** user,
**I want to** select a region and tell the AI to only modify that area,
**So that** I can make targeted changes.

**Acceptance Criteria:**
- Select region with box/lasso tool
- Type instruction in chat
- AI only modifies selected blocks
- Non-selected blocks remain untouched

### US-3.3: View AI Diff Before Applying
**As a** user,
**I want to** preview the AI's proposed changes before applying them,
**So that** I can reject bad suggestions.

**Acceptance Criteria:**
- Diff shown as preview (green = add, red = remove)
- Accept/Reject buttons
- Diff details panel (block count, changes summary)
- Can inspect individual changes

### US-3.4: Chat History
**As a** user,
**I want to** see the conversation history with AI,
**So that** I can reference previous instructions.

**Acceptance Criteria:**
- Scrollable chat panel
- User and AI messages distinguished
- Token usage per message
- Copy message content
- Retry failed requests

---

## Epic 4: Version History

### US-4.1: Named Versions
**As a** user,
**I want to** save named versions of my structure,
**So that** I can track my progress.

**Acceptance Criteria:**
- Auto-save on each AI interaction
- Manual version naming
- Version list with timestamps
- Click to view any version
- Diff between consecutive versions

### US-4.2: Revert to Version
**As a** user,
**I want to** revert to a previous version,
**So that** I can undo major changes.

**Acceptance Criteria:**
- Revert button on each version
- Confirmation dialog
- Creates new version (non-destructive)
- Branch created automatically

### US-4.3: Compare Versions
**As a** user,
**I want to** compare two versions side-by-side,
**So that** I can see exactly what changed.

**Acceptance Criteria:**
- Select two versions
- Diff view (added blocks green, removed red)
- Statistics comparison (block count, dimensions)
- Navigation between changes

### US-4.4: Branch
**As a** user,
**I want to** create branches to experiment,
**So that** I can try different approaches without losing work.

**Acceptance Criteria:**
- Branch from any version
- Switch between branches
- Branch list with names
- Merge branches (optional, complex)

---

## Epic 5: Export

### US-5.1: Export to Litematica
**As a** survival player,
**I want to** export to Litematica format,
**So that** I can use the hologram overlay to build block-by-block.

**Acceptance Criteria:**
- Export dialog with format selection
- Litematica option with .litematic extension
- File downloads correctly
- Verified importable in Litematica mod


### US-5.2: Export to WorldEdit
**As a** server admin,
**I want to** export to .schem format,
**So that** I can paste the structure with WorldEdit commands.

**Acceptance Criteria:**
- .schem export option
- Compatible with WorldEdit and FAWE
- Handles block states correctly


### US-5.3: Export to Structure Block
**I want to** export to .nbt format,
**So that** I can load it with a Structure Block.

**Acceptance Criteria:**
- .nbt export with correct NBT structure
- Works with vanilla Structure Blocks
- Respects 64x64x64 size limit (warns if exceeded)

### US-5.4: Export to Commands
**As a** player,
**I want to** export as WorldEdit or /setblock commands,
**So that** I can paste without any mods.

**Acceptance Criteria:**
- Generate .txt file with //fill commands
- Generate .mcfunction file
- Commands are correct and paste-able
- Progress indicator during generation

### US-5.5: Export to 3D Model
**As a** content creator,
**I want to** export as GLB/OBJ,
**So that** I can use the structure in Blender or other 3D software.

**Acceptance Criteria:**
- GLB export with texture atlas
- OBJ export with MTL material file
- Correct UV mapping
- Reasonable file size

---

## Epic 6: Import

### US-6.1: Import Schematic Files
**As a** user,
**I want to** import .schem, .litematic, .nbt files,
**So that** I can edit existing builds with AI.

**Acceptance Criteria:**
- Drag-and-drop file import
- Auto-detect format
- Parse and display in 3D editor
- Preserve block states and palette
- Handle large files (up to 100k blocks)

### US-6.2: Import via URL
**As a** user,
**I want to** import a schematic from a URL,
**So that** I can quickly load community builds.

**Acceptance Criteria:**
- URL input field
- Download and parse
- Error handling for invalid URLs

---

## Epic 7: Survival Mode

### US-7.1: Material Calculator
**As a** survival player,
**I want to** see exactly how many blocks I need,
**So that** I can gather materials before building.

**Acceptance Criteria:**
- Material list with block counts
- Grouped by block type
- Stack count (64 per stack)
- Sortable by count or type
- Export as text/CSV

### US-7.2: Build Time Estimate
**As a** survival player,
**I want to** know approximately how long the build will take,
**So that** I can plan my gaming sessions.

**Acceptance Criteria:**
- Time estimate based on block count
- Accounts for block type difficulty
- Shows in hours and minutes

### US-7.3: Step-by-Step Build Guide
**As a** survival player,
**I want to** get layer-by-layer build instructions,
**So that** I can follow them in-game.

**Acceptance Criteria:**
- Breakdown by Y-level
- Each layer shows blocks to place
- Can navigate layers in 3D view
- Optional PDF export

---

## Epic 8: Structure Analysis

### US-8.1: Linter
**As a** user,
**I want to** analyze my structure for problems,
**So that** I can fix issues before building.

**Acceptance Criteria:**
- Analyze button triggers scan
- Report floating blocks, mob spawns, water issues
- Click issue to navigate to location
- Severity levels (error, warning, info)
- Auto-analyze option (on every change)

### US-8.2: Material Statistics
**As a** user,
**I want to** see detailed statistics about my structure,
**So that** I understand its composition.

**Acceptance Criteria:**
- Total block count
- Unique block types
- Dimensions and bounding box
- Density calculation
- Pie chart of block distribution

---

## Epic 9: Community Library

### US-9.1: Browse Library
**As a** user,
**I want to** browse community-shared structures,
**So that** I can find inspiration or ready-to-use builds.

**Acceptance Criteria:**
- Gallery view with thumbnails
- Filter by tags (Medieval, Fantasy, etc.)
- Search by name
- Sort by date, popularity, rating

### US-9.2: Publish Structure
**As a** creator,
**I want to** publish my structure to the library,
**So that** others can use and learn from it.

**Acceptance Criteria:**
- Publish dialog with metadata
- Add name, description, tags
- Auto-generate thumbnail
- Version tracking

### US-9.3: Fork Structure
**As a** user,
**I want to** duplicate a library structure into my workspace,
**So that** I can modify it.

**Acceptance Criteria:**
- Fork button on library entry
- Creates copy in user's projects
- Credits original author
- Independent version history

---

## Epic 10: Plugin System

### US-10.1: Install Plugin
**As a** user,
**I want to** install plugins to extend functionality,
**So that** I can add specialized tools.

**Acceptance Criteria:**
- Plugin marketplace/gallery
- One-click install
- Enable/disable plugins
- Plugin settings panel

### US-10.2: Create Plugin
**As a** developer,
**I want to** create plugins using a documented API,
**So that** I can add custom tools.

**Acceptance Criteria:**
- Plugin SDK with TypeScript types
- Hot-reload during development
- Plugin manifest format
- API access to structure, selection, AI

---

## Epic 11: MCP Integration

### US-11.1: Expose as MCP Server
**As a** developer,
**I want to** connect external AI clients to MIneLAb via MCP,
**So that** I can use Claude Desktop or Cursor to edit structures.

**Acceptance Criteria:**
- MCP server starts on configurable port
- Tools registered and discoverable
- External AI can call placeBlock, fillRegion, etc.
- Response includes tool execution results

### US-11.2: Use MCP Tools in AI Chat
**As a** user,
**I want to** the AI to use structured tools instead of raw block lists,
**So that** generations are more reliable.

**Acceptance Criteria:**
- AI uses function calling when available
- Fallback to text parsing for models without tool support
- Tool calls shown in chat UI
- Results displayed clearly
