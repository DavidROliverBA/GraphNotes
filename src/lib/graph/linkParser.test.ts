// src/lib/graph/linkParser.test.ts

import { describe, it, expect } from 'vitest';
import {
  buildNoteIndex,
  resolveTarget,
  parseNoteLinks,
  parseAllLinks,
  generateEdgeId,
} from './linkParser';
import { Note, NoteFrontmatter } from '../notes/types';

// Helper to create test notes
function createNote(
  id: string,
  title: string,
  filepath: string,
  content: string = '',
  links: NoteFrontmatter['links'] = []
): Note {
  return {
    id,
    filepath,
    frontmatter: {
      id,
      title,
      created: '2024-01-01T00:00:00.000Z',
      modified: '2024-01-01T00:00:00.000Z',
      tags: [],
      links,
    },
    content,
    rawContent: '',
  };
}

describe('linkParser', () => {
  describe('buildNoteIndex', () => {
    it('should build index by ID', () => {
      const notes = new Map<string, Note>();
      notes.set('note-1', createNote('note-1', 'Note One', 'notes/note-one.md'));
      notes.set('note-2', createNote('note-2', 'Note Two', 'notes/note-two.md'));

      const index = buildNoteIndex(notes);

      expect(index.byId.get('note-1')).toBeDefined();
      expect(index.byId.get('note-2')).toBeDefined();
    });

    it('should build index by filepath', () => {
      const notes = new Map<string, Note>();
      notes.set('note-1', createNote('note-1', 'Note One', 'notes/note-one.md'));

      const index = buildNoteIndex(notes);

      expect(index.byFilepath.get('notes/note-one.md')).toBeDefined();
    });

    it('should build index by filename (without extension)', () => {
      const notes = new Map<string, Note>();
      notes.set('note-1', createNote('note-1', 'Note One', 'notes/note-one.md'));

      const index = buildNoteIndex(notes);

      expect(index.byFilename.get('note-one')).toBeDefined();
    });

    it('should build index by title (lowercase)', () => {
      const notes = new Map<string, Note>();
      notes.set('note-1', createNote('note-1', 'Note One', 'notes/note-one.md'));

      const index = buildNoteIndex(notes);

      expect(index.byTitle.get('note one')).toBeDefined();
    });
  });

  describe('resolveTarget', () => {
    const notes = new Map<string, Note>();
    notes.set('abc-123', createNote('abc-123', 'My Note', 'folder/my-note.md'));
    notes.set('def-456', createNote('def-456', 'Another Note', 'another.md'));

    const index = buildNoteIndex(notes);

    it('should resolve by ID', () => {
      const result = resolveTarget('abc-123', index);
      expect(result?.id).toBe('abc-123');
    });

    it('should resolve by exact filepath', () => {
      const result = resolveTarget('folder/my-note.md', index);
      expect(result?.id).toBe('abc-123');
    });

    it('should resolve by filename without extension', () => {
      const result = resolveTarget('my-note', index);
      expect(result?.id).toBe('abc-123');
    });

    it('should resolve by title (case insensitive)', () => {
      const result = resolveTarget('My Note', index);
      expect(result?.id).toBe('abc-123');
    });

    it('should return undefined for unresolved target', () => {
      const result = resolveTarget('non-existent', index);
      expect(result).toBeUndefined();
    });

    // Title-first resolution tests
    describe('title-first resolution', () => {
      it('should prioritize title over filename when title differs', () => {
        const titleNotes = new Map<string, Note>();
        // Note with title "Project Ideas" but filename "20231215-random-uuid.md"
        titleNotes.set('uuid-1', createNote('uuid-1', 'Project Ideas', '20231215-random-uuid.md'));
        titleNotes.set('uuid-2', createNote('uuid-2', 'Meeting Notes', 'meeting-123.md'));

        const titleIndex = buildNoteIndex(titleNotes);

        // Should find by title, not filename
        const result = resolveTarget('Project Ideas', titleIndex);
        expect(result?.id).toBe('uuid-1');
      });

      it('should resolve title before filename in priority order', () => {
        const titleNotes = new Map<string, Note>();
        // Create a note where title and filename are completely different
        titleNotes.set('note-1', createNote('note-1', 'Quick Start Guide', 'abc123def456.md'));

        const titleIndex = buildNoteIndex(titleNotes);

        // Title should resolve
        const byTitle = resolveTarget('Quick Start Guide', titleIndex);
        expect(byTitle?.id).toBe('note-1');

        // Filename should also resolve as fallback
        const byFilename = resolveTarget('abc123def456', titleIndex);
        expect(byFilename?.id).toBe('note-1');
      });

      it('should handle title with special characters', () => {
        const titleNotes = new Map<string, Note>();
        titleNotes.set('note-1', createNote('note-1', 'C++ Programming', 'cpp-programming.md'));
        titleNotes.set('note-2', createNote('note-2', 'Q&A Session', 'qa-session.md'));

        const titleIndex = buildNoteIndex(titleNotes);

        const result1 = resolveTarget('C++ Programming', titleIndex);
        expect(result1?.id).toBe('note-1');

        const result2 = resolveTarget('q&a session', titleIndex);
        expect(result2?.id).toBe('note-2');
      });

      it('should do fuzzy title matching when exact match fails', () => {
        const titleNotes = new Map<string, Note>();
        titleNotes.set('note-1', createNote('note-1', 'Introduction to GraphNotes', 'intro.md'));

        const titleIndex = buildNoteIndex(titleNotes);

        // Partial match should work via fuzzy matching
        const result = resolveTarget('graphnotes', titleIndex);
        expect(result?.id).toBe('note-1');
      });

      it('should resolve wikilinks by title in content', () => {
        const titleNotes = new Map<string, Note>();
        const sourceNote = createNote(
          'source',
          'Source Note',
          'source.md',
          'Check out [[Daily Journal]] for more.'
        );
        // Target note has different filename than title
        const targetNote = createNote('target', 'Daily Journal', '2024-01-15-entry.md');

        titleNotes.set('source', sourceNote);
        titleNotes.set('target', targetNote);

        const titleIndex = buildNoteIndex(titleNotes);
        const { resolved } = parseNoteLinks(sourceNote, titleIndex);

        expect(resolved).toHaveLength(1);
        expect(resolved[0].targetId).toBe('target');
      });
    });
  });

  describe('parseNoteLinks', () => {
    it('should parse frontmatter links', () => {
      const notes = new Map<string, Note>();
      const noteA = createNote('A', 'Note A', 'a.md', '', [
        { target: 'B', name: 'supports', created: '2024-01-01T00:00:00.000Z' },
      ]);
      const noteB = createNote('B', 'Note B', 'b.md');

      notes.set('A', noteA);
      notes.set('B', noteB);

      const index = buildNoteIndex(notes);
      const { resolved, unresolved } = parseNoteLinks(noteA, index);

      expect(resolved).toHaveLength(1);
      expect(resolved[0].sourceId).toBe('A');
      expect(resolved[0].targetId).toBe('B');
      expect(resolved[0].name).toBe('supports');
      expect(resolved[0].fromFrontmatter).toBe(true);
      expect(unresolved).toHaveLength(0);
    });

    it('should parse inline wikilinks', () => {
      const notes = new Map<string, Note>();
      const noteA = createNote('A', 'Note A', 'a.md', 'Link to [[Note B]] here');
      const noteB = createNote('B', 'Note B', 'b.md');

      notes.set('A', noteA);
      notes.set('B', noteB);

      const index = buildNoteIndex(notes);
      const { resolved } = parseNoteLinks(noteA, index);

      expect(resolved).toHaveLength(1);
      expect(resolved[0].targetId).toBe('B');
      expect(resolved[0].name).toBe('relates to');
      expect(resolved[0].fromFrontmatter).toBe(false);
    });

    it('should parse wikilinks with display text', () => {
      const notes = new Map<string, Note>();
      const noteA = createNote('A', 'Note A', 'a.md', 'Link to [[B|custom text]]');
      const noteB = createNote('B', 'Note B', 'b.md');

      notes.set('A', noteA);
      notes.set('B', noteB);

      const index = buildNoteIndex(notes);
      const { resolved } = parseNoteLinks(noteA, index);

      expect(resolved).toHaveLength(1);
      expect(resolved[0].targetId).toBe('B');
      expect(resolved[0].displayText).toBe('custom text');
    });

    it('should track unresolved links', () => {
      const notes = new Map<string, Note>();
      const noteA = createNote('A', 'Note A', 'a.md', 'Link to [[Non Existent]]');

      notes.set('A', noteA);

      const index = buildNoteIndex(notes);
      const { resolved, unresolved } = parseNoteLinks(noteA, index);

      expect(resolved).toHaveLength(0);
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].targetRef).toBe('Non Existent');
    });

    it('should deduplicate links to same target', () => {
      const notes = new Map<string, Note>();
      const noteA = createNote(
        'A',
        'Note A',
        'a.md',
        'Link to [[Note B]] and again [[Note B]]',
        [{ target: 'B', name: 'supports', created: '2024-01-01T00:00:00.000Z' }]
      );
      const noteB = createNote('B', 'Note B', 'b.md');

      notes.set('A', noteA);
      notes.set('B', noteB);

      const index = buildNoteIndex(notes);
      const { resolved } = parseNoteLinks(noteA, index);

      // Should have 1 link: frontmatter link takes precedence
      // Inline wikilinks to the same target are deduplicated
      expect(resolved).toHaveLength(1);
      expect(resolved[0].fromFrontmatter).toBe(true);
      expect(resolved[0].name).toBe('supports');
    });

    it('should prioritize frontmatter links over inline', () => {
      const notes = new Map<string, Note>();
      const noteA = createNote(
        'A',
        'Note A',
        'a.md',
        'Link to [[Note B]]',
        [{ target: 'B', name: 'supports', description: 'FM link', created: '2024-01-01T00:00:00.000Z' }]
      );
      const noteB = createNote('B', 'Note B', 'b.md');

      notes.set('A', noteA);
      notes.set('B', noteB);

      const index = buildNoteIndex(notes);
      const { resolved } = parseNoteLinks(noteA, index);

      // Should have frontmatter link prioritized
      const fmLink = resolved.find((l) => l.fromFrontmatter);
      expect(fmLink).toBeDefined();
      expect(fmLink?.name).toBe('supports');
    });
  });

  describe('parseAllLinks', () => {
    it('should parse links from all notes', () => {
      const notes = new Map<string, Note>();
      const noteA = createNote('A', 'Note A', 'a.md', 'Link to [[Note B]]');
      const noteB = createNote('B', 'Note B', 'b.md', 'Link to [[Note C]]');
      const noteC = createNote('C', 'Note C', 'c.md');

      notes.set('A', noteA);
      notes.set('B', noteB);
      notes.set('C', noteC);

      const { allResolved, allUnresolved, linksBySource, linksByTarget } = parseAllLinks(notes);

      expect(allResolved).toHaveLength(2);
      expect(allUnresolved).toHaveLength(0);
      expect(linksBySource.get('A')).toHaveLength(1);
      expect(linksBySource.get('B')).toHaveLength(1);
      expect(linksByTarget.get('B')).toHaveLength(1);
      expect(linksByTarget.get('C')).toHaveLength(1);
    });

    it('should return empty arrays for no notes', () => {
      const notes = new Map<string, Note>();
      const { allResolved, allUnresolved } = parseAllLinks(notes);

      expect(allResolved).toHaveLength(0);
      expect(allUnresolved).toHaveLength(0);
    });
  });

  describe('generateEdgeId', () => {
    it('should generate consistent edge IDs', () => {
      const id1 = generateEdgeId('source-1', 'target-1', 'supports');
      const id2 = generateEdgeId('source-1', 'target-1', 'supports');

      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different sources', () => {
      const id1 = generateEdgeId('source-1', 'target', 'supports');
      const id2 = generateEdgeId('source-2', 'target', 'supports');

      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs for different targets', () => {
      const id1 = generateEdgeId('source', 'target-1', 'supports');
      const id2 = generateEdgeId('source', 'target-2', 'supports');

      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs for different relationship names', () => {
      const id1 = generateEdgeId('source', 'target', 'supports');
      const id2 = generateEdgeId('source', 'target', 'contradicts');

      expect(id1).not.toBe(id2);
    });
  });
});
