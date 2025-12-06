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

  async getEdgeCount(): Promise<number> {
    const edges = await this.page.locator('.react-flow__edge').all();
    return edges.length;
  }

  async clickNode(label: string): Promise<void> {
    await this.page.click(`.react-flow__node:has-text("${label}")`);
  }

  async doubleClickNode(label: string): Promise<void> {
    await this.page.dblclick(`.react-flow__node:has-text("${label}")`);
  }

  async hoverNode(label: string): Promise<void> {
    await this.page.hover(`.react-flow__node:has-text("${label}")`);
  }

  async clickEdge(index: number = 0): Promise<void> {
    const edges = this.page.locator('.react-flow__edge');
    await edges.nth(index).click({ force: true, timeout: 5000 });
  }

  async hoverEdge(index: number = 0): Promise<void> {
    const edges = this.page.locator('.react-flow__edge');
    await edges.nth(index).hover({ force: true, timeout: 5000 });
  }

  async getEdgeLabels(): Promise<string[]> {
    const labels = await this.page.locator('.edge-label').allTextContents();
    return labels;
  }

  async getNodeLabels(): Promise<string[]> {
    const nodes = await this.page.locator('.react-flow__node').all();
    const labels: string[] = [];
    for (const node of nodes) {
      const text = await node.textContent();
      if (text) labels.push(text.trim());
    }
    return labels;
  }

  async zoomIn(): Promise<void> {
    await this.page.click('.react-flow__controls-button.react-flow__controls-zoomin');
  }

  async zoomOut(): Promise<void> {
    await this.page.click('.react-flow__controls-button.react-flow__controls-zoomout');
  }

  async fitView(): Promise<void> {
    await this.page.click('.react-flow__controls-button.react-flow__controls-fitview');
  }

  async setLayout(type: 'force' | 'grid' | 'tree' | 'radial'): Promise<void> {
    const titleMap = {
      force: 'Force layout',
      grid: 'Grid layout',
      tree: 'Tree layout',
      radial: 'Radial layout',
    };
    await this.page.click(`button[title="${titleMap[type]}"]`);
  }

  async search(query: string): Promise<void> {
    const input = this.page.locator('input[placeholder="Search nodes..."]');
    await input.fill(query);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator('input[placeholder="Search nodes..."]');
    await input.fill('');
  }

  async openFilterPanel(): Promise<void> {
    await this.page.click('button:has-text("Filter")');
  }

  async isMinimapVisible(): Promise<boolean> {
    return await this.page.locator('.react-flow__minimap').isVisible();
  }

  async clickPaneBackground(): Promise<void> {
    await this.page.click('.react-flow__pane');
  }

  async getSelectedNodeCount(): Promise<number> {
    const selected = await this.page.locator('.react-flow__node.selected').count();
    return selected;
  }
}

/**
 * Page object for Super Tags in the Sidebar
 */
export class SuperTagSidebarPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('button:has-text("Super Tags")').isVisible();
  }

  async toggleExpansion(): Promise<void> {
    await this.page.click('button:has-text("Super Tags")');
  }

  async isExpanded(): Promise<boolean> {
    // Check if the empty message or tag list is visible
    const emptyMessage = this.page.locator('text=No super tags yet');
    const tagButton = this.page.locator('.space-y-0\\.5 button').first();
    return (await emptyMessage.isVisible()) || (await tagButton.isVisible());
  }

  async getTagCount(): Promise<number> {
    const countText = await this.page.locator('button:has-text("Super Tags") span.ml-auto').textContent();
    return parseInt(countText || '0', 10);
  }

  async getTagNames(): Promise<string[]> {
    const tags = await this.page.locator('.space-y-0\\.5 button').all();
    const names: string[] = [];
    for (const tag of tags) {
      const text = await tag.locator('.truncate').textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }

  async getTagNoteCount(tagName: string): Promise<number> {
    const tag = this.page.locator(`.space-y-0\\.5 button:has-text("${tagName}")`);
    const countText = await tag.locator('.text-xs.text-text-tertiary').textContent();
    return parseInt(countText || '0', 10);
  }

  async clickTag(tagName: string): Promise<void> {
    await this.page.click(`.space-y-0\\.5 button:has-text("${tagName}")`);
  }

  async hasEmptyMessage(): Promise<boolean> {
    return await this.page.locator('text=No super tags yet').isVisible();
  }
}

/**
 * Page object for Super Tag Manager (if accessed via settings or modal)
 */
export class SuperTagManagerPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('h2:has-text("Super Tags")').isVisible();
  }

  async clickNewTag(): Promise<void> {
    await this.page.click('button:has-text("New Tag")');
  }

  async clickCreateFirstTag(): Promise<void> {
    await this.page.click('button:has-text("Create Your First Tag")');
  }

  async getTagCount(): Promise<number> {
    const tags = await this.page.locator('.divide-y > div').all();
    return tags.length;
  }

  async clickEditTag(tagName: string): Promise<void> {
    const tagRow = this.page.locator(`.divide-y > div:has-text("${tagName}")`);
    await tagRow.locator('button[title="Edit"]').click();
  }

  async clickDeleteTag(tagName: string): Promise<void> {
    const tagRow = this.page.locator(`.divide-y > div:has-text("${tagName}")`);
    await tagRow.locator('button[title="Delete"]').click();
  }

  async confirmDelete(): Promise<void> {
    await this.page.click('button:has-text("Delete")');
  }

  async cancelDelete(): Promise<void> {
    await this.page.click('button:has-text("Cancel")');
  }
}

/**
 * Page object for Super Tag Editor Modal
 */
export class SuperTagEditorPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('h2:has-text("Create Super Tag"), h2:has-text("Edit Super Tag")').isVisible();
  }

  async setName(name: string): Promise<void> {
    const input = this.page.locator('input[placeholder*="Project"]');
    await input.fill(name);
  }

  async setDescription(description: string): Promise<void> {
    const textarea = this.page.locator('textarea[placeholder*="Optional description"]');
    await textarea.fill(description);
  }

  async selectIcon(icon: string): Promise<void> {
    await this.page.click(`button:has-text("${icon}")`);
  }

  async selectColour(index: number): Promise<void> {
    const colourButtons = this.page.locator('.flex.gap-2 button.rounded-full');
    await colourButtons.nth(index).click();
  }

  async addAttribute(): Promise<void> {
    await this.page.click('button:has-text("Add Attribute")');
  }

  async setAttributeName(index: number, name: string): Promise<void> {
    const attributes = this.page.locator('.border.border-border-subtle.rounded-md');
    const attr = attributes.nth(index);
    await attr.click();
    const nameInput = attr.locator('input').first();
    await nameInput.fill(name);
  }

  async setAttributeType(index: number, type: string): Promise<void> {
    const attributes = this.page.locator('.border.border-border-subtle.rounded-md');
    const attr = attributes.nth(index);
    const select = attr.locator('select');
    await select.selectOption(type);
  }

  async toggleRequired(index: number): Promise<void> {
    const attributes = this.page.locator('.border.border-border-subtle.rounded-md');
    const attr = attributes.nth(index);
    const checkbox = attr.locator('input[type="checkbox"]').first();
    await checkbox.click();
  }

  async removeAttribute(index: number): Promise<void> {
    const attributes = this.page.locator('.border.border-border-subtle.rounded-md');
    const attr = attributes.nth(index);
    await attr.locator('button:has(svg.lucide-trash-2)').click();
  }

  async save(): Promise<void> {
    await this.page.click('button:has-text("Create Super Tag"), button:has-text("Save Changes")');
  }

  async cancel(): Promise<void> {
    await this.page.click('button:has-text("Cancel")');
  }

  async close(): Promise<void> {
    await this.page.click('button:has(svg.lucide-x)');
  }
}

/**
 * Page object for Super Tag Assigner (in editor sidebar)
 */
export class SuperTagAssignerPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return await this.page.locator('h3:has-text("Super Tags")').isVisible();
  }

  async clickAddTag(): Promise<void> {
    await this.page.click('button:has-text("Add Tag")');
  }

  async selectTag(tagName: string): Promise<void> {
    await this.page.click(`button:has-text("${tagName}")`);
  }

  async getAssignedTags(): Promise<string[]> {
    const tags = await this.page.locator('.space-y-2 > div').all();
    const names: string[] = [];
    for (const tag of tags) {
      const name = await tag.locator('.font-medium').textContent();
      if (name) names.push(name.trim());
    }
    return names;
  }

  async expandTag(tagName: string): Promise<void> {
    await this.page.click(`.space-y-2 > div:has-text("${tagName}")`);
  }

  async unassignTag(tagName: string): Promise<void> {
    const tag = this.page.locator(`.space-y-2 > div:has-text("${tagName}")`);
    await tag.locator('button:has(svg.lucide-x)').click();
  }

  async setAttributeValue(tagName: string, attrName: string, value: string): Promise<void> {
    const tag = this.page.locator(`.space-y-2 > div:has-text("${tagName}")`);
    const attrLabel = tag.locator(`label:has-text("${attrName}")`);
    const input = attrLabel.locator('..').locator('input, select, textarea');
    await input.fill(value);
  }

  async hasEmptyMessage(): Promise<boolean> {
    return await this.page.locator('text=No super tags assigned').isVisible();
  }
}
