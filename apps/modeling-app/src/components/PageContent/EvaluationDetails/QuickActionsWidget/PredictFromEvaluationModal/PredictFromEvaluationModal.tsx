import { useCallback } from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    CircularLoader,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import styles from './PredictFromEvaluationModal.module.css';
import { useBacktestById } from '../../../../../hooks/useBacktestById';

interface PredictFromEvaluationModalProps {
    id: number;
    onClose: () => void;
    returnTo?: string;
}

export const PredictFromEvaluationModal = ({ id, onClose, returnTo }: PredictFromEvaluationModalProps) => {
    const { backtest, isLoading, error } = useBacktestById(id);
    const navigate = useNavigate();

    const generatePredictionState = useCallback((): Record<string, unknown> => {
        if (!backtest) return {};

        const state: Record<string, unknown> = {};
        const { dataset } = backtest;

        if (backtest.configuredModel?.id) {
            state.modelId = String(backtest.configuredModel.id);

            if (dataset?.dataSources?.length) {
                state.dataSources = dataset.dataSources.map(dataSource => ({
                    covariate: dataSource.covariate,
                    dataElementId: dataSource.dataElementId,
                }));
            }
        }

        if (backtest.orgUnits?.length) {
            state.orgUnits = backtest.orgUnits;
        }

        if (dataset?.periodType) {
            state.periodType = dataset.periodType.toUpperCase();

            if (dataset?.firstPeriod) {
                state.fromDate = dataset.firstPeriod;
            }

            if (dataset?.lastPeriod) {
                state.toDate = dataset.lastPeriod;
            }
        }

        return state;
    }, [backtest]);

    const handleConfirm = () => {
        const url = returnTo
            ? `/predictions/new?returnTo=${encodeURIComponent(returnTo)}`
            : '/predictions/new';
        navigate(url, { state: generatePredictionState() });
    };

    if (isLoading) {
        return (
            <Modal onClose={onClose} dataTest="predict-from-evaluation-modal">
                <ModalTitle>{i18n.t('Create prediction')}</ModalTitle>
                <ModalContent>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <CircularLoader />
                    </div>
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button onClick={onClose} secondary>
                            {i18n.t('Cancel')}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </Modal>
        );
    }

    if (error || !backtest) {
        return (
            <Modal onClose={onClose} dataTest="predict-from-evaluation-modal">
                <ModalTitle>{i18n.t('Create prediction')}</ModalTitle>
                <ModalContent>
                    <p>{i18n.t('Failed to load evaluation data. Please try again.')}</p>
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button onClick={onClose} secondary>
                            {i18n.t('Close')}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </Modal>
        );
    }

    return (
        <Modal onClose={onClose} dataTest="predict-from-evaluation-modal">
            <ModalTitle>{i18n.t('Create prediction')}</ModalTitle>
            <ModalContent>
                <p className={styles.description}>
                    {i18n.t('You should only do predictions on well-tested and reliable models that have shown promise when evaluated. Do you still want to continue?')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose} secondary>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        dataTest="confirm-predict-button"
                        onClick={handleConfirm}
                    >
                        {i18n.t('Continue')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
