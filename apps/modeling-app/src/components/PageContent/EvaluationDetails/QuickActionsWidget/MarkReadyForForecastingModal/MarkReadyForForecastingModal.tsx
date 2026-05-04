import {
    Button,
    ButtonStrip,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    Switch,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataItemSelect } from '../../../PredictionImport/QuantileMappingForm/DataItemSelect';
import styles from './MarkReadyForForecastingModal.module.css';

const requiredQuantileFields = [
    'quantile_high',
    'quantile_mid_high',
    'median',
    'quantile_mid_low',
    'quantile_low',
] as const;

const quantileFieldSchema = z.string();

const markReadyForForecastingSchema = z.object({
    name: z.string()
        .trim()
        .min(1, { message: i18n.t('Name is required') }),
    use_import_mapping: z.boolean(),
    quantile_high: quantileFieldSchema,
    quantile_mid_high: quantileFieldSchema,
    median: quantileFieldSchema,
    quantile_mid_low: quantileFieldSchema,
    quantile_low: quantileFieldSchema,
}).superRefine((values, context) => {
    if (!values.use_import_mapping) {
        return;
    }

    requiredQuantileFields.forEach((field) => {
        if (!values[field]) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: [field],
                message: i18n.t('Data element is required'),
            });
        }
    });
});

export type MarkReadyForForecastingFormValues = z.infer<typeof markReadyForForecastingSchema>;

const quantileFields: Array<{
    name: keyof Pick<
        MarkReadyForForecastingFormValues,
        'quantile_high' | 'quantile_mid_high' | 'median' | 'quantile_mid_low' | 'quantile_low'
    >;
    label: string;
}> = [
    { name: 'quantile_high', label: i18n.t('Quantile high') },
    { name: 'quantile_mid_high', label: i18n.t('Quantile mid high') },
    { name: 'median', label: i18n.t('Median') },
    { name: 'quantile_mid_low', label: i18n.t('Quantile mid low') },
    { name: 'quantile_low', label: i18n.t('Quantile low') },
];

type MarkReadyForForecastingModalProps = {
    onClose: () => void;
    onSubmit: (data: MarkReadyForForecastingFormValues) => void | Promise<void>;
    isSubmitting?: boolean;
};

export const MarkReadyForForecastingModal = ({
    onClose,
    onSubmit,
    isSubmitting = false,
}: MarkReadyForForecastingModalProps) => {
    const [scheduleIsEnabled, setScheduleIsEnabled] = useState(false);
    const [importMappingIsEnabled, setImportMappingIsEnabled] = useState(false);
    const {
        control,
        handleSubmit,
        setValue,
        clearErrors,
        formState: { errors },
    } = useForm<MarkReadyForForecastingFormValues>({
        resolver: zodResolver(markReadyForForecastingSchema),
        shouldFocusError: false,
        defaultValues: {
            name: '',
            use_import_mapping: false,
            quantile_high: '',
            quantile_mid_high: '',
            median: '',
            quantile_mid_low: '',
            quantile_low: '',
        },
    });

    const toggleImportMapping = () => {
        const nextIsEnabled = !importMappingIsEnabled;
        setImportMappingIsEnabled(nextIsEnabled);
        setValue('use_import_mapping', nextIsEnabled, { shouldDirty: true });

        if (!nextIsEnabled) {
            clearErrors(requiredQuantileFields);
        }
    };

    const toggleSchedule = () => {
        setScheduleIsEnabled(!scheduleIsEnabled);
    };

    const handleScheduleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleSchedule();
        }
    };

    const handleImportMappingKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleImportMapping();
        }
    };

    const handleSwitchClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

    return (
        <Modal onClose={onClose} dataTest="mark-ready-for-forecasting-modal" large>
            <form onSubmit={handleSubmit(onSubmit)}>
                <ModalTitle>{i18n.t('Mark as ready for forecasting')}</ModalTitle>
                <ModalContent>
                    <div className={styles.content}>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <InputField
                                    {...field}
                                    label={i18n.t('Configuration name')}
                                    autoComplete="off"
                                    error={!!errors.name}
                                    validationText={errors.name?.message}
                                    onChange={({ value }) => field.onChange(value)}
                                    dataTest="ready-configuration-name-input"
                                    required
                                />
                            )}
                        />

                        <section className={styles.section}>
                            <div
                                className={styles.mappingToggle}
                                onClick={toggleSchedule}
                                onKeyDown={handleScheduleKeyDown}
                                role="button"
                                tabIndex={0}
                            >
                                <div className={styles.mappingToggleText}>
                                    <span className={styles.mappingToggleTitle}>
                                        {i18n.t('Set schedule')}
                                    </span>
                                    <span className={styles.mappingToggleDescription}>
                                        {i18n.t('Choose when predictions should run automatically.')}
                                    </span>
                                </div>
                                <span onClick={handleSwitchClick}>
                                    <Switch
                                        checked={scheduleIsEnabled}
                                        onChange={toggleSchedule}
                                    />
                                </span>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <div
                                className={styles.mappingToggle}
                                onClick={toggleImportMapping}
                                onKeyDown={handleImportMappingKeyDown}
                                role="button"
                                tabIndex={0}
                            >
                                <div className={styles.mappingToggleText}>
                                    <span className={styles.mappingToggleTitle}>
                                        {i18n.t('Set default import mapping')}
                                    </span>
                                    <span className={styles.mappingToggleDescription}>
                                        {i18n.t('Choose the DHIS2 data elements to use by default when prediction outputs are imported. You can change these mappings before each import.')}
                                    </span>
                                </div>
                                <span onClick={handleSwitchClick}>
                                    <Switch
                                        checked={importMappingIsEnabled}
                                        onChange={toggleImportMapping}
                                    />
                                </span>
                            </div>
                            {importMappingIsEnabled && (
                                <div className={styles.quantileGrid}>
                                    {quantileFields.map(({ name, label }) => (
                                        <Controller
                                            key={name}
                                            name={name}
                                            control={control}
                                            render={({ field }) => (
                                                <DataItemSelect
                                                    label={label}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    error={errors[name]?.message}
                                                    dataElementsOnly
                                                />
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button
                            onClick={onClose}
                            secondary
                            disabled={isSubmitting}
                            dataTest="cancel-mark-ready-for-forecasting-button"
                        >
                            {i18n.t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            primary
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            dataTest="submit-mark-ready-for-forecasting-button"
                        >
                            {i18n.t('Save')}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </form>
        </Modal>
    );
};
