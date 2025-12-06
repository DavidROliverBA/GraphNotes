import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'editor' | 'graph' | 'split';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetPath: string | null;
  targetType: 'file' | 'folder' | 'graph-node' | null;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // View mode
  viewMode: ViewMode;

  // Selected items
  selectedNoteId: string | null;

  // Contextual panel
  contextualPanelOpen: boolean;

  // Link panel
  linkPanelOpen: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Focus mode
  focusModeActive: boolean;

  // Quick search
  quickSearchOpen: boolean;

  // Settings
  showSettings: boolean;

  // Delete confirmation
  showDeleteConfirmation: boolean;

  // Find in note
  showFindInNote: boolean;

  // Properties panel
  showPropertiesPanel: boolean;

  // Backlinks panel
  showBacklinksPanel: boolean;

  // Renaming
  renamingNoteId: string | null;

  // Context menu
  contextMenu: ContextMenuState;

  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedNoteId: (id: string | null) => void;
  toggleContextualPanel: () => void;
  toggleLinkPanel: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleFocusMode: () => void;
  setQuickSearchOpen: (open: boolean) => void;
  setShowQuickSearch: (open: boolean) => void;
  setShowSettings: (open: boolean) => void;
  setShowDeleteConfirmation: (open: boolean) => void;
  setShowFindInNote: (open: boolean) => void;
  setShowPropertiesPanel: (open: boolean) => void;
  setShowBacklinksPanel: (open: boolean) => void;
  setRenamingNoteId: (id: string | null) => void;
  openContextMenu: (x: number, y: number, targetPath: string, targetType: 'file' | 'folder' | 'graph-node') => void;
  closeContextMenu: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarWidth: 280,
      viewMode: 'editor',
      selectedNoteId: null,
      contextualPanelOpen: false,
      linkPanelOpen: false,
      theme: 'system',
      focusModeActive: false,
      quickSearchOpen: false,
      showSettings: false,
      showDeleteConfirmation: false,
      showFindInNote: false,
      showPropertiesPanel: false,
      showBacklinksPanel: false,
      renamingNoteId: null,
      contextMenu: {
        isOpen: false,
        x: 0,
        y: 0,
        targetPath: null,
        targetType: null,
      },

      // Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedNoteId: (id) => set({ selectedNoteId: id }),
      toggleContextualPanel: () => set((state) => ({ contextualPanelOpen: !state.contextualPanelOpen })),
      toggleLinkPanel: () => set((state) => ({ linkPanelOpen: !state.linkPanelOpen })),
      setTheme: (theme) => set({ theme }),
      toggleFocusMode: () => set((state) => ({ focusModeActive: !state.focusModeActive })),
      setQuickSearchOpen: (open) => set({ quickSearchOpen: open }),
      setShowQuickSearch: (open) => set({ quickSearchOpen: open }),
      setShowSettings: (open) => set({ showSettings: open }),
      setShowDeleteConfirmation: (open) => set({ showDeleteConfirmation: open }),
      setShowFindInNote: (open) => set({ showFindInNote: open }),
      setShowPropertiesPanel: (open) => set({ showPropertiesPanel: open }),
      setShowBacklinksPanel: (open) => set({ showBacklinksPanel: open }),
      setRenamingNoteId: (id) => set({ renamingNoteId: id }),
      openContextMenu: (x, y, targetPath, targetType) => set({
        contextMenu: { isOpen: true, x, y, targetPath, targetType }
      }),
      closeContextMenu: () => set({
        contextMenu: { isOpen: false, x: 0, y: 0, targetPath: null, targetType: null }
      }),
    }),
    {
      name: 'graphnotes-ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        viewMode: state.viewMode,
        theme: state.theme,
      }),
    }
  )
);
