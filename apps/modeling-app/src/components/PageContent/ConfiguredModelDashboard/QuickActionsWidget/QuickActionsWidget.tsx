import {
    Button,
    IconExportItems24,
    IconSettings24,
    IconView24,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useState } from 'react';
import { Widget } from '@dhis2-chap/ui';
import type { PredictionSetupReadWithPredictions, QuantileTarget } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import { MarkReadyForForecastingModal } from '../../EvaluationDetails/QuickActionsWidget/MarkReadyForForecastingModal';
import type { MarkReadyForForecastingFormValues } from '../../EvaluationDetails/QuickActionsWidget/MarkReadyForForecastingModal';
import { getPredictionSetupQuantileTargets } from '@/utils/predictionSetupImportMapping';
import { useUpdatePredictionSetup } from './hooks/useUpdatePredictionSetup';
import styles from './QuickActionsWidget.module.css';

type Props = {
    configuredId?: string;
    predictionSetup?: PredictionSetupReadWithPredictions;
    isLoading: boolean;
    latestPredictionId?: number;
};

const quantileKeys = [
    'quantile_high',
    'quantile_mid_high',
    'median',
    'quantile_mid_low',
    'quantile_low',
] as const;

const getDataElementId = (
    quantileTargets: QuantileTarget[],
    quantileKey: typeof quantileKeys[number],
) => (
    quantileTargets.find(target => target.quantile === quantileKey)?.dataElementId ?? ''
);

const buildEditSetupFormValues = (
    predictionSetup: PredictionSetupReadWithPredictions,
): MarkReadyForForecastingFormValues => {
    const quantileTargets = getPredictionSetupQuantileTargets(predictionSetup);

    return {
        name: predictionSetup.name,
        use_import_mapping: quantileTargets.length > 0,
        quantile_high: getDataElementId(quantileTargets, 'quantile_high'),
        quantile_mid_high: getDataElementId(quantileTargets, 'quantile_mid_high'),
        median: getDataElementId(quantileTargets, 'median'),
        quantile_mid_low: getDataElementId(quantileTargets, 'quantile_mid_low'),
        quantile_low: getDataElementId(quantileTargets, 'quantile_low'),
    };
};

const buildQuantileTargets = (
    values: MarkReadyForForecastingFormValues,
): QuantileTarget[] => {
    if (!values.use_import_mapping) {
        return [];
    }

    return quantileKeys.map(quantile => ({
        quantile,
        dataElementId: values[quantile],
    }));
};

export const QuickActionsWidget = ({
    configuredId,
    predictionSetup,
    isLoading,
    latestPredictionId,
}: Props) => {
    const navigate = useNavigate();
    const [configurationModalIsOpen, setConfigurationModalIsOpen] = useState(false);
    const { updatePredictionSetup, isUpdating } = useUpdatePredictionSetup();
    const canPredict = !!configuredId && !!predictionSetup?.configuredModel?.id;

    const handlePredict = () => {
        if (!predictionSetup) {
            return;
        }

        const returnTo = `/predictions/${configuredId}`;
        navigate(
            `/predictions/${configuredId}/new?returnTo=${encodeURIComponent(returnTo)}`,
        );
    };

    const handleShowLastRun = () => {
        if (!configuredId || !latestPredictionId) {
            return;
        }

        navigate(`/predictions/${configuredId}/runs/${latestPredictionId}`);
    };

    const handleEditSetup = () => {
        setConfigurationModalIsOpen(true);
    };

    const handleEditSetupSubmit = async (values: MarkReadyForForecastingFormValues) => {
        if (!predictionSetup) {
            return;
        }

        const quantileTargets = buildQuantileTargets(values);

        await updatePredictionSetup({
            predictionSetupId: predictionSetup.id,
            data: {
                name: values.name,
                quantileTargets,
            },
        });
        setConfigurationModalIsOpen(false);
    };

    return (
        <>
            <Widget
                header={i18n.t('Quick actions')}
                noncollapsible
            >
                <div className={styles.content}>
                    <div className={styles.actionList}>
                        <Button
                            dataTest="quick-action-predict"
                            icon={<span className={styles.actionIcon}><IconExportItems24 /></span>}
                            onClick={handlePredict}
                            loading={isLoading}
                            disabled={!canPredict}
                            className={styles.actionButton}
                            primary
                        >
                            {i18n.t('Run prediction')}
                        </Button>
                        <Button
                            dataTest="quick-action-show-last-run"
                            icon={<span className={styles.actionIcon}><IconView24 /></span>}
                            onClick={handleShowLastRun}
                            disabled={!latestPredictionId}
                            className={styles.actionButton}
                        >
                            {i18n.t('Go to last run')}
                        </Button>
                        <Button
                            dataTest="quick-action-configuration"
                            icon={<span className={styles.actionIcon}><IconSettings24 /></span>}
                            onClick={handleEditSetup}
                            disabled={!predictionSetup}
                            className={styles.actionButton}
                        >
                            {i18n.t('Edit setup')}
                        </Button>
                    </div>
                </div>
            </Widget>

            {configurationModalIsOpen && predictionSetup && (
                <MarkReadyForForecastingModal
                    onClose={() => setConfigurationModalIsOpen(false)}
                    onSubmit={handleEditSetupSubmit}
                    defaultValues={buildEditSetupFormValues(predictionSetup)}
                    title={i18n.t('Edit prediction setup')}
                    isSubmitting={isUpdating}
                />
            )}
        </>
    );
};
