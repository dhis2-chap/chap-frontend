import { useMemo } from 'react';
import { useWatch, Control } from 'react-hook-form';
import {
    NewPredictionFormValues,
    PERIOD_MODES,
} from './useNewPredictionFormState';
import {
    SupportedPeriodType,
    inputValueToPeriod,
    shiftPeriod,
} from '../utils/predictionPeriods';

type Options = {
    control: Control<NewPredictionFormValues>;
    periodType: SupportedPeriodType;
    anchorPeriod: string;
};

export const useResolvedToPeriod = ({ control, periodType, anchorPeriod }: Options): string | null => {
    const mode = useWatch({ control, name: 'mode' });
    const offsetValue = useWatch({ control, name: 'offsetValue' });
    const absoluteValue = useWatch({ control, name: 'absoluteValue' });

    return useMemo(() => {
        if (mode === PERIOD_MODES.OFFSET) {
            if (offsetValue === null || offsetValue === undefined || Number.isNaN(offsetValue)) {
                return null;
            }
            return shiftPeriod(anchorPeriod, periodType, offsetValue);
        }
        return absoluteValue ? inputValueToPeriod(absoluteValue, periodType) : null;
    }, [mode, offsetValue, absoluteValue, anchorPeriod, periodType]);
};
