import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import * as z from 'zod';
import i18n from '@dhis2/d2-i18n';
import {
    buildOutbreakIndicators,
    DEFAULT_OUTBREAK_PROBABILITY,
    ModelSpecRead,
    OUTBREAK_PROBABILITY_OPTIONS,
    OutbreakProbability,
    PredictionInfo,
} from '@dhis2-chap/ui';
import {
    Button,
    ButtonStrip,
    Checkbox,
    CircularLoader,
    IconImportItems24,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
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
import { useEndemicThresholds } from '@/hooks/useEndemicThresholds';
import { usePredictionSeries } from '../../PredictionDetails/hooks/usePredictionSeries';
import { PredictionAlertsDialog } from '../../PredictionAlerts';
import { usePredictionSetup } from '@/hooks/usePredictionSetup';
import {
    getPredictionSetupQuantileTargets,
    QUANTILE_SUGGESTED_KEYWORDS,
} from '@/utils/predictionSetupImportMapping';
import { useAuthority } from '@/hooks/useAuthority';
import { ConditionalTooltip } from '@/components/ConditionalTooltip';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    predictionSetupId: number;
};

const outbreakProbabilitySchema = z.custom<OutbreakProbability>(
    value => OUTBREAK_PROBABILITY_OPTIONS.includes(value as OutbreakProbability),
    { message: i18n.t('Alert probability is required') },
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
            message: i18n.t('Outbreak indicator is required'),
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

export const QuantileMappingForm = ({ prediction, model, predictionSetupId }: Props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: locationState } = importLocationStateSchema.safeParse(location.state);
    const [isAlertsDialogOpen, setIsAlertsDialogOpen] = useState(false);
    const [clearPreviousValues, setClearPreviousValues] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<QuantileMappingFormValues | null>(null);
    const {
        series,
        isLoading: isSeriesLoading,
        error: seriesError,
    } = usePredictionSeries({ prediction, model });
    const { predictionSetup } = usePredictionSetup(predictionSetupId);
    const {
        hasAuthority: canDeleteDataValues,
        isLoading: isDeleteAuthorityLoading,
    } = useAuthority({ authority: 'F_DATAVALUE_DELETE' });

    const allPeriods = useMemo(() => {
        const periodSet = new Set<string>();
        for (const s of series) {
            s.actualCases?.forEach(ac => periodSet.add(ac.period));
            s.points.forEach(p => periodSet.add(p.period));
        }
        return Array.from(periodSet);
    }, [series]);

    const orgUnitIds = useMemo(() => (
        series.map(s => s.orgUnitId)
    ), [series]);

    const {
        thresholdMap,
        isLoading: isThresholdsLoading,
        error: thresholdsError,
    } = useEndemicThresholds({
        datasetId: prediction.datasetId,
        periodIds: allPeriods,
        locations: orgUnitIds,
        enabled: series.length > 0,
    });

    const isLoading = isSeriesLoading || isThresholdsLoading;
    const error = seriesError || thresholdsError;

    const unavailableThresholdCount = series.filter((orgUnitSeries) => {
        const thresholds = thresholdMap?.get(orgUnitSeries.orgUnitId);
        if (!thresholds) return true;
        return !thresholds.some(t => t.value !== null);
    }).length;
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
            navigate(`/predictions/${predictionSetupId}`);
        },
    });
    const canClearPreviousValues = canDeleteDataValues === true;

    useEffect(() => {
        if (canDeleteDataValues === true) {
            setClearPreviousValues(true);
        } else if (canDeleteDataValues === false) {
            setClearPreviousValues(false);
        }
    }, [canDeleteDataValues]);

    useEffect(() => {
        const quantileTargets = getPredictionSetupQuantileTargets(predictionSetup);

        if (!quantileTargets.length) {
            return;
        }

        quantileTargets.forEach(({ quantile, dataElementId }) => {
            if (quantileMappingFields.includes(quantile as typeof quantileMappingFields[number])) {
                const field = quantile as typeof quantileMappingFields[number];

                if (!dirtyFields[field]) {
                    setValue(field, dataElementId);
                    clearErrors(field);
                }
            }
        });
    }, [clearErrors, dirtyFields, predictionSetup, setValue]);

    const onSubmit = (data: QuantileMappingFormValues) => {
        setPendingImportData(data);
    };

    const handleConfirmImport = async () => {
        if (!pendingImportData) {
            return;
        }

        try {
            await mutateAsync({
                prediction,
                fallbackOrgUnitIds: predictionSetup?.orgUnits ?? [],
                clearPreviousValues,
                quantileMapping: {
                    quantileLowId: pendingImportData.quantile_low,
                    quantileHighId: pendingImportData.quantile_high,
                    quantileMedianId: pendingImportData.median,
                    quantileMidLowId: pendingImportData.quantile_mid_low,
                    quantileMidHighId: pendingImportData.quantile_mid_high,
                    outbreakIndicatorId: pendingImportData.use_alert_outputs
                        ? pendingImportData.outbreak_indicator
                        : '',
                },
                outbreakIndicators: pendingImportData.use_alert_outputs
                    ? buildOutbreakIndicators(series, pendingImportData.alert_probability, thresholdMap)
                    : [],
            });
        } catch {
            // Alerts are handled by the mutation hook; keep the modal open so the user can retry or cancel.
        }
    };

    const handleCancelImport = () => {
        if (!isPending) {
            setPendingImportData(null);
        }
    };

    const importButtonLabel = clearPreviousValues
        ? i18n.t('Clear and import')
        : i18n.t('Import');

    const clearPreviousValuesCheckbox = (
        <span className={styles.clearPreviousValuesTooltipTarget}>
            <Checkbox
                label={i18n.t('Clear previous values')}
                name="clearPreviousValues"
                checked={clearPreviousValues}
                onChange={() => setClearPreviousValues(prev => !prev)}
                disabled={!canClearPreviousValues}
            />
        </span>
    );

    const confirmationMessage = clearPreviousValues
        ? i18n.t('This will clear existing values for the selected output data elements, then import this prediction into DHIS2.')
        : i18n.t('This will import this prediction into DHIS2 without clearing existing values first.');
    const returnTo = `/predictions/${predictionSetupId}`;

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

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (error) {
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
                        dataElementsOnly
                        suggestedKeyword={QUANTILE_SUGGESTED_KEYWORDS.quantile_high}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile mid high')}
                        value={quantile_mid_high}
                        onChange={id => updateQuantile('quantile_mid_high', id)}
                        error={errors.quantile_mid_high?.message}
                        dataElementsOnly
                        suggestedKeyword={QUANTILE_SUGGESTED_KEYWORDS.quantile_mid_high}
                    />
                    <DataItemSelect
                        label={i18n.t('Median')}
                        value={median}
                        onChange={id => updateQuantile('median', id)}
                        error={errors.median?.message}
                        dataElementsOnly
                        suggestedKeyword={QUANTILE_SUGGESTED_KEYWORDS.median}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile mid low')}
                        value={quantile_mid_low}
                        onChange={id => updateQuantile('quantile_mid_low', id)}
                        error={errors.quantile_mid_low?.message}
                        dataElementsOnly
                        suggestedKeyword={QUANTILE_SUGGESTED_KEYWORDS.quantile_mid_low}
                    />
                    <DataItemSelect
                        label={i18n.t('Quantile low')}
                        value={quantile_low}
                        onChange={id => updateQuantile('quantile_low', id)}
                        error={errors.quantile_low?.message}
                        dataElementsOnly
                        suggestedKeyword={QUANTILE_SUGGESTED_KEYWORDS.quantile_low}
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

                    <div className={styles.clearPreviousValues}>
                        <ConditionalTooltip
                            enabled={!isDeleteAuthorityLoading && !canClearPreviousValues}
                            content={i18n.t('Requires data value delete authority.')}
                        >
                            {clearPreviousValuesCheckbox}
                        </ConditionalTooltip>
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
                            {importButtonLabel}
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

            {pendingImportData && (
                <Modal onClose={handleCancelImport} small>
                    <ModalTitle>
                        {clearPreviousValues ? i18n.t('Clear and import prediction') : i18n.t('Import prediction')}
                    </ModalTitle>
                    <ModalContent>
                        <p>{confirmationMessage}</p>
                    </ModalContent>
                    <ModalActions>
                        <ButtonStrip>
                            <Button onClick={handleCancelImport} secondary disabled={isPending}>
                                {i18n.t('Cancel')}
                            </Button>
                            <Button
                                onClick={handleConfirmImport}
                                loading={isPending}
                                primary={!clearPreviousValues}
                                destructive={clearPreviousValues}
                            >
                                {importButtonLabel}
                            </Button>
                        </ButtonStrip>
                    </ModalActions>
                </Modal>
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
