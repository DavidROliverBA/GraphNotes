import { useState, useMemo } from 'react';
import {
  Hash,
  FileText,
  ArrowUpDown,
} from 'lucide-react';
import { useSuperTagList } from '../../stores/superTagStore';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore } from '../../stores/uiStore';
import { SuperTag, SuperTagAttribute, isSelectConfig } from '../../lib/superTags/types';
import { Note, AttributeValue } from '../../lib/notes/types';

interface SuperTagBrowserProps {
  className?: string;
}

export function SuperTagBrowser({ className = '' }: SuperTagBrowserProps) {
  const superTagList = useSuperTagList();
  const { notes } = useNoteStore();
  const { setSelectedNoteId } = useUIStore();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const selectedTag = selectedTagId
    ? superTagList.find((t) => t.id === selectedTagId)
    : null;

  // Get notes with selected super tag
  const taggedNotes = useMemo(() => {
    if (!selectedTagId) return [];

    return Array.from(notes.values()).filter((note) =>
      note.frontmatter.superTags?.includes(selectedTagId)
    );
  }, [notes, selectedTagId]);

  // Sort notes
  const sortedNotes = useMemo(() => {
    return [...taggedNotes].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortField === 'title') {
        aVal = a.frontmatter.title.toLowerCase();
        bVal = b.frontmatter.title.toLowerCase();
      } else if (sortField === 'created') {
        aVal = a.frontmatter.created;
        bVal = b.frontmatter.created;
      } else if (sortField === 'modified') {
        aVal = a.frontmatter.modified;
        bVal = b.frontmatter.modified;
      } else if (selectedTag) {
        // Sort by attribute
        const aAttrs = a.frontmatter.tagAttributes?.[selectedTagId!] || {};
        const bAttrs = b.frontmatter.tagAttributes?.[selectedTagId!] || {};
        aVal = String(aAttrs[sortField] || '');
        bVal = String(bAttrs[sortField] || '');
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [taggedNotes, sortField, sortDirection, selectedTag, selectedTagId]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Tag List */}
      <div className="w-56 border-r border-border-subtle bg-bg-secondary overflow-y-auto">
        <div className="p-3 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary">Super Tags</h3>
        </div>
        <div className="py-2">
          {superTagList.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-text-tertiary">
              No super tags yet
            </div>
          ) : (
            superTagList.map((tag) => {
              const count = Array.from(notes.values()).filter((n) =>
                n.frontmatter.superTags?.includes(tag.id)
              ).length;

              return (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTagId(tag.id)}
                  className={`
                    w-full px-3 py-2 flex items-center gap-2 text-left transition-colors
                    ${selectedTagId === tag.id
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'hover:bg-bg-tertiary text-text-primary'
                    }
                  `}
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-sm flex-shrink-0"
                    style={{
                      backgroundColor: `${tag.colour}30`,
                      color: tag.colour,
                    }}
                  >
                    {tag.icon || <Hash className="w-3 h-3" />}
                  </span>
                  <span className="flex-1 text-sm truncate">{tag.name}</span>
                  <span className="text-xs text-text-tertiary">{count}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Notes Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedTag ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">Select a super tag to view notes</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-subtle bg-bg-secondary">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: `${selectedTag.colour}30`,
                    color: selectedTag.colour,
                  }}
                >
                  {selectedTag.icon || <Hash className="w-4 h-4" />}
                </span>
                <h2 className="text-lg font-semibold text-text-primary">
                  {selectedTag.name}
                </h2>
                <span className="text-sm text-text-tertiary">
                  ({sortedNotes.length} notes)
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-bg-tertiary sticky top-0">
                  <tr>
                    <SortableHeader
                      field="title"
                      label="Title"
                      currentSort={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    {selectedTag.attributes.slice(0, 4).map((attr) => (
                      <SortableHeader
                        key={attr.id}
                        field={attr.key}
                        label={attr.name}
                        currentSort={sortField}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    ))}
                    <SortableHeader
                      field="modified"
                      label="Modified"
                      currentSort={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedNotes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      tag={selectedTag}
                      onClick={() => setSelectedNoteId(note.id)}
                    />
                  ))}
                  {sortedNotes.length === 0 && (
                    <tr>
                      <td
                        colSpan={selectedTag.attributes.length + 2}
                        className="px-4 py-8 text-center text-text-tertiary"
                      >
                        No notes with this super tag
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface SortableHeaderProps {
  field: string;
  label: string;
  currentSort: string;
  direction: 'asc' | 'desc';
  onSort: (field: string) => void;
}

function SortableHeader({
  field,
  label,
  currentSort,
  direction,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSort === field;

  return (
    <th
      className="px-4 py-2 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:bg-bg-secondary"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <ArrowUpDown
            className={`w-3 h-3 ${direction === 'desc' ? 'rotate-180' : ''}`}
          />
        )}
      </div>
    </th>
  );
}

interface NoteRowProps {
  note: Note;
  tag: SuperTag;
  onClick: () => void;
}

function NoteRow({ note, tag, onClick }: NoteRowProps) {
  const attrs = note.frontmatter.tagAttributes?.[tag.id] || {};

  const formatValue = (attr: SuperTagAttribute, value: AttributeValue) => {
    if (value === null || value === undefined) {
      return <span className="text-text-tertiary">-</span>;
    }

    switch (attr.type) {
      case 'checkbox':
        return value ? '✓' : '✗';
      case 'date':
        if (typeof value === 'object' && 'date' in value) {
          return new Date(value.date).toLocaleDateString();
        }
        return String(value);
      case 'select':
        if (isSelectConfig(attr.config)) {
          const option = attr.config.options.find((o) => o.value === value);
          if (option) {
            return (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: `${option.colour || '#94a3b8'}20`,
                  color: option.colour || '#94a3b8',
                }}
              >
                {option.label}
              </span>
            );
          }
        }
        return String(value);
      case 'multiSelect':
        if (Array.isArray(value) && isSelectConfig(attr.config)) {
          const selectConfig = attr.config;
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((v) => {
                const option = selectConfig.options.find((o) => o.value === v);
                return (
                  <span
                    key={v}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: `${(option as any)?.colour || '#94a3b8'}20`,
                      color: (option as any)?.colour || '#94a3b8',
                    }}
                  >
                    {(option as any)?.label || v}
                  </span>
                );
              })}
            </div>
          );
        }
        return String(value);
      case 'rating':
        return '★'.repeat(value as number) + '☆'.repeat(5 - (value as number));
      case 'url':
        return (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline text-xs truncate block max-w-[150px]"
            onClick={(e) => e.stopPropagation()}
          >
            {value as string}
          </a>
        );
      default:
        return String(value);
    }
  };

  return (
    <tr
      className="border-b border-border-subtle hover:bg-bg-tertiary cursor-pointer"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">
            {note.frontmatter.title}
          </span>
        </div>
      </td>
      {tag.attributes.slice(0, 4).map((attr) => (
        <td key={attr.id} className="px-4 py-3 text-sm text-text-secondary">
          {formatValue(attr, attrs[attr.key])}
        </td>
      ))}
      <td className="px-4 py-3 text-sm text-text-tertiary">
        {new Date(note.frontmatter.modified).toLocaleDateString()}
      </td>
    </tr>
  );
}

export default SuperTagBrowser;
