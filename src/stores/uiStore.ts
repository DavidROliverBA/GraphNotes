import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'editor' | 'graph' | 'split';

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
