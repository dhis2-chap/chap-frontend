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
import { useDeleteJob } from '../hooks/useDeleteJob';

type Props = {
    id: string;
    onClose: () => void;
    onDelete?: () => void;
};

export const DeleteJobModal = ({ id, onClose, onDelete }: Props) => {
    const { deleteJob, isLoading } = useDeleteJob({
        onSuccess: () => {
            onDelete?.();
            onClose();
        },
    });

    return (
        <Modal onClose={onClose} small>
            <ModalTitle>{i18n.t('Delete job')}</ModalTitle>
            <ModalContent>
                {i18n.t('Are you sure you want to delete this job? This action cannot be undone.')}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose} secondary disabled={isLoading}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        onClick={() => deleteJob(id)}
                        destructive
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
