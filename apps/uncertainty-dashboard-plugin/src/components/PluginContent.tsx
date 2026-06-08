import {
    useEffect,
    useState,
} from 'react';
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
import {
    parseDashboardFilters,
    type ParsedDashboardFilters,
} from '@/utils/dashboardFilters';
import type {
    DashboardPluginProps,
    OrgUnitOption,
    PluginConfig,
} from '@/types';
import { ConfigForm } from './ConfigForm';
import { OrgUnitPicker } from './OrgUnitPicker';
import styles from './PluginContent.module.css';

type OrgUnitFilterState = ParsedDashboardFilters['orgUnit'];

const DEFAULT_DASHBOARD_CHART_HEIGHT = 460;
const MIN_DASHBOARD_CHART_HEIGHT = 320;
const MAX_DASHBOARD_CHART_HEIGHT = 520;
const DASHBOARD_CHART_HEIGHT_RATIO = 0.48;

const getDashboardChartHeight = ({
    width,
    height,
}: {
    width: number;
    height: number;
}): number => {
    const availableHeight = Math.max(0, height);
    const maxHeightForBox = availableHeight > 0
        ? Math.min(MAX_DASHBOARD_CHART_HEIGHT, availableHeight)
        : MAX_DASHBOARD_CHART_HEIGHT;
    const minHeightForBox = availableHeight > 0
        ? Math.min(MIN_DASHBOARD_CHART_HEIGHT, availableHeight)
        : MIN_DASHBOARD_CHART_HEIGHT;
    const targetHeight = width > 0
        ? width * DASHBOARD_CHART_HEIGHT_RATIO
        : DEFAULT_DASHBOARD_CHART_HEIGHT;

    return Math.round(Math.max(
        minHeightForBox,
        Math.min(maxHeightForBox, targetHeight),
    ));
};

const useDashboardChartHeight = (
    chartSurface: HTMLDivElement | null,
): number => {
    const [chartHeight, setChartHeight] = useState(DEFAULT_DASHBOARD_CHART_HEIGHT);

    useEffect(() => {
        if (!chartSurface) {
            return undefined;
        }

        const updateChartHeight = () => {
            const { width, height } = chartSurface.getBoundingClientRect();
            setChartHeight(getDashboardChartHeight({ width, height }));
        };

        updateChartHeight();

        const resizeObserver = new ResizeObserver(updateChartHeight);
        resizeObserver.observe(chartSurface);

        return () => {
            resizeObserver.disconnect();
        };
    }, [chartSurface]);

    return chartHeight;
};

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

const ChartLoadingState = () => (
    <div className={styles.chartState}>
        <CircularLoader />
    </div>
);

const ChartPassiveState = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <div className={styles.chartState}>
        <div className={styles.noticeWrap}>
            <NoticeBox title={title}>{children}</NoticeBox>
        </div>
    </div>
);

const getDashboardOrgUnit = (orgUnitFilter: OrgUnitFilterState): OrgUnitOption | null => (
    orgUnitFilter.status === 'single' ? orgUnitFilter.orgUnit : null
);

const getSelectorOptions = (orgUnitFilter: OrgUnitFilterState): OrgUnitOption[] | undefined => (
    orgUnitFilter.status === 'multiple' && orgUnitFilter.options.length > 0
        ? orgUnitFilter.options
        : undefined
);

const getFilterMatchedOrgUnit = (
    orgUnit: OrgUnitOption | null | undefined,
    orgUnitFilter: OrgUnitFilterState,
): OrgUnitOption | null => {
    if (!orgUnit) {
        return null;
    }

    if (orgUnitFilter.status !== 'multiple' || orgUnitFilter.options.length === 0) {
        return orgUnit;
    }

    return orgUnitFilter.options.find(option => option.id === orgUnit.id) ?? null;
};

const buildConfigWithFallbackOrgUnit = (
    config: PluginConfig,
    orgUnit: OrgUnitOption | null,
): PluginConfig => {
    const nextConfig = { ...config };

    if (orgUnit) {
        nextConfig.fallbackOrgUnit = orgUnit;
    } else {
        delete nextConfig.fallbackOrgUnit;
    }

    return nextConfig;
};

const ChartContent = ({
    config,
    dashboardItemFilters,
    onFallbackOrgUnitChange,
    isSavingFallbackOrgUnit,
}: Pick<DashboardPluginProps, 'dashboardItemFilters'> & {
    config: PluginConfig;
    onFallbackOrgUnitChange: (config: PluginConfig) => void;
    isSavingFallbackOrgUnit: boolean;
}) => {
    const [chartSurface, setChartSurface] = useState<HTMLDivElement | null>(null);
    const chartHeight = useDashboardChartHeight(chartSurface);
    const parsedFilters = parseDashboardFilters(dashboardItemFilters);
    const dashboardOrgUnit = getDashboardOrgUnit(parsedFilters.orgUnit);
    const selectorOptions = getSelectorOptions(parsedFilters.orgUnit);
    const storedFallbackOrgUnit = getFilterMatchedOrgUnit(
        config.fallbackOrgUnit,
        parsedFilters.orgUnit,
    );
    const [draftFallbackOrgUnit, setDraftFallbackOrgUnit] = useState<
        OrgUnitOption | null | undefined
    >(undefined);
    const fallbackOrgUnit = draftFallbackOrgUnit === undefined
        ? storedFallbackOrgUnit
        : getFilterMatchedOrgUnit(draftFallbackOrgUnit, parsedFilters.orgUnit);
    const selectedOrgUnit = dashboardOrgUnit ?? fallbackOrgUnit;
    const shouldShowOrgUnitSelector = !dashboardOrgUnit;
    const analytics = useAnalyticsSeries({
        config,
        orgUnit: selectedOrgUnit,
        dashboardItemFilters,
    });

    const handleFallbackOrgUnitChange = (orgUnit: OrgUnitOption | null) => {
        setDraftFallbackOrgUnit(orgUnit);
        onFallbackOrgUnitChange(buildConfigWithFallbackOrgUnit(config, orgUnit));
    };

    const renderChartBody = () => {
        if (analytics.status === 'loading') {
            return <ChartLoadingState />;
        }

        if (analytics.error) {
            return (
                <ChartPassiveState title={i18n.t('Could not load chart data')}>
                    {i18n.t('There was a problem loading analytics data for this chart.')}
                </ChartPassiveState>
            );
        }

        if (analytics.status === 'invalid') {
            if (shouldShowOrgUnitSelector && !selectedOrgUnit) {
                return null;
            }

            return (
                <ChartPassiveState title={i18n.t('Chart is waiting for data')}>
                    {analytics.message}
                </ChartPassiveState>
            );
        }

        return (
            <div ref={setChartSurface} className={styles.chartSurface}>
                <UncertaintyAreaChart
                    chartHeight={chartHeight}
                    series={analytics.series}
                    predictionTargetName={config.targetDataItem.displayName}
                />
            </div>
        );
    };

    return (
        <div className={styles.chartWrap}>
            {shouldShowOrgUnitSelector && (
                <div className={styles.orgUnitToolbar}>
                    <div className={styles.orgUnitControl}>
                        <OrgUnitPicker
                            value={fallbackOrgUnit}
                            onChange={handleFallbackOrgUnitChange}
                            options={selectorOptions}
                            disabled={isSavingFallbackOrgUnit}
                        />
                    </div>
                </div>
            )}
            {renderChartBody()}
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
    const saveFallbackOrgUnitMutation = useSaveDashboardItemConfig(
        dashboardItemId,
        { showSuccessAlert: false },
    );
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
                onFallbackOrgUnitChange={
                    nextConfig => saveFallbackOrgUnitMutation.mutate(nextConfig)
                }
                isSavingFallbackOrgUnit={saveFallbackOrgUnitMutation.isPending}
            />
        </div>
    );
};
