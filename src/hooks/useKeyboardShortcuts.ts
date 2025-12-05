import { useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';
import {
  ShortcutAction,
  ShortcutDefinition,
  DEFAULT_SHORTCUTS,
  parseKeyString,
  matchesKeyCombo,
} from '../lib/keyboard/shortcuts';

type ShortcutHandler = (action: ShortcutAction, event: KeyboardEvent) => void;

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onAction?: ShortcutHandler;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, onAction } = options;
  const { currentVault } = useSettingsStore();
  const {
    toggleSidebar,
    toggleLinkPanel,
    setShowSettings,
    setShowQuickSearch,
  } = useUIStore();
  const { createNote, currentNote, saveNote } = useNoteStore();

  // Store shortcuts with custom overrides
  const shortcutsRef = useRef<ShortcutDefinition[]>(DEFAULT_SHORTCUTS);

  // Action handlers
  const handleAction = useCallback(
    (action: ShortcutAction, event: KeyboardEvent) => {
      // Call custom handler if provided
      if (onAction) {
        onAction(action, event);
      }

      // Built-in handlers
      switch (action) {
        case 'quickOpen':
        case 'commandPalette':
          setShowQuickSearch(true);
          break;

        case 'toggleSidebar':
          toggleSidebar();
          break;

        case 'toggleLinkPanel':
          toggleLinkPanel();
          break;

        case 'openSettings':
          setShowSettings(true);
          break;

        case 'newNote':
          if (currentVault) {
            const filename = `untitled-${Date.now()}.md`;
            createNote(currentVault.path, filename);
          }
          break;

        case 'saveNote':
          if (currentNote) {
            saveNote(currentNote);
          }
          break;

        case 'dailyNote':
          // Will be handled by useDailyNote hook
          break;

        case 'toggleTheme':
          // Will be handled by theme system
          document.documentElement.classList.toggle('dark');
          break;

        // Editor actions are handled by Yoopta
        case 'bold':
        case 'italic':
        case 'strikethrough':
        case 'code':
        case 'link':
        case 'heading1':
        case 'heading2':
        case 'heading3':
        case 'bulletList':
        case 'numberedList':
        case 'todoList':
        case 'blockquote':
          // These are handled by the editor
          return false;

        // Graph actions
        case 'zoomIn':
        case 'zoomOut':
        case 'zoomToFit':
        case 'focusSelectedNode':
          // These are handled by the graph component
          return false;

        default:
          return false;
      }

      return true;
    },
    [
      onAction,
      setShowQuickSearch,
      toggleSidebar,
      toggleLinkPanel,
      setShowSettings,
      currentVault,
      createNote,
      currentNote,
      saveNote,
    ]
  );

  // Main keyboard event handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle if user is typing in an input
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Find matching shortcut
      for (const shortcut of shortcutsRef.current) {
        if (!shortcut.enabled) continue;

        const keys = shortcut.customKeys || shortcut.defaultKeys;
        for (const keyString of keys) {
          const combo = parseKeyString(keyString);
          if (matchesKeyCombo(event, combo)) {
            // Some shortcuts work even in inputs
            const worksInInput = [
              'quickOpen',
              'commandPalette',
              'saveNote',
              'openSettings',
            ].includes(shortcut.action);

            if (isInput && !worksInInput) continue;

            // Prevent default and handle
            event.preventDefault();
            event.stopPropagation();
            handleAction(shortcut.action, event);
            return;
          }
        }
      }
    },
    [enabled, handleAction]
  );

  // Register global listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Update shortcuts (for custom key bindings)
  const updateShortcut = useCallback(
    (action: ShortcutAction, customKeys: string[]) => {
      shortcutsRef.current = shortcutsRef.current.map((s) =>
        s.action === action ? { ...s, customKeys } : s
      );
    },
    []
  );

  // Reset shortcut to default
  const resetShortcut = useCallback((action: ShortcutAction) => {
    shortcutsRef.current = shortcutsRef.current.map((s) =>
      s.action === action ? { ...s, customKeys: undefined } : s
    );
  }, []);

  // Get current shortcuts
  const getShortcuts = useCallback(() => {
    return shortcutsRef.current;
  }, []);

  return {
    shortcuts: shortcutsRef.current,
    updateShortcut,
    resetShortcut,
    getShortcuts,
  };
}

// Simpler hook for listening to a single action
export function useShortcut(
  action: ShortcutAction,
  handler: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const shortcut = DEFAULT_SHORTCUTS.find((s) => s.action === action);
    if (!shortcut || !shortcut.enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = shortcut.customKeys || shortcut.defaultKeys;
      for (const keyString of keys) {
        const combo = parseKeyString(keyString);
        if (matchesKeyCombo(event, combo)) {
          event.preventDefault();
          handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [action, handler, enabled]);
}
