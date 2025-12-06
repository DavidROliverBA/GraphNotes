import { useState, useCallback } from 'react';
import { X, Calendar, Clock, Hash, Tag, Link, Copy, Check } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { SuperTagAssigner } from '../SuperTags/SuperTagAssigner';
import { Note } from '../../lib/notes/types';

export function PropertiesPanel() {
  const { showPropertiesPanel, setShowPropertiesPanel } = useUIStore();
  const { currentNote, saveNote } = useNoteStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSuperTagUpdate = useCallback(
    (updates: Partial<Note['frontmatter']>) => {
      if (!currentNote) return;
      const updatedNote: Note = {
        ...currentNote,
        frontmatter: {
          ...currentNote.frontmatter,
          ...updates,
        },
      };
      saveNote(updatedNote);
    },
    [currentNote, saveNote]
  );

  if (!showPropertiesPanel || !currentNote) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const properties = [
    {
      key: 'id',
      label: 'Note ID',
      value: currentNote.id,
      icon: Hash,
      copyable: true,
    },
    {
      key: 'title',
      label: 'Title',
      value: currentNote.frontmatter.title,
      icon: Tag,
      copyable: true,
    },
    {
      key: 'created',
      label: 'Created',
      value: formatDate(currentNote.frontmatter.created),
      icon: Calendar,
      copyable: false,
    },
    {
      key: 'modified',
      label: 'Modified',
      value: formatDate(currentNote.frontmatter.modified),
      icon: Clock,
      copyable: false,
    },
    {
      key: 'filepath',
      label: 'File Path',
      value: currentNote.filepath,
      icon: Link,
      copyable: true,
    },
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-bg-primary border-l border-border-default shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Properties</h2>
        <button
          onClick={() => setShowPropertiesPanel(false)}
          className="p-1 rounded hover:bg-bg-tertiary transition-colors"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Properties */}
        <div className="space-y-4">
          {properties.map(({ key, label, value, icon: Icon, copyable }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-sm text-text-primary font-mono bg-bg-secondary px-2 py-1 rounded truncate">
                  {value}
                </div>
                {copyable && (
                  <button
                    onClick={() => copyToClipboard(value, key)}
                    className="p-1 rounded hover:bg-bg-tertiary transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedField === key ? (
                      <Check className="w-4 h-4 text-accent-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-tertiary" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Super Tags - Interactive Assigner */}
        <div className="mt-6 pt-4 border-t border-border-subtle">
          <SuperTagAssigner
            note={currentNote}
            onUpdate={handleSuperTagUpdate}
          />
        </div>

        {/* Links Summary */}
        {currentNote.frontmatter.links && currentNote.frontmatter.links.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
              Links ({currentNote.frontmatter.links.length})
            </h3>
            <div className="space-y-2">
              {currentNote.frontmatter.links.map((link) => (
                <div
                  key={link.id}
                  className="bg-bg-secondary rounded p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: link.appearance?.colour || '#6366f1' }}
                    />
                    <span className="text-text-primary font-medium">
                      {link.name || 'link'}
                    </span>
                  </div>
                  <div className="mt-1 text-text-tertiary font-mono truncate">
                    → {link.target}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-6 pt-4 border-t border-border-subtle">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
            Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bg-secondary rounded p-3 text-center">
              <div className="text-lg font-semibold text-text-primary">
                {currentNote.content.split(/\s+/).filter(Boolean).length}
              </div>
              <div className="text-xs text-text-tertiary">Words</div>
            </div>
            <div className="bg-bg-secondary rounded p-3 text-center">
              <div className="text-lg font-semibold text-text-primary">
                {currentNote.content.length}
              </div>
              <div className="text-xs text-text-tertiary">Characters</div>
            </div>
            <div className="bg-bg-secondary rounded p-3 text-center">
              <div className="text-lg font-semibold text-text-primary">
                {currentNote.content.split('\n').length}
              </div>
              <div className="text-xs text-text-tertiary">Lines</div>
            </div>
            <div className="bg-bg-secondary rounded p-3 text-center">
              <div className="text-lg font-semibold text-text-primary">
                {currentNote.frontmatter.links?.length || 0}
              </div>
              <div className="text-xs text-text-tertiary">Links</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
