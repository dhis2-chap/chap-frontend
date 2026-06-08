const config = {
    type: 'app',
    title: 'CHAP Uncertainty Chart',

    id: '5cdf64e0-d046-4e06-bf2f-c5b783987916',
    minDHIS2Version: '2.40.5',
    pluginType: 'DASHBOARD',

    customAuthorities: [
        'F_CHAP_DASHBOARD_PLUGIN',
    ],
    additionalNamespaces: [
        { namespace: 'chap-dashboard-plugin', authorities: ['F_CHAP_DASHBOARD_PLUGIN'] },
    ],
    entryPoints: {
        app: './src/App.tsx',
        plugin: './src/Plugin.tsx',
    },

    viteConfigExtensions: './vite.config.mts',
}

module.exports = config
