import React, { useState } from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
    NoticeBox,
    Input,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { DataElement } from '../DataElementSelector';
import styles from './ConfirmPruningModal.module.css';

interface ConfirmPruningModalProps {
    dataElements: DataElement[];
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
}

export const ConfirmPruningModal = ({
    dataElements,
    onClose,
    onConfirm,
    isPending,
}: ConfirmPruningModalProps) => {
    const [confirmationText, setConfirmationText] = useState('');

    const isConfirmEnabled = confirmationText.toLowerCase() === 'delete';

    const handleConfirmationChange = (payload: { value?: string }) => {
        setConfirmationText(payload.value ?? '');
    };

    return (
        <Modal
            onClose={onClose}
            large
            dataTest="confirm-pruning-modal"
        >
            <ModalTitle>
                {i18n.t('Confirm')}
            </ModalTitle>
            <ModalContent>
                <NoticeBox
                    title={i18n.t('This action cannot be undone')}
                    error
                >
                    {i18n.t('You are about to permanently delete ALL data values for the selected data elements across all organisation units and time periods. This action is irreversible.')}
                </NoticeBox>

                <div className={styles.dataElementsSection}>
                    <h4 className={styles.sectionTitle}>
                        {i18n.t('Data elements to be pruned{{colon}}', { colon: ':' })}
                    </h4>
                    <ul className={styles.dataElementsList}>
                        {dataElements.map(dataElement => (
                            <li key={dataElement.id} className={styles.dataElementItem}>
                                {dataElement.displayName}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.confirmationSection}>
                    <p className={styles.confirmationPrompt}>
                        {i18n.t('To confirm, type {{quote}}delete{{quote}} in the field below{{colon}}', { quote: '"', colon: ':' })}
                    </p>
                    <Input
                        value={confirmationText}
                        onChange={handleConfirmationChange}
                        placeholder={i18n.t('Type {{quote}}delete{{quote}} to confirm', { quote: '"' })}
                        dataTest="confirmation-input"
                        disabled={isPending}
                    />
                </div>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={isPending}
                        dataTest="cancel-pruning-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        destructive
                        disabled={!isConfirmEnabled || isPending}
                        loading={isPending}
                        dataTest="confirm-pruning-button"
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
