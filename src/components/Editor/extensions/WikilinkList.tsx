// src/components/Editor/extensions/WikilinkList.tsx

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { WikilinkSuggestionItem } from './wikilink';
import { SuggestionProps } from '@tiptap/suggestion';

export type WikilinkSuggestionProps = SuggestionProps<WikilinkSuggestionItem>;

export interface WikilinkListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const WikilinkList = forwardRef<WikilinkListRef, WikilinkSuggestionProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command({ id: item.id, title: item.title, filepath: item.filepath });
      }
    };

    const upHandler = () => {
      setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          upHandler();
          return true;
        }

        if (event.key === 'ArrowDown') {
          downHandler();
          return true;
        }

        if (event.key === 'Enter') {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (props.items.length === 0) {
      return null;
    }

    return (
      <div className="bg-sidebar-bg border border-sidebar-hover rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto min-w-[200px]">
        {props.items.map((item: WikilinkSuggestionItem, index: number) => (
          <button
            key={item.id}
            onClick={() => selectItem(index)}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              index === selectedIndex
                ? 'bg-accent-primary text-sidebar-bg'
                : 'text-editor-text hover:bg-sidebar-hover'
            }`}
          >
            <div className="font-medium truncate">{item.title}</div>
            <div
              className={`text-xs truncate ${
                index === selectedIndex ? 'text-sidebar-bg/70' : 'text-gray-500'
              }`}
            >
              {item.filepath}
            </div>
          </button>
        ))}
      </div>
    );
  }
);

WikilinkList.displayName = 'WikilinkList';

export default WikilinkList;
