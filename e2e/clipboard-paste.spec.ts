import { test, expect } from '@playwright/test';
import { editorPage, simulateImagePaste, getCanvasPixel } from './helpers';

test.describe('Clipboard Paste Modal', () => {
    test.beforeEach(async ({ page }) => {
        await editorPage(page);
    });

    test('paste with image shows modal and overlay', async ({ page }) => {
        await simulateImagePaste(page);
        await expect(page.locator('.paste-overlay')).toBeVisible();
        await expect(page.locator('.paste-modal')).toBeVisible();
    });

    test('paste modal shows preview image', async ({ page }) => {
        await simulateImagePaste(page);
        const preview = page.locator('.paste-modal img');
        await expect(preview).toBeVisible();
        const src = await preview.getAttribute('src');
        expect(src).toBeTruthy();
    });

    test('elevated targets have paste-elevated class', async ({ page }) => {
        await simulateImagePaste(page);
        await expect(page.locator('#source-canvas.paste-elevated')).toBeVisible();
        await expect(page.locator('#target-canvas.paste-elevated')).toBeVisible();
        // At least one slot should be elevated
        const elevatedSlots = page.locator('.image-slots-preview.paste-elevated');
        expect(await elevatedSlots.count()).toBeGreaterThanOrEqual(1);
    });

    test('paste labels are shown on elevated targets', async ({ page }) => {
        await simulateImagePaste(page);
        const labels = page.locator('.paste-label');
        expect(await labels.count()).toBeGreaterThanOrEqual(3); // source + target + at least 1 slot
    });

    test('Escape dismisses paste modal', async ({ page }) => {
        await simulateImagePaste(page);
        await expect(page.locator('.paste-modal')).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.locator('.paste-modal')).not.toBeVisible();
        await expect(page.locator('.paste-overlay')).not.toBeVisible();
        await expect(page.locator('.paste-elevated')).toHaveCount(0);
    });

    test('Cancel button dismisses paste modal', async ({ page }) => {
        await simulateImagePaste(page);
        await page.locator('.paste-cancel').click();
        await expect(page.locator('.paste-modal')).not.toBeVisible();
        await expect(page.locator('.paste-overlay')).not.toBeVisible();
    });

    test('Enter pastes to source canvas', async ({ page }) => {
        await simulateImagePaste(page);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Modal should be dismissed
        await expect(page.locator('.paste-modal')).not.toBeVisible();

        // Source canvas should have content (red pixels from our test image)
        const pixel = await getCanvasPixel(page, '#source-canvas', 0, 0);
        expect(pixel[3]).toBeGreaterThan(0); // has non-transparent content
    });

    test('Space pastes to target canvas', async ({ page }) => {
        await simulateImagePaste(page);
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);

        await expect(page.locator('.paste-modal')).not.toBeVisible();
        const pixel = await getCanvasPixel(page, '#target-canvas', 0, 0);
        expect(pixel[3]).toBeGreaterThan(0);
    });

    test('Digit1 pastes to slot 1', async ({ page }) => {
        await simulateImagePaste(page);
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(300);

        await expect(page.locator('.paste-modal')).not.toBeVisible();
        // Slot 1 (first .image-slots-preview) should now have an img
        const slotImg = page.locator('.image-slots-preview').first().locator('img');
        await expect(slotImg).toBeVisible();
    });

    test('text paste in focused textarea still works normally', async ({ page }) => {
        // Focus the textarea first
        const textarea = page.locator('#editor-textarea');
        await textarea.focus();
        await textarea.fill('before');

        // Simulate a paste that has both text and image — should let text through
        await page.evaluate(() => {
            const textarea = document.querySelector('#editor-textarea') as HTMLTextAreaElement;
            textarea.focus();
            const dt = new DataTransfer();
            dt.items.add('pasted text', 'text/plain');
            // Also add an image blob
            const canvas = document.createElement('canvas');
            canvas.width = 2; canvas.height = 2;
            canvas.getContext('2d')!.fillRect(0, 0, 2, 2);
            canvas.toBlob((blob) => {
                if (!blob) return;
                dt.items.add(new File([blob], 'test.png', { type: 'image/png' }));
                const event = new ClipboardEvent('paste', {
                    clipboardData: dt,
                    bubbles: true,
                    cancelable: true,
                });
                textarea.dispatchEvent(event);
            });
        });
        await page.waitForTimeout(300);

        // Paste modal should NOT have appeared
        await expect(page.locator('.paste-modal')).not.toBeVisible();
    });
});
