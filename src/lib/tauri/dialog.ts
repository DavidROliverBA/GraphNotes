// Check if we're running in Tauri or in test/browser mode
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// Mock dialog result for testing - can be set via window.__setDialogResult
let mockDialogResult: string | null = '/test-vault';

// Set mock dialog result (used by E2E tests)
export function setMockDialogResult(result: string | null): void {
  mockDialogResult = result;
}

// Expose setter on window for E2E tests
if (typeof window !== 'undefined') {
  (window as unknown as { __setDialogResult: (result: string | null) => void }).__setDialogResult = setMockDialogResult;
}

// Options type for dialog (compatible with Tauri's OpenDialogOptions)
export interface DialogOptions {
  directory?: boolean;
  multiple?: boolean;
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

/**
 * Open a file/directory dialog
 * Uses Tauri dialog in Tauri environment, returns mock result otherwise
 */
export async function openDialog(options?: DialogOptions): Promise<string | string[] | null> {
  if (isTauriEnvironment()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    return open(options);
  }

  // In browser/test mode, return mock result
  console.log('[Mock] dialog.open called, returning:', mockDialogResult);
  return mockDialogResult;
}
