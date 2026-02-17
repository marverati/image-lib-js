import { test, expect } from '@playwright/test';
import { editorPage, canvasHasContent } from './helpers';

/**
 * Simulate dropping an image file onto an element.
 * Creates a small red 4x4 PNG and dispatches dragover + drop events.
 */
async function simulateImageDrop(page: any, selector: string) {
    await page.evaluate((sel: string) => {
        const target = document.querySelector(sel) as HTMLElement;
        if (!target) throw new Error(`Element not found: ${sel}`);

        // Create a small red PNG as a Blob
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 4, 4);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'test.png', { type: 'image/png' });
            const dt = new DataTransfer();
            dt.items.add(file);

            // Dispatch dragover to set up the drop target
            const dragOverEvent = new DragEvent('dragover', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dt,
            });
            target.dispatchEvent(dragOverEvent);

            // Dispatch drop
            const dropEvent = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dt,
            });
            target.dispatchEvent(dropEvent);
        }, 'image/png');
    }, selector);

    // Wait for FileReader + Image load
    await page.waitForTimeout(500);
}

test.describe('Drag and Drop', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('drop image on source canvas', async ({ page }) => {
        await simulateImageDrop(page, '#source-canvas');
        const hasContent = await canvasHasContent(page, '#source-canvas');
        expect(hasContent).toBeTruthy();
    });

    test('drop image on target canvas', async ({ page }) => {
        await simulateImageDrop(page, '#target-canvas');
        const hasContent = await canvasHasContent(page, '#target-canvas');
        expect(hasContent).toBeTruthy();
    });

    test('drop image on slot', async ({ page }) => {
        await simulateImageDrop(page, '.image-slots-preview');
        await page.waitForTimeout(300);
        // The first slot should now have an img element
        const slotImg = page.locator('.image-slots-preview').first().locator('img');
        await expect(slotImg).toBeVisible();
    });
});
