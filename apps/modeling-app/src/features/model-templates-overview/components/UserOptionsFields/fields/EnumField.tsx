import React from 'react'
import { Label, SingleSelect, SingleSelectOption } from '@dhis2/ui'
import { Control, Controller } from 'react-hook-form'
import { UserOptionConfig } from '../UserOptionsFields'
import styles from '../UserOptionsFields.module.css'

interface EnumFieldProps {
    optionKey: string
    optionConfig: UserOptionConfig
    control: Control<any>
    disabled: boolean
}

export const EnumField: React.FC<EnumFieldProps> = ({
    optionKey,
    optionConfig,
    control,
    disabled
}) => {
    const { title, enum: enumValues } = optionConfig
    const label = title || optionKey

    return (
        <div key={optionKey} className={styles.formField}>
            <Label>{label}</Label>
            <Controller
                name={`userOptions.${optionKey}` as any}
                control={control}
                render={({ field }) => (
                    <SingleSelect
                        selected={field.value?.toString() || ''}
                        disabled={disabled}
                        onChange={({ selected }) => field.onChange(selected)}
                    >
                        {enumValues!.map((value) => (
                            <SingleSelectOption
                                key={value}
                                label={value}
                                value={value}
                            />
                        ))}
                    </SingleSelect>
                )}
            />
        </div>
    )
} 