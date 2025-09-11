import React from 'react';
import { Checkbox } from '@dhis2/ui';
import { Control, Controller } from 'react-hook-form';
import { UserOptionConfig } from '../UserOptionsFields';
import styles from '../UserOptionsFields.module.css';

interface BooleanFieldProps {
    optionKey: string;
    optionConfig: UserOptionConfig;
    control: Control<any>;
    disabled: boolean;
}

export const BooleanField: React.FC<BooleanFieldProps> = ({
    optionKey,
    optionConfig,
    control,
    disabled,
}) => {
    const label = optionConfig.title || optionKey;

    return (
        <div key={optionKey} className={styles.formField}>
            <Controller
                name={`userOptions.${optionKey}` as any}
                control={control}
                render={({ field }) => (
                    <Checkbox
                        label={label}
                        checked={field.value || false}
                        disabled={disabled}
                        onChange={({ checked }) => field.onChange(checked)}
                    />
                )}
            />
        </div>
    );
};
