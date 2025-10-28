import React from 'react';
import {
    IconErrorFilled24,
    Label,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, Control, FieldErrors, useWatch, useFormContext } from 'react-hook-form';
import { ModelExecutionFormValues } from '../../hooks/useModelExecutionFormState';
import { PERIOD_TYPES } from '../../constants';
import styles from './PeriodSelector.module.css';

type Props = {
    control: Control<ModelExecutionFormValues>;
    errors: FieldErrors<ModelExecutionFormValues>;
};

const getInputType = (periodType: keyof typeof PERIOD_TYPES): string => {
    switch (periodType) {
        case PERIOD_TYPES.DAY:
            return 'date';
        case PERIOD_TYPES.WEEK:
            return 'week';
        case PERIOD_TYPES.MONTH:
            return 'month';
        default:
            return 'text';
    }
};

export const PeriodSelector = ({ control, errors }: Props) => {
    const periodType = useWatch({ control, name: 'periodType' });
    const methods = useFormContext<ModelExecutionFormValues>();

    const onPeriodTypeChange = (selected: string) => {
        const selectedCastToPeriodType = selected as keyof typeof PERIOD_TYPES;
        if (selectedCastToPeriodType === PERIOD_TYPES.DAY) {
            // TODO: Implement day period type
        } else {
            methods.setValue('periodType', selected as 'MONTH' | 'WEEK', { shouldValidate: true });
        }

        if (selected !== periodType) {
            methods.resetField('fromDate');
            methods.resetField('toDate');
        }
    };

    return (
        <>
            <div className={styles.formField}>
                <Label>{i18n.t('Period type')}</Label>
                <Controller
                    name="periodType"
                    control={control}
                    render={({ field }) => (
                        <SingleSelectField
                            selected={field.value}
                            error={!!errors.periodType}
                            onChange={({ selected }) => onPeriodTypeChange(selected)}
                            dataTest="evaluation-period-type-select"
                        >
                            <SingleSelectOption
                                disabled
                                value={PERIOD_TYPES.DAY}
                                label={i18n.t('Daily')}
                            />
                            <SingleSelectOption
                                value={PERIOD_TYPES.WEEK}
                                label={i18n.t('Weekly')}
                            />
                            <SingleSelectOption
                                value={PERIOD_TYPES.MONTH}
                                label={i18n.t('Monthly')}
                            />
                        </SingleSelectField>
                    )}
                />
                {errors.periodType && <p className={styles.errorText}>{errors.periodType.message}</p>}
            </div>
            <div className={styles.datePickersContainer}>
                <div className={styles.datePickerField}>
                    <Label>{i18n.t('From period')}</Label>
                    <Controller
                        name="fromDate"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                        className={styles.input}
                                        type={periodType ? getInputType(periodType) : 'text'}
                                        disabled={!periodType}
                                        value={field.value}
                                        onChange={e => field.onChange(e.target.value)}
                                        data-test="evaluation-from-date-input"
                                        style={{ opacity: periodType ? 1 : 0.6 }}
                                    />
                                    {errors.fromDate && <IconErrorFilled24 color="#d32f2f" />}
                                </div>
                                {errors.fromDate && (
                                    <p className={styles.errorText}>{errors.fromDate.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>
                <div className={styles.datePickerField}>
                    <Label>{i18n.t('To period')}</Label>
                    <Controller
                        name="toDate"
                        control={control}
                        render={({ field }) => (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                        className={styles.input}
                                        type={periodType ? getInputType(periodType) : 'text'}
                                        disabled={!periodType}
                                        value={field.value}
                                        onChange={e => field.onChange(e.target.value)}
                                        data-test="evaluation-to-date-input"
                                        style={{ opacity: periodType ? 1 : 0.6 }}
                                    />
                                    {errors.toDate && <IconErrorFilled24 color="#d32f2f" />}
                                </div>
                                {errors.toDate && (
                                    <p className={styles.errorText}>{errors.toDate.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>
            </div>
        </>
    );
};
