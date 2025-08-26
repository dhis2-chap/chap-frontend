import {
    SingleSelectField,
    SingleSelectFieldProps,
    SingleSelectOption
} from '@dhis2/ui'
import React from 'react'
import { getPeriodNameFromId } from '../../../utils/Time'

interface SplitPeriodSelectorProps extends SingleSelectFieldProps {
    splitPeriods: string[]
    setSelectedSplitPeriod: (splitPeriod: string) => void
    selectedSplitPeriod: string
}

const SplitPeriodSelector = ({
    splitPeriods,
    setSelectedSplitPeriod,
    selectedSplitPeriod,
    ...singleSelectFieldProps
}: SplitPeriodSelectorProps) => {
    const selectedInAvailable = splitPeriods.includes(selectedSplitPeriod)

    return (
        <div>
            <div>
                <SingleSelectField
                    {...singleSelectFieldProps}
                    selected={selectedInAvailable ? selectedSplitPeriod : undefined}
                    onChange={(e) => setSelectedSplitPeriod(e.selected)}
                >
                    {splitPeriods.map((splitPeriod, i) => (
                        <SingleSelectOption
                            key={i}
                            label={getPeriodNameFromId(splitPeriod)}
                            value={splitPeriod}
                        />
                    ))}
                </SingleSelectField>
            </div>
        </div>
    )
}

export default SplitPeriodSelector
