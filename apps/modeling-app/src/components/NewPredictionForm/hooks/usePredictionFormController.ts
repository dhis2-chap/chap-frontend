import { useMemo } from 'react';
import { PERIOD_TYPES } from '@dhis2-chap/ui';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreatePrediction } from './useCreatePrediction';
import {
    NewPredictionFormValues,
    PERIOD_MODES,
    useNewPredictionFormState,
} from './useNewPredictionFormState';
import {
    SupportedPeriodType,
    getLastCompletedPeriod,
    inputValueToPeriod,
    periodToInputValue,
    shiftPeriod,
} from '../utils/predictionPeriods';

type UsePredictionFormControllerOptions = {
    predictionSetupId?: number;
    initialValues?: Partial<ModelExecutionFormValues>;
    returnTo?: string;
};

const isSupportedPeriodType = (value: unknown): value is SupportedPeriodType => (
    value === PERIOD_TYPES.MONTH || value === PERIOD_TYPES.WEEK
);

const resolveSelectedPeriod = (
    values: NewPredictionFormValues,
    periodType: SupportedPeriodType,
    anchorPeriod: string,
): string | null => {
    if (values.mode === PERIOD_MODES.OFFSET) {
        if (values.offsetValue === null || values.offsetValue === undefined) {
            return null;
        }
        return shiftPeriod(anchorPeriod, periodType, values.offsetValue);
    }
    if (!values.absoluteValue) {
        return null;
    }
    return inputValueToPeriod(values.absoluteValue, periodType);
};

export const usePredictionFormController = ({
    predictionSetupId,
    initialValues,
    returnTo,
}: UsePredictionFormControllerOptions = {}) => {
    const periodType = isSupportedPeriodType(initialValues?.periodType)
        ? initialValues.periodType
        : null;
    const fromInputValue = initialValues?.fromDate ?? '';
    const fromPeriod = periodType && fromInputValue
        ? inputValueToPeriod(fromInputValue, periodType)
        : null;
    const anchorPeriod = useMemo(
        () => (periodType ? getLastCompletedPeriod(periodType) : null),
        [periodType],
    );

    const isContextReady = !!(periodType && fromPeriod && anchorPeriod);

    const { methods } = useNewPredictionFormState({
        name: initialValues?.name ?? '',
        periodType: periodType ?? PERIOD_TYPES.MONTH,
        fromPeriod: fromPeriod ?? '',
        anchorPeriod: anchorPeriod ?? '',
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
        if (!isContextReady || !periodType || !anchorPeriod || !initialValues) {
            return;
        }

        const resolvedPeriod = resolveSelectedPeriod(data, periodType, anchorPeriod);
        if (!resolvedPeriod) {
            return;
        }

        const toDate = periodToInputValue(resolvedPeriod, periodType);

        const mergedValues: ModelExecutionFormValues = {
            name: data.name,
            periodType,
            fromDate: initialValues.fromDate ?? '',
            toDate,
            orgUnits: initialValues.orgUnits ?? [],
            modelId: initialValues.modelId ?? '',
            covariateMappings: initialValues.covariateMappings ?? [],
            // targetMapping is required by ModelExecutionFormValues - guarded by isContextReady upstream.
            targetMapping: initialValues.targetMapping!,
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
        isContextReady,
    };
};
