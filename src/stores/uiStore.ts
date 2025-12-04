// src/stores/uiStore.ts

import { create } from 'zustand';

export type ViewMode = 'editor' | 'graph' | 'split';
export type SidebarTab = 'files' | 'search';

interface UIState {
  // Vault state
  vaultPath: string | null;
  isVaultOpen: boolean;

  // View state
  viewMode: ViewMode;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  sidebarWidth: number;
  graphPanelWidth: number;
  linkPanelOpen: boolean;
  linkPanelWidth: number;

  // Selection state
  selectedNoteId: string | null;
  selectedNodeId: string | null;

  // Modal state
  isSettingsOpen: boolean;
  isVaultSelectorOpen: boolean;

  // Actions
  setVaultPath: (path: string | null) => void;
  setIsVaultOpen: (isOpen: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarWidth: (width: number) => void;
  setGraphPanelWidth: (width: number) => void;
  setLinkPanelOpen: (open: boolean) => void;
  setLinkPanelWidth: (width: number) => void;
  setSelectedNoteId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsVaultSelectorOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial vault state
  vaultPath: null,
  isVaultOpen: false,

  // Initial view state
  viewMode: 'split',
  sidebarOpen: true,
  sidebarTab: 'files',
  sidebarWidth: 280,
  graphPanelWidth: 400,
  linkPanelOpen: false,
  linkPanelWidth: 280,

  // Initial selection state
  selectedNoteId: null,
  selectedNodeId: null,

  // Initial modal state
  isSettingsOpen: false,
  isVaultSelectorOpen: true,

  // Actions
  setVaultPath: (path) => set({ vaultPath: path }),
  setIsVaultOpen: (isOpen) => set({ isVaultOpen: isOpen }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setGraphPanelWidth: (width) => set({ graphPanelWidth: width }),
  setLinkPanelOpen: (open) => set({ linkPanelOpen: open }),
  setLinkPanelWidth: (width) => set({ linkPanelWidth: width }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setIsVaultSelectorOpen: (open) => set({ isVaultSelectorOpen: open }),
}));
