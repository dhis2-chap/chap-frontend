import React, { useEffect, useState } from 'react'
import { Label } from '@dhis2/ui'
import i18n from '@dhis2/d2-i18n'
import { Control, useWatch, UseFormSetValue } from 'react-hook-form'
import { ModelTemplateRead } from '@dhis2-chap/ui'
import { ArrayField, EnumField, BooleanField, NullableField, DefaultField } from './fields'
import { TypeConverter, getFieldType } from './utils'
import styles from './UserOptionsFields.module.css'

// Constants
const INTERNAL_FIELD_TYPES = {
    ARRAY: 'array',
    ENUM: 'enum',
    BOOLEAN: 'boolean',
    NULLABLE: 'nullable',
    DEFAULT: 'default'
} as const

export interface UserOptionConfig {
    type: string
    title?: string
    default?: any
    enum?: string[]
    items?: {
        type: string
    }
    anyOf?: Array<{
        type: string
    }>
}

interface UserOptionsFieldsProps {
    control: Control<any>
    setValue: UseFormSetValue<any>
    currentTemplate: ModelTemplateRead | undefined
    disabled?: boolean
}

// Field Renderers interface for props passed to each field component
interface FieldRendererProps {
    optionKey: string
    optionConfig: UserOptionConfig
    control: Control<any>
    setValue: UseFormSetValue<any>
    disabled: boolean
    watchedUserOptions: any
    arrayInputs: Record<string, string>
    setArrayInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

// Field Handler Mapping
const fieldHandlers = {
    [INTERNAL_FIELD_TYPES.ARRAY]: (props: FieldRendererProps) => (
        <ArrayField
            optionKey={props.optionKey}
            optionConfig={props.optionConfig}
            setValue={props.setValue}
            disabled={props.disabled}
            watchedUserOptions={props.watchedUserOptions}
            arrayInputs={props.arrayInputs}
            setArrayInputs={props.setArrayInputs}
        />
    ),
    [INTERNAL_FIELD_TYPES.ENUM]: (props: FieldRendererProps) => (
        <EnumField
            optionKey={props.optionKey}
            optionConfig={props.optionConfig}
            control={props.control}
            disabled={props.disabled}
        />
    ),
    [INTERNAL_FIELD_TYPES.BOOLEAN]: (props: FieldRendererProps) => (
        <BooleanField
            optionKey={props.optionKey}
            optionConfig={props.optionConfig}
            control={props.control}
            disabled={props.disabled}
        />
    ),
    [INTERNAL_FIELD_TYPES.NULLABLE]: (props: FieldRendererProps) => (
        <NullableField
            optionKey={props.optionKey}
            optionConfig={props.optionConfig}
            control={props.control}
            disabled={props.disabled}
        />
    ),
    [INTERNAL_FIELD_TYPES.DEFAULT]: (props: FieldRendererProps) => (
        <DefaultField
            optionKey={props.optionKey}
            optionConfig={props.optionConfig}
            control={props.control}
            disabled={props.disabled}
        />
    )
}

export const UserOptionsFields: React.FC<UserOptionsFieldsProps> = ({
    control,
    setValue,
    currentTemplate,
    disabled = false
}) => {
    const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({})

    const userOptions = currentTemplate?.userOptions || {}

    const watchedUserOptions = useWatch({
        control,
        name: 'userOptions'
    })

    useEffect(() => {
        if (currentTemplate?.userOptions) {
            const defaults: Record<string, any> = {}
            Object.entries(currentTemplate.userOptions)
                .filter(([key]) => key !== 'additional_covariates')
                .forEach(([key, option]) => {
                    defaults[key] = TypeConverter.getDefault(option as UserOptionConfig)
                })
            setValue('userOptions', defaults)
        } else {
            setValue('userOptions', {})
        }
    }, [currentTemplate, setValue])

    const renderUserOption = (optionKey: string, optionConfig: UserOptionConfig) => {
        const fieldType = getFieldType(optionConfig)
        const handler = fieldHandlers[fieldType]

        return handler({
            optionKey,
            optionConfig,
            control,
            setValue,
            disabled,
            watchedUserOptions,
            arrayInputs,
            setArrayInputs
        })
    }

    if (Object.keys(userOptions).length === 0) {
        return null
    }

    return (
        <div className={styles.formField}>
            <Label>{i18n.t('Model Parameters')}</Label>
            <div className={styles.userOptionsContainer}>
                {Object.entries(userOptions)
                    .filter(([key]) => key !== 'additional_covariates')
                    .map(([key, option]) =>
                        renderUserOption(key, option as UserOptionConfig)
                    )}
            </div>
        </div>
    )
}

export default UserOptionsFields

// Export helper functions for potential reuse
export { TypeConverter, getFieldType } 