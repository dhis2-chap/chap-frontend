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
import { useDeleteModel } from '../hooks/useDeleteModel';

type Props = {
    id: number;
    onClose: () => void;
};

export const DeleteModelModal = ({
    id,
    onClose,
}: Props) => {
    const {
        deleteModel,
        isPending: deleteIsLoading,
    } = useDeleteModel({
        onSuccess: () => {
            onClose();
        },
    });

    return (
        <Modal
            onClose={onClose}
            dataTest="delete-model-modal"
        >
            <ModalTitle>
                {i18n.t('Are you sure you want to archive this model?')}
            </ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t('You will still be able to view evaluations for this model, but you will not be able to create new evaluations or predictions.')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={deleteIsLoading}
                        dataTest="cancel-delete-model-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={() => deleteModel(id)}
                        destructive
                        loading={deleteIsLoading}
                        disabled={deleteIsLoading}
                        dataTest="submit-delete-model-button"
                    >
                        {i18n.t('Archive')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
