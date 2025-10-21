import React from 'react';
import { Button, ButtonStrip, IconArrowRightMulti16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { ModelTemplateRead } from '@dhis2-chap/ui';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import styles from './NewModelForm.module.css';
import { VariantNameInput, AdditionalCovariatesField } from './FormComponents';
import { UserOptionsFields } from './FormComponents/UserOptionsFields';
import { useNavigate } from 'react-router-dom';
import { useCreateModel } from '../hooks/useCreateModel';
import { NewModelFormValues } from './NewModelForm.types';

type NewModelFormViewProps = {
    selectedModel?: ModelTemplateRead;
    resolver: Resolver<NewModelFormValues>;
    defaultValues: NewModelFormValues;
    onValidationError?: (message?: string) => void;
};

export const NewModelFormView = ({
    selectedModel,
    resolver,
    defaultValues,
    onValidationError,
}: NewModelFormViewProps) => {
    const navigate = useNavigate();
    const { createModel, isCreating } = useCreateModel({
        onSuccess: () => {
            navigate('/models');
        },
    });
    const methods = useForm<NewModelFormValues>({
        resolver,
        defaultValues,
        shouldFocusError: false,
    });

    const {
        handleSubmit,
        register,
        formState: { isSubmitting },
    } = methods;

    const submitHandler = handleSubmit(
        async (values) => {
            const payload = {
                name: values.name,
                modelTemplateId: Number(values.modelId),
                userOptionValues: values.userOptions ?? {},
                additionalContinuousCovariates: values.additionalContinuousCovariates ?? [],
            };

            await createModel(payload);
        },
        (errors) => {
            // In case of modelId error, we want to show the error message in the parent field - in practice this should never happen
            const modelError = errors.modelId?.message as string | undefined;
            onValidationError?.(modelError);
        },
    );

    return (
        <FormProvider {...methods}>
            <form onSubmit={submitHandler}>
                <input type="hidden" {...register('modelId')} />
                <div className={styles.formFields}>
                    <VariantNameInput selectedModel={selectedModel} />

                    <UserOptionsFields selectedModel={selectedModel} />

                    {selectedModel?.allowFreeAdditionalContinuousCovariates && (
                        <AdditionalCovariatesField
                            requiredCovariates={selectedModel?.requiredCovariates ?? []}
                        />
                    )}
                </div>

                <ButtonStrip end>
                    <Button
                        small
                        type="submit"
                        primary
                        loading={isSubmitting || isCreating}
                        disabled={isSubmitting || isCreating}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <p>{i18n.t('Save')}</p>
                        <IconArrowRightMulti16 />
                    </Button>
                </ButtonStrip>
            </form>
        </FormProvider>
    );
};
