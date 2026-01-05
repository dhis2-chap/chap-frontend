import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const viteConfig = defineConfig(async () => {
    const mdx = await import('@mdx-js/rollup');

    return {
        plugins: [
            mdx.default({
                providerImportSource: '@mdx-js/react',
            }) as Plugin,
        ],
        server: {
            fs: {
                allow: [path.resolve(__dirname, '../..')],
            },
        },
        resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
        clearScreen: true,
    };
});

export default viteConfig;
