const config = {
    type: 'app',
    title: 'Modeling',

    id: 'a29851f9-82a7-4ecd-8b2c-58e0f220bc75',
    minDHIS2Version: '2.40',

    customAuthorities: ['F_CHAP_MODELING_APP'],
    entryPoints: {
        app: './src/App.tsx',
    },

    viteConfigExtensions: './vite.config.mts',
}

module.exports = config
