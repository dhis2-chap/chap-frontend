const config = {
    type: 'app',
    name: 'chap-early-warning',
    title: 'Early Warning',
    description: 'Review CHAP forecasts and alerts',
    id: '060f3364-d853-40f9-bcf7-ad902c522cd5',
    minDHIS2Version: '2.40',
    entryPoints: { app: './src/App.tsx' },
    viteConfigExtensions: './vite.config.mts',
};

module.exports = config;
