import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';

export function DeleteConfirmDialog() {
  const { showDeleteConfirmation, setShowDeleteConfirmation } = useUIStore();
  const { currentNote, deleteNote } = useNoteStore();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDeleteConfirmation) {
      dialogRef.current?.focus();
    }
  }, [showDeleteConfirmation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDeleteConfirmation) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDeleteConfirmation(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirmation, currentNote]);

  const handleDelete = async () => {
    if (currentNote) {
      await deleteNote(currentNote.filepath);
      setShowDeleteConfirmation(false);
    }
  };

  const handleClose = () => {
    setShowDeleteConfirmation(false);
  };

  if (!showDeleteConfirmation || !currentNote) return null;

  const noteTitle = currentNote.frontmatter.title || currentNote.filepath.split('/').pop()?.replace('.md', '') || 'Untitled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-bg-primary border border-border-default rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-accent-warning">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-text-primary">Delete Note</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          <p className="text-text-primary mb-2">
            Are you sure you want to delete <span className="font-semibold">"{noteTitle}"</span>?
          </p>
          <p className="text-sm text-text-secondary">
            This action cannot be undone. The note will be permanently removed from your vault.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle bg-bg-secondary">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-error hover:bg-accent-error/90 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
