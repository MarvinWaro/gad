import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/browser',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:8015',
        browserName: 'chromium',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8015 --no-reload',
        url: 'http://127.0.0.1:8015',
        reuseExistingServer: !process.env.CI,
        env: {
            APP_CONFIG_CACHE: 'bootstrap/cache/phlgadis-preview-config.php',
            SESSION_DRIVER: 'array',
        },
    },
});
