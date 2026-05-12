import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useDeletePredictionRun } from './hooks/useDeletePredictionRun';

type Props = {
    predictionId: number;
    predictionSetupId?: number;
    onClose: () => void;
};

export const DeletePredictionRunModal = ({
    predictionId,
    predictionSetupId,
    onClose,
}: Props) => {
    const {
        deletePredictionRun,
        isDeleting,
    } = useDeletePredictionRun({
        onSuccess: () => {
            onClose();
        },
    });

    return (
        <Modal
            onClose={onClose}
            small
            dataTest="delete-prediction-run-modal"
        >
            <ModalTitle>
                {i18n.t('Delete prediction run')}
            </ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t('This will permanently delete the prediction run from CHAP. It will not remove any values previously imported into DHIS2.')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={isDeleting}
                        dataTest="cancel-delete-prediction-run-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        destructive
                        loading={isDeleting}
                        disabled={isDeleting}
                        onClick={() => deletePredictionRun({
                            predictionId,
                            predictionSetupId,
                        })}
                        dataTest="submit-delete-prediction-run-button"
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
