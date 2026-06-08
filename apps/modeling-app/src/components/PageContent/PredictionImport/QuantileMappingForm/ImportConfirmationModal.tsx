import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';

type Props = {
    clearPreviousValues: boolean;
    isPending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export const ImportConfirmationModal = ({
    clearPreviousValues,
    isPending,
    onCancel,
    onConfirm,
}: Props) => {
    const importButtonLabel = clearPreviousValues
        ? i18n.t('Clear and import')
        : i18n.t('Import');
    const confirmationMessage = clearPreviousValues
        ? i18n.t('This will clear existing values for the selected output data elements, then import this prediction into DHIS2.')
        : i18n.t('This will import this prediction into DHIS2 without clearing existing values first.');

    return (
        <Modal onClose={onCancel} small>
            <ModalTitle>
                {clearPreviousValues ? i18n.t('Clear and import prediction') : i18n.t('Import prediction')}
            </ModalTitle>
            <ModalContent>
                <p>{confirmationMessage}</p>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onCancel} secondary disabled={isPending}>
                        {i18n.t('Cancel')}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        loading={isPending}
                        primary={!clearPreviousValues}
                        destructive={clearPreviousValues}
                    >
                        {importButtonLabel}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    );
};
