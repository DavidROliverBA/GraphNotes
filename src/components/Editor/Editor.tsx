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
import { Wikilink, WikilinkSuggestionItem } from './extensions/wikilink';
import { WikilinkSuggestionExtension } from './extensions/WikilinkSuggestionExtension';

import './editor.css';
import 'tippy.js/dist/tippy.css';

const lowlight = createLowlight(common);

interface EditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialContent = '', onSave }) => {
  const { selectedNoteId, vaultPath, setSelectedNoteId } = useUIStore();
  const { getNoteById, updateNote, notes } = useNoteStore();

  const selectedNote = selectedNoteId ? getNoteById(selectedNoteId) : null;

  // Use refs for handlers to avoid recreating editor extensions
  const wikilinkClickRef = useRef<(target: string) => void>(() => {});
  const wikilinkSuggestionsRef = useRef<(query: string) => WikilinkSuggestionItem[]>(() => []);

  // Update the click ref when notes/setSelectedNoteId changes
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

  // Update the suggestions ref when notes/selectedNoteId changes
  useEffect(() => {
    wikilinkSuggestionsRef.current = (query: string): WikilinkSuggestionItem[] => {
      const queryLower = query.toLowerCase();
      const results: WikilinkSuggestionItem[] = [];

      for (const note of notes.values()) {
        // Skip current note
        if (note.id === selectedNoteId) continue;

        const titleMatch = note.frontmatter.title.toLowerCase().includes(queryLower);
        const filepathMatch = note.filepath.toLowerCase().includes(queryLower);

        if (!query || titleMatch || filepathMatch) {
          results.push({
            id: note.id,
            title: note.frontmatter.title,
            filepath: note.filepath,
          });
        }
      }

      // Sort by title match first, then alphabetically
      return results
        .sort((a, b) => {
          const aStartsWith = a.title.toLowerCase().startsWith(queryLower);
          const bStartsWith = b.title.toLowerCase().startsWith(queryLower);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.title.localeCompare(b.title);
        })
        .slice(0, 10); // Limit to 10 results
    };
  }, [notes, selectedNoteId]);

  // Stable callback that uses the ref
  const handleWikilinkClick = useCallback((target: string) => {
    wikilinkClickRef.current(target);
  }, []);

  // Stable callback that uses the ref
  const getWikilinkSuggestions = useCallback((query: string): WikilinkSuggestionItem[] => {
    return wikilinkSuggestionsRef.current(query);
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
    WikilinkSuggestionExtension.configure({
      getItems: getWikilinkSuggestions,
    }),
  ], [handleWikilinkClick, getWikilinkSuggestions]);

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
