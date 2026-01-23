import { Modal, ModalTitle, ModalContent, ModalActions, ButtonStrip, Button } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useDeletePrediction } from '../../hooks/useDeletePrediction';

interface DeletePredictionModalProps {
    id: number;
    onClose: () => void;
}

export const DeletePredictionModal = ({ id, onClose }: DeletePredictionModalProps) => {
    const { deletePrediction, isPending: deleteIsPending } = useDeletePrediction({
        onSuccess: () => {
            onClose();
        },
    });

    return (
        <Modal onClose={onClose} dataTest="delete-prediction-modal">
            <ModalTitle>
                {i18n.t('Delete prediction')}
            </ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t('Are you sure you want to delete this prediction? This action cannot be undone.')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={deleteIsPending}
                        dataTest="cancel-delete-prediction-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={() => deletePrediction(id)}
                        destructive
                        loading={deleteIsPending}
                        disabled={deleteIsPending}
                        dataTest="submit-delete-prediction-button"
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
