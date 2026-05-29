import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext } from 'react-hook-form';
import { Label } from '@dhis2/ui';
import { NewPredictionFormValues } from '../hooks/useNewPredictionFormState';
import {
    SupportedPeriodType,
    periodToInputValue,
} from '../utils/predictionPeriods';
import styles from './PeriodSelectionField.module.css';

type Props = {
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
};

const getInputType = (periodType: SupportedPeriodType): 'month' | 'week' => (
    periodType === 'WEEK' ? 'week' : 'month'
);

export const PeriodSelectionField = ({
    periodType,
    fromPeriod,
    anchorPeriod,
}: Props) => {
    const { control, formState } = useFormContext<NewPredictionFormValues>();

    const inputType = getInputType(periodType);
    const fromInputValue = periodToInputValue(fromPeriod, periodType);
    const maxInputValue = periodToInputValue(anchorPeriod, periodType);

    const errorMessage = formState.errors.absoluteValue?.message;

    return (
        <div className={styles.container}>
            <Label>{i18n.t('Training period')}</Label>

            <div className={styles.rangeRow}>
                <input
                    className={styles.input}
                    type={inputType}
                    value={fromInputValue}
                    disabled
                    aria-label={i18n.t('Training start period')}
                    data-test="prediction-from-period-input"
                />

                <span className={styles.separator} aria-hidden="true">→</span>

                <Controller
                    control={control}
                    name="absoluteValue"
                    render={({ field }) => (
                        <input
                            className={styles.input}
                            type={inputType}
                            min={fromInputValue}
                            max={maxInputValue}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value || null)}
                            aria-label={i18n.t('Last training period')}
                            data-test="prediction-absolute-period-input"
                        />
                    )}
                />
            </div>

            {errorMessage && (
                <p className={styles.errorText}>{errorMessage}</p>
            )}
        </div>
    );
};
