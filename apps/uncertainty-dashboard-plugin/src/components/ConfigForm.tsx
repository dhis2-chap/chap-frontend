import { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    InputField,
} from '@dhis2/ui';
import {
    Controller,
    Resolver,
    SubmitHandler,
    useForm,
} from 'react-hook-form';
import {
    CONFIG_VERSION,
    QUANTILE_FIELDS,
} from '@/constants';
import {
    DataItemOption,
    PluginConfig,
    DataItemSchema,
    QuantileDataItemSchema,
} from '@/types';
import type { QuantileKey } from '@dhis2-chap/ui';
import { DataItemPicker } from './DataItemPicker';
import styles from './ConfigForm.module.css';

const ConfigFormSchema = z.object({
    title: z.string().optional(),
    targetDataItem: DataItemSchema,
    quantiles: z.object({
        quantile_low: QuantileDataItemSchema,
        quantile_mid_low: QuantileDataItemSchema,
        median: QuantileDataItemSchema,
        quantile_mid_high: QuantileDataItemSchema,
        quantile_high: QuantileDataItemSchema,
    }),
});

type ConfigFormValues = {
    title: string;
    targetDataItem: DataItemOption | null;
    quantiles: Record<QuantileKey, DataItemOption | null>;
};

type ConfigFormProps = {
    config: PluginConfig | null;
    isSaving: boolean;
    onSave: (config: PluginConfig) => void;
};

const getDefaultValues = (config: PluginConfig | null): ConfigFormValues => ({
    title: config?.title ?? '',
    targetDataItem: config?.targetDataItem ?? null,
    quantiles: {
        quantile_low: config?.quantiles.quantile_low ?? null,
        quantile_mid_low: config?.quantiles.quantile_mid_low ?? null,
        median: config?.quantiles.median ?? null,
        quantile_mid_high: config?.quantiles.quantile_mid_high ?? null,
        quantile_high: config?.quantiles.quantile_high ?? null,
    },
});

export const ConfigForm = ({
    config,
    isSaving,
    onSave,
}: ConfigFormProps) => {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ConfigFormValues>({
        defaultValues: getDefaultValues(config),
        resolver: zodResolver(ConfigFormSchema) as unknown as Resolver<ConfigFormValues>,
    });

    useEffect(() => {
        reset(getDefaultValues(config));
    }, [config, reset]);

    const handleValidSubmit: SubmitHandler<ConfigFormValues> = (values) => {
        const {
            title,
            ...parsedValues
        } = ConfigFormSchema.parse(values);
        const normalizedTitle = title?.trim();

        onSave({
            version: CONFIG_VERSION,
            ...parsedValues,
            ...(normalizedTitle ? { title: normalizedTitle } : {}),
            ...(config?.fallbackOrgUnit ? { fallbackOrgUnit: config.fallbackOrgUnit } : {}),
        });
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit(handleValidSubmit)}>
            <div className={styles.header}>
                <h1 className={styles.title}>{i18n.t('Configure uncertainty chart')}</h1>
                <p className={styles.description}>
                    {i18n.t('Choose the actual data item and the five forecast quantile data elements.')}
                </p>
            </div>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{i18n.t('Display')}</h2>
                <Controller
                    control={control}
                    name="title"
                    render={({ field }) => (
                        <InputField
                            label={i18n.t('Chart title')}
                            value={field.value}
                            placeholder={i18n.t('Use target data item name')}
                            onChange={({ value }: { value?: string }) => {
                                field.onChange(value ?? '');
                            }}
                        />
                    )}
                />
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{i18n.t('Actual values')}</h2>
                <Controller
                    control={control}
                    name="targetDataItem"
                    render={({ field }) => (
                        <DataItemPicker
                            label={i18n.t('Actual / target data item')}
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.targetDataItem?.message}
                        />
                    )}
                />
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{i18n.t('Forecast quantiles')}</h2>
                <div className={styles.grid}>
                    {QUANTILE_FIELDS.map(fieldDefinition => (
                        <Controller
                            key={fieldDefinition.key}
                            control={control}
                            name={`quantiles.${fieldDefinition.key}`}
                            render={({ field }) => (
                                <DataItemPicker
                                    label={fieldDefinition.label}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={errors.quantiles?.[fieldDefinition.key]?.message}
                                    dataElementsOnly
                                    suggestedKeyword={fieldDefinition.suggestedKeyword}
                                />
                            )}
                        />
                    ))}
                </div>
            </section>

            <div className={styles.actions}>
                <Button primary type="submit" loading={isSaving} disabled={isSaving}>
                    {i18n.t('Save configuration')}
                </Button>
            </div>
        </form>
    );
};
