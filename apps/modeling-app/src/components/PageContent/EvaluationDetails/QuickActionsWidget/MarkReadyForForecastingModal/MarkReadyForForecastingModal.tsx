import {
    Button,
    ButtonStrip,
    InputField,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const markReadyForForecastingSchema = z.object({
    name: z.string()
        .trim()
        .min(1, { message: i18n.t('Name is required') }),
});

export type MarkReadyForForecastingFormValues = z.infer<typeof markReadyForForecastingSchema>;

type MarkReadyForForecastingModalProps = {
    onClose: () => void;
    onSubmit: (data: MarkReadyForForecastingFormValues) => void | Promise<void>;
    isSubmitting?: boolean;
};

export const MarkReadyForForecastingModal = ({
    onClose,
    onSubmit,
    isSubmitting = false,
}: MarkReadyForForecastingModalProps) => {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<MarkReadyForForecastingFormValues>({
        resolver: zodResolver(markReadyForForecastingSchema),
        shouldFocusError: false,
        defaultValues: {
            name: '',
        },
    });

    return (
        <Modal onClose={onClose} dataTest="mark-ready-for-forecasting-modal">
            <form onSubmit={handleSubmit(onSubmit)}>
                <ModalTitle>{i18n.t('Mark as ready for forecasting')}</ModalTitle>
                <ModalContent>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <InputField
                                {...field}
                                label={i18n.t('Configuration name')}
                                autoComplete="off"
                                error={!!errors.name}
                                validationText={errors.name?.message}
                                onChange={({ value }) => field.onChange(value)}
                                dataTest="ready-configuration-name-input"
                                required
                            />
                        )}
                    />
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
