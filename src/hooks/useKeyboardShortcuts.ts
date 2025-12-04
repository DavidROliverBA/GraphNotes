// src/hooks/useKeyboardShortcuts.ts

import { useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';
import { useNotes } from './useNotes';
import {
  defaultShortcuts,
  matchesShortcut,
  KeyboardShortcut,
} from '../lib/keyboard/shortcuts';

export type ShortcutAction =
  | 'TOGGLE_SIDEBAR'
  | 'TOGGLE_GRAPH'
  | 'FOCUS_EDITOR'
  | 'QUICK_SEARCH'
  | 'SEARCH_IN_FILES'
  | 'NEW_NOTE'
  | 'SAVE_NOTE'
  | 'DELETE_NOTE'
  | 'DAILY_NOTE'
  | 'INSERT_LINK'
  | 'FORMAT_BOLD'
  | 'FORMAT_ITALIC'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'ZOOM_RESET'
  | 'OPEN_SETTINGS'
  | 'CENTER_GRAPH'
  | 'FIT_GRAPH';

interface UseKeyboardShortcutsOptions {
  shortcuts?: KeyboardShortcut[];
  onAction?: (action: ShortcutAction) => void;
  disabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts throughout the app
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    shortcuts = defaultShortcuts,
    onAction,
    disabled = false,
  } = options;

  const {
    sidebarOpen,
    setSidebarOpen,
    viewMode,
    setViewMode,
    setSidebarTab,
    setIsSettingsOpen,
    selectedNoteId,
    vaultPath,
  } = useUIStore();

  const { notes } = useNoteStore();
  const { createNote, saveNote, deleteNote } = useNotes();

  // Track if we're currently handling a shortcut
  const handlingRef = useRef(false);

  // Handle shortcut action
  const handleAction = useCallback(async (action: ShortcutAction) => {
    // Call custom handler if provided
    if (onAction) {
      onAction(action);
    }

    switch (action) {
      case 'TOGGLE_SIDEBAR':
        setSidebarOpen(!sidebarOpen);
        break;

      case 'TOGGLE_GRAPH':
        if (viewMode === 'editor') {
          setViewMode('split');
        } else if (viewMode === 'split') {
          setViewMode('editor');
        } else {
          setViewMode('split');
        }
        break;

      case 'FOCUS_EDITOR':
        // Dispatch custom event for editor to focus
        window.dispatchEvent(new CustomEvent('focus-editor'));
        break;

      case 'QUICK_SEARCH':
        setSidebarOpen(true);
        setSidebarTab('search');
        // Focus search input
        setTimeout(() => {
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          searchInput?.focus();
        }, 100);
        break;

      case 'SEARCH_IN_FILES':
        setSidebarOpen(true);
        setSidebarTab('search');
        setTimeout(() => {
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          searchInput?.focus();
        }, 100);
        break;

      case 'NEW_NOTE':
        if (vaultPath) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const filename = `Untitled-${timestamp}.md`;
          const note = await createNote(filename);
          if (note) {
            useUIStore.getState().setSelectedNoteId(note.id);
            window.dispatchEvent(new CustomEvent('refresh-file-tree'));
          }
        }
        break;

      case 'SAVE_NOTE':
        if (selectedNoteId) {
          const note = notes.get(selectedNoteId);
          if (note) {
            await saveNote(note);
          }
        }
        break;

      case 'DELETE_NOTE':
        if (selectedNoteId) {
          const confirmed = window.confirm('Are you sure you want to delete this note?');
          if (confirmed) {
            await deleteNote(selectedNoteId);
            useUIStore.getState().setSelectedNoteId(null);
            window.dispatchEvent(new CustomEvent('refresh-file-tree'));
          }
        }
        break;

      case 'DAILY_NOTE':
        // Open or create daily note
        window.dispatchEvent(new CustomEvent('open-daily-note'));
        break;

      case 'INSERT_LINK':
        // Dispatch event for editor to handle
        window.dispatchEvent(new CustomEvent('editor-insert-link'));
        break;

      case 'FORMAT_BOLD':
        window.dispatchEvent(new CustomEvent('editor-format-bold'));
        break;

      case 'FORMAT_ITALIC':
        window.dispatchEvent(new CustomEvent('editor-format-italic'));
        break;

      case 'ZOOM_IN':
        window.dispatchEvent(new CustomEvent('zoom-in'));
        break;

      case 'ZOOM_OUT':
        window.dispatchEvent(new CustomEvent('zoom-out'));
        break;

      case 'ZOOM_RESET':
        window.dispatchEvent(new CustomEvent('zoom-reset'));
        break;

      case 'OPEN_SETTINGS':
        setIsSettingsOpen(true);
        break;

      case 'CENTER_GRAPH':
        window.dispatchEvent(new CustomEvent('graph-center'));
        break;

      case 'FIT_GRAPH':
        window.dispatchEvent(new CustomEvent('graph-fit'));
        break;
    }
  }, [
    onAction,
    sidebarOpen,
    setSidebarOpen,
    viewMode,
    setViewMode,
    setSidebarTab,
    setIsSettingsOpen,
    selectedNoteId,
    vaultPath,
    notes,
    createNote,
    saveNote,
    deleteNote,
  ]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled || handlingRef.current) return;

    // Skip if focus is in an input, textarea, or contenteditable
    const target = event.target as HTMLElement;
    const isEditable = (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );

    // Find matching shortcut
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        // Some shortcuts should work even in editable contexts
        const globalShortcuts = [
          'TOGGLE_SIDEBAR',
          'TOGGLE_GRAPH',
          'QUICK_SEARCH',
          'NEW_NOTE',
          'SAVE_NOTE',
          'OPEN_SETTINGS',
        ];

        if (isEditable && !globalShortcuts.includes(shortcut.action)) {
          continue;
        }

        event.preventDefault();
        event.stopPropagation();

        handlingRef.current = true;
        handleAction(shortcut.action as ShortcutAction).finally(() => {
          handlingRef.current = false;
        });

        return;
      }
    }
  }, [disabled, shortcuts, handleAction]);

  // Set up event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts,
    handleAction,
  };
}

export default useKeyboardShortcuts;
