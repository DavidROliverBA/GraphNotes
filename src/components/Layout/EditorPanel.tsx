// src/components/Layout/EditorPanel.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { useGraph } from '../../hooks/useGraph';
import { useNotes } from '../../hooks/useNotes';
import Editor from '../Editor/Editor';
import LinkPanel from '../LinkPanel/LinkPanel';

const EditorPanel: React.FC = () => {
  const { selectedNoteId, linkPanelOpen, linkPanelWidth, setLinkPanelOpen } = useUIStore();
  const { getNoteById, notes, updateNote } = useNoteStore();
  const { getLinksForFrontmatter } = useGraph();
  const { saveNote, renameNote } = useNotes();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const selectedNote = selectedNoteId ? getNoteById(selectedNoteId) : null;

  // Handler for updating frontmatter when links change
  const handleUpdateNoteLinks = useCallback(async (event: CustomEvent<{ noteId: string }>) => {
    const { noteId } = event.detail;
    const note = notes.get(noteId);
    if (!note) return;

    // Get the updated links from the graph
    const updatedLinks = getLinksForFrontmatter(noteId);

    // Update the note's frontmatter with the new links
    const updatedNote = {
      ...note,
      frontmatter: {
        ...note.frontmatter,
        links: updatedLinks,
        modified: new Date().toISOString(),
      },
    };

    // Update in store
    updateNote(noteId, updatedNote);

    // Save to file
    await saveNote(updatedNote);
    setLastSaved(new Date());

    console.log('[EditorPanel] Updated links for note:', noteId, updatedLinks);
  }, [notes, getLinksForFrontmatter, updateNote, saveNote]);

  // Listen for link update events
  useEffect(() => {
    const handler = (e: Event) => handleUpdateNoteLinks(e as CustomEvent<{ noteId: string }>);
    window.addEventListener('update-note-links', handler);
    return () => window.removeEventListener('update-note-links', handler);
  }, [handleUpdateNoteLinks]);

  const handleSave = () => {
    setLastSaved(new Date());
  };

  // Title editing handlers
  const handleTitleDoubleClick = () => {
    if (selectedNote) {
      setEditedTitle(selectedNote.frontmatter.title);
      setIsEditingTitle(true);
    }
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = async () => {
    if (!selectedNote || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle !== selectedNote.frontmatter.title) {
      await renameNote(selectedNote.id, trimmedTitle);
      setLastSaved(new Date());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  // Reset editing state when note changes
  useEffect(() => {
    setIsEditingTitle(false);
  }, [selectedNoteId]);

  if (!selectedNote) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">Select a note to start editing</p>
          <p className="text-sm mt-2 text-gray-600">
            Or create a new note from the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main editor area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Editor header */}
        <header className="flex-shrink-0 px-4 py-3 border-b border-sidebar-hover">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="text-lg font-medium text-editor-text bg-sidebar-hover rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              ) : (
                <h1
                  className="text-lg font-medium text-editor-text truncate cursor-pointer hover:text-accent-primary transition-colors"
                  onDoubleClick={handleTitleDoubleClick}
                  title="Double-click to rename"
                >
                  {selectedNote.frontmatter.title || 'Untitled'}
                </h1>
              )}
            </div>
            <div className="flex-shrink-0 ml-4 flex items-center gap-4">
              {lastSaved && (
                <span className="text-xs text-accent-success">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => setLinkPanelOpen(!linkPanelOpen)}
                className={`p-2 rounded transition-colors ${
                  linkPanelOpen
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'text-gray-400 hover:text-editor-text hover:bg-sidebar-hover'
                }`}
                title={linkPanelOpen ? 'Hide links panel' : 'Show links panel'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
          </div>
          {selectedNote.frontmatter.tags && selectedNote.frontmatter.tags.length > 0 && (
            <div className="flex gap-2 mt-2">
              {selectedNote.frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-sidebar-hover text-gray-400 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Tiptap Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            key={selectedNote.id}
            initialContent={selectedNote.content}
            onSave={handleSave}
          />
        </div>
      </div>

      {/* Link Panel */}
      {linkPanelOpen && (
        <aside
          className="flex-shrink-0 border-l border-sidebar-hover"
          style={{ width: linkPanelWidth }}
        >
          <LinkPanel />
        </aside>
      )}
    </div>
  );
};

export default EditorPanel;
