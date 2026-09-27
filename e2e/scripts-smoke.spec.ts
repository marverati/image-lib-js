import { test, expect, Page } from '@playwright/test';
import examples from '../src/editor/examples_raw.json';
import publicScripts from '../src/editor/public_examples.json';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Loads every built-in example and public script via deep link and checks that it runs
 * without errors. Script errors only surface as console.error in the editor, so we
 * collect those (plus uncaught page errors) while the script runs.
 *
 * Public scripts are normally fetched from the hosted site. Here, those requests are answered
 * with the local copies in src/editor/share_internal, so the test covers the code in this repo.
 */

const SHARE_DIR = path.join(__dirname, '..', 'src', 'editor', 'share_internal');

async function serveLocalPublicScripts(page: Page) {
    await page.route('**/data/share/*.js', async route => {
        const name = path.basename(new URL(route.request().url()).pathname);
        const file = path.join(SHARE_DIR, name);
        if (fs.existsSync(file)) {
            await route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(file, 'utf8') });
        } else {
            await route.fulfill({ status: 404, body: 'not found' });
        }
    });
}

function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    page.on('dialog', async dialog => {
        errors.push(`Unexpected dialog: ${dialog.message()}`);
        await dialog.dismiss();
    });
    return errors;
}

async function openScript(page: Page, category: string, name: string) {
    await page.goto(`/?script=${category}:${encodeURIComponent(name)}`);
    await page.waitForSelector('#file-tree-list .tree-item', { state: 'attached' });
    await expect(page.locator('#current-script-title')).toBeVisible();
    // Give the (auto-)run and any async image loading a moment to finish
    await page.waitForTimeout(800);
}

test.describe('All examples run without errors', () => {
    for (const name of Object.keys(examples)) {
        test(name, async ({ page }) => {
            const errors = collectErrors(page);
            await openScript(page, 'examples', name);
            const code = await page.locator('#editor-textarea').inputValue();
            expect(code.trim().length).toBeGreaterThan(0);
            expect(errors).toEqual([]);
        });
    }
});

test.describe('All public scripts run without errors', () => {
    for (const name of publicScripts as string[]) {
        test(name, async ({ page }) => {
            const errors = collectErrors(page);
            await serveLocalPublicScripts(page);
            await openScript(page, 'public', name);
            const code = await page.locator('#editor-textarea').inputValue();
            expect(code.trim().length).toBeGreaterThan(0);
            expect(errors).toEqual([]);
        });
    }
});

test('smoke check detects a failing script', async ({ page }) => {
    // Sanity check for the harness above: a script that throws must produce an error.
    const errors = collectErrors(page);
    await page.route('**/data/share/*.js', route =>
        route.fulfill({ status: 200, contentType: 'text/javascript', body: 'copy();\nthrow new Error("boom");' }));
    await openScript(page, 'public', 'definitelyBroken');
    expect(errors.join('\n')).toContain('boom');
});
