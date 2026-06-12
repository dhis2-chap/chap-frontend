import i18n from '@dhis2/d2-i18n';
import { Label } from '@dhis2/ui';
import {
    type Dhis2Calendar,
    type Dhis2FixedPeriod,
    type Dhis2FixedPeriodType,
} from '@dhis2-chap/core';
import { PeriodPicker } from './PeriodPicker';
import styles from './PeriodRangeField.module.css';

export type PeriodRangeFieldProps = {
    periodType: Dhis2FixedPeriodType;
    calendar: Dhis2Calendar;
    locale?: string;
    fromValue?: string | null;
    toValue?: string | null;
    minPeriodId?: string;
    maxPeriodId?: string;
    disabled?: boolean;
    fromLabel?: string;
    toLabel?: string;
    fromError?: string;
    toError?: string;
    fromDataTest?: string;
    toDataTest?: string;
    onFromChange: (period: Dhis2FixedPeriod) => void;
    onToChange: (period: Dhis2FixedPeriod) => void;
};

export const PeriodRangeField = ({
    periodType,
    calendar,
    locale,
    fromValue,
    toValue,
    minPeriodId,
    maxPeriodId,
    disabled,
    fromLabel = i18n.t('From period'),
    toLabel = i18n.t('To period'),
    fromError,
    toError,
    fromDataTest,
    toDataTest,
    onFromChange,
    onToChange,
}: PeriodRangeFieldProps) => (
    <div className={styles.container}>
        <div className={styles.field}>
            <Label>{fromLabel}</Label>
            <PeriodPicker
                value={fromValue}
                periodType={periodType}
                calendar={calendar}
                locale={locale}
                minPeriodId={minPeriodId}
                maxPeriodId={maxPeriodId}
                referencePeriodId={toValue}
                disabled={disabled}
                dataTest={fromDataTest}
                ariaLabel={fromLabel}
                onChange={onFromChange}
            />
            {fromError && <p className={styles.errorText}>{fromError}</p>}
        </div>

        <div className={styles.field}>
            <Label>{toLabel}</Label>
            <PeriodPicker
                value={toValue}
                periodType={periodType}
                calendar={calendar}
                locale={locale}
                minPeriodId={minPeriodId}
                maxPeriodId={maxPeriodId}
                referencePeriodId={fromValue}
                disabled={disabled}
                dataTest={toDataTest}
                ariaLabel={toLabel}
                onChange={onToChange}
            />
            {toError && <p className={styles.errorText}>{toError}</p>}
        </div>
    </div>
);
