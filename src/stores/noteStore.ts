import { create } from 'zustand';
import { Note, NoteListItem } from '../lib/notes/types';
import { parseNote, serializeNote, createNewNote } from '../lib/notes/noteParser';
import { readFile, writeFile, createFile, readDirectory, deleteFile, renameFile } from '../lib/tauri/commands';

interface NoteState {
  // Notes data
  notes: Map<string, Note>;
  notesList: NoteListItem[];
  currentNote: Note | null;

  // Loading states
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  loadNotesFromVault: (vaultPath: string) => Promise<void>;
  loadNote: (filepath: string) => Promise<Note | null>;
  saveNote: (note: Note) => Promise<void>;
  createNote: (vaultPath: string, filename: string, title?: string) => Promise<Note>;
  deleteNote: (filepath: string) => Promise<void>;
  renameNote: (oldPath: string, newPath: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  updateCurrentNoteContent: (content: string) => void;
  clearError: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: new Map(),
  notesList: [],
  currentNote: null,
  loading: false,
  saving: false,
  error: null,

  loadNotesFromVault: async (vaultPath: string) => {
    set({ loading: true, error: null });

    try {
      const notesList: NoteListItem[] = [];
      const notes = new Map<string, Note>();

      // Recursively scan for markdown files
      const scanDirectory = async (dirPath: string) => {
        const entries = await readDirectory(dirPath);

        for (const entry of entries) {
          // Skip hidden files and .graphnotes directory
          if (entry.name.startsWith('.')) continue;

          if (entry.is_directory) {
            await scanDirectory(entry.path);
          } else if (entry.is_file && entry.extension === 'md') {
            try {
              const fileContent = await readFile(entry.path);
              const note = parseNote(entry.path, fileContent.content);

              notes.set(entry.path, note);
              notesList.push({
                id: note.id,
                filepath: entry.path,
                title: note.frontmatter.title,
                created: note.frontmatter.created,
                modified: note.frontmatter.modified,
                superTags: note.frontmatter.superTags,
              });
            } catch (err) {
              console.error(`Failed to parse note: ${entry.path}`, err);
            }
          }
        }
      };

      await scanDirectory(vaultPath);

      // Sort by modified date (most recent first)
      notesList.sort((a, b) =>
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );

      set({ notes, notesList, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load notes',
      });
    }
  },

  loadNote: async (filepath: string) => {
    const { notes } = get();

    // Check cache first
    if (notes.has(filepath)) {
      const note = notes.get(filepath)!;
      set({ currentNote: note });
      return note;
    }

    set({ loading: true, error: null });

    try {
      const fileContent = await readFile(filepath);
      const note = parseNote(filepath, fileContent.content);

      // Update cache
      const newNotes = new Map(notes);
      newNotes.set(filepath, note);

      set({ notes: newNotes, currentNote: note, loading: false });
      return note;
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load note',
      });
      return null;
    }
  },

  saveNote: async (note: Note) => {
    set({ saving: true, error: null });

    try {
      // Update modified timestamp
      const updatedNote: Note = {
        ...note,
        frontmatter: {
          ...note.frontmatter,
          modified: new Date().toISOString(),
        },
      };

      const serialized = serializeNote(updatedNote);
      await writeFile(note.filepath, serialized);

      // Update cache
      const { notes, notesList } = get();
      const newNotes = new Map(notes);
      newNotes.set(note.filepath, { ...updatedNote, rawContent: serialized });

      // Update notes list
      const newNotesList = notesList.map((item) =>
        item.filepath === note.filepath
          ? {
              ...item,
              title: updatedNote.frontmatter.title,
              modified: updatedNote.frontmatter.modified,
              superTags: updatedNote.frontmatter.superTags,
            }
          : item
      );

      set({
        notes: newNotes,
        notesList: newNotesList,
        currentNote: { ...updatedNote, rawContent: serialized },
        saving: false,
      });
    } catch (err) {
      set({
        saving: false,
        error: err instanceof Error ? err.message : 'Failed to save note',
      });
    }
  },

  createNote: async (vaultPath: string, filename: string, title?: string) => {
    set({ loading: true, error: null });

    try {
      // Ensure filename has .md extension
      const normalizedFilename = filename.endsWith('.md')
        ? filename
        : `${filename}.md`;

      const filepath = `${vaultPath}/${normalizedFilename}`;
      const note = createNewNote(filepath, title);
      const serialized = serializeNote(note);

      await createFile(filepath, serialized);

      // Update cache
      const { notes, notesList } = get();
      const newNotes = new Map(notes);
      newNotes.set(filepath, { ...note, rawContent: serialized });

      const newNotesList = [
        {
          id: note.id,
          filepath,
          title: note.frontmatter.title,
          created: note.frontmatter.created,
          modified: note.frontmatter.modified,
          superTags: note.frontmatter.superTags,
        },
        ...notesList,
      ];

      set({
        notes: newNotes,
        notesList: newNotesList,
        currentNote: { ...note, rawContent: serialized },
        loading: false,
      });

      return { ...note, rawContent: serialized };
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to create note',
      });
      throw err;
    }
  },

  deleteNote: async (filepath: string) => {
    set({ loading: true, error: null });

    try {
      await deleteFile(filepath);

      // Update cache
      const { notes, notesList, currentNote } = get();
      const newNotes = new Map(notes);
      newNotes.delete(filepath);

      const newNotesList = notesList.filter((item) => item.filepath !== filepath);

      set({
        notes: newNotes,
        notesList: newNotesList,
        currentNote: currentNote?.filepath === filepath ? null : currentNote,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to delete note',
      });
    }
  },

  renameNote: async (oldPath: string, newPath: string) => {
    set({ loading: true, error: null });

    try {
      await renameFile(oldPath, newPath);

      // Update cache
      const { notes, notesList, currentNote } = get();
      const note = notes.get(oldPath);

      if (note) {
        const newNotes = new Map(notes);
        newNotes.delete(oldPath);

        const updatedNote: Note = {
          ...note,
          filepath: newPath,
        };
        newNotes.set(newPath, updatedNote);

        const newNotesList = notesList.map((item) =>
          item.filepath === oldPath ? { ...item, filepath: newPath } : item
        );

        set({
          notes: newNotes,
          notesList: newNotesList,
          currentNote:
            currentNote?.filepath === oldPath ? updatedNote : currentNote,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to rename note',
      });
    }
  },

  setCurrentNote: (note: Note | null) => {
    set({ currentNote: note });
  },

  updateCurrentNoteContent: (content: string) => {
    const { currentNote } = get();
    if (currentNote) {
      set({
        currentNote: {
          ...currentNote,
          content,
        },
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
