import { test, expect } from '@playwright/test';
import { selectExample } from './helpers';

test.describe('Deep Linking', () => {
    test('example deep link loads script and activates docu mode', async ({ page }) => {
        await page.goto('/?script=examples:randomNoise');
        await page.waitForSelector('#editor-textarea', { state: 'visible' });

        const value = await page.locator('#editor-textarea').inputValue();
        expect(value.length).toBeGreaterThan(10);
        await expect(page.locator('body')).toHaveClass(/docu-mode/);
    });

    test('invalid deep link shows alert', async ({ page }) => {
        let alertMessage = '';
        page.on('dialog', async (dialog) => {
            alertMessage = dialog.message();
            await dialog.accept();
        });

        await page.goto('/?script=examples:doesNotExist');
        await page.waitForSelector('#editor-textarea', { state: 'visible' });
        await page.waitForTimeout(500);

        expect(alertMessage).toContain('could not be found');
    });

    test('URL updates on script selection', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#editor-textarea', { state: 'visible' });

        await selectExample(page, 'checkerBoard');
        await page.waitForTimeout(200);

        const url = page.url();
        expect(url).toContain('script=examples');
        expect(url).toContain('checkerBoard');
    });

    test('browser back navigates to previous script', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#editor-textarea', { state: 'visible' });

        await selectExample(page, 'checkerBoard');
        await page.waitForTimeout(200);
        const code1 = await page.locator('#editor-textarea').inputValue();

        await selectExample(page, 'randomNoise');
        await page.waitForTimeout(200);
        const code2 = await page.locator('#editor-textarea').inputValue();
        expect(code2).not.toEqual(code1);

        await page.goBack();
        await page.waitForTimeout(500);

        const codeAfterBack = await page.locator('#editor-textarea').inputValue();
        expect(codeAfterBack).toEqual(code1);
    });
});
