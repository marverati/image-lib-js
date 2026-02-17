import { test, expect } from '@playwright/test';
import { editorPage, createUserSnippet } from './helpers';

test.describe('Auto-save', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('dirty marker appears when typing in user script', async ({ page }) => {
        await createUserSnippet(page, 'autosave-test');
        const titleEl = page.locator('[data-user-script="autosave-test"] .title');

        // Type something in the textarea
        const textarea = page.locator('#editor-textarea');
        await textarea.focus();
        await textarea.press('End');
        await textarea.type('// some change');

        // Dirty marker should appear
        await expect(titleEl).toContainText('*');
    });

    test('dirty marker clears after auto-save delay', async ({ page }) => {
        await createUserSnippet(page, 'autosave-delay');
        const titleEl = page.locator('[data-user-script="autosave-delay"] .title');

        const textarea = page.locator('#editor-textarea');
        await textarea.focus();
        await textarea.press('End');
        await textarea.type('// change');

        await expect(titleEl).toContainText('*');

        // Wait for the 800ms debounce + some margin
        await page.waitForTimeout(1200);
        const text = await titleEl.textContent();
        expect(text).not.toContain('*');
    });

    test('code persists after reload', async ({ page }) => {
        await createUserSnippet(page, 'persist-test');

        const textarea = page.locator('#editor-textarea');
        await textarea.focus();
        await page.keyboard.press('Control+a');
        await textarea.fill('// persisted code 12345');

        // Wait for auto-save
        await page.waitForTimeout(1200);

        // Reload and navigate back to the snippet
        await page.reload();
        await page.waitForSelector('#editor-textarea', { state: 'visible' });
        await page.waitForTimeout(500);

        // Click the user snippet
        const item = page.locator('[data-user-script="persist-test"]');
        await item.click();
        await page.waitForTimeout(300);

        const value = await page.locator('#editor-textarea').inputValue();
        expect(value).toContain('persisted code 12345');
    });
});
