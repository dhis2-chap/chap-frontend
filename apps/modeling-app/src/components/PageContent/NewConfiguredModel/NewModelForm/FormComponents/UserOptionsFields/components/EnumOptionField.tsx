import { Controller } from 'react-hook-form';
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { FieldProps } from '../types';

export const EnumOptionField = ({ name, config }: FieldProps) => {
    if (!Array.isArray(config.enum) || config.enum.length === 0) {
        return null;
    }

    return (
        <Controller
            name={`userOptions.${name}`}
            render={({ field, fieldState }) => (
                <SingleSelectField
                    label={config.title ?? name}
                    selected={field.value as string | undefined}
                    onChange={({ selected }: { selected: string }) => field.onChange(selected)}
                    helpText={config.description}
                    error={!!fieldState.error}
                    validationText={fieldState.error?.message}
                    dataTest={`user-option-${name}`}
                >
                    {config.enum?.map(option => (
                        <SingleSelectOption key={`${name}-${option}`} value={option as string} label={String(option)} />
                    ))}
                </SingleSelectField>
            )}
        />
    );
};
