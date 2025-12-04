// src/components/Editor/extensions/WikilinkSuggestionExtension.ts

import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { WikilinkSuggestionItem } from './wikilink';
import { createWikilinkSuggestion } from './wikilinkSuggestion';

export interface WikilinkSuggestionExtensionOptions {
  getItems: (query: string) => WikilinkSuggestionItem[];
}

export const WikilinkSuggestionExtension = Extension.create<WikilinkSuggestionExtensionOptions>({
  name: 'wikilinkSuggestion',

  addOptions() {
    return {
      getItems: () => [],
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...createWikilinkSuggestion({
          getItems: this.options.getItems,
        }),
      }),
    ];
  },
});

export default WikilinkSuggestionExtension;
