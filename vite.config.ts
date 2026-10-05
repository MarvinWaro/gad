import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig, lazyPlugins } from 'vite-plus';

// Wayfinder writes the typed routes by running `php artisan`. A host that
// builds the assets before PHP is installed (DigitalOcean App Platform's
// Node step) has no PHP, so it builds from the generated files kept in git;
// every build that has PHP regenerates them, so commit what it changes.
const hasPhp = spawnSync('php', ['-v'], { stdio: 'ignore' }).status === 0;

if (!hasPhp && !existsSync('resources/js/routes')) {
    throw new Error(
        'Neither PHP nor the generated routes (resources/js/routes) are here. Run `php artisan wayfinder:generate --with-form` and commit the result.',
    );
}

export default defineConfig({
    plugins: lazyPlugins(() => [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        tailwindcss(),
        ...(hasPhp ? [wayfinder({ formVariants: true })] : []),
    ]),
    // Loaded on demand for monitoring PDFs; prebundled so the dev server does
    // not reload the page the first time someone downloads or previews one.
    optimizeDeps: {
        include: ['pdfmake/build/pdfmake', 'pdfjs-dist'],
    },
    server: {
        watch: {
            ignored: [
                '**/.agents/**',
                '**/.claude/**',
                '**/.cursor/**',
                '**/.junie/**',
                '**/vendor/**',
            ],
        },
    },
    lint: {
        ignorePatterns: [
            // Vendored agent tooling (the Impeccable skill), as for fmt below.
            '.github/**',
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'tailwind.config.js',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    fmt: {
        printWidth: 80,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: 'css',
        ignorePatterns: [
            '.github/**',
            'composer.json',
            // Wayfinder's output, kept as it writes it.
            'resources/js/actions/**',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
            'resources/js/components/ui/*',
            'resources/views/mail/*',
        ],
        sortTailwindcss: {
            functions: ['clsx', 'cn', 'cva'],
            stylesheet: 'resources/css/app.css',
        },
    },
});
