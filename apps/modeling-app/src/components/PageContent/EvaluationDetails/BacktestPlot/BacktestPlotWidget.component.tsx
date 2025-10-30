import React, { useEffect } from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { VegaEmbed } from 'react-vega';
import i18n from '@dhis2/d2-i18n';
import { useBacktestPlotVisualization } from './hooks/useBacktestPlotVisualization';
import styles from './BacktestPlotWidget.module.css';

type Props = {
    evaluationId: number;
    selectedVisualizationId?: string;
};

export const BacktestPlotWidgetComponent = ({
    evaluationId,
    selectedVisualizationId,
}: Props) => {
    const selectionComplete = !!selectedVisualizationId;
    const {
        visualization,
        isLoading: isVisualizationLoading,
        error: visualizationError,
    } = useBacktestPlotVisualization({
        evaluationId,
        visualizationId: selectedVisualizationId,
    });

    useEffect(() => {
        if (!visualizationError) return;
        console.error('BacktestPlotWidget: visualization load error', {
            message: visualizationError?.message,
            error: visualizationError,
            evaluationId,
            selectedVisualizationId,
        });
    }, [visualizationError, evaluationId, selectedVisualizationId]);

    if (!selectionComplete) {
        return (
            <div className={styles.emptyState}>
                <p>{i18n.t('Please select a visualization.')}</p>
            </div>
        );
    }

    if (isVisualizationLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    // TODO - these plots are expected to fail sometimes, so we should make this less scary and critical
    if (visualizationError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('Unable to load data')} error>
                    <p>{i18n.t('There was a problem loading the visualization. See the browser console for details.')}</p>
                </NoticeBox>
            </div>
        );
    }

    if (!visualization) {
        return (
            <div className={styles.errorContainer}>
                {i18n.t('No visualization found')}
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <div className={styles.visualizationContainer}>
                <VegaEmbed
                    spec={visualization}
                    className={styles.vegaEmbed}
                    options={{
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
                    }}
                />
            </div>
        </div>
    );
};
