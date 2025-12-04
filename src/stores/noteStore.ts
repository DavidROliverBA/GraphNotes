// src/stores/noteStore.ts

import { create } from 'zustand';
import { Note, NoteFile } from '../lib/notes/types';

interface NoteState {
  // Notes data
  notes: Map<string, Note>;
  fileTree: NoteFile[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setNotes: (notes: Map<string, Note>) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setFileTree: (tree: NoteFile[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getNoteById: (id: string) => Note | undefined;
  getNoteByPath: (path: string) => Note | undefined;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  // Initial state
  notes: new Map(),
  fileTree: [],
  isLoading: false,
  error: null,

  // Actions
  setNotes: (notes) => set({ notes }),

  addNote: (note) =>
    set((state) => {
      const newNotes = new Map(state.notes);
      newNotes.set(note.id, note);
      return { notes: newNotes };
    }),

  updateNote: (id, updates) =>
    set((state) => {
      const existingNote = state.notes.get(id);
      if (!existingNote) return state;

      const newNotes = new Map(state.notes);
      newNotes.set(id, { ...existingNote, ...updates });
      return { notes: newNotes };
    }),

  deleteNote: (id) =>
    set((state) => {
      const newNotes = new Map(state.notes);
      newNotes.delete(id);
      return { notes: newNotes };
    }),

  setFileTree: (tree) => set({ fileTree: tree }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Selectors
  getNoteById: (id) => get().notes.get(id),

  getNoteByPath: (path) => {
    const notes = get().notes;
    for (const note of notes.values()) {
      if (note.filepath === path) {
        return note;
      }
    }
    return undefined;
  },
}));
