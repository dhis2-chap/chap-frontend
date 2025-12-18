import path from 'path';
import { defineConfig } from 'vite';

const viteConfig = defineConfig(async () => {
    return {
        server: {
            fs: {
                allow: [path.resolve(__dirname, '../..')],
            },
        },
        resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    };
});

export default viteConfig;
