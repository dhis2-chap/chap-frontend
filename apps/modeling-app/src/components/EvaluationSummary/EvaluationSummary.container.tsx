import React, { useEffect } from 'react'
import { CircularLoader, NoticeBox } from '@dhis2/ui'
import i18n from '@dhis2/d2-i18n'
import styles from './EvaluationSummary.module.css'
import { EvaluationSummary as EvaluationSummaryComponent } from './EvaluationSummary.component'
import { useCustomVisualizationTypes } from '../../hooks/useCustomVisualizationTypes'
import { useCustomMetricsForBacktest } from '../../hooks/useCustomMetricsForBacktest'

type EvaluationSummaryContainerProps = {
    evaluationId?: number
}

export const EvaluationSummary: React.FC<EvaluationSummaryContainerProps> = ({ evaluationId }) => {
    const {
        visualizationTypes,
        isLoading: isTypesLoading,
        error: typesError
    } = useCustomVisualizationTypes({ evaluationId })

    const {
        metrics,
        isLoading: isMetricsLoading,
        error: metricsError
    } = useCustomMetricsForBacktest({ evaluationId })

    const errorDetails = [typesError?.message, metricsError?.message].filter(Boolean) as string[]

    useEffect(() => {
        if (!typesError && !metricsError) return
        console.error('EvaluationSummary: data load errors', {
            messages: errorDetails,
            typesError,
            metricsError,
        })
    }, [typesError, metricsError])

    if (isTypesLoading || isMetricsLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        )
    }

    if (typesError || metricsError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('Unable to load data')} error>
                    <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                </NoticeBox>
            </div>
        )
    }

    return (
        <EvaluationSummaryComponent
            evaluationId={evaluationId}
            visualizationTypes={visualizationTypes ?? []}
            metrics={metrics ?? []}
        />
    )
}


