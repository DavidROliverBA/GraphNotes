// src/components/Sidebar/SearchPanel.tsx

import React, { useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { highlightMatch } from '../../lib/search/grepSearch';

const SearchPanel: React.FC = () => {
  const {
    query,
    setQuery,
    searchMode,
    setSearchMode,
    results,
    grepResults,
    isSearching,
    search,
    selectResult,
  } = useSearch();

  // Debounced search on query change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        search(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query);
    }
  };

  const renderGrepHighlight = (lineContent: string, matchStart: number, matchEnd: number) => {
    const { before, match, after } = highlightMatch(lineContent, matchStart, matchEnd);
    return (
      <span>
        <span className="text-gray-500">{before}</span>
        <span className="bg-yellow-500/30 text-yellow-200">{match}</span>
        <span className="text-gray-500">{after}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-sidebar-hover">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-3 py-2 pr-10 bg-sidebar-hover text-editor-text rounded-md border border-transparent focus:border-accent-primary focus:outline-none text-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-editor-text"
            aria-label="Search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>

        {/* Search mode toggle */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setSearchMode('fulltext')}
            className={`flex-1 py-1 text-xs rounded ${
              searchMode === 'fulltext'
                ? 'bg-accent-primary text-sidebar-bg'
                : 'bg-sidebar-hover text-gray-400 hover:text-editor-text'
            }`}
          >
            Full-text
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('grep')}
            className={`flex-1 py-1 text-xs rounded ${
              searchMode === 'grep'
                ? 'bg-accent-primary text-sidebar-bg'
                : 'bg-sidebar-hover text-gray-400 hover:text-editor-text'
            }`}
          >
            Regex
          </button>
        </div>
      </form>

      {/* Search results */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="py-2">
            {searchMode === 'grep' && grepResults.length > 0 ? (
              // Grep results with line numbers
              grepResults.map((result, index) => (
                <button
                  key={`grep-${index}`}
                  onClick={() => selectResult(`grep-${index}`)}
                  className="w-full px-4 py-2 text-left hover:bg-sidebar-hover transition-colors border-b border-sidebar-hover/50"
                >
                  <p className="text-sm text-editor-text font-medium truncate">
                    {result.filepath}
                  </p>
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-xs text-accent-primary font-mono shrink-0">
                      L{result.lineNumber}
                    </span>
                    <p className="text-xs font-mono truncate flex-1">
                      {renderGrepHighlight(result.lineContent, result.matchStart, result.matchEnd)}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              // Full-text results
              results.map((result) => (
                <button
                  key={result.noteId}
                  onClick={() => selectResult(result.noteId)}
                  className="w-full px-4 py-2 text-left hover:bg-sidebar-hover transition-colors border-b border-sidebar-hover/50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-editor-text font-medium truncate">
                      {result.title}
                    </p>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">
                      {Math.round(result.score * 100)}%
                    </span>
                  </div>
                  {result.matches[0] && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {result.matches[0].snippet}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        ) : query ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No results found</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="text-sm">Enter a search query</p>
              <p className="text-xs mt-1">
                {searchMode === 'fulltext'
                  ? 'Searches titles, content, and tags'
                  : 'Searches with regex patterns'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
