import React from 'react';
import { NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext } from 'react-hook-form';
import { ModelTemplateRead } from '@dhis2-chap/ui';

interface ModelTemplateSelectorProps {
    modelTemplates: ModelTemplateRead[];
    selectedModel?: ModelTemplateRead;
}

export const ModelTemplateSelector: React.FC<ModelTemplateSelectorProps> = ({
    modelTemplates,
    selectedModel
}) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();

    const isDeprecated = selectedModel?.authorAssessedStatus === 'gray';

    return (
        <>
            <Controller
                name="modelId"
                control={control}
                render={({ field }) => (
                    <SingleSelectField
                        label={i18n.t('Model template')}
                        helpText={i18n.t('Select the base model template')}
                        placeholder={i18n.t('Select a model template')}
                        selected={field.value}
                        onChange={({ selected }) => field.onChange(selected)}
                        error={!!errors.modelId}
                        validationText={errors.modelId?.message as string}
                        required
                    >
                        {modelTemplates.map(template => (
                            <SingleSelectOption
                                key={template.id}
                                value={template.id.toString()}
                                label={template.displayName || template.name}
                            />
                        ))}
                    </SingleSelectField>
                )}
            />

            {isDeprecated && (
                <NoticeBox warning title={i18n.t('Deprecated model')}>
                    {i18n.t('This model is deprecated and may be removed in the future.')}
                </NoticeBox>
            )}
        </>
    );
};

