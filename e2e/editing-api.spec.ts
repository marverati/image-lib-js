import { test, expect } from '@playwright/test';
import { editorPage, typeAndRun, getCanvasPixel, getCanvasDimensions } from './helpers';

/** Pixel-level checks for the snippet API functions not covered in code-execution.spec.ts. */
test.describe('Editing API', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('fill sets every pixel to one color', async ({ page }) => {
        await typeAndRun(page, 'gen(0, 8, 8); fill([10, 20, 30, 255])');
        for (const [x, y] of [[0, 0], [7, 7], [3, 5]]) {
            expect(await getCanvasPixel(page, '#target-canvas', x, y)).toEqual([10, 20, 30, 255]);
        }
    });

    test('gen without size reuses the current target size', async ({ page }) => {
        await typeAndRun(page, 'gen(0, 30, 20); gen((x, y) => [x, y, 0])');
        expect(await getCanvasDimensions(page, '#target-canvas')).toEqual({ width: 30, height: 20 });
        expect(await getCanvasPixel(page, '#target-canvas', 29, 19)).toEqual([29, 19, 0, 255]);
    });

    test('gen with a single size makes a square image', async ({ page }) => {
        await typeAndRun(page, 'gen(128, 24)');
        expect(await getCanvasDimensions(page, '#target-canvas')).toEqual({ width: 24, height: 24 });
    });

    test('filterR changes only the red channel', async ({ page }) => {
        await typeAndRun(page, 'gen([10, 20, 30], 4, 4); filterR(r => 200)');
        expect(await getCanvasPixel(page, '#target-canvas', 1, 1)).toEqual([200, 20, 30, 255]);
    });

    test('filterG, filterB and filterA change their own channel', async ({ page }) => {
        await typeAndRun(page, 'gen([10, 20, 30], 4, 4); filterG(g => g * 2); filterB(b => 0); filterA(a => 255)');
        expect(await getCanvasPixel(page, '#target-canvas', 2, 2)).toEqual([10, 40, 0, 255]);
    });

    test('filter receives pixel coordinates', async ({ page }) => {
        await typeAndRun(page, 'gen(0, 16, 16); filter((c, x, y) => [x * 10, y * 10, 0, 255])');
        expect(await getCanvasPixel(page, '#target-canvas', 3, 7)).toEqual([30, 70, 0, 255]);
    });

    test('flip mirrors vertically', async ({ page }) => {
        await typeAndRun(page, 'gen((x, y) => y < 5 ? [255, 0, 0] : [0, 0, 255], 10, 10); flip()');
        expect(await getCanvasPixel(page, '#target-canvas', 5, 1)).toEqual([0, 0, 255, 255]);
        expect(await getCanvasPixel(page, '#target-canvas', 5, 8)).toEqual([255, 0, 0, 255]);
    });

    test('crop keeps the top left corner by default', async ({ page }) => {
        await typeAndRun(page, 'gen((x, y) => [x, y, 0], 40, 40); crop(10, 5)');
        expect(await getCanvasDimensions(page, '#target-canvas')).toEqual({ width: 10, height: 5 });
        expect(await getCanvasPixel(page, '#target-canvas', 0, 0)).toEqual([0, 0, 0, 255]);
        expect(await getCanvasPixel(page, '#target-canvas', 9, 4)).toEqual([9, 4, 0, 255]);
    });

    test('crop with anchor 0.5 keeps the center', async ({ page }) => {
        await typeAndRun(page, 'gen((x, y) => [x, y, 0], 40, 40); crop(10, 10, 0.5, 0.5)');
        expect(await getCanvasPixel(page, '#target-canvas', 0, 0)).toEqual([15, 15, 0, 255]);
    });

    test('crop with anchor 1 keeps the bottom right corner', async ({ page }) => {
        await typeAndRun(page, 'gen((x, y) => [x, y, 0], 40, 40); crop(10, 10, 1, 1)');
        expect(await getCanvasPixel(page, '#target-canvas', 9, 9)).toEqual([39, 39, 0, 255]);
    });

    test('rescale multiplies the size', async ({ page }) => {
        await typeAndRun(page, 'gen(100, 40, 20); rescale(0.5)');
        expect(await getCanvasDimensions(page, '#target-canvas')).toEqual({ width: 20, height: 10 });
        await typeAndRun(page, 'gen(100, 40, 20); rescale(2, 0.25)');
        expect(await getCanvasDimensions(page, '#target-canvas')).toEqual({ width: 80, height: 5 });
    });

    test('resize with a single argument makes a square', async ({ page }) => {
        await typeAndRun(page, 'gen(100, 40, 20); resize(16)');
        expect(await getCanvasDimensions(page, '#target-canvas')).toEqual({ width: 16, height: 16 });
    });

    test('drawing on the canvas context shows up in the target', async ({ page }) => {
        await typeAndRun(page, `
            gen([0, 0, 0], 20, 20);
            context.fillStyle = 'rgb(0, 255, 0)';
            context.fillRect(10, 10, 10, 10);
        `);
        expect(await getCanvasPixel(page, '#target-canvas', 5, 5)).toEqual([0, 0, 0, 255]);
        expect(await getCanvasPixel(page, '#target-canvas', 15, 15)).toEqual([0, 255, 0, 255]);
    });

    test('filter after canvas drawing sees the drawn pixels', async ({ page }) => {
        await typeAndRun(page, `
            gen([0, 0, 0], 20, 20);
            context.fillStyle = 'rgb(255, 0, 0)';
            context.fillRect(0, 0, 10, 20);
            filter(c => [c[1], c[0], c[2], 255]);
        `);
        expect(await getCanvasPixel(page, '#target-canvas', 5, 5)).toEqual([0, 255, 0, 255]);
    });

    test('changing a slider re-runs the script with the new value', async ({ page }) => {
        await typeAndRun(page, `
            const v = param.slider('val', 0, 0, 1, 0.1);
            gen((x, y) => v * 255, 10, 10);
        `);
        expect((await getCanvasPixel(page, '#target-canvas', 5, 5))[0]).toBe(0);
        await page.locator('#parameter-content input[type="range"]').fill('1');
        await expect.poll(async () => (await getCanvasPixel(page, '#target-canvas', 5, 5))[0]).toBe(255);
    });

    test('parameter values survive re-running the code', async ({ page }) => {
        const code = `
            const v = param.slider('val', 0, 0, 1, 0.1);
            gen((x, y) => v * 255, 10, 10);
        `;
        await typeAndRun(page, code);
        await page.locator('#parameter-content input[type="range"]').fill('1');
        await typeAndRun(page, code);
        expect((await getCanvasPixel(page, '#target-canvas', 5, 5))[0]).toBe(255);
    });
});
