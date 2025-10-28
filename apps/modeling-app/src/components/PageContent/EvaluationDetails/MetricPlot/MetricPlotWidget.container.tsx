import React, { useState } from 'react';
import { CircularLoader, MenuItem, NoticeBox, SingleSelect } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './MetricPlotWidget.module.css';
import { MetricPlotWidgetComponent } from './MetricPlotWidget.component';
import { useCustomVisualizationTypes } from '../../../../hooks/useCustomVisualizationTypes';
import { useCustomMetricsForBacktest } from '../../../../hooks/useCustomMetricsForBacktest';
import { useEvaluationVisualizationParams } from './hooks/useEvaluationVisualizationParams';
import { Widget } from '@dhis2-chap/ui';

type Props = {
    evaluationId: number;
};

export const MetricPlotWidget = ({ evaluationId }: Props) => {
    const [open, setOpen] = useState(false);
    const {
        visualizationTypes,
        isLoading: isTypesLoading,
        error: typesError,
    } = useCustomVisualizationTypes({ evaluationId });

    const {
        metrics,
        isLoading: isMetricsLoading,
        error: metricsError,
    } = useCustomMetricsForBacktest({ evaluationId });

    const {
        selectedVisualizationId,
        selectedMetricId,
        setVisualizationId,
        setMetricId,
    } = useEvaluationVisualizationParams({
        allowedVisualizationIds: (visualizationTypes ?? []).map(v => v.id),
        allowedMetricIds: (metrics ?? []).map(m => m.id),
    });

    if (isTypesLoading || isMetricsLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (typesError || metricsError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('Unable to load data')} error>
                    <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                </NoticeBox>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <Widget
                header={i18n.t('Metric Plot')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
                    <div className={styles.controlsRow}>
                        <div className={styles.singleSelectContainer}>
                            <SingleSelect
                                dense
                                selected={selectedVisualizationId}
                                placeholder={i18n.t('Select visualization')}
                                onChange={e => setVisualizationId(e.selected)}
                            >
                                {(visualizationTypes ?? []).map(v => (
                                    <MenuItem key={v.id} value={v.id} label={v.displayName} />
                                ))}
                            </SingleSelect>
                        </div>
                        <div className={styles.singleSelectContainer}>
                            <SingleSelect
                                dense
                                selected={selectedMetricId}
                                placeholder={i18n.t('Select metric')}
                                onChange={e => setMetricId(e.selected)}
                            >
                                {(metrics ?? []).map(m => (
                                    <MenuItem key={m.id} value={m.id} label={m.displayName} />
                                ))}
                            </SingleSelect>
                        </div>
                    </div>

                    <MetricPlotWidgetComponent
                        evaluationId={evaluationId}
                        selectedVisualizationId={selectedVisualizationId}
                        selectedMetricId={selectedMetricId}
                    />
                </div>
            </Widget>
        </div>
    );
};
