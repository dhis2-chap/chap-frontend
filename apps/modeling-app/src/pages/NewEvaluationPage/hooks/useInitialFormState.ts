import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import { ModelSpecRead } from '@dhis2-chap/ui';
import { useOrgUnitsById } from '../../../hooks/useOrgUnitsById';
import { EvaluationFormValues, PERIOD_TYPES } from '../../../components/NewEvaluationFormContainer/NewEvaluationForm';
import { convertServerToClientPeriod } from '../../../features/timeperiod-selector/utils/timePeriodUtils';
import { useDataItemByIds } from './useDataItemById';
import { CovariateMapping } from '../../../components/NewEvaluationFormContainer/NewEvaluationForm/hooks/useFormController';

type Props = {
    models: ModelSpecRead[] | undefined;
    isModelsLoading: boolean;
};

const locationStateInnerSchema = z
    .object({
        name: z.string().optional(),
        periodType: z.enum([PERIOD_TYPES.WEEK, PERIOD_TYPES.MONTH]).optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        orgUnits: z.array(z.string()).optional(),
        modelId: z.string().optional(),
        dataSources: z.array(z.object({
            covariate: z.string(),
            dataElementId: z.string(),
        })).optional(),
    })
    .superRefine((data, ctx) => {
        if ((data.fromDate || data.toDate) && !data.periodType) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Period type is required when either fromDate or toDate are provided',
                path: ['periodType'],
            });
        }
        if (data.dataSources && data.dataSources.length > 0 && !data.modelId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Model ID is required when data sources are provided',
                path: ['modelId'],
            });
        }
    });

const evaluationFormLocationStateSchema = locationStateInnerSchema.optional();

export const useInitialFormState = ({ models, isModelsLoading }: Props) => {
    const location = useLocation();

    const {
        data: locationState,
        error,
    } = evaluationFormLocationStateSchema.safeParse(location.state);

    const {
        data: orgUnitsData,
        isInitialLoading: isOrgUnitsInitialLoading,
    } = useOrgUnitsById(locationState?.orgUnits || []);

    const {
        dataItems,
        isLoading: isDataItemsLoading,
    } = useDataItemByIds({
        dataItemIds: locationState
            ?.dataSources
            ?.map(dataSource => dataSource.dataElementId) || [],
    });

    const initialValues: Partial<EvaluationFormValues> = useMemo(() => {
        if (!models) return {};

        const values: Partial<EvaluationFormValues> = {
            name: locationState?.name || '',
            periodType: locationState?.periodType || PERIOD_TYPES.MONTH,
            fromDate: locationState?.fromDate ? convertServerToClientPeriod(locationState.fromDate, locationState.periodType!) : '',
            toDate: locationState?.toDate ? convertServerToClientPeriod(locationState.toDate, locationState.periodType!) : '',
            orgUnits: orgUnitsData?.organisationUnits || [],
            modelId: locationState?.modelId || '',
        };

        if (locationState?.modelId) {
            const selectedModel = models.find(model => model.id.toString() === locationState.modelId);
            if (selectedModel && dataItems && dataItems.length > 0) {
                const covariateMappings = locationState?.dataSources?.map((dataSource) => {
                    if (dataSource.covariate === selectedModel.target.name) {
                        return null;
                    }
                    const dataItem = dataItems.find(dataItem => dataItem.id === dataSource.dataElementId);

                    if (!dataItem) {
                        console.error('Data item not found or is the target', { dataItem, selectedModel });
                        return null;
                    }
                    return ({
                        covariateName: dataSource.covariate,
                        dataItem: dataItem,
                    });
                }).filter(Boolean) as CovariateMapping[] || [];

                values.covariateMappings = covariateMappings;

                const targetId = locationState?.dataSources?.find(dataSource => dataSource.covariate === selectedModel.target.name)?.dataElementId;
                const targetMapping = dataItems.find(dataItem => dataItem.id === targetId);
                if (targetMapping && selectedModel.target.name) {
                    values.targetMapping = {
                        covariateName: selectedModel.target.name,
                        dataItem: targetMapping,
                    };
                }
            }
        }

        return values;
    }, [dataItems, locationState, models, orgUnitsData]);

    useEffect(() => {
        if (error) {
            console.warn('Invalid location state:', error.errors);
        }
    }, [error]);

    const isLoading = (
        (!!locationState?.orgUnits?.length && isOrgUnitsInitialLoading)
        || (!!locationState?.dataSources?.length && isDataItemsLoading)
        || isModelsLoading
    );

    return {
        initialValues,
        isLoading,
    };
};
