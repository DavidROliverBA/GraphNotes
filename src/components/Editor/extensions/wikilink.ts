// src/components/Editor/extensions/wikilink.ts

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface WikilinkSuggestionItem {
  id: string;
  title: string;
  filepath: string;
}

export interface WikilinkOptions {
  HTMLAttributes: Record<string, unknown>;
  onWikilinkClick?: (target: string, displayText?: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikilink: {
      setWikilink: (options: { target: string; displayText?: string }) => ReturnType;
    };
  }
}

// Regex to match wikilinks: [[target]] or [[target|display text]]
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export const Wikilink = Node.create<WikilinkOptions>({
  name: 'wikilink',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'wikilink',
      },
      onWikilinkClick: undefined,
    };
  },

  addAttributes() {
    return {
      target: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-target'),
        renderHTML: (attributes) => {
          if (!attributes.target) return {};
          return { 'data-target': attributes.target };
        },
      },
      displayText: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-display-text'),
        renderHTML: (attributes) => {
          if (!attributes.displayText) return {};
          return { 'data-display-text': attributes.displayText };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="wikilink"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const displayText = node.attrs.displayText || node.attrs.target;
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'wikilink',
        class: 'wikilink cursor-pointer text-accent-primary hover:text-accent-secondary underline decoration-dotted',
      }),
      `[[${displayText}]]`,
    ];
  },

  addCommands() {
    return {
      setWikilink:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const { onWikilinkClick } = this.options;

    return [
      // Plugin to handle wikilink clicks
      new Plugin({
        key: new PluginKey('wikilinkClick'),
        props: {
          handleClick(_view, _pos, event) {
            const target = event.target as HTMLElement;
            if (target.classList.contains('wikilink') || target.classList.contains('wikilink-detected')) {
              const wikilinkTarget = target.getAttribute('data-target');
              if (wikilinkTarget && onWikilinkClick) {
                onWikilinkClick(wikilinkTarget, target.getAttribute('data-display-text') || undefined);
                return true;
              }
            }
            return false;
          },
        },
      }),

      // Plugin to detect and style wikilinks in plain text
      new Plugin({
        key: new PluginKey('wikilinkDetection'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text || '';
              let match;

              // Reset regex lastIndex
              WIKILINK_REGEX.lastIndex = 0;

              while ((match = WIKILINK_REGEX.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;

                decorations.push(
                  Decoration.inline(start, end, {
                    class: 'wikilink-detected text-accent-primary cursor-pointer hover:bg-sidebar-hover rounded px-0.5',
                    'data-target': match[1],
                    'data-display-text': match[2] || match[1],
                  })
                );
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export default Wikilink;
