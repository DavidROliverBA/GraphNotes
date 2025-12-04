// src/hooks/useDailyNote.ts

import { useCallback, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';
import { useNotes } from './useNotes';
import {
  getDailyTemplate,
  generateFilepath,
  generateContent,
  formatDate,
} from '../lib/templates/noteTemplates';
import { createDirectory, pathExists } from '../lib/tauri/commands';
import { createEmptyNote, serializeNote } from '../lib/notes/noteParser';
import { writeFile } from '../lib/tauri/commands';

/**
 * Hook for managing daily notes
 */
export function useDailyNote() {
  const { vaultPath, setSelectedNoteId } = useUIStore();
  const { notes } = useNoteStore();
  const { loadNote } = useNotes();

  /**
   * Get the filepath for today's daily note
   */
  const getTodayFilepath = useCallback((): string => {
    const template = getDailyTemplate();
    return generateFilepath(template);
  }, []);

  /**
   * Find today's daily note if it exists
   */
  const findTodayNote = useCallback(() => {
    const todayFilepath = getTodayFilepath();

    for (const note of notes.values()) {
      if (note.filepath === todayFilepath) {
        return note;
      }
    }
    return null;
  }, [notes, getTodayFilepath]);

  /**
   * Create a new daily note for today
   */
  const createDailyNote = useCallback(async () => {
    if (!vaultPath) return null;

    const template = getDailyTemplate();
    const filepath = generateFilepath(template);
    const content = generateContent(template);

    try {
      // Ensure folder exists
      const folderPath = filepath.substring(0, filepath.lastIndexOf('/'));
      if (folderPath) {
        const fullFolderPath = `${vaultPath}/${folderPath}`;
        if (!(await pathExists(fullFolderPath))) {
          await createDirectory(fullFolderPath);
        }
      }

      // Create the note
      const note = createEmptyNote(filepath);
      note.frontmatter = {
        ...note.frontmatter,
        ...template.frontmatterDefaults,
        title: `Daily Note - ${formatDate(new Date())}`,
      };
      note.content = content;

      const serializedContent = serializeNote(note);
      const fullPath = `${vaultPath}/${filepath}`;
      await writeFile(fullPath, serializedContent);

      // Load the note into the store
      const loadedNote = await loadNote(filepath);

      if (loadedNote) {
        setSelectedNoteId(loadedNote.id);
        window.dispatchEvent(new CustomEvent('refresh-file-tree'));
      }

      return loadedNote;
    } catch (error) {
      console.error('[useDailyNote] Failed to create daily note:', error);
      return null;
    }
  }, [vaultPath, loadNote, setSelectedNoteId]);

  /**
   * Open or create today's daily note
   */
  const openDailyNote = useCallback(async () => {
    // Check if today's note exists
    const existingNote = findTodayNote();

    if (existingNote) {
      setSelectedNoteId(existingNote.id);
      return existingNote;
    }

    // Create new daily note
    return createDailyNote();
  }, [findTodayNote, createDailyNote, setSelectedNoteId]);

  // Listen for open-daily-note event from keyboard shortcuts
  useEffect(() => {
    const handleOpenDailyNote = () => {
      openDailyNote();
    };

    window.addEventListener('open-daily-note', handleOpenDailyNote);
    return () => {
      window.removeEventListener('open-daily-note', handleOpenDailyNote);
    };
  }, [openDailyNote]);

  return {
    openDailyNote,
    createDailyNote,
    findTodayNote,
    getTodayFilepath,
  };
}

export default useDailyNote;
