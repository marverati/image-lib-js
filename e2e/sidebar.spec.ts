import { test, expect } from '@playwright/test';
import { editorPage, createUserSnippet } from './helpers';

test.describe('Sidebar & File Tree', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('sidebar toggle collapses and expands', async ({ page }) => {
        const container = page.locator('#file-tree-container');
        await expect(container).not.toHaveClass(/collapsed/);

        await page.locator('#file-tree-toggle').click();
        await expect(container).toHaveClass(/collapsed/);

        await page.locator('#file-tree-toggle').click();
        await expect(container).not.toHaveClass(/collapsed/);
    });

    test('sidebar state persists across reload', async ({ page }) => {
        // Collapse
        await page.locator('#file-tree-toggle').click();
        await expect(page.locator('#file-tree-container')).toHaveClass(/collapsed/);

        // Reload
        await page.reload();
        await page.waitForSelector('#editor-textarea', { state: 'visible' });
        await expect(page.locator('#file-tree-container')).toHaveClass(/collapsed/);

        // Expand and verify persists
        await page.locator('#file-tree-toggle').click();
        await page.reload();
        await page.waitForSelector('#editor-textarea', { state: 'visible' });
        await expect(page.locator('#file-tree-container')).not.toHaveClass(/collapsed/);
    });

    test('section collapse and expand', async ({ page }) => {
        // Click the User section header to collapse it
        const userHeader = page.locator('.tree-section-header').first();
        const userArrow = userHeader.locator('.arrow');
        await expect(userArrow).toHaveText('▾');

        await userHeader.click();
        await expect(userArrow).toHaveText('▸');

        // Click again to expand
        await userHeader.click();
        await expect(userArrow).toHaveText('▾');
    });

    test('all three sections visible', async ({ page }) => {
        const headers = page.locator('.tree-section-header');
        await expect(headers).toHaveCount(3);

        const texts = await headers.allTextContents();
        expect(texts.some(t => t.includes('User'))).toBeTruthy();
        expect(texts.some(t => t.includes('Public'))).toBeTruthy();
        expect(texts.some(t => t.includes('Examples'))).toBeTruthy();
    });

    test('examples section lists known examples', async ({ page }) => {
        const examplesSection = page.locator('#file-tree-list > div').nth(2);
        const items = examplesSection.locator('.tree-item');
        const count = await items.count();
        expect(count).toBeGreaterThanOrEqual(15);

        const allText = await examplesSection.textContent();
        expect(allText).toContain('checkerBoard');
        expect(allText).toContain('randomNoise');
        expect(allText).toContain('juliaFractal');
    });

    test('public section lists scripts', async ({ page }) => {
        const publicSection = page.locator('#file-tree-list > div').nth(1);
        const allText = await publicSection.textContent();
        expect(allText).toContain('add-outline');
        expect(allText).toContain('white-correction');
    });

    test('new snippet button is visible', async ({ page }) => {
        const addBtn = page.locator('.add-btn');
        await expect(addBtn).toBeVisible();
        await expect(addBtn).toHaveText('+');
    });

    test('create new snippet via dialog', async ({ page }) => {
        await createUserSnippet(page, 'test-snippet');

        // Verify item appears in the User section
        const userItem = page.locator('[data-user-script="test-snippet"]');
        await expect(userItem).toBeVisible();
        await expect(userItem).toHaveClass(/selected/);
    });
});
