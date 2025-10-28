import React, { useEffect } from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { VegaEmbed } from 'react-vega';
import i18n from '@dhis2/d2-i18n';
import { useCustomVisualization } from './hooks/useCustomVisualization';
import styles from './MetricPlotWidget.module.css';

type Props = {
    evaluationId: number;
    selectedVisualizationId?: string;
    selectedMetricId?: string;
};

export const MetricPlotWidgetComponent = ({
    evaluationId,
    selectedVisualizationId,
    selectedMetricId,
}: Props) => {
    const {
        visualization,
        isLoading: isVisualizationLoading,
        error: visualizationError,
    } = useCustomVisualization({
        evaluationId,
        visualizationId: selectedVisualizationId,
        metricId: selectedMetricId,
    });

    useEffect(() => {
        if (!visualizationError) return;
        console.error('EvaluationSummary: visualization load error', {
            message: visualizationError?.message,
            error: visualizationError,
            evaluationId,
            selectedVisualizationId,
            selectedMetricId,
        });
    }, [visualizationError, evaluationId, selectedVisualizationId, selectedMetricId]);

    const isLoading = isVisualizationLoading || !selectedVisualizationId;

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (visualizationError || !visualization) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('Unable to load data')} error>
                    <p>{i18n.t('There was a problem loading the visualization. See the browser console for details.')}</p>
                </NoticeBox>
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
