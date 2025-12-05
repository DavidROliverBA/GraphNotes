import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { getSearchIndex } from '../lib/search/SearchIndex';
import { SearchResult, SearchQuery } from '../lib/search/types';

export function useSearch() {
  const { notes } = useNoteStore();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState<SearchQuery>({});
  const [isIndexReady, setIsIndexReady] = useState(false);

  const searchIndex = useMemo(() => getSearchIndex(), []);

  // Build index when notes change
  useEffect(() => {
    if (notes.size > 0) {
      const notesArray = Array.from(notes.values());
      searchIndex.buildFromNotes(notesArray);
      setIsIndexReady(true);
    } else {
      setIsIndexReady(false);
    }
  }, [notes, searchIndex]);

  // Perform search
  const search = useCallback(
    (searchQuery: SearchQuery) => {
      setIsSearching(true);
      setQuery(searchQuery);

      try {
        const searchResults = searchIndex.search(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchIndex]
  );

  // Quick search (text only, for autocomplete)
  const quickSearch = useCallback(
    (text: string, limit: number = 10): SearchResult[] => {
      if (!isIndexReady || !text.trim()) {
        return [];
      }
      return searchIndex.suggest(text, limit);
    },
    [searchIndex, isIndexReady]
  );

  // Clear search results
  const clearSearch = useCallback(() => {
    setResults([]);
    setQuery({});
  }, []);

  // Update index when a single note changes
  const updateNoteInIndex = useCallback(
    (noteId: string) => {
      const note = notes.get(noteId);
      if (note) {
        searchIndex.upsertNote(note);
      }
    },
    [notes, searchIndex]
  );

  // Remove note from index
  const removeNoteFromIndex = useCallback(
    (noteId: string) => {
      searchIndex.removeNote(noteId);
    },
    [searchIndex]
  );

  return {
    results,
    isSearching,
    isIndexReady,
    query,
    search,
    quickSearch,
    clearSearch,
    updateNoteInIndex,
    removeNoteFromIndex,
    documentCount: searchIndex.documentCount,
  };
}
