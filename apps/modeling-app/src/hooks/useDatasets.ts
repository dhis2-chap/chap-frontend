import { useQuery } from '@tanstack/react-query';
import { DatasetsService } from '@dhis2-chap/ui';

export const useDatasets = () => useQuery({
    queryKey: ['datasets'],
    queryFn: () => DatasetsService.getDatasetsV1CrudDatasetsGet(),
});
