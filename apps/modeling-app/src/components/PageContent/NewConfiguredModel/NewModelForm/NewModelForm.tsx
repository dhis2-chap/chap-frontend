import React, { useCallback, useMemo } from 'react';
import { Button, ButtonStrip, IconArrowRightMulti16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Card, ModelTemplateRead } from '@dhis2-chap/ui';
import { FormProvider, ResolverOptions, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './NewModelForm.module.css';
import { VariantNameInput, ModelTemplateSelector } from './FormComponents';
import {
    buildUserOptionsSchema,
    extractUserOptionsDefaults,
    UserOptionsFields,
} from './FormComponents/UserOptionsFields';

const baseModelSchema = z.object({
    modelId: z.string().min(1, { message: i18n.t('Model template is required') }),
    name: z.string().min(1, { message: i18n.t('Name is required') }),
});

type NewModelFormValues = z.infer<typeof baseModelSchema> & {
    userOptions: Record<string, unknown>;
};

export const NewModelForm = ({ modelTemplates }: { modelTemplates: ModelTemplateRead[] }) => {
    const findModelTemplate = useCallback(
        (modelId?: string | null) =>
            modelTemplates.find(template => template.id.toString() === (modelId ?? '')),
        [modelTemplates],
    );

    const resolver = useCallback(
        async (values: NewModelFormValues, context: unknown, options: ResolverOptions<any>) => {
            const selectedModel = findModelTemplate(values.modelId);
            const userOptionsSchema = buildUserOptionsSchema(selectedModel?.userOptions ?? null);
            const schema = userOptionsSchema
                ? baseModelSchema.extend({ userOptions: userOptionsSchema })
                : baseModelSchema.extend({ userOptions: z.record(z.any()).optional() });

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
    }, [findModelTemplate, setValue]);

    const onSubmit = (values: NewModelFormValues) => {
        alert(JSON.stringify(values, null, 2));
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
                    </div>

                    <ButtonStrip end>
                        <Button
                            small
                            type="submit"
                            primary
                            loading={isSubmitting}
                            disabled={isSubmitting}
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
