import React, { useState } from 'react'
import { InputField } from '@dhis2/ui'
import { Control, Controller } from 'react-hook-form'
import { z } from 'zod'
import i18n from '@dhis2/d2-i18n'
import { UserOptionConfig } from '../UserOptionsFields'
import styles from '../UserOptionsFields.module.css'

const FIELD_TYPES = {
    INTEGER: 'integer',
    NUMBER: 'number'
} as const

const normalizeDecimalInput = (value: string): string => {
    return value.replace(',', '.')
}

const createNumberSchema = (type: string) => {
    const baseSchema = z.string()
        .transform((val) => normalizeDecimalInput(val.trim()))
        .refine((val) => val === '' || !isNaN(Number(val)), {
            message: i18n.t('Please enter a valid number')
        })
        .transform((val) => val === '' ? 0 : Number(val))

    if (type === FIELD_TYPES.INTEGER) {
        return baseSchema.refine((val) => Number.isInteger(val), {
            message: i18n.t('Please enter a whole number')
        })
    }

    return baseSchema
}

interface DefaultFieldProps {
    optionKey: string
    optionConfig: UserOptionConfig
    control: Control<any>
    disabled: boolean
}

export const DefaultField: React.FC<DefaultFieldProps> = ({
    optionKey,
    optionConfig,
    control,
    disabled
}) => {
    const { type, title } = optionConfig
    const label = title || optionKey
    const [validationError, setValidationError] = useState<string>('')

    const isNumberField = type === FIELD_TYPES.INTEGER || type === FIELD_TYPES.NUMBER
    const validationSchema = isNumberField ? createNumberSchema(type) : null

    const validateValue = (value: string) => {
        if (!isNumberField || !validationSchema) return true

        try {
            validationSchema.parse(value)
            setValidationError('')
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                setValidationError(error.errors[0]?.message || i18n.t('Invalid input'))
            }
            return false
        }
    }

    const convertValue = (value: string) => {
        if (!isNumberField || !validationSchema) return value

        try {
            return validationSchema.parse(value)
        } catch {
            return value // Return original value if validation fails
        }
    }

    return (
        <div key={optionKey} className={styles.formField}>
            <Controller
                name={`userOptions.${optionKey}` as any}
                control={control}
                render={({ field }) => (
                    <InputField
                        label={label}
                        type="text"
                        value={field.value?.toString() || ''}
                        disabled={disabled}
                        error={!!validationError}
                        validationText={validationError}
                        placeholder={
                            isNumberField
                                ? type === FIELD_TYPES.INTEGER
                                    ? i18n.t('Enter a whole number')
                                    : i18n.t('Enter a number (use , or . for decimal)')
                                : undefined
                        }
                        onChange={({ value }) => {
                            field.onChange(value || '')
                            if (validationError) {
                                setValidationError('')
                            }
                        }}
                        onBlur={() => {
                            const currentValue = field.value?.toString() || ''
                            if (validateValue(currentValue)) {
                                const convertedValue = convertValue(currentValue)
                                field.onChange(convertedValue)
                            }
                        }}
                    />
                )}
            />
        </div>
    )
} 