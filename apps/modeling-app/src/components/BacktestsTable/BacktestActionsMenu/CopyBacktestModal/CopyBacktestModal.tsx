import { useState } from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    Checkbox,
    CircularLoader,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import styles from './CopyBacktestModal.module.css';
import { useBacktestById } from '../../../../hooks/useBacktestById';

interface CopyBacktestModalProps {
    id: number;
    onClose: () => void;
    returnTo?: string;
}

type CopyableAttributeKey =
    | 'name'
    | 'model'
    | 'dataset';

type CopyableAttributes = Record<CopyableAttributeKey, boolean>;

const DEFAULT_COPYABLE_ATTRIBUTES: CopyableAttributes = {
    name: true,
    model: true,
    dataset: true,
};

export const CopyBacktestModal = ({ id, onClose, returnTo }: CopyBacktestModalProps) => {
    const [selectedAttributes, setSelectedAttributes] = useState<CopyableAttributes>(DEFAULT_COPYABLE_ATTRIBUTES);
    const { backtest, isLoading, error } = useBacktestById(id);
    const navigate = useNavigate();

    const handleAttributeChange = (attribute: keyof CopyableAttributes) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attribute]: !prev[attribute],
        }));
    };

    const hasSelectedAttributes = Object.values(selectedAttributes).some(Boolean);

    if (isLoading) {
        return (
            <Modal onClose={onClose} dataTest="copy-backtest-modal">
                <ModalTitle>{i18n.t('Create new based on...')}</ModalTitle>
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
            <Modal onClose={onClose} dataTest="copy-backtest-modal">
                <ModalTitle>{i18n.t('Create new based on...')}</ModalTitle>
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
        <Modal onClose={onClose} dataTest="copy-backtest-modal">
            <ModalTitle>{i18n.t('Create new based on...')}</ModalTitle>
            <ModalContent>
                <p className={styles.description}>
                    {i18n.t('Select which attributes to copy to the new run{{escape}}', { escape: ':' })}
                </p>

                <div className={styles.attributesList}>
                    <Checkbox
                        label={i18n.t('Name')}
                        name="name"
                        checked={selectedAttributes.name}
                        onChange={() => handleAttributeChange('name')}
                        value={backtest.name || i18n.t('Untitled')}
                    />

                    <Checkbox
                        label={i18n.t('Dataset')}
                        name="dataset"
                        checked={selectedAttributes.dataset}
                        onChange={() => handleAttributeChange('dataset')}
                    />

                    <Checkbox
                        label={i18n.t('Model')}
                        name="model"
                        checked={selectedAttributes.model}
                        onChange={() => handleAttributeChange('model')}
                        value={backtest.modelId}
                    />
                </div>
                <p className={styles.datasetDescription}>
                    {i18n.t('The dataset includes the organisation units, periods and data sources. Create a new dataset to change them.')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose} secondary>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        disabled={!hasSelectedAttributes}
                        dataTest="copy-backtest-button"
                        onClick={() => {
                            const params = new URLSearchParams();
                            if (selectedAttributes.dataset) params.set('datasetId', String(backtest.datasetId));
                            if (returnTo) params.set('returnTo', returnTo);
                            navigate(`/evaluate/from-dataset?${params}`, {
                                state: {
                                    name: selectedAttributes.name && backtest.name
                                        ? i18n.t('{{name}} (Copy)', { name: backtest.name, interpolation: { escapeValue: false } })
                                        : '',
                                    modelNames: selectedAttributes.model ? [backtest.modelId] : [],
                                },
                            });
                        }}
                    >
                        {i18n.t('Create')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
