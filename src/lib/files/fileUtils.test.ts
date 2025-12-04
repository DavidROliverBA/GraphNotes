// src/lib/files/fileUtils.test.ts

import { describe, it, expect } from 'vitest';
import { filterDotfiles, getDisplayTitle } from './fileUtils';
import { NoteFile } from '../notes/types';

describe('fileUtils', () => {
  describe('filterDotfiles', () => {
    it('should filter out files starting with a dot', () => {
      const files: NoteFile[] = [
        { name: 'note.md', path: '/notes/note.md', isDirectory: false },
        { name: '.hidden.md', path: '/notes/.hidden.md', isDirectory: false },
        { name: 'another.md', path: '/notes/another.md', isDirectory: false },
      ];

      const filtered = filterDotfiles(files);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(f => f.name)).toEqual(['note.md', 'another.md']);
    });

    it('should filter out directories starting with a dot', () => {
      const files: NoteFile[] = [
        { name: 'docs', path: '/docs', isDirectory: true },
        { name: '.git', path: '/.git', isDirectory: true },
        { name: '.obsidian', path: '/.obsidian', isDirectory: true },
      ];

      const filtered = filterDotfiles(files);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('docs');
    });

    it('should recursively filter dotfiles in nested directories', () => {
      const files: NoteFile[] = [
        {
          name: 'docs',
          path: '/docs',
          isDirectory: true,
          children: [
            { name: 'readme.md', path: '/docs/readme.md', isDirectory: false },
            { name: '.DS_Store', path: '/docs/.DS_Store', isDirectory: false },
            { name: '.hidden', path: '/docs/.hidden', isDirectory: true },
          ],
        },
      ];

      const filtered = filterDotfiles(files);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].children).toHaveLength(1);
      expect(filtered[0].children![0].name).toBe('readme.md');
    });

    it('should handle deeply nested structures', () => {
      const files: NoteFile[] = [
        {
          name: 'level1',
          path: '/level1',
          isDirectory: true,
          children: [
            {
              name: 'level2',
              path: '/level1/level2',
              isDirectory: true,
              children: [
                { name: 'visible.md', path: '/level1/level2/visible.md', isDirectory: false },
                { name: '.hidden.md', path: '/level1/level2/.hidden.md', isDirectory: false },
              ],
            },
            { name: '.hidden-dir', path: '/level1/.hidden-dir', isDirectory: true },
          ],
        },
      ];

      const filtered = filterDotfiles(files);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].children).toHaveLength(1);
      expect(filtered[0].children![0].name).toBe('level2');
      expect(filtered[0].children![0].children).toHaveLength(1);
      expect(filtered[0].children![0].children![0].name).toBe('visible.md');
    });

    it('should return empty array when all files are dotfiles', () => {
      const files: NoteFile[] = [
        { name: '.git', path: '/.git', isDirectory: true },
        { name: '.DS_Store', path: '/.DS_Store', isDirectory: false },
      ];

      const filtered = filterDotfiles(files);

      expect(filtered).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      const filtered = filterDotfiles([]);

      expect(filtered).toHaveLength(0);
    });

    it('should preserve non-dotfiles unchanged', () => {
      const files: NoteFile[] = [
        { name: 'file.md', path: '/file.md', isDirectory: false },
      ];

      const filtered = filterDotfiles(files);

      expect(filtered[0]).toEqual(files[0]);
    });

    it('should filter common hidden files like .DS_Store, .gitignore', () => {
      const files: NoteFile[] = [
        { name: 'README.md', path: '/README.md', isDirectory: false },
        { name: '.DS_Store', path: '/.DS_Store', isDirectory: false },
        { name: '.gitignore', path: '/.gitignore', isDirectory: false },
        { name: '.env', path: '/.env', isDirectory: false },
      ];

      const filtered = filterDotfiles(files);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('README.md');
    });
  });

  describe('getDisplayTitle', () => {
    it('should return frontmatter title when provided', () => {
      const result = getDisplayTitle('some-file.md', 'My Nice Title');

      expect(result).toBe('My Nice Title');
    });

    it('should strip .md extension when no frontmatter title', () => {
      const result = getDisplayTitle('my-note.md');

      expect(result).toBe('my-note');
    });

    it('should return filename as-is if no .md extension and no frontmatter title', () => {
      const result = getDisplayTitle('readme.txt');

      expect(result).toBe('readme.txt');
    });

    it('should prefer frontmatter title over filename', () => {
      const result = getDisplayTitle('2024-01-15-random-uuid.md', 'Project Ideas');

      expect(result).toBe('Project Ideas');
    });

    it('should handle empty frontmatter title by stripping extension', () => {
      const result = getDisplayTitle('note.md', '');

      expect(result).toBe('note');
    });

    it('should handle undefined frontmatter title by stripping extension', () => {
      const result = getDisplayTitle('note.md', undefined);

      expect(result).toBe('note');
    });

    it('should handle filenames with multiple dots', () => {
      const result = getDisplayTitle('my.special.note.md');

      expect(result).toBe('my.special.note');
    });

    it('should handle filenames that end with .md but have no other content', () => {
      const result = getDisplayTitle('.md');

      expect(result).toBe('');
    });
  });
});
