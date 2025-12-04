// src/lib/search/SearchIndex.ts

import MiniSearch, { SearchResult as MiniSearchResult } from 'minisearch';
import { Note } from '../notes/types';
import { SearchResult, SearchMatch } from './types';

/**
 * Document structure for MiniSearch indexing
 */
interface IndexedDocument {
  id: string;
  title: string;
  content: string;
  tags: string;
  filepath: string;
}

/**
 * SearchIndex - Wraps MiniSearch for full-text note search
 */
export class SearchIndex {
  private index: MiniSearch<IndexedDocument>;
  private documents: Map<string, IndexedDocument> = new Map();

  constructor() {
    this.index = new MiniSearch<IndexedDocument>({
      fields: ['title', 'content', 'tags'],
      storeFields: ['title', 'filepath'],
      searchOptions: {
        boost: { title: 2, tags: 1.5 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  /**
   * Build the index from a collection of notes
   */
  buildIndex(notes: Map<string, Note>): void {
    // Clear existing index
    this.index.removeAll();
    this.documents.clear();

    const documents: IndexedDocument[] = [];

    for (const note of notes.values()) {
      const doc: IndexedDocument = {
        id: note.id,
        title: note.frontmatter.title,
        content: note.content,
        tags: note.frontmatter.tags?.join(' ') || '',
        filepath: note.filepath,
      };
      documents.push(doc);
      this.documents.set(note.id, doc);
    }

    this.index.addAll(documents);
  }

  /**
   * Add or update a single note in the index
   */
  addOrUpdateNote(note: Note): void {
    const doc: IndexedDocument = {
      id: note.id,
      title: note.frontmatter.title,
      content: note.content,
      tags: note.frontmatter.tags?.join(' ') || '',
      filepath: note.filepath,
    };

    // Remove existing document if present
    if (this.documents.has(note.id)) {
      this.index.discard(note.id);
    }

    this.index.add(doc);
    this.documents.set(note.id, doc);
  }

  /**
   * Remove a note from the index
   */
  removeNote(noteId: string): void {
    if (this.documents.has(noteId)) {
      this.index.discard(noteId);
      this.documents.delete(noteId);
    }
  }

  /**
   * Search for notes matching the query
   */
  search(query: string, limit: number = 20): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.index.search(query).slice(0, limit);
    return results.map((result) => this.convertResult(result, query));
  }

  /**
   * Auto-suggest completions for partial query
   */
  autoSuggest(query: string, limit: number = 5): string[] {
    if (!query.trim()) {
      return [];
    }

    const suggestions = this.index.autoSuggest(query).slice(0, limit);
    return suggestions.map((s) => s.suggestion);
  }

  /**
   * Convert MiniSearch result to our SearchResult format
   */
  private convertResult(result: MiniSearchResult, query: string): SearchResult {
    const doc = this.documents.get(result.id);
    const matches: SearchMatch[] = [];

    // Get match info from result
    const matchedTerms = Object.keys(result.match || {});

    // Create snippets for each matched field
    for (const term of matchedTerms) {
      const matchInfo = result.match[term];

      for (const field of matchInfo) {
        if (field === 'title' && doc) {
          matches.push({
            field: 'title',
            snippet: doc.title,
            positions: this.findPositions(doc.title, term),
          });
        } else if (field === 'content' && doc) {
          const snippet = this.extractSnippet(doc.content, term);
          matches.push({
            field: 'content',
            snippet,
            positions: this.findPositions(snippet, term),
          });
        } else if (field === 'tags' && doc) {
          matches.push({
            field: 'tags',
            snippet: doc.tags,
            positions: this.findPositions(doc.tags, term),
          });
        }
      }
    }

    // If no specific matches found, create a general content snippet
    if (matches.length === 0 && doc) {
      const snippet = this.extractSnippet(doc.content, query);
      matches.push({
        field: 'content',
        snippet,
        positions: [],
      });
    }

    return {
      noteId: result.id,
      title: doc?.title || 'Unknown',
      filepath: doc?.filepath || '',
      score: result.score,
      matches,
    };
  }

  /**
   * Extract a snippet of text around the search term
   */
  private extractSnippet(content: string, term: string, contextLength: number = 60): string {
    const lowerContent = content.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const index = lowerContent.indexOf(lowerTerm);

    if (index === -1) {
      // Term not found, return beginning of content
      return content.slice(0, contextLength * 2) + (content.length > contextLength * 2 ? '...' : '');
    }

    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + term.length + contextLength);

    let snippet = content.slice(start, end);

    // Add ellipsis if we're not at the boundaries
    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < content.length) {
      snippet = snippet + '...';
    }

    return snippet;
  }

  /**
   * Find positions of a term in text
   */
  private findPositions(text: string, term: string): [number, number][] {
    const positions: [number, number][] = [];
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    let index = 0;

    while ((index = lowerText.indexOf(lowerTerm, index)) !== -1) {
      positions.push([index, index + term.length]);
      index += term.length;
    }

    return positions;
  }

  /**
   * Get the number of indexed documents
   */
  get documentCount(): number {
    return this.documents.size;
  }
}

// Singleton instance
let searchIndexInstance: SearchIndex | null = null;

/**
 * Get the singleton SearchIndex instance
 */
export function getSearchIndex(): SearchIndex {
  if (!searchIndexInstance) {
    searchIndexInstance = new SearchIndex();
  }
  return searchIndexInstance;
}

/**
 * Reset the search index (useful for testing)
 */
export function resetSearchIndex(): void {
  searchIndexInstance = null;
}
