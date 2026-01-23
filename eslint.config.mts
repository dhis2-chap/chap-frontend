import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
    {
        ignores: [
            '**/node_modules/**',
            '**/build/**',
            '**/.d2/**',
            'dist/**',
            '.turbo/**',
            '.eslintcache/**',
            '**/ui/src/httpfunctions/**',
            '**/*.{js,jsx,mjs}',
        ],
    },
    js.configs.recommended,
    stylistic.configs.customize({
        indent: 4,
        quotes: 'single',
        semi: true,
        jsx: true,
        braceStyle: '1tbs',
    }),
    {
        rules: {
            '@stylistic/operator-linebreak': ['error', 'before', { overrides: { '=': 'after', '&&': 'after' } }],
            '@stylistic/multiline-ternary': 'off',
            '@stylistic/padding-line-between-statements': [
                'error',
                { blankLine: 'never', prev: 'import', next: 'import' },
            ],
        },
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        languageOptions: {
            globals: globals.browser,
        },
    },
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        settings: {
            react: {
                version: '18.3.1',
            },
        },
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'indent': 'off',
        },
    },
]);
