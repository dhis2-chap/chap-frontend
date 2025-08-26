import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'

interface SelectImportModeProps {
    setImportMode: (v: undefined | 'predict' | 'evaluate') => void
    importMode: undefined | 'predict' | 'evaluate'
}
export const SelectImportMode = ({
    setImportMode,
    importMode,
}: SelectImportModeProps) => {
    return (
        <div>
            <SingleSelectField
                placeholder="Select"
                selected={importMode}
                label="Select what you want to import"
                onChange={(e) => setImportMode(e.selected as any)}
            >
                <SingleSelectOption label={'Prediction'} value={'predict'} />
                <SingleSelectOption label={'Evaluation'} value={'evaluate'} />
            </SingleSelectField>
        </div>
    )
}
