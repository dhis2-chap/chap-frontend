import i18n from '@dhis2/d2-i18n';
import { NestedSidebar, SidebarCategory } from '@/components/NestedSidebar';
import { useAuthority } from '@/hooks/useAuthority';

export const SettingsSidebar = () => {
    const { isSuperUser, isLoading } = useAuthority();

    const categories: SidebarCategory[] = [
        {
            items: [
                {
                    to: '/settings',
                    label: i18n.t('General'),
                },
                {
                    to: '/settings/data-pruning',
                    label: i18n.t('Data Pruning'),
                    disabled: isLoading || !isSuperUser,
                    tooltip: i18n.t('Requires superuser authority'),
                },
                {
                    to: '/settings/experimental',
                    label: i18n.t('Experimental features'),
                },
            ],
        },
    ];

    return <NestedSidebar categories={categories} />;
};
