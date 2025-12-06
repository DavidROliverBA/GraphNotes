import { useEffect } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import { useNoteStore } from './stores/noteStore';
import { useUIStore } from './stores/uiStore';
import { useSuperTagStore } from './stores/superTagStore';
import { MainLayout } from './components/Layout/MainLayout';
import { VaultSelector } from './components/Layout/VaultSelector';
import { Editor } from './components/Editor/Editor';
import { EditorPlaceholder } from './components/Editor/EditorPlaceholder';
import { GraphPanel } from './components/Layout/GraphPanel';
import { QuickSearch } from './components/Search';
import { SettingsPanel } from './components/Settings';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { DeleteConfirmDialog } from './components/dialogs/DeleteConfirmDialog';
import { ContextMenu } from './components/common/ContextMenu';
import { FindInNote } from './components/Editor/FindInNote';
import { BacklinksPanel } from './components/LinkPanel/BacklinksPanel';
import { PropertiesPanel } from './components/Editor/PropertiesPanel';

function App() {
  const { currentVault } = useSettingsStore();
  const { currentNote, loadNote, loadNotesFromVault } = useNoteStore();
  const { selectedNoteId, viewMode } = useUIStore();
  const { loadSuperTags } = useSuperTagStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Load notes and super tags when vault changes
  useEffect(() => {
    if (currentVault) {
      loadNotesFromVault(currentVault.path);
      loadSuperTags(currentVault.path);
    }
  }, [currentVault, loadNotesFromVault, loadSuperTags]);

  // Load note when selection changes
  useEffect(() => {
    if (selectedNoteId) {
      loadNote(selectedNoteId);
    }
  }, [selectedNoteId, loadNote]);

  // Show vault selector if no vault is open
  if (!currentVault) {
    return <VaultSelector />;
  }

  // Render editor content
  const renderEditor = () => {
    if (currentNote) {
      return <Editor note={currentNote} />;
    }
    return <EditorPlaceholder />;
  };

  // Render based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'graph':
        return <GraphPanel />;

      case 'split':
        return (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 border-r border-border-subtle">
              {renderEditor()}
            </div>
            <div className="flex-1">
              <GraphPanel />
            </div>
          </div>
        );

      case 'editor':
      default:
        return renderEditor();
    }
  };

  return (
    <>
      <MainLayout>{renderContent()}</MainLayout>
      <QuickSearch />
      <SettingsPanel />
      <DeleteConfirmDialog />
      <ContextMenu />
      <FindInNote />
      <BacklinksPanel />
      <PropertiesPanel />
    </>
  );
}

export default App;
