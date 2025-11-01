import React, { useEffect } from 'react';
import { CircularLoader, IconWarning16 } from '@dhis2/ui';
import { VegaEmbed } from 'react-vega';
import i18n from '@dhis2/d2-i18n';
import { useCustomEvaluationPlotVisualization } from './hooks/useCustomEvaluationPlotVisualization';
import styles from './CustomEvaluationPlotsWidget.module.css';

type Props = {
    evaluationId: number;
    selectedVisualizationId?: string;
};

export const CustomEvaluationPlotsWidgetComponent = ({
    evaluationId,
    selectedVisualizationId,
}: Props) => {
    const selectionComplete = !!selectedVisualizationId;
    const {
        visualization,
        isLoading: isVisualizationLoading,
        error: visualizationError,
    } = useCustomEvaluationPlotVisualization({
        evaluationId,
        visualizationId: selectedVisualizationId,
    });

    useEffect(() => {
        if (!visualizationError) return;
        console.error('CustomEvaluationPlotsWidget: visualization load error', {
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

    if (visualizationError) {
        return (
            <div className={styles.mutedErrorContainer}>
                <div className={styles.mutedErrorContent}>
                    <IconWarning16 />
                    <div className={styles.mutedErrorText}>
                        <p className={styles.mutedErrorPrimary}>
                            {i18n.t('This plot has encountered an unexpected error and could not be displayed.')}
                        </p>
                        <p className={styles.mutedErrorSecondary}>
                            {i18n.t('This visualization is provided by external contributors and may occasionally fail due to issues in the contributed plot definition.')}
                        </p>
                    </div>
                </div>
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
