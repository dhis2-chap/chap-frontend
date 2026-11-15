import path from 'path';
import { defineConfig } from 'vite';

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
            }),
        ],
        server: {
            fs: {
                allow: [path.resolve(__dirname, '../..')],
            },
        },
        resolve: {
            // Source workspace packages must share the host's React context and chart modules.
            dedupe: ['react', 'react-dom', '@tanstack/react-query', 'highcharts'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@docs': path.resolve(__dirname, 'docs'),
                '@dhis2-chap/ui': path.resolve(__dirname, '../../packages/ui/src'),
            },
        },
        // maps-gl resolves its workers relative to import.meta.url. Keep it out of
        // prebundling, but prebundle its CommonJS dependencies for development.
        optimizeDeps: {
            exclude: ['@dhis2/maps-gl'],
            include: [
                '@turf/area', '@turf/bbox', '@turf/buffer', '@turf/center-of-mass', '@turf/circle', '@turf/length',
                'comlink', 'uuid', 'maplibre-gl', '@mapbox/sphericalmercator', 'suggestions', 'fetch-jsonp',
                'polylabel', 'lodash.throttle',
            ].map(dependency => `@chap-blocks/ui > @dhis2/maps-gl > ${dependency}`),
        },
        clearScreen: true,
    };
});

export default viteConfig;
