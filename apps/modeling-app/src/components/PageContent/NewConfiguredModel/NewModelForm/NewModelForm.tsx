import React from 'react';
import { Button, ButtonStrip, IconArrowRightMulti16 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Card, ModelTemplateRead } from '@dhis2-chap/ui';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './NewModelForm.module.css';
import { VariantNameInput, ModelTemplateSelector } from './FormComponents';

const newModelSchema = z.object({
    modelId: z.string().min(1, { message: i18n.t('Model template is required') }),
    name: z.string().min(1, { message: i18n.t('Name is required') }),
});

type NewModelFormValues = z.infer<typeof newModelSchema>;

export const NewModelForm = ({ modelTemplates }: { modelTemplates: ModelTemplateRead[] }) => {
    const methods = useForm<NewModelFormValues>({
        resolver: zodResolver(newModelSchema),
        defaultValues: {
            modelId: '',
            name: '',
        },
        shouldFocusError: false,
    });

    const {
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = methods;

    const selectedModelId = useWatch({ control, name: 'modelId' });
    const selectedModel = modelTemplates.find(t => t.id.toString() === selectedModelId);

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
                        />

                        <VariantNameInput
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
