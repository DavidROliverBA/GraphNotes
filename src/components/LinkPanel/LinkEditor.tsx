// src/components/LinkPanel/LinkEditor.tsx

import React, { useState, useMemo } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { GraphEdge, DEFAULT_RELATIONSHIP_TYPES } from '../../lib/graph/types';

interface LinkEditorProps {
  sourceNoteId: string;
  existingEdge: GraphEdge | null;
  onSave: (targetId: string, name: string, description?: string) => void;
  onClose: () => void;
}

const LinkEditor: React.FC<LinkEditorProps> = ({
  sourceNoteId,
  existingEdge,
  onSave,
  onClose,
}) => {
  const { notes } = useNoteStore();

  const [targetNoteId, setTargetNoteId] = useState(existingEdge?.target || '');
  const [relationshipName, setRelationshipName] = useState(
    existingEdge?.name || DEFAULT_RELATIONSHIP_TYPES[0].name
  );
  const [description, setDescription] = useState(existingEdge?.description || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get available notes (excluding the source note)
  const availableNotes = useMemo(() => {
    return Array.from(notes.values())
      .filter((note) => note.id !== sourceNoteId)
      .sort((a, b) => a.frontmatter.title.localeCompare(b.frontmatter.title));
  }, [notes, sourceNoteId]);

  // Filter notes based on search term
  const filteredNotes = useMemo(() => {
    if (!searchTerm) return availableNotes;
    const term = searchTerm.toLowerCase();
    return availableNotes.filter(
      (note) =>
        note.frontmatter.title.toLowerCase().includes(term) ||
        note.filepath.toLowerCase().includes(term)
    );
  }, [availableNotes, searchTerm]);

  // Get selected note details
  const selectedNote = useMemo(() => {
    if (!targetNoteId) return null;
    return notes.get(targetNoteId);
  }, [targetNoteId, notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetNoteId || !relationshipName) {
      return;
    }

    onSave(targetNoteId, relationshipName, description || undefined);
  };

  const handleSelectNote = (noteId: string) => {
    setTargetNoteId(noteId);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const isEditing = !!existingEdge;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-sidebar-bg rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sidebar-hover">
          <h3 className="text-lg font-semibold text-editor-text">
            {isEditing ? 'Edit Link' : 'Add New Link'}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Note Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Note
            </label>
            {isEditing ? (
              // Show read-only target for editing
              <div className="w-full px-3 py-2 bg-sidebar-hover text-gray-300 rounded border border-sidebar-hover text-sm">
                {selectedNote?.frontmatter.title || 'Unknown'}
              </div>
            ) : (
              // Show searchable dropdown for new links
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm || selectedNote?.frontmatter.title || ''}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (e.target.value === '') {
                      setTargetNoteId('');
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search for a note..."
                  className="w-full px-3 py-2 bg-editor-bg text-editor-text rounded border border-sidebar-hover focus:border-accent-primary focus:outline-none text-sm"
                />
                {isDropdownOpen && filteredNotes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-editor-bg border border-sidebar-hover rounded-lg shadow-lg max-h-48 overflow-auto">
                    {filteredNotes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => handleSelectNote(note.id)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-sidebar-hover transition-colors ${
                          targetNoteId === note.id
                            ? 'bg-sidebar-active text-accent-primary'
                            : 'text-editor-text'
                        }`}
                      >
                        <div className="font-medium truncate">
                          {note.frontmatter.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {note.filepath}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Relationship Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relationship Type
            </label>
            <select
              value={relationshipName}
              onChange={(e) => setRelationshipName(e.target.value)}
              className="w-full px-3 py-2 bg-editor-bg text-editor-text rounded border border-sidebar-hover focus:border-accent-primary focus:outline-none text-sm"
            >
              {DEFAULT_RELATIONSHIP_TYPES.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            {/* Color indicator */}
            <div className="flex items-center gap-2 mt-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    DEFAULT_RELATIONSHIP_TYPES.find(
                      (t) => t.name === relationshipName
                    )?.colour || '#6c7086',
                }}
              />
              <span className="text-xs text-gray-500">
                Inverse:{' '}
                {DEFAULT_RELATIONSHIP_TYPES.find((t) => t.name === relationshipName)
                  ?.inverseLabel || 'linked from'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context about this relationship..."
              rows={2}
              className="w-full px-3 py-2 bg-editor-bg text-editor-text rounded border border-sidebar-hover focus:border-accent-primary focus:outline-none text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 text-sm text-gray-300 bg-sidebar-hover rounded hover:bg-sidebar-active transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!targetNoteId || !relationshipName}
              className="flex-1 py-2 px-4 text-sm bg-accent-primary text-sidebar-bg rounded hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Update Link' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default LinkEditor;
