import { test, expect } from '@playwright/test';
import { editorPage, typeAndRun, getCanvasPixel, getCanvasDimensions, canvasHasContent, selectExample } from './helpers';

test.describe('Code Execution', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('run code with Ctrl+Enter generates red image', async ({ page }) => {
        await typeAndRun(page, 'gen((x,y) => [255, 0, 0], 10, 10)');
        const pixel = await getCanvasPixel(page, '#target-canvas', 5, 5);
        expect(pixel[0]).toBe(255); // R
        expect(pixel[1]).toBe(0);   // G
        expect(pixel[2]).toBe(0);   // B
        expect(pixel[3]).toBe(255); // A
    });

    test('auto-run on example selection', async ({ page }) => {
        await selectExample(page, 'checkerBoard');
        await page.waitForTimeout(300);
        const hasContent = await canvasHasContent(page, '#target-canvas');
        expect(hasContent).toBeTruthy();
    });

    test('generate grayscale image', async ({ page }) => {
        await typeAndRun(page, 'gen((x,y) => 128, 4, 4)');
        const pixel = await getCanvasPixel(page, '#target-canvas', 2, 2);
        expect(pixel[0]).toBe(128);
        expect(pixel[1]).toBe(128);
        expect(pixel[2]).toBe(128);
        expect(pixel[3]).toBe(255);
    });

    test('use(0) targets source canvas', async ({ page }) => {
        await typeAndRun(page, 'use(0); gen((x,y) => [0, 255, 0], 10, 10)');
        const sourcePixel = await getCanvasPixel(page, '#source-canvas', 5, 5);
        expect(sourcePixel[0]).toBe(0);
        expect(sourcePixel[1]).toBe(255);
        expect(sourcePixel[2]).toBe(0);
    });

    test('resize canvas changes dimensions', async ({ page }) => {
        await typeAndRun(page, 'gen((x,y) => 128, 100, 100); resize(50, 50)');
        const dims = await getCanvasDimensions(page, '#target-canvas');
        expect(dims.width).toBe(50);
        expect(dims.height).toBe(50);
    });

    test('filter inverts colors', async ({ page }) => {
        // Generate red, then invert
        await typeAndRun(page, `
            gen((x,y) => [255, 0, 0], 10, 10);
            filter(c => [255-c[0], 255-c[1], 255-c[2], c[3]]);
        `);
        const pixel = await getCanvasPixel(page, '#target-canvas', 5, 5);
        expect(pixel[0]).toBe(0);   // was 255
        expect(pixel[1]).toBe(255); // was 0
        expect(pixel[2]).toBe(255); // was 0
    });

    test('mirror flips horizontally', async ({ page }) => {
        // Generate a left-black-right-white image, then mirror
        await typeAndRun(page, `
            gen((x,y) => x < 5 ? [255,0,0] : [0,0,255], 10, 10);
            mirror();
        `);
        // After mirror, left should be blue, right should be red
        const leftPixel = await getCanvasPixel(page, '#target-canvas', 2, 5);
        const rightPixel = await getCanvasPixel(page, '#target-canvas', 7, 5);
        expect(leftPixel[2]).toBe(255);  // blue on left after mirror
        expect(rightPixel[0]).toBe(255); // red on right after mirror
    });

    test('width/height globals work in gen', async ({ page }) => {
        await typeAndRun(page, 'gen((x,y) => Math.round(x / width * 255), 100, 10)');
        // Left edge should be ~0
        const leftPixel = await getCanvasPixel(page, '#target-canvas', 0, 5);
        expect(leftPixel[0]).toBeLessThan(10);
        // Right edge should be ~255
        const rightPixel = await getCanvasPixel(page, '#target-canvas', 99, 5);
        expect(rightPixel[0]).toBeGreaterThan(245);
    });

    test('error in code does not crash page', async ({ page }) => {
        await typeAndRun(page, 'throw new Error("test error")');
        // Page should still be functional — textarea should be interactable
        const textarea = page.locator('#editor-textarea');
        await expect(textarea).toBeVisible();
        // Can still run valid code after error
        await typeAndRun(page, 'gen((x,y) => [0, 255, 0], 4, 4)');
        const pixel = await getCanvasPixel(page, '#target-canvas', 2, 2);
        expect(pixel[1]).toBe(255);
    });

    test('copyTo stores image in slot', async ({ page }) => {
        await typeAndRun(page, 'gen((x,y) => [255, 0, 0], 10, 10); copyTo(1)');
        await page.waitForTimeout(200);
        // Slot 1 is the first .image-slots-preview; it should now have an img child
        const slotImg = page.locator('.image-slots-preview').first().locator('img');
        await expect(slotImg).toBeVisible();
    });

    test('copy between slots', async ({ page }) => {
        await typeAndRun(page, `
            use(0); gen((x,y) => [255, 0, 0], 10, 10);
            copyTo(1);
            use(-1); copyFrom(1);
        `);
        const pixel = await getCanvasPixel(page, '#target-canvas', 5, 5);
        expect(pixel[0]).toBe(255);
        expect(pixel[1]).toBe(0);
        expect(pixel[2]).toBe(0);
    });

    test('copy() copies source to target', async ({ page }) => {
        // Generate green on source, then copy to target
        await typeAndRun(page, `
            use(0); gen((x,y) => [0, 128, 0], 20, 20);
            use(-1); copy();
        `);
        const pixel = await getCanvasPixel(page, '#target-canvas', 10, 10);
        expect(pixel[1]).toBe(128);
    });
});
