const config = {
    type: 'app',
    name: 'chap-early-warning',
    title: 'Early Warning',
    description: 'Review CHAP forecasts and alerts',
    id: '060f3364-d853-40f9-bcf7-ad902c522cd5',
    minDHIS2Version: '2.40',
    customAuthorities: ['F_CHAP_EARLY_WARNING_APP', 'F_CHAP_EARLY_WARNING_APPROVE'],
    additionalNamespaces: [{
        namespace: 'chap-early-warning',
        authorities: ['F_CHAP_EARLY_WARNING_APPROVE'],
        readOnlyAuthorities: ['F_CHAP_EARLY_WARNING_APP'],
    }],
    entryPoints: { app: './src/App.tsx' },
    viteConfigExtensions: './vite.config.mts',
};

module.exports = config;
