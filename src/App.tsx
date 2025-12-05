import { useEffect } from 'react';
import { useSettingsStore } from './stores/settingsStore';
import { useNoteStore } from './stores/noteStore';
import { useUIStore } from './stores/uiStore';
import { MainLayout } from './components/Layout/MainLayout';
import { VaultSelector } from './components/Layout/VaultSelector';
import { Editor } from './components/Editor/Editor';
import { EditorPlaceholder } from './components/Editor/EditorPlaceholder';
import { GraphPanel } from './components/Layout/GraphPanel';

function App() {
  const { currentVault } = useSettingsStore();
  const { currentNote, loadNote, loadNotesFromVault } = useNoteStore();
  const { selectedNoteId, viewMode } = useUIStore();

  // Load notes when vault changes
  useEffect(() => {
    if (currentVault) {
      loadNotesFromVault(currentVault.path);
    }
  }, [currentVault, loadNotesFromVault]);

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

  return <MainLayout>{renderContent()}</MainLayout>;
}

export default App;
