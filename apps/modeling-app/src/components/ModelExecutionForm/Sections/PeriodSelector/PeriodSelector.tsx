import {
    Label,
    NoticeBox,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, Control, FieldErrors, useWatch, useFormContext } from 'react-hook-form';
import { ModelExecutionFormValues } from '../../hooks/useModelExecutionFormState';
import {
    comparePeriodIds,
    getLastCompletedPeriodId,
    PERIOD_TYPES,
    toDhis2FixedPeriodType,
} from '@dhis2-chap/core';
import { PeriodRangeField } from '@dhis2-chap/ui';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import styles from './PeriodSelector.module.css';

type Props = {
    control: Control<ModelExecutionFormValues>;
    errors: FieldErrors<ModelExecutionFormValues>;
    periodSettings: Dhis2PeriodSettings;
    periodSettingsError?: Error | null;
    periodSettingsLoading?: boolean;
};

export const PeriodSelector = ({
    control,
    errors,
    periodSettings,
    periodSettingsError,
    periodSettingsLoading,
}: Props) => {
    const periodType = useWatch({ control, name: 'periodType' });
    const fromPeriodId = useWatch({ control, name: 'fromPeriodId' });
    const toPeriodId = useWatch({ control, name: 'toPeriodId' });
    const methods = useFormContext<ModelExecutionFormValues>();
    const dhis2PeriodType = toDhis2FixedPeriodType(periodType);
    const rangeError = (() => {
        if (!fromPeriodId || !toPeriodId) {
            return undefined;
        }

        try {
            const comparison = comparePeriodIds({
                a: toPeriodId,
                b: fromPeriodId,
                calendar: periodSettings.calendar,
                locale: periodSettings.locale,
            });
            return comparison < 0
                ? i18n.t('End period must be after start period')
                : undefined;
        } catch {
            return i18n.t('Invalid period');
        }
    })();
    const maxPeriodId = dhis2PeriodType
        ? getLastCompletedPeriodId({
                periodType: dhis2PeriodType,
                calendar: periodSettings.calendar,
                locale: periodSettings.locale,
                timeZone: periodSettings.timeZone,
            })
        : undefined;

    const onPeriodTypeChange = (selected: string) => {
        const selectedCastToPeriodType = selected as keyof typeof PERIOD_TYPES;
        if (selectedCastToPeriodType === PERIOD_TYPES.DAY) {
            // TODO: Implement day period type
        } else {
            methods.setValue('periodType', selected as 'MONTH' | 'WEEK', { shouldValidate: true });
        }

        if (selected !== periodType) {
            methods.setValue('fromPeriodId', '', { shouldValidate: true, shouldDirty: true });
            methods.setValue('toPeriodId', '', { shouldValidate: true, shouldDirty: true });
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

            {periodSettingsError ? (
                <NoticeBox
                    error
                    title={i18n.t('Period selection is unavailable')}
                    className={styles.periodSettingsNotice}
                >
                    {periodSettingsError.message}
                </NoticeBox>
            ) : dhis2PeriodType && (
                <PeriodRangeField
                    periodType={dhis2PeriodType}
                    calendar={periodSettings.calendar}
                    locale={periodSettings.locale}
                    fromValue={fromPeriodId}
                    toValue={toPeriodId}
                    maxPeriodId={maxPeriodId}
                    disabled={periodSettingsLoading}
                    fromError={errors.fromPeriodId?.message}
                    toError={errors.toPeriodId?.message || rangeError}
                    fromDataTest="evaluation-from-period-input"
                    toDataTest="evaluation-to-period-input"
                    onFromChange={period => methods.setValue('fromPeriodId', period.id, { shouldValidate: true, shouldDirty: true })}
                    onToChange={period => methods.setValue('toPeriodId', period.id, { shouldValidate: true, shouldDirty: true })}
                />
            )}
        </>
    );
};
