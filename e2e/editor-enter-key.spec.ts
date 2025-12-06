import { test, expect } from './fixtures/test-fixtures';

test.describe('Editor Enter Key', () => {
  test('should create new line when pressing Enter', async ({ graphNotesPage, openTestVault }) => {
    await openTestVault();

    // Click new note
    await graphNotesPage.click('button[title="New note"]');
    await graphNotesPage.waitForSelector('.editor-container', { timeout: 5000 });
    await graphNotesPage.waitForTimeout(500);

    // Focus the editor
    const editor = graphNotesPage.locator('.yoopta-editor [contenteditable="true"]').first();
    await editor.click();
    await graphNotesPage.waitForTimeout(300);

    // Type some text
    await graphNotesPage.keyboard.type('First line');
    await graphNotesPage.waitForTimeout(200);

    // Count blocks before pressing Enter
    const blocksBefore = await graphNotesPage.locator('[data-yoopta-block]').count();

    // Press Enter to create a new line
    await graphNotesPage.keyboard.press('Enter');
    await graphNotesPage.waitForTimeout(500);

    // Type on the new line
    await graphNotesPage.keyboard.type('Second line');
    await graphNotesPage.waitForTimeout(200);

    // Count blocks after pressing Enter
    const blocksAfter = await graphNotesPage.locator('[data-yoopta-block]').count();

    // Should have more blocks after pressing Enter
    expect(blocksAfter).toBeGreaterThan(blocksBefore);

    // Verify both lines exist in the editor
    const editorText = await graphNotesPage.locator('.yoopta-editor').textContent();
    expect(editorText).toContain('First line');
    expect(editorText).toContain('Second line');
  });

  test('should create new paragraph block on Enter', async ({ graphNotesPage, openTestVault }) => {
    await openTestVault();

    // Click new note
    await graphNotesPage.click('button[title="New note"]');
    await graphNotesPage.waitForSelector('.editor-container', { timeout: 5000 });
    await graphNotesPage.waitForTimeout(500);

    // Focus the editor
    const editor = graphNotesPage.locator('.yoopta-editor [contenteditable="true"]').first();
    await editor.click();
    await graphNotesPage.waitForTimeout(300);

    // Type text and press Enter multiple times
    await graphNotesPage.keyboard.type('Line 1');
    await graphNotesPage.keyboard.press('Enter');
    await graphNotesPage.waitForTimeout(300);

    await graphNotesPage.keyboard.type('Line 2');
    await graphNotesPage.keyboard.press('Enter');
    await graphNotesPage.waitForTimeout(300);

    await graphNotesPage.keyboard.type('Line 3');
    await graphNotesPage.waitForTimeout(300);

    // Should have at least 3 blocks
    const blocks = await graphNotesPage.locator('[data-yoopta-block]').count();
    expect(blocks).toBeGreaterThanOrEqual(3);
  });

  test('should maintain cursor position after Enter', async ({ graphNotesPage, openTestVault }) => {
    await openTestVault();

    // Click new note
    await graphNotesPage.click('button[title="New note"]');
    await graphNotesPage.waitForSelector('.editor-container', { timeout: 5000 });
    await graphNotesPage.waitForTimeout(500);

    // Focus the editor
    const editor = graphNotesPage.locator('.yoopta-editor [contenteditable="true"]').first();
    await editor.click();
    await graphNotesPage.waitForTimeout(300);

    // Type, press Enter, and type more
    await graphNotesPage.keyboard.type('Before');
    await graphNotesPage.keyboard.press('Enter');
    await graphNotesPage.waitForTimeout(300);
    await graphNotesPage.keyboard.type('After');
    await graphNotesPage.waitForTimeout(300);

    // The text "After" should be in the editor (cursor was on new line)
    const editorText = await graphNotesPage.locator('.yoopta-editor').textContent();
    expect(editorText).toContain('After');
  });
});
