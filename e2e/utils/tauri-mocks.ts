import { Page } from '@playwright/test';

/**
 * Mock file system data for testing
 */
export interface MockFileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  is_file: boolean;
  extension: string | null;
  size: number | null;
  modified: number | null;
}

export interface MockFileContent {
  path: string;
  content: string;
  size: number;
}

/**
 * Virtual file system for testing
 */
export class VirtualFileSystem {
  private files: Map<string, string> = new Map();
  private directories: Set<string> = new Set();

  constructor() {
    // Initialize with root
    this.directories.add('/');
  }

  createDirectory(path: string): void {
    this.directories.add(path);
    // Ensure parent directories exist
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
      current += '/' + part;
      this.directories.add(current);
    }
  }

  createFile(path: string, content: string = ''): void {
    this.files.set(path, content);
    // Ensure parent directory exists
    const parentPath = path.split('/').slice(0, -1).join('/') || '/';
    this.createDirectory(parentPath);
  }

  readFile(path: string): MockFileContent | null {
    const content = this.files.get(path);
    if (content === undefined) return null;
    return {
      path,
      content,
      size: content.length,
    };
  }

  writeFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  deleteFile(path: string): boolean {
    return this.files.delete(path) || this.directories.delete(path);
  }

  exists(path: string): boolean {
    return this.files.has(path) || this.directories.has(path);
  }

  readDirectory(path: string): MockFileEntry[] {
    const entries: MockFileEntry[] = [];
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

    // Find all files and directories directly under this path
    for (const [filePath, content] of this.files) {
      const relativePath = filePath.slice(normalizedPath.length + 1);
      if (filePath.startsWith(normalizedPath + '/') && !relativePath.includes('/')) {
        const name = relativePath;
        const ext = name.includes('.') ? name.split('.').pop() || null : null;
        entries.push({
          name,
          path: filePath,
          is_directory: false,
          is_file: true,
          extension: ext,
          size: content.length,
          modified: Date.now(),
        });
      }
    }

    for (const dirPath of this.directories) {
      const relativePath = dirPath.slice(normalizedPath.length + 1);
      if (dirPath.startsWith(normalizedPath + '/') && !relativePath.includes('/') && relativePath) {
        entries.push({
          name: relativePath,
          path: dirPath,
          is_directory: true,
          is_file: false,
          extension: null,
          size: null,
          modified: Date.now(),
        });
      }
    }

    return entries.sort((a, b) => {
      if (a.is_directory && !b.is_directory) return -1;
      if (!a.is_directory && b.is_directory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  rename(oldPath: string, newPath: string): boolean {
    const content = this.files.get(oldPath);
    if (content !== undefined) {
      this.files.delete(oldPath);
      this.files.set(newPath, content);
      return true;
    }
    if (this.directories.has(oldPath)) {
      this.directories.delete(oldPath);
      this.directories.add(newPath);
      return true;
    }
    return false;
  }

  /**
   * Create a test vault with sample notes
   */
  createTestVault(vaultPath: string): void {
    // Create .graphnotes directory
    this.createDirectory(`${vaultPath}/.graphnotes`);
    this.createDirectory(`${vaultPath}/.graphnotes/supertags`);
    this.createFile(
      `${vaultPath}/.graphnotes/config.json`,
      JSON.stringify({ version: '1.0.0', created: new Date().toISOString() }, null, 2)
    );
    this.createFile(`${vaultPath}/.graphnotes/events.jsonl`, '');

    // Create sample notes
    const welcomeNote = `---
id: welcome-note-id
title: Welcome to GraphNotes
created: ${new Date().toISOString()}
modified: ${new Date().toISOString()}
---

# Welcome to GraphNotes

This is your test vault. Start by creating notes and linking them together with [[wikilinks]].

## Quick Tips

- Press \`Cmd+N\` to create a new note
- Type \`[[\` to create a link to another note
- Press \`Cmd+K\` to search your notes
`;
    this.createFile(`${vaultPath}/Welcome.md`, welcomeNote);

    const testNote = `---
id: test-note-id
title: Test Note
created: ${new Date().toISOString()}
modified: ${new Date().toISOString()}
---

# Test Note

This is a test note for E2E testing.

- Item 1
- Item 2
- Item 3

Link to [[Welcome to GraphNotes]].
`;
    this.createFile(`${vaultPath}/Test Note.md`, testNote);
  }

  /**
   * Get the serialized state for injection into the browser
   */
  serialize(): { files: [string, string][]; directories: string[] } {
    return {
      files: Array.from(this.files.entries()),
      directories: Array.from(this.directories),
    };
  }
}

/**
 * Inject Tauri mocks into the page
 *
 * Note: The app now has built-in mock support for browser mode.
 * When __TAURI_INTERNALS__ is NOT present, commands.ts uses an in-memory
 * mock filesystem and dialog.ts returns a mock path.
 *
 * This function just ensures the dialog mock result is set correctly.
 */
export async function injectTauriMocks(page: Page, _vfs: VirtualFileSystem): Promise<void> {
  // The app has built-in mock support - we just need to ensure
  // __TAURI_INTERNALS__ is NOT set so the app uses mock mode
  await page.addInitScript(() => {
    console.log('[E2E] Running in mock mode (no Tauri)');

    // Ensure __TAURI_INTERNALS__ is NOT set so app uses mock mode
    // The app's commands.ts and dialog.ts will use their own mocks
  });
}

/**
 * Set the dialog result for the next dialog.open() call
 * This calls the setter exposed by src/lib/tauri/dialog.ts
 */
export async function setDialogResult(page: Page, result: string | null): Promise<void> {
  await page.evaluate((r) => {
    const setter = (window as { __setDialogResult?: (result: string | null) => void }).__setDialogResult;
    if (setter) {
      setter(r);
    } else {
      console.warn('__setDialogResult not available yet');
    }
  }, result);
}

/**
 * Get the current virtual file system state
 */
export async function getVfsFiles(page: Page): Promise<[string, string][]> {
  return await page.evaluate(() => {
    return (window as any).__getVfsFiles();
  });
}

/**
 * Set a file in the virtual file system
 */
export async function setVfsFile(page: Page, path: string, content: string): Promise<void> {
  await page.evaluate(
    ({ path, content }) => {
      (window as any).__setVfsFile(path, content);
    },
    { path, content }
  );
}
