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
| **Editor** | Yoopta Editor | WYSIWYG block-based markdown editing |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Graph Data** | Internal graph model | In-memory graph structure |
| **Graph Visualisation** | React Flow | Interactive node-based graph canvas |
| **Full-text Search** | MiniSearch | In-memory search index |
| **File Watching** | Tauri fs-watch or notify (Rust) | Detect external file changes |
| **Frontmatter Parsing** | gray-matter | YAML frontmatter extraction |
| **Markdown Parsing** | remark + unified | AST parsing for wikilinks |
| **P2P Networking** | Hyperswarm | Peer discovery and connectivity |
| **Event Log** | Custom append-only log (JSON Lines) | CDC/redo log storage |
| **Super Tags** | Custom JSON schema files | Structured tag definitions with attributes |

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
│   │   │   └── sync.rs           # P2P sync commands
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # React TypeScript frontend
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main application component
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── Editor.tsx        # Yoopta editor wrapper
│   │   │   ├── plugins/          # Custom Yoopta plugins
│   │   │   │   ├── wikilink.ts   # [[wikilink]] support
│   │   │   │   └── mermaid.ts    # Mermaid diagram rendering
│   │   │   ├── EditorToolbar.tsx
│   │   │   └── SuperTagAssigner.tsx  # Assign super tags to page
│   │   ├── Graph/
│   │   │   ├── GraphCanvas.tsx   # React Flow graph component
│   │   │   ├── GraphControls.tsx # Zoom, filter, layout controls
│   │   │   ├── nodes/
│   │   │   │   ├── NoteNode.tsx  # Custom node component for notes
│   │   │   │   └── nodeTypes.ts  # Node type registry
│   │   │   ├── edges/
│   │   │   │   ├── RelationshipEdge.tsx  # Custom edge with labels
│   │   │   │   └── edgeTypes.ts  # Edge type registry
│   │   │   └── GraphStyles.ts    # Icon, colour, style definitions
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   ├── FileTree.tsx      # Note file browser
│   │   │   └── SearchPanel.tsx   # Search interface (full-text + tags)
│   │   ├── LinkPanel/
│   │   │   ├── LinkPanel.tsx     # Backlinks and outlinks display
│   │   │   └── LinkEditor.tsx    # Edit link appearance (colour, style, label)
│   │   ├── SuperTags/
│   │   │   ├── SuperTagManager.tsx   # List/manage all super tags
│   │   │   ├── SuperTagEditor.tsx    # Create/edit super tag schema
│   │   │   ├── SuperTagFields.tsx    # Field type editors
│   │   │   ├── SuperTagBrowser.tsx   # Browse notes by super tag
│   │   │   └── AttributeInput.tsx    # Render attribute inputs for a note
│   │   └── Layout/
│   │       └── MainLayout.tsx    # App layout structure
│   ├── hooks/
│   │   ├── useNotes.ts           # Note CRUD operations
│   │   ├── useGraph.ts           # Graph data management
│   │   ├── useSearch.ts          # Search functionality
│   │   ├── useSync.ts            # P2P sync state
│   │   ├── useSuperTags.ts       # Super tag operations
│   │   └── useFileWatcher.ts     # File system change detection
│   ├── lib/
│   │   ├── graph/
│   │   │   ├── GraphManager.ts   # Graph state management
│   │   │   ├── linkParser.ts     # Extract wikilinks from markdown
│   │   │   ├── layoutEngine.ts   # Graph layout algorithms
│   │   │   └── types.ts          # Graph type definitions
│   │   ├── notes/
│   │   │   ├── NoteManager.ts    # Note file operations
│   │   │   ├── frontmatter.ts    # Frontmatter parsing/serialising
│   │   │   └── types.ts          # Note type definitions
│   │   ├── search/
│   │   │   └── SearchIndex.ts    # MiniSearch wrapper with tag filtering
│   │   ├── superTags/
│   │   │   ├── SuperTagSchema.ts # Schema validation and management
│   │   │   ├── fieldTypes.ts     # Field type definitions and validators
│   │   │   └── types.ts          # Super tag type definitions
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
│   │   ├── superTagStore.ts      # Zustand store for super tags
│   │   └── uiStore.ts            # UI state (selected note, view mode)
│   └── styles/
│       └── globals.css           # Global styles and Tailwind imports
├── notes/                        # Default notes directory (user-configurable)
│   └── .graphnotes/
│       ├── events.jsonl          # Append-only event log
│       ├── config.json           # Vault configuration
│       └── supertags/            # Super tag schema definitions
│           ├── project.json      # Example: Project super tag
│           ├── person.json       # Example: Person super tag
│           └── book.json         # Example: Book super tag
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
  superTags?: string[];            // Array of super tag IDs
  tagAttributes?: {                // Attribute values per super tag
    [superTagId: string]: {
      [attributeKey: string]: AttributeValue;
    };
  };
  links?: LinkDefinition[];        // Rich link definitions from wikilinks
}

interface LinkDefinition {
  id: string;                      // Unique link ID
  target: string;                  // Target note ID or filename
  name: string;                    // Relationship name, e.g., "supports"
  description?: string;            // Optional description
  created: string;                 // ISO 8601
  appearance: LinkAppearance;      // Visual styling
}

interface LinkAppearance {
  direction: 'forward' | 'backward' | 'bidirectional' | 'none';
  colour: string;                  // Hex colour, e.g., "#3b82f6"
  style: 'solid' | 'dashed' | 'dotted';
  thickness: 'thin' | 'normal' | 'thick';  // Maps to 1px, 2px, 4px
  animated?: boolean;              // Animated flow effect
}

type AttributeValue = 
  | string 
  | number 
  | boolean 
  | string[]                       // Multi-select
  | { date: string }               // Date
  | { noteId: string }             // Reference to another note
  | null;

interface Note {
  id: string;
  filepath: string;                // Relative to vault root
  frontmatter: NoteFrontmatter;
  content: string;                 // Markdown body (without frontmatter)
  rawContent: string;              // Full file content
}
```

### 4.2 Super Tag Types

```typescript
// src/lib/superTags/types.ts

interface SuperTag {
  id: string;                      // Unique identifier, used as filename
  name: string;                    // Display name, e.g., "Project"
  icon?: string;                   // Icon identifier or emoji
  colour: string;                  // Tag colour for visual identification
  description?: string;
  attributes: SuperTagAttribute[];
  created: string;                 // ISO 8601
  modified: string;                // ISO 8601
}

interface SuperTagAttribute {
  id: string;                      // Unique within this super tag
  key: string;                     // Attribute key for frontmatter
  name: string;                    // Display name
  type: AttributeType;
  required: boolean;
  defaultValue?: AttributeValue;
  config?: AttributeConfig;        // Type-specific configuration
}

type AttributeType = 
  | 'text'                         // Single line text
  | 'richText'                     // Multi-line text
  | 'number'
  | 'checkbox'                     // Boolean
  | 'date'
  | 'select'                       // Single select from options
  | 'multiSelect'                  // Multiple select from options
  | 'noteReference'                // Link to another note
  | 'url'
  | 'email'
  | 'rating';                      // 1-5 star rating

type AttributeConfig = 
  | SelectConfig 
  | NumberConfig 
  | DateConfig
  | NoteReferenceConfig;

interface SelectConfig {
  options: SelectOption[];
}

interface SelectOption {
  value: string;
  label: string;
  colour?: string;
}

interface NumberConfig {
  min?: number;
  max?: number;
  step?: number;
  format?: 'number' | 'currency' | 'percentage';
}

interface DateConfig {
  includeTime: boolean;
  dateFormat?: string;
}

interface NoteReferenceConfig {
  allowedSuperTags?: string[];     // Restrict to notes with specific super tags
  allowMultiple: boolean;
}
```

### 4.3 Graph Types (React Flow)

```typescript
// src/lib/graph/types.ts

import { Node, Edge, MarkerType } from 'reactflow';

interface NoteNodeData {
  noteId: string;
  label: string;                   // Note title
  filepath: string;
  icon?: string;                   // Custom icon identifier
  colour?: string;                 // Node background colour
  superTags?: string[];            // Applied super tag IDs
  preview?: string;                // First few lines of content
}

type NoteNode = Node<NoteNodeData>;

interface RelationshipEdgeData {
  linkId: string;
  name: string;                    // Relationship name/label
  description?: string;
  appearance: LinkAppearance;
}

type RelationshipEdge = Edge<RelationshipEdgeData>;

interface GraphState {
  nodes: NoteNode[];
  edges: RelationshipEdge[];
  viewport: { x: number; y: number; zoom: number };
}

// Edge styling derived from LinkAppearance
interface EdgeStyleProps {
  stroke: string;                  // colour
  strokeWidth: number;             // thickness: thin=1, normal=2, thick=4
  strokeDasharray?: string;        // style: solid=none, dashed='5,5', dotted='2,2'
  animated: boolean;
  markerEnd?: MarkerType;          // Arrow direction
  markerStart?: MarkerType;
}

type RelationshipType = {
  name: string;                    // e.g., "supports", "contradicts"
  defaultAppearance: LinkAppearance;
  inverseLabel?: string;           // e.g., "is supported by"
};
```

### 4.4 Event/CDC Types

```typescript
// src/lib/sync/events.ts

type EventType = 
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'NOTE_DELETED'
  | 'NOTE_RENAMED'
  | 'LINK_CREATED'
  | 'LINK_UPDATED'
  | 'LINK_DELETED'
  | 'SUPERTAG_CREATED'
  | 'SUPERTAG_UPDATED'
  | 'SUPERTAG_DELETED'
  | 'SUPERTAG_ASSIGNED'
  | 'SUPERTAG_UNASSIGNED'
  | 'ATTRIBUTE_UPDATED';

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
    linkId: string;
    sourceId: string;
    targetId: string;
    name: string;
    description?: string;
    appearance: LinkAppearance;
  };
}

interface LinkUpdatedEvent extends BaseEvent {
  type: 'LINK_UPDATED';
  payload: {
    linkId: string;
    changes: Partial<{
      name: string;
      description: string;
      appearance: LinkAppearance;
    }>;
  };
}

interface SuperTagCreatedEvent extends BaseEvent {
  type: 'SUPERTAG_CREATED';
  payload: {
    superTag: SuperTag;
  };
}

interface SuperTagAssignedEvent extends BaseEvent {
  type: 'SUPERTAG_ASSIGNED';
  payload: {
    noteId: string;
    superTagId: string;
  };
}

interface AttributeUpdatedEvent extends BaseEvent {
  type: 'ATTRIBUTE_UPDATED';
  payload: {
    noteId: string;
    superTagId: string;
    attributeKey: string;
    value: AttributeValue;
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
  | LinkDeletedEvent
  | SuperTagCreatedEvent
  | SuperTagUpdatedEvent
  | SuperTagDeletedEvent
  | SuperTagAssignedEvent
  | SuperTagUnassignedEvent
  | AttributeUpdatedEvent;

interface VectorClock {
  [deviceId: string]: number;
}
```

### 4.5 Search Types

```typescript
// src/lib/search/types.ts

interface SearchQuery {
  text?: string;                   // Full-text search query
  superTags?: string[];            // Filter by super tag IDs
  attributes?: AttributeFilter[];  // Filter by attribute values
  hasLinks?: boolean;              // Has any links
  linkedTo?: string;               // Linked to specific note ID
  linkedFrom?: string;             // Has link from specific note ID
}

interface AttributeFilter {
  superTagId: string;
  attributeKey: string;
  operator: FilterOperator;
  value: AttributeValue;
}

type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'greaterThan' 
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty';

interface SearchResult {
  noteId: string;
  title: string;
  filepath: string;
  score: number;
  superTags: string[];             // Applied super tag IDs
  matches: SearchMatch[];
}

interface SearchMatch {
  field: 'title' | 'content' | 'superTags' | 'attributes';
  snippet: string;                 // Context around match
  positions: [number, number][];   // Start/end positions
}
```

---

## 5. Frontmatter Schema

Notes are stored as markdown files with YAML frontmatter:

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
title: Project Alpha Overview
created: 2024-01-15T10:30:00Z
modified: 2024-01-15T14:22:00Z
superTags:
  - project
  - active-work
tagAttributes:
  project:
    status: in-progress
    priority: high
    dueDate: { date: "2024-03-01" }
    owner: { noteId: "550e8400-e29b-41d4-a716-446655440099" }
  active-work:
    focusArea: architecture
links:
  - id: link-001
    target: 550e8400-e29b-41d4-a716-446655440001
    name: extends
    description: Builds upon the foundational concepts
    created: 2024-01-15T10:35:00Z
    appearance:
      direction: forward
      colour: "#3b82f6"
      style: solid
      thickness: normal
  - id: link-002
    target: research-findings.md
    name: contradicts
    created: 2024-01-15T11:00:00Z
    appearance:
      direction: bidirectional
      colour: "#ef4444"
      style: dashed
      thickness: thin
  - id: link-003
    target: team-decisions.md
    name: informs
    description: Key decisions that shaped this project
    created: 2024-01-15T12:00:00Z
    appearance:
      direction: backward
      colour: "#22c55e"
      style: solid
      thickness: thick
      animated: true
---

# Project Alpha Overview

This is the note content with a [[wikilink]] to another note.

You can also link with a custom name: [[target-note|displayed text]]

When you create a wikilink, it automatically adds an entry to the links 
array in the frontmatter with default appearance settings. You can then 
customise the link's appearance using the Link Editor panel.
```

---

## 5.1 Super Tag Schema (JSON)

Super tags are stored as individual JSON files in `.graphnotes/supertags/`:

```json
// .graphnotes/supertags/project.json
{
  "id": "project",
  "name": "Project",
  "icon": "📁",
  "colour": "#8b5cf6",
  "description": "A project with timeline and ownership",
  "attributes": [
    {
      "id": "attr-status",
      "key": "status",
      "name": "Status",
      "type": "select",
      "required": true,
      "defaultValue": "not-started",
      "config": {
        "options": [
          { "value": "not-started", "label": "Not Started", "colour": "#94a3b8" },
          { "value": "in-progress", "label": "In Progress", "colour": "#3b82f6" },
          { "value": "on-hold", "label": "On Hold", "colour": "#f59e0b" },
          { "value": "completed", "label": "Completed", "colour": "#22c55e" },
          { "value": "cancelled", "label": "Cancelled", "colour": "#ef4444" }
        ]
      }
    },
    {
      "id": "attr-priority",
      "key": "priority",
      "name": "Priority",
      "type": "select",
      "required": false,
      "config": {
        "options": [
          { "value": "low", "label": "Low", "colour": "#94a3b8" },
          { "value": "medium", "label": "Medium", "colour": "#f59e0b" },
          { "value": "high", "label": "High", "colour": "#ef4444" }
        ]
      }
    },
    {
      "id": "attr-due",
      "key": "dueDate",
      "name": "Due Date",
      "type": "date",
      "required": false,
      "config": {
        "includeTime": false
      }
    },
    {
      "id": "attr-owner",
      "key": "owner",
      "name": "Owner",
      "type": "noteReference",
      "required": false,
      "config": {
        "allowedSuperTags": ["person"],
        "allowMultiple": false
      }
    },
    {
      "id": "attr-tags",
      "key": "projectTags",
      "name": "Tags",
      "type": "multiSelect",
      "required": false,
      "config": {
        "options": [
          { "value": "urgent", "label": "Urgent", "colour": "#ef4444" },
          { "value": "review-needed", "label": "Review Needed", "colour": "#f59e0b" },
          { "value": "blocked", "label": "Blocked", "colour": "#94a3b8" }
        ]
      }
    }
  ],
  "created": "2024-01-10T09:00:00Z",
  "modified": "2024-01-10T09:00:00Z"
}
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

**Milestone**: Functional WYSIWYG block-based editor

1. Integrate Yoopta Editor with React
2. Configure standard plugins (paragraphs, headings, code blocks, lists, etc.)
3. Implement custom wikilink plugin:
   - Syntax: `[[note-name]]` and `[[note-name|display text]]`
   - Autocomplete dropdown when typing `[[`
   - Click to navigate
   - Auto-create link entry in frontmatter with default appearance
4. Implement task list support (checkboxes)
5. Implement mermaid plugin (render diagrams)
6. Add frontmatter parsing (hidden from editor, editable via panel)
7. Implement link appearance editor:
   - Direction selector (forward/backward/bidirectional/none)
   - Colour picker
   - Style selector (solid/dashed/dotted)
   - Thickness selector (thin/normal/thick)
   - Animated toggle
8. Implement auto-save with debouncing

**Deliverable**: Can create, edit, and save notes with wikilinks, customisable link appearances, and mermaid diagrams

---

### Phase 3: Graph Data Layer

**Milestone**: In-memory graph built from notes with rich link metadata

1. Implement note scanning on vault open
2. Parse frontmatter and extract link definitions with appearance data
3. Parse markdown content for inline wikilinks
4. Build internal graph structure (nodes and edges)
5. Implement graph update on note changes
6. Create link management panel:
   - View incoming/outgoing links
   - Add/edit/delete named links
   - Edit link appearance (direction, colour, style, thickness)
   - Update frontmatter on link changes
7. Implement relationship type presets (save commonly used combinations)

**Deliverable**: Graph data structure accurately reflects all notes, links, and their visual properties

---

### Phase 4: Graph Visualisation (React Flow)

**Milestone**: Interactive graph view with rich styling

1. Integrate React Flow with React
2. Create custom NoteNode component:
   - Display note title and icon
   - Show super tag indicators
   - Colour based on configuration
   - Preview on hover
3. Create custom RelationshipEdge component:
   - Render relationship label
   - Apply appearance settings (colour, style, thickness)
   - Arrow direction based on link direction
   - Optional animation
4. Implement node interactions:
   - Click to select/open note
   - Double-click to edit
   - Drag to reposition (positions saved)
5. Implement edge interactions:
   - Click to select and show link editor
   - Right-click context menu
6. Add graph controls:
   - Zoom/pan
   - Layout algorithms (dagre for hierarchical, d3-force for organic)
   - Filter by super tag or relationship type
   - Minimap for navigation
7. Implement local graph view (show only connected notes within N degrees)
8. Add graph legend showing relationship type colours

**Deliverable**: Beautiful, interactive graph with fully customisable node and edge styling

---

### Phase 5: Search

**Milestone**: Fast full-text search with tag filtering

1. Implement MiniSearch index:
   - Index title, content, super tags, attribute values
   - Rebuild on vault open
   - Update incrementally on note changes
2. Create search UI:
   - Search input in sidebar
   - Results with snippets and highlighting
   - Click to open note
3. Add filter panel:
   - Filter by super tag (checkbox list)
   - Filter by attribute values (dynamic based on selected super tags)
   - Combine filters with AND/OR logic
4. Implement saved searches/smart filters
5. Add quick switcher (Cmd+O) for fast note navigation

**Deliverable**: Can search and filter notes by content and structured data

---

### Phase 6: Super Tags

**Milestone**: Full super tag system with schema editor

1. Create super tag schema storage:
   - Read/write JSON files in `.graphnotes/supertags/`
   - Validate schemas
2. Build SuperTagEditor component:
   - Create new super tags
   - Define attributes with type-specific configuration
   - Set icon and colour
   - Preview how it will appear
3. Build AttributeInput components for each type:
   - Text, rich text, number inputs
   - Date picker
   - Single and multi-select dropdowns
   - Note reference picker (with super tag filtering)
   - Rating stars
   - Checkbox toggle
4. Implement SuperTagAssigner in editor:
   - Dropdown to assign super tags to current note
   - Show attribute inputs for assigned super tags
   - Save attribute values to frontmatter
5. Build SuperTagBrowser:
   - View all notes with a specific super tag
   - Table view with sortable columns for attributes
   - Quick edit attribute values inline
6. Add super tag indicators to:
   - File tree (icons/colours)
   - Graph nodes
   - Search results

**Deliverable**: Complete database-like functionality with structured schemas

---

### Phase 7: Event Sourcing Foundation

**Milestone**: Local event log capturing all changes

1. Define event schema (JSON Lines format)
2. Implement EventLog class:
   - Append events to `.graphnotes/events.jsonl`
   - Read and parse event log
   - Generate vector clocks
3. Instrument all state changes to emit events:
   - Note CRUD operations
   - Link CRUD operations (including appearance changes)
   - Super tag schema CRUD operations
   - Super tag assignment/unassignment
   - Attribute value updates
4. Implement event replay:
   - Reconstruct state from events
   - Verify consistency with file system
5. Add device ID generation and storage

**Deliverable**: All changes logged, can reconstruct state from events

---

### Phase 8: P2P Sync

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

### Phase 9: Polish and Refinement

**Milestone**: Production-ready application

1. Implement keyboard shortcuts
2. Add note templates
3. Implement daily notes feature
4. Add export options (PDF, HTML)
5. Create settings panel:
   - Theme (light/dark)
   - Default relationship types
   - Graph visualisation defaults
6. Performance optimisation:
   - Lazy loading for large vaults
   - Virtual scrolling for file lists
7. Error handling and recovery
8. Testing and bug fixes

**Deliverable**: Polished, reliable application

---

## 7. Critical Implementation Notes

### Wikilink Resolution

Wikilinks can reference notes by:
1. **Note ID** (UUID in frontmatter)
2. **Filename** (without extension)
3. **Title** (from frontmatter)

Resolution priority: ID > exact filename match > title match > fuzzy filename match

### Wikilink to Frontmatter Flow

When a user types `[[target-note]]` in the editor:
1. Parse the wikilink and resolve target note
2. Create a new link entry in frontmatter with:
   - Generated unique `id`
   - Resolved `target` (note ID)
   - Default `name`: "links to"
   - Default `appearance`: forward arrow, blue, solid, normal thickness
3. User can then customise via Link Editor panel

### Link Appearance Rendering (React Flow)

Map `LinkAppearance` to React Flow edge properties:
```typescript
function getEdgeStyle(appearance: LinkAppearance): EdgeStyleProps {
  return {
    stroke: appearance.colour,
    strokeWidth: appearance.thickness === 'thin' ? 1 : 
                 appearance.thickness === 'thick' ? 4 : 2,
    strokeDasharray: appearance.style === 'dashed' ? '5,5' :
                     appearance.style === 'dotted' ? '2,2' : undefined,
    animated: appearance.animated ?? false,
    markerEnd: ['forward', 'bidirectional'].includes(appearance.direction) 
               ? MarkerType.ArrowClosed : undefined,
    markerStart: ['backward', 'bidirectional'].includes(appearance.direction)
                 ? MarkerType.ArrowClosed : undefined,
  };
}
```

### Super Tag Attribute Storage

Attribute values are stored in note frontmatter under `tagAttributes`:
- Keyed by super tag ID, then by attribute key
- Values follow the `AttributeValue` type union
- Allows a note to have multiple super tags with independent attribute values

### Super Tag Schema Validation

When loading a note with super tags:
1. Load referenced super tag schemas
2. Validate attribute values against schema types
3. Apply default values for missing required attributes
4. Flag validation errors for user attention (don't block loading)

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
    "@yoopta/editor": "^4.0.0",
    "@yoopta/paragraph": "^4.0.0",
    "@yoopta/headings": "^4.0.0",
    "@yoopta/lists": "^4.0.0",
    "@yoopta/code": "^4.0.0",
    "@yoopta/blockquote": "^4.0.0",
    "@yoopta/callout": "^4.0.0",
    "@yoopta/link": "^4.0.0",
    "@yoopta/file": "^4.0.0",
    "@yoopta/image": "^4.0.0",
    "@yoopta/action-menu-list": "^4.0.0",
    "@yoopta/toolbar": "^4.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "reactflow": "^11.11.0",
    "@reactflow/core": "^11.11.0",
    "@reactflow/controls": "^11.2.0",
    "@reactflow/minimap": "^11.7.0",
    "@reactflow/background": "^11.3.0",
    "dagre": "^0.8.5",
    "d3-force": "^3.0.0",
    "minisearch": "^7.0.0",
    "gray-matter": "^4.0.3",
    "unified": "^11.0.0",
    "remark-parse": "^11.0.0",
    "zustand": "^4.5.0",
    "uuid": "^10.0.0",
    "mermaid": "^10.9.0",
    "hyperswarm": "^4.7.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/dagre": "^0.7.52"
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
- [ ] Super tag templates (pre-built schemas for common use cases)
- [ ] Computed attributes (formulas based on other attributes)
- [ ] Rollup attributes (aggregate values from linked notes)
- [ ] Graph layouts saved per super tag
- [ ] Collaborative real-time editing

---

## 10. Getting Started with Claude Code

To begin development, use this prompt with Claude Code:

```
I want to build GraphNotes, a graph-based note-taking application. 
Please read:
1. The project brief at [path-to-project-brief.md]
2. The UX specification at [path-to-ux-specification.md]

Begin with Phase 1: Foundation.

Start by:
1. Creating a new Tauri 2.x project with React, TypeScript, and Vite
2. Setting up Tailwind CSS with the colour system from the UX spec
3. Creating the basic folder structure as specified
4. Implementing the main layout components with the responsive behaviour defined

Let's build this incrementally, completing each phase before moving to the next.
Ensure every component follows the UX specification for behaviour, animation, and styling.
```

---

## 11. Related Documents

- **UX Specification**: `graphnotes-ux-specification.md` — Detailed design system, component behaviour, animations, keyboard shortcuts, and accessibility requirements

---

*Document version: 1.1*
*Created: December 2024*
*Updated: December 2024 — Added React Flow, Yoopta Editor, Super Tags, enhanced link appearances*
