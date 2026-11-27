import { useState } from 'react';
import { Button, IconArrowRight16, IconCheckmarkCircle16, IconVisualizationLineMulti16, IconDuplicate16, IconExportItems24 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import { Widget } from '@dhis2-chap/ui';
import { CopyBacktestModal } from '../../../BacktestsTable/BacktestActionsMenu/CopyBacktestModal';
import {
    MarkReadyForForecastingModal,
    type MarkReadyForForecastingFormValues,
} from '../../../PredictionSetup/MarkReadyForForecastingModal';
import { buildQuantileTargetsFromForm } from '@/utils/predictionSetupImportMapping';
import { Features, useIsFeatureAvailable } from '../../../../hooks/useIsFeatureAvailable';
import { useCreatePredictionSetup } from './hooks/useCreatePredictionSetup';
import styles from './QuickActionsWidget.module.css';

type Props = {
    evaluationId: number;
    datasetId: number;
    predictionSetupId?: number;
};

export const QuickActionsWidget = ({
    evaluationId,
    datasetId,
    predictionSetupId,
}: Props) => {
    const navigate = useNavigate();
    // The guided setup needs the evaluations of Chap Core 2.4.0+.
    const { isAvailable: isGuidedSetupAvailable } = useIsFeatureAvailable(Features.BENCHMARKS);
    const [markReadyModalIsOpen, setMarkReadyModalIsOpen] = useState(false);
    const [copyModalIsOpen, setCopyModalIsOpen] = useState(false);
    const {
        createPredictionSetup,
        isCreating,
    } = useCreatePredictionSetup({
        onSuccess: (predictionSetup) => {
            navigate(`/predictions/${predictionSetup.id}`);
        },
    });

    const handleCompareWith = () => {
        navigate(`/evaluate/compare?baseEvaluation=${evaluationId}&returnTo=${encodeURIComponent(`/evaluate/${evaluationId}`)}`);
    };

    const handleCreateNew = () => {
        setCopyModalIsOpen(true);
    };

    const handleContinueInGuidedSetup = () => {
        navigate(predictionSetupId
            ? `/guided/predict?datasetId=${datasetId}`
            : `/guided/model?datasetId=${datasetId}&evaluationId=${evaluationId}`);
    };

    const handlePredict = () => {
        if (!predictionSetupId) {
            return;
        }

        navigate(`/predictions/${predictionSetupId}`);
    };

    const handleMarkReady = () => {
        setMarkReadyModalIsOpen(true);
    };

    const handleMarkReadySubmit = async (values: MarkReadyForForecastingFormValues) => {
        await createPredictionSetup({
            data: {
                backtestId: evaluationId,
                name: values.name,
                quantileTargets: buildQuantileTargetsFromForm(values),
                alertPolicyId: values.alert_policy_id ? Number(values.alert_policy_id) : null,
            },
        });
        setMarkReadyModalIsOpen(false);
    };

    return (
        <>
            <Widget
                header={i18n.t('Quick actions')}
                noncollapsible
            >
                <div className={styles.content}>
                    <div className={styles.actionList}>
                        {predictionSetupId ? (
                            <Button
                                onClick={handlePredict}
                                dataTest="quick-action-predict"
                                icon={<IconExportItems24 />}
                                className={styles.actionButton}
                                primary
                            >
                                {i18n.t('Predict')}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleMarkReady}
                                dataTest="quick-action-mark-ready-for-forecasting"
                                icon={<IconCheckmarkCircle16 />}
                                className={styles.actionButton}
                                primary
                            >
                                {i18n.t('Create prediction setup')}
                            </Button>
                        )}
                        <Button
                            onClick={handleCompareWith}
                            dataTest="quick-action-compare"
                            icon={<IconVisualizationLineMulti16 />}
                            className={styles.actionButton}
                        >
                            {i18n.t('Compare with...')}
                        </Button>
                        <Button
                            onClick={handleCreateNew}
                            dataTest="quick-action-create-new"
                            icon={<IconDuplicate16 />}
                            className={styles.actionButton}
                        >
                            {i18n.t('Create new based on...')}
                        </Button>
                        {isGuidedSetupAvailable && (
                            <Button
                                onClick={handleContinueInGuidedSetup}
                                dataTest="quick-action-guided-setup"
                                icon={<IconArrowRight16 />}
                                className={styles.actionButton}
                            >
                                {i18n.t('Continue in guided setup')}
                            </Button>
                        )}
                    </div>
                </div>
            </Widget>

            {markReadyModalIsOpen && (
                <MarkReadyForForecastingModal
                    onClose={() => setMarkReadyModalIsOpen(false)}
                    onSubmit={handleMarkReadySubmit}
                    isSubmitting={isCreating}
                />
            )}

            {copyModalIsOpen && (
                <CopyBacktestModal
                    id={evaluationId}
                    onClose={() => setCopyModalIsOpen(false)}
                    returnTo={`/evaluate/${evaluationId}`}
                />
            )}
        </>
    );
};
