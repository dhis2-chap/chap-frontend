import React, { useEffect } from 'react'
import css from './SplitPeriodSlider.module.css'
import { getPeriodNameFromId } from '../utils/Time'
import i18n from '@dhis2/d2-i18n'
import { Label } from '@dhis2/ui'
import { Range } from 'react-range'
import { clamp } from '../utils/clamp'

type SplitPeriodSlider = {
    splitPeriods: string[]
    selectedSplitPeriod: string
    onChange: (selectedPoint: string) => void
    periods?: string[]
    splitPeriodLength?: number
}

export const SplitPeriodSlider: React.FC<SplitPeriodSlider> = ({
    splitPeriods,
    selectedSplitPeriod,
    onChange,
    periods = [],
    splitPeriodLength = 3,
}) => {
    const lastSplitPeriod = splitPeriods[splitPeriods.length - 1]

    const handleChange = (values: number[]) => {
        const splitPeriodIndex = clamp(values[0], 0, splitPeriods.length - 1)
        const value = splitPeriods[splitPeriodIndex] ?? lastSplitPeriod
        return onChange(value)
    }

    const lastSplitPeriodInPeriodsIndex = periods.findIndex(
        (period) => period === lastSplitPeriod
    )
    // fallback to end of period if splitPeriod not found
    const extraPeriodsStartIndex =
        lastSplitPeriodInPeriodsIndex < 0
            ? periods.length - splitPeriodLength
            : lastSplitPeriodInPeriodsIndex

    // add extra periods so we can show the full period when last split period is selected
    // note that this portion cannot be selected, and will select the last valid split period
    const withExtraPeriods = splitPeriods
        .concat(
            periods.slice(
                extraPeriodsStartIndex + 1,
                extraPeriodsStartIndex + splitPeriodLength
            )
        )
        // hack last period so that last real period has an end
        // we dont care about the value, since it will not be selectable
        .concat('LAST_PERIOD')

    const middlePeriodIndex = Math.floor(withExtraPeriods.length / 2)
    const splitPeriodLabels = [
        withExtraPeriods[0],
        withExtraPeriods[middlePeriodIndex],
        withExtraPeriods[withExtraPeriods.length - 2],
    ]
        .filter((sp, i, arr) => arr.indexOf(sp) === i)
        .map((point) => getPeriodNameFromId(point))

    const splitPeriodStartIndex = withExtraPeriods.indexOf(selectedSplitPeriod)
    const splitPeriodEndIndex = splitPeriodStartIndex + splitPeriodLength - 1

    const getTrackBackground = () => {
        const total = withExtraPeriods.length - 1
        const splitPeriodStart = splitPeriodStartIndex * (100 / total)
        const splitPeriodEnd =
            (splitPeriodStartIndex + splitPeriodLength) * (100 / total)
        return `linear-gradient(
            to right,
            var(--colors-grey300) ${splitPeriodStart}%,
            var(--colors-blue300) ${splitPeriodStart}%,
            var(--colors-blue300) ${splitPeriodEnd}%,
            var(--colors-grey300) ${splitPeriodEnd}%
            
        )`
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if(event.defaultPrevented) {
                return
            }
            const currentIndex = splitPeriodStartIndex
            const downKeys = new Set(['j', 'J'])
            const upKeys = new Set(['k', 'K'])
            if (downKeys.has(event.key)) {
                handleChange([currentIndex - 1])
            } else if (upKeys.has(event.key)) {
                handleChange([currentIndex + 1])
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [splitPeriodStartIndex, splitPeriods, onChange])

    return (
        <div className={css.wrapper}>
            <div className={css.selectedLabelContainer}>
                <Label htmlFor="splitPeriodSlider">
                    {i18n.t('Split period')}
                </Label>
                <span className={css.selectedLabel}>
                    {`${getPeriodNameFromId(
                        selectedSplitPeriod
                    )} - ${getPeriodNameFromId(
                        withExtraPeriods[splitPeriodEndIndex]
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
                                background: getTrackBackground(),
                            }}
                            className={css.track}
                        >
                            {children}
                        </div>
                    )}
                    onChange={handleChange}
                    renderMark={({ props: markProps, index }) =>
                        index >= splitPeriods.length ? null : (
                            <div
                                {...markProps}
                                key={markProps.key}
                                className={css.mark}
                            />
                        )
                    }
                />
            </div>
            <div className={css.labelsContainer}>
                {splitPeriodLabels.map((point) => (
                    <span key={point} className={css.label}>
                        {point}
                    </span>
                ))}
            </div>
        </div>
    )
}
