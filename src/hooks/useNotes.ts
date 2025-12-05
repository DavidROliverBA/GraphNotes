import { useEffect, useCallback, useRef } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Note } from '../lib/notes/types';
import { debounce } from '../lib/utils/debounce';

const AUTO_SAVE_DELAY = 500; // ms

export function useNotes() {
  const {
    notes,
    notesList,
    currentNote,
    loading,
    saving,
    error,
    loadNotesFromVault,
    loadNote,
    saveNote,
    createNote,
    deleteNote,
    renameNote,
    setCurrentNote,
    updateCurrentNoteContent,
    clearError,
  } = useNoteStore();

  const { currentVault } = useSettingsStore();

  // Load notes when vault changes
  useEffect(() => {
    if (currentVault) {
      loadNotesFromVault(currentVault.path);
    }
  }, [currentVault, loadNotesFromVault]);

  // Create debounced save function
  const debouncedSaveRef = useRef(
    debounce((note: Note) => {
      saveNote(note);
    }, AUTO_SAVE_DELAY)
  );

  // Auto-save when content changes
  const updateContentWithAutoSave = useCallback(
    (content: string) => {
      updateCurrentNoteContent(content);

      if (currentNote) {
        const updatedNote: Note = {
          ...currentNote,
          content,
        };
        debouncedSaveRef.current(updatedNote);
      }
    },
    [currentNote, updateCurrentNoteContent]
  );

  // Open a note
  const openNote = useCallback(
    async (filepath: string) => {
      return loadNote(filepath);
    },
    [loadNote]
  );

  // Create a new note
  const newNote = useCallback(
    async (filename: string, title?: string) => {
      if (!currentVault) {
        throw new Error('No vault open');
      }
      return createNote(currentVault.path, filename, title);
    },
    [currentVault, createNote]
  );

  // Close current note
  const closeNote = useCallback(() => {
    setCurrentNote(null);
  }, [setCurrentNote]);

  // Get all wikilink targets for autocomplete
  const getWikilinkTargets = useCallback(() => {
    return notesList.map((note) => ({
      id: note.id,
      title: note.title,
      filepath: note.filepath,
    }));
  }, [notesList]);

  // Find note by title (for wikilink resolution)
  const findNoteByTitle = useCallback(
    (title: string) => {
      const normalizedTitle = title.toLowerCase();

      // First try exact match on title
      const exactMatch = notesList.find(
        (note) => note.title.toLowerCase() === normalizedTitle
      );
      if (exactMatch) return exactMatch;

      // Then try match on filename
      const filenameMatch = notesList.find((note) => {
        const filename = note.filepath.split('/').pop()?.replace('.md', '') || '';
        return filename.toLowerCase() === normalizedTitle;
      });
      if (filenameMatch) return filenameMatch;

      // Fuzzy match (contains)
      const fuzzyMatch = notesList.find(
        (note) =>
          note.title.toLowerCase().includes(normalizedTitle) ||
          note.filepath.toLowerCase().includes(normalizedTitle)
      );

      return fuzzyMatch;
    },
    [notesList]
  );

  return {
    notes,
    notesList,
    currentNote,
    loading,
    saving,
    error,
    openNote,
    newNote,
    saveNote,
    deleteNote,
    renameNote,
    closeNote,
    updateContentWithAutoSave,
    getWikilinkTargets,
    findNoteByTitle,
    clearError,
  };
}
