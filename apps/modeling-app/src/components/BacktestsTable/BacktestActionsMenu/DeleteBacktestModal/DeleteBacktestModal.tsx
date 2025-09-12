import React from 'react';
import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useDeleteBacktest } from '../../hooks/useDeleteBacktest';

interface DeleteBacktestModalProps {
    id: number;
    onClose: () => void;
    // We might want to pass the name to display in the modal, though it's not used in the current message
    // name?: string | null | undefined;
}

export const DeleteBacktestModal = ({
    id,
    onClose,
}: DeleteBacktestModalProps) => {
    const {
        deleteBacktest,
        isLoading: deleteIsLoading,
    } = useDeleteBacktest({
        onSuccess: () => {
            onClose();
        },
    });

    return (
        <Modal
            onClose={onClose}
            dataTest="delete-backtest-modal"
        >
            <ModalTitle>
                {i18n.t('Delete evaluation')}
            </ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t('Are you sure you want to delete this evaluation? This action cannot be undone.')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary // Matching Edit modal's cancel button style
                        disabled={deleteIsLoading}
                        dataTest="cancel-delete-backtest-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={() => deleteBacktest(id)}
                        destructive
                        loading={deleteIsLoading}
                        disabled={deleteIsLoading}
                        dataTest="submit-delete-backtest-button"
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
