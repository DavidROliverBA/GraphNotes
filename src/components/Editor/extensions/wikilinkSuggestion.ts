// src/components/Editor/extensions/wikilinkSuggestion.ts

import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance, Props } from 'tippy.js';
import { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import WikilinkList, { WikilinkListRef } from './WikilinkList';
import { WikilinkSuggestionItem } from './wikilink';

export interface WikilinkSuggestionOptions {
  getItems: (query: string) => WikilinkSuggestionItem[];
}

export function createWikilinkSuggestion(
  options: WikilinkSuggestionOptions
): Omit<SuggestionOptions<WikilinkSuggestionItem>, 'editor'> {
  return {
    char: '[[',
    allowSpaces: true,
    startOfLine: false,

    items: ({ query }): WikilinkSuggestionItem[] => {
      return options.getItems(query);
    },

    command: ({ editor, range, props }) => {
      const item = props as unknown as WikilinkSuggestionItem;

      // Delete the trigger characters and query, then insert the wikilink
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(`[[${item.title}]]`)
        .run();
    },

    render: () => {
      let component: ReactRenderer<WikilinkListRef> | null = null;
      let popup: Instance<Props>[] | null = null;
      let isSelecting = false;

      const cleanup = () => {
        popup?.[0]?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      };

      return {
        onStart: (props: SuggestionProps<WikilinkSuggestionItem>) => {
          component = new ReactRenderer(WikilinkList, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) {
            return;
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
            theme: 'graphnotes',
            offset: [0, 8],
          });
        },

        onUpdate: (props: SuggestionProps<WikilinkSuggestionItem>) => {
          component?.updateProps(props);

          if (!props.clientRect) {
            return;
          }

          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });

          // Hide popup when no items
          if (props.items.length === 0) {
            popup?.[0]?.hide();
          } else {
            popup?.[0]?.show();
          }
        },

        onKeyDown: (props: { event: KeyboardEvent }): boolean => {
          if (isSelecting) {
            // Selection in progress, don't capture keys
            return false;
          }

          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }

          if (props.event.key === 'Enter') {
            // Mark as selecting to prevent capturing subsequent events
            isSelecting = true;
            const handled = component?.ref?.onKeyDown(props) ?? false;
            if (handled) {
              // Immediately clean up after selection
              cleanup();
            }
            isSelecting = false;
            return handled;
          }

          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          cleanup();
        },
      };
    },
  };
}
