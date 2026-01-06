import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const viteConfig = defineConfig(async () => {
    const mdx = await import('@mdx-js/rollup');
    const remarkFrontmatter = await import('remark-frontmatter');
    const remarkMdxFrontmatter = await import('remark-mdx-frontmatter');
    const remarkMdxImages = await import('remark-mdx-images');

    return {
        plugins: [
            mdx.default({
                providerImportSource: '@mdx-js/react',
                mdExtensions: [],
                mdxExtensions: ['.mdx', '.md'],
                remarkPlugins: [
                    remarkFrontmatter.default,
                    remarkMdxFrontmatter.default,
                    remarkMdxImages.default,
                ],
            }) as Plugin,
        ],
        server: {
            fs: {
                allow: [path.resolve(__dirname, '../..')],
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@docs': path.resolve(__dirname, 'docs'),
            },
        },
        clearScreen: true,
    };
});

export default viteConfig;
