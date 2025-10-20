import React, { useCallback, useMemo } from 'react';
import { Button, ButtonStrip, IconArrowRightMulti16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Card, ModelTemplateRead } from '@dhis2-chap/ui';
import { FormProvider, ResolverOptions, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './NewModelForm.module.css';
import { VariantNameInput, ModelTemplateSelector, AdditionalCovariatesField } from './FormComponents';
import {
    buildUserOptionsSchema,
    extractUserOptionsDefaults,
    UserOptionsFields,
} from './FormComponents/UserOptionsFields';
import { useNavigate } from 'react-router-dom';
import { useCreateModel } from '../hooks/useCreateModel';

const baseModelSchema = z.object({
    modelId: z.string().min(1, { message: i18n.t('Model template is required') }),
    name: z.string().min(1, { message: i18n.t('Name is required') }),
});

type NewModelFormValues = z.infer<typeof baseModelSchema> & {
    userOptions: Record<string, unknown>;
    additionalContinuousCovariates: string[];
};

export const NewModelForm = ({ modelTemplates }: { modelTemplates: ModelTemplateRead[] }) => {
    const navigate = useNavigate();
    const { createModel, isCreating } = useCreateModel({
        onSuccess: (createdModel) => {
            if (createdModel.id) {
                navigate(`/models/${createdModel.id}`);
            } else {
                navigate('/models');
            }
        },
    });
    const findModelTemplate = useCallback(
        (modelId?: string | null) =>
            modelTemplates.find(template => template.id.toString() === (modelId ?? '')),
        [modelTemplates],
    );

    const resolver = useCallback(
        async (values: NewModelFormValues, context: unknown, options: ResolverOptions<any>) => {
            const selectedModel = findModelTemplate(values.modelId);
            const userOptionsSchema = buildUserOptionsSchema(selectedModel?.userOptions ?? null);
            const schemaExtensions = userOptionsSchema
                ? { userOptions: userOptionsSchema }
                : { userOptions: z.record(z.any()).optional() };

            const schema = baseModelSchema.extend({
                ...schemaExtensions,
                additionalContinuousCovariates: z.array(z.string()).optional(),
            });

            return zodResolver(schema)(values, context, options);
        },
        [findModelTemplate],
    );

    const methods = useForm<NewModelFormValues>({
        resolver,
        defaultValues: {
            modelId: '',
            name: '',
            userOptions: {},
            additionalContinuousCovariates: [],
        },
        shouldFocusError: false,
    });

    const {
        control,
        handleSubmit,
        setValue,
        formState: { isSubmitting },
    } = methods;

    const selectedModelId = useWatch({ control, name: 'modelId' });
    const selectedModel = useMemo(
        () => findModelTemplate(selectedModelId),
        [findModelTemplate, selectedModelId],
    );

    const handleModelChange = useCallback((modelId: string) => {
        const model = findModelTemplate(modelId);
        const defaults = extractUserOptionsDefaults(model?.userOptions ?? null);
        setValue('userOptions', defaults, { shouldDirty: true, shouldValidate: false });
        setValue('additionalContinuousCovariates', [], { shouldDirty: true, shouldValidate: false });
    }, [findModelTemplate, setValue]);

    const onSubmit = async (values: NewModelFormValues) => {
        const payload = {
            name: values.name,
            modelTemplateId: Number(values.modelId),
            userOptionValues: values.userOptions ?? {},
            additionalContinuousCovariates: values.additionalContinuousCovariates ?? [],
        };

        await createModel(payload);
    };

    return (
        <FormProvider {...methods}>
            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.formFields}>
                        <ModelTemplateSelector
                            modelTemplates={modelTemplates}
                            selectedModel={selectedModel}
                            onModelChange={handleModelChange}
                        />

                        <VariantNameInput
                            selectedModel={selectedModel}
                        />

                        <UserOptionsFields
                            selectedModel={selectedModel}
                        />

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
            </Card>
        </FormProvider>
    );
};
