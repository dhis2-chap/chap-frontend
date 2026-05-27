import {
    Button,
    IconExportItems24,
    IconSettings24,
    IconView24,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useState } from 'react';
import { Widget } from '@dhis2-chap/ui';
import type { PredictionSetupReadWithPredictions } from '@dhis2-chap/ui';
import { useNavigate } from 'react-router-dom';
import {
    MarkReadyForForecastingModal,
    type MarkReadyForForecastingFormValues,
} from '../../../PredictionSetup/MarkReadyForForecastingModal';
import {
    buildQuantileTargetsFromForm,
    formValuesFromQuantileTargets,
    getPredictionSetupQuantileTargets,
} from '@/utils/predictionSetupImportMapping';
import { useUpdatePredictionSetup } from './hooks/useUpdatePredictionSetup';
import styles from './QuickActionsWidget.module.css';

type Props = {
    predictionSetupId?: string;
    predictionSetup?: PredictionSetupReadWithPredictions;
    isLoading: boolean;
    latestPredictionId?: number;
};

export const QuickActionsWidget = ({
    predictionSetupId,
    predictionSetup,
    isLoading,
    latestPredictionId,
}: Props) => {
    const navigate = useNavigate();
    const [configurationModalIsOpen, setConfigurationModalIsOpen] = useState(false);
    const { updatePredictionSetup, isUpdating } = useUpdatePredictionSetup();
    const canPredict = !!predictionSetupId && !!predictionSetup?.configuredModel?.id;

    const handlePredict = () => {
        if (!predictionSetup) {
            return;
        }

        const returnTo = `/predictions/${predictionSetupId}`;
        navigate(
            `/predictions/${predictionSetupId}/new?returnTo=${encodeURIComponent(returnTo)}`,
        );
    };

    const handleShowLastRun = () => {
        if (!predictionSetupId || !latestPredictionId) {
            return;
        }

        navigate(`/predictions/${predictionSetupId}/runs/${latestPredictionId}`);
    };

    const handleEditSetup = () => {
        setConfigurationModalIsOpen(true);
    };

    const handleEditSetupSubmit = async (values: MarkReadyForForecastingFormValues) => {
        if (!predictionSetup) {
            return;
        }

        await updatePredictionSetup({
            predictionSetupId: predictionSetup.id,
            data: {
                name: values.name,
                quantileTargets: buildQuantileTargetsFromForm(values),
            },
        });
        setConfigurationModalIsOpen(false);
    };

    const editSetupDefaultValues = predictionSetup
        ? formValuesFromQuantileTargets(
                predictionSetup.name,
                getPredictionSetupQuantileTargets(predictionSetup),
            )
        : undefined;

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
                    defaultValues={editSetupDefaultValues}
                    title={i18n.t('Edit prediction setup')}
                    isSubmitting={isUpdating}
                />
            )}
        </>
    );
};
