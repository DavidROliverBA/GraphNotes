// src/components/Layout/MainLayout.tsx

import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useVaultLoader } from '../../hooks/useVaultLoader';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useDailyNote } from '../../hooks/useDailyNote';
import { useTheme } from '../../hooks/useTheme';
import Sidebar from '../Sidebar/Sidebar';
import EditorPanel from './EditorPanel';
import GraphPanel from './GraphPanel';
import VaultSelector from './VaultSelector';
import { KeyboardShortcutsModal } from '../settings/KeyboardShortcutsPanel';
import { SettingsPanel } from '../settings/SettingsPanel';

const MainLayout: React.FC = () => {
  const {
    isVaultOpen,
    isVaultSelectorOpen,
    viewMode,
    sidebarOpen,
    sidebarWidth,
    graphPanelWidth,
  } = useUIStore();

  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize theme system
  useTheme();

  // Initialize vault loader to load notes and build graph
  useVaultLoader();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize daily notes (listens for keyboard shortcut events)
  useDailyNote();

  // Listen for ? key to show shortcuts
  useEffect(() => {
    const handleQuestionMark = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        const isEditable = (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        );
        if (!isEditable) {
          setShowShortcuts(true);
        }
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleQuestionMark);
    return () => window.removeEventListener('keydown', handleQuestionMark);
  }, []);

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
            className="flex-shrink-0 h-full overflow-hidden bg-graph-bg"
            style={{ width: viewMode === 'split' ? graphPanelWidth : '100%' }}
          >
            <GraphPanel />
          </div>
        )}
      </main>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Settings panel */}
      <SettingsPanel />
    </div>
  );
};

export default MainLayout;
