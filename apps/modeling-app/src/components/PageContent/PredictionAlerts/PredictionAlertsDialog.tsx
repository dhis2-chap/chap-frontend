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
import { PredictionAlertsConfigurator } from './PredictionAlertsConfigurator';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    selectedProbability: OutbreakProbability;
    onApply: (probability: OutbreakProbability) => void;
    onClose: () => void;
};

export const PredictionAlertsDialog = ({
    prediction,
    model,
    selectedProbability,
    onApply,
    onClose,
}: Props) => {
    const [draftProbability, setDraftProbability] = useState(selectedProbability);

    const handleApply = () => {
        onApply(draftProbability);
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
                <PredictionAlertsConfigurator
                    prediction={prediction}
                    model={model}
                    selectedProbability={draftProbability}
                    onSelectProbability={setDraftProbability}
                    density="dialog"
                />
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={handleApply}
                    >
                        {i18n.t('Apply')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
