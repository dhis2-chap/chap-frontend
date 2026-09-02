import { useMemo, useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    buildOutbreakIndicators,
    DEFAULT_OUTBREAK_PROBABILITY,
    type OutbreakProbability,
} from '@dhis2-chap/ui';
import {
    Button,
    ButtonStrip,
    IconImportItems24,
} from '@dhis2/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationConfirmModal } from '@/components/NavigationConfirmModal';
import { useEndemicThresholds } from '@/hooks/useEndemicThresholds';
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { useThresholdStrategies } from '@/hooks/useThresholdStrategies';
import {
    areThresholdParamsEqual,
    DEFAULT_THRESHOLD_STRATEGY,
    describeThresholdParams,
    getDefaultThresholdParams,
    type ThresholdParams,
} from '@/utils/thresholdStrategyParams';
import { PredictionAlertsDialog } from '../../PredictionAlerts';
import { usePostPredictionData } from '../hooks/usePostPredictionData';
import { AlertOutputSection } from './AlertOutputSection';
import { ClearPreviousValuesControl } from './ClearPreviousValuesControl';
import { ImportConfirmationModal } from './ImportConfirmationModal';
import { QuantileMappingFields } from './QuantileMappingFields';
import {
    getDefaultQuantileMappingFields,
    getDefaultOutbreakIndicator,
} from './quantileMappingFormDefaults';
import {
    importLocationStateSchema,
    quantileMappingSchema,
    type MappingField,
    type QuantileMappingFormValues,
} from './quantileMappingFormSchema';
import type { LoadedQuantileMappingFormProps } from './quantileMappingFormTypes';
import styles from './QuantileMappingForm.module.css';

export const QuantileMappingFormContent = ({
    prediction,
    model,
    predictionSetupId,
    predictionSetup,
    series,
    canDeleteDataValues,
    isDeleteAuthorityLoading,
}: LoadedQuantileMappingFormProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: locationState } = importLocationStateSchema.safeParse(location.state);
    const [isAlertsDialogOpen, setIsAlertsDialogOpen] = useState(false);
    const [isImportConfirmationOpen, setIsImportConfirmationOpen] = useState(false);
    const [clearPreviousValuesPreference, setClearPreviousValuesPreference] = useState(true);
    const defaultQuantileMappingFields = useMemo(
        () => getDefaultQuantileMappingFields(predictionSetup),
        [predictionSetup],
    );
    const defaultOutbreakIndicator = useMemo(
        () => getDefaultOutbreakIndicator(predictionSetup),
        [predictionSetup],
    );
    const defaultUseAlertOutputs = locationState?.useAlertOutputs ?? true;
    const defaultAlertProbability = locationState?.alertProbability ?? DEFAULT_OUTBREAK_PROBABILITY;
    const [thresholdParams, setThresholdParams] = useState<ThresholdParams>(
        locationState?.thresholdParams ?? getDefaultThresholdParams(DEFAULT_THRESHOLD_STRATEGY),
    );
    const initialThresholdParamsRef = useRef(thresholdParams);
    const isThresholdParamsDirty = !areThresholdParamsEqual(
        thresholdParams,
        initialThresholdParamsRef.current,
    );
    const { thresholdStrategies } = useThresholdStrategies();
    const thresholdStrategyName = thresholdStrategies?.find(
        strategy => strategy.id === thresholdParams.type,
    )?.displayName;
    const formValues = useMemo<QuantileMappingFormValues>(() => ({
        ...defaultQuantileMappingFields,
        use_alert_outputs: defaultUseAlertOutputs,
        alert_probability: defaultAlertProbability,
        outbreak_indicator: defaultOutbreakIndicator,
        endemic_threshold: '',
    }), [defaultAlertProbability, defaultOutbreakIndicator, defaultQuantileMappingFields, defaultUseAlertOutputs]);
    const {
        handleSubmit,
        formState: { errors, isDirty },
        setValue,
        clearErrors,
        control,
    } = useForm<QuantileMappingFormValues>({
        resolver: zodResolver(quantileMappingSchema),
        defaultValues: formValues,
        values: formValues,
        resetOptions: {
            keepDirtyValues: true,
        },
    });
    const {
        mutateAsync,
        isPending,
        reset: resetImport,
        progress: importProgress,
    } = usePostPredictionData({
        onSuccess: () => {
            navigate(`/predictions/${predictionSetupId}`);
        },
    });
    const canClearPreviousValues = canDeleteDataValues === true;
    const clearPreviousValues = canClearPreviousValues && clearPreviousValuesPreference;
    const importButtonLabel = clearPreviousValues
        ? i18n.t('Clear and import')
        : i18n.t('Import');
    const returnTo = `/predictions/${predictionSetupId}`;

    const {
        showConfirmModal,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useNavigationBlocker({
        shouldBlock: !isPending && (isDirty || isThresholdParamsDirty),
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
        endemic_threshold,
    } = useWatch({ control });
    const useAlertOutputs = use_alert_outputs ?? defaultUseAlertOutputs;
    const selectedProbability = alert_probability ?? defaultAlertProbability;
    const {
        thresholdMap,
        isLoading: isThresholdsLoading,
        error: thresholdsError,
        refetch: refetchThresholds,
    } = useEndemicThresholds({
        datasetId: prediction.datasetId,
        series,
        params: thresholdParams,
        enabled: useAlertOutputs,
    });
    const unavailableThresholdCount = useMemo(() => (
        series.filter((orgUnitSeries) => {
            const thresholds = thresholdMap?.get(orgUnitSeries.orgUnitId);
            return !thresholds?.some(threshold => threshold.value !== null);
        }).length
    ), [series, thresholdMap]);
    const quantileValues = {
        quantile_low,
        quantile_high,
        median,
        quantile_mid_low,
        quantile_mid_high,
    };

    const updateQuantile = (quantile: MappingField, id: string | null) => {
        if (id) {
            clearErrors(quantile);
        }
        setValue(quantile, id ?? '', { shouldDirty: true });
    };

    const toggleAlertOutputs = () => {
        setValue('use_alert_outputs', !useAlertOutputs, { shouldDirty: true });
        clearErrors('outbreak_indicator');
    };

    const handleApplyAlertSettings = (probability: OutbreakProbability, params: ThresholdParams) => {
        setValue('alert_probability', probability, { shouldDirty: true });
        setThresholdParams(params);
    };

    const handleSubmitImport = () => {
        setIsImportConfirmationOpen(true);
    };

    const handleConfirmImport = async (data: QuantileMappingFormValues) => {
        try {
            await mutateAsync({
                prediction,
                fallbackOrgUnitIds: predictionSetup.orgUnits ?? [],
                clearPreviousValues,
                quantileMapping: {
                    quantileLowId: data.quantile_low,
                    quantileHighId: data.quantile_high,
                    quantileMedianId: data.median,
                    quantileMidLowId: data.quantile_mid_low,
                    quantileMidHighId: data.quantile_mid_high,
                    outbreakIndicatorId: data.use_alert_outputs
                        ? data.outbreak_indicator
                        : '',
                    endemicThresholdId: data.use_alert_outputs
                        ? data.endemic_threshold
                        : '',
                },
                outbreakIndicators: data.use_alert_outputs
                    ? buildOutbreakIndicators(series, data.alert_probability, thresholdMap)
                    : [],
                thresholdMap,
            });
        } catch {
            // Alerts are handled by the mutation hook; keep the modal open so the user can retry or cancel.
        }
    };

    const handleCancelImport = () => {
        if (!isPending) {
            setIsImportConfirmationOpen(false);
            resetImport();
        }
    };

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

            <form onSubmit={handleSubmit(handleSubmitImport)}>
                <div className={styles.dataItemSelects}>
                    <QuantileMappingFields
                        values={quantileValues}
                        errors={errors}
                        onChange={updateQuantile}
                    />

                    <AlertOutputSection
                        useAlertOutputs={useAlertOutputs}
                        selectedProbability={selectedProbability}
                        thresholdStrategyName={thresholdStrategyName}
                        thresholdParamsSummary={describeThresholdParams(thresholdParams)}
                        unavailableThresholdCount={unavailableThresholdCount}
                        isThresholdsLoading={isThresholdsLoading}
                        thresholdsError={!!thresholdsError}
                        outbreakIndicator={outbreak_indicator}
                        outbreakIndicatorError={errors.outbreak_indicator?.message}
                        endemicThreshold={endemic_threshold}
                        onToggleAlertOutputs={toggleAlertOutputs}
                        onAdjustAlertProbability={() => setIsAlertsDialogOpen(true)}
                        onChangeOutbreakIndicator={id => updateQuantile('outbreak_indicator', id)}
                        onChangeEndemicThreshold={id => updateQuantile('endemic_threshold', id)}
                        onRetryThresholds={refetchThresholds}
                    />

                    <ClearPreviousValuesControl
                        checked={clearPreviousValues}
                        canClearPreviousValues={canClearPreviousValues}
                        isDeleteAuthorityLoading={isDeleteAuthorityLoading}
                        onChange={() => setClearPreviousValuesPreference(prev => !prev)}
                    />

                    <ButtonStrip end className={styles.buttonStrip}>
                        <Button
                            type="button"
                            onClick={() => navigate(returnTo)}
                        >
                            {i18n.t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || (useAlertOutputs && (isThresholdsLoading || !!thresholdsError))}
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

            {isImportConfirmationOpen && (
                <ImportConfirmationModal
                    clearPreviousValues={clearPreviousValues}
                    isPending={isPending}
                    progress={importProgress}
                    onCancel={handleCancelImport}
                    onConfirm={handleSubmit(handleConfirmImport)}
                />
            )}

            {isAlertsDialogOpen && (
                <PredictionAlertsDialog
                    prediction={prediction}
                    model={model}
                    thresholdParams={thresholdParams}
                    selectedProbability={selectedProbability}
                    onApply={handleApplyAlertSettings}
                    onClose={() => setIsAlertsDialogOpen(false)}
                />
            )}
        </>
    );
};
