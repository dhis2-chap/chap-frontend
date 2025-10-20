import React from 'react';
import { NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { ModelTemplateRead } from '@dhis2-chap/ui';

type Props = {
    modelTemplates: ModelTemplateRead[];
    selectedModelId: string;
    selectedModel?: ModelTemplateRead;
    onModelChange: (modelId: string) => void;
    validationText?: string;
};

export const ModelTemplateSelector = ({
    modelTemplates,
    selectedModelId,
    selectedModel,
    onModelChange,
    validationText,
}: Props) => {
    const isDeprecated = selectedModel?.authorAssessedStatus === 'gray';

    return (
        <>
            <SingleSelectField
                label={i18n.t('Model template')}
                helpText={i18n.t('Select the base model template')}
                placeholder={i18n.t('Select a model template')}
                selected={selectedModelId}
                onChange={({ selected }) => {
                    onModelChange(selected ?? '');
                }}
                error={Boolean(validationText)}
                validationText={validationText}
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

            {isDeprecated && (
                <NoticeBox warning title={i18n.t('Deprecated model')}>
                    {i18n.t('This model is deprecated and may be removed in the future.')}
                </NoticeBox>
            )}
        </>
    );
};
