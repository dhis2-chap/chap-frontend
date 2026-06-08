import { useEffect } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    NoticeBox,
} from '@dhis2/ui';
import { UncertaintyAreaChart } from '@dhis2-chap/ui';
import { useAnalyticsSeries } from '@/hooks/useAnalyticsSeries';
import {
    useDashboardItemConfig,
    useDeleteDashboardItemConfig,
    useSaveDashboardItemConfig,
} from '@/hooks/useDashboardItemConfig';
import type { DashboardPluginProps } from '@/types';
import { ConfigForm } from './ConfigForm';
import styles from './PluginContent.module.css';

const LoadingState = () => (
    <div className={styles.centeredState}>
        <CircularLoader />
    </div>
);

const PassiveState = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <div className={styles.centeredState}>
        <div className={styles.noticeWrap}>
            <NoticeBox title={title}>{children}</NoticeBox>
        </div>
    </div>
);

const ChartContent = ({
    config,
    dashboardItemFilters,
}: Pick<DashboardPluginProps, 'dashboardItemFilters'> & {
    config: NonNullable<ReturnType<typeof useDashboardItemConfig>['data']>;
}) => {
    const analytics = useAnalyticsSeries({
        config,
        dashboardItemFilters,
    });

    if (analytics.status === 'loading') {
        return <LoadingState />;
    }

    if (analytics.error) {
        return (
            <PassiveState title={i18n.t('Could not load chart data')}>
                {i18n.t('There was a problem loading analytics data for this chart.')}
            </PassiveState>
        );
    }

    if (analytics.status === 'invalid') {
        return (
            <PassiveState title={i18n.t('Chart is waiting for data')}>
                {analytics.message}
            </PassiveState>
        );
    }

    return (
        <div className={styles.chartWrap}>
            {analytics.periodSource === 'fallback' && (
                <p className={styles.fallbackNote}>
                    {i18n.t('Showing a historical monthly fallback window because no dashboard period is selected.')}
                </p>
            )}
            <UncertaintyAreaChart
                series={analytics.series}
                predictionTargetName={config.targetDataItem.displayName}
            />
        </div>
    );
};

export const PluginContent = ({
    dashboardItemId,
    dashboardItemFilters,
    dashboardMode = 'view',
    setDashboardItemDetails,
}: DashboardPluginProps) => {
    const configQuery = useDashboardItemConfig(dashboardItemId);
    const saveConfigMutation = useSaveDashboardItemConfig(dashboardItemId);
    const deleteConfigMutation = useDeleteDashboardItemConfig(dashboardItemId);
    const config = configQuery.data ?? null;

    useEffect(() => {
        if (!setDashboardItemDetails) {
            return;
        }

        setDashboardItemDetails({
            itemTitle: config?.targetDataItem.displayName ?? i18n.t('CHAP uncertainty chart'),
            onRemove: () => {
                deleteConfigMutation.mutate();
            },
        });
    }, [config?.targetDataItem.displayName, deleteConfigMutation, setDashboardItemDetails]);

    if (!dashboardItemId) {
        return (
            <div className={styles.root}>
                <PassiveState title={i18n.t('Missing dashboard item')}>
                    {i18n.t('This plugin needs a dashboard item id to store configuration.')}
                </PassiveState>
            </div>
        );
    }

    if (configQuery.isLoading) {
        return (
            <div className={styles.root}>
                <LoadingState />
            </div>
        );
    }

    if (configQuery.error) {
        return (
            <div className={styles.root}>
                <PassiveState title={i18n.t('Could not load configuration')}>
                    {i18n.t('There was a problem loading this chart configuration.')}
                </PassiveState>
            </div>
        );
    }

    if (dashboardMode === 'edit') {
        return (
            <div className={styles.root}>
                <ConfigForm
                    config={config}
                    isSaving={saveConfigMutation.isPending}
                    onSave={nextConfig => saveConfigMutation.mutate(nextConfig)}
                />
            </div>
        );
    }

    if (!config) {
        return (
            <div className={styles.root}>
                <PassiveState title={i18n.t('Chart not configured')}>
                    {i18n.t('Configure this chart while editing the dashboard.')}
                </PassiveState>
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <ChartContent
                config={config}
                dashboardItemFilters={dashboardItemFilters}
            />
        </div>
    );
};
