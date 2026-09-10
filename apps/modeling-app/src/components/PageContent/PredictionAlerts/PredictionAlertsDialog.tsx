import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import type { ModelSpecRead, OutbreakProbability, PredictionInfo } from '@dhis2-chap/ui';
import { ThresholdStrategyControl } from '@/components/ThresholdTilesExplorer';
import type { ThresholdParams } from '@/utils/thresholdStrategyParams';
import { AlertPreviewPanel } from './AlertPreviewPanel';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    thresholdParams: ThresholdParams;
    selectedProbability: OutbreakProbability;
    onApply: (probability: OutbreakProbability, thresholdParams: ThresholdParams) => void;
    onClose: () => void;
};

export const PredictionAlertsDialog = ({
    prediction,
    model,
    thresholdParams,
    selectedProbability,
    onApply,
    onClose,
}: Props) => {
    const [draftProbability, setDraftProbability] = useState(selectedProbability);
    const [draftParams, setDraftParams] = useState(thresholdParams);
    const [hasUnappliedParams, setHasUnappliedParams] = useState(false);

    const handleApply = () => {
        onApply(draftProbability, draftParams);
        onClose();
    };

    return (
        <Modal
            fluid
            className={styles.alertDialog}
            onClose={onClose}
            dataTest="prediction-alerts-dialog"
        >
            <ModalTitle>{i18n.t('Adjust alert output')}</ModalTitle>
            <ModalContent className={styles.dialogContent}>
                <div className={styles.dialogStrategyControl}>
                    <ThresholdStrategyControl
                        value={draftParams}
                        onApply={setDraftParams}
                        onDirtyChange={setHasUnappliedParams}
                    />
                </div>
                <AlertPreviewPanel
                    prediction={prediction}
                    model={model}
                    thresholdParams={draftParams}
                    selectedProbability={draftProbability}
                    onSelectProbability={setDraftProbability}
                />
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        // Never silently commit stale params: the parameter
                        // form has its own Apply that must be used first.
                        disabled={hasUnappliedParams}
                        onClick={handleApply}
                    >
                        {i18n.t('Apply')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
