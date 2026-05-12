import { useState } from 'react';
import { Button, IconCheckmarkCircle16, IconVisualizationLineMulti16, IconDuplicate16, IconExportItems24 } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import { Widget } from '@dhis2-chap/ui';
import type { DataImportMapping } from '@dhis2-chap/ui';
import { CopyBacktestModal } from '../../../BacktestsTable/BacktestActionsMenu/CopyBacktestModal';
import { MarkReadyForForecastingModal } from './MarkReadyForForecastingModal';
import type { MarkReadyForForecastingFormValues } from './MarkReadyForForecastingModal';
import { useCreatePredictionSetup } from './hooks/useCreatePredictionSetup';
import { buildPredictionSetupMetaData } from '@/utils/predictionSetupImportMapping';
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
        const dataImportMappings: DataImportMapping[] = [];
        const scheduleExpression = values.schedule_expression.trim();

        if (values.use_import_mapping) {
            dataImportMappings.push(
                { quantileKey: 'quantile_high', dataElementId: values.quantile_high },
                { quantileKey: 'quantile_mid_high', dataElementId: values.quantile_mid_high },
                { quantileKey: 'median', dataElementId: values.median },
                { quantileKey: 'quantile_mid_low', dataElementId: values.quantile_mid_low },
                { quantileKey: 'quantile_low', dataElementId: values.quantile_low },
            );
        }

        await createPredictionSetup({
            data: {
                backtestId: evaluationId,
                name: values.name,
                schedule: values.set_schedule
                    ? {
                            enabled: true,
                            expression: scheduleExpression,
                        }
                    : undefined,
                metaData: buildPredictionSetupMetaData(dataImportMappings),
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
