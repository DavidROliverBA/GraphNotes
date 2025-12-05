import { useState, useMemo } from 'react';
import { Search, RotateCcw, Keyboard } from 'lucide-react';
import {
  ShortcutDefinition,
  DEFAULT_SHORTCUTS,
  getShortcutsByCategory,
  CATEGORY_LABELS,
  parseKeyString,
  formatKeyCombo,
} from '../../lib/keyboard/shortcuts';

interface KeyboardShortcutsPanelProps {
  className?: string;
}

export function KeyboardShortcutsPanel({ className = '' }: KeyboardShortcutsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [shortcuts] = useState<ShortcutDefinition[]>(DEFAULT_SHORTCUTS);

  // Filter shortcuts by search query
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return shortcuts;

    const query = searchQuery.toLowerCase();
    return shortcuts.filter(
      (s) =>
        s.label.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.defaultKeys.some((k) => k.toLowerCase().includes(query))
    );
  }, [shortcuts, searchQuery]);

  // Group by category
  const groupedShortcuts = useMemo(
    () => getShortcutsByCategory(filteredShortcuts),
    [filteredShortcuts]
  );

  const categoryOrder = ['navigation', 'notes', 'editor', 'search', 'graph', 'sync', 'settings'];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Keyboard Shortcuts</h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          />
        </div>
      </div>

      {/* Shortcuts list */}
      <div className="flex-1 overflow-y-auto">
        {categoryOrder.map((category) => {
          const categoryShortcuts = groupedShortcuts[category];
          if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

          return (
            <div key={category} className="border-b border-border-subtle last:border-b-0">
              <div className="px-4 py-2 bg-bg-tertiary">
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  {CATEGORY_LABELS[category]}
                </h3>
              </div>
              <div className="divide-y divide-border-subtle">
                {categoryShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.action} shortcut={shortcut} />
                ))}
              </div>
            </div>
          );
        })}

        {filteredShortcuts.length === 0 && (
          <div className="p-8 text-center text-text-tertiary">
            No shortcuts match your search
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-subtle bg-bg-secondary">
        <button
          onClick={() => {
            // Reset all shortcuts to defaults
            // In a full implementation, this would update the shortcuts state
          }}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset all to defaults
        </button>
      </div>
    </div>
  );
}

interface ShortcutRowProps {
  shortcut: ShortcutDefinition;
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  const keys = shortcut.customKeys || shortcut.defaultKeys;

  return (
    <div
      className={`
        px-4 py-3 flex items-center justify-between
        ${!shortcut.enabled ? 'opacity-50' : ''}
      `}
    >
      <div className="flex-1">
        <div className="text-sm font-medium text-text-primary">{shortcut.label}</div>
        <div className="text-xs text-text-tertiary">{shortcut.description}</div>
      </div>

      <div className="flex items-center gap-2">
        {keys.map((keyString, index) => {
          const combo = parseKeyString(keyString);
          const formatted = formatKeyCombo(combo);

          return (
            <kbd
              key={index}
              className="px-2 py-1 text-xs font-mono bg-bg-tertiary border border-border-default rounded shadow-sm text-text-secondary"
            >
              {formatted}
            </kbd>
          );
        })}
      </div>
    </div>
  );
}

export default KeyboardShortcutsPanel;
