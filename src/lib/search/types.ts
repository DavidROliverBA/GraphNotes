// src/lib/search/types.ts

export interface SearchMatch {
  field: 'title' | 'content' | 'tags';
  snippet: string;                 // Context around match
  positions: [number, number][];   // Start/end positions
}

export interface SearchResult {
  noteId: string;
  title: string;
  filepath: string;
  score: number;
  matches: SearchMatch[];
}

export interface GrepResult {
  filepath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export type SearchMode = 'fulltext' | 'grep';
