import { useQuery } from '@tanstack/react-query';
import { AnalyticsService, ApiError, DataList } from '@dhis2-chap/ui';

export const useActualCasesByDatasetId = (datasetId: number | undefined, orgUnits?: string[]) => {
    return useQuery<DataList, ApiError>({
        queryKey: ['actual-cases-by-dataset', datasetId, orgUnits],
        queryFn: async () => {
            if (!datasetId) {
                throw new Error('datasetId is required');
            }
            return await AnalyticsService.getActualCasesAnalyticsActualCasesBacktestIdGet(
                datasetId,
                orgUnits,
                true,
            );
        },
        enabled: !!datasetId,
        staleTime: 300000,
        cacheTime: 300000,
        retry: 0,
    });
};
