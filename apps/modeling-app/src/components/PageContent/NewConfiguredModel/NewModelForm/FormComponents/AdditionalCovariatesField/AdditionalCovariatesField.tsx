import React, { useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Button, InputField } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './AdditionalCovariatesField.module.css';

type AdditionalCovariatesFieldProps = {
    requiredCovariates: string[];
};

export const AdditionalCovariatesField = ({ requiredCovariates }: AdditionalCovariatesFieldProps) => {
    const { setError, clearErrors } = useFormContext();
    const [inputValue, setInputValue] = useState('');
    const fieldName = 'additionalContinuousCovariates';

    const normalizedRequired = useMemo(
        () => (Array.isArray(requiredCovariates) ? requiredCovariates.filter(Boolean) : []),
        [requiredCovariates],
    );

    return (
        <div className={styles.container} data-test="additional-covariates-field">
            <Controller
                name={fieldName}
                defaultValue={[]}
                render={({ field, fieldState }) => {
                    const values = Array.isArray(field.value) ? field.value : [];

                    const addValue = () => {
                        const trimmed = inputValue.trim();
                        if (!trimmed) {
                            return;
                        }

                        if (trimmed.includes(' ')) {
                            setError(fieldName, {
                                type: 'manual',
                                message: i18n.t(
                                    'Spaces are not allowed. Use dashes (-) or underscores (_) instead.',
                                ),
                            });
                            return;
                        }

                        const existsInRequired = normalizedRequired.includes(trimmed);
                        const existsInValues = values.includes(trimmed);

                        if (existsInRequired || existsInValues) {
                            setError(fieldName, {
                                type: 'manual',
                                message: i18n.t('This covariate has already been added.'),
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

                    const removeValue = (indexToRemove: number) => {
                        const next = values.filter((_, index) => index !== indexToRemove);
                        field.onChange(next);
                    };

                    return (
                        <>
                            <div className={styles.inputRow}>
                                <InputField
                                    label={i18n.t('Additional continuous covariates')}
                                    value={inputValue}
                                    onChange={({ value }) => handleInputChange(value ?? '')}
                                    onKeyDown={(_, event) => handleKeyDown(event)}
                                    placeholder={i18n.t('Enter covariate name')}
                                    error={Boolean(fieldState.error)}
                                    validationText={fieldState.error?.message}
                                />
                                <Button
                                    onClick={addValue}
                                    disabled={!inputValue.trim()}
                                    className={styles.addButton}
                                    dataTest="add-additional-covariate-button"
                                >
                                    {i18n.t('Add')}
                                </Button>
                            </div>

                            {(normalizedRequired.length > 0 || values.length > 0) && (
                                <ul className={styles.list}>
                                    {normalizedRequired.map(covariate => (
                                        <li key={`required-${covariate}`} className={styles.listItem}>
                                            <span className={styles.listText}>{covariate}</span>
                                            <span className={styles.requiredBadge}>{i18n.t('Required')}</span>
                                        </li>
                                    ))}
                                    {values.map((value, index) => (
                                        <li key={`list-value-${value}-${index}`} className={styles.listItem}>
                                            <span className={styles.listText}>{value}</span>
                                            <Button
                                                small
                                                secondary
                                                onClick={() => removeValue(index)}
                                                className={styles.removeButton}
                                                dataTest={`remove-additional-covariate-${value}`}
                                            >
                                                {i18n.t('Remove')}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    );
                }}
            />
        </div>
    );
};
