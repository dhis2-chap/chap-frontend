import { Controller } from 'react-hook-form';
import { InputField } from '@dhis2/ui';
import { FieldProps } from '../types';

export const StringOptionField = ({ name, config }: FieldProps) => (
    <Controller
        name={`userOptions.${name}`}
        render={({ field, fieldState }) => (
            <InputField
                {...field}
                label={config.title ?? name}
                onChange={({ value }) => field.onChange(value || '')}
                helpText={config.description}
                error={!!fieldState.error}
                validationText={fieldState.error?.message}
                dataTest={`user-option-${name}`}
            />
        )}
    />
);
