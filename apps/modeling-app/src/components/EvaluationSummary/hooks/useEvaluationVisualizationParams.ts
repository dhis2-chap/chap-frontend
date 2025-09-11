import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const PARAM_KEYS = {
    visualization: 'visualization',
    metric: 'metric',
} as const

type Props = {
    allowedVisualizationIds: string[]
    allowedMetricIds: string[]
    defaultVisualizationId?: string
    defaultMetricId?: string
}

export const useEvaluationVisualizationParams = (
    options: Props
) => {
    const [searchParams, setSearchParams] = useSearchParams()

    const defaultVisualizationId =
        options.defaultVisualizationId ?? options.allowedVisualizationIds[0]
    const defaultMetricId =
        options.defaultMetricId ?? options.allowedMetricIds[0]

    const visualizationFromUrl = searchParams.get(PARAM_KEYS.visualization)
    const metricFromUrl = searchParams.get(PARAM_KEYS.metric)

    const selectedVisualizationId = options.allowedVisualizationIds.includes(visualizationFromUrl ?? '')
        ? (visualizationFromUrl as string)
        : defaultVisualizationId

    const selectedMetricId = options.allowedMetricIds.includes(metricFromUrl ?? '')
        ? (metricFromUrl as string)
        : defaultMetricId

    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        let updated = false

        if (!visualizationFromUrl || !options.allowedVisualizationIds.includes(visualizationFromUrl)) {
            if (selectedVisualizationId) {
                params.set(PARAM_KEYS.visualization, selectedVisualizationId)
                updated = true
            }
        }
        if (!metricFromUrl || !options.allowedMetricIds.includes(metricFromUrl)) {
            if (selectedMetricId) {
                params.set(PARAM_KEYS.metric, selectedMetricId)
                updated = true
            }
        }
        if (updated) {
            setSearchParams(params, { replace: true })
        }
    }, [
        visualizationFromUrl,
        metricFromUrl,
        selectedVisualizationId,
        selectedMetricId,
        setSearchParams,
        searchParams,
        options.allowedVisualizationIds,
        options.allowedMetricIds,
    ])

    const setVisualizationId = (nextId: string | undefined) => {
        setSearchParams((prev) => {
            const updatedParams = new URLSearchParams(prev)
            if (nextId) {
                updatedParams.set(PARAM_KEYS.visualization, nextId)
            } else {
                updatedParams.delete(PARAM_KEYS.visualization)
            }
            return updatedParams
        })
    }

    const setMetricId = (nextId: string | undefined) => {
        setSearchParams((prev) => {
            const updatedParams = new URLSearchParams(prev)
            if (nextId) {
                updatedParams.set(PARAM_KEYS.metric, nextId)
            } else {
                updatedParams.delete(PARAM_KEYS.metric)
            }
            return updatedParams
        })
    }

    return {
        selectedVisualizationId,
        selectedMetricId,
        setVisualizationId,
        setMetricId,
    }
}


