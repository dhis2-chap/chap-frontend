import i18n from '@dhis2/d2-i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { ApiError, DatasetsService } from '@dhis2-chap/ui';
import { prepareDataset } from '../utils/prepareDataset';
import type { ImportSummaryCorrected } from '../../ModelExecutionForm/types';
import type { InputCompletenessData } from '../../InputCompleteness/InputCompletenessView';
import { getInputVariables } from '../../InputCompleteness/inputCompleteness';
import { type DatasetFormValues } from './useDatasetFormState';
import { type DatasetImportSummary } from './useCreateDataset';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { Features, useIsFeatureAvailable } from '@/hooks/useIsFeatureAvailable';

export type DatasetInspection = DatasetImportSummary & { completeness: InputCompletenessData };

/** Fetches the dataset from DHIS2 and has Chap validate it in a dry run, without saving anything. */
export const useInspectDataset = (periodSettings: Dhis2PeriodSettings, onProgress?: (message: string) => void) => {
    const queryClient = useQueryClient();
    const dataEngine = useDataEngine();
    const { isAvailable: supportsColumnar } = useIsFeatureAvailable(Features.DATASET_OBSERVATION_COLUMNS);

    return useMutation<DatasetInspection, Error | ApiError, DatasetFormValues>({
        onMutate: () => {
            onProgress?.(i18n.t('Preparing data'));
            queryClient.removeQueries({ queryKey: ['new-backtest-data'] });
        },
        mutationFn: async (formData) => {
            const { request, orgUnitNames, periods } = await prepareDataset(formData, dataEngine, periodSettings, supportsColumnar, queryClient, onProgress);
            onProgress?.(i18n.t('Checking data in Chap'));
            const response = await DatasetsService.makeDatasetV1AnalyticsMakeDatasetPost(request, true);
            return {
                ...(response as unknown as ImportSummaryCorrected),
                orgUnitNames,
                completeness: {
                    observations: request.providedDataColumns ?? request.providedData ?? [],
                    periods,
                    // Every selected location, so ones without any data count as gaps.
                    orgUnits: [...orgUnitNames.keys()],
                    variables: getInputVariables(
                        request.targetColumn ?? 'disease_cases',
                        request.dataSources?.map(source => source.covariate),
                    ),
                },
            };
        },
    });
};
