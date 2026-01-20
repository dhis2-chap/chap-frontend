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
import { useDeleteModelTemplate } from '../../../../hooks/useDeleteModelTemplate';

type Props = {
    id: number;
    name: string;
    onClose: () => void;
};

export const DeleteModelTemplateModal = ({
    id,
    name,
    onClose,
}: Props) => {
    const {
        deleteModelTemplate,
        isPending: deleteIsLoading,
    } = useDeleteModelTemplate({
        onSuccess: () => {
            onClose();
        },
    });

    return (
        <Modal
            onClose={onClose}
            dataTest="delete-model-template-modal"
        >
            <ModalTitle>
                {i18n.t('Delete model template "{{name}}"?', { name })}
            </ModalTitle>
            <ModalContent>
                <p>
                    {i18n.t('Deleting this model template will also delete all configured models that use it. This action cannot be undone.')}
                </p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button
                        onClick={onClose}
                        secondary
                        disabled={deleteIsLoading}
                        dataTest="cancel-delete-model-template-button"
                    >
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        primary
                        onClick={() => deleteModelTemplate(id)}
                        destructive
                        loading={deleteIsLoading}
                        disabled={deleteIsLoading}
                        dataTest="submit-delete-model-template-button"
                    >
                        {i18n.t('Delete')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
