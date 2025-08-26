import React from 'react';
import {
    Button,
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useCancelJob } from '../hooks/useCancelJob';

type Props = {
    id: string;
    onClose: () => void;
    onCancel?: () => void;
};

export const CancelJobModal = ({ id, onClose, onCancel }: Props) => {
    const { cancelJob, isLoading } = useCancelJob({
        onSuccess: () => {
            onCancel?.();
            onClose();
        },
    });

    return (
        <Modal onClose={onClose} small>
            <ModalTitle>{i18n.t('Cancel job')}</ModalTitle>
            <ModalContent>
                {i18n.t('Are you sure you want to cancel this job? This action cannot be undone.')}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} secondary disabled={isLoading}>
                        {i18n.t('Close')}
                    </Button>
                    <Button
                        onClick={() => cancelJob(id)}
                        destructive
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        {i18n.t('Cancel job')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
}; 