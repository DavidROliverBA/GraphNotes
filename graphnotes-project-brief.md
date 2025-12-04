# GraphNotes: Graph-Based Note-Taking Tool

## Project Brief for Claude Code

---

## 1. Project Overview

**GraphNotes** is a local-first, desktop note-taking application with a graph-based knowledge structure. Notes are stored as plain markdown files with YAML frontmatter, connected via bidirectional wikilinks with named, asymmetric relationships. The application supports peer-to-peer sync using change data capture (event sourcing with redo logs).

### Core Principles

- **Portable data**: All notes are plain markdown files, editable externally
- **Local-first**: Works entirely offline, data stays on device
- **Event-sourced sync**: Changes captured as append-only logs, replayed across peers
- **Rich linking**: Named, asymmetric bidirectional links forming a true knowledge graph

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **App Shell** | Tauri 2.x | Desktop runtime, file system access, shell commands |
| **Frontend** | React 18 + TypeScript | UI framework |
| **Editor** | Tiptap 2.x (ProseMirror) | WYSIWYG markdown editing |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Graph Data** | Graphology | In-memory graph structure |
| **Graph Visualisation** | Sigma.js | WebGL graph rendering |
| **Full-text Search** | MiniSearch | In-memory search index |
| **Grep Search** | ripgrep (via Tauri shell) | Fast file content search |
| **File Watching** | Tauri fs-watch or notify (Rust) | Detect external file changes |
| **Frontmatter Parsing** | gray-matter | YAML frontmatter extraction |
| **Markdown Parsing** | remark + unified | AST parsing for wikilinks |
| **P2P Networking** | Hyperswarm | Peer discovery and connectivity |
| **Event Log** | Custom append-only log (JSON Lines) | CDC/redo log storage |

---

## 3. Folder Structure

```
graphnotes/
├── src-tauri/                    # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── commands/             # Tauri commands (IPC)
│   │   │   ├── mod.rs
│   │   │   ├── files.rs          # File operations
│   │   │   ├── search.rs         # ripgrep integration
│   │   │   └── sync.rs           # P2P sync commands
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # React TypeScript frontend
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main application component
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── Editor.tsx        # Tiptap editor wrapper
│   │   │   ├── extensions/       # Custom Tiptap extensions
│   │   │   │   ├── wikilink.ts   # [[wikilink]] support
│   │   │   │   ├── mermaid.ts    # Mermaid diagram rendering
│   │   │   │   └── taskList.ts   # Task list extension
│   │   │   └── EditorToolbar.tsx
│   │   ├── Graph/
│   │   │   ├── GraphView.tsx     # Sigma.js graph component
│   │   │   ├── GraphControls.tsx # Zoom, filter, layout controls
│   │   │   └── NodeStyles.ts     # Icon, colour, style definitions
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── FileTree.tsx      # Note file browser
│   │   │   └── SearchPanel.tsx   # Search interface
│   │   ├── LinkPanel/
│   │   │   ├── LinkPanel.tsx     # Backlinks and outlinks display
│   │   │   └── LinkEditor.tsx    # Name/describe link relationships
│   │   └── Layout/
│   │       └── MainLayout.tsx    # App layout structure
│   ├── hooks/
│   │   ├── useNotes.ts           # Note CRUD operations
│   │   ├── useGraph.ts           # Graph data management
│   │   ├── useSearch.ts          # Search functionality
│   │   ├── useSync.ts            # P2P sync state
│   │   └── useFileWatcher.ts     # File system change detection
│   ├── lib/
│   │   ├── graph/
│   │   │   ├── GraphManager.ts   # Graphology wrapper
│   │   │   ├── linkParser.ts     # Extract wikilinks from markdown
│   │   │   └── types.ts          # Graph type definitions
│   │   ├── notes/
│   │   │   ├── NoteManager.ts    # Note file operations
│   │   │   ├── frontmatter.ts    # Frontmatter parsing/serialising
│   │   │   └── types.ts          # Note type definitions
│   │   ├── search/
│   │   │   ├── SearchIndex.ts    # MiniSearch wrapper
│   │   │   └── grepSearch.ts     # ripgrep Tauri command wrapper
│   │   ├── sync/
│   │   │   ├── EventLog.ts       # Append-only event log
│   │   │   ├── events.ts         # Event type definitions
│   │   │   ├── PeerManager.ts    # Hyperswarm P2P management
│   │   │   └── SyncEngine.ts     # Event replay and conflict resolution
│   │   └── utils/
│   │       ├── paths.ts          # Path utilities
│   │       └── debounce.ts       # Utility functions
│   ├── stores/
│   │   ├── noteStore.ts          # Zustand store for notes
│   │   ├── graphStore.ts         # Zustand store for graph state
│   │   └── uiStore.ts            # UI state (selected note, view mode)
│   └── styles/
│       └── globals.css           # Global styles and Tailwind imports
├── notes/                        # Default notes directory (user-configurable)
│   └── .graphnotes/
│       ├── events.jsonl          # Append-only event log
│       └── config.json           # Vault configuration
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 4. Key Interfaces and Types

### 4.1 Note Types

```typescript
// src/lib/notes/types.ts

interface NoteFrontmatter {
  id: string;                      // UUID, immutable
  title: string;
  created: string;                 // ISO 8601
  modified: string;                // ISO 8601
  tags?: string[];
  links?: LinkDefinition[];        // Named outbound links
}

interface LinkDefinition {
  target: string;                  // Target note ID or filename
  name: string;                    // Relationship name, e.g., "supports"
  description?: string;            // Optional description
  created: string;                 // ISO 8601
}

interface Note {
  id: string;
  filepath: string;                // Relative to vault root
  frontmatter: NoteFrontmatter;
  content: string;                 // Markdown body (without frontmatter)
  rawContent: string;              // Full file content
}
```

### 4.2 Graph Types

```typescript
// src/lib/graph/types.ts

interface GraphNode {
  id: string;                      // Note ID
  label: string;                   // Note title
  filepath: string;
  icon?: string;                   // Custom icon identifier
  colour?: string;                 // Node colour
  size?: number;                   // Node size (based on connections)
}

interface GraphEdge {
  id: string;                      // Unique edge ID
  source: string;                  // Source note ID
  target: string;                  // Target note ID
  name: string;                    // Relationship name
  description?: string;
  style?: EdgeStyle;
}

interface EdgeStyle {
  colour: string;
  width: number;
  dashed: boolean;
}

type RelationshipType = {
  name: string;                    // e.g., "supports", "contradicts"
  colour: string;
  inverseLabel?: string;           // e.g., "is supported by"
};
```

### 4.3 Event/CDC Types

```typescript
// src/lib/sync/events.ts

type EventType = 
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'NOTE_RENAMED'
  | 'LINK_CREATED'
  | 'LINK_UPDATED'
  | 'LINK_DELETED';

interface BaseEvent {
  id: string;                      // UUID
  type: EventType;
  timestamp: string;               // ISO 8601
  deviceId: string;                // Originating device
  vectorClock: VectorClock;        // For ordering
}

interface NoteCreatedEvent extends BaseEvent {
  type: 'NOTE_CREATED';
  payload: {
    noteId: string;
    filepath: string;
    content: string;
  };
}

interface NoteUpdatedEvent extends BaseEvent {
  type: 'NOTE_UPDATED';
  payload: {
    noteId: string;
    previousHash: string;          // For conflict detection
    newContent: string;
  };
}

interface LinkCreatedEvent extends BaseEvent {
  type: 'LINK_CREATED';
  payload: {
    sourceId: string;
    targetId: string;
    name: string;
    description?: string;
  };
}

// ... similar patterns for other event types

type SyncEvent = 
  | NoteCreatedEvent 
  | NoteUpdatedEvent 
  | NoteDeletedEvent
  | NoteRenamedEvent
  | LinkCreatedEvent 
  | LinkUpdatedEvent
  | LinkDeletedEvent;

interface VectorClock {
  [deviceId: string]: number;
}
```

### 4.4 Search Types

```typescript
// src/lib/search/types.ts

interface SearchResult {
  noteId: string;
  title: string;
  filepath: string;
  score: number;
  matches: SearchMatch[];
}

interface SearchMatch {
  field: 'title' | 'content' | 'tags';
  snippet: string;                 // Context around match
  positions: [number, number][];   // Start/end positions
}

interface GrepResult {
  filepath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}
```

---

## 5. Frontmatter Schema

Notes are stored as markdown files with YAML frontmatter:

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
title: Example Note
created: 2024-01-15T10:30:00Z
modified: 2024-01-15T14:22:00Z
tags:
  - architecture
  - planning
links:
  - target: 550e8400-e29b-41d4-a716-446655440001
    name: extends
    description: Builds upon the foundational concepts
    created: 2024-01-15T10:35:00Z
  - target: another-note.md
    name: contradicts
    created: 2024-01-15T11:00:00Z
---

# Example Note

This is the note content with a [[wikilink]] to another note.

You can also link with a custom name: [[target-note|displayed text]]
```

---

## 6. Build Sequence

### Phase 1: Foundation (Core App Shell)

**Milestone**: Basic Tauri app with file system access

1. Initialise Tauri project with React + TypeScript + Vite
2. Configure Tailwind CSS
3. Implement basic Tauri commands for:
   - Reading/writing files
   - Listing directory contents
   - Creating/deleting files
4. Create main layout structure (sidebar, editor area, graph panel)
5. Implement vault selection/configuration

**Deliverable**: App that can open a folder and list markdown files

---

### Phase 2: Editor (Markdown Editing)

**Milestone**: Functional WYSIWYG markdown editor

1. Integrate Tiptap with React
2. Configure standard extensions (bold, italic, headings, code blocks, etc.)
3. Implement custom wikilink extension:
   - Syntax: `[[note-name]]` and `[[note-name|display text]]`
   - Autocomplete dropdown when typing `[[`
   - Click to navigate
4. Implement task list extension (checkboxes)
5. Implement mermaid extension (render diagrams)
6. Add frontmatter parsing (hidden from editor, editable via panel)
7. Implement auto-save with debouncing

**Deliverable**: Can create, edit, and save notes with wikilinks and mermaid diagrams

---

### Phase 3: Graph Data Layer

**Milestone**: In-memory graph built from notes

1. Implement note scanning on vault open
2. Parse frontmatter and extract link definitions
3. Parse markdown content for inline wikilinks
4. Build Graphology graph structure
5. Implement graph update on note changes
6. Create link management panel:
   - View incoming/outgoing links
   - Add/edit/delete named links
   - Update frontmatter on link changes

**Deliverable**: Graph data structure accurately reflects all notes and links

---

### Phase 4: Graph Visualisation

**Milestone**: Interactive graph view

1. Integrate Sigma.js with React
2. Implement basic graph rendering from Graphology data
3. Add node interactions:
   - Click to select/open note
   - Hover for preview
   - Drag to reposition
4. Implement visual customisation:
   - Node icons (configurable per note or tag)
   - Node colours (configurable)
   - Edge colours by relationship type
   - Edge styles (solid, dashed, thickness)
5. Add graph controls:
   - Zoom/pan
   - Layout algorithms (force-directed, hierarchical)
   - Filter by tag or relationship type
6. Implement local graph view (show only connected notes)

**Deliverable**: Beautiful, interactive graph visualisation with customisable styling

---

### Phase 5: Search

**Milestone**: Fast full-text and grep search

1. Implement MiniSearch index:
   - Index title, content, tags
   - Rebuild on vault open
   - Update incrementally on note changes
2. Create search UI:
   - Search input in sidebar
   - Results with snippets and highlighting
   - Click to open note
3. Integrate ripgrep via Tauri:
   - Shell command wrapper
   - Parse ripgrep JSON output
   - Display results with file, line number, context
4. Add search modes toggle (full-text vs grep)

**Deliverable**: Can search notes instantly with both methods

---

### Phase 6: Event Sourcing Foundation

**Milestone**: Local event log capturing all changes

1. Define event schema (JSON Lines format)
2. Implement EventLog class:
   - Append events to `.graphnotes/events.jsonl`
   - Read and parse event log
   - Generate vector clocks
3. Instrument all state changes to emit events:
   - Note CRUD operations
   - Link CRUD operations
4. Implement event replay:
   - Reconstruct state from events
   - Verify consistency with file system
5. Add device ID generation and storage

**Deliverable**: All changes logged, can reconstruct state from events

---

### Phase 7: P2P Sync

**Milestone**: Sync notes between devices

1. Integrate Hyperswarm:
   - Generate/store vault key pair
   - Peer discovery by vault ID
   - Establish connections
2. Implement sync protocol:
   - Exchange vector clocks on connect
   - Identify missing events
   - Stream events to peer
3. Implement event application:
   - Apply remote events to local state
   - Update files from events
4. Handle conflicts:
   - Detect concurrent edits (vector clock comparison)
   - Create conflict copies for manual resolution
5. Add sync status UI:
   - Connection status
   - Peer count
   - Sync progress

**Deliverable**: Notes sync automatically between connected devices

---

### Phase 8: Polish and Refinement

**Milestone**: Production-ready application

1. Implement keyboard shortcuts
2. Add note templates
3. Implement daily notes feature
4. Add export options (PDF, HTML)
5. Create settings panel:
   - Default relationship types
   - Graph visualisation defaults
6. Implement theme customisation system:
   - Theme presets (Light, Dark, Catppuccin, Nord, Solarized, etc.)
   - Custom colour scheme editor:
     - Editor background, text, accent colours
     - Sidebar colours
     - Graph node and edge colours
     - Syntax highlighting colours
   - Typography settings:
     - Font family selection (system fonts + custom)
     - Editor font size (adjustable with slider)
     - UI font size (compact, normal, comfortable)
     - Line height adjustment
   - Persist theme settings to vault config
   - Support importing/exporting theme presets
7. Performance optimisation:
   - Lazy loading for large vaults
   - Virtual scrolling for file lists
8. Error handling and recovery
9. Testing and bug fixes

**Deliverable**: Polished, reliable application

---

## 7. Critical Implementation Notes

### Wikilink Resolution

Wikilinks can reference notes by:
1. **Note ID** (UUID in frontmatter)
2. **Filename** (without extension)
3. **Title** (from frontmatter)

Resolution priority: ID > exact filename match > title match > fuzzy filename match

### Vector Clocks for Sync

Each device maintains a vector clock `{deviceA: 5, deviceB: 3}` representing the latest event seen from each device. On sync:
1. Compare clocks to find missing events
2. Send events the peer hasn't seen
3. Receive events we haven't seen
4. Apply events in causal order

### Conflict Handling

When concurrent edits detected (same note modified on multiple devices without sync):
1. Keep local version as primary
2. Create `filename.conflict-{deviceId}.md` with remote version
3. Surface conflict in UI for manual resolution

### File Watching

Watch for external file changes (user editing in another app):
1. Detect change via Tauri fs-watch
2. Re-parse file
3. Update in-memory state
4. Emit event to sync log

---

## 8. Dependencies

### Frontend (package.json)

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tiptap/react": "^2.4.0",
    "@tiptap/starter-kit": "^2.4.0",
    "@tiptap/extension-task-list": "^2.4.0",
    "@tiptap/extension-task-item": "^2.4.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "graphology": "^0.25.4",
    "@react-sigma/core": "^4.0.0",
    "sigma": "^3.0.0",
    "minisearch": "^7.0.0",
    "gray-matter": "^4.0.3",
    "unified": "^11.0.0",
    "remark-parse": "^11.0.0",
    "zustand": "^4.5.0",
    "uuid": "^10.0.0",
    "mermaid": "^10.9.0",
    "hyperswarm": "^4.7.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Rust (Cargo.toml additions)

```toml
[dependencies]
notify = "6.1"        # File system watching
serde_json = "1.0"    # JSON parsing
uuid = "1.8"          # UUID generation
```

---

## 9. Future Enhancements (Post-MVP)

These are explicitly **out of scope** for initial build but documented for future:

- [ ] Semantic search with local embeddings (Transformers.js or Ollama)
- [ ] Transclusions (`![[note]]` embeds)
- [ ] Mobile applications (iOS/Android)
- [ ] Web-based access
- [ ] Plugin system for custom extensions
- [ ] Canvas/whiteboard view
- [ ] Calendar/timeline view
- [ ] AI-assisted linking suggestions
- [ ] Import from Obsidian/Roam/Notion

---

## 10. Getting Started with Claude Code

To begin development, use this prompt with Claude Code:

```
I want to build GraphNotes, a graph-based note-taking application. 
Please read the project brief at graphnotes-project-brief.md and begin with Phase 1: Foundation.

Start by:
1. Creating a new Tauri 2.x project with React, TypeScript, and Vite
2. Setting up Tailwind CSS
3. Creating the basic folder structure as specified
4. Implementing the main layout components

Let's build this incrementally, completing each phase before moving to the next.
```

---

*Document version: 1.0*
*Created: December 2025*
