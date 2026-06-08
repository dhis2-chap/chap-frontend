import { useMemo, useState } from 'react';
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
import { useNavigationBlocker } from '@/hooks/useNavigationBlocker';
import { PredictionAlertsDialog } from '../../PredictionAlerts';
import { usePostPredictionData } from '../hooks/usePostPredictionData';
import { AlertOutputSection } from './AlertOutputSection';
import { ClearPreviousValuesControl } from './ClearPreviousValuesControl';
import { ImportConfirmationModal } from './ImportConfirmationModal';
import { QuantileMappingFields } from './QuantileMappingFields';
import { getDefaultQuantileMappingFields } from './quantileMappingFormDefaults';
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
    thresholdMap,
    unavailableThresholdCount,
    canDeleteDataValues,
    isDeleteAuthorityLoading,
}: LoadedQuantileMappingFormProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: locationState } = importLocationStateSchema.safeParse(location.state);
    const [isAlertsDialogOpen, setIsAlertsDialogOpen] = useState(false);
    const [clearPreviousValuesPreference, setClearPreviousValuesPreference] = useState(true);
    const [pendingImportData, setPendingImportData] = useState<QuantileMappingFormValues | null>(null);
    const defaultQuantileMappingFields = useMemo(
        () => getDefaultQuantileMappingFields(predictionSetup),
        [predictionSetup],
    );
    const defaultUseAlertOutputs = locationState?.useAlertOutputs ?? true;
    const defaultAlertProbability = locationState?.alertProbability ?? DEFAULT_OUTBREAK_PROBABILITY;
    const formValues = useMemo<QuantileMappingFormValues>(() => ({
        ...defaultQuantileMappingFields,
        use_alert_outputs: defaultUseAlertOutputs,
        alert_probability: defaultAlertProbability,
        outbreak_indicator: '',
    }), [defaultAlertProbability, defaultQuantileMappingFields, defaultUseAlertOutputs]);
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
    const { mutateAsync, isPending } = usePostPredictionData({
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
    const useAlertOutputs = use_alert_outputs ?? defaultUseAlertOutputs;
    const selectedProbability = alert_probability ?? defaultAlertProbability;
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

    const handleApplyAlertProbability = (probability: OutbreakProbability) => {
        setValue('alert_probability', probability, { shouldDirty: true });
    };

    const handleSubmitImport = (data: QuantileMappingFormValues) => {
        setPendingImportData(data);
    };

    const handleConfirmImport = async () => {
        if (!pendingImportData) {
            return;
        }

        try {
            await mutateAsync({
                prediction,
                fallbackOrgUnitIds: predictionSetup.orgUnits ?? [],
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
                        unavailableThresholdCount={unavailableThresholdCount}
                        outbreakIndicator={outbreak_indicator}
                        outbreakIndicatorError={errors.outbreak_indicator?.message}
                        onToggleAlertOutputs={toggleAlertOutputs}
                        onAdjustAlertProbability={() => setIsAlertsDialogOpen(true)}
                        onChangeOutbreakIndicator={id => updateQuantile('outbreak_indicator', id)}
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
                <ImportConfirmationModal
                    clearPreviousValues={clearPreviousValues}
                    isPending={isPending}
                    onCancel={handleCancelImport}
                    onConfirm={handleConfirmImport}
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
