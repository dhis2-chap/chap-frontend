import { Controller } from 'react-hook-form';
import { SwitchField } from '@dhis2/ui';
import { FieldProps } from '../types';

export const BooleanOptionField = ({ name, config }: FieldProps) => (
    <Controller
        name={`userOptions.${name}`}
        render={({ field }) => (
            <SwitchField
                label={config.title ?? name}
                checked={Boolean(field.value)}
                onChange={({ checked }: { checked: boolean }) => field.onChange(checked)}
                helpText={config.description}
                dataTest={`user-option-${name}`}
            />
        )}
    />
);
