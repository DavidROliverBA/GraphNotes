import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

export function EditorPlaceholder() {
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const { createNote } = useNoteStore();
  const { currentVault } = useSettingsStore();
  const { setSelectedNoteId } = useUIStore();

  const handleCreateNote = async () => {
    if (!currentVault || !newNoteTitle.trim()) return;

    try {
      setIsCreating(true);
      const filename = newNoteTitle.trim().replace(/[/\\?%*:|"<>]/g, '-');
      const note = await createNote(currentVault.path, filename, newNoteTitle.trim());
      setSelectedNoteId(note.filepath);
      setNewNoteTitle('');
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newNoteTitle.trim()) {
      handleCreateNote();
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-bg-primary">
      <div className="text-center max-w-sm">
        <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
        <h2 className="text-lg font-medium text-text-primary mb-2">
          No note selected
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Select a note from the sidebar or create a new one
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter note title..."
            className="input text-center"
            autoFocus
          />
          <button
            onClick={handleCreateNote}
            disabled={!newNoteTitle.trim() || isCreating}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Creating...' : 'Create Note'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
