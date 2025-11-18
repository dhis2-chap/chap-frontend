import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { ModelExecutionFormValues } from './hooks/useModelExecutionFormState';
import { NameInput } from './Sections/NameInput';
import { PeriodSelector } from './Sections/PeriodSelector';
import { LocationSelector } from './Sections/LocationSelector';
import { ModelSelector } from './Sections/ModelSelector/ModelSelector';
import { DatasetConfiguration } from './Sections/DatasetConfiguration';
import styles from './ModelExecutionFormFields.module.css';
import { ButtonStrip } from '@dhis2/ui';

type Props = {
    methods: UseFormReturn<ModelExecutionFormValues>;
    onSubmit: (data: ModelExecutionFormValues) => void;
    actions?: React.ReactNode;
    footer?: React.ReactNode;
    onOrgUnitSelectorOpen?: () => void;
};

export const ModelExecutionFormFields = ({
    methods,
    onSubmit,
    actions,
    footer,
    onOrgUnitSelectorOpen,
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
                />

                <LocationSelector
                    control={control}
                    errors={errors}
                    onOrgUnitSelectorOpen={onOrgUnitSelectorOpen}
                />

                <ModelSelector
                    control={control}
                />

                <DatasetConfiguration
                    control={control}
                    errors={errors}
                />
            </form>

            <ButtonStrip end>
                {actions}
            </ButtonStrip>

            {footer}
        </div>
    );
};
