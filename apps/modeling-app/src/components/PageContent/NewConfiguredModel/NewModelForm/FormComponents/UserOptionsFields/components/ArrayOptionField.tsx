import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Button, InputField } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Tag } from '@dhis2-chap/ui';
import { FieldProps } from '../types';
import styles from '../UserOptionsFields.module.css';

export const ArrayOptionField = ({ name, config }: FieldProps) => {
    const [inputValue, setInputValue] = useState('');
    const { setError, clearErrors } = useFormContext();
    const fieldName = `userOptions.${name}`;

    return (
        <Controller
            name={fieldName}
            render={({ field, fieldState }) => {
                const values = field.value as string[] ?? [];

                const addValue = () => {
                    const trimmed = inputValue.trim();
                    if (!trimmed || !trimmed.length) {
                        return;
                    }

                    if (trimmed.includes(' ')) {
                        setError(fieldName, {
                            type: 'manual',
                            message: i18n.t('Spaces are not allowed. Use dashes (-) or underscores (_) instead.'),
                        });
                        return;
                    }

                    field.onChange([...values, trimmed]);
                    setInputValue('');
                    clearErrors(fieldName);
                };

                const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        addValue();
                    }
                };

                const handleInputChange = (value: string) => {
                    setInputValue(value || '');
                    if (fieldState.error) {
                        clearErrors(fieldName);
                    }
                };

                return (
                    <div className={styles.arrayField} data-test={`user-option-${name}`}>
                        <div className={styles.inputContainer}>
                            <InputField
                                label={config.title ?? name}
                                value={inputValue}
                                onChange={({ value }) => handleInputChange(value || '')}
                                onKeyDown={(_, event) => handleKeyDown(event)}
                                placeholder={i18n.t('Type a value')}
                                helpText={config.description}
                                error={!!fieldState.error}
                                validationText={fieldState.error?.message}
                            />
                            <Button
                                onClick={addValue}
                                disabled={!inputValue.trim()}
                                className={styles.addButton}
                                dataTest={`add-${name}-button`}
                            >
                                {i18n.t('Add')}
                            </Button>
                        </div>
                        {values.length > 0 && (
                            <div className={styles.tagList}>
                                {values.map((value, index) => (
                                    <Tag
                                        key={`${name}-${value}-${index}`}
                                        onRemove={() => {
                                            const next = values.filter((_, idx) => idx !== index);
                                            field.onChange(next);
                                        }}
                                    >
                                        {String(value)}
                                    </Tag>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }}
        />
    );
};
