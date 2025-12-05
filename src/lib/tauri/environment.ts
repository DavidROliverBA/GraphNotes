/**
 * Check if we're running in a Tauri environment
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Check if we're running in a browser (not Tauri)
 */
export function isBrowserEnvironment(): boolean {
  return !isTauriEnvironment();
}
