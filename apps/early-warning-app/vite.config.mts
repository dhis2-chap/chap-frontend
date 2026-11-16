import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        fs: {
            allow: [path.resolve(__dirname, '../..')],
        },
    },
    resolve: { dedupe: ['react', 'react-dom', '@tanstack/react-query'] },
    clearScreen: true,
});
