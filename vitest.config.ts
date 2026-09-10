import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['packages/**/src/**/*.test.ts', 'apps/**/src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/build/**', '**/.d2/**'],
    },
    resolve: {
        alias: {
            // Workspace package exports point at build output, which the test job
            // does not generate (it runs `pnpm test` without `pnpm build`).
            // @dhis2-chap/core is a pure, dependency-light leaf package, so we
            // resolve it to source and run tests without a prior build.
            '@dhis2-chap/core': fileURLToPath(
                new URL('./packages/core/src/index.ts', import.meta.url),
            ),
            // Resolve the UI barrel before mocks are applied, including in
            // clean checkouts where the package build output does not exist.
            '@dhis2-chap/ui': fileURLToPath(
                new URL('./packages/ui/src/index.ts', import.meta.url),
            ),
            // Mirror the modeling app's `@/*` tsconfig path so its modules can
            // be imported by tests without a bundler.
            '@': fileURLToPath(
                new URL('./apps/modeling-app/src', import.meta.url),
            ),
        },
    },
});
