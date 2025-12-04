// src/hooks/useTheme.ts

import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { getTheme, themeToCssVariables } from '../lib/themes/themeDefinitions';

/**
 * Hook to apply the current theme to the document
 * Updates CSS variables when theme changes
 */
export function useTheme() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    const theme = getTheme(settings.theme);
    const cssVariables = themeToCssVariables(theme);

    // Apply CSS variables to document root
    const root = document.documentElement;
    for (const [property, value] of Object.entries(cssVariables)) {
      root.style.setProperty(property, value);
    }

    // Apply dark/light mode class for potential third-party integrations
    if (theme.isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Apply editor font size
    root.style.setProperty('--editor-font-size', `${settings.editorFontSize}px`);
    root.style.setProperty('--editor-line-height', settings.lineHeight.toString());
    root.style.setProperty('--editor-font-family', settings.editorFontFamily);

    // Apply UI font size based on preset
    const fontSizeMap = {
      compact: '13px',
      normal: '14px',
      comfortable: '16px',
    };
    root.style.setProperty('--ui-font-size', fontSizeMap[settings.fontSizePreset]);

  }, [
    settings.theme,
    settings.editorFontSize,
    settings.lineHeight,
    settings.editorFontFamily,
    settings.fontSizePreset,
  ]);

  return getTheme(settings.theme);
}

export default useTheme;
