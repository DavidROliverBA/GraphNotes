import { useState, useCallback } from 'react';
import {
  Search,
  FileText,
  Hash,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { useUIStore } from '../../stores/uiStore';
import { SearchResult } from '../../lib/search/types';

interface SearchPanelProps {
  className?: string;
}

export function SearchPanel({ className = '' }: SearchPanelProps) {
  const { search, results, isSearching, isIndexReady, clearSearch } = useSearch();
  const { setSelectedNoteId } = useUIStore();

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Available tags (would come from store in full implementation)
  const availableTags = ['project', 'person', 'book', 'meeting'];

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      search({
        text,
        superTags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    },
    [search, selectedTags]
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];

      setSelectedTags(newTags);

      // Re-run search with new filters
      if (query.trim()) {
        search({
          text: query,
          superTags: newTags.length > 0 ? newTags : undefined,
        });
      }
    },
    [selectedTags, query, search]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedTags([]);
    clearSearch();
  }, [clearSearch]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setSelectedNoteId(result.noteId);
    },
    [setSelectedNoteId]
  );

  const hasFilters = selectedTags.length > 0;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search Header */}
      <div className="p-3 border-b border-border-subtle">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={isIndexReady ? 'Search notes...' : 'Loading...'}
            disabled={!isIndexReady}
            className="w-full pl-9 pr-9 py-2 text-sm bg-bg-tertiary border border-transparent rounded-md focus:outline-none focus:border-accent-primary focus:bg-bg-primary transition-colors"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            mt-2 flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors w-full
            ${hasFilters
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-tertiary hover:bg-bg-tertiary'
            }
          `}
        >
          <Filter className="w-3 h-3" />
          <span>Filters</span>
          {hasFilters && (
            <span className="ml-auto px-1.5 py-0.5 bg-accent-primary text-white rounded-full text-[10px]">
              {selectedTags.length}
            </span>
          )}
          {showFilters ? (
            <ChevronUp className="w-3 h-3 ml-auto" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-auto" />
          )}
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-2 p-2 bg-bg-tertiary rounded-md">
            <div className="text-xs text-text-tertiary mb-2">Super Tags</div>
            <div className="flex flex-wrap gap-1">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                    ${selectedTags.includes(tag)
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-primary'
                    }
                  `}
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full" />
          </div>
        ) : results.length > 0 ? (
          <div className="py-2">
            <div className="px-3 pb-2 text-xs text-text-tertiary">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            {results.map((result) => (
              <SearchResultRow
                key={result.noteId}
                result={result}
                onClick={() => handleResultClick(result)}
              />
            ))}
          </div>
        ) : query.trim() ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="w-8 h-8 text-text-tertiary mb-2" />
            <p className="text-sm text-text-secondary">No results found</p>
            <p className="text-xs text-text-tertiary mt-1">
              Try different keywords or filters
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="w-8 h-8 text-text-tertiary mb-2" />
            <p className="text-sm text-text-secondary">Search your notes</p>
            <p className="text-xs text-text-tertiary mt-1">
              Type to search by title or content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchResultRowProps {
  result: SearchResult;
  onClick: () => void;
}

function SearchResultRow({ result, onClick }: SearchResultRowProps) {
  const contentMatch = result.matches.find((m) => m.field === 'content');

  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 flex items-start gap-2 text-left hover:bg-bg-tertiary transition-colors"
    >
      <FileText className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {result.title}
        </div>
        {contentMatch && (
          <div className="text-xs text-text-tertiary line-clamp-2 mt-0.5">
            {contentMatch.snippet}
          </div>
        )}
        {result.superTags.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {result.superTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-bg-tertiary rounded text-[10px] text-text-tertiary"
              >
                <Hash className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export default SearchPanel;
