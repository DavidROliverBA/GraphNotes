// src/lib/themes/themeDefinitions.ts

import { ThemePreset } from '../../stores/settingsStore';

/**
 * Theme color definition
 */
export interface ThemeColors {
  // Sidebar
  sidebarBg: string;
  sidebarHover: string;
  sidebarActive: string;

  // Editor
  editorBg: string;
  editorText: string;

  // Graph
  graphBg: string;
  graphNode: string;
  graphEdge: string;

  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  border: string;
  borderHover: string;
}

/**
 * Theme definition with colors and metadata
 */
export interface Theme {
  id: ThemePreset;
  name: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
}

/**
 * Dark theme (Catppuccin Mocha inspired)
 */
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  description: 'Default dark theme with comfortable contrast',
  isDark: true,
  colors: {
    sidebarBg: '#1e1e2e',
    sidebarHover: '#313244',
    sidebarActive: '#45475a',
    editorBg: '#181825',
    editorText: '#cdd6f4',
    graphBg: '#11111b',
    graphNode: '#89b4fa',
    graphEdge: '#6c7086',
    accentPrimary: '#89b4fa',
    accentSecondary: '#f5c2e7',
    accentSuccess: '#a6e3a1',
    accentWarning: '#fab387',
    accentError: '#f38ba8',
    textPrimary: '#cdd6f4',
    textSecondary: '#a6adc8',
    textMuted: '#6c7086',
    border: '#313244',
    borderHover: '#45475a',
  },
};

/**
 * Light theme
 */
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  description: 'Clean light theme for daytime use',
  isDark: false,
  colors: {
    sidebarBg: '#f5f5f5',
    sidebarHover: '#e8e8e8',
    sidebarActive: '#d9d9d9',
    editorBg: '#ffffff',
    editorText: '#1e1e2e',
    graphBg: '#fafafa',
    graphNode: '#1e66f5',
    graphEdge: '#8c8fa1',
    accentPrimary: '#1e66f5',
    accentSecondary: '#ea76cb',
    accentSuccess: '#40a02b',
    accentWarning: '#fe640b',
    accentError: '#d20f39',
    textPrimary: '#1e1e2e',
    textSecondary: '#4c4f69',
    textMuted: '#8c8fa1',
    border: '#e6e9ef',
    borderHover: '#ccd0da',
  },
};

/**
 * Catppuccin Mocha theme
 */
export const catppuccinTheme: Theme = {
  id: 'catppuccin',
  name: 'Catppuccin',
  description: 'Soothing pastel theme for the high-spirited',
  isDark: true,
  colors: {
    sidebarBg: '#1e1e2e',
    sidebarHover: '#313244',
    sidebarActive: '#45475a',
    editorBg: '#181825',
    editorText: '#cdd6f4',
    graphBg: '#11111b',
    graphNode: '#89b4fa',
    graphEdge: '#6c7086',
    accentPrimary: '#cba6f7',
    accentSecondary: '#f5c2e7',
    accentSuccess: '#a6e3a1',
    accentWarning: '#fab387',
    accentError: '#f38ba8',
    textPrimary: '#cdd6f4',
    textSecondary: '#bac2de',
    textMuted: '#6c7086',
    border: '#313244',
    borderHover: '#45475a',
  },
};

/**
 * Nord theme
 */
export const nordTheme: Theme = {
  id: 'nord',
  name: 'Nord',
  description: 'Arctic, north-bluish color palette',
  isDark: true,
  colors: {
    sidebarBg: '#2e3440',
    sidebarHover: '#3b4252',
    sidebarActive: '#434c5e',
    editorBg: '#2e3440',
    editorText: '#eceff4',
    graphBg: '#242933',
    graphNode: '#88c0d0',
    graphEdge: '#4c566a',
    accentPrimary: '#88c0d0',
    accentSecondary: '#b48ead',
    accentSuccess: '#a3be8c',
    accentWarning: '#ebcb8b',
    accentError: '#bf616a',
    textPrimary: '#eceff4',
    textSecondary: '#d8dee9',
    textMuted: '#4c566a',
    border: '#3b4252',
    borderHover: '#434c5e',
  },
};

/**
 * Solarized Dark theme
 */
export const solarizedTheme: Theme = {
  id: 'solarized',
  name: 'Solarized',
  description: 'Precision colors for machines and people',
  isDark: true,
  colors: {
    sidebarBg: '#002b36',
    sidebarHover: '#073642',
    sidebarActive: '#094959',
    editorBg: '#002b36',
    editorText: '#839496',
    graphBg: '#001e26',
    graphNode: '#268bd2',
    graphEdge: '#586e75',
    accentPrimary: '#268bd2',
    accentSecondary: '#d33682',
    accentSuccess: '#859900',
    accentWarning: '#cb4b16',
    accentError: '#dc322f',
    textPrimary: '#839496',
    textSecondary: '#93a1a1',
    textMuted: '#586e75',
    border: '#073642',
    borderHover: '#094959',
  },
};

/**
 * All available themes
 */
export const themes: Record<ThemePreset, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  catppuccin: catppuccinTheme,
  nord: nordTheme,
  solarized: solarizedTheme,
};

/**
 * Get theme by ID
 */
export function getTheme(id: ThemePreset): Theme {
  return themes[id] || darkTheme;
}

/**
 * Convert theme colors to CSS variables
 */
export function themeToCssVariables(theme: Theme): Record<string, string> {
  return {
    '--sidebar-bg': theme.colors.sidebarBg,
    '--sidebar-hover': theme.colors.sidebarHover,
    '--sidebar-active': theme.colors.sidebarActive,
    '--editor-bg': theme.colors.editorBg,
    '--editor-text': theme.colors.editorText,
    '--graph-bg': theme.colors.graphBg,
    '--graph-node': theme.colors.graphNode,
    '--graph-edge': theme.colors.graphEdge,
    '--accent-primary': theme.colors.accentPrimary,
    '--accent-secondary': theme.colors.accentSecondary,
    '--accent-success': theme.colors.accentSuccess,
    '--accent-warning': theme.colors.accentWarning,
    '--accent-error': theme.colors.accentError,
    '--text-primary': theme.colors.textPrimary,
    '--text-secondary': theme.colors.textSecondary,
    '--text-muted': theme.colors.textMuted,
    '--border': theme.colors.border,
    '--border-hover': theme.colors.borderHover,
  };
}

export default themes;
