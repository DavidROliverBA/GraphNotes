# GraphNotes: UX/UI Specification

## Design Philosophy

GraphNotes should feel like a **thinking tool** — fast, fluid, and invisible until needed. The interface should disappear when you're writing and reveal its power when you're exploring connections.

### Core Principles

1. **Speed is a feature** — Every interaction should feel instant. No loading spinners for local operations.
2. **Progressive disclosure** — Simple by default, powerful on demand. Don't overwhelm new users.
3. **Keyboard-first, mouse-friendly** — Power users live on the keyboard; casual users should never need it.
4. **Context preservation** — Never lose the user's place. Smooth transitions, not jarring jumps.
5. **Visual calm** — Muted interface, content takes centre stage. Colour is used intentionally.

---

## Visual Design Language

### Aesthetic Direction

**"Modern Editorial"** — Clean, typographic, with subtle depth. Think Linear meets iA Writer meets Figma.

- Generous whitespace
- Strong typographic hierarchy
- Subtle shadows and borders (not flat, not skeuomorphic)
- Purposeful colour accents
- Micro-animations that feel physical

### Colour System

#### Light Theme (Default)

```css
/* Base */
--bg-primary: #ffffff;
--bg-secondary: #f8f9fa;
--bg-tertiary: #f1f3f4;
--bg-elevated: #ffffff;

/* Text */
--text-primary: #1a1a1a;
--text-secondary: #6b7280;
--text-tertiary: #9ca3af;
--text-inverse: #ffffff;

/* Borders */
--border-subtle: #e5e7eb;
--border-default: #d1d5db;
--border-strong: #9ca3af;

/* Accents */
--accent-primary: #6366f1;      /* Indigo - primary actions */
--accent-primary-hover: #4f46e5;
--accent-secondary: #8b5cf6;    /* Purple - super tags */
--accent-success: #22c55e;
--accent-warning: #f59e0b;
--accent-danger: #ef4444;

/* Graph-specific */
--node-default: #e0e7ff;
--node-selected: #6366f1;
--node-hover: #c7d2fe;
--edge-default: #94a3b8;
```

#### Dark Theme

```css
/* Base */
--bg-primary: #0f0f0f;
--bg-secondary: #1a1a1a;
--bg-tertiary: #262626;
--bg-elevated: #1f1f1f;

/* Text */
--text-primary: #f5f5f5;
--text-secondary: #a3a3a3;
--text-tertiary: #737373;
--text-inverse: #0f0f0f;

/* Borders */
--border-subtle: #262626;
--border-default: #404040;
--border-strong: #525252;

/* Accents - slightly more saturated for dark mode */
--accent-primary: #818cf8;
--accent-primary-hover: #6366f1;
--accent-secondary: #a78bfa;
--accent-success: #4ade80;
--accent-warning: #fbbf24;
--accent-danger: #f87171;

/* Graph-specific */
--node-default: #312e81;
--node-selected: #818cf8;
--node-hover: #4338ca;
--edge-default: #64748b;
```

### Typography

```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
--font-editor: 'iA Writer Quattro', 'Literata', Georgia, serif; /* Optional: for editor content */

/* Scale */
--text-xs: 0.75rem;     /* 12px - metadata, timestamps */
--text-sm: 0.875rem;    /* 14px - secondary text, sidebar */
--text-base: 1rem;      /* 16px - body text */
--text-lg: 1.125rem;    /* 18px - subtitles */
--text-xl: 1.25rem;     /* 20px - section headers */
--text-2xl: 1.5rem;     /* 24px - page titles */
--text-3xl: 1.875rem;   /* 30px - hero titles */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
/* 4px base unit */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Shadows & Elevation

```css
/* Subtle depth system */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Glow effects for focus states */
--glow-primary: 0 0 0 3px rgba(99, 102, 241, 0.3);
--glow-danger: 0 0 0 3px rgba(239, 68, 68, 0.3);
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-full: 9999px;
```

---

## Layout Architecture

### Main Application Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Traffic Lights (macOS)    Title / Breadcrumb              Actions │  ← Title Bar (28px)
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                    │
│   Sidebar      │                   Main Content Area                │
│   (280px)      │                                                    │
│                │  ┌──────────────────────────────────────────────┐  │
│  ┌──────────┐  │  │                                              │  │
│  │ Search   │  │  │                                              │  │
│  └──────────┘  │  │                                              │  │
│                │  │              Editor / Graph                  │  │
│  Quick Access  │  │                                              │  │
│  ─────────────  │  │                                              │  │
│  📝 Daily Note │  │                                              │  │
│  ⭐ Favourites │  │                                              │  │
│  🕐 Recent     │  │                                              │  │
│                │  │                                              │  │
│  Vault         │  │                                              │  │
│  ─────────────  │  │                                              │  │
│  📁 File Tree  │  └──────────────────────────────────────────────┘  │
│                │                                                    │
│                │  ┌──────────────────────────────────────────────┐  │
│  Super Tags    │  │   Contextual Panel (collapsible, 300px)      │  │
│  ─────────────  │  │   Links / Properties / Backlinks            │  │
│  🏷️ Projects  │  └──────────────────────────────────────────────┘  │
│  🏷️ People    │                                                    │
│                │                                                    │
├────────────────┴────────────────────────────────────────────────────┤
│  Status: 2 peers connected   │   Word count: 342   │   Saved ✓     │  ← Status Bar (24px)
└─────────────────────────────────────────────────────────────────────┘
```

### Responsive Behaviour (Window Resizing)

| Width | Sidebar | Contextual Panel | Behaviour |
|-------|---------|------------------|-----------|
| < 800px | Hidden (overlay) | Hidden | Mobile-like, hamburger menu |
| 800-1200px | Collapsed (icons only, 60px) | Hidden by default | Click to expand |
| 1200-1600px | Full (280px) | Toggle via button | Standard layout |
| > 1600px | Full (280px) | Always visible | Luxury layout |

### View Modes

Users can switch between three primary views:

1. **Editor View** — Full-width editor, sidebar visible
2. **Graph View** — Full canvas graph, sidebar visible
3. **Split View** — Editor (60%) + Graph (40%), resizable divider

Toggle via:
- Keyboard: `Cmd+1` (Editor), `Cmd+2` (Graph), `Cmd+3` (Split)
- View switcher in title bar

---

## Component Behaviour

### Sidebar

#### Collapse/Expand
- Click hamburger or `Cmd+\` to toggle
- Smooth 200ms ease-out animation
- When collapsed: only icons visible, tooltips on hover
- Remembers state across sessions

#### Search (always visible at top)
- Click or `Cmd+K` to focus
- Instant results as you type (debounced 100ms)
- Results appear inline, pushing content down
- `Esc` to clear and close
- `Enter` on result to open note
- `Tab` through results

#### File Tree
- Folders expand/collapse with subtle rotation animation on chevron
- Drag to reorder files and folders
- Right-click context menu: Rename, Delete, Move, Duplicate, Copy link
- New note: `Cmd+N` or right-click → New Note
- Double-click to open in editor
- Single-click to preview (peek)

#### Super Tags Section
- Shows all super tags with their icons/colours
- Click to open SuperTagBrowser (table view of all notes with that tag)
- Drag a super tag onto a note in file tree to assign
- Badge showing count of notes per tag

### Editor

#### Focus Mode
- `Cmd+Shift+F` for distraction-free writing
- Hides sidebar and contextual panel
- Editor centres with max-width (700px)
- Subtle vignette effect at edges (optional)
- `Esc` to exit

#### Cursor & Selection
- Smooth caret with subtle pulse animation
- Selection highlight in accent colour (10% opacity)
- Multi-cursor support (`Cmd+D` for next occurrence)

#### Block Interactions (Yoopta)
- Hover on block shows drag handle (left) and add button (between blocks)
- Drag handle: 6-dot grip icon, subtle fade-in
- Click add button: opens block type menu
- Slash commands: type `/` for block menu
- Block menu: fuzzy search, keyboard navigation

#### Wikilinks
- Type `[[` → autocomplete dropdown appears
- Dropdown shows:
  - Note title
  - Path (smaller, secondary colour)
  - Super tag badges (if any)
- Fuzzy matching on title and path
- `Tab` or `Enter` to select
- `Shift+Enter` to create new note with that title
- Rendered wikilinks are styled as inline pills:
  ```
  ┌─────────────────┐
  │ 📄 Note Title   │  ← Subtle bg, rounded, clickable
  └─────────────────┘
  ```
- Hover on wikilink: shows preview card (delay 300ms)
- Click: navigate to note
- `Cmd+Click`: open in new tab/split

#### Preview Cards (on wikilink hover)
```
┌─────────────────────────────────────┐
│ Project Alpha                    📁 │  ← Title + super tag icon
│ ─────────────────────────────────── │
│ This is the first paragraph of     │
│ the note content, truncated to...  │  ← First 100 chars
│ ─────────────────────────────────── │
│ 5 backlinks · Modified 2 days ago  │  ← Metadata
└─────────────────────────────────────┘
```
- Appears after 300ms hover delay
- Stays while mouse is over link OR card
- Fades out smoothly when leaving

#### Auto-save
- Save indicator in status bar
- Shows "Saving..." during debounce (500ms)
- Shows "Saved ✓" with subtle fade
- Shows "Offline" with yellow indicator when disconnected

#### Frontmatter
- Hidden by default in editor
- Click "Properties" button in title area to reveal
- Shows as a subtle panel above content
- Or access via contextual panel

### Graph Canvas (React Flow)

#### Visual Style
- Clean white/dark background with subtle dot grid
- Nodes: Rounded rectangles with shadow
- Selected node: Accent border glow
- Edges: Bezier curves with smooth animations

#### Node Design
```
┌─────────────────────────────┐
│  📁  Project Alpha          │  ← Icon (from super tag) + Title
│  ─────────────────────────  │
│  🟣 Project  🔵 Active      │  ← Super tag badges (max 3, then +N)
└─────────────────────────────┘
```

Sizes:
- Normal: 180px × 60px
- Compact: 120px × 40px (for large graphs)
- Expanded: 240px × 100px (shows preview text)

#### Edge Design
- Labels appear at midpoint of edge
- Label on subtle pill background
- Animated edges: flowing dots along path
- Arrow heads match edge colour

#### Interactions
- **Pan**: Drag on canvas (or middle-click drag)
- **Zoom**: Scroll wheel, pinch, or `Cmd++` / `Cmd+-`
- **Select node**: Click
- **Multi-select**: `Shift+Click` or drag selection box
- **Open note**: Double-click node
- **Move node**: Drag node (smooth, physics-based feel)
- **Create edge**: Drag from node handle to another node
- **Edit edge**: Click edge → opens Link Editor panel
- **Delete**: Select + `Backspace` (with confirmation for notes)
- **Context menu**: Right-click on node/edge/canvas

#### Layout Options
- **Force-directed** (default): Organic, physics-based
- **Hierarchical**: Top-down or left-right based on link direction
- **Radial**: Selected node at centre, connections in rings
- **Manual**: Freeze physics, pure manual positioning

Layout button in controls:
```
┌─────────────────────────┐
│  ⚡ Force   🔽 More     │
└─────────────────────────┘
     ↓ Dropdown
┌─────────────────────────┐
│  ⚡ Force-directed  ✓   │
│  📊 Hierarchical        │
│  🎯 Radial              │
│  ✋ Manual               │
│  ──────────────────────  │
│  🎚️ Spacing: ━━━━○━━    │
│  🔗 Show labels  ✓      │
└─────────────────────────┘
```

#### Minimap
- Bottom-right corner
- Draggable viewport rectangle
- Click to jump to area
- Collapsible

#### Filtering
- Filter panel slides in from right
- Filter by super tag (checkboxes)
- Filter by relationship type
- Filter by date range
- "Focus mode": Show only N degrees from selected node

### Search Panel

#### Quick Search (`Cmd+K`)
- Modal overlay with large search input
- Shows as you type
- Categories: Notes, Super Tags, Commands
- Recent searches remembered

```
┌────────────────────────────────────────────────────────────────────┐
│  🔍  Search notes, tags, and commands...                           │
├────────────────────────────────────────────────────────────────────┤
│  RECENT                                                            │
│  📄 Project Alpha                                                  │
│  📄 Meeting Notes - Dec 4                                          │
│  ────────────────────────────────────────────────────────────────  │
│  NOTES                                                    ↵ Open   │
│  📄 Project Alpha Overview                          ...extends the │
│      /projects/alpha.md · 🟣 Project                               │
│  📄 Alpha Team Decisions                            ...key points  │
│      /projects/decisions.md                                        │
│  ────────────────────────────────────────────────────────────────  │
│  SUPER TAGS                                                        │
│  🟣 Project (12 notes)                              ↵ Browse tag   │
│  ────────────────────────────────────────────────────────────────  │
│  COMMANDS                                                          │
│  ⚡ Create new note                                 ⌘N             │
│  ⚡ Toggle graph view                               ⌘2             │
└────────────────────────────────────────────────────────────────────┘
```

#### Advanced Search (Sidebar)
- Expandable filters
- Super tag filter (multi-select dropdown)
- Attribute filters (dynamic based on selected tags)
- Date range picker
- Saved searches / smart folders

### Link Editor Panel

When editing a link (from graph or backlinks panel):

```
┌─────────────────────────────────────────┐
│  Edit Link                          ✕   │
├─────────────────────────────────────────┤
│  From: Project Alpha                    │
│  To:   Research Findings                │
│  ─────────────────────────────────────  │
│                                         │
│  Relationship Name                      │
│  ┌─────────────────────────────────┐    │
│  │ contradicts                  🔽 │    │  ← Dropdown with presets + custom
│  └─────────────────────────────────┘    │
│                                         │
│  Description (optional)                 │
│  ┌─────────────────────────────────┐    │
│  │ Findings challenge our          │    │
│  │ original assumptions...         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  APPEARANCE                             │
│  ─────────────────────────────────────  │
│                                         │
│  Direction                              │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│  │ → │ │ ← │ │ ↔ │ │ — │               │  ← Forward/Back/Both/None
│  └───┘ └───┘ └───┘ └───┘               │
│                                         │
│  Colour                                 │
│  ┌────────────────────────────────┐     │
│  │ ● ● ● ● ● ● ● ●    🎨 Custom  │     │  ← Preset colours + picker
│  └────────────────────────────────┘     │
│                                         │
│  Style                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ ━━━━━━  │ │ ╌╌╌╌╌╌  │ │ ······  │   │
│  │  Solid  │ │ Dashed  │ │ Dotted  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  Thickness                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │    ─    │ │    ━    │ │    ━━   │   │
│  │  Thin   │ │ Normal  │ │  Thick  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ☐ Animated                             │
│                                         │
│  ─────────────────────────────────────  │
│  Preview:  ●━━━contradicts━━━━━▶●      │
│                                         │
├─────────────────────────────────────────┤
│               Save Changes              │
└─────────────────────────────────────────┘
```

### Super Tag Editor

Creating/editing a super tag schema:

```
┌────────────────────────────────────────────────────────────────────┐
│  Create Super Tag                                              ✕   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Tag Name                                                          │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Project                                                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Icon                              Colour                          │
│  ┌─────────────────┐              ┌─────────────────────────────┐  │
│  │ 📁 Change...    │              │ ██████  #8b5cf6             │  │
│  └─────────────────┘              └─────────────────────────────┘  │
│                                                                    │
│  Description                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ A project with timeline, ownership, and status tracking    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ──────────────────────────────────────────────────────────────    │
│  ATTRIBUTES                                               + Add    │
│  ──────────────────────────────────────────────────────────────    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  ⋮⋮  Status                                      ▾   ✕     │    │  ← Drag handle, name, type, delete
│  │      Type: Select ▾                                        │    │
│  │      Options: ┌──────────────────────────────────────┐     │    │
│  │               │ ● Not Started  ● In Progress  + Add │     │    │
│  │               └──────────────────────────────────────┘     │    │
│  │      ☑ Required                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  ⋮⋮  Due Date                                    ▾   ✕     │    │
│  │      Type: Date ▾                                          │    │
│  │      ☐ Include time                                        │    │
│  │      ☐ Required                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  ⋮⋮  Owner                                       ▾   ✕     │    │
│  │      Type: Note Reference ▾                                │    │
│  │      Filter to: 🟢 Person                                  │    │
│  │      ☐ Required                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  + Add Attribute                                                   │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  Preview                                                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  📁 Project                                                │    │
│  │  ─────────────────────────────────────────────────────────  │    │
│  │  Status:    ┌────────────┐                                 │    │
│  │             │ In Progress│                                 │    │
│  │             └────────────┘                                 │    │
│  │  Due Date:  ┌────────────┐                                 │    │
│  │             │ Pick date  │                                 │    │
│  │             └────────────┘                                 │    │
│  │  Owner:     ┌────────────┐                                 │    │
│  │             │ Select...  │                                 │    │
│  │             └────────────┘                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  Cancel                                          Create Super Tag  │
└────────────────────────────────────────────────────────────────────┘
```

### Super Tag Browser (Table View)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  📁 Projects                                                     🔍  + New     │
├────────────────────────────────────────────────────────────────────────────────┤
│  Filters: Status = In Progress ✕   Due Date is not empty ✕      Clear all     │
├─────────────────────┬─────────────┬─────────────┬──────────────┬───────────────┤
│  Title          ▲   │  Status     │  Due Date   │  Owner       │  Modified     │
├─────────────────────┼─────────────┼─────────────┼──────────────┼───────────────┤
│  📄 Project Alpha   │ 🔵 Progress │  Mar 1      │  👤 Sarah    │  2 hours ago  │
├─────────────────────┼─────────────┼─────────────┼──────────────┼───────────────┤
│  📄 Project Beta    │ 🔵 Progress │  Mar 15     │  👤 Tom      │  Yesterday    │
├─────────────────────┼─────────────┼─────────────┼──────────────┼───────────────┤
│  📄 Website Rede... │ 🟡 On Hold  │  Apr 1      │  👤 Sarah    │  3 days ago   │
├─────────────────────┼─────────────┼─────────────┼──────────────┼───────────────┤
│                     │             │             │              │               │
│   + New Project     │             │             │              │               │  ← Quick add row
└─────────────────────┴─────────────┴─────────────┴──────────────┴───────────────┘
```

Features:
- Click column header to sort (asc/desc)
- Drag column headers to reorder
- Click cell to edit inline
- Click title to open note
- Resize columns by dragging borders
- Multi-select rows for bulk actions
- Right-click for context menu

---

## Micro-interactions & Animation

### Timing

```css
--duration-instant: 50ms;    /* Button feedback */
--duration-fast: 100ms;      /* Hover states */
--duration-normal: 200ms;    /* Panel slides, toggles */
--duration-slow: 300ms;      /* Modal opens, overlays */
--duration-slower: 500ms;    /* Page transitions */

--easing-default: cubic-bezier(0.4, 0, 0.2, 1);  /* General purpose */
--easing-in: cubic-bezier(0.4, 0, 1, 1);          /* Accelerate */
--easing-out: cubic-bezier(0, 0, 0.2, 1);         /* Decelerate */
--easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful overshoot */
```

### Specific Animations

| Element | Trigger | Animation |
|---------|---------|-----------|
| Button | Hover | Subtle scale (1.02) + shadow increase |
| Button | Click | Scale down (0.98) + subtle bounce back |
| Sidebar | Toggle | Slide + fade, 200ms ease-out |
| Modal | Open | Fade in bg + scale up content from 0.95 |
| Modal | Close | Fade out + scale down, faster (150ms) |
| Toast | Appear | Slide in from bottom-right + fade |
| Toast | Dismiss | Slide out + fade |
| Node (graph) | Hover | Subtle scale (1.05) + shadow glow |
| Node (graph) | Select | Border glow pulse |
| Edge (graph) | Hover | Thicken + brighten |
| Edge (animated) | Always | Flowing dots along path |
| Dropdown | Open | Scale Y from 0.8 + fade, origin top |
| Search results | Appear | Stagger children (50ms each) |
| File tree expand | Toggle | Height + rotate chevron |

### Skeleton Loading States

For any async operation > 100ms, show skeleton:

```
┌─────────────────────────────────────────────┐
│  ████████████████░░░░░░                     │  ← Shimmer animation
│  ██████████████████████████░░░░░░░          │
│  ████████████░░░░░░░░░░░░░░░░               │
└─────────────────────────────────────────────┘
```

### Empty States

Never show blank areas. Use friendly empty states:

**No notes yet:**
```
      ┌───────────────────────────┐
      │                           │
      │         📝                │
      │                           │
      │   Your vault is empty     │
      │   Create your first note  │
      │                           │
      │   ┌───────────────────┐   │
      │   │  + New Note       │   │
      │   └───────────────────┘   │
      │                           │
      └───────────────────────────┘
```

**No search results:**
```
      ┌───────────────────────────┐
      │                           │
      │         🔍                │
      │                           │
      │  No notes found for       │
      │  "xyz query"              │
      │                           │
      │  Try a different search   │
      │  or create a new note     │
      │                           │
      └───────────────────────────┘
```

---

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `Cmd+N` | New note |
| `Cmd+K` | Quick search / command palette |
| `Cmd+O` | Open note (quick switcher) |
| `Cmd+\` | Toggle sidebar |
| `Cmd+Shift+F` | Focus mode |
| `Cmd+1` | Editor view |
| `Cmd+2` | Graph view |
| `Cmd+3` | Split view |
| `Cmd+,` | Settings |
| `Cmd+S` | Save (though auto-save handles this) |
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |

### Editor

| Shortcut | Action |
|----------|--------|
| `[[` | Start wikilink |
| `/` | Block type menu |
| `Cmd+B` | Bold |
| `Cmd+I` | Italic |
| `Cmd+E` | Inline code |
| `Cmd+K` | Add link |
| `Cmd+D` | Select next occurrence |
| `Cmd+Enter` | Toggle checkbox (on task) |
| `Tab` / `Shift+Tab` | Indent / outdent list |
| `Cmd+Shift+K` | Delete line |
| `Opt+Up/Down` | Move line up/down |

### Graph

| Shortcut | Action |
|----------|--------|
| `Space` | Pan mode (hold) |
| `Cmd++` / `Cmd+-` | Zoom in/out |
| `Cmd+0` | Fit to view |
| `F` | Focus on selected node |
| `L` | Cycle layout |
| `Delete` / `Backspace` | Delete selected (with confirmation) |
| `Escape` | Deselect all |
| `Cmd+A` | Select all visible |

---

## Onboarding

### First Launch

1. **Welcome screen** — Brief intro, option to open existing vault or create new
2. **Vault creation** — Pick folder, set vault name
3. **Quick tour** (optional, skippable):
   - Show sidebar and file tree
   - Create first note
   - Explain wikilinks with animation
   - Show graph view
   - Introduce super tags
4. **Sample content** — Option to create a starter vault with example notes

### Tooltips

- First-time hints on key features
- Dismissable, don't repeat
- "Press Cmd+K to search" badge near search box (fades after first use)
- Subtle "Try: [[" hint in empty editor

---

## Accessibility

### Keyboard Navigation

- All interactive elements focusable
- Visible focus rings (accent glow)
- Logical tab order
- Skip links for main areas
- Arrow key navigation in lists, trees, menus

### Screen Readers

- Proper ARIA labels on all controls
- Live regions for dynamic content (toasts, search results)
- Meaningful alt text for icons
- Role announcements for custom components

### Visual

- Colour contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (UI)
- Don't rely on colour alone (use icons, patterns)
- Reduced motion preference respected
- Text resizable without layout breaking

---

## Performance Targets

| Metric | Target |
|--------|--------|
| App launch | < 1s to interactive |
| Note open | < 100ms |
| Search (10k notes) | < 50ms to first results |
| Graph render (1k nodes) | < 500ms, 60fps pan/zoom |
| Save to disk | < 50ms |
| Keystroke to screen | < 16ms |

---

## Error Handling

### Patterns

- **Inline errors**: Red border + error text below input
- **Toast notifications**: Non-blocking errors, dismissable
- **Modal alerts**: Blocking errors requiring action (data loss warnings)
- **Retry actions**: Automatic retry with exponential backoff, manual retry button

### Messages

- Clear, human language (not error codes)
- Explain what happened AND what to do
- Don't blame the user

**Good:** "Couldn't save changes. Check your disk has space and try again."
**Bad:** "Error: ENOSPC write operation failed"

---

## Platform Integration (macOS/Windows/Linux)

### macOS
- Native title bar with traffic lights
- System accent colour support
- Touch Bar support (optional)
- Handoff between devices (future)
- Menu bar integration

### Windows
- Custom title bar matching app theme
- System accent colour support
- Taskbar jump list (recent notes)
- Native notifications

### Linux
- Respects GTK/Qt theme where possible
- System tray indicator
- Desktop notifications via libnotify

---

*UX Specification v1.0*
*Created: December 2024*
