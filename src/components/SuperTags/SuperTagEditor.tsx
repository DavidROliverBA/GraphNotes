import { useState, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  SuperTag,
  SuperTagAttribute,
  AttributeType,
  SUPER_TAG_COLOURS,
  SUPER_TAG_ICONS,
  createAttribute,
  SelectOption,
} from '../../lib/superTags/types';
import { useSuperTagStore } from '../../stores/superTagStore';

interface SuperTagEditorProps {
  tag?: SuperTag;
  onClose: () => void;
  onSave?: (tag: SuperTag) => void;
}

const ATTRIBUTE_TYPES: { type: AttributeType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'richText', label: 'Rich Text' },
  { type: 'number', label: 'Number' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'date', label: 'Date' },
  { type: 'select', label: 'Select' },
  { type: 'multiSelect', label: 'Multi-Select' },
  { type: 'url', label: 'URL' },
  { type: 'email', label: 'Email' },
  { type: 'rating', label: 'Rating' },
  { type: 'noteReference', label: 'Note Reference' },
];

export function SuperTagEditor({ tag, onClose, onSave }: SuperTagEditorProps) {
  const { createSuperTag, updateSuperTag } = useSuperTagStore();
  const isEditing = !!tag;

  const [name, setName] = useState(tag?.name || '');
  const [icon, setIcon] = useState(tag?.icon || '');
  const [colour, setColour] = useState(tag?.colour || SUPER_TAG_COLOURS[0]);
  const [description, setDescription] = useState(tag?.description || '');
  const [attributes, setAttributes] = useState<SuperTagAttribute[]>(tag?.attributes || []);
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddAttribute = useCallback(() => {
    const newAttr = createAttribute('New Attribute', 'text');
    setAttributes([...attributes, newAttr]);
    setExpandedAttr(newAttr.id);
  }, [attributes]);

  const handleUpdateAttribute = useCallback(
    (id: string, updates: Partial<SuperTagAttribute>) => {
      setAttributes(
        attributes.map((attr) => (attr.id === id ? { ...attr, ...updates } : attr))
      );
    },
    [attributes]
  );

  const handleRemoveAttribute = useCallback(
    (id: string) => {
      setAttributes(attributes.filter((attr) => attr.id !== id));
    },
    [attributes]
  );

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const tagData: SuperTag = {
        id: tag?.id || name.toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        icon: icon || undefined,
        colour,
        description: description || undefined,
        attributes,
        created: tag?.created || now,
        modified: now,
      };

      if (isEditing && tag) {
        await updateSuperTag(tag.id, tagData);
      } else {
        await createSuperTag(tagData);
      }

      onSave?.(tagData);
      onClose();
    } catch (err) {
      console.error('Failed to save super tag:', err);
    } finally {
      setIsSaving(false);
    }
  }, [name, icon, colour, description, attributes, tag, isEditing, createSuperTag, updateSuperTag, onSave, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg-primary rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEditing ? 'Edit Super Tag' : 'Create Super Tag'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            {/* Name & Icon */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Project, Person, Book"
                  className="w-full px-3 py-2 bg-bg-tertiary border border-transparent rounded-md focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Icon
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-12 h-10 flex items-center justify-center bg-bg-tertiary rounded-md text-xl hover:bg-bg-secondary"
                  >
                    {icon || '🏷️'}
                  </button>
                  <div className="absolute top-full left-0 mt-1 p-2 bg-bg-elevated border border-border-subtle rounded-md shadow-lg hidden group-focus-within:block z-10">
                    {/* Icon picker would go here */}
                  </div>
                </div>
              </div>
            </div>

            {/* Icon Picker (inline) */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Choose Icon
              </label>
              <div className="flex flex-wrap gap-1">
                {SUPER_TAG_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded text-lg hover:bg-bg-tertiary
                      ${icon === emoji ? 'bg-accent-primary/20 ring-2 ring-accent-primary' : ''}
                    `}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Colour */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Colour
              </label>
              <div className="flex gap-2">
                {SUPER_TAG_COLOURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColour(c)}
                    className={`
                      w-8 h-8 rounded-full transition-transform hover:scale-110
                      ${colour === c ? 'ring-2 ring-offset-2 ring-offset-bg-primary ring-accent-primary' : ''}
                    `}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 bg-bg-tertiary border border-transparent rounded-md focus:outline-none focus:border-accent-primary resize-none"
              />
            </div>
          </div>

          {/* Attributes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-secondary">
                Attributes
              </label>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="flex items-center gap-1 px-2 py-1 text-sm text-accent-primary hover:bg-accent-primary/10 rounded"
              >
                <Plus className="w-4 h-4" />
                Add Attribute
              </button>
            </div>

            <div className="space-y-2">
              {attributes.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  <p className="text-sm">No attributes yet</p>
                  <p className="text-xs mt-1">
                    Add attributes to define the structure of this super tag
                  </p>
                </div>
              ) : (
                attributes.map((attr) => (
                  <AttributeEditor
                    key={attr.id}
                    attribute={attr}
                    isExpanded={expandedAttr === attr.id}
                    onToggle={() => setExpandedAttr(expandedAttr === attr.id ? null : attr.id)}
                    onUpdate={(updates) => handleUpdateAttribute(attr.id, updates)}
                    onRemove={() => handleRemoveAttribute(attr.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-bg-secondary">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 text-sm bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Super Tag'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AttributeEditorProps {
  attribute: SuperTagAttribute;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<SuperTagAttribute>) => void;
  onRemove: () => void;
}

function AttributeEditor({
  attribute,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
}: AttributeEditorProps) {
  const [options, setOptions] = useState<SelectOption[]>(
    (attribute.config as any)?.options || []
  );

  const handleAddOption = () => {
    const newOptions = [...options, { value: `option-${options.length + 1}`, label: `Option ${options.length + 1}` }];
    setOptions(newOptions);
    onUpdate({ config: { options: newOptions } });
  };

  const handleUpdateOption = (index: number, updates: Partial<SelectOption>) => {
    const newOptions = options.map((opt, i) => (i === index ? { ...opt, ...updates } : opt));
    setOptions(newOptions);
    onUpdate({ config: { options: newOptions } });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate({ config: { options: newOptions } });
  };

  const showOptions = attribute.type === 'select' || attribute.type === 'multiSelect';

  return (
    <div className="border border-border-subtle rounded-md overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary cursor-pointer hover:bg-bg-secondary"
        onClick={onToggle}
      >
        <GripVertical className="w-4 h-4 text-text-tertiary" />
        <span className="flex-1 text-sm font-medium text-text-primary">
          {attribute.name}
        </span>
        <span className="text-xs text-text-tertiary px-2 py-0.5 bg-bg-secondary rounded">
          {attribute.type}
        </span>
        {attribute.required && (
          <span className="text-xs text-error">Required</span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-text-tertiary hover:text-error rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3 border-t border-border-subtle">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Name</label>
              <input
                type="text"
                value={attribute.name}
                onChange={(e) => onUpdate({ name: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="w-full px-2 py-1.5 text-sm bg-bg-primary border border-border-subtle rounded focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Type</label>
              <select
                value={attribute.type}
                onChange={(e) => onUpdate({ type: e.target.value as AttributeType })}
                className="w-full px-2 py-1.5 text-sm bg-bg-primary border border-border-subtle rounded focus:outline-none focus:border-accent-primary"
              >
                {ATTRIBUTE_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Required */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${attribute.id}`}
              checked={attribute.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4 rounded border-border-subtle"
            />
            <label htmlFor={`required-${attribute.id}`} className="text-sm text-text-secondary">
              Required
            </label>
          </div>

          {/* Select/MultiSelect Options */}
          {showOptions && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-text-tertiary">Options</label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-accent-primary hover:underline"
                >
                  + Add Option
                </button>
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={option.colour || '#94a3b8'}
                      onChange={(e) => handleUpdateOption(index, { colour: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) =>
                        handleUpdateOption(index, {
                          label: e.target.value,
                          value: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                        })
                      }
                      placeholder="Option label"
                      className="flex-1 px-2 py-1 text-sm bg-bg-primary border border-border-subtle rounded focus:outline-none focus:border-accent-primary"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-1 text-text-tertiary hover:text-error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Config */}
          {attribute.type === 'date' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`time-${attribute.id}`}
                checked={(attribute.config as any)?.includeTime || false}
                onChange={(e) => onUpdate({ config: { includeTime: e.target.checked } })}
                className="w-4 h-4 rounded border-border-subtle"
              />
              <label htmlFor={`time-${attribute.id}`} className="text-sm text-text-secondary">
                Include time
              </label>
            </div>
          )}

          {/* Number Config */}
          {attribute.type === 'number' && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Min</label>
                <input
                  type="number"
                  value={(attribute.config as any)?.min ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      config: {
                        ...(attribute.config as any),
                        min: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm bg-bg-primary border border-border-subtle rounded focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Max</label>
                <input
                  type="number"
                  value={(attribute.config as any)?.max ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      config: {
                        ...(attribute.config as any),
                        max: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm bg-bg-primary border border-border-subtle rounded focus:outline-none focus:border-accent-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Step</label>
                <input
                  type="number"
                  value={(attribute.config as any)?.step ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      config: {
                        ...(attribute.config as any),
                        step: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                  className="w-full px-2 py-1 text-sm bg-bg-primary border border-border-subtle rounded focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SuperTagEditor;
