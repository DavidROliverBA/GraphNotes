import { test, expect, VaultSelectorPage } from './fixtures/test-fixtures';

test.describe('Vault Operations', () => {
  test.describe('Vault Selector', () => {
    test('should show vault selector when no vault is open', async ({ graphNotesPage, waitForAppReady }) => {
      await waitForAppReady();

      const vaultSelector = new VaultSelectorPage(graphNotesPage);
      expect(await vaultSelector.isVisible()).toBe(true);
    });

    test('should display Open Vault and Create New Vault buttons', async ({ graphNotesPage, waitForAppReady }) => {
      await waitForAppReady();

      await expect(graphNotesPage.locator('button:has-text("Open Vault")')).toBeVisible();
      await expect(graphNotesPage.locator('button:has-text("Create New Vault")')).toBeVisible();
    });

    test('should display GraphNotes title', async ({ graphNotesPage, waitForAppReady }) => {
      await waitForAppReady();

      await expect(graphNotesPage.locator('h1:has-text("GraphNotes")')).toBeVisible();
    });
  });

  test.describe('Opening a Vault', () => {
    test('should open vault and show main layout', async ({ graphNotesPage, waitForAppReady, openTestVault }) => {
      await waitForAppReady();
      await openTestVault();

      // Should show the sidebar
      await expect(graphNotesPage.locator('text=Quick Access')).toBeVisible();

      // Should show the vault name in sidebar
      await expect(graphNotesPage.locator('text=test-vault')).toBeVisible();
    });

    test('should show files from the vault in file tree', async ({ graphNotesPage, waitForAppReady, openTestVault }) => {
      await waitForAppReady();
      await openTestVault();

      // Wait for file tree to populate
      await graphNotesPage.waitForTimeout(1000);

      // Should show the Welcome note
      await expect(graphNotesPage.locator('text=Welcome')).toBeVisible();

      // Should show the Test Note
      await expect(graphNotesPage.locator('text=Test Note')).toBeVisible();
    });

    test('should show editor placeholder when no note is selected', async ({
      graphNotesPage,
      waitForAppReady,
      openTestVault,
    }) => {
      await waitForAppReady();
      await openTestVault();

      // Should show "No note selected" message
      await expect(graphNotesPage.locator('text=No note selected')).toBeVisible();
    });
  });

  test.describe('Vault Navigation', () => {
    test('should select a note and show it in editor', async ({
      graphNotesPage,
      waitForAppReady,
      openTestVault,
    }) => {
      await waitForAppReady();
      await openTestVault();

      // Click on the Welcome note
      await graphNotesPage.click('text=Welcome');

      // Wait for editor to load
      await graphNotesPage.waitForSelector('.editor-container', { timeout: 5000 });

      // Editor should be visible
      await expect(graphNotesPage.locator('.editor-container')).toBeVisible();
    });

    test('should switch between notes', async ({ graphNotesPage, waitForAppReady, openTestVault }) => {
      await waitForAppReady();
      await openTestVault();

      // Click on Welcome note
      await graphNotesPage.click('text=Welcome');
      await graphNotesPage.waitForSelector('.editor-container', { timeout: 5000 });

      // Click on Test Note
      await graphNotesPage.click('text=Test Note');
      await graphNotesPage.waitForTimeout(500);

      // Editor should still be visible
      await expect(graphNotesPage.locator('.editor-container')).toBeVisible();
    });
  });
});
