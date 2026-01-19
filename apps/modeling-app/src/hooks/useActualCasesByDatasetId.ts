import { useQuery } from '@tanstack/react-query'
import { AnalyticsService, ApiError, DataList } from '@dhis2-chap/ui'

type Props = {
    datasetId: number | undefined
    orgUnits?: string[]
    periods?: string[]
}

export const useActualCasesByDatasetId = ({
    datasetId,
    orgUnits,
    periods,
}: Props) => {
    return useQuery<DataList, ApiError>({
        queryKey: ['actual-cases-by-dataset', datasetId, orgUnits, periods],
        queryFn: async () => {
            if (!datasetId) throw new Error('datasetId is required')

            return await AnalyticsService.getActualCasesAnalyticsActualCasesBacktestIdGet(
                datasetId,
                orgUnits,
                true
            )
        },
        select: (data) => {
            if (!periods) {
                return data
            }
            return {
                ...data,
                data: data.data?.filter((d) => periods?.includes(d.pe)),
            }
        },
        enabled: !!datasetId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        retry: 0,
    })
}
