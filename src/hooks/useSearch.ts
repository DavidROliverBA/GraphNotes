// src/hooks/useSearch.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { getSearchIndex } from '../lib/search/SearchIndex';
import { SearchResult, GrepResult, SearchMode } from '../lib/search/types';
import { grepSearch } from '../lib/search/grepSearch';
import { useUIStore } from '../stores/uiStore';

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  results: SearchResult[];
  grepResults: GrepResult[];
  isSearching: boolean;
  search: (query: string) => Promise<void>;
  suggestions: string[];
  getSuggestions: (query: string) => void;
  clearResults: () => void;
  selectResult: (noteId: string) => void;
}

/**
 * Hook for searching notes with full-text or grep search
 */
export function useSearch(): UseSearchReturn {
  const { notes } = useNoteStore();
  const { vaultPath, setSelectedNoteId } = useUIStore();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('fulltext');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [grepResults, setGrepResults] = useState<GrepResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Get search index singleton
  const searchIndex = useMemo(() => getSearchIndex(), []);

  // Rebuild index when notes change
  useEffect(() => {
    if (notes.size > 0) {
      searchIndex.buildIndex(notes);
      console.log('[Search] Index rebuilt with', searchIndex.documentCount, 'documents');
    }
  }, [notes, searchIndex]);

  /**
   * Perform search based on current mode
   */
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setGrepResults([]);
      return;
    }

    setIsSearching(true);

    try {
      if (searchMode === 'fulltext') {
        // Use MiniSearch for full-text search
        const searchResults = searchIndex.search(searchQuery);
        setResults(searchResults);
        setGrepResults([]);
      } else {
        // Use grep search
        if (vaultPath) {
          const grepSearchResults = await grepSearch(vaultPath, searchQuery);
          setGrepResults(grepSearchResults);

          // Convert grep results to SearchResult format for unified display
          const convertedResults: SearchResult[] = grepSearchResults.map((gr, index) => ({
            noteId: `grep-${index}`,
            title: gr.filepath.split('/').pop() || gr.filepath,
            filepath: gr.filepath,
            score: 1,
            matches: [{
              field: 'content' as const,
              snippet: gr.lineContent,
              positions: [[gr.matchStart, gr.matchEnd] as [number, number]],
            }],
          }));
          setResults(convertedResults);
        }
      }
    } catch (error) {
      console.error('[Search] Error:', error);
      setResults([]);
      setGrepResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchMode, searchIndex, vaultPath]);

  /**
   * Get search suggestions for autocomplete
   */
  const getSuggestions = useCallback((partialQuery: string) => {
    if (!partialQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = searchIndex.autoSuggest(partialQuery);
    setSuggestions(newSuggestions);
  }, [searchIndex]);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setGrepResults([]);
    setSuggestions([]);
  }, []);

  /**
   * Select a search result and navigate to the note
   */
  const selectResult = useCallback((noteId: string) => {
    // For grep results, find the actual note by filepath
    if (noteId.startsWith('grep-')) {
      const index = parseInt(noteId.replace('grep-', ''), 10);
      const grepResult = grepResults[index];
      if (grepResult) {
        // Find note by filepath
        for (const note of notes.values()) {
          if (grepResult.filepath.endsWith(note.filepath)) {
            setSelectedNoteId(note.id);
            return;
          }
        }
      }
    } else {
      setSelectedNoteId(noteId);
    }
  }, [grepResults, notes, setSelectedNoteId]);

  return {
    query,
    setQuery,
    searchMode,
    setSearchMode,
    results,
    grepResults,
    isSearching,
    search,
    suggestions,
    getSuggestions,
    clearResults,
    selectResult,
  };
}

export default useSearch;
