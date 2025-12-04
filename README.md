# GraphNotes

A local-first, graph-based note-taking application built with Tauri, React, and TypeScript. Notes are stored as plain markdown files with YAML frontmatter, connected via bidirectional wikilinks with named, asymmetric relationships.

## Features

- **Rich Markdown Editor**: WYSIWYG editing powered by Tiptap with support for headings, lists, code blocks, and more
- **Wikilinks**: Link notes using `[[Note Title]]` syntax with autocomplete
- **Knowledge Graph**: Interactive graph visualization showing connections between notes
- **Named Relationships**: Create typed links like "supports", "contradicts", "extends" in frontmatter
- **Full-text Search**: Fast in-memory search with MiniSearch
- **Local-first**: All data stays on your machine as plain markdown files
- **Dark Theme**: Beautiful dark interface optimized for focused writing

## Current Status

**Phases Completed:**
- Phase 1: Foundation (Tauri app shell, file system)
- Phase 2: Editor (Tiptap markdown editing with wikilinks)
- Phase 3: Graph Data Layer (Graphology-based graph)
- Phase 4: Graph Visualization (Sigma.js interactive graph)
- Phase 5: Search (MiniSearch full-text search)

**Upcoming:**
- Phase 6: Event Sourcing
- Phase 7: P2P Sync
- Phase 8: Polish and Refinement

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your platform

### macOS
```bash
xcode-select --install
```

### Windows
Install Microsoft Visual Studio C++ Build Tools and WebView2.

### Linux
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/GraphNotes.git
cd GraphNotes
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri dev
```

4. Build for production:
```bash
npm run tauri build
```

## Usage

### Getting Started

1. Launch GraphNotes
2. Select a folder to use as your notes vault (or create a new one)
3. Click "New Note" in the sidebar to create your first note

### Creating Notes

Notes are saved as markdown files with YAML frontmatter:

```markdown
---
id: abc123-def456
title: My Note Title
created: 2024-01-15T10:30:00Z
modified: 2024-01-15T14:22:00Z
tags:
  - ideas
  - project
links:
  - target: other-note-id
    name: supports
    description: This extends the concepts from the other note
    created: 2024-01-15T10:35:00Z
---

# My Note Title

Your note content goes here...
```

### Linking Notes

Create links between notes using wikilink syntax:

- `[[Note Title]]` - Links to a note by its title
- `[[Note Title|Display Text]]` - Links with custom display text

Wikilinks are resolved by:
1. Note ID (UUID in frontmatter)
2. Title match (case-insensitive)
3. Filename match

### Named Relationships

Open the link panel (chain icon in header) to:
- View incoming links (backlinks)
- View outgoing links
- Add named relationships with types like:
  - `supports` / `is supported by`
  - `contradicts`
  - `extends` / `is extended by`
  - `relates to`

### Graph View

Toggle between views using the buttons in the graph panel header:
- **Full Graph**: Shows all notes and connections
- **Local Graph**: Shows only the selected note and its neighbors

Graph controls (bottom left):
- Zoom in/out
- Fit to screen
- Toggle labels
- Re-run layout algorithm

### Search

Use the search box in the sidebar to find notes by:
- Title
- Content
- Tags

## Project Structure

```
GraphNotes/
├── src-tauri/          # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs     # Tauri entry point
│   │   └── lib.rs      # Tauri commands
│   └── Cargo.toml
├── src/                # React TypeScript frontend
│   ├── components/     # React components
│   │   ├── Editor/     # Tiptap editor
│   │   ├── Graph/      # Sigma.js visualization
│   │   ├── Layout/     # App layout
│   │   ├── LinkPanel/  # Link management
│   │   └── Sidebar/    # File tree and search
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries
│   │   ├── files/      # File utilities
│   │   ├── graph/      # Graph management
│   │   ├── notes/      # Note parsing
│   │   └── search/     # Search index
│   └── stores/         # Zustand state stores
├── notes/              # Default notes directory
└── package.json
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| App Shell | Tauri 2.x | Desktop runtime, file system access |
| Frontend | React 18 + TypeScript | UI framework |
| Editor | Tiptap 2.x | WYSIWYG markdown editing |
| Styling | Tailwind CSS | Utility-first styling |
| Graph Data | Graphology | In-memory graph structure |
| Graph Viz | Sigma.js | WebGL graph rendering |
| Search | MiniSearch | Full-text search index |
| State | Zustand | State management |
| Frontmatter | gray-matter | YAML parsing |

## Development

### Running Tests

```bash
npm run test          # Watch mode
npm run test:run      # Single run
```

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## Configuration

Notes are stored as plain markdown files, making them:
- Portable between applications
- Editable with any text editor
- Version controllable with Git
- Searchable with standard tools

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE for details.

## Acknowledgements

- [Tauri](https://tauri.app/) - Desktop app framework
- [Tiptap](https://tiptap.dev/) - Rich text editor
- [Sigma.js](https://www.sigmajs.org/) - Graph visualization
- [Graphology](https://graphology.github.io/) - Graph data structure
- [MiniSearch](https://lucaong.github.io/minisearch/) - Full-text search
