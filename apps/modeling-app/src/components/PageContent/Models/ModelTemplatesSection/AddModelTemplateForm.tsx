import React, { useState, useMemo } from 'react';
import {
    Button,
    SingleSelectField,
    SingleSelectOption,
    IconAdd16,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { ApprovedTemplate } from '@dhis2-chap/ui';
import { useAddModelTemplate } from '../../../../hooks/useAddModelTemplate';
import styles from './ModelTemplatesSection.module.css';

type SelectOption = {
    value: string;
    label: string;
    url: string;
    version: string;
};

type Props = {
    availableTemplates: ApprovedTemplate[];
    isLoading: boolean;
};

export const AddModelTemplateForm = ({ availableTemplates, isLoading }: Props) => {
    const [selectedValue, setSelectedValue] = useState<string>('');

    const { addModelTemplate, isPending } = useAddModelTemplate({
        onSuccess: () => {
            setSelectedValue('');
        },
    });

    const options = useMemo(() => {
        const result: SelectOption[] = [];

        availableTemplates.forEach((template) => {
            Object.entries(template.versions).forEach(([versionKey]) => {
                result.push({
                    value: `${template.url}|${versionKey}`,
                    label: `${template.url}, ${versionKey}`,
                    url: template.url,
                    version: versionKey,
                });
            });
        });

        return result;
    }, [availableTemplates]);

    const handleAdd = () => {
        if (!selectedValue) return;

        const selectedOption = options.find(opt => opt.value === selectedValue);
        if (selectedOption) {
            addModelTemplate({
                url: selectedOption.url,
                version: selectedOption.version,
            });
        }
    };

    return (
        <div className={styles.addForm}>
            <div className={styles.selectContainer}>
                <SingleSelectField
                    label={i18n.t('Add model template')}
                    helpText={i18n.t('Select from available whitelisted templates')}
                    placeholder={i18n.t('Select a template to add')}
                    selected={selectedValue}
                    onChange={({ selected }) => setSelectedValue(selected ?? '')}
                    loading={isLoading}
                    disabled={isLoading || isPending || options.length === 0}
                >
                    {options.map(option => (
                        <SingleSelectOption
                            key={option.value}
                            value={option.value}
                            label={option.label}
                        />
                    ))}
                </SingleSelectField>
            </div>
            <div className={styles.addButtonContainer}>
                <Button
                    primary
                    small
                    icon={<IconAdd16 />}
                    onClick={handleAdd}
                    disabled={!selectedValue || isPending}
                    loading={isPending}
                    dataTest="add-model-template-button"
                >
                    {i18n.t('Add')}
                </Button>
            </div>
        </div>
    );
};
