import { Page, expect } from '@playwright/test';

/** Navigate to the editor and wait for it to be fully initialized (JS loaded, file tree populated). */
export async function editorPage(page: Page) {
    await page.goto('/');
    // Wait for file tree items to exist — these are created by buildFileTree() inside the window load handler,
    // so their presence guarantees all JS initialization (event listeners, etc.) is complete.
    await page.waitForSelector('#file-tree-list .tree-item', { state: 'attached', timeout: 30000 });
}

/** Clear the textarea and type new code (does NOT run it). */
export async function typeCode(page: Page, code: string) {
    const textarea = page.locator('#editor-textarea');
    await textarea.focus();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Backspace');
    await textarea.fill(code);
}

/** Press Ctrl+Enter to run the current code. */
export async function runCode(page: Page) {
    await page.locator('#editor-textarea').focus();
    await page.keyboard.press('Control+Enter');
    // Small wait for execution to complete
    await page.waitForTimeout(150);
}

/** Type code into the editor and run it. */
export async function typeAndRun(page: Page, code: string) {
    await typeCode(page, code);
    await runCode(page);
}

/** Read the RGBA pixel values at (x, y) on a canvas. */
export async function getCanvasPixel(page: Page, canvasSelector: string, x: number, y: number): Promise<[number, number, number, number]> {
    return await page.evaluate(({ sel, px, py }) => {
        const canvas = document.querySelector(sel) as HTMLCanvasElement;
        if (!canvas) return [0, 0, 0, 0] as [number, number, number, number];
        const ctx = canvas.getContext('2d')!;
        const d = ctx.getImageData(px, py, 1, 1).data;
        return [d[0], d[1], d[2], d[3]] as [number, number, number, number];
    }, { sel: canvasSelector, px: x, py: y });
}

/** Get canvas dimensions. */
export async function getCanvasDimensions(page: Page, canvasSelector: string): Promise<{ width: number; height: number }> {
    return await page.evaluate((sel) => {
        const canvas = document.querySelector(sel) as HTMLCanvasElement;
        return { width: canvas?.width ?? 0, height: canvas?.height ?? 0 };
    }, canvasSelector);
}

/** Check if a canvas has any non-transparent content. */
export async function canvasHasContent(page: Page, canvasSelector: string): Promise<boolean> {
    return await page.evaluate((sel) => {
        const canvas = document.querySelector(sel) as HTMLCanvasElement;
        if (!canvas) return false;
        const ctx = canvas.getContext('2d')!;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) return true;
        }
        return false;
    }, canvasSelector);
}

/**
 * Simulate pasting an image from the clipboard.
 * Creates a small red 4x4 PNG blob in-page and dispatches a paste event.
 */
export async function simulateImagePaste(page: Page) {
    await page.evaluate(() => {
        // Create a small 4x4 red image as a blob
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
            const event = new ClipboardEvent('paste', {
                clipboardData: dt,
                bubbles: true,
                cancelable: true,
            });
            document.dispatchEvent(event);
        }, 'image/png');
    });
    // Wait for the blob creation + event dispatch
    await page.waitForTimeout(300);
}

/**
 * Create a user snippet by intercepting the prompt dialog.
 * Returns the name used.
 */
export async function createUserSnippet(page: Page, name: string): Promise<void> {
    // Set up dialog handler before clicking
    page.once('dialog', async (dialog) => {
        await dialog.accept(name);
    });
    await page.locator('.add-btn').click();
    await page.waitForTimeout(300);
}

/** Click an example by name in the Examples section of the file tree. */
export async function selectExample(page: Page, name: string) {
    // Find all tree-items inside the third section (Examples, index 2)
    const examplesSection = page.locator('#file-tree-list > div').nth(2);
    const items = examplesSection.locator('.tree-item');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
        const text = await items.nth(i).textContent();
        if (text?.trim() === name) {
            await items.nth(i).click();
            await page.waitForTimeout(200);
            return;
        }
    }
    throw new Error(`Example "${name}" not found in file tree`);
}
