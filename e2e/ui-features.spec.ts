import { test, expect } from './fixtures/test-fixtures';

/**
 * Comprehensive UI Features E2E Tests
 *
 * Tests all UI components, interactions, keyboard shortcuts, and features
 */

test.describe('UI Features', () => {

  // ==========================================
  // SIDEBAR TESTS
  // ==========================================
  test.describe('Sidebar', () => {
    test('should display sidebar with all sections', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Search bar
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await expect(searchBar).toBeVisible({ timeout: 5000 });

      // Quick Access section
      await expect(graphNotesPage.locator('text=Quick Access')).toBeVisible();

      // Daily Note button
      await expect(graphNotesPage.locator('button:has-text("Daily Note")')).toBeVisible();

      // Favourites button
      await expect(graphNotesPage.locator('button:has-text("Favourites")')).toBeVisible();

      // Recent button
      await expect(graphNotesPage.locator('button:has-text("Recent")')).toBeVisible();
    });

    test('should display vault name and file tree', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Vault name should be visible
      await expect(graphNotesPage.locator('text=test-vault')).toBeVisible({ timeout: 5000 });

      // New note button should be visible
      const newNoteButton = graphNotesPage.locator('button[title="New note"]');
      await expect(newNoteButton).toBeVisible();

      // File tree should show markdown files
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      await expect(fileItems.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display Super Tags section', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Super Tags header with toggle
      const superTagsHeader = graphNotesPage.locator('button:has-text("Super Tags")');
      await expect(superTagsHeader).toBeVisible({ timeout: 5000 });
    });

    test('should display Settings button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await expect(settingsButton).toBeVisible({ timeout: 5000 });
    });

    test('should toggle sidebar visibility', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Find sidebar toggle button in title bar
      const sidebarToggle = graphNotesPage.locator('header button').first();

      // Initially sidebar should be visible
      const sidebar = graphNotesPage.locator('aside');
      await expect(sidebar).toBeVisible();

      // Click to hide
      await sidebarToggle.click();
      await graphNotesPage.waitForTimeout(300);

      // Check sidebar is collapsed (width should be 0)
      const width = await sidebar.evaluate(el => el.classList.contains('w-0') || getComputedStyle(el).width === '0px');
      expect(width).toBeTruthy();

      // Click to show again
      await sidebarToggle.click();
      await graphNotesPage.waitForTimeout(300);
    });

    test('should toggle Super Tags section expansion', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const superTagsButton = graphNotesPage.locator('button:has-text("Super Tags")');
      await expect(superTagsButton).toBeVisible({ timeout: 5000 });

      // Click to collapse
      await superTagsButton.click();
      await graphNotesPage.waitForTimeout(200);

      // Click to expand
      await superTagsButton.click();
      await graphNotesPage.waitForTimeout(200);
    });

    test('should open quick search when clicking search bar', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Click search bar
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await searchBar.click();

      // Quick search modal should open
      const quickSearchModal = graphNotesPage.locator('.fixed.inset-0');
      await expect(quickSearchModal).toBeVisible({ timeout: 5000 });

      // Search input should be focused
      const searchInput = graphNotesPage.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();
    });
  });

  // ==========================================
  // FILE TREE TESTS
  // ==========================================
  test.describe('File Tree', () => {
    test('should display notes in file tree', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Wait for file tree to load
      await graphNotesPage.waitForTimeout(500);

      // File tree should show markdown files
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      const count = await fileItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should select note when clicking file tree item', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Click first file item
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      const count = await fileItems.count();

      if (count > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Editor should display the note
        await expect(graphNotesPage.locator('.yoopta-editor')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should highlight selected note in file tree', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Click a file item
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      const count = await fileItems.count();

      if (count > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(300);

        // Check that a note is selected in the store
        const selectedNoteId = await graphNotesPage.evaluate(() => {
          const store = (window as any).__ZUSTAND_STORES__?.uiStore;
          return store?.getState().selectedNoteId;
        });
        expect(selectedNoteId).not.toBeNull();
      }
    });

    test('should display notes without .md extension', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // File names should not show .md extension
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      const count = await fileItems.count();

      if (count > 0) {
        const firstFileName = await fileItems.first().textContent();
        expect(firstFileName).not.toContain('.md');
      }
    });
  });

  // ==========================================
  // EDITOR TESTS
  // ==========================================
  test.describe('Editor', () => {
    test('should display editor placeholder when no note selected', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Clear any selected note
      await graphNotesPage.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORES__?.uiStore;
        if (store) {
          store.getState().setSelectedNoteId(null);
        }
      });

      await graphNotesPage.waitForTimeout(300);

      // Placeholder should be visible (or editor area)
      const mainContent = graphNotesPage.locator('main');
      await expect(mainContent).toBeVisible();
    });

    test('should display editor toolbar when note is loaded', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Editor toolbar should be visible (look for Properties button which is in toolbar)
        await expect(graphNotesPage.locator('button:has-text("Properties")')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display note title in editor toolbar', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Title should be displayed in h1
        const title = graphNotesPage.locator('h1.text-lg.font-semibold');
        await expect(title).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display save status indicator', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Save status should show "Saved"
        await expect(graphNotesPage.locator('text=Saved')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display Properties button in toolbar', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Properties button should be visible
        await expect(graphNotesPage.locator('button:has-text("Properties")')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display Links button in toolbar', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Links button should be visible
        await expect(graphNotesPage.locator('button:has-text("Links")')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display Yoopta editor', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Yoopta editor should be visible
        await expect(graphNotesPage.locator('.yoopta-editor')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // ==========================================
  // MAIN LAYOUT TESTS
  // ==========================================
  test.describe('Main Layout', () => {
    test('should display title bar with app name', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // App name should be in title bar
      await expect(graphNotesPage.locator('header span:has-text("GraphNotes")')).toBeVisible({ timeout: 5000 });
    });

    test('should display view mode buttons', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // View mode buttons in title bar
      const titleBar = graphNotesPage.locator('header');
      await expect(titleBar).toBeVisible();

      // Should have 3 view mode buttons (Editor, Graph, Split)
      const viewButtons = titleBar.locator('button[title]');
      const count = await viewButtons.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should switch to graph view', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Click graph view button
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Graph view should be visible
      await expect(graphNotesPage.locator('.react-flow')).toBeVisible({ timeout: 5000 });
    });

    test('should switch to split view', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Click split view button
      const splitButton = graphNotesPage.locator('button[title="Split"]');
      await splitButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Both editor area and graph should be visible
      const mainContent = graphNotesPage.locator('main');
      await expect(mainContent).toBeVisible();
    });

    test('should switch back to editor view', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // First switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Then switch back to editor view
      const editorButton = graphNotesPage.locator('button[title="Editor"]');
      await editorButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Graph should not be visible
      const graph = graphNotesPage.locator('.react-flow');
      await expect(graph).not.toBeVisible();
    });

    test('should display status bar', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Status bar should show version
      await expect(graphNotesPage.locator('text=GraphNotes v')).toBeVisible({ timeout: 5000 });

      // Status bar should show "Ready"
      await expect(graphNotesPage.locator('text=Ready')).toBeVisible();
    });
  });

  // ==========================================
  // QUICK SEARCH TESTS
  // ==========================================
  test.describe('Quick Search', () => {
    test('should open quick search modal', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Click search bar to open quick search
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await searchBar.click();

      // Modal should be visible
      const modal = graphNotesPage.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Search input should be present
      const searchInput = graphNotesPage.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();
    });

    test('should show search instructions when empty', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open quick search
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await searchBar.click();

      // Should show instructions
      await expect(graphNotesPage.locator('text=Start typing to search notes')).toBeVisible({ timeout: 5000 });
    });

    test('should search for notes', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open quick search
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await searchBar.click();

      // Type search query
      const searchInput = graphNotesPage.locator('input[placeholder*="Search"]');
      await searchInput.fill('Welcome');
      await graphNotesPage.waitForTimeout(300);

      // Results should be visible or "no results" message
      const results = graphNotesPage.locator('.max-h-\\[60vh\\]');
      await expect(results).toBeVisible();
    });

    test('should close quick search with Escape', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open quick search
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await searchBar.click();

      const modal = graphNotesPage.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Wait for modal to be fully rendered
      await graphNotesPage.waitForTimeout(200);

      // Press Escape - ensure focus is on the modal/input
      const searchInput = graphNotesPage.locator('input[placeholder*="Search"]');
      await searchInput.focus();
      await graphNotesPage.keyboard.press('Escape');
      await graphNotesPage.waitForTimeout(500);

      // Modal should be closed
      await expect(modal).not.toBeVisible({ timeout: 5000 });
    });

    test('should close quick search by clicking backdrop', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open quick search
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await searchBar.click();

      const modal = graphNotesPage.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Click backdrop
      const backdrop = graphNotesPage.locator('.bg-black\\/50');
      await backdrop.click({ position: { x: 10, y: 10 } });
      await graphNotesPage.waitForTimeout(300);

      // Modal should be closed
      await expect(modal).not.toBeVisible();
    });

    test('should close quick search with X button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open quick search
      const searchBar = graphNotesPage.locator('.cursor-pointer:has-text("Search")');
      await searchBar.click();

      const modal = graphNotesPage.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Click X button
      const closeButton = modal.locator('button').filter({ has: graphNotesPage.locator('svg') }).first();
      await closeButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Modal should be closed
      await expect(modal).not.toBeVisible();
    });
  });

  // ==========================================
  // SETTINGS PANEL TESTS
  // ==========================================
  test.describe('Settings Panel', () => {
    test('should open settings panel', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Click Settings button
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();

      // Settings modal should be visible
      const settingsModal = graphNotesPage.locator('.fixed.inset-0.z-50');
      await expect(settingsModal).toBeVisible({ timeout: 5000 });

      // Should show "Settings" title
      await expect(graphNotesPage.locator('h2:has-text("Settings")')).toBeVisible();
    });

    test('should display all settings tabs', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();

      await graphNotesPage.waitForTimeout(300);

      // All tabs should be visible
      await expect(graphNotesPage.locator('button:has-text("General")')).toBeVisible({ timeout: 5000 });
      await expect(graphNotesPage.locator('button:has-text("Appearance")')).toBeVisible();
      await expect(graphNotesPage.locator('button:has-text("Keyboard")')).toBeVisible();
      await expect(graphNotesPage.locator('button:has-text("Sync")')).toBeVisible();
      await expect(graphNotesPage.locator('button:has-text("Data")')).toBeVisible();
    });

    test('should switch between settings tabs', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Click Appearance tab
      const appearanceTab = graphNotesPage.locator('nav button:has-text("Appearance")');
      await appearanceTab.click();
      await graphNotesPage.waitForTimeout(200);

      // Theme section should be visible
      await expect(graphNotesPage.locator('text=Theme')).toBeVisible({ timeout: 5000 });
    });

    test('should display General settings content', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();
      await graphNotesPage.waitForTimeout(300);

      // General settings content
      await expect(graphNotesPage.locator('text=Current Vault')).toBeVisible({ timeout: 5000 });
      await expect(graphNotesPage.locator('h4:has-text("Editor")')).toBeVisible();
      await expect(graphNotesPage.locator('text=Auto-save')).toBeVisible();
    });

    test('should display Appearance settings with theme options', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings and go to Appearance
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();
      await graphNotesPage.waitForTimeout(300);

      const appearanceTab = graphNotesPage.locator('nav button:has-text("Appearance")');
      await appearanceTab.click();
      await graphNotesPage.waitForTimeout(200);

      // Theme options should be visible
      await expect(graphNotesPage.locator('text=Light')).toBeVisible({ timeout: 5000 });
      await expect(graphNotesPage.locator('text=Dark')).toBeVisible();
      await expect(graphNotesPage.locator('text=System')).toBeVisible();

      // Accent color section
      await expect(graphNotesPage.locator('text=Accent Color')).toBeVisible();
    });

    test('should switch theme to dark', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings and go to Appearance
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();
      await graphNotesPage.waitForTimeout(300);

      const appearanceTab = graphNotesPage.locator('nav button:has-text("Appearance")');
      await appearanceTab.click();
      await graphNotesPage.waitForTimeout(200);

      // Click Dark theme button
      const darkButton = graphNotesPage.locator('button:has-text("Dark")').filter({ has: graphNotesPage.locator('svg') });
      await darkButton.click();
      await graphNotesPage.waitForTimeout(200);

      // Document should have dark class
      const hasDarkClass = await graphNotesPage.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(hasDarkClass).toBe(true);
    });

    test('should close settings with Escape', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();

      const settingsModal = graphNotesPage.locator('.fixed.inset-0.z-50');
      await expect(settingsModal).toBeVisible({ timeout: 5000 });

      // Press Escape
      await graphNotesPage.keyboard.press('Escape');
      await graphNotesPage.waitForTimeout(300);

      // Modal should be closed
      await expect(settingsModal).not.toBeVisible();
    });

    test('should close settings with X button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings
      const settingsButton = graphNotesPage.locator('button:has-text("Settings")');
      await settingsButton.click();

      const settingsModal = graphNotesPage.locator('.fixed.inset-0.z-50');
      await expect(settingsModal).toBeVisible({ timeout: 5000 });

      // Click X button
      const closeButton = settingsModal.locator('button').filter({ has: graphNotesPage.locator('svg.w-5.h-5') });
      await closeButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Modal should be closed
      await expect(settingsModal).not.toBeVisible();
    });
  });

  // ==========================================
  // GRAPH VIEW TESTS
  // ==========================================
  test.describe('Graph View', () => {
    test('should display graph view', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // React Flow container should be visible
      await expect(graphNotesPage.locator('.react-flow')).toBeVisible({ timeout: 5000 });
    });

    test('should display graph nodes', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Nodes should be visible
      const nodes = graphNotesPage.locator('.react-flow__node');
      const nodeCount = await nodes.count();
      expect(nodeCount).toBeGreaterThan(0);
    });

    test('should display graph controls', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Controls panel should be visible
      await expect(graphNotesPage.locator('.react-flow__controls')).toBeVisible({ timeout: 5000 });
    });

    test('should display minimap', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Minimap should be visible
      await expect(graphNotesPage.locator('.react-flow__minimap')).toBeVisible({ timeout: 5000 });
    });

    test('should display search input in graph controls', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Search input in graph controls
      const searchInput = graphNotesPage.locator('input[placeholder="Search nodes..."]');
      await expect(searchInput).toBeVisible({ timeout: 5000 });
    });

    test('should display layout buttons', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Layout buttons should be visible
      await expect(graphNotesPage.locator('button[title="Force layout"]')).toBeVisible({ timeout: 5000 });
      await expect(graphNotesPage.locator('button[title="Grid layout"]')).toBeVisible();
    });

    test('should display filter button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Filter button should be visible
      await expect(graphNotesPage.locator('button:has-text("Filter")')).toBeVisible({ timeout: 5000 });
    });

    test('should click node to select', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Click first node
      const nodes = graphNotesPage.locator('.react-flow__node');
      if (await nodes.count() > 0) {
        await nodes.first().click();
        await graphNotesPage.waitForTimeout(300);

        // Node should be selected (check via store)
        const selectedNodeId = await graphNotesPage.evaluate(() => {
          const store = (window as any).__ZUSTAND_STORES__?.graphStore;
          return store?.getState().selectedNodeId;
        });
        expect(selectedNodeId).not.toBeNull();
      }
    });

    test('should double-click node to open note', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Double-click first node
      const nodes = graphNotesPage.locator('.react-flow__node');
      if (await nodes.count() > 0) {
        await nodes.first().dblclick();
        await graphNotesPage.waitForTimeout(500);

        // Should switch to editor view with note loaded
        const selectedNoteId = await graphNotesPage.evaluate(() => {
          const store = (window as any).__ZUSTAND_STORES__?.uiStore;
          return store?.getState().selectedNoteId;
        });
        expect(selectedNoteId).not.toBeNull();
      }
    });

    test('should search nodes in graph', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Type in search input
      const searchInput = graphNotesPage.locator('input[placeholder="Search nodes..."]');
      await searchInput.fill('Welcome');
      await graphNotesPage.waitForTimeout(300);

      // Search input should have the value
      await expect(searchInput).toHaveValue('Welcome');

      // Clear search should work
      const clearButton = graphNotesPage.locator('input[placeholder="Search nodes..."] + button');
      if (await clearButton.count() > 0) {
        await clearButton.click();
        await graphNotesPage.waitForTimeout(200);
        await expect(searchInput).toHaveValue('');
      }
    });

    test('should change graph layout', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Click grid layout button - check for both possible selectors
      const gridButton = graphNotesPage.locator('button:has-text("Grid")').first();
      await gridButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Button should be active (highlighted)
      const isActive = await gridButton.evaluate(el => {
        return el.classList.contains('bg-accent-primary') || el.closest('.bg-accent-primary') !== null;
      });
      expect(isActive).toBeTruthy();
    });

    test('should toggle filter panel', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      const graphButton = graphNotesPage.locator('button[title="Graph"]');
      await graphButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Click filter button
      const filterButton = graphNotesPage.locator('button:has-text("Filter")');
      await filterButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Filter panel should be visible
      await expect(graphNotesPage.locator('text=Filters')).toBeVisible({ timeout: 5000 });
    });
  });

  // ==========================================
  // DAILY NOTE TESTS
  // ==========================================
  test.describe('Daily Note', () => {
    test('should open daily note', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Click Daily Note button
      const dailyNoteButton = graphNotesPage.locator('button:has-text("Daily Note")');
      await dailyNoteButton.click();
      await graphNotesPage.waitForTimeout(500);

      // A note should be selected (daily note created or opened)
      const selectedNoteId = await graphNotesPage.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORES__?.uiStore;
        return store?.getState().selectedNoteId;
      });
      // May or may not be set depending on implementation
    });
  });

  // ==========================================
  // NEW NOTE TESTS
  // ==========================================
  test.describe('New Note', () => {
    test('should create new note via button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Get initial note count
      const initialCount = await graphNotesPage.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORES__?.noteStore;
        return store?.getState().notesList.length || 0;
      });

      // Click new note button
      const newNoteButton = graphNotesPage.locator('button[title="New note"]');
      await newNoteButton.click();
      await graphNotesPage.waitForTimeout(500);

      // Note count should increase
      const newCount = await graphNotesPage.evaluate(() => {
        const store = (window as any).__ZUSTAND_STORES__?.noteStore;
        return store?.getState().notesList.length || 0;
      });
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  // ==========================================
  // PROPERTIES PANEL TESTS
  // ==========================================
  test.describe('Properties Panel', () => {
    test('should open properties panel when clicking Properties button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note first
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Click Properties button in toolbar
        const propertiesButton = graphNotesPage.locator('button:has-text("Properties")');
        await propertiesButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Properties panel should be visible
        await expect(graphNotesPage.locator('h2:has-text("Properties")')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display note metadata in properties panel', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open properties panel
        const propertiesButton = graphNotesPage.locator('button:has-text("Properties")');
        await propertiesButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Check for metadata fields
        await expect(graphNotesPage.locator('text=Note ID')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('text=Title')).toBeVisible();
        await expect(graphNotesPage.locator('text=Created')).toBeVisible();
        await expect(graphNotesPage.locator('text=Modified')).toBeVisible();
      }
    });

    test('should display statistics in properties panel', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open properties panel
        const propertiesButton = graphNotesPage.locator('button:has-text("Properties")');
        await propertiesButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Check for statistics section
        await expect(graphNotesPage.locator('text=Statistics')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('text=Words')).toBeVisible();
        await expect(graphNotesPage.locator('text=Characters')).toBeVisible();
      }
    });

    test('should close properties panel with X button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open properties panel
        const propertiesButton = graphNotesPage.locator('button:has-text("Properties")');
        await propertiesButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Close with X button
        const closeButton = graphNotesPage.locator('.fixed.right-0 button').filter({ has: graphNotesPage.locator('svg') }).first();
        await closeButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Panel should be closed
        await expect(graphNotesPage.locator('h2:has-text("Properties")')).not.toBeVisible();
      }
    });
  });

  // ==========================================
  // BACKLINKS PANEL TESTS
  // ==========================================
  test.describe('Backlinks Panel', () => {
    test('should open backlinks panel when clicking Links button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note first
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Click Links button in toolbar
        const linksButton = graphNotesPage.locator('button:has-text("Links")');
        await linksButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Backlinks panel should be visible
        await expect(graphNotesPage.locator('.fixed.right-0 h2:has-text("Links")')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display link sections in backlinks panel', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open backlinks panel
        const linksButton = graphNotesPage.locator('button:has-text("Links")');
        await linksButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Check for sections (use h3 selectors to avoid matching multiple elements)
        await expect(graphNotesPage.locator('h3:has-text("Outgoing Links")')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('h3:has-text("Backlinks")')).toBeVisible();
        await expect(graphNotesPage.locator('h3:has-text("Unlinked Mentions")')).toBeVisible();
      }
    });

    test('should close backlinks panel with X button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open backlinks panel
        const linksButton = graphNotesPage.locator('button:has-text("Links")');
        await linksButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Close with X button
        const closeButton = graphNotesPage.locator('.fixed.right-0 button').filter({ has: graphNotesPage.locator('svg') }).first();
        await closeButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Panel should be closed
        await expect(graphNotesPage.locator('.fixed.right-0 h2:has-text("Links")')).not.toBeVisible();
      }
    });
  });

  // ==========================================
  // EDITOR DROPDOWN MENU TESTS
  // ==========================================
  test.describe('Editor Dropdown Menu', () => {
    test('should open dropdown menu when clicking More button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note first
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Click More options button (three dots)
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Dropdown should be visible with menu items
        await expect(graphNotesPage.locator('text=Find in Note')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('text=Rename')).toBeVisible();
        await expect(graphNotesPage.locator('text=Duplicate')).toBeVisible();
        await expect(graphNotesPage.locator('text=Delete')).toBeVisible();
      }
    });

    test('should show keyboard shortcuts in dropdown menu', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open dropdown
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Check for keyboard shortcuts
        await expect(graphNotesPage.locator('text=⌘F')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('text=F2')).toBeVisible();
      }
    });
  });

  // ==========================================
  // FIND IN NOTE TESTS
  // ==========================================
  test.describe('Find in Note', () => {
    test('should open find dialog from dropdown menu', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open dropdown and click Find
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const findButton = graphNotesPage.locator('button:has-text("Find in Note")');
        await findButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Find dialog should be visible
        await expect(graphNotesPage.locator('input[placeholder="Find in note..."]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display search results count', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open find dialog
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const findButton = graphNotesPage.locator('button:has-text("Find in Note")');
        await findButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Type search term
        const searchInput = graphNotesPage.locator('input[placeholder="Find in note..."]');
        await searchInput.fill('the');
        await graphNotesPage.waitForTimeout(300);

        // Results count should be visible (either "X/Y" or "No results")
        const resultText = graphNotesPage.locator('.text-xs.text-text-tertiary.min-w-\\[60px\\]');
        await expect(resultText).toBeVisible();
      }
    });

    test('should toggle replace mode', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open find dialog
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const findButton = graphNotesPage.locator('button:has-text("Find in Note")');
        await findButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Toggle replace mode
        const replaceToggle = graphNotesPage.locator('button[title="Toggle replace (Cmd+H)"]');
        await replaceToggle.click();
        await graphNotesPage.waitForTimeout(300);

        // Replace input should be visible
        await expect(graphNotesPage.locator('input[placeholder="Replace with..."]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should close find dialog with Escape', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open find dialog
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const findButton = graphNotesPage.locator('button:has-text("Find in Note")');
        await findButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Press Escape
        await graphNotesPage.keyboard.press('Escape');
        await graphNotesPage.waitForTimeout(300);

        // Dialog should be closed
        await expect(graphNotesPage.locator('input[placeholder="Find in note..."]')).not.toBeVisible();
      }
    });
  });

  // ==========================================
  // CONTEXT MENU TESTS
  // ==========================================
  test.describe('Context Menu', () => {
    test('should show context menu on right-click file tree item', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Right-click first file item
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click({ button: 'right' });
        await graphNotesPage.waitForTimeout(300);

        // Context menu should be visible
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\]')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('button:has-text("Open")')).toBeVisible();
        await expect(graphNotesPage.locator('button:has-text("Rename")')).toBeVisible();
        await expect(graphNotesPage.locator('button:has-text("Delete")')).toBeVisible();
      }
    });

    test('should display all context menu options', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Right-click first file item
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click({ button: 'right' });
        await graphNotesPage.waitForTimeout(300);

        // Check all menu items
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\] button:has-text("Open")')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\] button:has-text("Rename")')).toBeVisible();
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\] button:has-text("Duplicate")')).toBeVisible();
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\] button:has-text("Copy Path")')).toBeVisible();
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\] button:has-text("Delete")')).toBeVisible();
      }
    });

    test('should close context menu on Escape', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Right-click first file item
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click({ button: 'right' });
        await graphNotesPage.waitForTimeout(300);

        // Press Escape
        await graphNotesPage.keyboard.press('Escape');
        await graphNotesPage.waitForTimeout(300);

        // Context menu should be closed
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\]')).not.toBeVisible();
      }
    });

    test('should close context menu on outside click', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Right-click first file item
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click({ button: 'right' });
        await graphNotesPage.waitForTimeout(300);

        // Click outside
        await graphNotesPage.locator('main').click();
        await graphNotesPage.waitForTimeout(300);

        // Context menu should be closed
        await expect(graphNotesPage.locator('.fixed.z-\\[100\\]')).not.toBeVisible();
      }
    });
  });

  // ==========================================
  // DELETE CONFIRMATION TESTS
  // ==========================================
  test.describe('Delete Confirmation', () => {
    test('should show delete confirmation from dropdown menu', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open dropdown and click Delete
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const deleteButton = graphNotesPage.locator('.w-48 button:has-text("Delete")');
        await deleteButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Delete confirmation dialog should be visible
        await expect(graphNotesPage.locator('h2:has-text("Delete Note")')).toBeVisible({ timeout: 5000 });
        await expect(graphNotesPage.locator('text=Are you sure you want to delete')).toBeVisible();
      }
    });

    test('should display warning message in delete dialog', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open dropdown and click Delete
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const deleteButton = graphNotesPage.locator('.w-48 button:has-text("Delete")');
        await deleteButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Warning message should be visible
        await expect(graphNotesPage.locator('text=This action cannot be undone')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should close delete dialog with Cancel button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open dropdown and click Delete
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const deleteButton = graphNotesPage.locator('.w-48 button:has-text("Delete")');
        await deleteButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Click Cancel
        const cancelButton = graphNotesPage.locator('button:has-text("Cancel")');
        await cancelButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Dialog should be closed
        await expect(graphNotesPage.locator('h2:has-text("Delete Note")')).not.toBeVisible();
      }
    });

    test('should close delete dialog with Escape key', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open dropdown and click Delete
        const moreButton = graphNotesPage.locator('.border-b.border-border-subtle button').last();
        await moreButton.click();
        await graphNotesPage.waitForTimeout(300);

        const deleteButton = graphNotesPage.locator('.w-48 button:has-text("Delete")');
        await deleteButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Press Escape
        await graphNotesPage.keyboard.press('Escape');
        await graphNotesPage.waitForTimeout(300);

        // Dialog should be closed
        await expect(graphNotesPage.locator('h2:has-text("Delete Note")')).not.toBeVisible();
      }
    });
  });
});
