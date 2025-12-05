import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, FileText, Hash, X, CornerDownLeft } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSearch } from '../../hooks/useSearch';
import { SearchResult } from '../../lib/search/types';

export function QuickSearch() {
  const { quickSearchOpen, setQuickSearchOpen, setSelectedNoteId } = useUIStore();
  const { quickSearch, isIndexReady } = useSearch();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (quickSearchOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [quickSearchOpen]);

  // Handle search input
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.trim()) {
        const searchResults = quickSearch(value, 10);
        setResults(searchResults);
        setSelectedIndex(0);
      } else {
        setResults([]);
      }
    },
    [quickSearch]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setQuickSearchOpen(false);
          break;
      }
    },
    [results, selectedIndex, setQuickSearchOpen]
  );

  // Handle result selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      setSelectedNoteId(result.noteId);
      setQuickSearchOpen(false);
    },
    [setSelectedNoteId, setQuickSearchOpen]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedEl = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Cmd+O to open
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'o')) {
        e.preventDefault();
        setQuickSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [setQuickSearchOpen]);

  if (!quickSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setQuickSearchOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-bg-primary border border-border-subtle rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <Search className="w-5 h-5 text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isIndexReady ? "Search notes..." : "Loading index..."}
            disabled={!isIndexReady}
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary outline-none text-base"
          />
          <button
            onClick={() => setQuickSearchOpen(false)}
            className="p-1 rounded hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="px-4 py-8 text-center text-text-tertiary">
              <p className="text-sm">Start typing to search notes</p>
              <p className="text-xs mt-2">
                <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">
                  Enter
                </kbd>
                {' '}to select{' '}
                <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">
                  Esc
                </kbd>
                {' '}to close
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-tertiary">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.noteId}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle bg-bg-secondary text-xs text-text-tertiary">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">
                  <CornerDownLeft className="w-2.5 h-2.5 inline" />
                </kbd>
                to open
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function SearchResultItem({ result, isSelected, onClick, onMouseEnter }: SearchResultItemProps) {
  // Find the content snippet if available
  const contentMatch = result.matches.find((m) => m.field === 'content');

  return (
    <button
      className={`
        w-full px-4 py-2.5 flex items-start gap-3 text-left transition-colors
        ${isSelected ? 'bg-accent-primary/10' : 'hover:bg-bg-tertiary'}
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <FileText className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? 'text-accent-primary' : 'text-text-tertiary'}`} />
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>
          {result.title}
        </div>
        {contentMatch && (
          <div className="text-sm text-text-secondary truncate mt-0.5">
            {contentMatch.snippet}
          </div>
        )}
        {result.superTags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {result.superTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px] text-text-tertiary"
              >
                <Hash className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {result.superTags.length > 3 && (
              <span className="text-[10px] text-text-tertiary">
                +{result.superTags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      <div className="text-xs text-text-tertiary flex-shrink-0">
        {result.filepath.split('/').pop()?.replace('.md', '')}
      </div>
    </button>
  );
}

export default QuickSearch;
