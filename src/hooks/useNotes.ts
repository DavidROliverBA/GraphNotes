// src/hooks/useNotes.ts

import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';
import { readFile, writeFile, getFileTree } from '../lib/tauri/commands';
import { parseNote, createEmptyNote, serializeNote } from '../lib/notes/noteParser';
import { Note } from '../lib/notes/types';

export function useNotes() {
  const { vaultPath } = useUIStore();
  const {
    notes,
    setNotes,
    addNote,
    updateNote,
    deleteNote: removeNoteFromStore,
    setFileTree,
    setIsLoading,
    setError,
  } = useNoteStore();

  /**
   * Load all notes from the vault
   */
  const loadVault = useCallback(async () => {
    if (!vaultPath) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get file tree
      const tree = await getFileTree(vaultPath);
      setFileTree(tree.map(entry => ({
        name: entry.name,
        path: entry.path,
        isDirectory: entry.is_directory,
        children: entry.children?.map(child => ({
          name: child.name,
          path: child.path,
          isDirectory: child.is_directory,
        })),
      })));

      // Load all markdown files
      const notesMap = new Map<string, Note>();

      const loadNotesRecursively = async (entries: typeof tree) => {
        for (const entry of entries) {
          if (entry.is_directory && entry.children) {
            await loadNotesRecursively(entry.children);
          } else if (!entry.is_directory) {
            try {
              const fullPath = `${vaultPath}/${entry.path}`;
              const result = await readFile(fullPath);
              if (result.exists) {
                const note = parseNote(result.content, entry.path);
                notesMap.set(note.id, note);
              }
            } catch (err) {
              console.error(`Failed to load note: ${entry.path}`, err);
            }
          }
        }
      };

      await loadNotesRecursively(tree);
      setNotes(notesMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault');
    } finally {
      setIsLoading(false);
    }
  }, [vaultPath, setNotes, setFileTree, setIsLoading, setError]);

  /**
   * Load a single note by its filepath
   */
  const loadNote = useCallback(async (filepath: string): Promise<Note | null> => {
    if (!vaultPath) return null;

    try {
      const fullPath = `${vaultPath}/${filepath}`;
      const result = await readFile(fullPath);

      if (!result.exists) {
        return null;
      }

      const note = parseNote(result.content, filepath);
      addNote(note);
      return note;
    } catch (err) {
      console.error(`Failed to load note: ${filepath}`, err);
      return null;
    }
  }, [vaultPath, addNote]);

  /**
   * Create a new note
   */
  const createNote = useCallback(async (filename: string, folder: string = ''): Promise<Note | null> => {
    if (!vaultPath) return null;

    const filepath = folder ? `${folder}/${filename}` : filename;
    const fullPath = `${vaultPath}/${filepath}`;

    try {
      const note = createEmptyNote(filepath);
      const content = serializeNote(note);

      await writeFile(fullPath, content);
      addNote(note);

      return note;
    } catch (err) {
      console.error(`Failed to create note: ${filepath}`, err);
      return null;
    }
  }, [vaultPath, addNote]);

  /**
   * Save a note
   */
  const saveNote = useCallback(async (note: Note): Promise<boolean> => {
    if (!vaultPath) return false;

    const fullPath = `${vaultPath}/${note.filepath}`;

    try {
      const content = serializeNote(note);
      await writeFile(fullPath, content);
      updateNote(note.id, { rawContent: content });
      return true;
    } catch (err) {
      console.error(`Failed to save note: ${note.filepath}`, err);
      return false;
    }
  }, [vaultPath, updateNote]);

  /**
   * Delete a note
   */
  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    if (!vaultPath) return false;

    const note = notes.get(noteId);
    if (!note) return false;

    try {
      const { deleteFile } = await import('../lib/tauri/commands');
      const fullPath = `${vaultPath}/${note.filepath}`;
      await deleteFile(fullPath);
      removeNoteFromStore(noteId);
      return true;
    } catch (err) {
      console.error(`Failed to delete note: ${note.filepath}`, err);
      return false;
    }
  }, [vaultPath, notes, removeNoteFromStore]);

  /**
   * Get a note by filepath
   */
  const getNoteByFilepath = useCallback((filepath: string): Note | undefined => {
    for (const note of notes.values()) {
      if (note.filepath === filepath) {
        return note;
      }
    }
    return undefined;
  }, [notes]);

  /**
   * Rename a note (updates title in frontmatter only - filename stays unchanged)
   */
  const renameNote = useCallback(async (
    noteId: string,
    newTitle: string
  ): Promise<boolean> => {
    if (!vaultPath) return false;

    const note = notes.get(noteId);
    if (!note) return false;

    try {
      // Update the title in frontmatter
      const updatedNote: Note = {
        ...note,
        frontmatter: {
          ...note.frontmatter,
          title: newTitle,
          modified: new Date().toISOString(),
        },
      };

      // Serialize and save the note
      const content = serializeNote(updatedNote);
      const fullPath = `${vaultPath}/${note.filepath}`;
      await writeFile(fullPath, content);

      // Update in store
      updateNote(noteId, updatedNote);

      return true;
    } catch (err) {
      console.error(`Failed to rename note: ${note.filepath}`, err);
      return false;
    }
  }, [vaultPath, notes, updateNote]);

  return {
    loadVault,
    loadNote,
    createNote,
    saveNote,
    deleteNote,
    renameNote,
    getNoteByFilepath,
  };
}

export default useNotes;
