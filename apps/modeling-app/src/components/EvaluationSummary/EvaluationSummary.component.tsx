import React, { useEffect } from 'react'
import { Card, Metric, VisualizationInfo } from '@dhis2-chap/ui'
import { CircularLoader, SingleSelect, MenuItem, NoticeBox } from '@dhis2/ui'
import { VegaEmbed } from 'react-vega'
import i18n from '@dhis2/d2-i18n'
import { useCustomVisualization } from './hooks/useCustomVisualization'
import { useEvaluationVisualizationParams } from './hooks/useEvaluationVisualizationParams'
import styles from './EvaluationSummary.module.css'

type EvaluationSummaryProps = {
    evaluationId?: number
    visualizationTypes: VisualizationInfo[]
    metrics: Metric[]
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ evaluationId, visualizationTypes, metrics }) => {
    const {
        selectedVisualizationId,
        selectedMetricId,
        setVisualizationId,
        setMetricId,
    } = useEvaluationVisualizationParams({
        allowedVisualizationIds: visualizationTypes.map((v) => v.id),
        allowedMetricIds: metrics.map((m) => m.id),
    })

    const {
        visualization,
        isLoading: isVisualizationLoading,
        error: visualizationError,
    } = useCustomVisualization({
        evaluationId,
        visualizationId: selectedVisualizationId,
        metricId: selectedMetricId,
    })

    useEffect(() => {
        if (!visualizationError && visualization) return
        console.error('EvaluationSummary: visualization load error', {
            message: visualizationError?.message,
            error: visualizationError,
            visualization,
            evaluationId,
            selectedVisualizationId,
            selectedMetricId,
        })
    }, [visualizationError, visualization, evaluationId, selectedVisualizationId, selectedMetricId])

    if (isVisualizationLoading || !selectedVisualizationId) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        )
    }

    if (visualizationError || !visualization) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('Unable to load data')} error>
                    <p>{i18n.t('There was a problem loading the visualization. See the browser console for details.')}</p>
                </NoticeBox>
            </div>
        )
    }

    return (
        <>
            <div className={styles.controlsRow}>
                <div className={styles.singleSelectContainer}>
                    <SingleSelect
                        dense
                        selected={selectedVisualizationId}
                        placeholder={i18n.t('Select visualization')}
                        onChange={(e) => setVisualizationId(e.selected)}
                    >
                        {visualizationTypes.map((v) => (
                            <MenuItem
                                key={v.id}
                                value={v.id}
                                label={v.displayName}
                            />
                        ))}
                    </SingleSelect>
                </div>
                <div className={styles.singleSelectContainer}>
                    <SingleSelect
                        dense
                        selected={selectedMetricId}
                        placeholder={i18n.t('Select metric')}
                        onChange={(e) => setMetricId(e.selected)}
                    >
                        {metrics.map((m) => (
                            <MenuItem
                                key={m.id}
                                value={m.id}
                                label={m.displayName}
                            />
                        ))}
                    </SingleSelect>
                </div>
            </div>

            <Card>
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
                            }
                        }}
                    />
                </div>
            </Card>
        </>
    )
}


