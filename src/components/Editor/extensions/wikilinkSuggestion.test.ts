// src/components/Editor/extensions/wikilinkSuggestion.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWikilinkSuggestion } from './wikilinkSuggestion';
import { WikilinkSuggestionItem } from './wikilink';

// Mock tippy
vi.mock('tippy.js', () => ({
  default: vi.fn(() => [{
    setProps: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
    destroy: vi.fn(),
  }]),
}));

// Mock ReactRenderer - define class inside factory to avoid hoisting issues
vi.mock('@tiptap/react', () => {
  return {
    ReactRenderer: class {
      element = document.createElement('div');
      ref = {
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
          if (event.key === 'Enter') return true;
          if (event.key === 'ArrowUp') return true;
          if (event.key === 'ArrowDown') return true;
          return false;
        },
      };
      updateProps = vi.fn();
      destroy = vi.fn();
    },
  };
});

describe('wikilinkSuggestion', () => {
  const mockItems: WikilinkSuggestionItem[] = [
    { id: '1', title: 'Note One', filepath: 'note-one.md' },
    { id: '2', title: 'Note Two', filepath: 'note-two.md' },
  ];

  const mockGetItems = vi.fn(() => mockItems);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetItems.mockReturnValue(mockItems);
  });

  describe('createWikilinkSuggestion', () => {
    it('should create suggestion with correct trigger character', () => {
      const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
      expect(suggestion.char).toBe('[[');
    });

    it('should allow spaces in search query', () => {
      const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
      expect(suggestion.allowSpaces).toBe(true);
    });

    it('should not require start of line', () => {
      const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
      expect(suggestion.startOfLine).toBe(false);
    });

    it('should call getItems with query', () => {
      const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
      const result = suggestion.items?.({ query: 'test' } as Parameters<typeof suggestion.items>[0]);

      expect(mockGetItems).toHaveBeenCalledWith('test');
      expect(result).toEqual(mockItems);
    });

    it('should insert wikilink with correct format when command is called', () => {
      const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });

      const mockEditor = {
        chain: vi.fn().mockReturnThis(),
        focus: vi.fn().mockReturnThis(),
        deleteRange: vi.fn().mockReturnThis(),
        insertContent: vi.fn().mockReturnThis(),
        run: vi.fn(),
      };

      const mockRange = { from: 0, to: 5 };
      const mockProps = { id: '1', title: 'Note One', filepath: 'note-one.md' };

      suggestion.command?.({
        editor: mockEditor,
        range: mockRange,
        props: mockProps,
      } as unknown as Parameters<NonNullable<typeof suggestion.command>>[0]);

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.deleteRange).toHaveBeenCalledWith(mockRange);
      expect(mockEditor.insertContent).toHaveBeenCalledWith('[[Note One]]');
      expect(mockEditor.run).toHaveBeenCalled();
    });
  });

  describe('render lifecycle', () => {
    it('should create render handlers', () => {
      const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
      const render = suggestion.render?.();

      expect(render).toBeDefined();
      expect(render?.onStart).toBeInstanceOf(Function);
      expect(render?.onUpdate).toBeInstanceOf(Function);
      expect(render?.onKeyDown).toBeInstanceOf(Function);
      expect(render?.onExit).toBeInstanceOf(Function);
    });

    describe('onKeyDown', () => {
      it('should return true and hide popup on Escape', () => {
        const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
        const render = suggestion.render?.();

        // Initialize by calling onStart
        render?.onStart?.({
          editor: {} as any,
          query: '',
          clientRect: () => ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect),
          items: mockItems,
          command: vi.fn(),
          range: { from: 0, to: 0 },
          text: '',
          decorationNode: null,
        });

        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        const result = (render?.onKeyDown as any)?.({ event: escapeEvent });

        expect(result).toBe(true);
      });

      it('should delegate arrow keys to component ref', () => {
        const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
        const render = suggestion.render?.();

        // Initialize
        render?.onStart?.({
          editor: {} as any,
          query: '',
          clientRect: () => ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect),
          items: mockItems,
          command: vi.fn(),
          range: { from: 0, to: 0 },
          text: '',
          decorationNode: null,
        });

        const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        const result = (render?.onKeyDown as any)?.({ event: arrowUpEvent });

        expect(result).toBe(true);
      });

      it('should handle Enter key and trigger cleanup', () => {
        const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
        const render = suggestion.render?.();

        // Initialize
        render?.onStart?.({
          editor: {} as any,
          query: '',
          clientRect: () => ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect),
          items: mockItems,
          command: vi.fn(),
          range: { from: 0, to: 0 },
          text: '',
          decorationNode: null,
        });

        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        const result = (render?.onKeyDown as any)?.({ event: enterEvent });

        // Should return true (handled) and trigger cleanup
        expect(result).toBe(true);

        // After cleanup, subsequent Enter should not be captured
        // (component is destroyed so onKeyDown returns false)
        const secondEnterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        const secondResult = (render?.onKeyDown as any)?.({ event: secondEnterEvent });

        // After cleanup, component is null so it returns false
        expect(secondResult).toBe(false);
      });

      it('should return false for unhandled keys', () => {
        const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
        const render = suggestion.render?.();

        // Initialize
        render?.onStart?.({
          editor: {} as any,
          query: '',
          clientRect: () => ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect),
          items: mockItems,
          command: vi.fn(),
          range: { from: 0, to: 0 },
          text: '',
          decorationNode: null,
        });

        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
        const result = (render?.onKeyDown as any)?.({ event: tabEvent });

        expect(result).toBe(false);
      });
    });

    describe('cleanup after selection', () => {
      it('should destroy popup and component after Enter selection', () => {
        const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
        const render = suggestion.render?.();

        // Initialize
        render?.onStart?.({
          editor: {} as any,
          query: '',
          clientRect: () => ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect),
          items: mockItems,
          command: vi.fn(),
          range: { from: 0, to: 0 },
          text: '',
          decorationNode: null,
        });

        // Press Enter to select
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        (render?.onKeyDown as any)?.({ event: enterEvent });

        // Press Enter again - should not be captured since cleanup occurred
        const secondEnterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        const result = (render?.onKeyDown as any)?.({ event: secondEnterEvent });

        expect(result).toBe(false);
      });

      it('should handle onExit gracefully even if already cleaned up', () => {
        const suggestion = createWikilinkSuggestion({ getItems: mockGetItems });
        const render = suggestion.render?.();

        // Initialize
        render?.onStart?.({
          editor: {} as any,
          query: '',
          clientRect: () => ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect),
          items: mockItems,
          command: vi.fn(),
          range: { from: 0, to: 0 },
          text: '',
          decorationNode: null,
        });

        // Press Enter to select (triggers cleanup)
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        (render?.onKeyDown as any)?.({ event: enterEvent });

        // onExit should not throw even if already cleaned up
        expect(() => (render?.onExit as any)?.()).not.toThrow();
      });
    });
  });
});
