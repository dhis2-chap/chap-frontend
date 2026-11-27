import {
    Button,
    ButtonStrip,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import {
    PredictionSetupFields,
    usePredictionSetupForm,
    type MarkReadyForForecastingFormValues,
} from './PredictionSetupFields';
import styles from './MarkReadyForForecastingModal.module.css';

export type { MarkReadyForForecastingFormValues };

type MarkReadyForForecastingModalProps = {
    onClose: () => void;
    onSubmit: (data: MarkReadyForForecastingFormValues) => void | Promise<void>;
    defaultValues?: Partial<MarkReadyForForecastingFormValues>;
    title?: string;
    isSubmitting?: boolean;
};

export const MarkReadyForForecastingModal = ({
    onClose,
    onSubmit,
    defaultValues,
    title = i18n.t('Create prediction setup'),
    isSubmitting = false,
}: MarkReadyForForecastingModalProps) => {
    const form = usePredictionSetupForm(defaultValues);

    return (
        <Modal onClose={onClose} dataTest="mark-ready-for-forecasting-modal" large>
            <form className={styles.form} onSubmit={form.handleSubmit(onSubmit)}>
                <ModalTitle>{title}</ModalTitle>
                <ModalContent className={styles.scrollableContent}>
                    <PredictionSetupFields form={form} />
                </ModalContent>
                <ModalActions>
                    <ButtonStrip>
                        <Button
                            onClick={onClose}
                            secondary
                            disabled={isSubmitting}
                            dataTest="cancel-mark-ready-for-forecasting-button"
                        >
                            {i18n.t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            primary
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            dataTest="submit-mark-ready-for-forecasting-button"
                        >
                            {i18n.t('Save')}
                        </Button>
                    </ButtonStrip>
                </ModalActions>
            </form>
        </Modal>
    );
};
