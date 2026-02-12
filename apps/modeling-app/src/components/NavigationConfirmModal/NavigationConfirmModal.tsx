import {
    Modal,
    ModalTitle,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';

type Props = {
    onConfirm: () => void;
    onCancel: () => void;
};

export const NavigationConfirmModal = ({
    onConfirm,
    onCancel,
}: Props) => (
    <Modal onClose={onCancel} small>
        <ModalTitle>{i18n.t('Unsaved changes')}</ModalTitle>
        <ModalContent>
            <p>
                {i18n.t('You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue?')}
            </p>
        </ModalContent>
        <ModalActions>
            <ButtonStrip>
                <Button onClick={onCancel} secondary>
                    {i18n.t('Cancel')}
                </Button>
                <Button onClick={onConfirm} destructive>
                    {i18n.t('Leave page')}
                </Button>
            </ButtonStrip>
        </ModalActions>
    </Modal>
);
