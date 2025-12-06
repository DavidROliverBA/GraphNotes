import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import YooptaEditor, { createYooptaEditor, YooptaContentValue } from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import Blockquote from '@yoopta/blockquote';
import Callout from '@yoopta/callout';
import Code from '@yoopta/code';
import Link from '@yoopta/link';
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import { Bold, Italic, Underline, Strike, CodeMark, Highlight } from '@yoopta/marks';
import { Note } from '../../lib/notes/types';
import { useNotes } from '../../hooks/useNotes';
import { useNoteStore } from '../../stores/noteStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { EditorToolbar } from './EditorToolbar';
import { WikilinkSuggestion } from './WikilinkSuggestion';
import { createWikilink, resolveWikilinkTarget, extractWikilinks } from '../../lib/graph/linkParser';
import './editor.css';

// Define plugins
const plugins = [
  Paragraph,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  BulletedList,
  NumberedList,
  TodoList,
  Blockquote,
  Callout,
  Code,
  Link,
];

// Define marks (inline formatting)
const MARKS = [Bold, Italic, Underline, Strike, CodeMark, Highlight];

// Define tools
const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
};

interface EditorProps {
  note: Note;
  onSave?: (content: string) => void;
}

export function Editor({ note, onSave }: EditorProps) {
  // Create a new editor instance when note changes to ensure clean state
  const editor = useMemo(() => createYooptaEditor(), [note.id]);
  const { saving, updateContentWithAutoSave } = useNotes();
  const { createNote, notesList } = useNoteStore();
  const { currentVault } = useSettingsStore();
  const { setSelectedNoteId } = useUIStore();
  const currentNoteIdRef = useRef(note.id);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);

  // Compute editor content from note - only recompute when note.id changes
  // We intentionally exclude note.content from deps to avoid overwriting user edits
  // when the autosave updates note.content
  const editorContent = useMemo(() => markdownToYoopta(note.content), [note.id]);

  // Track local changes for empty state detection and onChange handler
  const [localContent, setLocalContent] = useState<YooptaContentValue>(editorContent);

  // Reset local content when note changes (for the isEditorEmpty check)
  useEffect(() => {
    setLocalContent(editorContent);
  }, [note.id]);

  // Wikilink suggestion state
  const [showWikilinkSuggestion, setShowWikilinkSuggestion] = useState(false);
  const [wikilinkQuery, setWikilinkQuery] = useState('');
  const [wikilinkPosition, setWikilinkPosition] = useState({ top: 0, left: 0 });
  const wikilinkStartRef = useRef<{ node: Node; offset: number } | null>(null);

  // Track current note id
  useEffect(() => {
    currentNoteIdRef.current = note.id;
  }, [note.id]);

  // Handle content changes
  const handleChange = useCallback(
    (value: YooptaContentValue) => {
      setLocalContent(value);

      // Convert back to markdown
      const markdown = yooptaToMarkdown(value);
      updateContentWithAutoSave(markdown);

      if (onSave) {
        onSave(markdown);
      }
    },
    [updateContentWithAutoSave, onSave]
  );

  // Get caret position for popup positioning
  const getCaretPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    };
  }, []);

  // Handle input to detect [[ trigger
  const handleInput = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const text = textNode.textContent || '';
    const cursorPos = range.startOffset;

    // Look for [[ before cursor
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastOpenBrackets = textBeforeCursor.lastIndexOf('[[');

    if (lastOpenBrackets !== -1) {
      // Check if there's a closing ]] between [[ and cursor
      const textAfterOpen = textBeforeCursor.slice(lastOpenBrackets + 2);
      if (!textAfterOpen.includes(']]')) {
        // We're inside a wikilink
        const query = textAfterOpen;

        if (!showWikilinkSuggestion) {
          // Save the position where [[ started
          wikilinkStartRef.current = { node: textNode, offset: lastOpenBrackets };
        }

        setWikilinkQuery(query);
        const pos = getCaretPosition();
        if (pos) {
          setWikilinkPosition(pos);
        }
        setShowWikilinkSuggestion(true);
        return;
      }
    }

    // No active wikilink trigger
    if (showWikilinkSuggestion) {
      setShowWikilinkSuggestion(false);
      wikilinkStartRef.current = null;
    }
  }, [showWikilinkSuggestion, getCaretPosition]);

  // Handle wikilink selection
  const handleWikilinkSelect = useCallback((title: string, _filepath: string) => {
    const selection = window.getSelection();
    if (!selection || !wikilinkStartRef.current) {
      setShowWikilinkSuggestion(false);
      return;
    }

    const { node, offset } = wikilinkStartRef.current;
    const text = node.textContent || '';
    const cursorPos = selection.getRangeAt(0).startOffset;

    // Replace [[query with [[title]]
    const wikilink = createWikilink(title);
    const newText = text.slice(0, offset) + wikilink + text.slice(cursorPos);
    node.textContent = newText;

    // Move cursor after the wikilink
    const newRange = document.createRange();
    newRange.setStart(node, offset + wikilink.length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Trigger input event to sync with Yoopta
    const inputEvent = new Event('input', { bubbles: true });
    node.parentElement?.dispatchEvent(inputEvent);

    setShowWikilinkSuggestion(false);
    wikilinkStartRef.current = null;
  }, []);

  // Handle creating a new note from wikilink
  const handleWikilinkCreateNew = useCallback(async (title: string) => {
    if (!currentVault) {
      setShowWikilinkSuggestion(false);
      return;
    }

    try {
      // Create the new note
      const filename = title.trim().replace(/[/\\?%*:|"<>]/g, '-');
      const newNote = await createNote(currentVault.path, filename, title);

      // Insert the wikilink
      handleWikilinkSelect(title, newNote.filepath);

      // Optionally navigate to the new note
      // setSelectedNoteId(newNote.filepath);
    } catch (err) {
      console.error('Failed to create note:', err);
      setShowWikilinkSuggestion(false);
    }
  }, [currentVault, createNote, handleWikilinkSelect]);

  // Handle closing wikilink suggestion
  const handleWikilinkClose = useCallback(() => {
    setShowWikilinkSuggestion(false);
    wikilinkStartRef.current = null;
  }, []);

  // Listen for input events in the editor
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const handleInputEvent = () => {
      // Small delay to let the DOM update
      requestAnimationFrame(handleInput);
    };

    container.addEventListener('input', handleInputEvent);
    container.addEventListener('keyup', handleInputEvent);

    return () => {
      container.removeEventListener('input', handleInputEvent);
      container.removeEventListener('keyup', handleInputEvent);
    };
  }, [handleInput]);

  // Close suggestion on click outside
  useEffect(() => {
    if (!showWikilinkSuggestion) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.wikilink-suggestion')) {
        handleWikilinkClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWikilinkSuggestion, handleWikilinkClose]);

  // Handle click on wikilinks (Cmd/Ctrl+click to navigate)
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    // Only navigate on Cmd+click (Mac) or Ctrl+click (Windows/Linux)
    if (!e.metaKey && !e.ctrlKey) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const text = textNode.textContent || '';
    const cursorPos = range.startOffset;

    // Find wikilinks in the text
    const wikilinks = extractWikilinks(text);

    // Check if cursor is inside a wikilink
    for (const wikilink of wikilinks) {
      if (cursorPos >= wikilink.start && cursorPos <= wikilink.end) {
        // Found a wikilink - try to resolve it
        const notesData = notesList.map((n) => ({
          id: n.id,
          title: n.title,
          filepath: n.filepath,
        }));

        const resolved = resolveWikilinkTarget(wikilink.target, notesData);
        if (resolved) {
          e.preventDefault();
          setSelectedNoteId(resolved.filepath);
        }
        break;
      }
    }
  }, [notesList, setSelectedNoteId]);

  // Check if editor content is empty
  const isEditorEmpty = useMemo(() => {
    const blocks = Object.values(localContent);
    if (blocks.length === 0) return true;
    if (blocks.length > 1) return false;

    // Check if the single block has empty content
    const firstBlock = blocks[0];
    if (!firstBlock?.value?.[0]) return true;

    const firstElement = firstBlock.value[0] as { children?: Array<{ text?: string }> };
    if (!firstElement.children) return true;

    const children = firstElement.children;
    return children.length === 0 ||
           (children.length === 1 && children[0]?.text === '');
  }, [localContent]);

  return (
    <div className="editor-container h-full flex flex-col bg-bg-primary">
      <EditorToolbar
        title={note.frontmatter.title}
        saving={saving}
        modified={note.frontmatter.modified}
      />
      <div ref={editorContainerRef} onClick={handleEditorClick} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div ref={selectionBoxRef} className={`yoopta-editor-wrapper ${isEditorEmpty ? 'is-empty' : ''}`} data-empty={isEditorEmpty}>
            <YooptaEditor
              key={note.id}
              editor={editor}
              plugins={plugins}
              tools={TOOLS}
              marks={MARKS}
              value={editorContent}
              onChange={handleChange}
              autoFocus
              readOnly={false}
              placeholder="Type / to open menu..."
              selectionBoxRoot={selectionBoxRef}
              className="yoopta-editor"
            />
          </div>
        </div>
      </div>

      {/* Wikilink suggestion popup */}
      {showWikilinkSuggestion && (
        <div className="wikilink-suggestion">
          <WikilinkSuggestion
            query={wikilinkQuery}
            position={wikilinkPosition}
            onSelect={handleWikilinkSelect}
            onCreateNew={handleWikilinkCreateNew}
            onClose={handleWikilinkClose}
          />
        </div>
      )}
    </div>
  );
}

// Convert markdown to Yoopta format
function markdownToYoopta(markdown: string): YooptaContentValue {
  const lines = markdown.split('\n');
  const content: YooptaContentValue = {};
  let blockIndex = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines at the start
    if (!trimmed && blockIndex === 0) {
      i++;
      continue;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'HeadingOne',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'heading-one',
            children: [{ text: trimmed.slice(2) }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'HeadingTwo',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'heading-two',
            children: [{ text: trimmed.slice(3) }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'HeadingThree',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'heading-three',
            children: [{ text: trimmed.slice(4) }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'Blockquote',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'blockquote',
            children: [{ text: trimmed.slice(2) }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'BulletedList',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'bulleted-list',
            children: [{ text: trimmed.slice(2) }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'NumberedList',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'numbered-list',
            children: [{ text: numberedMatch[1] }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Todo list
    const todoMatch = trimmed.match(/^- \[([ x])\]\s+(.*)$/i);
    if (todoMatch) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'TodoList',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'todo-list',
            props: { checked: todoMatch[1].toLowerCase() === 'x' },
            children: [{ text: todoMatch[2] }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'plaintext';
      let codeContent = '';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeContent += (codeContent ? '\n' : '') + lines[i];
        i++;
      }
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'Code',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'code',
            props: { language },
            children: [{ text: codeContent }],
          },
        ],
      };
      blockIndex++;
      i++;
      continue;
    }

    // Default: paragraph
    if (trimmed) {
      content[`block-${blockIndex}`] = {
        id: `block-${blockIndex}`,
        type: 'Paragraph',
        meta: { order: blockIndex, depth: 0 },
        value: [
          {
            id: `element-${blockIndex}`,
            type: 'paragraph',
            children: parseInlineMarkdown(trimmed),
          },
        ],
      };
      blockIndex++;
    }

    i++;
  }

  // Ensure at least one empty paragraph
  if (blockIndex === 0) {
    content['block-0'] = {
      id: 'block-0',
      type: 'Paragraph',
      meta: { order: 0, depth: 0 },
      value: [
        {
          id: 'element-0',
          type: 'paragraph',
          children: [{ text: '' }],
        },
      ],
    };
  }

  return content;
}

// Parse inline markdown (bold, italic, code, links, wikilinks)
function parseInlineMarkdown(text: string): Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> {
  // For now, just return plain text
  // TODO: Implement full inline markdown parsing
  return [{ text }];
}

// Convert Yoopta format back to markdown
function yooptaToMarkdown(content: YooptaContentValue): string {
  const blocks = Object.values(content).sort((a, b) => a.meta.order - b.meta.order);
  const lines: string[] = [];

  for (const block of blocks) {
    const text = extractText(block.value);

    switch (block.type) {
      case 'HeadingOne':
        lines.push(`# ${text}`);
        break;
      case 'HeadingTwo':
        lines.push(`## ${text}`);
        break;
      case 'HeadingThree':
        lines.push(`### ${text}`);
        break;
      case 'Blockquote':
        lines.push(`> ${text}`);
        break;
      case 'BulletedList':
        lines.push(`- ${text}`);
        break;
      case 'NumberedList':
        lines.push(`1. ${text}`);
        break;
      case 'TodoList':
        const todoElement = block.value?.[0] as { props?: { checked?: boolean } } | undefined;
        const checked = todoElement?.props?.checked;
        lines.push(`- [${checked ? 'x' : ' '}] ${text}`);
        break;
      case 'Code':
        const codeElement = block.value?.[0] as { props?: { language?: string } } | undefined;
        const language = codeElement?.props?.language || '';
        lines.push(`\`\`\`${language}`);
        lines.push(text);
        lines.push('```');
        break;
      case 'Callout':
        lines.push(`> ${text}`);
        break;
      default:
        lines.push(text);
    }
  }

  return lines.join('\n\n');
}

// Extract text from Yoopta value
function extractText(value: unknown): string {
  if (!value || !Array.isArray(value)) return '';

  return value
    .map((element) => {
      if (element.children) {
        return element.children
          .map((child: { text?: string }) => child.text || '')
          .join('');
      }
      return '';
    })
    .join('');
}

export default Editor;
