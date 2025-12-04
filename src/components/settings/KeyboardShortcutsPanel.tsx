// src/components/settings/KeyboardShortcutsPanel.tsx

import {
  defaultShortcuts,
  formatShortcut,
  ShortcutCategory,
  getShortcutsByCategory,
} from '../../lib/keyboard/shortcuts';

const categoryLabels: Record<ShortcutCategory, string> = {
  navigation: 'Navigation',
  editing: 'Editing',
  view: 'View',
  search: 'Search',
  notes: 'Notes',
  graph: 'Graph',
};

const categoryOrder: ShortcutCategory[] = [
  'notes',
  'navigation',
  'search',
  'editing',
  'view',
  'graph',
];

interface ShortcutRowProps {
  description: string;
  keys: string;
}

function ShortcutRow({ description, keys }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{description}</span>
      <kbd className="px-2 py-1 text-xs font-mono bg-gray-700 rounded border border-gray-600 text-gray-200">
        {keys}
      </kbd>
    </div>
  );
}

interface ShortcutSectionProps {
  title: string;
  category: ShortcutCategory;
}

function ShortcutSection({ title, category }: ShortcutSectionProps) {
  const shortcuts = getShortcutsByCategory(defaultShortcuts, category);

  if (shortcuts.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-1">
        {shortcuts.map((shortcut) => (
          <ShortcutRow
            key={shortcut.id}
            description={shortcut.description}
            keys={formatShortcut(shortcut)}
          />
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsPanel() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h2>
      <div className="space-y-2">
        {categoryOrder.map((category) => (
          <ShortcutSection
            key={category}
            title={categoryLabels[category]}
            category={category}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Modal version of the keyboard shortcuts panel
 */
interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              {categoryOrder.slice(0, 3).map((category) => (
                <ShortcutSection
                  key={category}
                  title={categoryLabels[category]}
                  category={category}
                />
              ))}
            </div>
            <div>
              {categoryOrder.slice(3).map((category) => (
                <ShortcutSection
                  key={category}
                  title={categoryLabels[category]}
                  category={category}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">?</kbd> anytime to show this panel
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsPanel;
