# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GraphNotes is a local-first, desktop note-taking application with a graph-based knowledge structure. Built with Tauri 2.x (Rust backend) and React + TypeScript frontend. Notes are stored as plain markdown files with YAML frontmatter, connected via bidirectional wikilinks with named, asymmetric relationships.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server (port 1420)
npm run tauri dev    # Run full Tauri app with hot reload
npm run build        # TypeScript check + Vite build
npm run tauri build  # Production build of Tauri app
```

### Testing
```bash
npm run test         # Run Vitest in watch mode
npm run test:run     # Run Vitest once
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright with UI
npm run test:e2e:headed  # Run E2E in headed browser
```

E2E tests run against Vite dev server with mocked Tauri APIs (see `e2e/utils/tauri-mocks.ts`).

## Architecture

### Tech Stack
- **App Shell**: Tauri 2.x (Rust) - file system access, native dialogs
- **Frontend**: React 19 + TypeScript + Vite
- **Editor**: Yoopta Editor (block-based WYSIWYG)
- **Graph**: React Flow (@xyflow/react) for visualization
- **State**: Zustand stores
- **Styling**: Tailwind CSS with CSS variable-based theming
- **Search**: MiniSearch for in-memory full-text search
- **Frontmatter**: gray-matter for YAML parsing

### Key Directories
```
src/
├── components/     # React components by feature
│   ├── Editor/     # Yoopta editor wrapper, toolbar, wikilink suggestions
│   ├── Graph/      # React Flow graph view, custom nodes/edges
│   ├── Layout/     # MainLayout, GraphPanel, VaultSelector
│   ├── Sidebar/    # FileTree, navigation
│   ├── Search/     # QuickSearch (Cmd+K), SearchPanel
│   ├── SuperTags/  # Schema editor, tag browser, attribute inputs
│   ├── LinkPanel/  # Backlinks, link editor
│   └── Settings/   # Settings panel, keyboard shortcuts
├── stores/         # Zustand state stores
│   ├── noteStore.ts      # Notes CRUD, loading/saving
│   ├── uiStore.ts        # UI state (view mode, selections, modals)
│   ├── graphStore.ts     # Graph nodes/edges state
│   ├── superTagStore.ts  # Super tag schemas
│   └── settingsStore.ts  # App settings, current vault
├── lib/            # Business logic
│   ├── notes/      # Note parsing, types
│   ├── graph/      # GraphManager, link parsing
│   ├── search/     # SearchIndex wrapper
│   ├── superTags/  # Schema types
│   ├── sync/       # Event sourcing (EventLog, SyncEngine)
│   ├── keyboard/   # Keyboard shortcut definitions
│   └── tauri/      # Tauri command wrappers
├── hooks/          # React hooks for features
└── e2e/            # Playwright E2E tests
    └── utils/tauri-mocks.ts  # Mock Tauri APIs for browser testing

src-tauri/
├── src/
│   ├── lib.rs      # Tauri app setup, plugin registration
│   ├── main.rs     # Entry point
│   └── commands/   # Tauri IPC commands
│       └── files.rs  # File operations (read, write, delete, etc.)
```

### Data Flow
1. User selects vault via `VaultSelector` -> stored in `settingsStore`
2. `noteStore.loadNotesFromVault()` scans directory for `.md` files
3. Notes parsed with `gray-matter` extracting frontmatter
4. `graphStore` builds graph from note links
5. Editor changes saved with debouncing via `noteStore.saveNote()`

### Note Structure
Notes are markdown with YAML frontmatter containing:
- `id`: UUID
- `title`, `created`, `modified` (ISO 8601 dates)
- `superTags`: array of tag IDs
- `tagAttributes`: structured data per tag
- `links`: array of link definitions with appearance settings

### View Modes
Three modes controlled by `uiStore.viewMode`:
- `editor`: Full-width editor
- `graph`: Full React Flow graph
- `split`: Side-by-side editor + graph

### Keyboard Shortcuts
Defined in `src/lib/keyboard/shortcuts.ts`. Key shortcuts:
- `Cmd+K`: Quick search
- `Cmd+1/2/3`: Switch view modes
- `Cmd+\`: Toggle sidebar
- `Cmd+N`: New note

### Theming
CSS variables in `src/styles/globals.css` with `.dark` class toggle. Tailwind config uses these variables for colors.

## Tauri Commands

IPC commands exposed from Rust to frontend (invoke via `@tauri-apps/api`):
- `read_directory`, `read_file`, `write_file`
- `create_file`, `delete_file`, `rename_file`
- `file_exists`, `create_directory`

Wrapped in `src/lib/tauri/commands.ts` with TypeScript types.

## Testing Notes

- Unit tests use Vitest with jsdom
- E2E tests mock Tauri APIs in browser context
- Test fixtures in `e2e/fixtures/test-fixtures.ts`
- Playwright configured for Chromium only (add Firefox/WebKit as needed)
