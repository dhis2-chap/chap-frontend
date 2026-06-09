import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext } from 'react-hook-form';
import { Label } from '@dhis2/ui';
import { PeriodPicker } from '@dhis2-chap/ui';
import { toDhis2FixedPeriodType } from '@dhis2-chap/core';
import { NewPredictionFormValues } from '../hooks/useNewPredictionFormState';
import { SupportedPeriodType } from '../utils/predictionPeriods';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import styles from './PeriodSelectionField.module.css';

type Props = {
    periodType: SupportedPeriodType;
    fromPeriod: string;
    anchorPeriod: string;
    periodSettings: Dhis2PeriodSettings;
};

export const PeriodSelectionField = ({
    periodType,
    fromPeriod,
    anchorPeriod,
    periodSettings,
}: Props) => {
    const { control, formState } = useFormContext<NewPredictionFormValues>();
    const dhis2PeriodType = toDhis2FixedPeriodType(periodType);
    const errorMessage = formState.errors.periodId?.message;

    if (!dhis2PeriodType) {
        return null;
    }

    return (
        <div className={styles.container}>
            <Label>{i18n.t('Training period')}</Label>

            <div className={styles.rangeRow}>
                <PeriodPicker
                    value={fromPeriod}
                    periodType={dhis2PeriodType}
                    calendar={periodSettings.calendar}
                    locale={periodSettings.locale}
                    disabled
                    ariaLabel={i18n.t('Training start period')}
                    dataTest="prediction-from-period-input"
                    onChange={() => undefined}
                />

                <span className={styles.separator} aria-hidden="true">→</span>

                <Controller
                    control={control}
                    name="periodId"
                    render={({ field }) => (
                        <PeriodPicker
                            value={field.value ?? ''}
                            periodType={dhis2PeriodType}
                            calendar={periodSettings.calendar}
                            locale={periodSettings.locale}
                            minPeriodId={fromPeriod}
                            maxPeriodId={anchorPeriod}
                            ariaLabel={i18n.t('Last training period')}
                            dataTest="prediction-absolute-period-input"
                            onChange={period => field.onChange(period.id)}
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
