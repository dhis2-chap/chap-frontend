import React from 'react';
import i18n from '@dhis2/d2-i18n';
import { NestedSidebar, SidebarCategory } from '@/components/NestedSidebar';

const getSettingsCategories = (): SidebarCategory[] => [
    {
        items: [
            {
                to: '/settings',
                label: i18n.t('General'),
            },
            {
                to: '/settings/data-maintenance',
                label: i18n.t('Data Maintenance'),
            },
        ],
    },
];

export const SettingsSidebar = () => {
    return <NestedSidebar categories={getSettingsCategories()} />;
};
