import React from 'react';
import { Button, InputField, Label, Chip } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { UseFormSetValue } from 'react-hook-form';
import { UserOptionConfig } from '../UserOptionsFields';
import styles from '../UserOptionsFields.module.css';

interface ArrayFieldProps {
    optionKey: string;
    optionConfig: UserOptionConfig;
    setValue: UseFormSetValue<any>;
    disabled: boolean;
    watchedUserOptions: any;
    arrayInputs: Record<string, string>;
    setArrayInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const ArrayField: React.FC<ArrayFieldProps> = ({
    optionKey,
    optionConfig,
    setValue,
    disabled,
    watchedUserOptions,
    arrayInputs,
    setArrayInputs,
}) => {
    const currentValue = watchedUserOptions?.[optionKey] as string[] || [];
    const newItem = arrayInputs[optionKey] || '';

    const handleAddItem = () => {
        const trimmedItem = newItem.trim();
        if (trimmedItem && !currentValue.includes(trimmedItem)) {
            const updatedArray = [...currentValue, trimmedItem];
            setValue(`userOptions.${optionKey}`, updatedArray);
            setArrayInputs(prev => ({ ...prev, [optionKey]: '' }));
        }
    };

    const handleRemoveItem = (index: number) => {
        const updatedArray = currentValue.filter((_, i) => i !== index);
        setValue(`userOptions.${optionKey}`, updatedArray);
    };

    const handleInputChange = (value: string) => {
        setArrayInputs(prev => ({ ...prev, [optionKey]: value }));
    };

    return (
        <div key={optionKey} className={styles.formField}>
            <Label>{optionConfig.title || optionKey}</Label>
            <div className={styles.arrayField}>
                <div className={styles.arrayInput}>
                    <InputField
                        value={newItem}
                        placeholder={i18n.t('Enter item')}
                        onChange={({ value }) => handleInputChange(value || '')}
                        disabled={disabled}
                    />
                    <Button
                        onClick={handleAddItem}
                        disabled={!newItem.trim() || disabled}
                        small
                    >
                        {i18n.t('Add')}
                    </Button>
                </div>
                <div className={styles.arrayItems}>
                    {currentValue.map((item, index) => (
                        <Chip
                            key={index}
                            onRemove={() => handleRemoveItem(index)}
                        >
                            {item}
                        </Chip>
                    ))}
                </div>
            </div>
        </div>
    );
};
