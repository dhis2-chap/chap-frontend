import React from 'react';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useDeleteRoute } from '../hooks/useDeleteRoute';

interface Props {
    routeId: string;
    onClose: () => void;
}

export const DeleteRouteModal = ({ routeId, onClose }: Props) => {
    const { deleteRoute, isDeleting } = useDeleteRoute({
        id: routeId,
        onSuccess: () => {
            onClose();
        },
    });

    return (
        <Modal
            onClose={onClose}
            small
        >
            <ModalTitle>{i18n.t('Delete route')}</ModalTitle>

            <ModalContent>
                <p>{i18n.t('Are you sure you want to delete this route?')}</p>
            </ModalContent>

            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose} secondary>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        onClick={() => deleteRoute()}
                        destructive
                        loading={isDeleting}
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
