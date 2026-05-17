import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Label, SegmentedControl } from '@dhis2/ui';
import { formatPeriodId } from '../../../utils/predictionRunMetadata';
import {
    NewPredictionFormValues,
    PERIOD_MODES,
} from '../hooks/useNewPredictionFormState';
import { useResolvedToPeriod } from '../hooks/useResolvedToPeriod';
import {
    SupportedPeriodType,
    periodToInputValue,
} from '../utils/predictionPeriods';
import styles from './PeriodSelectionField.module.css';

type Props = {
    periodType: SupportedPeriodType;
    anchorPeriod: string;
};

const getInputType = (periodType: SupportedPeriodType): 'month' | 'week' => (
    periodType === 'WEEK' ? 'week' : 'month'
);

const inputModeOptions = [
    { value: PERIOD_MODES.OFFSET, label: i18n.t('Offset') },
    { value: PERIOD_MODES.ABSOLUTE, label: i18n.t('Absolute') },
];

export const PeriodSelectionField = ({
    periodType,
    anchorPeriod,
}: Props) => {
    const methods = useFormContext<NewPredictionFormValues>();
    const { control, setValue, clearErrors, formState } = methods;
    const mode = useWatch({ control, name: 'mode' });

    const maxInputValue = periodToInputValue(anchorPeriod, periodType);

    const resolvedPeriod = useResolvedToPeriod({ control, periodType, anchorPeriod });

    const resolvedLabel = resolvedPeriod
        ? (formatPeriodId(resolvedPeriod) ?? resolvedPeriod)
        : null;

    const handleModeChange = ({ value }: { value: string }) => {
        const newMode = value as typeof PERIOD_MODES[keyof typeof PERIOD_MODES];
        setValue('mode', newMode, { shouldDirty: true });
        if (newMode === PERIOD_MODES.OFFSET) {
            setValue('offsetValue', 0, { shouldDirty: true });
            setValue('absoluteValue', null, { shouldDirty: true });
        } else {
            setValue('absoluteValue', null, { shouldDirty: true });
            setValue('offsetValue', null, { shouldDirty: true });
        }
        clearErrors(['offsetValue', 'absoluteValue']);
    };

    const errorMessage = mode === PERIOD_MODES.OFFSET
        ? formState.errors.offsetValue?.message
        : formState.errors.absoluteValue?.message;

    return (
        <div className={styles.container}>
            <Label>{i18n.t('Last training period')}</Label>

            <div className={styles.modeSelector}>
                <SegmentedControl
                    options={inputModeOptions}
                    selected={mode}
                    onChange={handleModeChange}
                />
            </div>

            <div className={mode === PERIOD_MODES.OFFSET ? undefined : styles.hidden}>
                <Controller
                    control={control}
                    name="offsetValue"
                    render={({ field }) => (
                        <div className={styles.inputRow}>
                            <input
                                className={styles.input}
                                type="number"
                                max={0}
                                step={1}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    if (next === '' || next === '-') {
                                        field.onChange(null);
                                        return;
                                    }
                                    const parsed = Number(next);
                                    field.onChange(Number.isFinite(parsed) ? parsed : null);
                                }}
                                aria-label={i18n.t('Offset')}
                                data-test="prediction-offset-input"
                            />
                            <span className={styles.helper}>
                                {i18n.t('periods back from {{anchor}}', {
                                    anchor: formatPeriodId(anchorPeriod) ?? anchorPeriod,
                                })}
                            </span>
                        </div>
                    )}
                />
            </div>

            <div className={mode === PERIOD_MODES.ABSOLUTE ? undefined : styles.hidden}>
                <Controller
                    control={control}
                    name="absoluteValue"
                    render={({ field }) => (
                        <input
                            className={styles.input}
                            type={getInputType(periodType)}
                            max={maxInputValue}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value || null)}
                            aria-label={i18n.t('Last training period')}
                            data-test="prediction-absolute-period-input"
                        />
                    )}
                />
            </div>

            {errorMessage ? (
                <p className={styles.errorText}>{errorMessage}</p>
            ) : resolvedLabel ? (
                <p className={styles.resolvedLabel}>{resolvedLabel}</p>
            ) : null}
        </div>
    );
};
