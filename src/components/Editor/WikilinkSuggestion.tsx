import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';
import { searchNotes } from '../../lib/graph/linkParser';

interface WikilinkSuggestionProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (title: string, filepath: string) => void;
  onCreateNew: (title: string) => void;
  onClose: () => void;
}

export function WikilinkSuggestion({
  query,
  position,
  onSelect,
  onCreateNew,
  onClose,
}: WikilinkSuggestionProps) {
  const { notesList } = useNoteStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search notes based on query
  const results = searchNotes(
    query,
    notesList.map((note) => ({
      id: note.id,
      title: note.title,
      filepath: note.filepath,
    })),
    8
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex === results.length) {
            // Create new note option
            onCreateNew(query);
          } else if (results[selectedIndex]) {
            onSelect(results[selectedIndex].title, results[selectedIndex].filepath);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          if (selectedIndex === results.length) {
            onCreateNew(query);
          } else if (results[selectedIndex]) {
            onSelect(results[selectedIndex].title, results[selectedIndex].filepath);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, query, onSelect, onCreateNew, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const selectedElement = container.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getFilePath = (filepath: string) => {
    const parts = filepath.split('/');
    if (parts.length > 2) {
      return `.../${parts.slice(-2).join('/')}`;
    }
    return filepath;
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-bg-elevated border border-border-subtle rounded-lg shadow-lg overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        minWidth: '280px',
        maxWidth: '400px',
        maxHeight: '300px',
      }}
    >
      {/* Search indicator */}
      <div className="px-3 py-2 border-b border-border-subtle bg-bg-secondary">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Search className="w-4 h-4" />
          <span>
            {query ? `Linking to "${query}"` : 'Search notes...'}
          </span>
        </div>
      </div>

      {/* Results list */}
      <div className="overflow-y-auto max-h-[220px]">
        {results.length === 0 && !query && (
          <div className="px-3 py-4 text-sm text-text-tertiary text-center">
            Type to search for notes
          </div>
        )}

        {results.map((note, index) => (
          <button
            key={note.id}
            data-index={index}
            className={`
              w-full flex items-start gap-3 px-3 py-2 text-left
              transition-colors duration-fast
              ${selectedIndex === index ? 'bg-accent-primary/10' : 'hover:bg-bg-tertiary'}
            `}
            onClick={() => onSelect(note.title, note.filepath)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <FileText
              className={`
                w-4 h-4 mt-0.5 flex-shrink-0
                ${selectedIndex === index ? 'text-accent-primary' : 'text-text-tertiary'}
              `}
            />
            <div className="flex-1 min-w-0">
              <div
                className={`
                  text-sm font-medium truncate
                  ${selectedIndex === index ? 'text-accent-primary' : 'text-text-primary'}
                `}
              >
                {note.title}
              </div>
              <div className="text-xs text-text-tertiary truncate">
                {getFilePath(note.filepath)}
              </div>
            </div>
          </button>
        ))}

        {/* Create new note option */}
        {query && (
          <button
            data-index={results.length}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-left
              border-t border-border-subtle
              transition-colors duration-fast
              ${selectedIndex === results.length ? 'bg-accent-primary/10' : 'hover:bg-bg-tertiary'}
            `}
            onClick={() => onCreateNew(query)}
            onMouseEnter={() => setSelectedIndex(results.length)}
          >
            <Plus
              className={`
                w-4 h-4 flex-shrink-0
                ${selectedIndex === results.length ? 'text-accent-primary' : 'text-text-tertiary'}
              `}
            />
            <div className="flex-1 min-w-0">
              <div
                className={`
                  text-sm font-medium
                  ${selectedIndex === results.length ? 'text-accent-primary' : 'text-text-primary'}
                `}
              >
                Create "{query}"
              </div>
              <div className="text-xs text-text-tertiary">
                New note
              </div>
            </div>
            <kbd className="text-xs text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded">
              Enter
            </kbd>
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="px-3 py-1.5 border-t border-border-subtle bg-bg-secondary flex items-center gap-4 text-xs text-text-tertiary">
        <span>
          <kbd className="bg-bg-tertiary px-1 rounded">↑↓</kbd> Navigate
        </span>
        <span>
          <kbd className="bg-bg-tertiary px-1 rounded">Enter</kbd> Select
        </span>
        <span>
          <kbd className="bg-bg-tertiary px-1 rounded">Esc</kbd> Cancel
        </span>
      </div>
    </div>
  );
}
