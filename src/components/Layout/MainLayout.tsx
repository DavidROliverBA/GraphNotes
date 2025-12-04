// src/components/Layout/MainLayout.tsx

import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useVaultLoader } from '../../hooks/useVaultLoader';
import Sidebar from '../Sidebar/Sidebar';
import EditorPanel from './EditorPanel';
import GraphPanel from './GraphPanel';
import VaultSelector from './VaultSelector';

const MainLayout: React.FC = () => {
  const {
    isVaultOpen,
    isVaultSelectorOpen,
    viewMode,
    sidebarOpen,
    sidebarWidth,
    graphPanelWidth,
  } = useUIStore();

  // Initialize vault loader to load notes and build graph
  useVaultLoader();

  // Show vault selector if no vault is open
  if (!isVaultOpen || isVaultSelectorOpen) {
    return <VaultSelector />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-editor-bg">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside
          className="flex-shrink-0 bg-sidebar-bg border-r border-sidebar-hover"
          style={{ width: sidebarWidth }}
        >
          <Sidebar />
        </aside>
      )}

      {/* Main content area */}
      <main className="flex flex-1 min-w-0 overflow-hidden">
        {/* Editor Panel */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <EditorPanel />
          </div>
        )}

        {/* Resizer between editor and graph */}
        {viewMode === 'split' && (
          <div className="w-1 bg-sidebar-hover hover:bg-accent-primary cursor-col-resize flex-shrink-0" />
        )}

        {/* Graph Panel */}
        {(viewMode === 'graph' || viewMode === 'split') && (
          <div
            className="flex-shrink-0 overflow-hidden bg-graph-bg"
            style={{ width: viewMode === 'split' ? graphPanelWidth : '100%' }}
          >
            <GraphPanel />
          </div>
        )}
      </main>
    </div>
  );
};

export default MainLayout;
