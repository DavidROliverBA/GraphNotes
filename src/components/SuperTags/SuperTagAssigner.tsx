import { useState, useCallback, useMemo } from 'react';
import { Hash, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useSuperTagList } from '../../stores/superTagStore';
import { SuperTag } from '../../lib/superTags/types';
import { Note, AttributeValue } from '../../lib/notes/types';
import { AttributeInput } from './AttributeInput';

interface SuperTagAssignerProps {
  note: Note;
  onUpdate: (updates: Partial<Note['frontmatter']>) => void;
}

export function SuperTagAssigner({ note, onUpdate }: SuperTagAssignerProps) {
  const superTagList = useSuperTagList();
  const [showPicker, setShowPicker] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const assignedTags = useMemo(() => {
    const tagIds = note.frontmatter.superTags || [];
    return tagIds
      .map((id) => superTagList.find((t) => t.id === id))
      .filter((t): t is SuperTag => t !== undefined);
  }, [note.frontmatter.superTags, superTagList]);

  const availableTags = useMemo(() => {
    const assignedIds = new Set(note.frontmatter.superTags || []);
    return superTagList.filter((t) => !assignedIds.has(t.id));
  }, [note.frontmatter.superTags, superTagList]);

  const handleAssignTag = useCallback(
    (tagId: string) => {
      const currentTags = note.frontmatter.superTags || [];
      onUpdate({
        superTags: [...currentTags, tagId],
      });
      setShowPicker(false);
      setExpandedTags((prev) => new Set([...prev, tagId]));
    },
    [note.frontmatter.superTags, onUpdate]
  );

  const handleUnassignTag = useCallback(
    (tagId: string) => {
      const currentTags = note.frontmatter.superTags || [];
      const currentAttributes = note.frontmatter.tagAttributes || {};

      // Remove tag and its attributes
      const { [tagId]: _, ...remainingAttributes } = currentAttributes;

      onUpdate({
        superTags: currentTags.filter((id) => id !== tagId),
        tagAttributes: remainingAttributes,
      });
    },
    [note.frontmatter.superTags, note.frontmatter.tagAttributes, onUpdate]
  );

  const handleAttributeChange = useCallback(
    (tagId: string, attributeKey: string, value: AttributeValue) => {
      const currentAttributes = note.frontmatter.tagAttributes || {};
      const tagAttributes = currentAttributes[tagId] || {};

      onUpdate({
        tagAttributes: {
          ...currentAttributes,
          [tagId]: {
            ...tagAttributes,
            [attributeKey]: value,
          },
        },
      });
    },
    [note.frontmatter.tagAttributes, onUpdate]
  );

  const toggleTagExpanded = useCallback((tagId: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Super Tags</h3>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-accent-primary hover:bg-accent-primary/10 rounded"
        >
          <Plus className="w-3 h-3" />
          Add Tag
        </button>
      </div>

      {/* Tag Picker */}
      {showPicker && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 bg-bg-elevated border border-border-subtle rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableTags.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-tertiary">
                No more tags available
              </div>
            ) : (
              availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAssignTag(tag.id)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-bg-tertiary"
                >
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${tag.colour}20`, color: tag.colour }}
                  >
                    {tag.icon || <Hash className="w-3 h-3" />}
                  </span>
                  <span className="text-sm text-text-primary">{tag.name}</span>
                  {tag.description && (
                    <span className="text-xs text-text-tertiary truncate">
                      {tag.description}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowPicker(false)}
          />
        </div>
      )}

      {/* Assigned Tags */}
      {assignedTags.length === 0 ? (
        <div className="text-sm text-text-tertiary py-4 text-center">
          No super tags assigned
        </div>
      ) : (
        <div className="space-y-2">
          {assignedTags.map((tag) => (
            <AssignedTag
              key={tag.id}
              tag={tag}
              note={note}
              isExpanded={expandedTags.has(tag.id)}
              onToggle={() => toggleTagExpanded(tag.id)}
              onUnassign={() => handleUnassignTag(tag.id)}
              onAttributeChange={(key, value) =>
                handleAttributeChange(tag.id, key, value)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AssignedTagProps {
  tag: SuperTag;
  note: Note;
  isExpanded: boolean;
  onToggle: () => void;
  onUnassign: () => void;
  onAttributeChange: (key: string, value: AttributeValue) => void;
}

function AssignedTag({
  tag,
  note,
  isExpanded,
  onToggle,
  onUnassign,
  onAttributeChange,
}: AssignedTagProps) {
  const tagAttributes = note.frontmatter.tagAttributes?.[tag.id] || {};

  return (
    <div className="border border-border-subtle rounded-md overflow-hidden">
      {/* Tag Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-tertiary"
        style={{ backgroundColor: `${tag.colour}10` }}
        onClick={onToggle}
      >
        <span
          className="w-5 h-5 rounded flex items-center justify-center text-sm"
          style={{ backgroundColor: `${tag.colour}30`, color: tag.colour }}
        >
          {tag.icon || <Hash className="w-3 h-3" />}
        </span>
        <span className="flex-1 text-sm font-medium text-text-primary">
          {tag.name}
        </span>
        {tag.attributes.length > 0 && (
          <span className="text-xs text-text-tertiary">
            {tag.attributes.length} fields
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnassign();
          }}
          className="p-1 text-text-tertiary hover:text-error rounded"
        >
          <X className="w-4 h-4" />
        </button>
        {tag.attributes.length > 0 &&
          (isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          ))}
      </div>

      {/* Attributes */}
      {isExpanded && tag.attributes.length > 0 && (
        <div className="p-3 space-y-3 border-t border-border-subtle bg-bg-primary">
          {tag.attributes.map((attr) => (
            <div key={attr.id}>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {attr.name}
                {attr.required && <span className="text-error ml-1">*</span>}
              </label>
              <AttributeInput
                attribute={attr}
                value={tagAttributes[attr.key] ?? attr.defaultValue ?? null}
                onChange={(value) => onAttributeChange(attr.key, value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuperTagAssigner;
