// src/lib/search/grepSearch.test.ts

import { describe, it, expect } from 'vitest';
import { highlightMatch } from './grepSearch';

describe('grepSearch', () => {
  describe('highlightMatch', () => {
    it('should split line into before, match, and after segments', () => {
      const line = 'Hello world, this is a test';
      const result = highlightMatch(line, 6, 11);

      expect(result).toEqual({
        before: 'Hello ',
        match: 'world',
        after: ', this is a test',
      });
    });

    it('should handle match at start of line', () => {
      const line = 'Hello world';
      const result = highlightMatch(line, 0, 5);

      expect(result).toEqual({
        before: '',
        match: 'Hello',
        after: ' world',
      });
    });

    it('should handle match at end of line', () => {
      const line = 'Hello world';
      const result = highlightMatch(line, 6, 11);

      expect(result).toEqual({
        before: 'Hello ',
        match: 'world',
        after: '',
      });
    });

    it('should handle entire line as match', () => {
      const line = 'test';
      const result = highlightMatch(line, 0, 4);

      expect(result).toEqual({
        before: '',
        match: 'test',
        after: '',
      });
    });

    it('should handle single character match', () => {
      const line = 'a b c';
      const result = highlightMatch(line, 2, 3);

      expect(result).toEqual({
        before: 'a ',
        match: 'b',
        after: ' c',
      });
    });

    it('should handle empty line with zero indices', () => {
      const line = '';
      const result = highlightMatch(line, 0, 0);

      expect(result).toEqual({
        before: '',
        match: '',
        after: '',
      });
    });

    it('should handle unicode characters', () => {
      const line = 'Hello \u4e16\u754c world';
      const result = highlightMatch(line, 6, 8);

      expect(result).toEqual({
        before: 'Hello ',
        match: '\u4e16\u754c',
        after: ' world',
      });
    });

    it('should handle special characters in match', () => {
      const line = 'const regex = /test.*/g;';
      const result = highlightMatch(line, 14, 22);

      expect(result).toEqual({
        before: 'const regex = ',
        match: '/test.*/',
        after: 'g;',
      });
    });
  });
});
