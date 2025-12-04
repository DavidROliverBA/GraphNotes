// src/stores/settingsStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Theme presets
 */
export type ThemePreset = 'dark' | 'light' | 'catppuccin' | 'nord' | 'solarized';

/**
 * Font size presets
 */
export type FontSizePreset = 'compact' | 'normal' | 'comfortable';

/**
 * Graph layout options
 */
export type GraphLayout = 'force' | 'radial' | 'hierarchical';

/**
 * App settings
 */
export interface AppSettings {
  // Appearance
  theme: ThemePreset;
  fontSizePreset: FontSizePreset;
  editorFontSize: number;
  editorFontFamily: string;
  lineHeight: number;

  // Editor
  autoSave: boolean;
  autoSaveInterval: number;  // ms
  spellCheck: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;

  // Graph
  graphLayout: GraphLayout;
  graphNodeSize: number;
  graphLinkDistance: number;
  graphShowLabels: boolean;
  graphPhysicsEnabled: boolean;

  // Sync
  syncEnabled: boolean;
  syncAutoConnect: boolean;

  // Daily Notes
  dailyNoteFolder: string;
  dailyNoteFormat: string;

  // Default relationship types
  defaultLinkTypes: string[];
}

/**
 * Default settings
 */
const defaultSettings: AppSettings = {
  // Appearance
  theme: 'dark',
  fontSizePreset: 'normal',
  editorFontSize: 16,
  editorFontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
  lineHeight: 1.6,

  // Editor
  autoSave: true,
  autoSaveInterval: 5000,
  spellCheck: false,
  lineNumbers: false,
  wordWrap: true,

  // Graph
  graphLayout: 'force',
  graphNodeSize: 8,
  graphLinkDistance: 100,
  graphShowLabels: true,
  graphPhysicsEnabled: true,

  // Sync
  syncEnabled: false,
  syncAutoConnect: false,

  // Daily Notes
  dailyNoteFolder: 'daily/{{year}}',
  dailyNoteFormat: '{{date}}.md',

  // Default relationship types
  defaultLinkTypes: [
    'relates to',
    'depends on',
    'implements',
    'extends',
    'references',
    'contradicts',
    'supports',
  ],
};

/**
 * Settings store interface
 */
interface SettingsState {
  settings: AppSettings;
  setSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

/**
 * Settings store with persistence
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({ settings: defaultSettings }),

      setSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
    }),
    {
      name: 'graphnotes-settings',
    }
  )
);

export default useSettingsStore;
