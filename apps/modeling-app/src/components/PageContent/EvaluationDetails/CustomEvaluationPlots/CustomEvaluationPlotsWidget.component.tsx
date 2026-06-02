import { useEffect, useMemo } from 'react';
import { CircularLoader, IconWarning24 } from '@dhis2/ui';
import { VegaEmbed } from 'react-vega';
import i18n from '@dhis2/d2-i18n';
import styles from './CustomEvaluationPlotsWidget.module.css';
import { useIsolatedPlots } from '@/components/BacktestsTable/hooks/useIsolatedPlots';

type Props = {
    evaluationId: number;
    selectedVisualizationId?: string;
    filterLocation?: string;
    filterSplitPeriod?: string;
    filterHorizonPeriod?: string;
};

const VEGA_OPTIONS = {
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
};

export const CustomEvaluationPlotsWidgetComponent = ({
    evaluationId,
    selectedVisualizationId,
    filterLocation,
    filterSplitPeriod,
    filterHorizonPeriod,
}: Props) => {
    const selectionComplete = !!selectedVisualizationId;

    const hasFilters = useMemo(() => {
        if (selectedVisualizationId === 'evaluation_plot') {
            return !!filterLocation && !!filterSplitPeriod;
        }
        return !!filterHorizonPeriod;
    }, [filterLocation, filterSplitPeriod, filterHorizonPeriod, selectedVisualizationId]);

    const requestBody = useMemo(
        () =>
            hasFilters
                ? {
                        location: filterLocation,
                        split_period: filterSplitPeriod,
                        ...(selectedVisualizationId !== 'evaluation_plot' && { horizon_period: filterHorizonPeriod }),
                    }
                : undefined,
        [hasFilters, filterLocation, filterSplitPeriod, filterHorizonPeriod, selectedVisualizationId],
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

    const visualizationContainerClass = isolatedPlotsData
        ? `${styles.visualizationContainer} ${styles.singleIsolatedPlot}`
        : styles.visualizationContainer;

    const showError = isolatedPlotsError;

    useEffect(() => {
        if (!selectionComplete || !isolatedPlotsError) return;

        console.error('CustomEvaluationPlotsWidget: isolated plots load error', {
            error: isolatedPlotsError,
            evaluationId,
            selectedVisualizationId,
            filterLocation,
            filterSplitPeriod,
        });
    }, [isolatedPlotsError, evaluationId, selectedVisualizationId, filterLocation, filterSplitPeriod, selectionComplete]);

    if (!selectionComplete) {
        return (
            <div className={styles.emptyState}>
                <p>{i18n.t('Please select a visualization.')}</p>
            </div>
        );
    }

    if (!hasFilters) {
        return (
            <div className={styles.emptyState}>
                <p>
                    {selectedVisualizationId === 'evaluation_plot'
                        ? i18n.t('Please select an organisation unit and split period to view this visualization.')
                        : i18n.t('Please select a horizon period to view this visualization.')}
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

    if (showError) {
        return (
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
    }

    if (!isolatedPlotsData) {
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
                    spec={isolatedPlotsData}
                    className={styles.vegaEmbed}
                    options={VEGA_OPTIONS}
                />
            </div>
        </div>
    );
};
