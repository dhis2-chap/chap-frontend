import React, { useState } from 'react';
import { InputField } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Control, Controller } from 'react-hook-form';
import { z } from 'zod';
import { UserOptionConfig } from '../UserOptionsFields';
import styles from '../UserOptionsFields.module.css';

const FIELD_TYPES = {
    INTEGER: 'integer',
    NUMBER: 'number',
    NULL: 'null',
} as const;

const normalizeDecimalInput = (value: string): string => {
    return value.replace(',', '.');
};

const createNullableNumberSchema = (type: string) => {
    const baseSchema = z.string()
        .transform(val => val.trim())
        .refine((val) => {
            if (val === '') return true;
            const normalized = normalizeDecimalInput(val);
            return !isNaN(Number(normalized));
        }, {
            message: i18n.t('Please enter a valid number or leave empty'),
        })
        .transform((val) => {
            if (val === '') return null;
            const normalized = normalizeDecimalInput(val);
            return Number(normalized);
        });

    if (type === FIELD_TYPES.INTEGER) {
        return baseSchema.refine(val => val === null || Number.isInteger(val), {
            message: i18n.t('Please enter a whole number or leave empty'),
        });
    }

    return baseSchema;
};

interface NullableFieldProps {
    optionKey: string;
    optionConfig: UserOptionConfig;
    control: Control<any>;
    disabled: boolean;
}

export const NullableField: React.FC<NullableFieldProps> = ({
    optionKey,
    optionConfig,
    control,
    disabled,
}) => {
    const label = optionConfig.title || optionKey;
    const nonNullType = optionConfig.anyOf!.find(typeOption => typeOption.type !== FIELD_TYPES.NULL);
    const [validationError, setValidationError] = useState<string>('');

    const isNumberField = nonNullType?.type === FIELD_TYPES.INTEGER || nonNullType?.type === FIELD_TYPES.NUMBER;
    const validationSchema = isNumberField ? createNullableNumberSchema(nonNullType!.type) : null;

    const validateValue = (value: string) => {
        if (!isNumberField || !validationSchema) return true;

        try {
            validationSchema.parse(value);
            setValidationError('');
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                setValidationError(error.errors[0]?.message || i18n.t('Invalid input'));
            }
            return false;
        }
    };

    const convertValue = (value: string) => {
        if (!isNumberField || !validationSchema) {
            return value === '' ? null : value;
        }

        try {
            return validationSchema.parse(value);
        } catch {
            return value;
        }
    };

    return (
        <div key={optionKey} className={styles.formField}>
            <Controller
                name={`userOptions.${optionKey}` as any}
                control={control}
                render={({ field }) => (
                    <InputField
                        label={label}
                        type="text"
                        value={field.value === null ? '' : field.value?.toString() || ''}
                        disabled={disabled}
                        error={!!validationError}
                        validationText={validationError}
                        placeholder={
                            isNumberField
                                ? nonNullType?.type === FIELD_TYPES.INTEGER
                                    ? i18n.t('Enter a whole number or leave empty for null')
                                    : i18n.t('Enter a number (use , or . for decimal) or leave empty for null')
                                : i18n.t('Leave empty for null')
                        }
                        onChange={({ value }) => {
                            field.onChange(value || '');
                            if (validationError) {
                                setValidationError('');
                            }
                        }}
                        onBlur={() => {
                            const currentValue = field.value === null ? '' : field.value?.toString() || '';
                            if (validateValue(currentValue)) {
                                const convertedValue = convertValue(currentValue);
                                field.onChange(convertedValue);
                            }
                        }}
                    />
                )}
            />
        </div>
    );
};
