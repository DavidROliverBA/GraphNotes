// src/components/Sidebar/Sidebar.tsx

import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useNotes } from '../../hooks/useNotes';
import FileTree from './FileTree';
import SearchPanel from './SearchPanel';
import { SyncStatusPanel } from '../sync/SyncStatusPanel';

const Sidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    setSidebarOpen,
    vaultPath,
    setIsVaultSelectorOpen,
    setSelectedNoteId,
    viewMode,
    setViewMode,
  } = useUIStore();

  const { createNote } = useNotes();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-sidebar-hover">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-editor-text truncate">
            GraphNotes
          </h1>
          <div className="flex gap-1">
            <button
              onClick={() => {
                // Toggle graph panel: editor <-> split
                if (viewMode === 'editor') {
                  setViewMode('split');
                } else if (viewMode === 'split') {
                  setViewMode('editor');
                } else {
                  // If in 'graph' mode, go to 'split'
                  setViewMode('split');
                }
              }}
              className={`p-1 rounded hover:bg-sidebar-hover transition-colors ${
                viewMode !== 'editor' ? 'text-accent-primary' : 'text-gray-400 hover:text-editor-text'
              }`}
              title={viewMode === 'editor' ? 'Show graph panel' : 'Hide graph panel'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            <button
              onClick={() => setIsVaultSelectorOpen(true)}
              className="p-1 text-gray-400 hover:text-editor-text rounded hover:bg-sidebar-hover"
              title="Change vault"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-editor-text rounded hover:bg-sidebar-hover"
              title="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        {vaultPath && (
          <p className="text-xs text-gray-500 mt-1 truncate" title={vaultPath}>
            {vaultPath.split('/').pop()}
          </p>
        )}
      </header>

      {/* Tab navigation */}
      <nav className="flex-shrink-0 flex border-b border-sidebar-hover">
        <button
          onClick={() => setSidebarTab('files')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            sidebarTab === 'files'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-gray-400 hover:text-editor-text'
          }`}
        >
          Files
        </button>
        <button
          onClick={() => setSidebarTab('search')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            sidebarTab === 'search'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-gray-400 hover:text-editor-text'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => setSidebarTab('sync')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            sidebarTab === 'sync'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-gray-400 hover:text-editor-text'
          }`}
        >
          Sync
        </button>
      </nav>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {sidebarTab === 'files' && <FileTree />}
        {sidebarTab === 'search' && <SearchPanel />}
        {sidebarTab === 'sync' && <SyncStatusPanel />}
      </div>

      {/* Sidebar footer */}
      <footer className="flex-shrink-0 px-4 py-2 border-t border-sidebar-hover">
        <button
          onClick={async () => {
            console.log('New Note clicked, vaultPath:', vaultPath, 'isCreating:', isCreating);

            if (isCreating) {
              console.log('Already creating, skipping');
              return;
            }

            if (!vaultPath) {
              console.log('No vault path set');
              alert('Please select a vault folder first');
              return;
            }

            setIsCreating(true);
            try {
              // Generate a unique filename with timestamp
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
              const filename = `Untitled-${timestamp}.md`;
              console.log('Creating note:', filename);

              const note = await createNote(filename);
              console.log('Note created:', note);

              if (note) {
                setSelectedNoteId(note.id);
                // Trigger a refresh of the file tree
                window.dispatchEvent(new CustomEvent('refresh-file-tree'));
              }
            } catch (error) {
              console.error('Failed to create note:', error);
              alert('Failed to create note: ' + (error instanceof Error ? error.message : String(error)));
            } finally {
              setIsCreating(false);
            }
          }}
          disabled={isCreating || !vaultPath}
          className="w-full py-2 px-4 text-sm bg-accent-primary text-sidebar-bg rounded hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : '+ New Note'}
        </button>
      </footer>
    </div>
  );
};

export default Sidebar;
