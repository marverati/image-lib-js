import { test, expect } from '@playwright/test';
import { editorPage, selectExample, createUserSnippet } from './helpers';

test.describe('Script Selection', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('select example loads code into textarea', async ({ page }) => {
        await selectExample(page, 'checkerBoard');
        const value = await page.locator('#editor-textarea').inputValue();
        expect(value.length).toBeGreaterThan(10);
        expect(value).toContain('gen');
    });

    test('selecting different example changes textarea content', async ({ page }) => {
        await selectExample(page, 'checkerBoard');
        const code1 = await page.locator('#editor-textarea').inputValue();

        await selectExample(page, 'randomNoise');
        const code2 = await page.locator('#editor-textarea').inputValue();

        expect(code1).not.toEqual(code2);
    });

    test('textarea is read-only for examples', async ({ page }) => {
        await selectExample(page, 'checkerBoard');
        const readOnly = await page.locator('#editor-textarea').getAttribute('readonly');
        expect(readOnly).not.toBeNull();
    });

    test('Make a Copy button appears for examples', async ({ page }) => {
        await selectExample(page, 'checkerBoard');
        await expect(page.locator('#make-copy-btn')).toBeVisible();
    });

    test('Make a Copy creates writable user script', async ({ page }) => {
        await selectExample(page, 'checkerBoard');
        await page.locator('#make-copy-btn').click();
        await page.waitForTimeout(300);

        // Textarea should be writable now
        const readOnly = await page.locator('#editor-textarea').getAttribute('readonly');
        expect(readOnly).toBeNull();

        // Make a Copy button should be gone
        await expect(page.locator('#make-copy-btn')).not.toBeVisible();

        // Title should update to reflect the user script (with "User script" origin)
        const docTitle = await page.title();
        expect(docTitle).toContain('User script');
    });

    test('row highlighting switches between items', async ({ page }) => {
        await selectExample(page, 'checkerBoard');
        const items = page.locator('.tree-item.selected');
        const firstText = await items.first().textContent();
        expect(firstText).toContain('checkerBoard');

        await selectExample(page, 'randomNoise');
        // Previous should lose .selected
        const selected = page.locator('.tree-item.selected');
        await expect(selected).toHaveCount(1);
        const secondText = await selected.first().textContent();
        expect(secondText).toContain('randomNoise');
    });

    test('script title updates on selection', async ({ page }) => {
        await selectExample(page, 'randomNoise');
        const title = page.locator('#current-script-title');
        await expect(title).not.toHaveClass(/hidden/);
        const text = await title.textContent();
        // randomNoise → "Random Noise" (title-cased with spaces)
        expect(text).toMatch(/random\s*noise/i);
    });

    test('document title updates on selection', async ({ page }) => {
        await selectExample(page, 'randomNoise');
        const docTitle = await page.title();
        expect(docTitle).toContain('Example');
        expect(docTitle).toMatch(/random\s*noise/i);
    });

    test('delete user snippet with confirm', async ({ page }) => {
        await createUserSnippet(page, 'to-delete');
        const item = page.locator('[data-user-script="to-delete"]');
        await expect(item).toBeVisible();

        // Accept confirm dialog
        page.once('dialog', async (dialog) => {
            expect(dialog.type()).toBe('confirm');
            await dialog.accept();
        });
        await item.locator('.trash').click();
        await page.waitForTimeout(200);

        await expect(item).not.toBeVisible();
    });

    test('cancel delete keeps snippet', async ({ page }) => {
        await createUserSnippet(page, 'keep-me');
        const item = page.locator('[data-user-script="keep-me"]');

        page.once('dialog', async (dialog) => {
            await dialog.dismiss();
        });
        await item.locator('.trash').click();
        await page.waitForTimeout(200);

        await expect(item).toBeVisible();
    });
});
