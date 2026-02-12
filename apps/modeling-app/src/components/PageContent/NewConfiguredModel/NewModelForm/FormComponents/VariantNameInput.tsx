import { InputField } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { ModelTemplateRead } from '@dhis2-chap/ui';

interface VariantNameInputProps {
    selectedModel?: ModelTemplateRead;
}

const getVariantNameHelpText = (selectedModel?: ModelTemplateRead, variantName?: string) => {
    if (selectedModel && variantName) {
        const modelDisplayName = selectedModel.displayName || selectedModel.name;
        return i18n.t('The model name will be "{{displayName}} [{{variantName}}]"', {
            displayName: modelDisplayName,
            variantName: variantName,
        });
    }
    return i18n.t('Provide a descriptive name for this variant');
};

export const VariantNameInput: React.FC<VariantNameInputProps> = ({ selectedModel }) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();

    const variantName = useWatch({ control, name: 'name' });

    return (
        <Controller
            name="name"
            control={control}
            render={({ field }) => (
                <InputField
                    {...field}
                    label={i18n.t('Variant name')}
                    autoComplete="off"
                    helpText={getVariantNameHelpText(selectedModel, variantName)}
                    error={!!errors.name}
                    validationText={errors.name?.message as string}
                    onChange={({ value }) => field.onChange(value)}
                    required
                    disabled={!selectedModel}
                />
            )}
        />
    );
};
