import { defineConfig } from '@playwright/test';

// Optional: point to an already installed Chromium instead of the one bundled with
// this Playwright version (useful in sandboxes where `playwright install` isn't possible).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    retries: process.env.CI ? 1 : 0,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: 'http://localhost:1234',
        headless: true,
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium', launchOptions: { executablePath } } },
    ],
    webServer: {
        command: 'npm run dev:editor',
        port: 1234,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
