import { useQuery } from '@tanstack/react-query';
import { ApiError, DataSetWithObservations, DatasetsService } from '@dhis2-chap/ui';

export const useDataset = (datasetId?: number) => useQuery<DataSetWithObservations, ApiError>({
    queryKey: ['dataset', datasetId],
    queryFn: () => DatasetsService.getDatasetV1CrudDatasetsDatasetIdGet(datasetId!),
    enabled: datasetId != null && Number.isFinite(datasetId),
    staleTime: 5 * 60 * 1000,
    retry: false,
});
