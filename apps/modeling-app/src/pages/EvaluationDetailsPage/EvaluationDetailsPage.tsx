import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiError, Card, VisualizationService } from '@dhis2-chap/ui'
import { VegaEmbed } from 'react-vega'
import i18n from '@dhis2/d2-i18n'
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader'


export const EvaluationDetailsPage: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>()

    const visualizationType = 'metric_map'
    const metricId = 'crps'

    const { data: visualization, isLoading: isVisualizationLoading, error: visualizationError } = useQuery<unknown, ApiError>({
        queryKey: ['custom-visualizations', evaluationId, visualizationType, metricId],
        queryFn: () => VisualizationService.generateVisualizationVisualizationVisualizationNameBacktestIdMetricIdGet(
            visualizationType,
            Number(evaluationId),
            metricId
        ),
        enabled: !!evaluationId && Number(evaluationId) > 0
    })

    if (isVisualizationLoading) {
        return <div>Loading...</div>
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
            <Card>
                <div style={{ width: '100%', height: '60vh' }}>
                    <VegaEmbed
                        spec={visualization}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            </Card>
        </>
    )
}


