import { useEffect, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import * as z from 'zod';
import i18n from '@dhis2/d2-i18n';
import {
    buildOutbreakIndicators,
    calculateMockEndemicThreshold,
    DEFAULT_OUTBREAK_PROBABILITY,
    ModelSpecRead,
    OUTBREAK_PROBABILITY_OPTIONS,
    OutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconImportItems24,
    NoticeBox,
    Switch,
} from '@dhis2/ui';
import styles from './QuantileMappingForm.module.css';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { DataItemSelect } from './DataItemSelect';
import { usePostPredictionData } from '../hooks/usePostPredictionData';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { NavigationConfirmModal } from '@/components/NavigationConfirmModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePredictionSeries } from '../../PredictionDetails/hooks/usePredictionSeries';
import { PredictionAlertsDialog } from '../../PredictionAlerts';
import { usePredictionSetup } from '@/hooks/usePredictionSetup';
import { getPredictionSetupDataImportMappings } from '@/utils/predictionSetupImportMapping';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
};

const outbreakProbabilitySchema = z.custom<OutbreakProbability>(
    value => OUTBREAK_PROBABILITY_OPTIONS.includes(value as OutbreakProbability),
    { message: 'Alert probability is required' },
);

const importLocationStateSchema = z
    .object({
        alertProbability: outbreakProbabilitySchema.optional(),
        useAlertOutputs: z.boolean().optional(),
    })
    .passthrough()
    .optional();

export const quantileMappingSchema = z.object({
    quantile_low: z.string().min(1, { message: 'Quantile low is required' }),
    quantile_high: z.string().min(1, { message: 'Quantile high is required' }),
    median: z.string().min(1, { message: 'Median is required' }),
    quantile_mid_low: z.string().min(1, { message: 'Quantile mid low is required' }),
    quantile_mid_high: z.string().min(1, { message: 'Quantile mid high is required' }),
    use_alert_outputs: z.boolean(),
    alert_probability: outbreakProbabilitySchema,
    outbreak_indicator: z.string(),
}).superRefine((values, context) => {
    if (values.use_alert_outputs && !values.outbreak_indicator) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['outbreak_indicator'],
            message: 'Outbreak indicator is required',
        });
    }
});

type QuantileMappingFormValues = z.infer<typeof quantileMappingSchema>;
type MappingField = keyof QuantileMappingFormValues;

const quantileMappingFields = [
    'quantile_low',
    'quantile_high',
    'median',
    'quantile_mid_low',
    'quantile_mid_high',
] as const satisfies MappingField[];

export const QuantileMappingForm = ({ prediction, model }: Props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: locationState } = importLocationStateSchema.safeParse(location.state);
    const [isAlertsDialogOpen, setIsAlertsDialogOpen] = useState(false);
    const {
        series,
        isLoading: isSeriesLoading,
        error: seriesError,
    } = usePredictionSeries({ prediction, model });
    const { predictionSetup } = usePredictionSetup(prediction.predictionSetupId ?? undefined);
    const unavailableThresholdCount = series.filter(orgUnitSeries => (
        !calculateMockEndemicThreshold(orgUnitSeries.actualCases).available
    )).length;
    const {
        handleSubmit,
        formState: { errors, isDirty, dirtyFields },
        setValue,
        clearErrors,
        control,
    } = useForm<QuantileMappingFormValues>({
        resolver: zodResolver(quantileMappingSchema),
        defaultValues: {
            quantile_low: '',
            quantile_high: '',
            median: '',
            quantile_mid_low: '',
            quantile_mid_high: '',
            use_alert_outputs: locationState?.useAlertOutputs ?? true,
            alert_probability: locationState?.alertProbability ?? DEFAULT_OUTBREAK_PROBABILITY,
            outbreak_indicator: '',
        },
    });
    const { mutateAsync, isPending } = usePostPredictionData({
        onSuccess: () => {
            navigate(prediction.predictionSetupId
                ? `/predictions/${prediction.predictionSetupId}`
                : '/predictions');
        },
    });

    useEffect(() => {
        const dataImportMappings = getPredictionSetupDataImportMappings(predictionSetup);

        if (!dataImportMappings.length) {
            return;
        }

        dataImportMappings.forEach(({ quantileKey, dataElementId }) => {
            if (quantileMappingFields.includes(quantileKey as typeof quantileMappingFields[number])) {
                const field = quantileKey as typeof quantileMappingFields[number];

                if (!dirtyFields[field]) {
                    setValue(field, dataElementId);
                    clearErrors(field);
                }
            }
        });
    }, [clearErrors, dirtyFields, predictionSetup, setValue]);

    const onSubmit = async (data: QuantileMappingFormValues) => {
        await mutateAsync({
            predictionId: prediction.id,
            quantileMapping: {
                quantileLowId: data.quantile_low,
                quantileHighId: data.quantile_high,
                quantileMedianId: data.median,
                quantileMidLowId: data.quantile_mid_low,
                quantileMidHighId: data.quantile_mid_high,
                outbreakIndicatorId: data.use_alert_outputs ? data.outbreak_indicator : '',
            },
            outbreakIndicators: data.use_alert_outputs
                ? buildOutbreakIndicators(series, data.alert_probability)
                : [],
        });
    };
    const returnTo = prediction.predictionSetupId
        ? `/predictions/${prediction.predictionSetupId}`
        : '/predictions';

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isPending && isDirty,
    });
    const {
        quantile_low,
        quantile_high,
        median,
        quantile_mid_low,
        quantile_mid_high,
        use_alert_outputs,
        alert_probability,
        outbreak_indicator,
    } = useWatch({ control });
    const selectedProbability = alert_probability ?? DEFAULT_OUTBREAK_PROBABILITY;

    const updateQuantile = (quantile: MappingField, id: string | null) => {
        if (id) {
            clearErrors(quantile);
        }
        setValue(quantile, id ?? '', { shouldDirty: true });
    };

    const toggleAlertOutputs = () => {
        setValue('use_alert_outputs', !use_alert_outputs, { shouldDirty: true });
        clearErrors('outbreak_indicator');
    };

    const handleAlertOutputKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleAlertOutputs();
        }
    };

    const handleSwitchClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

    const handleApplyAlertProbability = (probability: OutbreakProbability) => {
        setValue('alert_probability', probability, { shouldDirty: true });
    };

    if (isSeriesLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (seriesError) {
        return (
            <NoticeBox error title={i18n.t('Unable to load alert data')}>
                {i18n.t('There was a problem loading the prediction data required for outbreak indicator import.')}
            </NoticeBox>
        );
    }

    return (
        <>
            <div className={styles.customNoticeBox}>
                <span>
                    <IconImportItems24 />
                </span>

                <span className={styles.title}>
                    {i18n.t('Import forecasted values')}
                </span>

                <span className={styles.description}>
                    {i18n.t('Importing forecasted values into DHIS2 requires you to set up five data elements for the quantiles outputted by the model.')}
                </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.dataItemSelects}>
                    <DataItemSelect
                        label={i18n.t('Quantile high')}
                        value={quantile_high}
                        onChange={id => updateQuantile('quantile_high', id)}
                        error={errors.quantile_high?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile mid high')}
                        value={quantile_mid_high}
                        onChange={id => updateQuantile('quantile_mid_high', id)}
                        error={errors.quantile_mid_high?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Median')}
                        value={median}
                        onChange={id => updateQuantile('median', id)}
                        error={errors.median?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile mid low')}
                        value={quantile_mid_low}
                        onChange={id => updateQuantile('quantile_mid_low', id)}
                        error={errors.quantile_mid_low?.message}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile low')}
                        value={quantile_low}
                        onChange={id => updateQuantile('quantile_low', id)}
                        error={errors.quantile_low?.message}
                    />

                    <div className={styles.alertOutput}>
                        <h3>{i18n.t('Alert output')}</h3>
                        <div
                            className={styles.alertOutputToggle}
                            onClick={toggleAlertOutputs}
                            onKeyDown={handleAlertOutputKeyDown}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.alertOutputToggleText}>
                                <span className={styles.alertOutputToggleTitle}>
                                    {i18n.t('Use alert outputs')}
                                </span>
                                <span className={styles.alertOutputToggleDescription}>
                                    {i18n.t('Import outbreak indicator values.')}
                                </span>
                            </div>
                            <span onClick={handleSwitchClick}>
                                <Switch
                                    checked={use_alert_outputs}
                                    onChange={toggleAlertOutputs}
                                />
                            </span>
                        </div>
                        {use_alert_outputs && (
                            <>
                                {unavailableThresholdCount > 0 && (
                                    <NoticeBox warning title={i18n.t('Some outbreak indicators will be skipped')}>
                                        {i18n.t('Outbreak indicators will be skipped for one region due to insufficient disease data.', {
                                            count: unavailableThresholdCount,
                                            defaultValue_plural: 'Outbreak indicators will be skipped for {{count}} regions due to insufficient disease data.',
                                        })}
                                    </NoticeBox>
                                )}
                                <div className={styles.alertSummary}>
                                    <div>
                                        <span className={styles.summaryLabel}>
                                            {i18n.t('Minimum outbreak probability')}
                                        </span>
                                        <span className={styles.summaryValue}>
                                            {`${selectedProbability}%`}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.tertiaryActionButton}
                                        onClick={() => setIsAlertsDialogOpen(true)}
                                    >
                                        {i18n.t('Adjust')}
                                    </button>
                                </div>
                                <div className={styles.outbreakIndicatorField}>
                                    <DataItemSelect
                                        label={i18n.t('Outbreak indicator')}
                                        value={outbreak_indicator}
                                        onChange={id => updateQuantile('outbreak_indicator', id)}
                                        error={errors.outbreak_indicator?.message}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <ButtonStrip end className={styles.buttonStrip}>
                        <Button
                            type="button"
                            onClick={() => navigate(returnTo)}
                        >
                            {i18n.t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            loading={isPending}
                            primary
                        >
                            {i18n.t('Import')}
                        </Button>
                    </ButtonStrip>
                </div>

            </form>

            {showConfirmModal && (
                <NavigationConfirmModal
                    onConfirm={handleConfirmNavigation}
                    onCancel={handleCancelNavigation}
                />
            )}

            {isAlertsDialogOpen && (
                <PredictionAlertsDialog
                    prediction={prediction}
                    model={model}
                    selectedProbability={selectedProbability}
                    onApply={handleApplyAlertProbability}
                    onClose={() => setIsAlertsDialogOpen(false)}
                />
            )}
        </>
    );
};
