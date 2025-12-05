import React, { useState } from 'react';
import { CircularLoader, IconInfo16, MenuItem, NoticeBox, SingleSelect, Tooltip } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './MetricPlotWidget.module.css';
import { MetricPlotWidgetComponent } from './MetricPlotWidget.component';
import { useMetricVisualizationTypes } from './hooks/useMetricVisualizationTypes';
import { useMetricsForBacktest } from './hooks/useMetricsForBacktest';
import { Widget } from '@dhis2-chap/ui';

type Props = {
    evaluationId: number;
};

const WidgetWrapper = ({ children, open, onOpen, onClose }: { children: React.ReactNode; open: boolean; onOpen: () => void; onClose: () => void }) => {
    const header = (
        <div className={styles.header}>
            <span>{i18n.t('Metric plot')}</span>
            <Tooltip
                content={i18n.t('Metric plots are advanced functionality and may be misinterpreted. Use with caution.')}
                placement="top"
            >
                <span className={styles.tooltip}>
                    <IconInfo16 />
                </span>
            </Tooltip>
        </div>
    );

    return (
        <Widget
            header={header}
            open={open}
            onOpen={onOpen}
            onClose={onClose}
        >
            <div className={styles.content}>
                {children}
            </div>
        </Widget>
    );
};

export const MetricPlotWidget = ({ evaluationId }: Props) => {
    const [open, setOpen] = useState(false);
    const {
        visualizationTypes,
        isLoading: isTypesLoading,
        error: typesError,
    } = useMetricVisualizationTypes({ evaluationId });

    const {
        metrics,
        isLoading: isMetricsLoading,
        error: metricsError,
    } = useMetricsForBacktest({ evaluationId });

    const [selectedVisualizationId, setVisualizationId] = useState<string | undefined>(undefined);
    const [selectedMetricId, setMetricId] = useState<string | undefined>(undefined);

    if (isTypesLoading || isMetricsLoading) {
        return (
            <div className={styles.container}>
                <WidgetWrapper open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
                    <div className={styles.loadingContainer}>
                        <CircularLoader />
                    </div>
                </WidgetWrapper>
            </div>
        );
    }

    if (typesError || metricsError) {
        return (
            <div className={styles.container}>
                <WidgetWrapper open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
                    <div className={styles.errorContainer}>
                        <NoticeBox title={i18n.t('Unable to load data')} error>
                            <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                        </NoticeBox>
                    </div>
                </WidgetWrapper>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <WidgetWrapper open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
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
                <div className={styles.metricDescription}>
                    {metrics?.find(m => m.id === selectedMetricId)?.description}
                </div>

                <MetricPlotWidgetComponent
                    evaluationId={evaluationId}
                    selectedVisualizationId={selectedVisualizationId}
                    selectedMetricId={selectedMetricId}
                />
            </WidgetWrapper>
        </div>
    );
};
