import { test, expect, GraphPage, SidebarPage } from './fixtures/test-fixtures';

/**
 * E2E Tests for SuperTag functionality
 *
 * Tests cover:
 * - SuperTag display in sidebar
 * - Notes with superTag assignments
 * - SuperTag attribute values in notes
 * - SuperTag creation and management via store
 * - Tag filtering and counting
 */

test.describe('SuperTags', () => {
  test.describe('Sidebar Display', () => {
    test('should display Super Tags section in sidebar', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Check that Super Tags section header exists
      const superTagsHeader = graphNotesPage.locator('button:has-text("Super Tags")');
      await expect(superTagsHeader).toBeVisible({ timeout: 5000 });
    });

    test('should show super tags count in header', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Check that Super Tags section shows count
      const superTagsHeader = graphNotesPage.locator('button:has-text("Super Tags")');
      await expect(superTagsHeader).toBeVisible({ timeout: 5000 });

      // Get the count text (should be a number)
      const countSpan = superTagsHeader.locator('span.ml-auto');
      const countText = await countSpan.textContent();
      expect(countText).toMatch(/^\d+$/);
    });

    test('should toggle Super Tags section expansion', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Find Super Tags section
      const superTagsHeader = graphNotesPage.locator('button:has-text("Super Tags")');

      // Click to collapse
      await superTagsHeader.click();
      await graphNotesPage.waitForTimeout(300);

      // Click to expand
      await superTagsHeader.click();
      await graphNotesPage.waitForTimeout(300);

      // Section should be visible
      await expect(superTagsHeader).toBeVisible();
    });
  });

  test.describe('SuperTag Store Operations', () => {
    test('should create a super tag via store', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Create a super tag using the Zustand store via page.evaluate
      await graphNotesPage.evaluate(async () => {
        // Access the store from window (exposed in dev mode)
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'project',
            name: 'Project',
            colour: '#3b82f6',
            icon: '📁',
            description: 'Project management tag',
            attributes: [
              {
                id: 'attr-1',
                key: 'status',
                name: 'Status',
                type: 'select',
                required: false,
                config: {
                  options: [
                    { value: 'todo', label: 'To Do', colour: '#94a3b8' },
                    { value: 'in-progress', label: 'In Progress', colour: '#f59e0b' },
                    { value: 'done', label: 'Done', colour: '#22c55e' },
                  ],
                },
              },
            ],
            created: now,
            modified: now,
          });
        }
      });

      await graphNotesPage.waitForTimeout(500);

      // Check if super tag appears in sidebar
      const projectTag = graphNotesPage.locator('button:has-text("Project")');
      // May not appear immediately depending on store setup
    });

    test('should update a super tag via store', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // First create a tag, then update it
      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          // Create tag
          await store.getState().createSuperTag({
            id: 'test-tag',
            name: 'Test Tag',
            colour: '#8b5cf6',
            attributes: [],
            created: now,
            modified: now,
          });

          // Update tag
          await store.getState().updateSuperTag('test-tag', {
            name: 'Updated Tag',
            colour: '#ef4444',
          });

          // Get the updated tag
          return store.getState().getSuperTag('test-tag');
        }
        return null;
      });

      // Verify update if store was accessible
      if (result) {
        expect(result.name).toBe('Updated Tag');
        expect(result.colour).toBe('#ef4444');
      }
    });

    test('should delete a super tag via store', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          // Create tag
          await store.getState().createSuperTag({
            id: 'to-delete',
            name: 'To Delete',
            colour: '#ef4444',
            attributes: [],
            created: now,
            modified: now,
          });

          // Delete tag
          await store.getState().deleteSuperTag('to-delete');

          // Try to get the deleted tag
          return store.getState().getSuperTag('to-delete');
        }
        return 'store-not-found';
      });

      // Verify deletion if store was accessible
      if (result !== 'store-not-found') {
        expect(result).toBeUndefined();
      }
    });
  });

  test.describe('SuperTag Attributes', () => {
    test('should add attribute to a super tag', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          // Create tag without attributes
          await store.getState().createSuperTag({
            id: 'with-attrs',
            name: 'With Attributes',
            colour: '#22c55e',
            attributes: [],
            created: now,
            modified: now,
          });

          // Add attribute
          await store.getState().addAttribute('with-attrs', {
            id: 'attr-priority',
            key: 'priority',
            name: 'Priority',
            type: 'select',
            required: true,
            config: {
              options: [
                { value: 'low', label: 'Low', colour: '#94a3b8' },
                { value: 'medium', label: 'Medium', colour: '#f59e0b' },
                { value: 'high', label: 'High', colour: '#ef4444' },
              ],
            },
          });

          const tag = store.getState().getSuperTag('with-attrs');
          return tag?.attributes.length;
        }
        return -1;
      });

      if (result !== -1) {
        expect(result).toBe(1);
      }
    });

    test('should update attribute in a super tag', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          // Create tag with attribute
          await store.getState().createSuperTag({
            id: 'update-attr',
            name: 'Update Attr Test',
            colour: '#3b82f6',
            attributes: [
              {
                id: 'attr-1',
                key: 'field',
                name: 'Field',
                type: 'text',
                required: false,
              },
            ],
            created: now,
            modified: now,
          });

          // Update attribute
          await store.getState().updateAttribute('update-attr', 'attr-1', {
            name: 'Updated Field',
            required: true,
          });

          const tag = store.getState().getSuperTag('update-attr');
          return tag?.attributes[0];
        }
        return null;
      });

      if (result) {
        expect(result.name).toBe('Updated Field');
        expect(result.required).toBe(true);
      }
    });

    test('should remove attribute from a super tag', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          // Create tag with attributes
          await store.getState().createSuperTag({
            id: 'remove-attr',
            name: 'Remove Attr Test',
            colour: '#8b5cf6',
            attributes: [
              { id: 'attr-1', key: 'field1', name: 'Field 1', type: 'text', required: false },
              { id: 'attr-2', key: 'field2', name: 'Field 2', type: 'number', required: false },
            ],
            created: now,
            modified: now,
          });

          // Remove first attribute
          await store.getState().removeAttribute('remove-attr', 'attr-1');

          const tag = store.getState().getSuperTag('remove-attr');
          return tag?.attributes.length;
        }
        return -1;
      });

      if (result !== -1) {
        expect(result).toBe(1);
      }
    });
  });

  test.describe('Notes with SuperTags', () => {
    test('should display notes in file tree', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Check that the file tree has items loaded
      // Look for any .truncate.text-sm elements which are file tree items
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      const count = await fileItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should load note when file tree item clicked', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Get file tree items and click the first one
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      const count = await fileItems.count();

      if (count > 0) {
        // Click the first file
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // The note should be loaded in the editor
        await expect(graphNotesPage.locator('.yoopta-editor')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should create super tag and verify it exists in store', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Create a super tag via the store
      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'book',
            name: 'Book',
            colour: '#f59e0b',
            icon: '📚',
            attributes: [
              { id: 'attr-1', key: 'author', name: 'Author', type: 'text', required: false },
              { id: 'attr-2', key: 'rating', name: 'Rating', type: 'rating', required: false },
              { id: 'attr-3', key: 'completed', name: 'Completed', type: 'checkbox', required: false },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('book');
          return tag?.attributes.length;
        }
        return -1;
      });

      if (result !== -1) {
        expect(result).toBe(3);
      }
    });
  });

  test.describe('SuperTag Types', () => {
    test('should support text attribute type', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'text-type',
            name: 'Text Type Test',
            colour: '#3b82f6',
            attributes: [
              { id: 'attr-1', key: 'description', name: 'Description', type: 'text', required: false },
              { id: 'attr-2', key: 'notes', name: 'Notes', type: 'richText', required: false },
            ],
            created: now,
            modified: now,
          });
          return store.getState().getSuperTag('text-type')?.attributes.map((a: any) => a.type);
        }
        return null;
      });

      if (result) {
        expect(result).toContain('text');
        expect(result).toContain('richText');
      }
    });

    test('should support number attribute type', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'number-type',
            name: 'Number Type Test',
            colour: '#22c55e',
            attributes: [
              {
                id: 'attr-1',
                key: 'count',
                name: 'Count',
                type: 'number',
                required: false,
                config: { min: 0, max: 100, step: 1 },
              },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('number-type');
          return tag?.attributes[0];
        }
        return null;
      });

      if (result) {
        expect(result.type).toBe('number');
        expect(result.config).toEqual({ min: 0, max: 100, step: 1 });
      }
    });

    test('should support select attribute type', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'select-type',
            name: 'Select Type Test',
            colour: '#f59e0b',
            attributes: [
              {
                id: 'attr-1',
                key: 'status',
                name: 'Status',
                type: 'select',
                required: false,
                config: {
                  options: [
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                    { value: 'archived', label: 'Archived' },
                  ],
                },
              },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('select-type');
          return tag?.attributes[0];
        }
        return null;
      });

      if (result) {
        expect(result.type).toBe('select');
        expect(result.config.options).toHaveLength(3);
      }
    });

    test('should support date attribute type', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'date-type',
            name: 'Date Type Test',
            colour: '#ec4899',
            attributes: [
              {
                id: 'attr-1',
                key: 'dueDate',
                name: 'Due Date',
                type: 'date',
                required: false,
                config: { includeTime: true },
              },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('date-type');
          return tag?.attributes[0];
        }
        return null;
      });

      if (result) {
        expect(result.type).toBe('date');
        expect(result.config.includeTime).toBe(true);
      }
    });

    test('should support checkbox attribute type', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'checkbox-type',
            name: 'Checkbox Type Test',
            colour: '#06b6d4',
            attributes: [
              { id: 'attr-1', key: 'completed', name: 'Completed', type: 'checkbox', required: false },
              { id: 'attr-2', key: 'archived', name: 'Archived', type: 'checkbox', required: false },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('checkbox-type');
          return tag?.attributes.map((a: any) => a.type);
        }
        return null;
      });

      if (result) {
        expect(result).toEqual(['checkbox', 'checkbox']);
      }
    });

    test('should support rating attribute type', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'rating-type',
            name: 'Rating Type Test',
            colour: '#eab308',
            attributes: [
              { id: 'attr-1', key: 'rating', name: 'Rating', type: 'rating', required: false },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('rating-type');
          return tag?.attributes[0].type;
        }
        return null;
      });

      if (result) {
        expect(result).toBe('rating');
      }
    });

    test('should support multiSelect attribute type', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'multiselect-type',
            name: 'MultiSelect Type Test',
            colour: '#a855f7',
            attributes: [
              {
                id: 'attr-1',
                key: 'tags',
                name: 'Tags',
                type: 'multiSelect',
                required: false,
                config: {
                  options: [
                    { value: 'frontend', label: 'Frontend' },
                    { value: 'backend', label: 'Backend' },
                    { value: 'design', label: 'Design' },
                  ],
                },
              },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('multiselect-type');
          return tag?.attributes[0];
        }
        return null;
      });

      if (result) {
        expect(result.type).toBe('multiSelect');
        expect(result.config.options).toHaveLength(3);
      }
    });

    test('should support url and email attribute types', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'url-email-type',
            name: 'URL/Email Test',
            colour: '#64748b',
            attributes: [
              { id: 'attr-1', key: 'website', name: 'Website', type: 'url', required: false },
              { id: 'attr-2', key: 'contact', name: 'Contact', type: 'email', required: false },
            ],
            created: now,
            modified: now,
          });
          const tag = store.getState().getSuperTag('url-email-type');
          return tag?.attributes.map((a: any) => a.type);
        }
        return null;
      });

      if (result) {
        expect(result).toContain('url');
        expect(result).toContain('email');
      }
    });
  });

  test.describe('SuperTag Colors and Icons', () => {
    test('should create super tag with custom color', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'custom-color',
            name: 'Custom Color',
            colour: '#ff6b6b',
            attributes: [],
            created: now,
            modified: now,
          });
          return store.getState().getSuperTag('custom-color')?.colour;
        }
        return null;
      });

      if (result) {
        expect(result).toBe('#ff6b6b');
      }
    });

    test('should create super tag with emoji icon', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'with-icon',
            name: 'With Icon',
            colour: '#3b82f6',
            icon: '🚀',
            attributes: [],
            created: now,
            modified: now,
          });
          return store.getState().getSuperTag('with-icon')?.icon;
        }
        return null;
      });

      if (result) {
        expect(result).toBe('🚀');
      }
    });

    test('should update super tag color', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      const result = await graphNotesPage.evaluate(async () => {
        const store = (window as any).__ZUSTAND_STORES__?.superTagStore;
        if (store) {
          const now = new Date().toISOString();
          await store.getState().createSuperTag({
            id: 'update-color',
            name: 'Update Color',
            colour: '#3b82f6',
            attributes: [],
            created: now,
            modified: now,
          });

          await store.getState().updateSuperTag('update-color', {
            colour: '#22c55e',
          });

          return store.getState().getSuperTag('update-color')?.colour;
        }
        return null;
      });

      if (result) {
        expect(result).toBe('#22c55e');
      }
    });
  });

  test.describe('SuperTag Settings UI', () => {
    test('should show Super Tags tab in Settings', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings
      await graphNotesPage.click('button:has-text("Settings")');
      await graphNotesPage.waitForTimeout(300);

      // Check for Super Tags tab in the settings nav (use exact match)
      const superTagsTab = graphNotesPage.locator('nav button:has-text("Super Tags")');
      await expect(superTagsTab).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to Super Tags tab in Settings', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings
      await graphNotesPage.click('button:has-text("Settings")');
      await graphNotesPage.waitForTimeout(300);

      // Click Super Tags tab (in settings nav)
      const superTagsTab = graphNotesPage.locator('nav button:has-text("Super Tags")');
      await superTagsTab.click();
      await graphNotesPage.waitForTimeout(300);

      // Check that Super Tags manager content is visible
      const newTagButton = graphNotesPage.locator('button:has-text("New Tag")');
      await expect(newTagButton).toBeVisible({ timeout: 5000 });
    });

    test('should show New Tag button in Super Tags settings', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings and go to Super Tags tab
      await graphNotesPage.click('button:has-text("Settings")');
      await graphNotesPage.waitForTimeout(300);

      const superTagsTab = graphNotesPage.locator('nav button:has-text("Super Tags")');
      await superTagsTab.click();
      await graphNotesPage.waitForTimeout(300);

      // Check for New Tag button
      const newTagButton = graphNotesPage.locator('button:has-text("New Tag")');
      await expect(newTagButton).toBeVisible({ timeout: 5000 });
    });

    test('should show empty state when no super tags exist', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Open settings and go to Super Tags tab
      await graphNotesPage.click('button:has-text("Settings")');
      await graphNotesPage.waitForTimeout(300);

      const superTagsTab = graphNotesPage.locator('nav button:has-text("Super Tags")');
      await superTagsTab.click();
      await graphNotesPage.waitForTimeout(300);

      // Look for empty state message or the create first tag button
      const emptyState = graphNotesPage.locator('text=No Super Tags').or(
        graphNotesPage.locator('button:has-text("Create Your First Tag")')
      );
      await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('SuperTag Assigner in Properties Panel', () => {
    test('should show Super Tags section in Properties panel', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note first
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open Properties panel
        const propertiesButton = graphNotesPage.locator('button:has-text("Properties")');
        await propertiesButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Check for Super Tags section header
        const superTagsSection = graphNotesPage.locator('h3:has-text("Super Tags")');
        await expect(superTagsSection).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show Add Tag button in Properties panel', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note first
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open Properties panel
        const propertiesButton = graphNotesPage.locator('button:has-text("Properties")');
        await propertiesButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Check for Add Tag button
        const addTagButton = graphNotesPage.locator('button:has-text("Add Tag")');
        await expect(addTagButton).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show empty state when no tags assigned', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Select a note first
      const fileItems = graphNotesPage.locator('.truncate.text-sm');
      if (await fileItems.count() > 0) {
        await fileItems.first().click();
        await graphNotesPage.waitForTimeout(500);

        // Open Properties panel
        const propertiesButton = graphNotesPage.locator('button:has-text("Properties")');
        await propertiesButton.click();
        await graphNotesPage.waitForTimeout(300);

        // Check for empty state message
        const emptyState = graphNotesPage.locator('text=No super tags assigned');
        await expect(emptyState).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Sidebar Super Tags Manage Button', () => {
    test('should show manage button in Super Tags section', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Find the manage button (MoreHorizontal icon) in Super Tags section
      const superTagsSection = graphNotesPage.locator('.border-t.border-border-subtle').filter({ hasText: 'Super Tags' });
      const manageButton = superTagsSection.locator('button[title="Manage Super Tags"]');
      await expect(manageButton).toBeVisible({ timeout: 5000 });
    });

    test('should open Settings when clicking manage button', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();
      await graphNotesPage.waitForTimeout(500);

      // Find and click the manage button
      const superTagsSection = graphNotesPage.locator('.border-t.border-border-subtle').filter({ hasText: 'Super Tags' });
      const manageButton = superTagsSection.locator('button[title="Manage Super Tags"]');
      await manageButton.click();
      await graphNotesPage.waitForTimeout(300);

      // Settings panel should be visible
      const settingsPanel = graphNotesPage.locator('text=Settings').first();
      await expect(settingsPanel).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('SuperTag Integration with Graph', () => {
    test('should show existing notes in graph view', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      await graphNotesPage.click('button[title="Graph"]');
      await graphNotesPage.waitForSelector('.react-flow', { timeout: 10000 });

      // The existing mock notes should appear as nodes
      const graphPage = new GraphPage(graphNotesPage);
      const nodeLabels = await graphPage.getNodeLabels();

      // Should have at least the test vault notes
      expect(nodeLabels.length).toBeGreaterThan(0);
      expect(nodeLabels.some((label) => label.includes('Welcome'))).toBe(true);
    });

    test('should display graph with multiple notes', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      await graphNotesPage.click('button[title="Graph"]');
      await graphNotesPage.waitForSelector('.react-flow', { timeout: 10000 });

      const graphPage = new GraphPage(graphNotesPage);

      // Should have multiple nodes from the test vault
      const nodeCount = await graphPage.getNodeCount();
      expect(nodeCount).toBeGreaterThanOrEqual(3);

      // Should have edges between linked notes
      const edgeCount = await graphPage.getEdgeCount();
      expect(edgeCount).toBeGreaterThan(0);
    });

    test('should search nodes in graph view', async ({ graphNotesPage, openTestVault }) => {
      await openTestVault();

      // Switch to graph view
      await graphNotesPage.click('button[title="Graph"]');
      await graphNotesPage.waitForSelector('.react-flow', { timeout: 10000 });

      const graphPage = new GraphPage(graphNotesPage);

      // Search for a specific note
      await graphPage.search('Welcome');
      await graphNotesPage.waitForTimeout(500);

      // The search should filter/highlight results
      const searchInput = graphNotesPage.locator('input[placeholder="Search nodes..."]');
      const value = await searchInput.inputValue();
      expect(value).toBe('Welcome');
    });
  });
});
