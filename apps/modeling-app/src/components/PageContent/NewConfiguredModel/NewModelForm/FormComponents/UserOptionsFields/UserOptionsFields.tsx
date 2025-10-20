import React from 'react';
import { ModelTemplateRead } from '@dhis2-chap/ui';
import {
    ArrayOptionField,
    BooleanOptionField,
    EnumOptionField,
    IntegerOptionField,
    NumberOptionField,
    StringOptionField,
} from './components';
import { FieldProps, OptionConfig } from './types';
import styles from './UserOptionsFields.module.css';

type Props = {
    selectedModel?: ModelTemplateRead;
};

const isOptionConfig = (value: unknown): value is OptionConfig => {
    return typeof value === 'object' && value !== null;
};

const fieldRenderers: Partial<Record<string, React.FC<FieldProps>>> = {
    boolean: BooleanOptionField,
    number: NumberOptionField,
    integer: IntegerOptionField,
    string: StringOptionField,
    array: ArrayOptionField,
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
        return <EnumOptionField name={name} config={config} />;
    }

    const type = resolveType(config);
    const FieldComponent = type ? fieldRenderers[type] : undefined;

    if (!FieldComponent) {
        console.error(`Unsupported option type for ${name}: ${type}`);
        return null;
    }

    return <FieldComponent name={name} config={config} />;
};

export const UserOptionsFields = ({ selectedModel }: Props) => {
    if (!selectedModel || !selectedModel.userOptions) {
        return null;
    }

    const entries = Object.entries(selectedModel.userOptions).filter((entry): entry is [string, OptionConfig] => isOptionConfig(entry[1]));

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            {entries.map(([name, config]) => (
                <React.Fragment key={name}>
                    {renderFieldByType(name, config)}
                </React.Fragment>
            ))}
        </div>
    );
};
