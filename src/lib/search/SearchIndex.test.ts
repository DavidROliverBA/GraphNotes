// src/lib/search/SearchIndex.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { SearchIndex, resetSearchIndex, getSearchIndex } from './SearchIndex';
import { Note } from '../notes/types';

describe('SearchIndex', () => {
  let searchIndex: SearchIndex;

  // Helper to create test notes
  const createNote = (
    id: string,
    title: string,
    content: string,
    tags: string[] = []
  ): Note => ({
    id,
    filepath: `${id}.md`,
    content,
    rawContent: `---\nid: ${id}\ntitle: ${title}\n---\n${content}`,
    frontmatter: {
      id,
      title,
      tags,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  });

  beforeEach(() => {
    resetSearchIndex();
    searchIndex = new SearchIndex();
  });

  describe('buildIndex', () => {
    it('should build index from notes', () => {
      const notes = new Map<string, Note>();
      notes.set('1', createNote('1', 'First Note', 'This is the first note content'));
      notes.set('2', createNote('2', 'Second Note', 'This is the second note content'));

      searchIndex.buildIndex(notes);

      expect(searchIndex.documentCount).toBe(2);
    });

    it('should handle empty notes map', () => {
      const notes = new Map<string, Note>();
      searchIndex.buildIndex(notes);

      expect(searchIndex.documentCount).toBe(0);
    });

    it('should clear existing index when rebuilding', () => {
      const notes1 = new Map<string, Note>();
      notes1.set('1', createNote('1', 'First Note', 'Content'));

      searchIndex.buildIndex(notes1);
      expect(searchIndex.documentCount).toBe(1);

      const notes2 = new Map<string, Note>();
      notes2.set('2', createNote('2', 'New Note', 'New content'));
      notes2.set('3', createNote('3', 'Another Note', 'More content'));

      searchIndex.buildIndex(notes2);
      expect(searchIndex.documentCount).toBe(2);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      const notes = new Map<string, Note>();
      notes.set('1', createNote('1', 'JavaScript Tutorial', 'Learn JavaScript programming basics'));
      notes.set('2', createNote('2', 'Python Guide', 'Python programming language guide'));
      notes.set('3', createNote('3', 'React Components', 'Building React components with JavaScript', ['react', 'javascript']));

      searchIndex.buildIndex(notes);
    });

    it('should return empty array for empty query', () => {
      const results = searchIndex.search('');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace query', () => {
      const results = searchIndex.search('   ');
      expect(results).toEqual([]);
    });

    it('should find notes by title', () => {
      const results = searchIndex.search('JavaScript');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title === 'JavaScript Tutorial')).toBe(true);
    });

    it('should find notes by content', () => {
      const results = searchIndex.search('programming');

      expect(results.length).toBe(2);
    });

    it('should find notes by tags', () => {
      const results = searchIndex.search('react');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('React Components');
    });

    it('should respect limit parameter', () => {
      const results = searchIndex.search('programming', 1);

      expect(results.length).toBe(1);
    });

    it('should include score in results', () => {
      const results = searchIndex.search('JavaScript');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should include matches in results', () => {
      const results = searchIndex.search('JavaScript');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matches.length).toBeGreaterThan(0);
    });

    it('should perform fuzzy search', () => {
      const results = searchIndex.search('Javascrip'); // Typo

      expect(results.length).toBeGreaterThan(0);
    });

    it('should perform prefix search', () => {
      const results = searchIndex.search('Java');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.title.includes('JavaScript'))).toBe(true);
    });
  });

  describe('addOrUpdateNote', () => {
    it('should add a new note to the index', () => {
      const note = createNote('1', 'New Note', 'New content');

      searchIndex.addOrUpdateNote(note);

      expect(searchIndex.documentCount).toBe(1);
      const results = searchIndex.search('New');
      expect(results.length).toBe(1);
    });

    it('should update an existing note in the index', () => {
      const note = createNote('1', 'Original Title', 'Original content');
      searchIndex.addOrUpdateNote(note);

      const updatedNote = createNote('1', 'Updated Title', 'Updated content');
      searchIndex.addOrUpdateNote(updatedNote);

      expect(searchIndex.documentCount).toBe(1);
      const results = searchIndex.search('Updated');
      expect(results.length).toBe(1);
    });
  });

  describe('removeNote', () => {
    it('should remove a note from the index', () => {
      const notes = new Map<string, Note>();
      notes.set('1', createNote('1', 'First Note', 'Content'));
      notes.set('2', createNote('2', 'Second Note', 'More content'));

      searchIndex.buildIndex(notes);
      expect(searchIndex.documentCount).toBe(2);

      searchIndex.removeNote('1');
      expect(searchIndex.documentCount).toBe(1);
    });

    it('should handle removing non-existent note', () => {
      const notes = new Map<string, Note>();
      notes.set('1', createNote('1', 'First Note', 'Content'));

      searchIndex.buildIndex(notes);

      // Should not throw
      searchIndex.removeNote('non-existent');
      expect(searchIndex.documentCount).toBe(1);
    });
  });

  describe('autoSuggest', () => {
    beforeEach(() => {
      const notes = new Map<string, Note>();
      notes.set('1', createNote('1', 'JavaScript Tutorial', 'Learn JavaScript programming'));
      notes.set('2', createNote('2', 'Java Guide', 'Java programming language'));

      searchIndex.buildIndex(notes);
    });

    it('should return empty array for empty query', () => {
      const suggestions = searchIndex.autoSuggest('');
      expect(suggestions).toEqual([]);
    });

    it('should return suggestions for partial query', () => {
      const suggestions = searchIndex.autoSuggest('java');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should respect limit parameter', () => {
      const suggestions = searchIndex.autoSuggest('java', 1);
      expect(suggestions.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getSearchIndex singleton', () => {
    it('should return the same instance', () => {
      resetSearchIndex();
      const instance1 = getSearchIndex();
      const instance2 = getSearchIndex();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getSearchIndex();
      resetSearchIndex();
      const instance2 = getSearchIndex();

      expect(instance1).not.toBe(instance2);
    });
  });
});
