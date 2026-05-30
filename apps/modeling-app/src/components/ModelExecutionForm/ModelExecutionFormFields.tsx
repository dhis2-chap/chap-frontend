import { type UseFormReturn } from 'react-hook-form';
import { ModelExecutionFormValues } from './hooks/useModelExecutionFormState';
import { NameInput } from './Sections/NameInput';
import { PeriodSelector } from './Sections/PeriodSelector';
import { LocationSelector } from './Sections/LocationSelector';
import { ModelSelector } from './Sections/ModelSelector/ModelSelector';
import { DatasetConfiguration } from './Sections/DatasetConfiguration';
import styles from './ModelExecutionFormFields.module.css';
import { ButtonStrip } from '@dhis2/ui';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

type Props = {
    methods: UseFormReturn<ModelExecutionFormValues>;
    onSubmit: (data: ModelExecutionFormValues) => void;
    periodSettings: Dhis2PeriodSettings;
    periodSettingsError?: Error | null;
    periodSettingsLoading?: boolean;
    actions?: React.ReactNode;
    footer?: React.ReactNode;
};

export const ModelExecutionFormFields = ({
    methods,
    onSubmit,
    periodSettings,
    periodSettingsError,
    periodSettingsLoading,
    actions,
    footer,
}: Props) => {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = methods;

    return (
        <div className={styles.formWrapper}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <NameInput
                    control={control}
                    errors={errors}
                />

                <PeriodSelector
                    control={control}
                    errors={errors}
                    periodSettings={periodSettings}
                    periodSettingsError={periodSettingsError}
                    periodSettingsLoading={periodSettingsLoading}
                />

                <LocationSelector
                    control={control}
                    errors={errors}
                />

                <ModelSelector
                    control={control}
                />

                <DatasetConfiguration
                    control={control}
                    errors={errors}
                    periodSettings={periodSettings}
                />
            </form>

            <ButtonStrip end>
                {actions}
            </ButtonStrip>

            {footer}
        </div>
    );
};
