import { useState } from 'react';
import { X, Trash2, Palette, Save } from 'lucide-react';
import { GraphEdge, EdgeAppearance, RelationshipPreset } from '../../lib/graph/types';
import { useGraph } from '../../hooks/useGraph';

interface LinkEditorProps {
  edge: GraphEdge;
  onClose: () => void;
  onSave: (edgeId: string, updates: Partial<GraphEdge>) => void;
  onDelete: (edgeId: string) => void;
}

export function LinkEditor({ edge, onClose, onSave, onDelete }: LinkEditorProps) {
  const { relationshipPresets } = useGraph();
  const [name, setName] = useState(edge.name);
  const [description, setDescription] = useState(edge.description || '');
  const [appearance, setAppearance] = useState<EdgeAppearance>(edge.appearance);
  const [showPresets, setShowPresets] = useState(false);

  const handleSave = () => {
    onSave(edge.id, {
      name,
      description: description || undefined,
      appearance,
    });
    onClose();
  };

  const handleApplyPreset = (preset: RelationshipPreset) => {
    setName(preset.name);
    setAppearance(preset.appearance);
    setShowPresets(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this link?')) {
      onDelete(edge.id);
      onClose();
    }
  };

  const colorOptions = [
    { label: 'Primary', value: '#6366f1' },
    { label: 'Success', value: '#22c55e' },
    { label: 'Warning', value: '#f59e0b' },
    { label: 'Error', value: '#ef4444' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Purple', value: '#a855f7' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Gray', value: '#6b7280' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-elevated rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <h3 className="text-lg font-semibold text-text-primary">Edit Link</h3>
          <button
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Relationship name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Relationship Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., supports, contradicts, extends"
              className="input w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this link..."
              rows={2}
              className="input w-full resize-none"
            />
          </div>

          {/* Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">
                Apply Preset
              </label>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs text-accent-primary hover:underline"
              >
                {showPresets ? 'Hide' : 'Show'} presets
              </button>
            </div>
            {showPresets && (
              <div className="grid grid-cols-2 gap-2">
                {relationshipPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-2 text-left text-sm rounded border border-border-subtle hover:bg-bg-tertiary transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: preset.appearance.colour }}
                    />
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Appearance settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Palette className="w-4 h-4" />
              <span>Appearance</span>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      setAppearance((a) => ({ ...a, colour: color.value }))
                    }
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      appearance.colour === color.value
                        ? 'border-text-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Direction</label>
              <div className="flex gap-2">
                {(['forward', 'backward', 'bidirectional', 'none'] as const).map(
                  (dir) => (
                    <button
                      key={dir}
                      onClick={() =>
                        setAppearance((a) => ({ ...a, direction: dir }))
                      }
                      className={`px-3 py-1 text-xs rounded border transition-colors ${
                        appearance.direction === dir
                          ? 'bg-accent-primary text-white border-accent-primary'
                          : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary'
                      }`}
                    >
                      {dir === 'bidirectional' ? 'Both' : dir.charAt(0).toUpperCase() + dir.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Style</label>
              <div className="flex gap-2">
                {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setAppearance((a) => ({ ...a, style }))}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      appearance.style === style
                        ? 'bg-accent-primary text-white border-accent-primary'
                        : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Thickness */}
            <div>
              <label className="block text-xs text-text-tertiary mb-1">Thickness</label>
              <div className="flex gap-2">
                {(['thin', 'normal', 'thick'] as const).map((thickness) => (
                  <button
                    key={thickness}
                    onClick={() => setAppearance((a) => ({ ...a, thickness }))}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      appearance.thickness === thickness
                        ? 'bg-accent-primary text-white border-accent-primary'
                        : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary'
                    }`}
                  >
                    {thickness.charAt(0).toUpperCase() + thickness.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Animated */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="animated"
                checked={appearance.animated || false}
                onChange={(e) =>
                  setAppearance((a) => ({ ...a, animated: e.target.checked }))
                }
                className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
              />
              <label
                htmlFor="animated"
                className="text-sm text-text-secondary cursor-pointer"
              >
                Animated flow effect
              </label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-xs text-text-tertiary mb-2">Preview</label>
            <div className="flex items-center justify-center p-4 bg-bg-tertiary rounded">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center text-xs text-text-tertiary">
                  Source
                </div>
                <div className="relative w-24 h-8 flex items-center justify-center">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <line
                      x1="0"
                      y1="50%"
                      x2="100%"
                      y2="50%"
                      stroke={appearance.colour}
                      strokeWidth={
                        appearance.thickness === 'thin'
                          ? 1
                          : appearance.thickness === 'thick'
                          ? 4
                          : 2
                      }
                      strokeDasharray={
                        appearance.style === 'dashed'
                          ? '8,4'
                          : appearance.style === 'dotted'
                          ? '2,2'
                          : 'none'
                      }
                    />
                    {(appearance.direction === 'forward' ||
                      appearance.direction === 'bidirectional') && (
                      <polygon
                        points="90,8 100,16 90,24"
                        fill={appearance.colour}
                      />
                    )}
                    {(appearance.direction === 'backward' ||
                      appearance.direction === 'bidirectional') && (
                      <polygon
                        points="10,8 0,16 10,24"
                        fill={appearance.colour}
                      />
                    )}
                  </svg>
                </div>
                <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center text-xs text-text-tertiary">
                  Target
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm text-accent-error hover:bg-accent-error/10 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LinkEditor;
