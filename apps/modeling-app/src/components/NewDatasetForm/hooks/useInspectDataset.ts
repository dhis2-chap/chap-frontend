import { useMutation } from '@tanstack/react-query';
import { useDataEngine } from '@dhis2/app-runtime';
import { prepareDataset } from '../utils/prepareDataset';
import { inspectDataset } from '../utils/inspectDataset';
import { type DatasetFormValues } from './useDatasetFormState';
import { type DatasetImportSummary } from './useCreateDataset';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

/** Fetches the dataset from DHIS2 and checks it the way CHAP will, without saving anything. */
export const useInspectDataset = (periodSettings: Dhis2PeriodSettings) => {
    const dataEngine = useDataEngine();

    return useMutation<DatasetImportSummary, Error, DatasetFormValues>({
        mutationFn: async (formData) => {
            const prepared = await prepareDataset(formData, dataEngine, periodSettings);
            return {
                ...inspectDataset(prepared),
                orgUnitNames: new Map(prepared.orgUnits.map(orgUnit => [orgUnit.id, orgUnit.displayName])),
            };
        },
    });
};
