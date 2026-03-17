import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    resolve: {
        alias: {
            '@dhis2-chap/ui': path.resolve(rootDir, 'packages/ui/src/index.ts'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['packages/**/src/**/*.test.ts', 'apps/**/src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/build/**', '**/.d2/**'],
    },
})
