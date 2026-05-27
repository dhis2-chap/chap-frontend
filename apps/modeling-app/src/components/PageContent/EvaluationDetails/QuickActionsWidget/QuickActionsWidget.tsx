import { useState } from 'react';
import { Button, IconCheckmarkCircle16, IconVisualizationLineMulti16, IconDuplicate16, IconExportItems24 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import { Widget } from '@dhis2-chap/ui';
import { CopyBacktestModal } from '../../../BacktestsTable/BacktestActionsMenu/CopyBacktestModal';
import {
    MarkReadyForForecastingModal,
    type MarkReadyForForecastingFormValues,
} from '../../../PredictionSetup/MarkReadyForForecastingModal';
import { buildQuantileTargetsFromForm } from '@/utils/predictionSetupImportMapping';
import { useCreatePredictionSetup } from './hooks/useCreatePredictionSetup';
import styles from './QuickActionsWidget.module.css';

type Props = {
    evaluationId: number;
    predictionSetupId?: number;
};

export const QuickActionsWidget = ({
    evaluationId,
    predictionSetupId,
}: Props) => {
    const navigate = useNavigate();
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
