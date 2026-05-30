import { useMemo } from 'react';
import { ModelExecutionFormValues } from '../../ModelExecutionForm/hooks/useModelExecutionFormState';
import { useCreatePrediction } from './useCreatePrediction';
import {
    NewPredictionFormValues,
    useNewPredictionFormState,
} from './useNewPredictionFormState';
import {
    getLastCompletedPeriodId,
    toDhis2FixedPeriodType,
} from '@dhis2-chap/core';
import {
    isSupportedPeriodType,
    type SupportedPeriodType,
} from '../utils/predictionPeriods';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

type ReadyPredictionFormContext = {
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
    initialValues: ModelExecutionFormValues;
};

type UsePredictionFormControllerOptions = {
    predictionSetupId: number;
    context: ReadyPredictionFormContext;
    periodSettings: Dhis2PeriodSettings;
    returnTo?: string;
};

const resolveSelectedPeriod = (
    values: NewPredictionFormValues,
): string | null => {
    return values.periodId || null;
};

export const usePredictionFormController = ({
    predictionSetupId,
    context,
    periodSettings,
    returnTo,
}: UsePredictionFormControllerOptions) => {
    const { periodType, fromPeriod, anchorPeriod, initialValues } = context;

    const { methods } = useNewPredictionFormState({
        name: initialValues.name ?? '',
        periodType,
        fromPeriod,
        anchorPeriod,
        periodSettings,
    });

    const {
        createPrediction,
        isSubmitting,
        error,
    } = useCreatePrediction({
        predictionSetupId,
        periodSettings,
        returnTo,
        onSuccess: () => {
            methods.reset();
        },
    });

    const handleSubmit = (data: NewPredictionFormValues) => {
        const resolvedPeriod = resolveSelectedPeriod(data);
        if (!resolvedPeriod) {
            return;
        }

        const mergedValues: ModelExecutionFormValues = {
            name: data.name,
            periodType,
            fromPeriodId: initialValues.fromPeriodId,
            toPeriodId: resolvedPeriod,
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
    periodSettings?: Dhis2PeriodSettings,
): ReadyPredictionFormContext | null => {
    const periodType = initialValues?.periodType;
    if (!isSupportedPeriodType(periodType) || !initialValues?.fromPeriodId || !initialValues.targetMapping) {
        return null;
    }

    const dhis2PeriodType = toDhis2FixedPeriodType(periodType);
    if (!dhis2PeriodType || !periodSettings) {
        return null;
    }

    const anchorPeriod = getLastCompletedPeriodId({
        periodType: dhis2PeriodType,
        calendar: periodSettings.calendar,
        locale: periodSettings.locale,
        timeZone: periodSettings.timeZone,
    });

    return {
        periodType,
        fromPeriod: initialValues.fromPeriodId,
        anchorPeriod,
        initialValues: {
            name: initialValues.name ?? '',
            periodType,
            fromPeriodId: initialValues.fromPeriodId,
            toPeriodId: initialValues.toPeriodId ?? '',
            orgUnits: initialValues.orgUnits ?? [],
            modelId: initialValues.modelId ?? '',
            covariateMappings: initialValues.covariateMappings ?? [],
            targetMapping: initialValues.targetMapping,
        },
    };
};

export const useReadyPredictionFormContext = (
    initialValues?: Partial<ModelExecutionFormValues>,
    periodSettings?: Dhis2PeriodSettings,
) => useMemo(
    () => buildReadyPredictionFormContext(initialValues, periodSettings),
    [initialValues, periodSettings],
);
