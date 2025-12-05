import { test as base, expect, Page } from '@playwright/test';
import {
  VirtualFileSystem,
  injectTauriMocks,
  setDialogResult,
  getVfsFiles,
  setVfsFile,
} from '../utils/tauri-mocks';

/**
 * Custom test fixtures for GraphNotes E2E tests
 */
export interface GraphNotesFixtures {
  /** Virtual file system for the test */
  vfs: VirtualFileSystem;

  /** Page with Tauri mocks injected */
  graphNotesPage: Page;

  /** Helper to set dialog result */
  setDialogResult: (result: string | null) => Promise<void>;

  /** Helper to get VFS files */
  getVfsFiles: () => Promise<[string, string][]>;

  /** Helper to set a VFS file */
  setVfsFile: (path: string, content: string) => Promise<void>;

  /** Open a test vault and wait for app to be ready */
  openTestVault: () => Promise<void>;

  /** Create a new note and return its path */
  createNote: (title: string) => Promise<string>;

  /** Select a note by clicking in the file tree */
  selectNote: (title: string) => Promise<void>;

  /** Type text into the editor */
  typeInEditor: (text: string) => Promise<void>;

  /** Wait for the app to be fully loaded */
  waitForAppReady: () => Promise<void>;
}

/**
 * Extended test with GraphNotes fixtures
 */
export const test = base.extend<GraphNotesFixtures>({
  // Virtual file system
  vfs: async ({}, use) => {
    const vfs = new VirtualFileSystem();
    vfs.createTestVault('/test-vault');
    await use(vfs);
  },

  // Page with mocks injected
  graphNotesPage: async ({ page, vfs }, use) => {
    // Inject mocks before navigating
    await injectTauriMocks(page, vfs);

    // Navigate to the app
    await page.goto('/');

    await use(page);
  },

  // Helper functions
  setDialogResult: async ({ graphNotesPage }, use) => {
    await use(async (result: string | null) => {
      await setDialogResult(graphNotesPage, result);
    });
  },

  getVfsFiles: async ({ graphNotesPage }, use) => {
    await use(async () => {
      return await getVfsFiles(graphNotesPage);
    });
  },

  setVfsFile: async ({ graphNotesPage }, use) => {
    await use(async (path: string, content: string) => {
      await setVfsFile(graphNotesPage, path, content);
    });
  },

  // Open test vault
  openTestVault: async ({ graphNotesPage, setDialogResult }, use) => {
    await use(async () => {
      // Set dialog to return test vault path
      await setDialogResult('/test-vault');

      // Click "Open Vault" button
      await graphNotesPage.click('button:has-text("Open Vault")');

      // Wait for the main layout to appear - look for the Settings button or file tree
      await graphNotesPage.waitForSelector('button:has-text("Settings"), .truncate.text-sm', { timeout: 10000 });

      // Give file tree time to load
      await graphNotesPage.waitForTimeout(500);
    });
  },

  // Create a new note
  createNote: async ({ graphNotesPage }, use) => {
    await use(async (title: string) => {
      // Click the + button in the sidebar
      const plusButton = graphNotesPage.locator('button[title="New note"]');
      await plusButton.click();

      // The new note should be created and selected
      // Wait for editor to show
      await graphNotesPage.waitForSelector('.editor-container', { timeout: 5000 });

      // Get the note path from the store (would need to expose this)
      return `/test-vault/${title}.md`;
    });
  },

  // Select a note
  selectNote: async ({ graphNotesPage }, use) => {
    await use(async (title: string) => {
      // Find the note in the file tree
      const noteButton = graphNotesPage.locator(`button:has-text("${title}")`);
      await noteButton.click();

      // Wait for editor to update
      await graphNotesPage.waitForTimeout(500);
    });
  },

  // Type in editor
  typeInEditor: async ({ graphNotesPage }, use) => {
    await use(async (text: string) => {
      // Click in the editor area
      const editor = graphNotesPage.locator('.yoopta-editor');
      await editor.click();

      // Type the text
      await graphNotesPage.keyboard.type(text);
    });
  },

  // Wait for app ready
  waitForAppReady: async ({ graphNotesPage }, use) => {
    await use(async () => {
      // Wait for either vault selector or main layout
      await graphNotesPage.waitForSelector(
        'button:has-text("Open Vault"), .sidebar-item',
        { timeout: 10000 }
      );
    });
  },
});

export { expect };
export type { Page };

/**
 * Page object for the Vault Selector
 */
export class VaultSelectorPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('button:has-text("Open Vault")').isVisible();
  }

  async clickOpenVault(): Promise<void> {
    await this.page.click('button:has-text("Open Vault")');
  }

  async clickCreateNewVault(): Promise<void> {
    await this.page.click('button:has-text("Create New Vault")');
  }

  async getRecentVaults(): Promise<string[]> {
    const vaults = await this.page.locator('.group:has(.text-accent-warning)').all();
    const names: string[] = [];
    for (const vault of vaults) {
      const name = await vault.locator('.font-medium').textContent();
      if (name) names.push(name);
    }
    return names;
  }
}

/**
 * Page object for the Sidebar
 */
export class SidebarPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('.sidebar-item').first().isVisible();
  }

  async clickSearch(): Promise<void> {
    await this.page.click('text=Search...');
  }

  async clickDailyNote(): Promise<void> {
    await this.page.click('text=Daily Note');
  }

  async clickFavourites(): Promise<void> {
    await this.page.click('text=Favourites');
  }

  async clickRecent(): Promise<void> {
    await this.page.click('text=Recent');
  }

  async clickSettings(): Promise<void> {
    await this.page.click('text=Settings');
  }

  async clickNewNote(): Promise<void> {
    await this.page.click('button[title="New note"]');
  }

  async getFileTreeItems(): Promise<string[]> {
    // Get all file tree items
    const items = await this.page.locator('[class*="file-tree"] button').all();
    const names: string[] = [];
    for (const item of items) {
      const text = await item.textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }

  async selectFile(name: string): Promise<void> {
    await this.page.click(`button:has-text("${name}")`);
  }
}

/**
 * Page object for the Editor
 */
export class EditorPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('.editor-container').isVisible();
  }

  async getTitle(): Promise<string> {
    const toolbar = this.page.locator('.editor-container').first();
    const title = await toolbar.locator('h1, .text-xl').first().textContent();
    return title || '';
  }

  async isSaved(): Promise<boolean> {
    return await this.page.locator('text=Saved').isVisible();
  }

  async click(): Promise<void> {
    await this.page.locator('.yoopta-editor').click();
  }

  async type(text: string): Promise<void> {
    await this.click();
    await this.page.keyboard.type(text);
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async selectAll(): Promise<void> {
    await this.page.keyboard.press('Meta+a');
  }

  async getContent(): Promise<string> {
    const editor = this.page.locator('.yoopta-editor');
    return await editor.textContent() || '';
  }
}

/**
 * Page object for the Settings Panel
 */
export class SettingsPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('text=Settings').first().isVisible();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async selectTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.page.click(`button:has-text("${theme}")`);
  }

  async getSelectedTheme(): Promise<string> {
    const selected = await this.page.locator('[data-selected="true"]').textContent();
    return selected || '';
  }
}

/**
 * Page object for the Graph View
 */
export class GraphPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('.react-flow').isVisible();
  }

  async getNodeCount(): Promise<number> {
    const nodes = await this.page.locator('.react-flow__node').all();
    return nodes.length;
  }

  async clickNode(label: string): Promise<void> {
    await this.page.click(`.react-flow__node:has-text("${label}")`);
  }

  async zoomIn(): Promise<void> {
    await this.page.click('button[title="Zoom in"]');
  }

  async zoomOut(): Promise<void> {
    await this.page.click('button[title="Zoom out"]');
  }

  async fitView(): Promise<void> {
    await this.page.click('button[title="Fit view"]');
  }
}
