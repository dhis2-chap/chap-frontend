import { useEffect, useMemo, useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    IconChevronDown16,
    IconChevronLeft16,
    IconChevronRight16,
    Layer,
    Popper,
} from '@dhis2/ui';
import {
    compareFixedPeriods,
    createFixedPeriodFromPeriodId,
    type Dhis2Calendar,
    type Dhis2FixedPeriod,
    type Dhis2FixedPeriodType,
    generateFixedPeriods,
    getTodayInCalendar,
} from '@dhis2-chap/core';
import styles from './PeriodPicker.module.css';

export type PeriodPickerProps = {
    value?: string | null;
    periodType: Dhis2FixedPeriodType;
    calendar: Dhis2Calendar;
    locale?: string;
    minPeriodId?: string;
    maxPeriodId?: string;
    referencePeriodId?: string | null;
    isPeriodDisabled?: (period: Dhis2FixedPeriod) => boolean;
    disabled?: boolean;
    placeholder?: string;
    ariaLabel?: string;
    dataTest?: string;
    onChange: (period: Dhis2FixedPeriod) => void;
};

const getPeriodYear = (periodId: string | null | undefined, calendar: Dhis2Calendar, locale?: string) => {
    if (!periodId) {
        return undefined;
    }

    return Number(createFixedPeriodFromPeriodId({
        periodId,
        calendar,
        locale,
    }).id.substring(0, 4));
};

const getCurrentCalendarYear = (calendar: Dhis2Calendar) => (
    Number(getTodayInCalendar({ calendar }).substring(0, 4))
);

const getInitialVisibleYear = ({
    value,
    referencePeriodId,
    maxPeriodId,
    minPeriodId,
    calendar,
    locale,
}: Pick<PeriodPickerProps, 'value' | 'referencePeriodId' | 'maxPeriodId' | 'minPeriodId' | 'calendar' | 'locale'>) => (
    getPeriodYear(value, calendar, locale)
    ?? getPeriodYear(referencePeriodId, calendar, locale)
    ?? getPeriodYear(maxPeriodId, calendar, locale)
    ?? getPeriodYear(minPeriodId, calendar, locale)
    ?? getCurrentCalendarYear(calendar)
);

const isMonthlyPeriodType = (periodType: Dhis2FixedPeriodType) => periodType.includes('MONTHLY');

const getMonthlyReferenceLabel = (periodId: string) => (
    `${periodId.slice(0, 4)}-${periodId.slice(4, 6)}`
);

const getMonthlyYear = (periodId: string) => periodId.slice(0, 4);
const getMonthlyMonth = (periodId: string) => Number(periodId.slice(4, 6));
const isWeeklyPeriodType = (periodType: Dhis2FixedPeriodType) => periodType.includes('WEEKLY');

const formatGregorianMonthName = (periodId: string, locale: string) => {
    const year = Number(getMonthlyYear(periodId));
    const monthIndex = getMonthlyMonth(periodId) - 1;

    return new Intl.DateTimeFormat(locale, {
        month: 'long',
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, monthIndex, 1)));
};

const formatGregorianMonthlyLabel = (periodId: string, locale: string) => {
    const year = Number(getMonthlyYear(periodId));
    const monthIndex = getMonthlyMonth(periodId) - 1;

    return new Intl.DateTimeFormat(locale, {
        month: 'long',
        timeZone: 'UTC',
        year: 'numeric',
    }).format(new Date(Date.UTC(year, monthIndex, 1)));
};

const getFallbackMonthlyLabel = (
    period: Dhis2FixedPeriod,
    calendar: Dhis2Calendar,
    locale: string,
) => {
    if (calendar === 'gregory' || calendar === 'iso8601') {
        return formatGregorianMonthlyLabel(period.id, locale);
    }

    return i18n.t('Month {{month}}, {{year}}', {
        month: getMonthlyMonth(period.id),
        year: getMonthlyYear(period.id),
    });
};

const getFallbackMonthlyCellLabel = (
    period: Dhis2FixedPeriod,
    calendar: Dhis2Calendar,
    locale: string,
) => {
    if (calendar === 'gregory' || calendar === 'iso8601') {
        return formatGregorianMonthName(period.id, locale);
    }

    return i18n.t('Month {{month}}', {
        month: getMonthlyMonth(period.id),
    });
};

const removeMonthlyYearFromLabel = (label: string, periodId: string) => {
    const labelWithoutYear = label
        .replace(getMonthlyYear(periodId), '')
        .replace(/\s+/g, ' ')
        .trim();

    return labelWithoutYear || label;
};

const getPeriodPrimaryLabel = (
    period: Dhis2FixedPeriod | undefined,
    calendar: Dhis2Calendar,
    locale: string,
) => {
    if (!period) {
        return undefined;
    }

    const label = (period.displayName || period.name)?.trim();
    if (
        label &&
        isMonthlyPeriodType(period.periodType) &&
        label === period.id.slice(0, 4)
    ) {
        return getFallbackMonthlyLabel(period, calendar, locale);
    }

    return label || period.id;
};

const getPeriodCellPrimaryLabel = (
    period: Dhis2FixedPeriod,
    calendar: Dhis2Calendar,
    locale: string,
) => {
    if (!isMonthlyPeriodType(period.periodType)) {
        return getPeriodPrimaryLabel(period, calendar, locale);
    }

    const label = (period.displayName || period.name)?.trim();
    if (label && label !== getMonthlyYear(period.id)) {
        return removeMonthlyYearFromLabel(label, period.id);
    }

    return getFallbackMonthlyCellLabel(period, calendar, locale);
};

const getPeriodSecondaryLabel = (period: Dhis2FixedPeriod) => {
    if (isMonthlyPeriodType(period.periodType)) {
        return getMonthlyReferenceLabel(period.id);
    }

    if (isWeeklyPeriodType(period.periodType)) {
        return undefined;
    }

    return period.id;
};

const YEAR_SELECT_PAST_YEARS = 100;
const YEAR_SELECT_FUTURE_YEARS = 25;
const NEPALI_MIN_YEAR = 1971;
const NEPALI_MAX_YEAR = 2100;

const getYearFromPeriod = (period: Dhis2FixedPeriod | undefined) => (
    period ? Number(period.id.substring(0, 4)) : undefined
);

const getYearSelectOptions = ({
    visibleYear,
    minYear,
    maxYear,
    calendar,
}: {
    visibleYear: number;
    minYear?: number;
    maxYear?: number;
    calendar: Dhis2Calendar;
}) => {
    let startYear = visibleYear - YEAR_SELECT_PAST_YEARS;
    let endYear = visibleYear + YEAR_SELECT_FUTURE_YEARS;

    if (calendar === 'nepali') {
        startYear = Math.max(startYear, NEPALI_MIN_YEAR);
        endYear = Math.min(endYear, NEPALI_MAX_YEAR);
    }

    if (minYear !== undefined) {
        startYear = Math.max(startYear, minYear);
    }

    if (maxYear !== undefined) {
        endYear = Math.min(endYear, maxYear);
    }

    const boundedStartYear = Math.min(startYear, visibleYear);
    const boundedEndYear = Math.max(endYear, visibleYear);

    return Array.from(
        { length: boundedEndYear - boundedStartYear + 1 },
        (_, index) => boundedStartYear + index,
    );
};

const popperOffsetModifier = {
    name: 'offset' as const,
    options: {
        offset: [0, 2] as [number, number],
    },
};

export const PeriodPicker = ({
    value,
    periodType,
    calendar,
    locale = 'en',
    minPeriodId,
    maxPeriodId,
    referencePeriodId,
    isPeriodDisabled,
    disabled,
    placeholder = i18n.t('Select period'),
    ariaLabel = i18n.t('Select period'),
    dataTest,
    onChange,
}: PeriodPickerProps) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const [visibleYear, setVisibleYear] = useState(() => getInitialVisibleYear({
        value,
        referencePeriodId,
        minPeriodId,
        maxPeriodId,
        calendar,
        locale,
    }));

    const selectedPeriod = useMemo(() => (
        value
            ? createFixedPeriodFromPeriodId({ periodId: value, calendar, locale })
            : undefined
    ), [calendar, locale, value]);

    const minPeriod = useMemo(() => (
        minPeriodId
            ? createFixedPeriodFromPeriodId({ periodId: minPeriodId, calendar, locale })
            : undefined
    ), [calendar, locale, minPeriodId]);

    const maxPeriod = useMemo(() => (
        maxPeriodId
            ? createFixedPeriodFromPeriodId({ periodId: maxPeriodId, calendar, locale })
            : undefined
    ), [calendar, locale, maxPeriodId]);

    const periods = useMemo(() => generateFixedPeriods({
        year: visibleYear,
        periodType,
        calendar,
        locale,
    }), [calendar, locale, periodType, visibleYear]);

    const yearOptions = useMemo(() => getYearSelectOptions({
        visibleYear,
        minYear: getYearFromPeriod(minPeriod),
        maxYear: getYearFromPeriod(maxPeriod),
        calendar,
    }), [calendar, maxPeriod, minPeriod, visibleYear]);

    useEffect(() => {
        const periodId = value || referencePeriodId;
        if (!periodId) {
            return;
        }

        setVisibleYear(currentVisibleYear => (
            getPeriodYear(periodId, calendar, locale) ?? currentVisibleYear
        ));
    }, [calendar, locale, referencePeriodId, value]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    const closeAndFocusTrigger = () => {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
    };

    const periodIsDisabled = (period: Dhis2FixedPeriod) => {
        if (minPeriod && compareFixedPeriods(period, minPeriod) < 0) {
            return true;
        }

        if (maxPeriod && compareFixedPeriods(period, maxPeriod) > 0) {
            return true;
        }

        return isPeriodDisabled?.(period) ?? false;
    };

    const handleSelect = (period: Dhis2FixedPeriod) => {
        if (periodIsDisabled(period)) {
            return;
        }

        onChange(period);
        closeAndFocusTrigger();
    };

    const triggerLabel = getPeriodPrimaryLabel(selectedPeriod, calendar, locale) ?? placeholder;

    return (
        <div
            className={styles.container}
            ref={anchorRef}
        >
            <button
                type="button"
                ref={triggerRef}
                className={styles.trigger}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-expanded={open}
                data-test={dataTest}
                onClick={() => setOpen(prev => !prev)}
            >
                <span className={selectedPeriod ? styles.triggerValue : styles.placeholder}>
                    {triggerLabel}
                </span>
                <IconChevronDown16 />
            </button>

            {open && (
                <Layer onBackdropClick={closeAndFocusTrigger}>
                    <Popper
                        reference={anchorRef}
                        placement="bottom-start"
                        modifiers={[popperOffsetModifier]}
                    >
                        <div className={styles.popover}>
                            <div className={styles.header}>
                                <div className={styles.yearNavigation}>
                                    <div className={styles.yearNavigationPrevious}>
                                        <button
                                            type="button"
                                            className={styles.iconButton}
                                            aria-label={i18n.t('Previous year')}
                                            data-test={dataTest ? `${dataTest}-previous-year` : undefined}
                                            onClick={() => setVisibleYear(year => year - 1)}
                                        >
                                            <IconChevronLeft16 />
                                        </button>
                                    </div>
                                    <div className={styles.yearSelectWrapper}>
                                        <select
                                            className={styles.yearSelect}
                                            aria-label={i18n.t('Select year')}
                                            data-test={dataTest ? `${dataTest}-visible-year` : undefined}
                                            value={visibleYear}
                                            onChange={event => setVisibleYear(Number(event.target.value))}
                                        >
                                            {yearOptions.map(year => (
                                                <option
                                                    key={year}
                                                    value={year}
                                                >
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                        <svg
                                            className={styles.yearSelectIcon}
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            aria-hidden="true"
                                            focusable="false"
                                        >
                                            <path
                                                d="M10.1465 6.85363L10.8536 6.14652L8.00004 3.29297L5.14648 6.14652L5.85359 6.85363L8.00004 4.70718L10.1465 6.85363ZM5.85367 9.1466L5.14656 9.8537L8.00011 12.7073L10.8537 9.8537L10.1466 9.1466L8.00011 11.293L5.85367 9.1466Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </div>
                                    <div className={styles.yearNavigationNext}>
                                        <button
                                            type="button"
                                            className={styles.iconButton}
                                            aria-label={i18n.t('Next year')}
                                            data-test={dataTest ? `${dataTest}-next-year` : undefined}
                                            onClick={() => setVisibleYear(year => year + 1)}
                                        >
                                            <IconChevronRight16 />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={isMonthlyPeriodType(periodType) ? styles.monthGrid : styles.weekList}>
                                {periods.map((period) => {
                                    const selected = selectedPeriod?.id === period.id;
                                    const periodDisabled = periodIsDisabled(period);
                                    const secondaryLabel = getPeriodSecondaryLabel(period);
                                    const buttonClassName = [
                                        selected ? styles.periodButtonSelected : styles.periodButton,
                                        secondaryLabel ? undefined : styles.periodButtonSingleLine,
                                    ].filter(Boolean).join(' ');

                                    return (
                                        <button
                                            type="button"
                                            key={period.id}
                                            className={buttonClassName}
                                            disabled={periodDisabled}
                                            aria-pressed={selected}
                                            title={getPeriodPrimaryLabel(period, calendar, locale)}
                                            data-test={dataTest ? `${dataTest}-option-${period.id}` : undefined}
                                            onClick={() => handleSelect(period)}
                                        >
                                            <span className={styles.periodName}>
                                                {getPeriodCellPrimaryLabel(period, calendar, locale)}
                                            </span>
                                            {secondaryLabel && (
                                                <span className={styles.periodId}>
                                                    {secondaryLabel}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Popper>
                </Layer>
            )}
        </div>
    );
};
