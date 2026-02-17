import { test, expect } from '@playwright/test';
import { editorPage, typeAndRun, getCanvasPixel } from './helpers';

test.describe('Parameter System', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('no params shows empty state', async ({ page }) => {
        await typeAndRun(page, 'gen((x,y) => 128, 10, 10)');
        await expect(page.locator('#parameter-empty-state')).toBeVisible();
    });

    test('slider param appears', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.slider('brightness', 0.5, 0, 1, 0.1);
            gen((x,y) => v * 255, 10, 10);
        `);
        const slider = page.locator('#parameter-content input[type="range"]');
        await expect(slider).toBeVisible();
        await expect(page.locator('#parameter-empty-state')).not.toBeVisible();
    });

    test('slider shows current value', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.slider('brightness', 0.5, 0, 1, 0.1);
            gen((x,y) => v * 255, 10, 10);
        `);
        // The value display span is next to the range input
        const paramContent = await page.locator('#parameter-content').textContent();
        expect(paramContent).toContain('0.5');
    });

    test('toggle param appears as checkbox', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.toggle('enabled', true);
            gen((x,y) => v ? 255 : 0, 10, 10);
        `);
        const checkbox = page.locator('#parameter-content input[type="checkbox"]').first();
        await expect(checkbox).toBeVisible();
    });

    test('number param appears', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.number('count', 5, 1, 100);
            gen((x,y) => v * 25, 10, 10);
        `);
        const numInput = page.locator('#parameter-content input[type="number"]');
        await expect(numInput).toBeVisible();
        await expect(numInput).toHaveValue('5');
    });

    test('select param appears as dropdown', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.select('mode', ['red', 'green', 'blue'], 0);
            const colors = { red: [255,0,0], green: [0,255,0], blue: [0,0,255] };
            gen((x,y) => colors[v], 10, 10);
        `);
        const select = page.locator('#parameter-content select');
        await expect(select).toBeVisible();
        const options = select.locator('option');
        await expect(options).toHaveCount(3);
    });

    test('Auto Update checkbox appears when params exist', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.slider('test', 0.5, 0, 1, 0.1);
            gen((x,y) => v * 255, 10, 10);
        `);
        const autoUpdate = page.locator('.auto-update');
        await expect(autoUpdate).toBeVisible();
    });

    test('Run button appears when params exist', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.slider('test', 0.5, 0, 1, 0.1);
            gen((x,y) => v * 255, 10, 10);
        `);
        const runBtn = page.locator('.run-button');
        await expect(runBtn).toBeVisible();
    });

    test('Auto Update off prevents re-run on slider change', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.slider('val', 0, 0, 1, 0.1);
            gen((x,y) => v * 255, 10, 10);
        `);

        // Read initial pixel (should be ~0 since val defaults to 0)
        const initialPixel = await getCanvasPixel(page, '#target-canvas', 5, 5);

        // Uncheck Auto Update
        const autoUpdate = page.locator('.auto-update input[type="checkbox"]');
        await autoUpdate.uncheck();

        // Change slider value by filling it
        const slider = page.locator('#parameter-content input[type="range"]');
        await slider.fill('1');
        await page.waitForTimeout(300);

        // Pixel should NOT have changed since auto-update is off
        const afterPixel = await getCanvasPixel(page, '#target-canvas', 5, 5);
        expect(afterPixel[0]).toBe(initialPixel[0]);
    });

    test('Run button forces execution', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.slider('val', 0, 0, 1, 0.1);
            gen((x,y) => v * 255, 10, 10);
        `);

        // Uncheck Auto Update and change slider
        await page.locator('.auto-update input[type="checkbox"]').uncheck();
        const slider = page.locator('#parameter-content input[type="range"]');
        await slider.fill('1');
        await page.waitForTimeout(100);

        // Click Run button
        await page.locator('.run-button').click();
        await page.waitForTimeout(300);

        // Now pixel should be ~255
        const pixel = await getCanvasPixel(page, '#target-canvas', 5, 5);
        expect(pixel[0]).toBeGreaterThan(200);
    });
});
