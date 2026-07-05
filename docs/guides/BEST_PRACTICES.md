# Best Practices — MIneLAb Development Guide

---

## 1. Code Architecture

### 1.1 Separation of Concerns

Keep four layers strictly separated:

- **Core Engine** — Pure TypeScript, no React, no Three.js. Testable with unit tests.
- **3D Engine** — Three.js/React Three Fiber rendering. Only handles visual representation.
- **UI Layer** — React components. Only handles user interaction.
- **AI Layer** — Provider implementations. Only handles API communication.

Core engine should never import from UI or 3D layers. This enables testing the logic without browser rendering.

### 1.2 State Management

- Use Zustand for global state (editor, AI, history)
- Keep stores small and focused
- Use selectors to prevent unnecessary re-renders
- Derive computed values, don't store them

```typescript
// Good: derived state
const blockCount = useEditorStore(s => s.structure?.totalBlocks ?? 0);

// Bad: stored and synced
const blockCount = useEditorStore(s => s.blockCount); // must update manually
```

### 1.3 Immutable Updates

Always create new objects when modifying state:

```typescript
// Good
setStructure({ ...structure, chunks: newChunks });

// Bad
structure.chunks = newChunks; // mutation, breaks React
```

---

## 2. 3D Rendering

### 2.1 Greedy Meshing

Implement greedy meshing per-chunk. Key algorithm:

1. For each axis (X, Y, Z):
   - For each slice perpendicular to that axis:
     - Find runs of same-type adjacent blocks
     - Merge runs into larger quads
     - Generate geometry for merged quads

Expected result: 85-97% triangle reduction vs naive per-block meshing.

### 2.2 Chunk Management

- Divide world into 16x16x16 chunks
- Only re-mesh chunks marked dirty
- Batch chunk updates (don't re-mesh one at a time during rapid edits)
- Use requestAnimationFrame or WebWorker for mesh generation

### 2.3 Texture Atlas

- Pack all Minecraft block textures into a single atlas
- Use UV coordinates to select texture per face
- Atlas should be generated from vanilla textures (respect Mojang's texture pack license)
- Cache atlas generation (expensive operation)

### 2.4 Raycasting

- Use Three.js Raycaster for block picking
- Optimize by raycasting against chunk bounding boxes first
- For large structures, use spatial hashing for O(1) block lookup

### 2.5 Memory Management

- Dispose Three.js objects when chunks are unloaded
- Use BufferGeometry (not BoxGeometry per block)
- Pool Object3D instances for selection markers
- Monitor heap size and implement chunk eviction for very large worlds

---

## 3. AI Integration

### 3.1 Prompt Engineering

The system prompt is critical. Include:

- Block palette with descriptions (stone bricks for walls, oak planks for floors, etc.)
- Structural rules (no floating roofs, support columns needed)
- Coordinate system explanation
- Tool usage guidelines
- Example of good output

### 3.2 Diff Generation

For iterative edits, provide the AI with:

- Structure summary (dimensions, block counts, key features)
- Region bounds if user selected one
- Previous modification history
- Clear instruction format

### 3.3 Error Handling

- Validate AI responses before applying
- Check block IDs against palette
- Validate coordinates within structure bounds
- Handle malformed JSON gracefully
- Show user-friendly error messages

### 3.4 Cost Awareness

- Estimate token count before sending
- Show estimated cost to user
- Allow canceling long requests
- Cache common responses (optional)

### 3.5 Rate Limiting

- Implement client-side rate limiting per provider
- Queue requests when limit is hit
- Show queue position to user

---

## 4. Format Handling

### 4.1 NBT Parsing

Use a pure-JS NBT parser. Recommended: `nbt-ts` or implement a minimal parser.

Key NBT types:
- TAG_Byte (1), TAG_Short (2), TAG_Int (3), TAG_Long (4)
- TAG_Float (5), TAG_Double (6), TAG_Byte_Array (7)
- TAG_String (8), TAG_List (9), TAG_Compound (10)
- TAG_Int_Array (11), TAG_Long_Array (12)

### 4.2 Sponge Schematic v2

The preferred format for export. Implementation:

```
1. Build palette mapping (block ID → index)
2. Serialize blocks in XZY order (inner loop: X, then Z, then Y)
3. Write palette, dimensions, and block data as NBT compound
4. GZIP compress the result
```

### 4.3 Coordinate Systems

All formats use different conventions:

- Sponge: Width(X) × Height(Y) × Length(Z), origin at min corner
- Litematica: Size as [x, y, z], position as [x, y, z]
- Structure Block: Size as [x, y, z], blocks relative to structure block position

Always normalize to internal coordinates, then transform on export.

---

## 5. Performance

### 5.1 Target Metrics

| Structure Size | Target FPS | Strategy |
|----------------|-----------|----------|
| < 10k blocks | 60 fps | Simple meshing |
| 10k-100k blocks | 60 fps | Greedy meshing + frustum culling |
| 100k-500k blocks | 30 fps | + LOD + chunk eviction |
| 500k-1M+ blocks | 15 fps | + aggressive LOD + WebWorker |

### 5.2 Profiling

- Use Chrome DevTools Performance tab
- Monitor frame time (target < 16.6ms for 60fps)
- Track memory allocation
- Use Three.js stats panel during development

### 5.3 WebWorkers

Offload expensive operations:

- Greedy meshing computation
- NBT parsing for large files
- Diff application for large structures
- Step-by-step generation

---

## 6. Testing

### 6.1 Unit Tests

- Core engine functions (DiffEngine, PaletteManager, AnalysisEngine)
- Format parsers (schem, litematic, nbt)
- AI response parsers
- Block registry lookups

### 6.2 Integration Tests

- Full generate → render → export pipeline
- Import → edit → export round-trip
- AI provider mock with fixture responses

### 6.3 E2E Tests

- User flow: generate structure, edit, export
- Import file, verify blocks match
- Undo/redo sequence

### 6.4 Performance Tests

- Benchmark greedy meshing with known inputs
- Measure render time for various structure sizes
- Memory leak detection over long sessions

---

## 7. Security

### 7.1 API Key Handling

- Store in localStorage (or encrypt with Web Crypto API)
- Never send to any server except the AI provider
- Allow clearing keys at any time
- Show which provider key is active

### 7.2 Content Security Policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com;
  img-src 'self' data:;
  worker-src 'self' blob:;
```

### 7.3 Plugin Sandboxing

- Plugins run in isolated scope
- No access to DOM outside their panel
- No network access without explicit permission
- API access is read-only unless granted write permission

---

## 8. Accessibility

- All keyboard shortcuts documented and configurable
- Color is never the only indicator (use icons/patterns too)
- Screen reader support for chat messages
- High contrast mode option
- Minimum touch target sizes for mobile

---

## 9. Documentation

- Every public API function has JSDoc comments
- Architecture decisions recorded in ADRs (Architecture Decision Records)
- CONTRIBUTING.md with setup instructions
- CHANGELOG.md for version history
- API reference auto-generated from TypeScript types
