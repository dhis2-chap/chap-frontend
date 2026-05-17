import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useDeletePredictionSetup } from './hooks/useDeletePredictionSetup';

type Props = {
    predictionSetupId: number;
    onClose: () => void;
};

export const DeletePredictionSetupModal = ({
    predictionSetupId,
    onClose,
}: Props) => {
    const {
        deletePredictionSetup,
        isDeleting,
    } = useDeletePredictionSetup({
        onSuccess: () => {
            onClose();
        },
    });

    return (
        <Modal
            onClose={onClose}
            small
            dataTest="delete-prediction-setup-modal"
        >
            <ModalTitle>
                {i18n.t('Delete prediction setup')}
            </ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t('This will permanently delete the setup, associated prediction runs, and associated data. This action cannot be undone.')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={isDeleting}
                        dataTest="cancel-delete-prediction-setup-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        destructive
                        loading={isDeleting}
                        disabled={isDeleting}
                        onClick={() => deletePredictionSetup(predictionSetupId)}
                        dataTest="submit-delete-prediction-setup-button"
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
