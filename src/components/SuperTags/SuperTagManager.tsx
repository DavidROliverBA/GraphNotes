import { useState } from 'react';
import { Plus, Edit2, Trash2, Hash, AlertTriangle } from 'lucide-react';
import { useSuperTagStore, useSuperTagList } from '../../stores/superTagStore';
import { useNoteStore } from '../../stores/noteStore';
import { SuperTag } from '../../lib/superTags/types';
import { SuperTagEditor } from './SuperTagEditor';

interface SuperTagManagerProps {
  className?: string;
}

export function SuperTagManager({ className = '' }: SuperTagManagerProps) {
  const superTagList = useSuperTagList();
  const { deleteSuperTag } = useSuperTagStore();
  const { notes } = useNoteStore();

  const [editingTag, setEditingTag] = useState<SuperTag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getUsageCount = (tagId: string) => {
    return Array.from(notes.values()).filter((note) =>
      note.frontmatter.superTags?.includes(tagId)
    ).length;
  };

  const handleDelete = async (tagId: string) => {
    try {
      await deleteSuperTag(tagId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete super tag:', err);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-lg font-semibold text-text-primary">Super Tags</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-accent-primary text-white rounded-md hover:bg-accent-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Tag
        </button>
      </div>

      {/* Tag List */}
      <div className="flex-1 overflow-y-auto">
        {superTagList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Hash className="w-12 h-12 text-text-tertiary mb-3" />
            <h3 className="text-text-primary font-medium mb-1">No Super Tags</h3>
            <p className="text-sm text-text-tertiary mb-4">
              Create super tags to add structure to your notes
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-accent-primary text-white rounded-md hover:bg-accent-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create Your First Tag
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {superTagList.map((tag) => {
              const usageCount = getUsageCount(tag.id);
              const isDeleting = deleteConfirm === tag.id;

              return (
                <div key={tag.id} className="p-4 hover:bg-bg-tertiary transition-colors">
                  {isDeleting ? (
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary">
                          Delete "{tag.name}"?
                        </p>
                        {usageCount > 0 && (
                          <p className="text-xs text-text-tertiary">
                            Used by {usageCount} note{usageCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 text-sm text-text-secondary hover:bg-bg-secondary rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="px-3 py-1 text-sm bg-error text-white rounded hover:bg-error/90"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{
                          backgroundColor: `${tag.colour}20`,
                          color: tag.colour,
                        }}
                      >
                        {tag.icon || <Hash className="w-5 h-5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-text-primary font-medium">
                            {tag.name}
                          </h3>
                          <span className="text-xs text-text-tertiary px-1.5 py-0.5 bg-bg-tertiary rounded">
                            {tag.attributes.length} fields
                          </span>
                        </div>
                        {tag.description && (
                          <p className="text-sm text-text-tertiary mt-0.5 truncate">
                            {tag.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                          <span>{usageCount} notes</span>
                          <span>
                            Created {new Date(tag.created).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(tag.id)}
                          className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {(isCreating || editingTag) && (
        <SuperTagEditor
          tag={editingTag || undefined}
          onClose={() => {
            setIsCreating(false);
            setEditingTag(null);
          }}
        />
      )}
    </div>
  );
}

export default SuperTagManager;
