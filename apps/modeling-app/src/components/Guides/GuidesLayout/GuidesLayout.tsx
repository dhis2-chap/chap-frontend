import React, { type ReactNode } from 'react';
import { NestedSidebarLayout } from '../../NestedSidebar';
import { GuidesSidebar } from '../GuidesSidebar';

interface GuidesLayoutProps {
    children: ReactNode;
}

export const GuidesLayout = ({ children }: GuidesLayoutProps) => {
    return (
        <NestedSidebarLayout sidebar={<GuidesSidebar />}>
            {children}
        </NestedSidebarLayout>
    );
};
