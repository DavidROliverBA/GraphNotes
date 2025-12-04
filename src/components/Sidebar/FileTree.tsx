// src/components/Sidebar/FileTree.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { NoteFile } from '../../lib/notes/types';
import { getFileTree } from '../../lib/tauri/commands';
import { useNotes } from '../../hooks/useNotes';
import { filterDotfiles, getDisplayTitle as getDisplayTitleUtil } from '../../lib/files/fileUtils';

interface FileTreeItemProps {
  item: NoteFile;
  level: number;
  onSelect: (path: string) => void;
  selectedPath: string | null;
  editingPath: string | null;
  onStartEdit: (path: string, currentTitle: string) => void;
  onSaveEdit: (path: string, newTitle: string) => void;
  onCancelEdit: () => void;
  editedTitle: string;
  setEditedTitle: (title: string) => void;
  getDisplayTitle: (path: string, fallbackName: string) => string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  level,
  onSelect,
  selectedPath,
  editingPath,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  editedTitle,
  setEditedTitle,
  getDisplayTitle,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedPath === item.path;
  const isEditing = editingPath === item.path;
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the display title (from frontmatter if loaded, otherwise filename without extension)
  const displayTitle = item.isDirectory
    ? item.name
    : getDisplayTitle(item.path, item.name);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (item.isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(item.path);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isDirectory) {
      onStartEdit(item.path, displayTitle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSaveEdit(item.path, editedTitle);
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <div>
      <div
        className={`w-full flex items-center gap-2 px-2 py-1 text-sm text-left transition-colors ${
          isSelected
            ? 'bg-sidebar-active text-editor-text'
            : 'text-gray-300 hover:bg-sidebar-hover hover:text-editor-text'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <button
          onClick={handleClick}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <span className="text-xs flex-shrink-0">
            {item.isDirectory ? (isExpanded ? '📂' : '📁') : '📄'}
          </span>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => onSaveEdit(item.path, editedTitle)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-sidebar-hover text-editor-text text-sm rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
          ) : (
            <span
              className="truncate flex-1"
              onDoubleClick={handleDoubleClick}
              title={item.isDirectory ? item.name : 'Double-click to rename'}
            >
              {displayTitle}
            </span>
          )}
        </button>
      </div>

      {item.isDirectory && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              editingPath={editingPath}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              editedTitle={editedTitle}
              setEditedTitle={setEditedTitle}
              getDisplayTitle={getDisplayTitle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC = () => {
  const { vaultPath, setSelectedNoteId } = useUIStore();
  const { notes, setFileTree, isLoading, setIsLoading, error, setError } = useNoteStore();
  const { loadNote, getNoteByFilepath, renameNote } = useNotes();

  // Local file tree state
  const [localFileTree, setLocalFileTree] = useState<NoteFile[]>([]);
  // Track selected file path separately from note ID
  const [selectedFilepath, setSelectedFilepath] = useState<string | null>(null);
  // Editing state
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  // Create a map of filepath -> title for quick lookup
  const pathToTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notes.values()) {
      map.set(note.filepath, note.frontmatter.title);
    }
    return map;
  }, [notes]);

  // Function to get display title for a filepath
  const getDisplayTitle = (path: string, fallbackName: string): string => {
    const title = pathToTitleMap.get(path);
    return getDisplayTitleUtil(fallbackName, title);
  };

  // Filter out dotfiles from file tree
  const filteredFileTree = useMemo(() => {
    return filterDotfiles(localFileTree);
  }, [localFileTree]);

  const loadFileTree = async () => {
    if (!vaultPath) return;

    setIsLoading(true);
    setError(null);

    try {
      const tree = await getFileTree(vaultPath);
      // Convert FileEntry to NoteFile format
      const convertTree = (entries: any[]): NoteFile[] => {
        return entries.map((entry) => ({
          name: entry.name,
          path: entry.path,
          isDirectory: entry.is_directory,
          children: entry.children ? convertTree(entry.children) : undefined,
        }));
      };
      setLocalFileTree(convertTree(tree));
      setFileTree(convertTree(tree));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file tree');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFileTree();
  }, [vaultPath]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadFileTree();
    };

    window.addEventListener('refresh-file-tree', handleRefresh);
    return () => {
      window.removeEventListener('refresh-file-tree', handleRefresh);
    };
  }, [vaultPath]);

  const handleSelect = async (filepath: string) => {
    setSelectedFilepath(filepath);

    // Check if note is already loaded
    let note = getNoteByFilepath(filepath);

    if (!note) {
      // Load the note
      const loadedNote = await loadNote(filepath);
      if (loadedNote) {
        note = loadedNote;
      }
    }

    if (note) {
      setSelectedNoteId(note.id);
    }
  };

  const handleStartEdit = (path: string, currentTitle: string) => {
    setEditingPath(path);
    setEditedTitle(currentTitle);
  };

  const handleSaveEdit = async (path: string, newTitle: string) => {
    if (!newTitle.trim() || !editingPath) {
      setEditingPath(null);
      return;
    }

    // Get the note for this path
    const note = getNoteByFilepath(path);
    if (note) {
      // Only update the title in frontmatter (don't rename file)
      await renameNote(note.id, newTitle.trim());
    }

    setEditingPath(null);
  };

  const handleCancelEdit = () => {
    setEditingPath(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-sm">Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-accent-error text-sm">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (filteredFileTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-4">
        <div className="text-center">
          <p className="text-sm">No markdown files found</p>
          <p className="text-xs mt-2">Create a new note to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full py-2">
      {filteredFileTree.map((item) => (
        <FileTreeItem
          key={item.path}
          item={item}
          level={0}
          onSelect={handleSelect}
          selectedPath={selectedFilepath}
          editingPath={editingPath}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          editedTitle={editedTitle}
          setEditedTitle={setEditedTitle}
          getDisplayTitle={getDisplayTitle}
        />
      ))}
    </div>
  );
};

export default FileTree;
