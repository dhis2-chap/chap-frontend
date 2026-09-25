import {
    Input,
    Label,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext } from 'react-hook-form';
import { BaseFormValues } from '../../hooks/useModelExecutionFormState';
import styles from './NameInput.module.css';

type Props = {
    disabled?: boolean;
    label?: string;
    placeholder?: string;
};

export const NameInput = ({ disabled, label, placeholder }: Props = {}) => {
    const { control, formState: { errors } } = useFormContext<BaseFormValues>();

    return (
        <div className={styles.formField}>
            <Label htmlFor="evaluation-name">{label ?? i18n.t('Name')}</Label>
            <Controller
                name="name"
                control={control}
                render={({ field }) => (
                    <Input
                        {...field}
                        type="text"
                        disabled={disabled}
                        error={!!errors.name}
                        onChange={payload => field.onChange(payload.value)}
                        dataTest="evaluation-name-input"
                        placeholder={placeholder ?? i18n.t('EWARS Evaluation 22-24')}
                    />
                )}
            />
            {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}
        </div>
    );
};
