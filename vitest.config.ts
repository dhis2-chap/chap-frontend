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
            // The package's exports point at build output, which isn't generated
            // in the test job. Resolve the period utils to source so tests run
            // without a prior build (the source only depends on date-fns).
            '@dhis2-chap/ui/time-periods': fileURLToPath(
                new URL('./packages/ui/src/utils/timePeriodUtils.ts', import.meta.url),
            ),
        },
    },
});
