// src/lib/keyboard/shortcuts.ts

/**
 * Keyboard shortcut definitions and utilities
 */

export interface KeyboardShortcut {
  id: string;
  keys: string[];           // e.g., ['Cmd', 'K'] or ['Ctrl', 'Shift', 'P']
  description: string;
  category: ShortcutCategory;
  action: string;           // Action identifier
}

export type ShortcutCategory =
  | 'navigation'
  | 'editing'
  | 'view'
  | 'search'
  | 'notes'
  | 'graph';

/**
 * Platform detection
 */
export const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

/**
 * Get the modifier key name for the current platform
 */
export const modKey = isMac ? 'Cmd' : 'Ctrl';

/**
 * Default keyboard shortcuts
 */
export const defaultShortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'toggle-sidebar',
    keys: [modKey, 'B'],
    description: 'Toggle sidebar',
    category: 'navigation',
    action: 'TOGGLE_SIDEBAR',
  },
  {
    id: 'toggle-graph',
    keys: [modKey, 'G'],
    description: 'Toggle graph panel',
    category: 'navigation',
    action: 'TOGGLE_GRAPH',
  },
  {
    id: 'focus-editor',
    keys: [modKey, 'E'],
    description: 'Focus editor',
    category: 'navigation',
    action: 'FOCUS_EDITOR',
  },

  // Search
  {
    id: 'quick-search',
    keys: [modKey, 'P'],
    description: 'Quick note search',
    category: 'search',
    action: 'QUICK_SEARCH',
  },
  {
    id: 'search-in-files',
    keys: [modKey, 'Shift', 'F'],
    description: 'Search in files',
    category: 'search',
    action: 'SEARCH_IN_FILES',
  },

  // Notes
  {
    id: 'new-note',
    keys: [modKey, 'N'],
    description: 'Create new note',
    category: 'notes',
    action: 'NEW_NOTE',
  },
  {
    id: 'save-note',
    keys: [modKey, 'S'],
    description: 'Save current note',
    category: 'notes',
    action: 'SAVE_NOTE',
  },
  {
    id: 'delete-note',
    keys: [modKey, 'Shift', 'Delete'],
    description: 'Delete current note',
    category: 'notes',
    action: 'DELETE_NOTE',
  },
  {
    id: 'daily-note',
    keys: [modKey, 'D'],
    description: 'Open daily note',
    category: 'notes',
    action: 'DAILY_NOTE',
  },

  // Editing
  {
    id: 'insert-link',
    keys: [modKey, 'K'],
    description: 'Insert link',
    category: 'editing',
    action: 'INSERT_LINK',
  },
  {
    id: 'bold',
    keys: [modKey, 'B'],
    description: 'Bold text',
    category: 'editing',
    action: 'FORMAT_BOLD',
  },
  {
    id: 'italic',
    keys: [modKey, 'I'],
    description: 'Italic text',
    category: 'editing',
    action: 'FORMAT_ITALIC',
  },

  // View
  {
    id: 'zoom-in',
    keys: [modKey, '='],
    description: 'Zoom in',
    category: 'view',
    action: 'ZOOM_IN',
  },
  {
    id: 'zoom-out',
    keys: [modKey, '-'],
    description: 'Zoom out',
    category: 'view',
    action: 'ZOOM_OUT',
  },
  {
    id: 'reset-zoom',
    keys: [modKey, '0'],
    description: 'Reset zoom',
    category: 'view',
    action: 'ZOOM_RESET',
  },
  {
    id: 'open-settings',
    keys: [modKey, ','],
    description: 'Open settings',
    category: 'view',
    action: 'OPEN_SETTINGS',
  },

  // Graph
  {
    id: 'center-graph',
    keys: [modKey, 'Shift', 'C'],
    description: 'Center graph on selected',
    category: 'graph',
    action: 'CENTER_GRAPH',
  },
  {
    id: 'fit-graph',
    keys: [modKey, 'Shift', 'F'],
    description: 'Fit graph to view',
    category: 'graph',
    action: 'FIT_GRAPH',
  },
];

/**
 * Parse a keyboard event into a key combination string
 */
export function parseKeyEvent(event: KeyboardEvent): string[] {
  const keys: string[] = [];

  if (event.metaKey) keys.push('Cmd');
  if (event.ctrlKey) keys.push('Ctrl');
  if (event.altKey) keys.push('Alt');
  if (event.shiftKey) keys.push('Shift');

  // Add the actual key
  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  if (!['Meta', 'Control', 'Alt', 'Shift'].includes(event.key)) {
    keys.push(key);
  }

  return keys;
}

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const eventKeys = parseKeyEvent(event);

  // Normalize shortcut keys for comparison
  const shortcutKeys = shortcut.keys.map(k => {
    if (k === 'Cmd' && !isMac) return 'Ctrl';
    if (k === 'Ctrl' && isMac) return 'Cmd';
    return k;
  });

  // Check if all keys match
  if (eventKeys.length !== shortcutKeys.length) return false;

  return shortcutKeys.every(key => eventKeys.includes(key));
}

/**
 * Format shortcut keys for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  return shortcut.keys.map(key => {
    switch (key) {
      case 'Cmd': return isMac ? '⌘' : 'Ctrl';
      case 'Ctrl': return isMac ? '⌃' : 'Ctrl';
      case 'Alt': return isMac ? '⌥' : 'Alt';
      case 'Shift': return isMac ? '⇧' : 'Shift';
      case 'Enter': return '↵';
      case 'Backspace': return '⌫';
      case 'Delete': return '⌦';
      case 'Escape': return 'Esc';
      case 'ArrowUp': return '↑';
      case 'ArrowDown': return '↓';
      case 'ArrowLeft': return '←';
      case 'ArrowRight': return '→';
      default: return key;
    }
  }).join(isMac ? '' : '+');
}

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(
  shortcuts: KeyboardShortcut[],
  category: ShortcutCategory
): KeyboardShortcut[] {
  return shortcuts.filter(s => s.category === category);
}

/**
 * Find a shortcut by action
 */
export function findShortcutByAction(
  shortcuts: KeyboardShortcut[],
  action: string
): KeyboardShortcut | undefined {
  return shortcuts.find(s => s.action === action);
}

export default defaultShortcuts;
