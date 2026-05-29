import { useMemo } from 'react';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreatePrediction } from './useCreatePrediction';
import {
    NewPredictionFormValues,
    useNewPredictionFormState,
} from './useNewPredictionFormState';
import {
    getLastCompletedPeriod,
    inputValueToPeriod,
    isSupportedPeriodType,
    periodToInputValue,
    type SupportedPeriodType,
} from '../utils/predictionPeriods';

type ReadyPredictionFormContext = {
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
    initialValues: ModelExecutionFormValues;
};

type UsePredictionFormControllerOptions = {
    predictionSetupId: number;
    context: ReadyPredictionFormContext;
    returnTo?: string;
};

const resolveSelectedPeriod = (
    values: NewPredictionFormValues,
    periodType: SupportedPeriodType,
): string | null => {
    if (!values.absoluteValue) {
        return null;
    }
    return inputValueToPeriod(values.absoluteValue, periodType);
};

export const usePredictionFormController = ({
    predictionSetupId,
    context,
    returnTo,
}: UsePredictionFormControllerOptions) => {
    const { periodType, fromPeriod, anchorPeriod, initialValues } = context;

    const { methods } = useNewPredictionFormState({
        name: initialValues.name ?? '',
        periodType,
        fromPeriod,
        anchorPeriod,
    });

    const {
        createPrediction,
        isSubmitting,
        error,
    } = useCreatePrediction({
        predictionSetupId,
        returnTo,
        onSuccess: () => {
            methods.reset();
        },
    });

    const handleSubmit = (data: NewPredictionFormValues) => {
        const resolvedPeriod = resolveSelectedPeriod(data, periodType);
        if (!resolvedPeriod) {
            return;
        }

        const toDate = periodToInputValue(resolvedPeriod, periodType);

        const mergedValues: ModelExecutionFormValues = {
            name: data.name,
            periodType,
            fromDate: initialValues.fromDate,
            toDate,
            orgUnits: initialValues.orgUnits,
            modelId: initialValues.modelId,
            covariateMappings: initialValues.covariateMappings,
            targetMapping: initialValues.targetMapping,
        };

        createPrediction(mergedValues);
    };

    const handleStartPrediction = () => {
        methods.handleSubmit(handleSubmit)();
    };

    return {
        methods,
        handleStartPrediction,
        isSubmitting,
        error,
        periodType,
        fromPeriod,
        anchorPeriod,
    };
};

export type { ReadyPredictionFormContext };

export const buildReadyPredictionFormContext = (
    initialValues?: Partial<ModelExecutionFormValues>,
): ReadyPredictionFormContext | null => {
    const periodType = initialValues?.periodType;
    if (!isSupportedPeriodType(periodType) || !initialValues?.fromDate || !initialValues.targetMapping) {
        return null;
    }

    const fromPeriod = inputValueToPeriod(initialValues.fromDate, periodType);
    if (!fromPeriod) {
        return null;
    }

    const anchorPeriod = getLastCompletedPeriod(periodType);

    return {
        periodType,
        fromPeriod,
        anchorPeriod,
        initialValues: {
            name: initialValues.name ?? '',
            periodType,
            fromDate: initialValues.fromDate,
            toDate: initialValues.toDate ?? '',
            orgUnits: initialValues.orgUnits ?? [],
            modelId: initialValues.modelId ?? '',
            covariateMappings: initialValues.covariateMappings ?? [],
            targetMapping: initialValues.targetMapping,
        },
    };
};

export const useReadyPredictionFormContext = (
    initialValues?: Partial<ModelExecutionFormValues>,
) => useMemo(
    () => buildReadyPredictionFormContext(initialValues),
    [initialValues],
);
