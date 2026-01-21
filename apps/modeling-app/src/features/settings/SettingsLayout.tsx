import React from 'react';
import { Outlet } from 'react-router-dom';
import { NestedSidebarLayout } from '@/components/NestedSidebar';
import { SettingsSidebar } from './SettingsSidebar';

export const SettingsLayout = () => {
    return (
        <NestedSidebarLayout sidebar={<SettingsSidebar />}>
            <Outlet />
        </NestedSidebarLayout>
    );
};
