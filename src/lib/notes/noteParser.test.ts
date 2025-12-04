// src/lib/notes/noteParser.test.ts

import { describe, it, expect } from 'vitest';
import {
  parseNote,
  serializeNote,
  createEmptyNote,
  extractWikilinks,
  htmlToMarkdown,
  markdownToHtml,
} from './noteParser';

describe('noteParser', () => {
  describe('parseNote', () => {
    it('should parse a note with complete frontmatter', () => {
      const rawContent = `---
id: test-123
title: Test Note
created: 2024-01-01T00:00:00.000Z
modified: 2024-01-02T00:00:00.000Z
tags:
  - test
  - example
---

# Test Note

This is the content.`;

      const note = parseNote(rawContent, 'test-note.md');

      expect(note.id).toBe('test-123');
      expect(note.filepath).toBe('test-note.md');
      expect(note.frontmatter.title).toBe('Test Note');
      // gray-matter may return Date objects for date strings, so convert to string
      const created = typeof note.frontmatter.created === 'object'
        ? (note.frontmatter.created as unknown as Date).toISOString()
        : note.frontmatter.created;
      const modified = typeof note.frontmatter.modified === 'object'
        ? (note.frontmatter.modified as unknown as Date).toISOString()
        : note.frontmatter.modified;
      expect(created).toBe('2024-01-01T00:00:00.000Z');
      expect(modified).toBe('2024-01-02T00:00:00.000Z');
      expect(note.frontmatter.tags).toEqual(['test', 'example']);
      expect(note.content).toContain('This is the content.');
    });

    it('should generate ID if missing', () => {
      const rawContent = `---
title: No ID Note
---

Content here.`;

      const note = parseNote(rawContent, 'no-id.md');

      expect(note.id).toBeDefined();
      expect(note.id.length).toBeGreaterThan(0);
    });

    it('should extract title from H1 if not in frontmatter', () => {
      const rawContent = `---
id: abc
---

# My Title From Content

Some text.`;

      const note = parseNote(rawContent, 'note.md');

      expect(note.frontmatter.title).toBe('My Title From Content');
    });

    it('should use filename as title if no title in frontmatter or content', () => {
      const rawContent = `---
id: xyz
---

Just some content without a heading.`;

      const note = parseNote(rawContent, 'my-note-file.md');

      expect(note.frontmatter.title).toBe('my-note-file');
    });

    it('should handle empty tags array', () => {
      const rawContent = `---
id: test
title: Test
---

Content.`;

      const note = parseNote(rawContent, 'test.md');

      expect(note.frontmatter.tags).toEqual([]);
    });
  });

  describe('serializeNote', () => {
    it('should serialize a note back to markdown with frontmatter', () => {
      const note = {
        id: 'test-id',
        filepath: 'test.md',
        frontmatter: {
          id: 'test-id',
          title: 'Test Title',
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          tags: ['tag1', 'tag2'],
          links: [],
        },
        content: 'This is content.',
        rawContent: '',
      };

      const serialized = serializeNote(note);

      expect(serialized).toContain('id: test-id');
      expect(serialized).toContain('title: Test Title');
      expect(serialized).toContain('This is content.');
    });

    it('should not include empty tags array in output', () => {
      const note = {
        id: 'test-id',
        filepath: 'test.md',
        frontmatter: {
          id: 'test-id',
          title: 'Test',
          created: '2024-01-01T00:00:00.000Z',
          modified: '2024-01-01T00:00:00.000Z',
          tags: [],
          links: [],
        },
        content: 'Content',
        rawContent: '',
      };

      const serialized = serializeNote(note);

      expect(serialized).not.toContain('tags:');
    });
  });

  describe('createEmptyNote', () => {
    it('should create a note with default values', () => {
      const note = createEmptyNote('new-note.md');

      expect(note.id).toBeDefined();
      expect(note.filepath).toBe('new-note.md');
      // Default title is now "A Lovely New Page - [date]"
      expect(note.frontmatter.title).toMatch(/^A Lovely New Page - \d{1,2} \w+ \d{4}$/);
      expect(note.frontmatter.tags).toEqual([]);
      expect(note.frontmatter.links).toEqual([]);
      expect(note.content).toMatch(/^# A Lovely New Page - \d{1,2} \w+ \d{4}/);
    });

    it('should use provided title', () => {
      const note = createEmptyNote('note.md', 'Custom Title');

      expect(note.frontmatter.title).toBe('Custom Title');
      expect(note.content).toContain('# Custom Title');
    });

    it('should generate valid rawContent', () => {
      const note = createEmptyNote('test.md', 'Test');

      expect(note.rawContent).toContain('id:');
      expect(note.rawContent).toContain('title: Test');
      expect(note.rawContent).toContain('created:');
      expect(note.rawContent).toContain('modified:');
    });
  });

  describe('extractWikilinks', () => {
    it('should extract simple wikilinks', () => {
      const content = 'Check out [[My Note]] for more info.';
      const links = extractWikilinks(content);

      expect(links).toHaveLength(1);
      expect(links[0].target).toBe('My Note');
      expect(links[0].displayText).toBeUndefined();
    });

    it('should extract wikilinks with display text', () => {
      const content = 'See [[target-note|Display Text]] here.';
      const links = extractWikilinks(content);

      expect(links).toHaveLength(1);
      expect(links[0].target).toBe('target-note');
      expect(links[0].displayText).toBe('Display Text');
    });

    it('should extract multiple wikilinks', () => {
      const content = 'Links to [[Note A]] and [[Note B|B Title]] and [[Note C]].';
      const links = extractWikilinks(content);

      expect(links).toHaveLength(3);
      expect(links[0].target).toBe('Note A');
      expect(links[1].target).toBe('Note B');
      expect(links[1].displayText).toBe('B Title');
      expect(links[2].target).toBe('Note C');
    });

    it('should return empty array for no wikilinks', () => {
      const content = 'No wikilinks here.';
      const links = extractWikilinks(content);

      expect(links).toHaveLength(0);
    });
  });

  describe('htmlToMarkdown', () => {
    it('should convert headings', () => {
      expect(htmlToMarkdown('<h1>Title</h1>')).toBe('# Title');
      expect(htmlToMarkdown('<h2>Subtitle</h2>')).toBe('## Subtitle');
      expect(htmlToMarkdown('<h3>Section</h3>')).toBe('### Section');
    });

    it('should convert bold and italic', () => {
      expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
      expect(htmlToMarkdown('<b>bold</b>')).toBe('**bold**');
      expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*');
      expect(htmlToMarkdown('<i>italic</i>')).toBe('*italic*');
    });

    it('should convert paragraphs', () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('First paragraph');
      expect(md).toContain('Second paragraph');
    });
  });

  describe('markdownToHtml', () => {
    it('should wrap paragraphs in p tags', () => {
      const md = 'First paragraph\n\nSecond paragraph';
      const html = markdownToHtml(md);
      expect(html).toContain('<p>First paragraph</p>');
      expect(html).toContain('<p>Second paragraph</p>');
    });

    it('should not wrap headings', () => {
      const md = '# Heading\n\nParagraph';
      const html = markdownToHtml(md);
      expect(html).toContain('# Heading');
      expect(html).not.toContain('<p># Heading</p>');
    });
  });
});
