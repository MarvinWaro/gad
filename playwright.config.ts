import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/browser',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:8016',
        browserName: 'chromium',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'php tests/browser/server.php',
        url: 'http://127.0.0.1:8016',
        reuseExistingServer: false,
    },
});
