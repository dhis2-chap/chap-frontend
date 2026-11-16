import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        fs: {
            allow: [path.resolve(__dirname, '../..')],
        },
    },
    resolve: {
        dedupe: ['react', 'react-dom', '@tanstack/react-query', 'highcharts'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    clearScreen: true,
});
