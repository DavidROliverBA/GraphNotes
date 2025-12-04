// src/components/LinkPanel/LinkPanel.tsx

import React, { useState, useMemo } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { useGraph } from '../../hooks/useGraph';
import { GraphEdge, GraphNode, DEFAULT_RELATIONSHIP_TYPES } from '../../lib/graph/types';
import LinkEditor from './LinkEditor';

interface LinkItemProps {
  edge: GraphEdge;
  linkedNode: GraphNode | undefined;
  isOutlink: boolean;
  onEdit: (edge: GraphEdge) => void;
  onDelete: (edgeId: string) => void;
  onNavigate: (noteId: string) => void;
}

const LinkItem: React.FC<LinkItemProps> = ({
  edge,
  linkedNode,
  isOutlink,
  onEdit,
  onDelete,
  onNavigate,
}) => {
  const relType = DEFAULT_RELATIONSHIP_TYPES.find(
    (rt) => rt.name.toLowerCase() === edge.name.toLowerCase()
  );

  const relationshipLabel = isOutlink
    ? edge.name
    : (relType?.inverseLabel || `linked from`);

  return (
    <div className="group flex items-start gap-2 p-2 rounded hover:bg-sidebar-hover">
      <button
        onClick={() => linkedNode && onNavigate(linkedNode.id)}
        className="flex-1 text-left"
        disabled={!linkedNode}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: edge.style?.colour || '#6c7086' }}
          />
          <span className="text-sm text-editor-text truncate">
            {linkedNode?.label || 'Unknown'}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 ml-4">
          <span className="text-xs text-gray-500">{relationshipLabel}</span>
          {edge.description && (
            <span className="text-xs text-gray-600 truncate">
              - {edge.description}
            </span>
          )}
        </div>
      </button>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(edge)}
          className="p-1 text-gray-400 hover:text-editor-text rounded hover:bg-sidebar-active"
          title="Edit link"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(edge.id)}
          className="p-1 text-gray-400 hover:text-accent-error rounded hover:bg-sidebar-active"
          title="Delete link"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const LinkPanel: React.FC = () => {
  const { selectedNoteId, setSelectedNoteId } = useUIStore();
  const { notes } = useNoteStore();
  const { getLinksForNote, nodes, removeLink, addLink, updateLink } = useGraph();

  const [activeTab, setActiveTab] = useState<'outlinks' | 'backlinks'>('outlinks');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<GraphEdge | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.get(selectedNoteId);
  }, [selectedNoteId, notes]);

  const links = useMemo(() => {
    if (!selectedNoteId) return { outlinks: [], backlinks: [] };
    return getLinksForNote(selectedNoteId);
  }, [selectedNoteId, getLinksForNote]);

  const handleNavigate = (noteId: string) => {
    setSelectedNoteId(noteId);
  };

  const handleEdit = (edge: GraphEdge) => {
    setEditingEdge(edge);
    setIsAddingNew(false);
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingEdge(null);
    setIsAddingNew(true);
    setIsEditorOpen(true);
  };

  const handleDelete = (edgeId: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      removeLink(edgeId);
      // Trigger frontmatter update event
      if (selectedNoteId) {
        window.dispatchEvent(
          new CustomEvent('update-note-links', { detail: { noteId: selectedNoteId } })
        );
      }
    }
  };

  const handleSaveLink = (targetId: string, name: string, description?: string) => {
    if (!selectedNoteId) return;

    if (editingEdge) {
      // Update existing link
      updateLink(editingEdge.id, { name, description });
    } else if (isAddingNew) {
      // Add new link
      addLink(selectedNoteId, targetId, name, description);
    }

    setIsEditorOpen(false);
    setEditingEdge(null);
    setIsAddingNew(false);

    // Trigger frontmatter update event
    window.dispatchEvent(
      new CustomEvent('update-note-links', { detail: { noteId: selectedNoteId } })
    );
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingEdge(null);
    setIsAddingNew(false);
  };

  if (!selectedNote) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm p-4">
        <p>Select a note to view its links</p>
      </div>
    );
  }

  const currentLinks = activeTab === 'outlinks' ? links.outlinks : links.backlinks;

  return (
    <div className="h-full flex flex-col bg-sidebar-bg">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-sidebar-hover">
        <h2 className="text-sm font-semibold text-editor-text truncate">
          Links
        </h2>
        <p className="text-xs text-gray-500 truncate mt-1">
          {selectedNote.frontmatter.title}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-sidebar-hover">
        <button
          onClick={() => setActiveTab('outlinks')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'outlinks'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-gray-400 hover:text-editor-text'
          }`}
        >
          Outlinks ({links.outlinks.length})
        </button>
        <button
          onClick={() => setActiveTab('backlinks')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'backlinks'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-gray-400 hover:text-editor-text'
          }`}
        >
          Backlinks ({links.backlinks.length})
        </button>
      </div>

      {/* Links list */}
      <div className="flex-1 overflow-auto p-2">
        {currentLinks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {activeTab === 'outlinks'
              ? 'No outgoing links'
              : 'No incoming links'}
          </div>
        ) : (
          <div className="space-y-1">
            {currentLinks.map((edge) => {
              const linkedNodeId =
                activeTab === 'outlinks' ? edge.target : edge.source;
              const linkedNode = nodes.get(linkedNodeId);

              return (
                <LinkItem
                  key={edge.id}
                  edge={edge}
                  linkedNode={linkedNode}
                  isOutlink={activeTab === 'outlinks'}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onNavigate={handleNavigate}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Add link button (only for outlinks) */}
      {activeTab === 'outlinks' && (
        <div className="flex-shrink-0 p-4 border-t border-sidebar-hover">
          <button
            onClick={handleAddNew}
            className="w-full py-2 px-4 text-sm bg-accent-primary text-sidebar-bg rounded hover:bg-accent-primary/90 transition-colors"
          >
            + Add Link
          </button>
        </div>
      )}

      {/* Link Editor Modal */}
      {isEditorOpen && (
        <LinkEditor
          sourceNoteId={selectedNoteId!}
          existingEdge={editingEdge}
          onSave={handleSaveLink}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
};

export default LinkPanel;
