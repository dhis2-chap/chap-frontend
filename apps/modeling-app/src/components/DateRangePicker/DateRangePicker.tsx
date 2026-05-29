import { useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    IconCalendar16,
    IconChevronLeft16,
    IconChevronRight16,
    IconCross16,
    Layer,
    Popper,
} from '@dhis2/ui';
import { useDatePicker } from '@dhis2/multi-calendar-dates';
import { addMonths, format, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns';
import cx from 'classnames';
import {
    formatDateRangeParam,
    getDateRangeBounds,
    hasDateRangeValue,
    parseDateRangeParam,
    type DateRangeValue,
} from '../../utils/jobDateRange';
import styles from './DateRangePicker.module.css';

type Props = {
    className?: string;
    placeholder?: string;
    value: DateRangeValue;
    onChange: (value: DateRangeValue) => void;
};

type CalendarMonth = ReturnType<typeof useDatePicker>;

const CALENDAR_OPTIONS = {
    calendar: 'gregory' as const,
    weekDayFormat: 'short' as const,
};

const getInitialVisibleDate = (value: DateRangeValue) => (
    value.fromDate ?? value.toDate ?? formatDateRangeParam(new Date())
);

const shiftVisibleMonth = (dateString: string, amount: number) => {
    const date = parseDateRangeParam(dateString) ?? new Date();
    return formatDateRangeParam(addMonths(date, amount));
};

const formatDisplayDate = (dateString?: string) => {
    const date = parseDateRangeParam(dateString);
    return date ? format(date, 'MMM d, yyyy') : undefined;
};

const getDisplayValue = (value: DateRangeValue, placeholder: string) => {
    const from = formatDisplayDate(value.fromDate);
    const to = formatDisplayDate(value.toDate);

    if (from && to) {
        return from === to ? from : `${from} - ${to}`;
    }

    if (from) {
        return from;
    }

    if (to) {
        return i18n.t('Until {{date}}', { date: to });
    }

    return placeholder;
};

type DateRangePickerPopoverProps = {
    hasValue: boolean;
    onChange: (value: DateRangeValue) => void;
    onClose: () => void;
    value: DateRangeValue;
};

const DateRangePickerPopover = ({
    hasValue,
    onChange,
    onClose,
    value,
}: DateRangePickerPopoverProps) => {
    const [firstMonthDate] = useState(() => getInitialVisibleDate(value));
    const [secondMonthDate] = useState(() => shiftVisibleMonth(firstMonthDate, 1));
    const from = parseDateRangeParam(value.fromDate);
    const to = parseDateRangeParam(value.toDate);
    const bounds = getDateRangeBounds(value);
    const today = startOfDay(new Date());

    const handleDateSelect = (dateString?: string) => {
        const selectedDate = parseDateRangeParam(dateString);

        if (!selectedDate || !dateString || isAfter(selectedDate, today)) {
            return;
        }

        if (!from || to) {
            onChange({ fromDate: dateString });
            return;
        }

        if (isBefore(selectedDate, from)) {
            onChange({
                fromDate: dateString,
                toDate: value.fromDate,
            });
            onClose();
            return;
        }

        onChange({
            fromDate: value.fromDate,
            toDate: dateString,
        });
        onClose();
    };

    const firstMonth = useDatePicker({
        date: firstMonthDate,
        options: CALENDAR_OPTIONS,
        onDateSelect: payload => handleDateSelect(payload?.calendarDateString),
    });
    const secondMonth = useDatePicker({
        date: secondMonthDate,
        options: CALENDAR_OPTIONS,
        onDateSelect: payload => handleDateSelect(payload?.calendarDateString),
    });

    const handlePreviousMonth = () => {
        firstMonth.prevMonth.navigateTo();
        secondMonth.prevMonth.navigateTo();
    };

    const handleNextMonth = () => {
        firstMonth.nextMonth.navigateTo();
        secondMonth.nextMonth.navigateTo();
    };

    const handleClear = () => {
        onChange({});
        onClose();
    };

    const renderMonth = (month: CalendarMonth, position: 'first' | 'second') => (
        <div className={styles.month}>
            <div className={styles.monthHeader}>
                {position === 'first' ? (
                    <button
                        type="button"
                        className={styles.navButton}
                        aria-label={i18n.t('Previous month')}
                        onClick={handlePreviousMonth}
                    >
                        <IconChevronLeft16 />
                    </button>
                ) : (
                    <span className={styles.navSpacer} />
                )}
                <div className={styles.monthTitle}>
                    {month.currMonth.label}
                    {' '}
                    {month.currYear.label}
                </div>
                {position === 'second' ? (
                    <button
                        type="button"
                        className={styles.navButton}
                        aria-label={i18n.t('Next month')}
                        onClick={handleNextMonth}
                    >
                        <IconChevronRight16 />
                    </button>
                ) : (
                    <span className={styles.navSpacer} />
                )}
            </div>
            <div className={styles.weekdays}>
                {month.weekDayLabels.map((label, index) => (
                    <div key={`${label}-${index}`} className={styles.weekday}>
                        {label}
                    </div>
                ))}
            </div>
            <div className={styles.days}>
                {month.calendarWeekDays.flat().map((day) => {
                    const date = parseDateRangeParam(day.dateValue);
                    const isRangeStart = !!date && !!from && isSameDay(date, from);
                    const isRangeEnd = !!date && !!to && isSameDay(date, to);
                    const isSingleDay = isRangeStart && (!to || isSameDay(from as Date, to));
                    const isDisabled = !!date && isAfter(date, today);
                    const isInsideRange = !!date && !!bounds &&
                        isAfter(date, bounds.start) &&
                        isBefore(date, bounds.end);
                    const isSelected = isRangeStart || isRangeEnd;

                    return (
                        <button
                            key={`${position}-${day.dateValue}`}
                            type="button"
                            className={cx(styles.dayButton, {
                                [styles.outsideMonth]: !day.isInCurrentMonth,
                                [styles.today]: day.isToday,
                                [styles.inRange]: isInsideRange,
                                [styles.rangeStart]: isRangeStart,
                                [styles.rangeEnd]: isRangeEnd,
                                [styles.singleDay]: isSingleDay,
                                [styles.disabledDay]: isDisabled,
                            })}
                            disabled={isDisabled}
                            aria-pressed={isSelected}
                            aria-label={date ? format(date, 'MMMM d, yyyy') : day.dateValue}
                            onClick={day.onClick}
                        >
                            {day.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div
            className={styles.popover}
            role="dialog"
            aria-label={i18n.t('Select date range')}
        >
            <div className={styles.months}>
                {renderMonth(firstMonth, 'first')}
                {renderMonth(secondMonth, 'second')}
            </div>
            <div className={styles.footer}>
                <Button
                    small
                    secondary
                    disabled={!hasValue}
                    onClick={handleClear}
                >
                    {i18n.t('Clear')}
                </Button>
                <Button
                    small
                    primary
                    onClick={onClose}
                >
                    {i18n.t('Done')}
                </Button>
            </div>
        </div>
    );
};

export const DateRangePicker = ({
    className,
    placeholder = i18n.t('Date'),
    value,
    onChange,
}: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const hasValue = hasDateRangeValue(value);
    const displayValue = getDisplayValue(value, placeholder);

    const handleClear = () => {
        onChange({});
        setIsOpen(false);
    };

    return (
        <div
            className={cx(styles.container, {
                [styles.hasValue]: hasValue,
            }, className)}
        >
            <div ref={anchorRef} className={styles.anchor}>
                <button
                    type="button"
                    className={cx(styles.trigger, {
                        [styles.placeholder]: !hasValue,
                        [styles.withClear]: hasValue,
                    })}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen(open => !open)}
                >
                    <span className={styles.triggerIcon}>
                        <IconCalendar16 />
                    </span>
                    <span className={styles.triggerText}>
                        {displayValue}
                    </span>
                </button>
                {hasValue && (
                    <button
                        type="button"
                        className={styles.clearButton}
                        aria-label={i18n.t('Clear date range')}
                        onClick={handleClear}
                    >
                        <IconCross16 />
                    </button>
                )}
            </div>
            {isOpen && (
                <Layer onBackdropClick={() => setIsOpen(false)}>
                    <Popper reference={anchorRef} placement="bottom-start">
                        <DateRangePickerPopover
                            hasValue={hasValue}
                            value={value}
                            onChange={onChange}
                            onClose={() => setIsOpen(false)}
                        />
                    </Popper>
                </Layer>
            )}
        </div>
    );
};
