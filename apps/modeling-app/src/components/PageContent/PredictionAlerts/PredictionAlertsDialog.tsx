import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui';
import type { ModelSpecRead, OutbreakProbability, PredictionInfo } from '@dhis2-chap/ui';
import { useThresholdStrategies } from '@/hooks/useThresholdStrategies';
import { AlertPreviewPanel } from './AlertPreviewPanel';
import styles from './PredictionAlerts.module.css';

type Props = {
    prediction: PredictionInfo;
    model: ModelSpecRead;
    thresholdStrategy: string;
    selectedProbability: OutbreakProbability;
    onApply: (probability: OutbreakProbability, thresholdStrategy: string) => void;
    onClose: () => void;
};

export const PredictionAlertsDialog = ({
    prediction,
    model,
    thresholdStrategy,
    selectedProbability,
    onApply,
    onClose,
}: Props) => {
    const [draftProbability, setDraftProbability] = useState(selectedProbability);
    const [draftStrategy, setDraftStrategy] = useState(thresholdStrategy);
    const {
        thresholdStrategies,
        isLoading: isThresholdStrategiesLoading,
    } = useThresholdStrategies();
    const selectedThresholdStrategy = thresholdStrategies?.find(
        strategy => strategy.id === draftStrategy,
    );

    const handleApply = () => {
        onApply(draftProbability, draftStrategy);
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
                    <SingleSelectField
                        dense
                        loading={isThresholdStrategiesLoading}
                        label={i18n.t('Threshold strategy')}
                        helpText={selectedThresholdStrategy?.description}
                        selected={draftStrategy}
                        onChange={({ selected }) => setDraftStrategy(selected)}
                    >
                        {thresholdStrategies?.map(strategy => (
                            <SingleSelectOption
                                key={strategy.id}
                                value={strategy.id}
                                label={strategy.displayName}
                            />
                        ))}
                    </SingleSelectField>
                </div>
                <AlertPreviewPanel
                    prediction={prediction}
                    model={model}
                    thresholdStrategy={draftStrategy}
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
                        onClick={handleApply}
                    >
                        {i18n.t('Apply')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
