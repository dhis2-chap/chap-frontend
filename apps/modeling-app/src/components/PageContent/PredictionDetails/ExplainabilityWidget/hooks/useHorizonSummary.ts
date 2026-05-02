import { useQuery } from '@tanstack/react-query'
import { XaiService } from '@dhis2-chap/ui'

type Args = {
    predictionId: number
    orgUnit: string
    method: string
    xaiMethod: string
    enabled: boolean
}

export const useHorizonSummary = ({
    predictionId,
    orgUnit,
    method,
    xaiMethod,
    enabled,
}: Args) => {
    const { data, isFetching, error } = useQuery({
        queryKey: ['horizonSummary', predictionId, orgUnit, method, xaiMethod],
        queryFn: () =>
            XaiService.computeHorizonSummary(
                predictionId,
                orgUnit,
                'median',
                method,
                xaiMethod
            ),
        enabled: enabled && !!orgUnit,
        staleTime: Infinity,
    })

    return {
        horizonData: data ?? null,
        isHorizonLoading: isFetching,
        horizonError: error
            ? error instanceof Error
                ? error.message
                : String(error)
            : null,
    }
}
