import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useOrgUnitsById } from '../../../hooks/useOrgUnitsById';
import { EvaluationFormValues, PERIOD_TYPES } from '../../../components/NewEvaluationForm';

const locationStateInnerSchema = z.object({
    name: z.string().optional(),
    periodType: z.enum([PERIOD_TYPES.WEEK, PERIOD_TYPES.MONTH]).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    orgUnits: z.array(z.string()).optional(),
    modelId: z.string().optional(),
});

const evaluationFormLocationStateSchema = locationStateInnerSchema.optional();

export const useInitialFormState = () => {
    const location = useLocation();

    const {
        data: locationState,
        error,
    } = evaluationFormLocationStateSchema.safeParse(location.state);

    const {
        data: orgUnitsData,
        isInitialLoading: isOrgUnitsInitialLoading,
    } = useOrgUnitsById(locationState?.orgUnits || []);

    const initialValues: Partial<EvaluationFormValues> = useMemo(
        () => ({
            name: locationState?.name || '',
            periodType: locationState?.periodType || PERIOD_TYPES.MONTH,
            fromDate: locationState?.fromDate || '',
            toDate: locationState?.toDate || '',
            orgUnits: orgUnitsData?.organisationUnits || [],
            modelId: locationState?.modelId || '',
        }), [locationState, orgUnitsData]);

    useEffect(() => {
        if (error) {
            console.warn('Invalid location state:', error.errors);
        }
    }, [error]);

    const isLoading = !!locationState?.orgUnits?.length && isOrgUnitsInitialLoading;

    return {
        initialValues,
        isLoading,
    };
};
