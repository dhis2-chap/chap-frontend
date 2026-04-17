import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import css from './SplitPeriodSlider.module.css';
import { getPeriodNameFromId } from '../utils/Time';
import i18n from '@dhis2/d2-i18n';
import { Label } from '@dhis2/ui';
import { Range } from 'react-range';
import { clamp } from '../utils/clamp';

type SplitPeriodSliderProps = {
    splitPeriods: string[];
    selectedSplitPeriod: string;
    onChange: (selectedPoint: string) => void;
    periods?: string[];
    splitPeriodLength?: number;
    debounceMs?: number;
};

export const SplitPeriodSlider: React.FC<SplitPeriodSliderProps> = ({
    splitPeriods,
    selectedSplitPeriod,
    onChange,
    periods = [],
    splitPeriodLength = 3,
    debounceMs = 200,
}) => {
    const lastSplitPeriod = splitPeriods[splitPeriods.length - 1];
    const maxSplitPeriodIndex = Math.max(splitPeriods.length - 1, 0);
    const debounceTimeoutRef = useRef<number | undefined>(undefined);
    const pendingSplitPeriodRef = useRef<string | null>(null);

    const selectedSplitPeriodIndex = useMemo(() => {
        const resolvedIndex = splitPeriods.indexOf(selectedSplitPeriod);
        return clamp(
            resolvedIndex < 0 ? 0 : resolvedIndex,
            0,
            maxSplitPeriodIndex,
        );
    }, [maxSplitPeriodIndex, selectedSplitPeriod, splitPeriods]);
    const previousSelectedSplitPeriodIndexRef = useRef(
        selectedSplitPeriodIndex,
    );

    const [activeSplitPeriodIndex, setActiveSplitPeriodIndex] = useState(
        selectedSplitPeriodIndex,
    );
    const [isScrubbing, setIsScrubbing] = useState(false);

    useEffect(() => {
        if (
            selectedSplitPeriodIndex
            === previousSelectedSplitPeriodIndexRef.current
        ) {
            return;
        }

        previousSelectedSplitPeriodIndexRef.current = selectedSplitPeriodIndex;

        if (!isScrubbing) {
            setActiveSplitPeriodIndex(selectedSplitPeriodIndex);
        }
    }, [isScrubbing, selectedSplitPeriodIndex]);

    const clearPendingCommit = useCallback(() => {
        if (debounceTimeoutRef.current !== undefined) {
            window.clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = undefined;
        }
    }, []);

    const emitSplitPeriod = useCallback((index: number) => {
        const splitPeriodIndex = clamp(index, 0, maxSplitPeriodIndex);
        const value = splitPeriods[splitPeriodIndex] ?? lastSplitPeriod;

        if (pendingSplitPeriodRef.current === selectedSplitPeriod) {
            pendingSplitPeriodRef.current = null;
        }

        if (
            value &&
            value !== selectedSplitPeriod &&
            value !== pendingSplitPeriodRef.current
        ) {
            pendingSplitPeriodRef.current = value;
            onChange(value);
        }
    }, [
        lastSplitPeriod,
        maxSplitPeriodIndex,
        onChange,
        selectedSplitPeriod,
        splitPeriods,
    ]);

    const scheduleSplitPeriodCommit = useCallback((index: number) => {
        if (debounceMs <= 0) {
            emitSplitPeriod(index);
            return;
        }

        clearPendingCommit();
        debounceTimeoutRef.current = window.setTimeout(() => {
            debounceTimeoutRef.current = undefined;
            emitSplitPeriod(index);
        }, debounceMs);
    }, [clearPendingCommit, debounceMs, emitSplitPeriod]);

    const handleChange = useCallback((values: number[]) => {
        const splitPeriodIndex = clamp(values[0], 0, maxSplitPeriodIndex);
        setIsScrubbing(true);
        setActiveSplitPeriodIndex(splitPeriodIndex);
        scheduleSplitPeriodCommit(splitPeriodIndex);
    }, [maxSplitPeriodIndex, scheduleSplitPeriodCommit]);

    const handleFinalChange = useCallback((values: number[]) => {
        const splitPeriodIndex = clamp(values[0], 0, maxSplitPeriodIndex);
        setIsScrubbing(false);
        setActiveSplitPeriodIndex(splitPeriodIndex);
        clearPendingCommit();
        emitSplitPeriod(splitPeriodIndex);
    }, [clearPendingCommit, emitSplitPeriod, maxSplitPeriodIndex]);

    useEffect(() => {
        return clearPendingCommit;
    }, [clearPendingCommit]);

    const lastSplitPeriodInPeriodsIndex = periods.findIndex(
        period => period === lastSplitPeriod,
    );
    // fallback to end of period if splitPeriod not found
    const extraPeriodsStartIndex =
        lastSplitPeriodInPeriodsIndex < 0
            ? periods.length - splitPeriodLength
            : lastSplitPeriodInPeriodsIndex;

    // add extra periods so we can show the full period when last split period is selected
    // note that this portion cannot be selected, and will select the last valid split period
    const withExtraPeriods = useMemo(() => {
        return splitPeriods
            .concat(
                periods.slice(
                    extraPeriodsStartIndex + 1,
                    extraPeriodsStartIndex + splitPeriodLength,
                ),
            )
            // hack last period so that last real period has an end
            // we dont care about the value, since it will not be selectable
            .concat('LAST_PERIOD');
    }, [
        extraPeriodsStartIndex,
        periods,
        splitPeriodLength,
        splitPeriods,
    ]);

    const splitPeriodStartIndex = activeSplitPeriodIndex;
    const splitPeriodEndIndex = splitPeriodStartIndex + splitPeriodLength - 1;

    const splitPeriodLabels = useMemo(() => {
        const middlePeriodIndex = Math.floor(withExtraPeriods.length / 2);

        return [
            withExtraPeriods[0],
            withExtraPeriods[middlePeriodIndex],
            withExtraPeriods[withExtraPeriods.length - 2],
        ]
            .filter((sp, i, arr) => arr.indexOf(sp) === i)
            .map(point => getPeriodNameFromId(point));
    }, [withExtraPeriods]);

    const trackBackground = useMemo(() => {
        const total = withExtraPeriods.length - 1;
        const splitPeriodStart = splitPeriodStartIndex * (100 / total);
        const splitPeriodEnd =
            (splitPeriodStartIndex + splitPeriodLength) * (100 / total);
        return `linear-gradient(
            to right,
            var(--colors-grey300) ${splitPeriodStart}%,
            var(--colors-blue300) ${splitPeriodStart}%,
            var(--colors-blue300) ${splitPeriodEnd}%,
            var(--colors-grey300) ${splitPeriodEnd}%
            
        )`;
    }, [splitPeriodLength, splitPeriodStartIndex, withExtraPeriods.length]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target instanceof HTMLInputElement
                || target instanceof HTMLTextAreaElement
                || target instanceof HTMLSelectElement
                || !!target?.isContentEditable;
            const isSliderTarget = target instanceof Element &&
                target.closest('[role="slider"]') !== null;

            if (
                event.defaultPrevented
                || event.repeat
                || event.ctrlKey
                || event.metaKey
                || event.altKey
                || event.shiftKey
                || isTypingTarget
                || isSliderTarget
            ) {
                return;
            }
            const currentIndex = activeSplitPeriodIndex;
            const downKeys = new Set(['j', 'J']);
            const upKeys = new Set(['k', 'K']);
            if (downKeys.has(event.key)) {
                const nextIndex = clamp(
                    currentIndex - 1,
                    0,
                    maxSplitPeriodIndex,
                );
                if (nextIndex === currentIndex) {
                    return;
                }
                setIsScrubbing(false);
                setActiveSplitPeriodIndex(nextIndex);
                clearPendingCommit();
                emitSplitPeriod(nextIndex);
            } else if (upKeys.has(event.key)) {
                const nextIndex = clamp(
                    currentIndex + 1,
                    0,
                    maxSplitPeriodIndex,
                );
                if (nextIndex === currentIndex) {
                    return;
                }
                setIsScrubbing(false);
                setActiveSplitPeriodIndex(nextIndex);
                clearPendingCommit();
                emitSplitPeriod(nextIndex);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        activeSplitPeriodIndex,
        clearPendingCommit,
        emitSplitPeriod,
        maxSplitPeriodIndex,
    ]);

    return (
        <div className={css.wrapper}>
            <div className={css.selectedLabelContainer}>
                <Label htmlFor="splitPeriodSlider">
                    {i18n.t('Split period')}
                </Label>
                <span className={css.selectedLabel}>
                    {`${getPeriodNameFromId(
                        splitPeriods[splitPeriodStartIndex] ?? selectedSplitPeriod,
                    )} - ${getPeriodNameFromId(
                        withExtraPeriods[splitPeriodEndIndex] ?? lastSplitPeriod,
                    )}`}
                </span>
            </div>

            <div className={css.sliderContainer}>
                <Range
                    labelledBy="splitPeriodSlider"
                    min={0}
                    max={withExtraPeriods.length - 1}
                    values={[splitPeriodStartIndex]}
                    renderThumb={({ props: thumbProps }) => (
                        <div
                            {...thumbProps}
                            key={thumbProps.key}
                            className={css.thumb}
                        >
                            <svg
                                width="100%"
                                height="auto"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M7 10l5 5 5-5H7z" />
                            </svg>
                        </div>
                    )}
                    renderTrack={({ props: trackProps, children }) => (
                        <div
                            {...trackProps}
                            style={{
                                ...trackProps.style,
                                background: trackBackground,
                            }}
                            className={css.track}
                        >
                            {children}
                        </div>
                    )}
                    onChange={handleChange}
                    onFinalChange={handleFinalChange}
                    renderMark={({ props: markProps, index }) =>
                        index >= splitPeriods.length ? null : (
                            <div
                                {...markProps}
                                key={markProps.key}
                                className={css.mark}
                            />
                        )}
                />
            </div>
            <div className={css.labelsContainer}>
                {splitPeriodLabels.map(point => (
                    <span key={point} className={css.label}>
                        {point}
                    </span>
                ))}
            </div>
        </div>
    );
};
