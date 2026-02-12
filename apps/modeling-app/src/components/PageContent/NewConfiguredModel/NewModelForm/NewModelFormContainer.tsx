import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, ModelTemplateRead } from '@dhis2-chap/ui';
import { z } from 'zod';
import { ModelTemplateSelector } from './FormComponents';
import { buildUserOptionsSchema, extractUserOptionsDefaults } from './FormComponents/UserOptionsFields';
import { baseModelSchema, NewModelFormValues } from './NewModelForm.types';
import { NewModelFormView } from './NewModelForm';
import { Resolver } from 'react-hook-form';

type Props = {
    modelTemplates: ModelTemplateRead[];
};

export const NewModelFormContainer = ({ modelTemplates }: Props) => {
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [modelValidationError, setModelValidationError] = useState<string | undefined>();

    const selectedModel = useMemo(
        () => modelTemplates.find(template => template.id.toString() === selectedModelId),
        [modelTemplates, selectedModelId],
    );

    const { resolver, defaultValues } = useMemo(() => {
        const targetModel = modelTemplates.find(template => template.id.toString() === selectedModelId);
        const userOptionsSchema = buildUserOptionsSchema(targetModel?.userOptions ?? null);
        const schema = baseModelSchema.extend({
            userOptions: userOptionsSchema ?? z.record(z.any()).optional(),
            additionalContinuousCovariates: z.array(z.string()).optional(),
        });

        const defaults: NewModelFormValues = {
            modelId: selectedModelId,
            name: '',
            userOptions: extractUserOptionsDefaults(targetModel?.userOptions ?? null),
            additionalContinuousCovariates: [],
        };

        return {
            resolver: zodResolver(schema),
            defaultValues: defaults,
        };
    }, [modelTemplates, selectedModelId]);

    const handleModelChange = (modelId: string) => {
        setModelValidationError(undefined);
        setSelectedModelId(modelId);
    };

    return (
        <Card>
            <ModelTemplateSelector
                modelTemplates={modelTemplates}
                selectedModelId={selectedModelId}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                validationText={modelValidationError}
            />
            {selectedModel && resolver && defaultValues && (
                <NewModelFormView
                    key={selectedModelId}
                    selectedModel={selectedModel}
                    resolver={resolver as Resolver<NewModelFormValues>}
                    defaultValues={defaultValues}
                    onValidationError={setModelValidationError}
                />
            )}
        </Card>
    );
};
