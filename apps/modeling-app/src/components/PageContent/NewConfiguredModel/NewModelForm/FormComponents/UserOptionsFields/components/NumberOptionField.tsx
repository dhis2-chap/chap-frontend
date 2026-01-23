import { Controller } from 'react-hook-form';
import { InputField } from '@dhis2/ui';
import { FieldProps } from '../types';

export const NumberOptionField = ({ name, config }: FieldProps) => (
    <Controller
        name={`userOptions.${name}`}
        render={({ field, fieldState }) => (
            <InputField
                {...field}
                label={config.title ?? name}
                type="text"
                onChange={({ value }) => field.onChange(value || '')}
                value={field.value?.toString() || ''}
                helpText={config.description}
                error={!!fieldState.error}
                validationText={fieldState.error?.message}
                dataTest={`user-option-${name}`}
            />
        )}
    />
);
