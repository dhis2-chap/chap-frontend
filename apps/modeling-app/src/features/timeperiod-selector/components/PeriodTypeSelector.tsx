import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import React from 'react'

interface PeriodTypeSelectorProps {
  value: string
  onChange: (value: "week" | "month") => void
}

export const PeriodTypeSelector = ({value, onChange} : PeriodTypeSelectorProps) => {
  return (
    <div>
      <SingleSelectField onChange={({selected}) => onChange(selected as "week" | "month")} selected={value} label="Period type">
        {/*<SingleSelectOption value="date" label="Daily" />}*/}
        <SingleSelectOption value="week" label="Weekly" />
        <SingleSelectOption value="month" label="Monthly" />
      </SingleSelectField>
    </div>
  )
}
