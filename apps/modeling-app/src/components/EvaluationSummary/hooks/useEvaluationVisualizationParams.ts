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

    const vizParam = searchParams.get(PARAM_KEYS.visualization) ?? undefined
    const metricParam = searchParams.get(PARAM_KEYS.metric) ?? undefined

    const selectedVisualizationId = options.allowedVisualizationIds.includes(
        vizParam ?? ''
    )
        ? (vizParam as string)
        : defaultVisualizationId

    const selectedMetricId = options.allowedMetricIds.includes(metricParam ?? '')
        ? (metricParam as string)
        : defaultMetricId

    // Ensure URL contains valid values; backfill or correct invalid values
    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        let updated = false

        if (!vizParam || !options.allowedVisualizationIds.includes(vizParam)) {
            if (selectedVisualizationId) {
                params.set(PARAM_KEYS.visualization, selectedVisualizationId)
                updated = true
            }
        }
        if (!metricParam || !options.allowedMetricIds.includes(metricParam)) {
            if (selectedMetricId) {
                params.set(PARAM_KEYS.metric, selectedMetricId)
                updated = true
            }
        }
        if (updated) {
            setSearchParams(params, { replace: true })
        }
        // We intentionally depend on primitive values to avoid loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        vizParam,
        metricParam,
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


