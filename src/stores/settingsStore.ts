import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VaultConfig {
  path: string;
  name: string;
  lastOpened: string;
}

interface SettingsState {
  // Vault
  currentVault: VaultConfig | null;
  recentVaults: VaultConfig[];

  // Editor settings
  editorFontSize: number;
  editorLineHeight: number;

  // Graph settings
  graphLayout: 'force' | 'hierarchical' | 'radial' | 'manual';
  graphShowLabels: boolean;

  // Actions
  setCurrentVault: (vault: VaultConfig | null) => void;
  addRecentVault: (vault: VaultConfig) => void;
  removeRecentVault: (path: string) => void;
  setEditorFontSize: (size: number) => void;
  setEditorLineHeight: (height: number) => void;
  setGraphLayout: (layout: 'force' | 'hierarchical' | 'radial' | 'manual') => void;
  setGraphShowLabels: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      currentVault: null,
      recentVaults: [],
      editorFontSize: 16,
      editorLineHeight: 1.6,
      graphLayout: 'force',
      graphShowLabels: true,

      // Actions
      setCurrentVault: (vault) =>
        set((state) => {
          if (vault) {
            const updatedVault = { ...vault, lastOpened: new Date().toISOString() };
            const existingIndex = state.recentVaults.findIndex((v) => v.path === vault.path);
            let recentVaults = [...state.recentVaults];

            if (existingIndex >= 0) {
              recentVaults.splice(existingIndex, 1);
            }

            recentVaults.unshift(updatedVault);
            recentVaults = recentVaults.slice(0, 10); // Keep only 10 recent vaults

            return { currentVault: updatedVault, recentVaults };
          }
          return { currentVault: null };
        }),

      addRecentVault: (vault) =>
        set((state) => {
          const existingIndex = state.recentVaults.findIndex((v) => v.path === vault.path);
          let recentVaults = [...state.recentVaults];

          if (existingIndex >= 0) {
            recentVaults.splice(existingIndex, 1);
          }

          recentVaults.unshift(vault);
          recentVaults = recentVaults.slice(0, 10);

          return { recentVaults };
        }),

      removeRecentVault: (path) =>
        set((state) => ({
          recentVaults: state.recentVaults.filter((v) => v.path !== path),
        })),

      setEditorFontSize: (size) => set({ editorFontSize: size }),
      setEditorLineHeight: (height) => set({ editorLineHeight: height }),
      setGraphLayout: (layout) => set({ graphLayout: layout }),
      setGraphShowLabels: (show) => set({ graphShowLabels: show }),
    }),
    {
      name: 'graphnotes-settings-storage',
    }
  )
);
