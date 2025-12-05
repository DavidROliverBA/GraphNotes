export interface SearchQuery {
  text?: string;
  superTags?: string[];
  hasLinks?: boolean;
  linkedTo?: string;
  linkedFrom?: string;
}

export interface SearchResult {
  noteId: string;
  title: string;
  filepath: string;
  score: number;
  superTags: string[];
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: 'title' | 'content' | 'superTags';
  snippet: string;
  positions?: [number, number][];
}

export interface SearchDocument {
  id: string;
  title: string;
  filepath: string;
  content: string;
  superTags: string[];
}
