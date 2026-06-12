import { useEffect, useMemo } from 'react';
import { CircularLoader, IconWarning24 } from '@dhis2/ui';
import { VegaEmbed } from 'react-vega';
import { VisualizationSpec } from 'vega-embed';
import i18n from '@dhis2/d2-i18n';
import { ApiError } from '@dhis2-chap/ui';
import styles from './CustomEvaluationPlotsWidget.module.css';
import { useIsolatedPlots } from '@/components/BacktestsTable/hooks/useIsolatedPlots';
import { useOrgUnitsById } from '@/hooks/useOrgUnitsById';
import { FacetCoordinates } from '@/components/BacktestsTable/hooks/useFacetCoordinates';

type Props = {
    evaluationId: number;
    selectedVisualizationId?: string;
    facetCoords?: FacetCoordinates;
    filterLocation?: string;
    filterSplitPeriod?: string;
    filterHorizonPeriod?: string;
    isFacetCoordsLoading?: boolean;
    facetCoordsError?: ApiError | null;
};

const MutedPlotError = () => (
    <div className={styles.mutedErrorContainer}>
        <div className={styles.mutedErrorContent}>
            <IconWarning24 />
            <div className={styles.mutedErrorText}>
                <p className={styles.mutedErrorPrimary}>
                    {i18n.t('This plot has encountered an unexpected error and could not be displayed.')}
                </p>
                <p className={styles.mutedErrorSecondary}>
                    {i18n.t('This visualization is provided by external contributors and may occasionally fail due to issues in the contributed plot definition. Please contact your system administrator if you experience issues with this visualization.')}
                </p>
            </div>
        </div>
    </div>
);

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const collectLocationIds = (node: unknown, acc: Set<string>): void => {
    if (Array.isArray(node)) {
        node.forEach(child => collectLocationIds(child, acc));
        return;
    }
    if (!isRecord(node)) return;
    Object.entries(node).forEach(([key, value]) => {
        if (key === 'location' && typeof value === 'string') {
            acc.add(value);
        } else {
            collectLocationIds(value, acc);
        }
    });
};

const withLocationNames = (node: unknown, names: Map<string, string>): unknown => {
    if (Array.isArray(node)) {
        return node.map(child => withLocationNames(child, names));
    }
    if (!isRecord(node)) return node;
    return Object.fromEntries(
        Object.entries(node).map(([key, value]) => {
            if (key === 'location' && typeof value === 'string' && names.has(value)) {
                return [key, names.get(value)];
            }
            return [key, withLocationNames(value, names)];
        }),
    );
};

const withContainerHeight = (spec: UnknownRecord): UnknownRecord => {
    if ('layout' in spec) return spec;
    const { height, signals, ...rest } = spec;
    const existingSignals = Array.isArray(signals) ? signals : [];
    if (existingSignals.some(signal => isRecord(signal) && signal.name === 'height')) return spec;

    const fallbackHeight = typeof height === 'number' ? height : 300;
    const containerHeight = `isFinite(containerSize()[1]) ? containerSize()[1] : ${fallbackHeight}`;
    return {
        ...rest,
        autosize: { type: 'fit', contains: 'padding' },
        signals: [
            ...existingSignals,
            {
                name: 'height',
                init: containerHeight,
                on: [{ events: 'window:resize', update: containerHeight }],
            },
        ],
    };
};

export const CustomEvaluationPlotsWidgetComponent = ({
    evaluationId,
    selectedVisualizationId,
    facetCoords,
    filterLocation,
    filterSplitPeriod,
    filterHorizonPeriod,
    isFacetCoordsLoading,
    facetCoordsError,
}: Props) => {
    const vegaOptions = useMemo(() => ({
        actions: {
            export: true,
            compiled: false,
            source: false,
            editor: false,
        },
        i18n: {
            CLICK_TO_VIEW_ACTIONS: i18n.t('Click to view actions'),
            COMPILED_ACTION: i18n.t('View Compiled Vega'),
            EDITOR_ACTION: i18n.t('Open in Vega Editor'),
            PNG_ACTION: i18n.t('Save as PNG'),
            SOURCE_ACTION: i18n.t('View Source'),
            SVG_ACTION: i18n.t('Save as SVG'),
        },
    }), []);
    const selectionComplete = !!selectedVisualizationId;

    const missingFilters = useMemo(() => {
        if (!facetCoords) return [];
        const missing: string[] = [];
        if (facetCoords.location?.length && !filterLocation) {
            missing.push(i18n.t('an organisation unit'));
        }
        if (facetCoords.split_period?.length && !filterSplitPeriod) {
            missing.push(i18n.t('a split period'));
        }
        if (facetCoords.horizon_distance?.length && !filterHorizonPeriod) {
            missing.push(i18n.t('a horizon period'));
        }
        return missing;
    }, [facetCoords, filterLocation, filterSplitPeriod, filterHorizonPeriod]);

    const hasFilters = !!facetCoords && missingFilters.length === 0;

    const requestBody = useMemo(
        () =>
            hasFilters
                ? {
                        ...(filterLocation && { location: filterLocation }),
                        ...(filterSplitPeriod && { split_period: filterSplitPeriod }),
                        ...(filterHorizonPeriod && { horizon_period: filterHorizonPeriod }),
                    }
                : undefined,
        [hasFilters, filterLocation, filterSplitPeriod, filterHorizonPeriod],
    );

    const {
        plotsData: isolatedPlotsData,
        isLoading: isIsolatedPlotsLoading,
        error: isolatedPlotsError,
    } = useIsolatedPlots({
        visualizationName: selectedVisualizationId,
        backtestId: evaluationId,
        requestBody,
    });

    const locationIds = useMemo(() => {
        const ids = new Set<string>();
        collectLocationIds(isolatedPlotsData, ids);
        return Array.from(ids).sort();
    }, [isolatedPlotsData]);

    const { data: orgUnitsData } = useOrgUnitsById(locationIds);

    const locationNames = useMemo(() => new Map(
        (orgUnitsData?.organisationUnits ?? []).map(ou => [ou.id, ou.displayName]),
    ), [orgUnitsData?.organisationUnits]);

    const plotSpec = useMemo(() => {
        if (!isRecord(isolatedPlotsData)) return undefined;
        const spec = withContainerHeight(isolatedPlotsData);
        return locationNames.size > 0
            ? withLocationNames(spec, locationNames) as UnknownRecord
            : spec;
    }, [isolatedPlotsData, locationNames]);

    const isGridLayoutSpec = isRecord(isolatedPlotsData) && 'layout' in isolatedPlotsData;

    const visualizationContainerClass = isolatedPlotsData
        ? `${styles.visualizationContainer} ${isGridLayoutSpec ? styles.naturalSizePlot : styles.singleIsolatedPlot}`
        : styles.visualizationContainer;

    useEffect(() => {
        const error = isolatedPlotsError || facetCoordsError;
        if (!selectionComplete || !error) return;

        console.error('CustomEvaluationPlotsWidget: plot load error', {
            error,
            evaluationId,
            selectedVisualizationId,
            filterLocation,
            filterSplitPeriod,
        });
    }, [isolatedPlotsError, facetCoordsError, evaluationId, selectedVisualizationId, filterLocation, filterSplitPeriod, selectionComplete]);

    if (!selectionComplete) {
        return (
            <div className={styles.emptyState}>
                <p>{i18n.t('Please select a visualization.')}</p>
            </div>
        );
    }

    if (isFacetCoordsLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (facetCoordsError) {
        return <MutedPlotError />;
    }

    if (!hasFilters) {
        return (
            <div className={styles.emptyState}>
                <p>
                    {i18n.t('Please select {{filters}} to view this visualization.', {
                        filters: missingFilters.join(i18n.t(' and ')),
                    })}
                </p>
            </div>
        );
    }

    if (isIsolatedPlotsLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (isolatedPlotsError) {
        return <MutedPlotError />;
    }

    if (!plotSpec) {
        return (
            <div className={styles.errorContainer}>
                {i18n.t('No visualization found')}
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <div className={visualizationContainerClass}>
                <VegaEmbed
                    spec={plotSpec as VisualizationSpec}
                    className={styles.vegaEmbed}
                    options={vegaOptions}
                />
            </div>
        </div>
    );
};
