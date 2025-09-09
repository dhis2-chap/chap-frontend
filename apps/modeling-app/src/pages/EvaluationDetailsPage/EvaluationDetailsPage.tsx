import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '@dhis2-chap/ui'
import { CircularLoader, SingleSelect, MenuItem } from '@dhis2/ui'
import { VegaEmbed } from 'react-vega'
import i18n from '@dhis2/d2-i18n'
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader'
import { useCustomVisualization } from '../../hooks/useCustomVisualization'
import styles from './EvaluationDetailsPage.module.css'

const visualizationTypes = [
    { id: 'metric_by_horizon', label: 'Metric by Horizon' },
    { id: 'metric_map', label: 'Metric Map' },
]
const metrics = [
    { id: 'crps', label: 'CRPS' },
    { id: 'crps_norm_mean', label: 'CRPS normalized mean' },
    { id: 'ratio_within_10th_90th', label: 'Ratio within 10th–90th' },
    { id: 'ratio_within_90th', label: 'Ratio within 90th' },
]

export const EvaluationDetailsPage: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>()


    const [selectedVisualizationType, setSelectedVisualizationType] = useState<string>(
        visualizationTypes[0].id
    )
    const [selectedMetricId, setSelectedMetricId] = useState<string>(
        metrics[0].id
    )

    const { visualization, isLoading: isVisualizationLoading, error: visualizationError } = useCustomVisualization({
        evaluationId: evaluationId ? Number(evaluationId) : undefined,
        visualizationName: selectedVisualizationType,
        metricId: selectedMetricId,
    })

    if (isVisualizationLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        )
    }

    if (visualizationError || !visualization) {
        return <div>Error: {visualizationError?.message}</div>
    }

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Evaluation details')}
                pageDescription={i18n.t('Inspect a single evaluation and view its visualizations.')}
            />
            <div className={styles.controlsRow}>
                <div className={styles.singleSelectContainer}>
                    <SingleSelect
                        dense
                        selected={selectedVisualizationType}
                        placeholder={i18n.t('Select visualization')}
                        onChange={(e) => setSelectedVisualizationType(e.selected)}
                    >
                        {visualizationTypes.map((v) => (
                            <MenuItem key={v.id} value={v.id} label={v.label} />
                        ))}
                    </SingleSelect>
                </div>
                <div className={styles.singleSelectContainer}>
                    <SingleSelect
                        dense
                        selected={selectedMetricId}
                        placeholder={i18n.t('Select metric')}
                        onChange={(e) => setSelectedMetricId(e.selected)}
                    >
                        {metrics.map((m) => (
                            <MenuItem key={m.id} value={m.id} label={m.label} />
                        ))}
                    </SingleSelect>
                </div>
            </div>
            <Card>
                <div className={styles.visualizationContainer}>
                    <VegaEmbed
                        spec={visualization}
                        className={styles.vegaEmbed}
                    />
                </div>
            </Card>
        </>
    )
}


