import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import i18n from '@dhis2/d2-i18n';
import { useModelTemplates } from '../../../../../hooks/useModelTemplates';
import { useRoute } from '../../../../../hooks/useRoute';

export const modelTemplateConfigSchema = z.object({
    name: z.string().min(1, { message: i18n.t('Name is required') }),
    templateId: z.number().min(1, { message: i18n.t('Template is required') }),
    covariates: z.array(
        z.object({
            name: z.string()
                .min(1, { message: i18n.t('Covariate name is required') })
                .regex(/^\S*$/, { message: i18n.t('Covariate name cannot contain spaces') }),
        }),
    ),
    userOptions: z.record(z.any()),
});

export type ModelTemplateConfigFormValues = z.infer<typeof modelTemplateConfigSchema>;

export const useFormController = () => {
    const { route } = useRoute();
    const { modelTemplates, isLoading: isLoadingTemplates } = useModelTemplates({ route });
    const [newCovariate, setNewCovariate] = useState('');
    const [covariateError, setCovariateError] = useState('');

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<ModelTemplateConfigFormValues>({
        resolver: zodResolver(modelTemplateConfigSchema),
        defaultValues: {
            name: '',
            templateId: 0,
            covariates: [],
            userOptions: {},
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'covariates',
    });

    const watchedTemplateId = watch('templateId');
    const currentTemplate = useMemo(() => {
        return modelTemplates?.find((template: { id: number }) => template.id === watchedTemplateId);
    }, [modelTemplates, watchedTemplateId]);

    const requiredCovariates = currentTemplate?.requiredCovariates || [];

    const handleAddCovariate = () => {
        if (newCovariate.trim()) {
            const trimmedName = newCovariate.trim();

            if (/\s/.test(trimmedName)) {
                setCovariateError(i18n.t('Covariate name cannot contain spaces'));
                return;
            }

            const existsInRequired = requiredCovariates.includes(trimmedName);

            const existsInAdditional = fields.some(field =>
                watch(`covariates.${fields.indexOf(field)}.name`) === trimmedName,
            );

            if (!existsInRequired && !existsInAdditional) {
                append({ name: trimmedName });
                setNewCovariate('');
                setCovariateError('');
            } else {
                setCovariateError(i18n.t('Covariate already exists'));
                return;
            }
        }
    };

    return {
        control,
        handleSubmit,
        errors,
        watch,
        setValue,
        fields,
        append,
        remove,
        newCovariate,
        setNewCovariate,
        covariateError,
        setCovariateError,
        handleAddCovariate,
        currentTemplate,
        requiredCovariates,
        modelTemplates,
        isLoadingTemplates,
        watchedTemplateId,
    };
};
