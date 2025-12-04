// src/components/Editor/Editor.tsx

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { debounce } from '../../lib/utils/debounce';
import { writeFile } from '../../lib/tauri/commands';
import { serializeNote, htmlToMarkdown, markdownToHtml } from '../../lib/notes/noteParser';
import EditorToolbar from './EditorToolbar';
import { Wikilink } from './extensions/wikilink';

import './editor.css';

const lowlight = createLowlight(common);

interface EditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialContent = '', onSave }) => {
  const { selectedNoteId, vaultPath, setSelectedNoteId } = useUIStore();
  const { getNoteById, updateNote, notes } = useNoteStore();

  const selectedNote = selectedNoteId ? getNoteById(selectedNoteId) : null;

  // Use ref for wikilink click handler to avoid recreating editor
  const wikilinkClickRef = useRef<(target: string) => void>(() => {});

  // Update the ref when notes/setSelectedNoteId changes
  useEffect(() => {
    wikilinkClickRef.current = (target: string) => {
      // Find note by title or filepath
      for (const note of notes.values()) {
        if (
          note.frontmatter.title.toLowerCase() === target.toLowerCase() ||
          note.filepath.toLowerCase().includes(target.toLowerCase())
        ) {
          setSelectedNoteId(note.id);
          return;
        }
      }
      console.log('Note not found:', target);
    };
  }, [notes, setSelectedNoteId]);

  // Stable callback that uses the ref
  const handleWikilinkClick = useCallback((target: string) => {
    wikilinkClickRef.current(target);
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (htmlContent: string) => {
      if (!selectedNote || !vaultPath) return;

      // Convert HTML back to markdown for storage
      const markdownContent = htmlToMarkdown(htmlContent);

      const fullPath = `${vaultPath}/${selectedNote.filepath}`;
      const updatedNote = {
        ...selectedNote,
        content: markdownContent,
        frontmatter: {
          ...selectedNote.frontmatter,
          modified: new Date().toISOString(),
        },
      };

      const serialized = serializeNote(updatedNote);

      try {
        await writeFile(fullPath, serialized);
        updateNote(selectedNote.id, {
          content: markdownContent,
          rawContent: serialized,
          frontmatter: updatedNote.frontmatter,
        });
        onSave?.(markdownContent);
      } catch (error) {
        console.error('Failed to save note:', error);
      }
    }, 1000),
    [selectedNote, vaultPath, updateNote, onSave]
  );

  // Memoize extensions to prevent duplicate extension warnings
  const extensions = useMemo(() => [
    StarterKit.configure({
      codeBlock: false, // We use CodeBlockLowlight instead
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Placeholder.configure({
      placeholder: 'Start writing...',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-accent-primary underline',
      },
    }),
    Typography,
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Wikilink.configure({
      onWikilinkClick: handleWikilinkClick,
    }),
  ], [handleWikilinkClick]);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-full',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      debouncedSave(content);
    },
  });

  // Load note content when selected note changes
  useEffect(() => {
    if (!editor || !selectedNote) return;

    // Convert markdown to HTML for the editor
    const htmlContent = markdownToHtml(selectedNote.content || '');
    editor.commands.setContent(htmlContent);
  }, [editor, selectedNote?.id]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto p-4">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default Editor;
