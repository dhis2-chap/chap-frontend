const config = {
    type: 'app',
    name: 'chap-early-warning',
    title: 'Early Warning',
    description: 'Review Chap forecasts and alerts',
    id: '060f3364-d853-40f9-bcf7-ad902c522cd5',
    minDHIS2Version: '2.40',
    // Shared with the Modeling App: users need it to call the Chap route.
    customAuthorities: ['F_CHAP_MODELING_APP'],
    entryPoints: { app: './src/App.tsx' },
    viteConfigExtensions: './vite.config.mts',
};

module.exports = config;
