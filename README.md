# GraphNotes

A local-first, graph-based note-taking application with bidirectional linking, super tags, and peer-to-peer sync.

## Features

### Core
- **Plain Markdown Files** - Notes stored as standard markdown with YAML frontmatter, editable in any text editor
- **Bidirectional Wikilinks** - Connect notes with `[[wikilinks]]` supporting named, asymmetric relationships
- **Knowledge Graph** - Interactive graph visualization of your notes and their connections
- **Local-First** - Works entirely offline, your data stays on your device

### Rich Editing
- **Block-Based Editor** - WYSIWYG editing powered by Yoopta Editor
- **Wikilink Autocomplete** - Smart suggestions as you type `[[`
- **Note Templates** - Quick-start templates for daily notes, meetings, projects, and more
- **Daily Notes** - Automatic daily journaling with customizable templates

### Organization
- **Super Tags** - Database-like structured fields for notes (status, priority, dates, etc.)
- **Full-Text Search** - Fast search with MiniSearch, filter by tags and attributes
- **Quick Search** - Command palette style note finder (Cmd/Ctrl+K)

### Graph Visualization
- **Interactive Graph View** - Explore your knowledge network with React Flow
- **Link Styling** - Customize link colors, styles, and directions
- **Local Graph** - Focus view showing connections to current note
- **Multiple Layouts** - Force-directed and hierarchical layout options

### Sync & Collaboration
- **Event Sourcing** - All changes captured as append-only event log
- **File-Based Sync** - Sync via shared folders (Dropbox, iCloud, Google Drive)
- **Conflict Detection** - Vector clock-based conflict resolution

### Customization
- **Light/Dark Themes** - System-aware theme with manual override
- **Keyboard Shortcuts** - Comprehensive shortcuts for power users
- **Configurable Settings** - Customize editor behavior, appearance, and more

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Runtime | Tauri 2.x |
| Frontend | React 19 + TypeScript |
| Editor | Yoopta Editor |
| Styling | Tailwind CSS |
| Graph Visualization | React Flow (@xyflow/react) |
| Full-text Search | MiniSearch |
| State Management | Zustand |
| Frontmatter Parsing | gray-matter |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- Platform-specific dependencies for Tauri: [Tauri Prerequisites](https://tauri.app/start/prerequisites/)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/graphnotes.git
cd graphnotes

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Building

```bash
# Build for production
npm run tauri build
```

The built application will be in `src-tauri/target/release/`.

## Development

### Running the App

```bash
# Run as desktop app (Tauri) - full functionality
npm run tauri dev

# Run in browser mode - for quick UI iteration
npm run dev
```

> **Note:** Browser mode uses in-memory storage and mock file operations. Use Tauri mode for actual file system access.

### Testing

```bash
# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test:run

# E2E tests with Playwright
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# E2E tests (headed, visible browser)
npm run test:e2e:headed

# View E2E test report
npm run test:e2e:report
```

### Build

```bash
# Type check and build frontend
npm run build
```

## Project Structure

```
graphnotes/
├── src/                          # React TypeScript frontend
│   ├── components/               # React components
│   │   ├── Editor/              # Yoopta editor integration
│   │   ├── Graph/               # React Flow graph visualization
│   │   ├── Layout/              # App layout components
│   │   ├── Search/              # Search components
│   │   ├── Settings/            # Settings panel
│   │   ├── Sidebar/             # File tree and sidebar
│   │   ├── SuperTags/           # Super tag management
│   │   └── Sync/                # Sync status UI
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Core libraries
│   │   ├── files/               # File utilities
│   │   ├── graph/               # Graph data management
│   │   ├── keyboard/            # Keyboard shortcuts
│   │   ├── notes/               # Note parsing
│   │   ├── search/              # Search index
│   │   ├── superTags/           # Super tag schemas
│   │   ├── sync/                # Event sourcing & sync
│   │   ├── templates/           # Note templates
│   │   └── themes/              # Theme definitions
│   └── stores/                  # Zustand state stores
├── src-tauri/                   # Tauri Rust backend
│   ├── src/
│   │   ├── commands/            # Tauri IPC commands
│   │   └── main.rs              # Tauri entry point
│   └── tauri.conf.json          # Tauri configuration
├── e2e/                         # Playwright E2E tests
│   └── *.spec.ts                # Test specifications
└── notes/                       # Default notes directory
    └── .graphnotes/             # Vault configuration
        ├── events.jsonl         # Event log
        ├── config.json          # Vault config
        └── supertags/           # Super tag schemas
```

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Quick Search | Cmd+K | Ctrl+K |
| New Note | Cmd+N | Ctrl+N |
| Save Note | Cmd+S | Ctrl+S |
| Toggle Sidebar | Cmd+B | Ctrl+B |
| Toggle Graph View | Cmd+G | Ctrl+G |
| Today's Daily Note | Cmd+D | Ctrl+D |
| Open Settings | Cmd+, | Ctrl+, |
| Bold | Cmd+B | Ctrl+B |
| Italic | Cmd+I | Ctrl+I |
| Toggle Focus Mode | Cmd+Shift+F | Ctrl+Shift+F |

## Note Format

Notes are stored as markdown files with YAML frontmatter:

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
title: My Note
created: 2024-01-15T10:30:00Z
modified: 2024-01-15T14:22:00Z
superTags:
  - project
tagAttributes:
  project:
    status: in-progress
    priority: high
links:
  - id: link-001
    target: another-note-id
    name: relates to
    appearance:
      direction: forward
      colour: "#3b82f6"
      style: solid
      thickness: normal
---

# My Note

This is the note content with a [[wikilink]] to another note.
```

## Super Tags

Super tags add structured data to notes. Create custom schemas with fields like:

- **Text** - Single or multi-line text
- **Number** - Numeric values with optional formatting
- **Date** - Date picker with optional time
- **Select** - Single or multi-select dropdowns
- **Checkbox** - Boolean toggles
- **Note Reference** - Links to other notes
- **Rating** - Star ratings

## Roadmap

- [ ] Semantic search with local embeddings
- [ ] Transclusions (`![[note]]` embeds)
- [ ] Canvas/whiteboard view
- [ ] Calendar/timeline view
- [ ] Import from Obsidian/Roam/Notion
- [ ] Mobile applications
- [ ] Plugin system

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with [Tauri](https://tauri.app/), [React](https://react.dev/), and [Yoopta Editor](https://yoopta.dev/).
