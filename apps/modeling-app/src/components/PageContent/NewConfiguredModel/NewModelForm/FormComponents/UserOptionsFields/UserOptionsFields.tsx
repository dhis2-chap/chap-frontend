import React, { useState } from 'react';
import { SwitchField, InputField, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, useFormContext } from 'react-hook-form';
import { ModelTemplateRead, Tag } from '@dhis2-chap/ui';
import styles from './UserOptionsFields.module.css';

type OptionConfig = {
    type?: string;
    title?: string;
    description?: string;
    default?: unknown;
    enum?: unknown[];
    items?: OptionConfig;
    anyOf?: OptionConfig[];
};

type Props = {
    selectedModel?: ModelTemplateRead;
};

const isOptionConfig = (value: unknown): value is OptionConfig => {
    return typeof value === 'object' && value !== null;
};

const renderEnumOptions = (name: string, config: OptionConfig) => {
    if (!Array.isArray(config.enum) || config.enum.length === 0) {
        return null;
    }

    return (
        <Controller
            name={`userOptions.${name}`}
            render={({ field, fieldState }) => (
                <SingleSelectField
                    label={config.title ?? name}
                    selected={field.value as string | undefined}
                    onChange={({ selected }: { selected: string }) => field.onChange(selected)}
                    helpText={config.description}
                    error={!!fieldState.error}
                    validationText={fieldState.error?.message}
                    dataTest={`user-option-${name}`}
                >
                    {config.enum?.map(option => (
                        <SingleSelectOption key={`${name}-${option}`} value={option as string} label={String(option)} />
                    ))}
                </SingleSelectField>
            )}
        />
    );
};

const renderBooleanField = (name: string, config: OptionConfig) => (
    <Controller
        name={`userOptions.${name}`}
        render={({ field }) => (
            <SwitchField
                label={config.title ?? name}
                checked={Boolean(field.value)}
                onChange={({ checked }: { checked: boolean }) => field.onChange(checked)}
                helpText={config.description}
                dataTest={`user-option-${name}`}
            />
        )}
    />
);

const renderNumberField = (name: string, config: OptionConfig) => (
    <Controller
        name={`userOptions.${name}`}
        render={({ field, fieldState }) => (
            <InputField
                {...field}
                label={config.title ?? name}
                type="text"
                onChange={({ value }) => field.onChange(value || '')}
                value={field.value?.toString() || ''}
                helpText={config.description}
                error={!!fieldState.error}
                validationText={fieldState.error?.message}
                dataTest={`user-option-${name}`}
            />
        )}
    />
);

const renderIntegerField = (name: string, config: OptionConfig) => (
    <Controller
        name={`userOptions.${name}`}
        render={({ field, fieldState }) => (
            <InputField
                {...field}
                label={config.title ?? name}
                type="text"
                onChange={({ value }) => field.onChange(value || '')}
                value={field.value?.toString() || ''}
                helpText={config.description}
                error={!!fieldState.error}
                validationText={fieldState.error?.message}
                dataTest={`user-option-${name}`}
            />
        )}
    />
);

const renderStringField = (name: string, config: OptionConfig) => (
    <Controller
        name={`userOptions.${name}`}
        render={({ field, fieldState }) => (
            <InputField
                {...field}
                label={config.title ?? name}
                onChange={({ value }) => field.onChange(value || '')}
                helpText={config.description}
                error={!!fieldState.error}
                validationText={fieldState.error?.message}
                dataTest={`user-option-${name}`}
            />
        )}
    />
);

const ArrayOptionField: React.FC<{ name: string; config: OptionConfig }> = ({ name, config }) => {
    const [inputValue, setInputValue] = useState('');

    return (
        <Controller
            name={`userOptions.${name}`}
            render={({ field, fieldState }) => {
                const values = field.value as string[] ?? [];

                const addValue = () => {
                    const trimmed = inputValue.trim();
                    if (!trimmed || !trimmed.length) {
                        return;
                    }

                    field.onChange([...values, trimmed]);
                    setInputValue('');
                };

                const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        addValue();
                    }
                };

                return (
                    <div className={styles.arrayField} data-test={`user-option-${name}`}>
                        <InputField
                            label={config.title ?? name}
                            value={inputValue}
                            onChange={({ value }) => setInputValue(value || '')}
                            onKeyDown={(_, event) => handleKeyDown(event)}
                            placeholder={i18n.t('Type a value and press Enter')}
                            helpText={config.description}
                            error={!!fieldState.error}
                            validationText={fieldState.error?.message}
                        />
                        {values.length > 0 && (
                            <div className={styles.tagList}>
                                {values.map((value, index) => (
                                    <Tag
                                        key={`${name}-${value}-${index}`}
                                        onRemove={() => {
                                            const next = values.filter((_, idx) => idx !== index);
                                            field.onChange(next);
                                        }}
                                    >
                                        {String(value)}
                                    </Tag>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }}
        />
    );
};

const fieldRenderers: Record<string, (name: string, config: OptionConfig) => React.ReactNode> = {
    boolean: renderBooleanField,
    number: renderNumberField,
    integer: renderIntegerField,
    string: renderStringField,
    array: (name, config) => <ArrayOptionField name={name} config={config} />,
};

const resolveType = (config: OptionConfig): string | undefined => {
    if (config.type) {
        return config.type;
    }

    if (Array.isArray(config.anyOf) && config.anyOf.length > 0) {
        const firstNonNull = config.anyOf.find(option => option.type !== 'null');
        return firstNonNull?.type;
    }

    return undefined;
};

const renderFieldByType = (name: string, config: OptionConfig) => {
    if (Array.isArray(config.enum) && config.enum.length > 0) {
        return renderEnumOptions(name, config);
    }

    const type = resolveType(config);
    const renderer = fieldRenderers[type ?? ''];

    if (!renderer) {
        console.error(`Unsupported option type for ${name}: ${type}`);
        return null;
    }

    return renderer(name, config);
};

export const UserOptionsFields = ({ selectedModel }: Props) => {
    useFormContext();

    if (!selectedModel || !selectedModel.userOptions) {
        return null;
    }

    const entries = Object.entries(selectedModel.userOptions).filter((entry): entry is [string, OptionConfig] => isOptionConfig(entry[1]));

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{i18n.t('Model options')}</h3>
            {entries.map(([name, config]) => (
                <React.Fragment key={name}>
                    {renderFieldByType(name, config)}
                </React.Fragment>
            ))}
        </div>
    );
};
