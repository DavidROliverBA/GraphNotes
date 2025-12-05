import MiniSearch, { SearchResult as MiniSearchResult } from 'minisearch';
import { SearchDocument, SearchResult, SearchQuery, SearchMatch } from './types';
import { Note } from '../notes/types';

export class SearchIndex {
  private index: MiniSearch<SearchDocument>;
  private documents: Map<string, SearchDocument> = new Map();

  constructor() {
    this.index = new MiniSearch<SearchDocument>({
      fields: ['title', 'content', 'superTags'],
      storeFields: ['title', 'filepath', 'superTags'],
      searchOptions: {
        boost: { title: 3, superTags: 2, content: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  /**
   * Build the search index from a collection of notes
   */
  buildFromNotes(notes: Note[]): void {
    // Clear existing index
    this.index.removeAll();
    this.documents.clear();

    // Convert notes to search documents
    const documents: SearchDocument[] = notes.map((note) => ({
      id: note.id,
      title: note.frontmatter.title,
      filepath: note.filepath,
      content: note.content,
      superTags: note.frontmatter.superTags || [],
    }));

    // Add to index
    this.index.addAll(documents);

    // Store documents for later reference
    documents.forEach((doc) => this.documents.set(doc.id, doc));
  }

  /**
   * Add or update a single note in the index
   */
  upsertNote(note: Note): void {
    const doc: SearchDocument = {
      id: note.id,
      title: note.frontmatter.title,
      filepath: note.filepath,
      content: note.content,
      superTags: note.frontmatter.superTags || [],
    };

    // Remove existing document if present
    if (this.documents.has(note.id)) {
      this.index.discard(note.id);
    }

    // Add updated document
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
  search(query: SearchQuery): SearchResult[] {
    if (!query.text || query.text.trim() === '') {
      // Return all documents if no text query
      if (query.superTags && query.superTags.length > 0) {
        return this.filterBySuperTags(query.superTags);
      }
      return [];
    }

    const results = this.index.search(query.text);

    // Map to SearchResult format
    let searchResults = results.map((result) => this.mapToSearchResult(result, query.text!));

    // Apply super tag filter
    if (query.superTags && query.superTags.length > 0) {
      searchResults = searchResults.filter((r) =>
        query.superTags!.some((tag) => r.superTags.includes(tag))
      );
    }

    return searchResults;
  }

  /**
   * Get autocomplete suggestions for quick search
   */
  suggest(prefix: string, limit: number = 10): SearchResult[] {
    if (!prefix || prefix.trim() === '') {
      return [];
    }

    const results = this.index.search(prefix, {
      prefix: true,
      fuzzy: 0.1,
    });

    return results.slice(0, limit).map((result) => this.mapToSearchResult(result, prefix));
  }

  /**
   * Get all notes matching super tags
   */
  private filterBySuperTags(tags: string[]): SearchResult[] {
    const results: SearchResult[] = [];

    this.documents.forEach((doc) => {
      if (tags.some((tag) => doc.superTags.includes(tag))) {
        results.push({
          noteId: doc.id,
          title: doc.title,
          filepath: doc.filepath,
          score: 1,
          superTags: doc.superTags,
          matches: [],
        });
      }
    });

    return results;
  }

  /**
   * Map MiniSearch result to SearchResult
   */
  private mapToSearchResult(result: MiniSearchResult, query: string): SearchResult {
    const doc = this.documents.get(result.id);
    const matches: SearchMatch[] = [];

    // Generate match snippets
    if (doc) {
      // Title match
      if (result.match && Object.keys(result.match).some((term) =>
        doc.title.toLowerCase().includes(term.toLowerCase())
      )) {
        matches.push({
          field: 'title',
          snippet: doc.title,
        });
      }

      // Content match - extract snippet around query
      const contentSnippet = this.extractSnippet(doc.content, query);
      if (contentSnippet) {
        matches.push({
          field: 'content',
          snippet: contentSnippet,
        });
      }

      // Super tags match
      const matchingTags = doc.superTags.filter((tag) =>
        tag.toLowerCase().includes(query.toLowerCase())
      );
      if (matchingTags.length > 0) {
        matches.push({
          field: 'superTags',
          snippet: matchingTags.join(', '),
        });
      }
    }

    return {
      noteId: result.id,
      title: doc?.title || '',
      filepath: doc?.filepath || '',
      score: result.score,
      superTags: doc?.superTags || [],
      matches,
    };
  }

  /**
   * Extract a snippet of content around the search query
   */
  private extractSnippet(content: string, query: string, contextChars: number = 80): string | null {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Find first occurrence of query or any query term
    const terms = lowerQuery.split(/\s+/);
    let position = -1;

    for (const term of terms) {
      const pos = lowerContent.indexOf(term);
      if (pos !== -1 && (position === -1 || pos < position)) {
        position = pos;
      }
    }

    if (position === -1) {
      // Return first part of content if no match found
      if (content.length > 0) {
        return content.substring(0, contextChars * 2) + (content.length > contextChars * 2 ? '...' : '');
      }
      return null;
    }

    // Calculate snippet bounds
    const start = Math.max(0, position - contextChars);
    const end = Math.min(content.length, position + query.length + contextChars);

    let snippet = content.substring(start, end);

    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Get the number of indexed documents
   */
  get documentCount(): number {
    return this.documents.size;
  }

  /**
   * Check if a note is indexed
   */
  hasNote(noteId: string): boolean {
    return this.documents.has(noteId);
  }
}

// Singleton instance
let searchIndexInstance: SearchIndex | null = null;

export function getSearchIndex(): SearchIndex {
  if (!searchIndexInstance) {
    searchIndexInstance = new SearchIndex();
  }
  return searchIndexInstance;
}

export function resetSearchIndex(): void {
  searchIndexInstance = null;
}
