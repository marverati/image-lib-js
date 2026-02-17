import { test, expect } from '@playwright/test';
import { editorPage, typeAndRun } from './helpers';

test.describe('Documentation Mode & Help', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('toggle docu mode on and off', async ({ page }) => {
        const body = page.locator('body');
        await expect(body).not.toHaveClass(/docu-mode/);

        await page.locator('#editor-docu-toggle').click();
        await expect(body).toHaveClass(/docu-mode/);

        await page.locator('#editor-docu-toggle').click();
        await expect(body).not.toHaveClass(/docu-mode/);
    });

    test('docu content from //> lines', async ({ page }) => {
        await typeAndRun(page, '//> Hello World\n//> Second line\ngen((x,y) => 128, 4, 4)');
        await page.locator('#editor-docu-toggle').click();

        const docu = page.locator('#editor-docu');
        await expect(docu).toContainText('Hello World');
        await expect(docu).toContainText('Second line');
    });

    test('empty docu state when no //> lines', async ({ page }) => {
        await typeAndRun(page, 'gen((x,y) => 128, 4, 4)');
        await page.locator('#editor-docu-toggle').click();

        const docu = page.locator('#editor-docu');
        await expect(docu).toHaveClass(/docu-empty-state/);
        await expect(docu).toContainText('No documentation provided');
    });

    test('F1 opens help overlay', async ({ page }) => {
        const overlay = page.locator('.help-overlay');
        await expect(overlay).toHaveClass(/hidden/);

        await page.keyboard.press('F1');
        await expect(overlay).not.toHaveClass(/hidden/);
    });

    test('Escape closes help overlay', async ({ page }) => {
        await page.keyboard.press('F1');
        await expect(page.locator('.help-overlay')).not.toHaveClass(/hidden/);

        await page.keyboard.press('Escape');
        await expect(page.locator('.help-overlay')).toHaveClass(/hidden/);
    });

    test('clicking outside closes help overlay', async ({ page }) => {
        await page.keyboard.press('F1');
        await expect(page.locator('.help-overlay')).not.toHaveClass(/hidden/);

        // Click on the body outside the overlay
        await page.locator('body').click({ position: { x: 5, y: 5 } });
        await expect(page.locator('.help-overlay')).toHaveClass(/hidden/);
    });
});
