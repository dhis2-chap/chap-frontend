import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        fs: {
            allow: [path.resolve(__dirname, '../..')],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    clearScreen: true,
});
