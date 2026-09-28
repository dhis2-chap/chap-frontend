import { useMutation } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { ApiError, DatasetsService } from '@dhis2-chap/ui';
import { prepareDataset } from '../utils/prepareDataset';
import type { ImportSummaryCorrected } from '../../ModelExecutionForm/types';
import { type DatasetFormValues } from './useDatasetFormState';
import { type DatasetImportSummary } from './useCreateDataset';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

/** Fetches the dataset from DHIS2 and has CHAP validate it in a dry run, without saving anything. */
export const useInspectDataset = (periodSettings: Dhis2PeriodSettings) => {
    const dataEngine = useDataEngine();

    return useMutation<DatasetImportSummary, Error | ApiError, DatasetFormValues>({
        mutationFn: async (formData) => {
            const { request, orgUnitNames } = await prepareDataset(formData, dataEngine, periodSettings);
            const response = await DatasetsService.makeDatasetV1AnalyticsMakeDatasetPost(request, true);
            return { ...(response as unknown as ImportSummaryCorrected), orgUnitNames };
        },
    });
};
