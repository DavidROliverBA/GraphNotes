// Keyboard shortcut definitions and utilities

export type ShortcutAction =
  // Navigation
  | 'quickOpen'
  | 'commandPalette'
  | 'goToGraph'
  | 'goToEditor'
  | 'goToSearch'
  | 'toggleSidebar'
  | 'toggleLinkPanel'
  // Note operations
  | 'newNote'
  | 'saveNote'
  | 'deleteNote'
  | 'dailyNote'
  // Editor
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'code'
  | 'link'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todoList'
  | 'blockquote'
  // Search
  | 'findInNote'
  | 'findAndReplace'
  // Graph
  | 'zoomIn'
  | 'zoomOut'
  | 'zoomToFit'
  | 'focusSelectedNode'
  // Sync
  | 'syncNow'
  // Settings
  | 'openSettings'
  | 'toggleTheme';

export interface ShortcutDefinition {
  action: ShortcutAction;
  label: string;
  description: string;
  category: 'navigation' | 'notes' | 'editor' | 'search' | 'graph' | 'sync' | 'settings';
  defaultKeys: string[];
  customKeys?: string[];
  enabled: boolean;
}

export interface KeyCombo {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac
  alt?: boolean;
  shift?: boolean;
}

// Platform detection
export const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Modifier key helper (Cmd on Mac, Ctrl on Windows/Linux)
export const MOD = isMac ? 'meta' : 'ctrl';

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  // Navigation
  {
    action: 'quickOpen',
    label: 'Quick Open',
    description: 'Open the quick switcher to find notes',
    category: 'navigation',
    defaultKeys: [isMac ? 'Cmd+O' : 'Ctrl+O'],
    enabled: true,
  },
  {
    action: 'commandPalette',
    label: 'Command Palette',
    description: 'Open the command palette',
    category: 'navigation',
    defaultKeys: [isMac ? 'Cmd+K' : 'Ctrl+K'],
    enabled: true,
  },
  {
    action: 'goToGraph',
    label: 'Go to Graph',
    description: 'Switch to graph view',
    category: 'navigation',
    defaultKeys: [isMac ? 'Cmd+G' : 'Ctrl+G'],
    enabled: true,
  },
  {
    action: 'goToEditor',
    label: 'Go to Editor',
    description: 'Focus the editor',
    category: 'navigation',
    defaultKeys: [isMac ? 'Cmd+E' : 'Ctrl+E'],
    enabled: true,
  },
  {
    action: 'goToSearch',
    label: 'Go to Search',
    description: 'Focus the search panel',
    category: 'navigation',
    defaultKeys: [isMac ? 'Cmd+Shift+F' : 'Ctrl+Shift+F'],
    enabled: true,
  },
  {
    action: 'toggleSidebar',
    label: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    category: 'navigation',
    defaultKeys: [isMac ? 'Cmd+\\' : 'Ctrl+\\'],
    enabled: true,
  },
  {
    action: 'toggleLinkPanel',
    label: 'Toggle Link Panel',
    description: 'Show or hide the link panel',
    category: 'navigation',
    defaultKeys: [isMac ? 'Cmd+Shift+L' : 'Ctrl+Shift+L'],
    enabled: true,
  },

  // Note operations
  {
    action: 'newNote',
    label: 'New Note',
    description: 'Create a new note',
    category: 'notes',
    defaultKeys: [isMac ? 'Cmd+N' : 'Ctrl+N'],
    enabled: true,
  },
  {
    action: 'saveNote',
    label: 'Save Note',
    description: 'Save the current note',
    category: 'notes',
    defaultKeys: [isMac ? 'Cmd+S' : 'Ctrl+S'],
    enabled: true,
  },
  {
    action: 'deleteNote',
    label: 'Delete Note',
    description: 'Delete the current note',
    category: 'notes',
    defaultKeys: [isMac ? 'Cmd+Backspace' : 'Ctrl+Delete'],
    enabled: true,
  },
  {
    action: 'dailyNote',
    label: 'Daily Note',
    description: 'Open or create today\'s daily note',
    category: 'notes',
    defaultKeys: [isMac ? 'Cmd+D' : 'Ctrl+D'],
    enabled: true,
  },

  // Editor formatting
  {
    action: 'bold',
    label: 'Bold',
    description: 'Make text bold',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+B' : 'Ctrl+B'],
    enabled: true,
  },
  {
    action: 'italic',
    label: 'Italic',
    description: 'Make text italic',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+I' : 'Ctrl+I'],
    enabled: true,
  },
  {
    action: 'strikethrough',
    label: 'Strikethrough',
    description: 'Strikethrough text',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+Shift+S' : 'Ctrl+Shift+S'],
    enabled: true,
  },
  {
    action: 'code',
    label: 'Inline Code',
    description: 'Format as inline code',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+`' : 'Ctrl+`'],
    enabled: true,
  },
  {
    action: 'link',
    label: 'Insert Link',
    description: 'Insert a link',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+K' : 'Ctrl+K'],
    enabled: false, // Conflicts with command palette
  },
  {
    action: 'heading1',
    label: 'Heading 1',
    description: 'Format as heading 1',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+1' : 'Ctrl+1'],
    enabled: true,
  },
  {
    action: 'heading2',
    label: 'Heading 2',
    description: 'Format as heading 2',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+2' : 'Ctrl+2'],
    enabled: true,
  },
  {
    action: 'heading3',
    label: 'Heading 3',
    description: 'Format as heading 3',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+3' : 'Ctrl+3'],
    enabled: true,
  },
  {
    action: 'bulletList',
    label: 'Bullet List',
    description: 'Create a bullet list',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+Shift+8' : 'Ctrl+Shift+8'],
    enabled: true,
  },
  {
    action: 'numberedList',
    label: 'Numbered List',
    description: 'Create a numbered list',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+Shift+7' : 'Ctrl+Shift+7'],
    enabled: true,
  },
  {
    action: 'todoList',
    label: 'Todo List',
    description: 'Create a todo list',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+Shift+9' : 'Ctrl+Shift+9'],
    enabled: true,
  },
  {
    action: 'blockquote',
    label: 'Blockquote',
    description: 'Format as blockquote',
    category: 'editor',
    defaultKeys: [isMac ? 'Cmd+Shift+.' : 'Ctrl+Shift+.'],
    enabled: true,
  },

  // Search
  {
    action: 'findInNote',
    label: 'Find in Note',
    description: 'Search within the current note',
    category: 'search',
    defaultKeys: [isMac ? 'Cmd+F' : 'Ctrl+F'],
    enabled: true,
  },
  {
    action: 'findAndReplace',
    label: 'Find and Replace',
    description: 'Find and replace text',
    category: 'search',
    defaultKeys: [isMac ? 'Cmd+H' : 'Ctrl+H'],
    enabled: true,
  },

  // Graph
  {
    action: 'zoomIn',
    label: 'Zoom In',
    description: 'Zoom in on the graph',
    category: 'graph',
    defaultKeys: [isMac ? 'Cmd+=' : 'Ctrl+='],
    enabled: true,
  },
  {
    action: 'zoomOut',
    label: 'Zoom Out',
    description: 'Zoom out on the graph',
    category: 'graph',
    defaultKeys: [isMac ? 'Cmd+-' : 'Ctrl+-'],
    enabled: true,
  },
  {
    action: 'zoomToFit',
    label: 'Zoom to Fit',
    description: 'Fit all nodes in view',
    category: 'graph',
    defaultKeys: [isMac ? 'Cmd+0' : 'Ctrl+0'],
    enabled: true,
  },
  {
    action: 'focusSelectedNode',
    label: 'Focus Selected',
    description: 'Center view on selected node',
    category: 'graph',
    defaultKeys: ['F'],
    enabled: true,
  },

  // Sync
  {
    action: 'syncNow',
    label: 'Sync Now',
    description: 'Force sync with other devices',
    category: 'sync',
    defaultKeys: [isMac ? 'Cmd+Shift+S' : 'Ctrl+Shift+S'],
    enabled: false, // Conflicts with strikethrough
  },

  // Settings
  {
    action: 'openSettings',
    label: 'Open Settings',
    description: 'Open the settings panel',
    category: 'settings',
    defaultKeys: [isMac ? 'Cmd+,' : 'Ctrl+,'],
    enabled: true,
  },
  {
    action: 'toggleTheme',
    label: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    category: 'settings',
    defaultKeys: [isMac ? 'Cmd+Shift+T' : 'Ctrl+Shift+T'],
    enabled: true,
  },
];

// Parse a key string like "Cmd+Shift+K" into a KeyCombo
export function parseKeyString(keyString: string): KeyCombo {
  const parts = keyString.split('+').map((p) => p.trim().toLowerCase());
  const key = parts[parts.length - 1];

  return {
    key: key === 'backspace' ? 'Backspace' : key === 'delete' ? 'Delete' : key,
    ctrl: parts.includes('ctrl'),
    meta: parts.includes('cmd') || parts.includes('meta'),
    alt: parts.includes('alt') || parts.includes('option'),
    shift: parts.includes('shift'),
  };
}

// Format a KeyCombo into a display string
export function formatKeyCombo(combo: KeyCombo): string {
  const parts: string[] = [];

  if (isMac) {
    if (combo.ctrl) parts.push('\u2303'); // Control
    if (combo.alt) parts.push('\u2325'); // Option
    if (combo.shift) parts.push('\u21E7'); // Shift
    if (combo.meta) parts.push('\u2318'); // Command
  } else {
    if (combo.ctrl) parts.push('Ctrl');
    if (combo.alt) parts.push('Alt');
    if (combo.shift) parts.push('Shift');
    if (combo.meta) parts.push('Win');
  }

  // Format the key
  let keyDisplay = combo.key;
  if (keyDisplay === 'Backspace') keyDisplay = isMac ? '\u232B' : 'Backspace';
  if (keyDisplay === 'Delete') keyDisplay = isMac ? '\u2326' : 'Delete';
  if (keyDisplay === 'Enter') keyDisplay = isMac ? '\u21A9' : 'Enter';
  if (keyDisplay === 'Escape') keyDisplay = 'Esc';
  if (keyDisplay === ' ') keyDisplay = 'Space';
  if (keyDisplay.length === 1) keyDisplay = keyDisplay.toUpperCase();

  parts.push(keyDisplay);

  return isMac ? parts.join('') : parts.join('+');
}

// Check if a keyboard event matches a KeyCombo
export function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const eventKey = event.key.toLowerCase();
  const comboKey = combo.key.toLowerCase();

  // Check modifiers
  if (combo.ctrl && !event.ctrlKey) return false;
  if (combo.meta && !event.metaKey) return false;
  if (combo.alt && !event.altKey) return false;
  if (combo.shift && !event.shiftKey) return false;

  // Check that we don't have extra modifiers
  if (!combo.ctrl && event.ctrlKey) return false;
  if (!combo.meta && event.metaKey) return false;
  if (!combo.alt && event.altKey) return false;
  if (!combo.shift && event.shiftKey) return false;

  // Check key
  return eventKey === comboKey || event.code.toLowerCase() === comboKey;
}

// Get shortcuts grouped by category
export function getShortcutsByCategory(
  shortcuts: ShortcutDefinition[]
): Record<string, ShortcutDefinition[]> {
  const grouped: Record<string, ShortcutDefinition[]> = {};

  for (const shortcut of shortcuts) {
    if (!grouped[shortcut.category]) {
      grouped[shortcut.category] = [];
    }
    grouped[shortcut.category].push(shortcut);
  }

  return grouped;
}

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  notes: 'Notes',
  editor: 'Editor',
  search: 'Search',
  graph: 'Graph',
  sync: 'Sync',
  settings: 'Settings',
};
